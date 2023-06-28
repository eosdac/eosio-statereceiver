const { Api: EosApi, JsonRpc } = require('eosjs');
const fetch = require('node-fetch');
const { TextDecoder, TextEncoder } = require('text-encoding');

/**
 * @type {EosApi}
 */
let eosApi;

/**
 *
 * @param {string} eosEndpoint - endpoint of eos history node
 * @returns {EosApi}
 */
module.exports = function createEosApi(eosEndpoint) {
  if (!eosApi && eosEndpoint) {
    eosApi = new EosApi({
      rpc: new JsonRpc(eosEndpoint, { fetch }),
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder(),
    });
  }

  return eosApi;
};
