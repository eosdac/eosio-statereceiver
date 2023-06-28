const { Serialize } = require('eosjs');
const abi = require('./abi.json');
const jsonData = require('./block-data-40938911.json');
const jsonDataActionTraceV1 = require('./block-data-action_trace_v1.json');
const jsonDataActionTraceV1WithoutReturnValue = require('./action_trace_v1_without_return_values.json');
const deserializeDeep = require('../src/deserialize-deep');

const types = Serialize.getTypesFromAbi(Serialize.createInitialTypes(), abi);

describe('deserialize-deep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deserialize block with option to deserialize internal data', async () => {
    const data = Buffer.from(new Uint8Array(jsonData.data));
    const deserializeActions = jest
      .fn()
      .mockResolvedValueOnce([
        {
          data: {
            eth_address: '0x9431102412662753556901cd52b7b0cb856a37d6',
            transfer_hash: '9C673ADF29C0ECCB31DAAB8380333A5407FE8A0BE5C492A8960D08A2DC762C7C',
          },
        },
      ])
      .mockResolvedValueOnce([
        {
          data: {
            eth_address: '0x9431102412662753556901cd52b7b0cb856a37d6',
            transfer_hash: '53400B531EF36B2513211E494018C2FB109FBE81C33B5B73972EE584926A733D',
          },
        },
      ]);
    const eosApi = {
      deserializeActions,
    };

    const blockData = await deserializeDeep({
      eosApi,
      types,
      type: 'result',
      data,
      options: {
        deserializeTraces: true,
        actionSet: new Set(['bridge.wax::burn']),
      },
    });

    expect(deserializeActions).toHaveBeenCalledTimes(2);
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
        traces: [
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
                        act_digest:
                          '596C17D28AF98C89A01CB91A05D2B1641CF61562E91C518DB49A6585A9C5CAA2',
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
                      data: {
                        eth_address: '0x9431102412662753556901cd52b7b0cb856a37d6',
                        transfer_hash:
                          '9C673ADF29C0ECCB31DAAB8380333A5407FE8A0BE5C492A8960D08A2DC762C7C',
                      },
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
                        act_digest:
                          '4A58E5BCD064541685CCB06B8636273EB984CD8F69E40B9BA2D667DF7F73E235',
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
                      data: {
                        eth_address: '0x9431102412662753556901cd52b7b0cb856a37d6',
                        transfer_hash:
                          '53400B531EF36B2513211E494018C2FB109FBE81C33B5B73972EE584926A733D',
                      },
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
                        act_digest:
                          '90144B5E5FBC3C46E9E266F3F6121C7EBFEFC24824641852625159ADBAC9E67B',
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
        ],
      },
    ]);
  });

  it('deserialize block has action_trace_v1 with option to deserialize internal data', async () => {
    const data = Buffer.from(new Uint8Array(jsonDataActionTraceV1.data));
    const deserializeActions = jest.fn().mockResolvedValueOnce([
      {
        data: {},
      },
    ]);

    const getAbi = jest.fn().mockResolvedValueOnce({
      version: 'eosio::abi/1.2',
      types: [],
      structs: [
        {
          name: 'returnint',
          base: '',
          fields: [],
        },
        {
          name: 'returnstring',
          base: '',
          fields: [],
        },
        {
          name: 'returnstruct',
          base: '',
          fields: [],
        },
        {
          name: 'valuestruct',
          base: '',
          fields: [
            {
              name: 'value1',
              type: 'string',
            },
            {
              name: 'value2',
              type: 'uint16',
            },
          ],
        },
      ],
      actions: [
        {
          name: 'returnint',
          type: 'returnint',
          ricardian_contract: '',
        },
        {
          name: 'returnstring',
          type: 'returnstring',
          ricardian_contract: '',
        },
        {
          name: 'returnstruct',
          type: 'returnstruct',
          ricardian_contract: '',
        },
      ],
      tables: [],
      ricardian_clauses: [],
      error_messages: [],
      abi_extensions: [],
      variants: [],
      action_results: [
        {
          name: 'returnint',
          result_type: 'uint16',
        },
        {
          name: 'returnstring',
          result_type: 'string',
        },
        {
          name: 'returnstruct',
          result_type: 'valuestruct',
        },
      ],
      kv_tables: {},
    });
    const eosApi = {
      deserializeActions,
      getAbi,
    };

    const blockData = await deserializeDeep({
      eosApi,
      types,
      type: 'result',
      data,
      options: {
        deserializeTraces: true,
        actionSet: new Set(['returnvalue::returnstruct']),
      },
    });
    expect(deserializeActions).toHaveBeenCalledTimes(1);
    expect(blockData[1].traces[1][1].action_traces[0][0]).toBe('action_trace_v1');
    expect(blockData[1].traces[1][1].action_traces[0][1].return_value).toEqual({
      value1: 'test value1 value1',
      value2: 35594,
    });
  });

  it('should not deserialize action result value if can not get action results abi', async () => {
    const data = Buffer.from(new Uint8Array(jsonDataActionTraceV1.data));
    const deserializeActions = jest.fn().mockResolvedValueOnce([
      {
        data: {},
      },
    ]);

    const getAbi = jest.fn().mockResolvedValueOnce({
      version: 'eosio::abi/1.2',
      types: [],
      structs: [
        {
          name: 'returnint',
          base: '',
          fields: [],
        },
        {
          name: 'returnstring',
          base: '',
          fields: [],
        },
        {
          name: 'returnstruct',
          base: '',
          fields: [],
        },
        {
          name: 'valuestruct',
          base: '',
          fields: [
            {
              name: 'value1',
              type: 'string',
            },
            {
              name: 'value2',
              type: 'uint16',
            },
          ],
        },
      ],
      actions: [
        {
          name: 'returnint',
          type: 'returnint',
          ricardian_contract: '',
        },
        {
          name: 'returnstring',
          type: 'returnstring',
          ricardian_contract: '',
        },
        {
          name: 'returnstruct',
          type: 'returnstruct',
          ricardian_contract: '',
        },
      ],
      tables: [],
      ricardian_clauses: [],
      error_messages: [],
      abi_extensions: [],
      variants: [],
      kv_tables: {},
    });
    const eosApi = {
      deserializeActions,
      getAbi,
    };

    const blockData = await deserializeDeep({
      eosApi,
      types,
      type: 'result',
      data,
      options: {
        deserializeTraces: true,
        actionSet: new Set(['returnvalue::returnstruct']),
      },
    });
    expect(deserializeActions).toHaveBeenCalledTimes(1);
    expect(blockData[1].traces[1][1].action_traces[0][0]).toBe('action_trace_v1');
    expect(blockData[1].traces[1][1].action_traces[0][1].return_value).toEqual(null);
    expect(getAbi).toHaveBeenCalledTimes(1);
    expect(getAbi).toHaveBeenCalledWith('returnvalue');
  });

  it('should not deserialize action result value if it is empty Uint8Array', async () => {
    const data = Buffer.from(new Uint8Array(jsonDataActionTraceV1WithoutReturnValue.data));
    const deserializeActions = jest.fn().mockResolvedValue([
      {
        data: {},
      },
    ]);

    const getAbi = jest.fn();
    const eosApi = {
      deserializeActions,
      getAbi,
    };

    const blockData = await deserializeDeep({
      eosApi,
      types,
      type: 'result',
      data,
      options: {
        deserializeTraces: true,
        actionSet: new Set(['eosio.token::transfer']),
      },
    });
    expect(deserializeActions).toHaveBeenCalledTimes(3);
    expect(blockData[1].traces[1][1].action_traces[0][0]).toBe('action_trace_v1');
    expect(blockData[1].traces[1][1].action_traces[0][1].return_value.length).toBe(0);
    expect(getAbi).toHaveBeenCalledTimes(0);
  });

  it('handle case where this_block is null (reached HEAD)', async () => {
    const deserializeActions = jest.fn();
    const eosApi = {
      deserializeActions,
    };

    const data = Buffer.from([
      1, 167, 251, 148, 2, 2, 148, 251, 167, 148, 188, 11, 194, 167, 149, 180, 235, 9, 152, 225, 83,
      94, 9, 249, 232, 125, 62, 222, 155, 215, 192, 134, 211, 73, 116, 189, 190, 165, 251, 148, 2,
      2, 148, 251, 165, 159, 182, 108, 209, 105, 143, 67, 174, 252, 212, 204, 99, 10, 59, 37, 111,
      166, 109, 62, 155, 229, 151, 79, 160, 159, 108, 154, 138, 0, 0, 0, 0, 0,
    ]);

    const blockData = await deserializeDeep({
      eosApi,
      types,
      type: 'result',
      data,
      options: {
        deserializeTraces: true,
        actionSet: new Set(['bridge.wax::burn']),
      },
    });

    expect(blockData).toEqual([
      'get_blocks_result_v0',
      {
        block: null,
        deltas: null,
        head: {
          block_id: '0294FBA794BC0BC2A795B4EB0998E1535E09F9E87D3EDE9BD7C086D34974BDBE',
          block_num: 43318183,
        },
        last_irreversible: {
          block_id: '0294FBA59FB66CD1698F43AEFCD4CC630A3B256FA66D3E9BE5974FA09F6C9A8A',
          block_num: 43318181,
        },
        prev_block: null,
        this_block: null,
        traces: null,
      },
    ]);
  });
});
