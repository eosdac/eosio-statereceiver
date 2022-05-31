const WebSocket = require('ws');

class Connection {
  connected = false;
  connecting = false;

  /**
   * @type {WebSocket}
   */
  ws = null;

  constructor({ logger, socketAddresses, maxConnectionRetries, onError, onMessage, onClose }) {
    this.logger = logger;

    this.onError = onError || (() => {});
    this.onMessage = onMessage || (() => {});
    this.onClose = onClose || (() => {});

    this.socket_index = -1;
    this.connectionRetries = 0;
    this.socketAddresses = socketAddresses || [];
    this.maxConnectionRetries = maxConnectionRetries || 100;
    this.init();
  }

  _onConnect() {
    this.connected = true;
    this.connecting = false;
    this.connectionRetries = 0;
  }

  init() {
    this.connected = false;
    this.connecting = false;
  }

  connect() {
    if (this.connected || this.connecting) {
      return;
    }
    this.connecting = true;

    const endpoint = this.nextEndpoint();
    this.logger.info(`Websocket connecting to: ${endpoint}`);

    this.disconnect();

    this.ws = new WebSocket(endpoint, { perMessageDeflate: false });
    this.ws.on('open', () => this._onConnect());
    this.ws.on('message', (data) => this.onMessage(data));
    this.ws.on('close', (e) => this._onClose(e));
    this.ws.on('error', (e) => this.onError(e));
  }

  disconnect() {
    if (this.ws == null) {
      return;
    }

    try {
      this.logger.info(
        `Closing websocket connection to ${this.socketAddresses[this.socket_index]}.`
      );
      this.ws.close();
    } catch (_e) {
      // safe to ignore error
    } finally {
      this.ws = null;
    }
  }

  async reconnect() {
    if (this.connectionRetries > this.maxConnectionRetries) {
      this.logger.error(`Exceeded max reconnection attempts of ${this.maxConnectionRetries}.`);
    } else {
      this.connectionRetries++;

      const timeout = Math.round(Math.pow(2, this.connectionRetries / 5) * 1000);
      this.logger.info(`Retrying with delay of ${timeout} ms.`);

      await new Promise((resolve) =>
        setTimeout(() => {
          this.connect();
          resolve();
        }, timeout)
      );
    }
  }

  nextEndpoint() {
    let next_index = ++this.socket_index;

    if (next_index >= this.socketAddresses.length) {
      next_index = 0;
    }
    this.socket_index = next_index;

    return this.socketAddresses[this.socket_index];
  }

  _onClose(code) {
    this.onClose();
    this.init();

    // 1000 = closed by me normally
    if (code !== 1000) {
      this.logger.error(
        `Websocket disconnected from ${this.socketAddresses[this.socket_index]} with code ${code}.`
      );

      this.reconnect();
    }
  }
} // Connection

module.exports = Connection;
