const { Serialize } = require('eosjs');
const StateReceiver = require('../src/state-receiver');
const Connection = require('../src/connection');
const serialize = require('../src/serialize');
const deserializeDeep = require('../src/deserialize-deep');

jest.mock('eosjs');
jest.mock('../src/serialize');
jest.mock('../src/deserialize-deep');
jest.mock('../src/connection', () => {
  return jest.fn(function Connection() {
    this.ws = {
      send: jest.fn(),
    };
    this.connect = jest.fn();
  });
});

const logger = {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const defaultConfig = {
  logger,
  startBlock: 20284880,
  socketAddresses: ['ws://localhost:8080'],
  eosEndpoint: 'http://localhost:8888',
  deserializerActions: ['eosio.token::transfer', 'bridge.wax::reqnft'],
};

function createStateReceiver(config) {
  return new StateReceiver({
    ...defaultConfig,
    ...config,
  });
}

function createConnection() {
  return {
    ws: {
      send: jest.fn(),
    },
    connect: jest.fn(),
  };
}

describe('state receiver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sendAck', () => {
    const sr = createStateReceiver();
    sr.types = { abi: 'abi' };
    sr.connection = createConnection();
    serialize.mockReturnValue('serialized message');

    sr.sendAck(15);

    expect(serialize).toBeCalledWith(sr.types, 'request', [
      'get_blocks_ack_request_v0',
      { num_messages: 15 },
    ]);
    expect(sr.connection.ws.send).toBeCalledWith('serialized message');
  });

  it('requestStatus', () => {
    const sr = createStateReceiver();
    const spy_send = jest.spyOn(sr, 'send').mockReturnValue();

    sr.requestStatus();

    expect(spy_send).toBeCalledWith(['get_status_request_v0', {}]);
  });

  it('requestBlocks', () => {
    const sr = createStateReceiver();
    const spy_send = jest.spyOn(sr, 'send').mockReturnValue();

    sr.requestBlocks();

    expect(logger.info).toBeCalledWith(
      'Requesting blocks, Start : 20284880, End : 4294967295, Max Messages In Flight : 5'
    );
    expect(spy_send).toBeCalledWith([
      'get_blocks_request_v0',
      {
        end_block_num: 4294967295,
        fetch_block: false,
        fetch_deltas: false,
        fetch_traces: false,
        have_positions: [],
        irreversible_only: true,
        max_messages_in_flight: 5,
        start_block_num: 20284880,
      },
    ]);
  });

  it('receivedAbi', () => {
    const sr = createStateReceiver();
    const spy_requestBlocks = jest.spyOn(sr, 'requestBlocks').mockImplementation(() => {});

    const abi = '{ "abi": "json" }';
    sr.receivedAbi(abi);

    expect(logger.info).toBeCalledWith('Receiving abi...');
    expect(Serialize.getTypesFromAbi).toBeCalledWith(undefined, JSON.parse(abi));
    expect(spy_requestBlocks).toBeCalled();
  });

  it('status', () => {
    const sr = createStateReceiver();
    expect(sr.status()).toEqual({
      current: -1,
      end: '0xffffffff',
      pauseAck: false,
      serializedMessageQueueSize: 0,
      start: 20284880,
    });
  });

  it('restart', () => {
    const sr = createStateReceiver({
      startBlock: 10,
      endBlock: 100,
    });
    const spy_stop = jest.spyOn(sr, 'stop').mockReturnValue();
    const spy_start = jest.spyOn(sr, 'start').mockReturnValue();
    expect(sr.startBlock).toEqual(10);
    expect(sr.endBlock).toEqual(100);
    expect(sr.restart(15, 20)).toEqual(undefined);
    expect(sr.startBlock).toEqual(15);
    expect(sr.endBlock).toEqual(20);
    expect(spy_stop).toBeCalled();
    expect(spy_start).toBeCalled();
  });

  it('init', () => {
    const sr = createStateReceiver();
    sr.serializedMessageQueue = [1];
    sr.pauseAck = true;

    expect(sr).toEqual(
      expect.objectContaining({
        pauseAck: true,
        serializedMessageQueue: [1],
      })
    );
    expect(sr.init()).toBeUndefined();
    expect(sr).toEqual(
      expect.objectContaining({
        pauseAck: false,
        serializedMessageQueue: [],
      })
    );
  });

  describe('start', () => {
    it('connection is not null', () => {
      const sr = createStateReceiver();
      sr.abi = 'abc';
      sr.connection = createConnection();
      sr.start();
      expect(sr.abi).toBeNull();
      expect(sr.connection.connect).toBeCalled();
    });
    it('connection is null', () => {
      const sr = createStateReceiver();
      sr.start();
      expect(Connection).toBeCalledWith({
        logger,
        onClose: expect.any(Function),
        onError: expect.any(Function),
        onMessage: expect.any(Function),
        socketAddresses: ['ws://localhost:8080'],
      });
      expect(sr.connection.connect).toBeCalled();
    });
  });

  describe('stop', () => {
    it('connection is null', () => {
      const sr = createStateReceiver();
      const spy_init = jest.spyOn(sr, 'init').mockReturnValue();
      sr.stop();
      expect(spy_init).toBeCalled();
    });
    it('connection is not null', () => {
      const sr = createStateReceiver();
      const connection = {
        disconnect: jest.fn(),
      };
      sr.connection = connection;
      const spy_init = jest.spyOn(sr, 'init').mockReturnValue();

      sr.stop();

      expect(connection.disconnect).toBeCalled();
      expect(spy_init).toBeCalled();
    });
  });

  describe('processMessageData', () => {
    it('normal case', async () => {
      const serializedMessageQueue = ['msg1', 'msg2'];
      const sr = createStateReceiver({
        eosApi: { name: 'eos-api' },
      });
      const spy_deliverDeserializedBlock = jest
        .spyOn(sr, 'deliverDeserializedBlock')
        .mockResolvedValue();
      const spy_sendAck = jest.spyOn(sr, 'sendAck').mockResolvedValue();
      const actionSet = new Set(['eosio.token::transfer', 'bridge.wax::reqnft']);

      deserializeDeep.mockResolvedValueOnce(['a', 'b1']);
      deserializeDeep.mockResolvedValueOnce(['a', 'b2']);

      await sr.processMessageData(serializedMessageQueue);

      expect(deserializeDeep).toHaveBeenCalledTimes(2);
      expect(deserializeDeep).toHaveBeenNthCalledWith(1, {
        data: 'msg1',
        eosApi: { name: 'eos-api' },
        options: {
          actionSet,
          deserializeTraces: true,
        },
        type: 'result',
        types: null,
      });
      expect(deserializeDeep).toHaveBeenNthCalledWith(2, {
        data: 'msg2',
        eosApi: { name: 'eos-api' },
        options: {
          actionSet,
          deserializeTraces: true,
        },
        type: 'result',
        types: null,
      });

      expect(spy_deliverDeserializedBlock).toHaveBeenCalledTimes(2);
      expect(spy_deliverDeserializedBlock).toHaveBeenNthCalledWith(1, 'b1');
      expect(spy_deliverDeserializedBlock).toHaveBeenNthCalledWith(2, 'b2');

      expect(spy_sendAck).not.toBeCalled();
    });

    it('pauseAck is true 1', async () => {
      const serializedMessageQueue = ['msg1', 'msg2'];
      const sr = createStateReceiver({
        eosApi: { name: 'eos-api' },
      });
      jest.spyOn(sr, 'deliverDeserializedBlock').mockResolvedValue();
      const spy_sendAck = jest.spyOn(sr, 'sendAck').mockResolvedValue();

      sr.pauseAck = true;
      deserializeDeep.mockResolvedValue(['a', 'b1']);

      await sr.processMessageData(serializedMessageQueue);

      expect(spy_sendAck).toHaveBeenCalledTimes(1);
      expect(spy_sendAck).toBeCalledWith(1);
    });

    it('pauseAck is true 2', async () => {
      const serializedMessageQueue = ['msg1', 'msg2', 'msg3', 'msg4', 'msg5', 'msg6'];
      const sr = createStateReceiver({
        eosApi: { name: 'eos-api' },
      });
      jest.spyOn(sr, 'deliverDeserializedBlock').mockResolvedValue();
      const spy_sendAck = jest.spyOn(sr, 'sendAck').mockResolvedValue();

      sr.pauseAck = true;
      deserializeDeep.mockResolvedValue(['a', 'b1']);

      await sr.processMessageData(serializedMessageQueue);

      expect(spy_sendAck).toHaveBeenCalledTimes(1);
      expect(spy_sendAck).toBeCalledWith(1);
    });
  });

  describe('registerTraceHandler', () => {
    it('should register a handler', () => {
      const sr = createStateReceiver();
      const handler = {};
      expect(() => sr.registerTraceHandler(handler)).toThrow(
        `Handler is not valid: missing 'processTrace'.`
      );
    });
    it('should register a good handler 1', () => {
      const sr = createStateReceiver();
      const handler = {
        processTrace: jest.fn(),
        contractName: 'contract1',
        actionName: 'action1',
      };
      sr.registerTraceHandler(handler);
      expect(sr.traceHandlers).toEqual([handler]);
      expect(sr.deserializerActionSet.has('contract1::action1')).toEqual(true);
    });
    it('should register a good handler 2', () => {
      const sr = createStateReceiver();
      const handler = {
        processTrace: jest.fn(),
      };
      sr.registerTraceHandler(handler);
      expect(sr.traceHandlers).toEqual([handler]);
      expect(sr.deserializerActionSet.has('contract1::action1')).toEqual(false);
    });
  });

  describe('_onError', () => {
    it('config.onError is not function', () => {
      const sr = createStateReceiver();
      const error = new Error('test');
      expect(sr._onError(error)).toEqual(undefined);
      expect(logger.error).toBeCalledWith(error);
    });
    it('config.onError is function', () => {
      const onError = jest.fn();
      const sr = createStateReceiver({ onError });
      const error = new Error('test');
      expect(sr._onError(error)).toEqual(undefined);
      expect(logger.error).not.toBeCalled();
      expect(onError).toBeCalledWith(error);
    });
  });

  describe('deliverDeserializedBlock', () => {
    it('block data is null', async () => {
      const blockData = null;
      const sr = createStateReceiver();

      await sr.deliverDeserializedBlock(blockData);
      expect(logger.warn).toBeCalledWith('Block data is not valid.', blockData);
    });
    it('block data is not valid', async () => {
      const blockData = {};
      const sr = createStateReceiver();

      await sr.deliverDeserializedBlock(blockData);
      expect(logger.warn).toBeCalledWith('Block data is not valid.', blockData);
    });
    it('block data is valid', async () => {
      const blockData = {
        this_block: {
          block_num: 99,
        },
        traces: [
          {
            action_ordinal: 0,
          },
        ],
      };
      const sr = createStateReceiver();

      const processTrace = jest.fn();
      const processTrace2 = jest.fn();
      sr.registerTraceHandler({
        processTrace,
      });
      sr.registerTraceHandler({
        processTrace: processTrace2,
      });

      await sr.deliverDeserializedBlock(blockData);
      expect(logger.warn).not.toBeCalled();
      expect(processTrace).toBeCalledWith(sr.current_block, blockData.traces);
      expect(processTrace2).toBeCalledWith(sr.current_block, blockData.traces);
    });
  });

  describe('onMessage', () => {
    it('first call handle ABI', () => {
      const sr = createStateReceiver();
      const spy_receivedAbi = jest.spyOn(sr, 'receivedAbi').mockImplementation(() => {
        sr.abi = 'abc';
      });
      const spy_sendAck = jest.spyOn(sr, 'sendAck').mockImplementation(() => {});
      const spy_processMessageData = jest
        .spyOn(sr, 'processMessageData')
        .mockImplementation(() => {});

      const data = '{ "data": "data" }';
      sr.onMessage(data);

      expect(spy_receivedAbi).toBeCalledWith(data);
      expect(spy_sendAck).not.toBeCalledWith(1);
      expect(spy_processMessageData).not.toBeCalled();
    });
    it('second call handle serialized message', () => {
      const sr = createStateReceiver();
      sr.abi = 'abc';
      const spy_receivedAbi = jest.spyOn(sr, 'receivedAbi').mockImplementation(() => {});
      const spy_sendAck = jest.spyOn(sr, 'sendAck').mockImplementation(() => {});
      const spy_processMessageData = jest
        .spyOn(sr, 'processMessageData')
        .mockImplementation(() => {});

      const data = '{ "data": "data" }';

      sr.onMessage(data);

      expect(spy_receivedAbi).not.toBeCalled();
      expect(spy_sendAck).toBeCalledWith(1);
      expect(sr.serializedMessageQueue).toEqual([data]);
      expect(spy_processMessageData).toBeCalledWith(sr.serializedMessageQueue);
    });

    it('handle exception', () => {
      const onError = jest.fn();
      const sr = createStateReceiver({
        onError,
      });
      sr.abi = 'abc';

      const err = new Error('processMessageData-error');

      const spy_onError = jest.spyOn(sr, '_onError');
      const spy_receivedAbi = jest.spyOn(sr, 'receivedAbi').mockImplementation(() => {});
      const spy_sendAck = jest.spyOn(sr, 'sendAck').mockImplementation(() => {});
      const spy_processMessageData = jest.spyOn(sr, 'processMessageData').mockRejectedValue(err);

      const data = '{ "data": "data" }';

      sr.onMessage(data);

      expect(spy_receivedAbi).not.toBeCalled();
      expect(sr.serializedMessageQueue).toEqual([data]);
      expect(spy_processMessageData).toBeCalledWith(sr.serializedMessageQueue);
      expect(spy_sendAck).toBeCalledWith(1);
      // expect(onError).toBeCalledWith(err);
      // expect(spy_onError).toBeCalledWith(err);
    });
  });

  describe('send', () => {
    it('log debug if connection is not established', () => {
      const sr = createStateReceiver();
      sr.send('message');
      expect(serialize).not.toBeCalledWith('message');
      expect(logger.debug).toBeCalledWith('Connection is not ready, cannot send message.');
    });

    it('send serialized message', () => {
      const sr = createStateReceiver();
      sr.types = { abi: 'abi' };
      sr.connection = createConnection();
      serialize.mockReturnValue('serialized message');

      sr.send('message');

      expect(serialize).toBeCalledWith(sr.types, 'request', 'message');
      expect(sr.connection.ws.send).toBeCalledWith('serialized message');
      expect(logger.debug).not.toBeCalled();
    });
  });
});
