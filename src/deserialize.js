const { Serialize } = require('eosjs');
const { TextDecoder, TextEncoder } = require('text-encoding');

function deserialize(types, type, array) {
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
}

function deserializeActionResult(abi, actionName, array) {
  if (!abi.action_results) {
    return null;
  }
  const types = Serialize.getTypesFromAbi(Serialize.createInitialTypes(), abi);
  for (const { name, result_type } of abi.action_results) {
    if (name === actionName) {
      const buffer = new Serialize.SerialBuffer({
        textEncoder: new TextEncoder(),
        textDecoder: new TextDecoder(),
        array,
      });
      const type = Serialize.getType(types, result_type);
      return type.deserialize(buffer, new Serialize.SerializerState({ bytesAsUint8Array: true }));
    }
  }
  return null;
}

module.exports = { deserialize, deserializeActionResult };
