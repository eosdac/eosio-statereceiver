const WebSocket = require('ws');
const Connection = require('../src/connection');
const logger = require('./logger');

jest.mock('ws');

describe('connection', () => {
  it('initialize connection object', () => {
    const connection = new Connection({ maxConnectionRetries: 99 });
    expect(connection).toEqual(
      expect.objectContaining({
        connected: false,
        connecting: false,
        connectionRetries: 0,
        maxConnectionRetries: 99,
        socketAddresses: [],
        socket_index: -1,
        ws: null,
      })
    );
  });

  it('return next endpoint', () => {
    const connection = new Connection({ socketAddresses: ['e1', 'e2'] });
    expect(connection.nextEndpoint()).toEqual('e1');
    expect(connection.nextEndpoint()).toEqual('e2');
    expect(connection.nextEndpoint()).toEqual('e1');
    expect(connection.nextEndpoint()).toEqual('e2');
  });

  describe('_onClose', () => {
    it('code is not 1000', () => {
      const onClose = jest.fn();
      const connection = new Connection({ socketAddresses: ['e1', 'e2'], onClose, logger });
      const spy_init = jest.spyOn(connection, 'init');
      const spy_reconnect = jest.spyOn(connection, 'reconnect').mockReturnValue();
      connection._onClose();

      expect(onClose).toHaveBeenCalled();
      expect(spy_init).toHaveBeenCalled();
      expect(spy_reconnect).toHaveBeenCalled();
    });

    it('code 1000', () => {
      const onClose = jest.fn();
      const connection = new Connection({ socketAddresses: ['e1', 'e2'], onClose });
      const spy_init = jest.spyOn(connection, 'init');
      const spy_reconnect = jest.spyOn(connection, 'reconnect').mockReturnValue();
      connection._onClose(1000);

      expect(onClose).toHaveBeenCalled();
      expect(spy_init).toHaveBeenCalled();
      expect(spy_reconnect).not.toHaveBeenCalled();
    });
  });

  describe('reconnect', () => {
    it('should reconnect', async () => {
      const connection = new Connection({ socketAddresses: ['e1', 'e2'], logger });
      const spy_connect = jest.spyOn(connection, 'connect').mockReturnValue();
      const spy_setTimeout = jest.spyOn(global, 'setTimeout').mockImplementation((cb) => cb());
      await connection.reconnect();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringMatching(/Retrying with delay of \d+ ms./)
      );
      expect(spy_setTimeout).toHaveBeenCalledWith(expect.any(Function), expect.any(Number));
      expect(spy_connect).toHaveBeenCalled();
    }, 10000);

    it('should exceeding max retry', async () => {
      const connection = new Connection({
        socketAddresses: ['e1', 'e2'],
        logger,
        maxConnectionRetries: 10,
      });
      connection.connectionRetries = 15;

      const spy_connect = jest.spyOn(connection, 'connect').mockReturnValue();

      await connection.reconnect();
      expect(logger.error).toHaveBeenCalledWith('Exceeded max reconnection attempts of 10.');
      expect(spy_connect).not.toHaveBeenCalledWith();
    });
  });

  describe('disconnect', () => {
    it('return if ws is null', () => {
      const connection = new Connection({ socketAddresses: ['e1', 'e2'], logger });
      connection.disconnect();

      expect(logger.info).not.toHaveBeenCalled();
    });
    it('disconnect current ws', () => {
      const ws = { close: jest.fn() };
      const connection = new Connection({ socketAddresses: ['e1', 'e2'], logger });
      connection.socket_index = 0;
      connection.ws = ws;
      connection.disconnect();

      expect(logger.info).toHaveBeenCalledWith('Closing websocket connection to e1.');
      expect(ws.close).toHaveBeenCalled();
      expect(connection.ws).toEqual(null);
    });
    it('ignore error if can not close connection', () => {
      const ws = {
        close: jest.fn(() => {
          throw new Error('error');
        }),
      };
      const connection = new Connection({ socketAddresses: ['e1', 'e2'], logger });
      connection.socket_index = 0;
      connection.ws = ws;
      connection.disconnect();

      expect(logger.info).toHaveBeenCalledWith('Closing websocket connection to e1.');
      expect(ws.close).toHaveBeenCalled();
      expect(connection.ws).toEqual(null);
    });
  });

  it('connect', () => {
    const connection = new Connection({ socketAddresses: ['e1', 'e2'], logger });
    const spy_disconnect = jest.spyOn(connection, 'disconnect').mockReturnValue();
    connection.connect();
    expect(spy_disconnect).toHaveBeenCalled();
    expect(WebSocket).toHaveBeenCalledWith('e1', { perMessageDeflate: false });
    expect(WebSocket.mock.instances[0].on).toHaveBeenCalledWith('open', expect.any(Function));
    expect(WebSocket.mock.instances[0].on).toHaveBeenCalledWith('message', expect.any(Function));
    expect(WebSocket.mock.instances[0].on).toHaveBeenCalledWith('close', expect.any(Function));
    expect(WebSocket.mock.instances[0].on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('_onConnect', () => {
    const connection = new Connection({ socketAddresses: ['e1', 'e2'], logger });

    expect(connection).toEqual(
      expect.objectContaining({
        connected: false,
        connecting: false,
        connectionRetries: 0,
        maxConnectionRetries: 100,
        socketAddresses: ['e1', 'e2'],
        socket_index: -1,
        ws: null,
      })
    );

    connection._onConnect();

    expect(connection).toEqual(
      expect.objectContaining({
        connected: true,
        connecting: false,
        connectionRetries: 0,
        maxConnectionRetries: 100,
        socketAddresses: ['e1', 'e2'],
        socket_index: -1,
        ws: null,
      })
    );
  });
});
