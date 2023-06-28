const StateReceiver = require('../src/state-receiver');

const sr = new StateReceiver({
  logger: {
    info: (...m) => console.info(...m),
    debug: (...m) => console.debug(...m),
    warn: (...m) => console.warn(...m),
    error: (...m) => console.error(...m),
  },
  startBlock: 694,
  socketAddresses: [process.env.SOCKET_ADDRESS || 'ws://localhost:8080'],
  eosEndpoint: process.env.EOS_ENDPOINT || 'http://localhost:8888',
  deserializerActions: [
    'eosio.token::transfer',
    'bridge.wax::reqnft',
    'bridge.wax::reqwaxtoeth',
    'bridge.wax::nft2wax',
    'returnvalue::returnint',
    'returnvalue::returnstruct',
    'returnvalue::returnstring',
  ],
  maxQueueSize: 10,
});

let blockCount = 0;
let blockCountT0 = blockCount;
const statSecond = 2;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const statInterval = setInterval(() => {
  const num_messages = blockCount - blockCountT0;
  const status = sr.status();
  console.log(
    `Received ${num_messages / statSecond} B/s; Queue size: ${status.serializedMessageQueueSize}`
  );
  blockCountT0 = blockCount;
}, statSecond * 1000);

sr.registerTraceHandler({
  async processTrace(block_num, traces) {
    await sleep(1000);

    blockCount++;

    traces.forEach(([_traceVersion, traceData]) => {
      const action_traces = traceData.action_traces;
      action_traces.forEach(([_actionTraceVersion, actionTraceData]) => {
        const act = actionTraceData.act;
        const contractName = act.account;
        const actionName = act.name;

        if (contractName === 'eosio.token' && actionName === 'transfer') {
          console.log(
            `${block_num} ${contractName}::${actionName} ${act.data.from} -> ${act.data.to} ${act.data.quantity}`
          );
        } else if (contractName === 'bridge.wax' && actionName === 'reqwaxtoeth') {
          console.log(`${block_num} ${contractName}::${actionName} ${act.data}`);
        } else if (contractName === 'bridge.wax' && actionName === 'reqnft') {
          console.log(`${block_num} ${contractName}::${actionName} ${act.data}`);
        } else if (contractName === 'bridge.wax' && actionName === 'nft2wax') {
          console.log(`${block_num} ${contractName}::${actionName} ${act.data.to_account}`);
        } else if (contractName === 'returnvalue') {
          console.log(
            `${block_num} ${contractName}::${actionName} return value ${JSON.stringify(
              actionTraceData.return_value
            )}`
          );
        }
      });
    });
  },
});

sr.onError = (err) => {
  sr.stop();
  console.error(`State receiver stop due to ERROR:`, err);
};

sr.start();

setTimeout(() => {
  sr.stop();

  setTimeout(() => {
    sr.start();
  }, 5000);
}, 5000);
