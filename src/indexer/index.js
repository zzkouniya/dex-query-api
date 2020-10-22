const { Indexer, CellCollector, TransactionCollector } = require('@ckb-lumos/indexer');
const config = require('../config')

class IndexerWrapper {
    constructor() {
        this.indexer = new Indexer(config.indexer.nodeUrl, config.indexer.dataPath);
        this.indexer.startForever();

        setInterval(async () => {
            const {block_number} = await this.indexer.tip();
            console.log('indexer tip block', parseInt(block_number, 16));
        }, 5000);
    }

    async collectCells(queryOptons) {
        const cellCollector = new CellCollector(this.indexer, queryOptons);
        
        const cells = [];
        for await (const cell of cellCollector.collect()) 
            cells.push(cell);
        
        return cells;
    }

    async collectTransactions(queryOptions) {
        const transactionCollector = new TransactionCollector(this.indexer, queryOptions);
        
        const txs = [];
        for await (const tx of transactionCollector.collect()) 
            txs.push(tx);
        
        return txs;
    }
}

module.exports = new IndexerWrapper();