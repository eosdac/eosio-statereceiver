const { deserialize, deserializeActionResult } = require('./deserialize');

/**
 * @typedef {import('eosjs').Api} EosApi
 */

/**
 *
 * @param {Object} config - deserializer worker configuration
 * @param {EosApi} config.eosApi
 * @param {*} config.types
 * @param {string} config.type
 * @param {*} config.data
 * @param {Object} config.options
 * @param {boolean} config.options.deserializeTraces
 * @param {Set<string>} config.options.actionSet
 * @returns
 */
module.exports = async function deserializeDeep({ eosApi, types, type, data, options }) {
  const { deserializeTraces, actionSet } = options || {};

  // deserialize message data
  const result = deserialize(types, type, data);

  /* We currently work on this version 'get_blocks_result_v0' only */
  if (result[0] === 'get_blocks_result_v0') {
    const deserializedData = result[1];

    if (deserializedData.this_block) {
      if (deserializeTraces) {
        deserializedData.traces = deserialize(
          types,
          'transaction_trace[]',
          deserializedData.traces
        );

        if (actionSet && actionSet.size) {
          for (const [traceVerion, traceData] of deserializedData.traces) {
            /* We currently work on this version 'transaction_trace_v0' only */
            if (traceVerion === 'transaction_trace_v0') {
              const action_traces = traceData.action_traces;

              if (action_traces && action_traces.length) {
                for (const [actionTraceVersion, actionTraceData] of action_traces) {
                  if (
                    actionTraceVersion === 'action_trace_v0' ||
                    actionTraceVersion === 'action_trace_v1'
                  ) {
                    const key = `${actionTraceData.act.account}::${actionTraceData.act.name}`;

                    if (actionSet.has(key) && eosApi) {
                      const [act] = await eosApi.deserializeActions([actionTraceData.act]);
                      actionTraceData.act.data = act.data;

                      if (
                        actionTraceVersion === 'action_trace_v1' &&
                        actionTraceData.return_value
                      ) {
                        actionTraceData.return_value = deserializeActionResult(
                          await eosApi.getAbi(actionTraceData.act.account),
                          actionTraceData.act.name,
                          actionTraceData.return_value
                        );
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return result;
};
