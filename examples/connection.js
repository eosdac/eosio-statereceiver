const fs = require('fs');
const { Serialize } = require('eosjs');
const { StaticPool } = require('node-worker-threads-pool');
const Connection = require('../src/connection');
const serialize = require('../src/serialize');

let receivedAbi = false;
let abi = {};
let types = [];
let num_messages = 0;
let blockCountStatT0 = 0;

/** @type {StaticPool} */
let deserializer;

const max_messages_in_flight = 2;

const connection = new Connection({
  logger: {
    info: (...m) => console.info(...m),
    debug: (...m) => console.info(...m),
    error: (...m) => console.error(...m),
  },
  socketAddresses: [process.env.SOCKET_ADDRESS || 'ws://localhost:8080'],
  onError: (e) => {
    console.error(e);
  },
  onMessage: (data) => {
    if (!receivedAbi) {
      receivedAbi = true;
      abi = JSON.parse(data);
      types = Serialize.getTypesFromAbi(Serialize.createInitialTypes(), abi);
      fs.writeFileSync('logs/api.json', data);

      deserializer = new StaticPool({
        size: 4,
        task: '../src/deserializer-worker.js',
        workerData: {
          types,
        },
      });

      requestBlocks();
    } else {
      blockCountStatT0++;
      num_messages++;
      // ack(num_messages);

      deserializer.exec(['result', data]);

      fs.writeFileSync('logs/data.json', JSON.stringify(data));
    }
  },
});

function ack(num_messages) {
  send(['get_blocks_ack_request_v0', { num_messages }]);
  num_messages = 0;
}

function requestBlocks() {
  const currentArgs = {
    start_block_num: 40938910,
    end_block_num: 0xffffffff,
    max_messages_in_flight,
    have_positions: [],
    irreversible_only: true,
    fetch_block: true,
    fetch_traces: true,
    fetch_deltas: false,
  };

  send(['get_blocks_request_v0', currentArgs]);
}

function send(request) {
  if (connection.ws) {
    connection.ws.send(serialize(types, 'request', request));
  }
}

connection.connect();

const intervalInSecond = 1;
const maxCycle = 1;
let cycle = 0;

const interval = setInterval(() => {
  console.log(`Receibe block: ${blockCountStatT0 / intervalInSecond} B/s`);
  blockCountStatT0 = 0;

  cycle++;
  if (cycle >= maxCycle) {
    connection.disconnect();
    if (deserializer) {
      deserializer.destroy();
    }
    clearInterval(interval);
  }
}, intervalInSecond * 1000);
