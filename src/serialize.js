const { Serialize } = require('eosjs');
const { TextDecoder, TextEncoder } = require('text-encoding');

module.exports = function serialize(types, type, value) {
  const buffer = new Serialize.SerialBuffer({
    textEncoder: new TextEncoder(),
    textDecoder: new TextDecoder(),
  });

  Serialize.getType(types, type).serialize(buffer, value);

  return buffer.asUint8Array();
};
