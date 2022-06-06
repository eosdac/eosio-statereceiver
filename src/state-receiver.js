const { Serialize } = require('eosjs');
const Connection = require('./connection');
const createEosApi = require('./create-eos-api');
const serialize = require('./serialize');
const deserializeDeep = require('./deserialize-deep');

/**
 * @typedef {import('eosjs').Api} EosApi
 */

/**
 * @callback ProcessTrace
 * @param {number} block_num
 * @param {Array<*>} traces
 * @returns {Promise<void>}
 */

/**
 * @typedef {Object} TraceHandler
 * @property {string} contractName interest in contract name
 * @property {string} actionName interest in action name
 * @property {ProcessTrace} processTrace handler function
 */

class StateReceiver {
  /**
   * @type {Connection}
   */
  connection;

  /**
   * Pausing the ack to state node if queue is full
   * @type {boolean}
   */
  pauseAck;

  /**
   * @type {EosApi}
   */
  eosApi;

  /**
   * @type {Array<Buffer>}
   */
  serializedMessageQueue;

  /**
   * @type {Set<string>}
   */
  deserializerActionSet;

  /**
   * @param {Object} config - StateReceiver configuration
   * @param {number} config.startBlock - default 0,
   * @param {number} config.endBlock - default 0xffffffff
   * @param {string[]} config.socketAddresses - websoket endpoint (state history node)
   * @param {EosApi} config.eosApi - EosApi object. This is for deserializing action data. If it is not provided, it will be created.
   * @param {string} config.eosEndpoint - endpoint of eos history node. This is required for deserializing action data.
   * @param {object} config.logger - default is console
   * @param {function} config.onError - error handler
   * @param {number} config.maxQueueSize - max buffer message size, default 100
   * @param {number} config.maxMessagesInFlight - Number of message in flight when request block data from the state node - default 5
   * @param {string[]} config.deserializerActions - list of actions to be deserialized. Ex: ['eosio.token::transfer', 'bridge.wax::reqnft']
   */
  constructor(config) {
    this.logger = config.logger || console;

    this.traceHandlers = [];

    if (!config.maxQueueSize) {
      config.maxQueueSize = 100;
    }

    this.config = Object.freeze(config);

    this.deserializerActionSet = new Set(config.deserializerActions || []);
    this.startBlock = config.startBlock || 0;
    this.endBlock = config.endBlock || '0xffffffff';
    this.current_block = -1;
    this.types = null;
    this.init();

    if (!config.eosApi) {
      this.logger.info(`Creating eosApi with endpoint: ${config.eosEndpoint}`);
      this.eosApi = createEosApi(config.eosEndpoint);
    } else {
      this.eosApi = config.eosApi;
    }
  }

  init() {
    this.pauseAck = false;
    this.serializedMessageQueue = [];
    this.processingMessageData = false;
  }

  start() {
    /**
     * This needs to be reset so that the message handler know that
     * it is going to to get a first message as ABI
     */
    this.abi = null;

    if (!this.connection) {
      this.connection = new Connection({
        logger: this.logger,
        socketAddresses: Array.from(new Set(this.config.socketAddresses)),
        onError: (err) => this._onError(err),
        onMessage: this.onMessage.bind(this),
        onClose: () => {
          this.init();
        },
      });
    }

    this.connection.connect();
  }

  restart(startBlock, endBlock) {
    this.stop();

    this.startBlock = startBlock;
    this.endBlock = endBlock;

    this.start();
  }

  stop() {
    if (this.connection) {
      this.connection.disconnect();
      this.connection = null;
    }

    this.init();
  }

  /**
   * Register Trace Handler
   * @param {TraceHandler} h
   */
  registerTraceHandler(h) {
    if (!h || typeof h.processTrace !== 'function') {
      throw new Error(`Handler is not valid: missing 'processTrace'.`);
    }

    this.traceHandlers.push(h);
    if (h.contractName && h.actionName) {
      this.deserializerActionSet.add(`${h.contractName}::${h.actionName}`);
    }
  }

  onMessage(data) {
    try {
      if (!this.abi) {
        this.receivedAbi(data);
      } else {
        if (!this.pauseAck) {
          this.sendAck(1);
        }

        // queuing data
        this.serializedMessageQueue.push(data);

        if (this.serializedMessageQueue.length >= this.config.maxQueueSize) {
          this.pauseAck = true;
        }

        // Intentionally, not to block the receiving message from state node.
        // no "await" here.
        this.processMessageData(this.serializedMessageQueue).catch((err) => {
          this._onError(err);
        });
      }
    } catch (e) {
      this._onError(e);
    }
  }

  receivedAbi(data) {
    this.logger.info('Receiving abi...');
    this.abi = JSON.parse(data);
    this.types = Serialize.getTypesFromAbi(Serialize.createInitialTypes(), this.abi);

    // ready to request blocks
    this.requestBlocks();
  }

  requestBlocks() {
    this.current_block = 0;

    const args = {
      start_block_num: parseInt(this.startBlock),
      end_block_num: parseInt(this.endBlock),
      max_messages_in_flight: +this.config.maxMessagesInFlight || 5,
      have_positions: [],
      irreversible_only: true,
      fetch_block: false,
      fetch_traces: this.traceHandlers.length > 0,
      fetch_deltas: false,
    };

    this.logger.info(
      `Requesting blocks, Start : ${args.start_block_num}, End : ${args.end_block_num}, Max Messages In Flight : ${args.max_messages_in_flight}`
    );
    this.send(['get_blocks_request_v0', args]);
  }

  requestStatus() {
    this.send(['get_status_request_v0', {}]);
  }

  sendAck(num_messages) {
    this.send(['get_blocks_ack_request_v0', { num_messages }]);
  }

  send(request) {
    if (this.connection && this.connection.ws) {
      this.connection.ws.send(serialize(this.types, 'request', request));
    } else {
      this.logger.debug('Connection is not ready, cannot send message.');
    }
  }

  /**
   *
   * @param {Array<Buffer>} serializedMessageQueue
   * @returns {Promise<void>}
   */
  async processMessageData(serializedMessageQueue) {
    if (this.processingMessageData) {
      return;
    }
    this.processingMessageData = true;

    // this.logger.debug(`Processing message data...`);
    try {
      const deserializingOptions = {
        deserializeTraces: true,
        actionSet: this.deserializerActionSet,
      };

      while (serializedMessageQueue.length > 0) {
        const serializedMessage = serializedMessageQueue.shift();

        if (this.pauseAck && serializedMessageQueue.length < 5) {
          this.sendAck(1);
          this.pauseAck = false;
        }

        const blockData = await deserializeDeep({
          eosApi: this.eosApi,
          types: this.types,
          type: 'result',
          data: serializedMessage,
          options: deserializingOptions,
        });

        if (blockData[1] && blockData[1].this_block) {
          await this.deliverDeserializedBlock(blockData[1]);
        } else {
          this.logger.debug(`Reached the head of the chain: ${JSON.stringify(blockData)}`);
        }
      }

      if (this.pauseAck) {
        this.sendAck(1);
        this.pauseAck = false;
      }
    } catch (err) {
      this._onError(err);
    } finally {
      this.processingMessageData = false;
    }
    // this.logger.debug(`Processing message data stop.`);
  }

  status() {
    return {
      start: this.startBlock,
      end: this.endBlock,
      current: this.current_block,
      serializedMessageQueueSize: this.serializedMessageQueue.length,
      pauseAck: this.pauseAck,
    };
  }

  async deliverDeserializedBlock(blockData) {
    if (!blockData || !blockData.this_block) {
      this.logger.warn(`Block data is not valid.`, blockData);
      return;
    }

    const block_num = blockData.this_block.block_num;
    this.current_block = block_num;

    for (const handler of this.traceHandlers) {
      await handler.processTrace(block_num, blockData.traces);
    }
  }

  _onError(e) {
    if (typeof this.config.onError === 'function') {
      this.config.onError(e);
    } else {
      this.logger.error(e);
    }
  }
}

module.exports = StateReceiver;
