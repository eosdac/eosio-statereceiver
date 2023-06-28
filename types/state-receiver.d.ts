export = StateReceiver;
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
declare class StateReceiver {
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
    constructor(config: {
        startBlock: number;
        endBlock: number;
        socketAddresses: string[];
        eosApi: EosApi;
        eosEndpoint: string;
        logger: object;
        onError: Function;
        maxQueueSize: number;
        maxMessagesInFlight: number;
        deserializerActions: string[];
    });
    /**
     * @type {Connection}
     */
    connection: Connection;
    /**
     * Pausing the ack to state node if queue is full
     * @type {boolean}
     */
    pauseAck: boolean;
    /**
     * @type {EosApi}
     */
    eosApi: EosApi;
    /**
     * @type {Array<Buffer>}
     */
    serializedMessageQueue: Array<Buffer>;
    /**
     * @type {Set<string>}
     */
    deserializerActionSet: Set<string>;
    logger: any;
    traceHandlers: any[];
    config: Readonly<{
        startBlock: number;
        endBlock: number;
        socketAddresses: string[];
        eosApi: EosApi;
        eosEndpoint: string;
        logger: object;
        onError: Function;
        maxQueueSize: number;
        maxMessagesInFlight: number;
        deserializerActions: string[];
    }>;
    startBlock: number;
    endBlock: string | number;
    current_block: number;
    types: Map<string, Serialize.Type>;
    init(): void;
    processingMessageData: boolean;
    /**
     * This needs to be reset so that the message handler know that
     * it is going to to get a first message as ABI
     */
    abi: any;
    start(): void;
    restart(startBlock: any, endBlock: any): void;
    stop(): void;
    /**
     * Register Trace Handler
     * @param {TraceHandler} h
     */
    registerTraceHandler(h: TraceHandler): void;
    onMessage(data: any): void;
    receivedAbi(data: any): void;
    requestBlocks(): void;
    requestStatus(): void;
    sendAck(num_messages: any): void;
    send(request: any): void;
    /**
     *
     * @param {Array<Buffer>} serializedMessageQueue
     * @returns {Promise<void>}
     */
    processMessageData(serializedMessageQueue: Array<Buffer>): Promise<void>;
    status(): {
        start: number;
        end: string | number;
        current: number;
        serializedMessageQueueSize: number;
        pauseAck: boolean;
    };
    deliverDeserializedBlock(blockData: any): Promise<void>;
    _onError(e: any): void;
}
declare namespace StateReceiver {
    export { EosApi, ProcessTrace, TraceHandler };
}
import Connection = require("./connection");
type EosApi = import('eosjs').Api;
import { Serialize } from "eosjs";
type TraceHandler = {
    /**
     * interest in contract name
     */
    contractName: string;
    /**
     * interest in action name
     */
    actionName: string;
    /**
     * handler function
     */
    processTrace: ProcessTrace;
};
type ProcessTrace = (block_num: number, traces: Array<any>) => Promise<void>;
//# sourceMappingURL=state-receiver.d.ts.map