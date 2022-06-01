const { Serialize } = require('eosjs');
const { TextDecoder, TextEncoder } = require('text-encoding');

module.exports = function deserialize(types, type, array) {
  const buffer = new Serialize.SerialBuffer({
    textEncoder: new TextEncoder(),
    textDecoder: new TextDecoder(),
    array,
  });
  const result = Serialize.getType(types, type).deserialize(
    buffer,
    new Serialize.SerializerState({ bytesAsUint8Array: true })
  );

  if (buffer.readPos != array.length) {
    throw new Error(`Deserialization error: ${type}`);
  }

  return result;
};
