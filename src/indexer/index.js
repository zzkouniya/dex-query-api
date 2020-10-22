const { Indexer, CellCollector, TransactionCollector } = require('@ckb-lumos/indexer');

class IndexerWrapper {
    constructor() {
        this.indexer = new Indexer('http://127.0.0.1:8554', './indexer_data');
        this.indexer.startForever();

        setInterval(async () => {
            const {block_number} = await this.indexer.tip();
            console.log('tipped', parseInt(block_number, 16));
        }, 1000);
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