const WebSocket = require('ws');
const { Serialize } = require('eosjs');
const { TextDecoder, TextEncoder } = require('text-encoding');
const zlib = require('zlib');

class Connection {
    constructor({ socketAddresses, receivedAbi, receivedBlock  }) {
        this.receivedAbi = receivedAbi;
        this.receivedBlock = receivedBlock;
        this.socketAddresses = socketAddresses;

        this.abi = null;
        this.types = null;
        this.tables = new Map;
        this.blocksQueue = [];
        this.inProcessBlocks = false;
        this.socket_index = 0;
        this.currentArgs = null;

        this.ws = new WebSocket(socketAddresses[this.socket_index], { perMessageDeflate: false });
        this.ws.on('message', data => this.onMessage(data));
        this.ws.on('close', () => this.onClose());
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
        console.error(`Websocket disconnected from ${this.socketAddresses[this.socket_index]}`)
        this.ws.terminate();
        this.abi = null;
        this.types = null;
        this.tables = new Map;
        this.blocksQueue = [];
        this.inProcessBlocks = false;

        let next_index = ++this.socket_index;
        console.log(this.socketAddresses)

        if (next_index >= this.socketAddresses.length){
            next_index = 0;
        }
        console.log(`Connecting to ${this.socketAddresses[next_index]} in index ${next_index}`)
        this.ws = new WebSocket(this.socketAddresses[next_index], { perMessageDeflate: false });
        this.ws.on('message', data => this.onMessage(data));
        this.ws.on('close', () => this.onClose());

        this.socket_index = next_index
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
                traces = this.deserialize('transaction_trace[]', zlib.unzipSync(response.traces));
            if (this.currentArgs.fetch_deltas && response.deltas && response.deltas.length)
                deltas = this.deserialize('table_delta[]', zlib.unzipSync(response.deltas));
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