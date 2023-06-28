export = Connection;
declare class Connection {
    constructor({ logger, socketAddresses, maxConnectionRetries, onError, onMessage, onClose }: {
        logger: any;
        socketAddresses: any;
        maxConnectionRetries: any;
        onError: any;
        onMessage: any;
        onClose: any;
    });
    connected: boolean;
    connecting: boolean;
    /**
     * @type {WebSocket}
     */
    ws: WebSocket;
    logger: any;
    onError: any;
    onMessage: any;
    onClose: any;
    socket_index: number;
    connectionRetries: number;
    socketAddresses: any;
    maxConnectionRetries: any;
    _onConnect(): void;
    init(): void;
    connect(): void;
    disconnect(): void;
    reconnect(): Promise<void>;
    nextEndpoint(): any;
    _onClose(code: any): void;
}
//# sourceMappingURL=connection.d.ts.map