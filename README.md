# EOSIO state receiver

![example workflow](https://github.com/worldwide-asset-exchange/eosio-statereceiver/actions/workflows/coverage.yml/badge.svg)
[![codecov](https://codecov.io/gh/worldwide-asset-exchange/eosio-statereceiver/branch/master/graph/badge.svg?token=NROW4EZKDO)](https://codecov.io/gh/worldwide-asset-exchange/eosio-statereceiver)

```js
const StateReceiver = require('@waxio/eosio-statereceiver');

const sr = new StateReceiver({
  startBlock: 200,
  socketAddresses: [process.env.SOCKET_ADDRESS || 'ws://localhost:8080'],
  eosEndpoint: process.env.EOS_ENDPOINT || 'http://localhost:8888',
  deserializerActions: ['eosio.token::transfer'],
});

// sample trace handler
sr.registerTraceHandler({
  contractName: 'eosio.token',
  actionName: 'transfer',
  async processTrace(block_num, traces) {
    //
  },
});

sr.onError = (err) => {
  sr.stop();
  console.error(`State receiver stop due to ERROR:`, err);
};

sr.start();
```

Example can be found in [state-receiver.js](examples/state-receiver.js).

Running example:

```sh
export SOCKET_ADDRESS=http://localhost:8080
export EOS_ENDPOINT=http://localhost:8888

npm run dev
```

sample working log

```log
$ npm run dev

> @waxio/eosio-statereceiver@2.0.0 dev /home/ubuntu/eosio-statereceiver
> npm run state-receiver


> @waxio/eosio-statereceiver@2.0.0 state-receiver /home/ubuntu/eosio-statereceiver
> node ./examples/state-receiver.js

Creating eosApi with endpoint: http://state-node-host:8888
Websocket connecting to: http://state-node-host:8080
Receiving abi...
Requesting blocks, Start : 20284880, End : 4294967295, Max Messages In Flight : 5
20284884 bridge.wax::nft2wax hg.wam
20284890 bridge.wax::nft2wax hg.wam
Received 918 B/s; Queue size: 20
Received 946.5 B/s; Queue size: 39
25077 returnvalue::returnstruct return value {"value1":"test value1 value1","value2":35594}
25264 returnvalue::returnstring return value "test test action return string"
...
```
