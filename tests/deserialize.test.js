const { Serialize } = require('eosjs');
const { deserialize } = require('../src/deserialize');
const abi = require('./abi.json');
const jsonData = require('./block-data-40938911.json');

const types = Serialize.getTypesFromAbi(Serialize.createInitialTypes(), abi);

describe('deserialize', () => {
  it('deserialize block', () => {
    const data = Buffer.from(new Uint8Array(jsonData.data));
    const blockData = deserialize(types, 'result', data);
    expect(blockData).toEqual([
      'get_blocks_result_v0',
      {
        block: expect.any(Uint8Array),
        deltas: null,
        head: {
          block_id: '027FA37A49FEDD8E18413942E5E12228545A997F22F0BD3A9D7EC02C045F08FC',
          block_num: 41919354,
        },
        last_irreversible: {
          block_id: '027FA3796DEC6035254696845D36B3A2937F33BF93CE62CF43893525620F0C7C',
          block_num: 41919353,
        },
        prev_block: {
          block_id: '0270AD9E7375537807926AD802E5D4B8859E90D3530ADB3A83350CF7603C0C39',
          block_num: 40938910,
        },
        this_block: {
          block_id: '0270AD9F0B95EF2AD70A8BF96EDBA2768C44FB1BBBBFFED9A782834725A2DBF0',
          block_num: 40938911,
        },
        traces: expect.any(Uint8Array),
      },
    ]);

    const [_type, response] = blockData;

    const block = deserialize(types, 'signed_block', response.block);
    expect(block).toEqual({
      action_mroot: '712F6D0099BA69D76BCA6C39AC92823032B903D182E4D029AC571250857881D2',
      block_extensions: [],
      confirmed: 0,
      header_extensions: [],
      new_producers: null,
      previous: '0270AD9E7375537807926AD802E5D4B8859E90D3530ADB3A83350CF7603C0C39',
      producer: 'eosio',
      producer_signature:
        'SIG_K1_K3SjpT7VFiaVzsJHptYUJSneXqYNoEtQvuXtdW8VDfuCDHw5dFKiqm5NnK13CqEtc27d3KCwnJBidEnsawEWSShtKbRDbD',
      schedule_version: 0,
      timestamp: '2022-05-23T16:05:42.000',
      transaction_mroot: 'A6DB5D59CA4428EA3E5D491BB4EEC501D2C35089E4E21432348F46AB8BB70308',
      transactions: [
        {
          cpu_usage_us: 252,
          net_usage_words: 21,
          status: 0,
          trx: [
            'packed_transaction',
            {
              compression: 0,
              packed_context_free_data: expect.any(Uint8Array),
              packed_trx: expect.any(Uint8Array),
              signatures: [
                'SIG_K1_JvCCX2rr8WJMSwjVoLdFvpSMfZAfpGAmNMaoDE1Fehdfu3Lj7RAiHEUga1mc3Ky3si1jA1AiDVU8M82qxhoNEY6u3cqAot',
              ],
            },
          ],
        },
        {
          cpu_usage_us: 355,
          net_usage_words: 21,
          status: 0,
          trx: [
            'packed_transaction',
            {
              compression: 0,
              packed_context_free_data: expect.any(Uint8Array),
              packed_trx: expect.any(Uint8Array),
              signatures: [
                'SIG_K1_KhWHkGwWqEkryVk6iJVVcLBmpptFgpvv6KBHiph2ND2RKL9WyHXb3d3Z3S1zqKLTr3F22Xt8TqygpRESLXSEiwBRvLpb2J',
              ],
            },
          ],
        },
      ],
    });

    const traces = deserialize(types, 'transaction_trace[]', response.traces);
    expect(traces).toEqual([
      [
        'transaction_trace_v0',
        {
          account_ram_delta: null,
          action_traces: [
            [
              'action_trace_v0',
              {
                account_ram_deltas: [],
                act: {
                  account: 'eosio',
                  authorization: [{ actor: 'eosio', permission: 'active' }],
                  data: expect.any(Uint8Array),
                  name: 'onblock',
                },
                action_ordinal: 1,
                console: '',
                context_free: false,
                creator_action_ordinal: 0,
                elapsed: '0',
                error_code: null,
                except: null,
                receipt: [
                  'action_receipt_v0',
                  {
                    abi_sequence: 1,
                    act_digest: '596C17D28AF98C89A01CB91A05D2B1641CF61562E91C518DB49A6585A9C5CAA2',
                    auth_sequence: [{ account: 'eosio', sequence: '41174141' }],
                    code_sequence: 1,
                    global_sequence: '46311667',
                    receiver: 'eosio',
                    recv_sequence: '40941168',
                  },
                ],
                receiver: 'eosio',
              },
            ],
          ],
          cpu_usage_us: 100,
          elapsed: '0',
          error_code: null,
          except: null,
          failed_dtrx_trace: null,
          id: 'D1681FD017B7452CBBEEAD2D9EFC1F7B8D2460AF5A733BA46329891E27EC968A',
          net_usage: '0',
          net_usage_words: 0,
          partial: [
            'partial_transaction_v0',
            {
              context_free_data: [],
              delay_sec: 0,
              expiration: '1970-01-01T00:00:00.000',
              max_cpu_usage_ms: 0,
              max_net_usage_words: 0,
              ref_block_num: 0,
              ref_block_prefix: 0,
              signatures: [],
              transaction_extensions: [],
            },
          ],
          scheduled: false,
          status: 0,
        },
      ],
      [
        'transaction_trace_v0',
        {
          account_ram_delta: null,
          action_traces: [
            [
              'action_trace_v0',
              {
                account_ram_deltas: [],
                act: {
                  account: 'bridge.wax',
                  authorization: [{ actor: 'bridge.wax', permission: 'oracle' }],
                  data: expect.any(Uint8Array),
                  name: 'burn',
                },
                action_ordinal: 1,
                console: '',
                context_free: false,
                creator_action_ordinal: 0,
                elapsed: '0',
                error_code: null,
                except: null,
                receipt: [
                  'action_receipt_v0',
                  {
                    abi_sequence: 17,
                    act_digest: '4A58E5BCD064541685CCB06B8636273EB984CD8F69E40B9BA2D667DF7F73E235',
                    auth_sequence: [{ account: 'bridge.wax', sequence: '3324' }],
                    code_sequence: 20,
                    global_sequence: '46311668',
                    receiver: 'bridge.wax',
                    recv_sequence: '2296',
                  },
                ],
                receiver: 'bridge.wax',
              },
            ],
          ],
          cpu_usage_us: 252,
          elapsed: '0',
          error_code: null,
          except: null,
          failed_dtrx_trace: null,
          id: 'B5A6108CEF2BF028C4F0A814C807FC3B5BA88A1FBBFCE59C64947236A45F6753',
          net_usage: '168',
          net_usage_words: 21,
          partial: [
            'partial_transaction_v0',
            {
              context_free_data: [],
              delay_sec: 0,
              expiration: '2022-05-23T16:06:10.000',
              max_cpu_usage_ms: 0,
              max_net_usage_words: 0,
              ref_block_num: 44443,
              ref_block_prefix: 4014875332,
              signatures: [
                'SIG_K1_JvCCX2rr8WJMSwjVoLdFvpSMfZAfpGAmNMaoDE1Fehdfu3Lj7RAiHEUga1mc3Ky3si1jA1AiDVU8M82qxhoNEY6u3cqAot',
              ],
              transaction_extensions: [],
            },
          ],
          scheduled: false,
          status: 0,
        },
      ],
      [
        'transaction_trace_v0',
        {
          account_ram_delta: null,
          action_traces: [
            [
              'action_trace_v0',
              {
                account_ram_deltas: [],
                act: {
                  account: 'bridge.wax',
                  authorization: [{ actor: 'bridge.wax', permission: 'oracle' }],
                  data: expect.any(Uint8Array),
                  name: 'burn',
                },
                action_ordinal: 1,
                console: '',
                context_free: false,
                creator_action_ordinal: 0,
                elapsed: '0',
                error_code: null,
                except: null,
                receipt: [
                  'action_receipt_v0',
                  {
                    abi_sequence: 17,
                    act_digest: '90144B5E5FBC3C46E9E266F3F6121C7EBFEFC24824641852625159ADBAC9E67B',
                    auth_sequence: [{ account: 'bridge.wax', sequence: '3325' }],
                    code_sequence: 20,
                    global_sequence: '46311669',
                    receiver: 'bridge.wax',
                    recv_sequence: '2297',
                  },
                ],
                receiver: 'bridge.wax',
              },
            ],
          ],
          cpu_usage_us: 355,
          elapsed: '0',
          error_code: null,
          except: null,
          failed_dtrx_trace: null,
          id: 'D3A4154B500E4DDB3DA47123B93ACA517096EE2E684559F47C2FE143B913C4F6',
          net_usage: '168',
          net_usage_words: 21,
          partial: [
            'partial_transaction_v0',
            {
              context_free_data: [],
              delay_sec: 0,
              expiration: '2022-05-23T16:06:10.000',
              max_cpu_usage_ms: 0,
              max_net_usage_words: 0,
              ref_block_num: 44443,
              ref_block_prefix: 4014875332,
              signatures: [
                'SIG_K1_KhWHkGwWqEkryVk6iJVVcLBmpptFgpvv6KBHiph2ND2RKL9WyHXb3d3Z3S1zqKLTr3F22Xt8TqygpRESLXSEiwBRvLpb2J',
              ],
              transaction_extensions: [],
            },
          ],
          scheduled: false,
          status: 0,
        },
      ],
    ]);
  });
});
