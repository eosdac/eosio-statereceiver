const WebSocket = require('ws');
const { Serialize } = require('eosjs');
const { TextDecoder, TextEncoder } = require('text-encoding');
const zlib = require('zlib');

class Connection {
    constructor({ socketAddresses, socketAddress, receivedAbi, receivedBlock  }) {
        this.receivedAbi = receivedAbi;
        this.receivedBlock = receivedBlock;
        this.socketAddresses = socketAddresses;
        if (typeof socketAddress == 'string'){
            this.socketAddresses = [socketAddress]
        }

        this.abi = null;
        this.types = null;
        this.tables = new Map;
        this.blocksQueue = [];
        this.inProcessBlocks = false;
        this.socket_index = 0;
        this.currentArgs = null;
        this.connected = false;
        this.connecting = false;
        this.connectionRetries = 0;
        this.maxConnectionRetries = 100;

        this.connect(this.socketAddresses[this.socket_index]);
    }

    connect(endpoint){
        if (!this.connected && !this.connecting){
            console.error(`Websocket connecting to ${endpoint}`);

            this.connecting = true;

            this.ws = new WebSocket(endpoint, { perMessageDeflate: false });
            this.ws.on('open', () => this.onConnect());
            this.ws.on('message', data => this.onMessage(data));
            this.ws.on('close', () => this.onClose());
            this.ws.on('error', () => {console.error(`Websocket error`)});
        }
    }

    reconnect(){
        if (this.connectionRetries > this.maxConnectionRetries){
            console.error(`Exceeded max reconnection attempts of ${this.maxConnectionRetries}`);
            return;
        }
        else {
            const endpoint = this.nextEndpoint();
            console.log(`Reconnecting to ${endpoint}...`);
            const timeout = Math.pow(2, this.connectionRetries/5) * 1000;
            console.log(`Retrying with delay of ${timeout / 1000}s`);
            setTimeout(() => {
                this.connect(endpoint);
            }, timeout);
            this.connectionRetries++;
        }
    }

    nextEndpoint(){
        let next_index = ++this.socket_index;

        if (next_index >= this.socketAddresses.length){
            next_index = 0;
        }
        this.socket_index = next_index;

        return this.socketAddresses[this.socket_index];
    }

    serialize(type, value) {
        const buffer = new Serialize.SerialBuffer({ textEncoder: new TextEncoder, textDecoder: new TextDecoder });
        Serialize.getType(this.types, type).serialize(buffer, value);
        return buffer.asUint8Array();
    }

    deserialize(type, array) {
        const buffer = new Serialize.SerialBuffer({ textEncoder: new TextEncoder, textDecoder: new TextDecoder, array });
        let result = Serialize.getType(this.types, type).deserialize(buffer, new Serialize.SerializerState({ bytesAsUint8Array: true }));
        if (buffer.readPos != array.length)
            throw new Error('oops: ' + type); // todo: remove check
        // {
        //     console.log(result.actions[0].authorization[0].actor);
        //     //console.log('oops: ' + type);
        // }
        return result;
    }

    toJsonUnpackTransaction(x) {
        return JSON.stringify(x, (k, v) => {
            if (k === 'trx' && Array.isArray(v) && v[0] === 'packed_transaction') {
                const pt = v[1];
                let packed_trx = pt.packed_trx;
                console.log(`Compression is ${pt.compression}`);
                if (pt.compression === 0)
                    packed_trx = this.deserialize('transaction', packed_trx);
                else if (pt.compression === 1)
                    packed_trx = this.deserialize('transaction', zlib.unzipSync(packed_trx));
                return { ...pt, packed_trx };
            }
            if (k === 'packed_trx' && v instanceof Uint8Array)
                return this.deserialize('transaction', v);
            if (v instanceof Uint8Array)
                return `(${v.length} bytes)`;
            return v;
        }, 4)
    }

    send(request) {
        this.ws.send(this.serialize('request', request));
    }

    onConnect(){
        this.connected = true;
        this.connecting = false;
        this.connectionRetries = 0;
    }

    onMessage(data) {
        try {
            if (!this.abi) {
                console.log('receiving abi')
                this.rawabi = data;
                this.abi = JSON.parse(data);
                this.types = Serialize.getTypesFromAbi(Serialize.createInitialTypes(), this.abi);
                for (const table of this.abi.tables)
                    this.tables.set(table.name, table.type);
                if (this.receivedAbi)
                    this.receivedAbi();
            } else {
                const [type, response] = this.deserialize('result', data);
                this[type](response);
            }
        } catch (e) {
            console.log(e);
            process.exit(1);
        }
    }

    onClose() {
        console.error(`Websocket disconnected from ${this.socketAddresses[this.socket_index]}`);
        this.ws.terminate();
        this.abi = null;
        this.types = null;
        this.tables = new Map;
        this.blocksQueue = [];
        this.inProcessBlocks = false;
        this.connected = false;
        this.connecting = false;

        this.reconnect();

    }

    onOpen(){
        this.requestBlocks(this.currentArgs)
    }

    requestStatus() {
        this.send(['get_status_request_v0', {}]);
    }

    requestBlocks(requestArgs) {
        if (!this.currentArgs){
            this.currentArgs = {
                start_block_num: 0,
                end_block_num: 0xffffffff,
                max_messages_in_flight: 5,
                have_positions: [],
                irreversible_only: false,
                fetch_block: false,
                fetch_traces: false,
                fetch_deltas: false,
                ...requestArgs
            };
        }
        this.send(['get_blocks_request_v0', this.currentArgs]);
    }

    get_status_result_v0(response) {
        console.log(response);
    }

    get_blocks_result_v0(response) {
        this.blocksQueue.push(response);
        this.processBlocks();
    }

    async processBlocks() {
        if (this.inProcessBlocks)
            return;
        this.inProcessBlocks = true;
        while (this.blocksQueue.length) {
            let response = this.blocksQueue.shift();
            if (response.this_block){
                let block_num = response.this_block.block_num;
                this.currentArgs.start_block_num = block_num - 50; // replay 25 seconds
            }
            this.send(['get_blocks_ack_request_v0', { num_messages: 1 }]);
            let block, traces = [], deltas = [];
            if (this.currentArgs.fetch_block && response.block && response.block.length)
                block = this.deserialize('signed_block', response.block);
            if (this.currentArgs.fetch_traces && response.traces && response.traces.length)
                traces = this.deserialize('transaction_trace[]', response.traces);
            if (this.currentArgs.fetch_deltas && response.deltas && response.deltas.length)
                deltas = this.deserialize('table_delta[]', response.deltas);
            await this.receivedBlock(response, block, traces, deltas);
        }
        this.inProcessBlocks = false;
    }

    forEachRow(delta, f) {
        const type = this.tables.get(delta.name);
        for (let row of delta.rows) {
            let data;
            try {
                data = this.deserialize(type, row.data);
            } catch (e) {
                console.error(e);
            }
            if (data)
                f(row.present, data[1]);
        }
    }

    dumpDelta(delta, extra) {
        this.forEachRow(delta, (present, data) => {
            console.log(this.toJsonUnpackTransaction({ ...extra, present, data }));
        });
    }
} // Connection


module.exports = {Connection}
