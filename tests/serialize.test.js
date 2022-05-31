const { Serialize } = require('eosjs');
const serialize = require('../src/serialize');
const abi = require('./abi.json');

const types = Serialize.getTypesFromAbi(Serialize.createInitialTypes(), abi);

describe('serialize', () => {
  it('serialize ack request', () => {
    const request = ['get_blocks_ack_request_v0', { num_messages: 1 }];
    const res = serialize(types, 'request', request);
    expect(res).toEqual(new Uint8Array([2, 1, 0, 0, 0]));
  });

  it('serialize block request', () => {
    const currentArgs = {
      start_block_num: 40938910,
      end_block_num: 0xffffffff,
      max_messages_in_flight: 10,
      have_positions: [],
      irreversible_only: true,
      fetch_block: true,
      fetch_traces: true,
      fetch_deltas: false,
    };

    const request = ['get_blocks_request_v0', currentArgs];
    const res = serialize(types, 'request', request);
    expect(res).toEqual(
      new Uint8Array([1, 158, 173, 112, 2, 255, 255, 255, 255, 10, 0, 0, 0, 0, 1, 1, 1, 0])
    );
  });
});
