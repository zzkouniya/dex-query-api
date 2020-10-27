const indexer = require('../indexer');
const formatter = require('../commons/formatter');
const { isValidScript } = require('../commons/formatter');

class Controller {
  async getCKBBalance(req, res) {
    const {
      lock_code_hash,
      lock_hash_type,
      lock_args,
    } = req.query;

    const queryOptions = { type: 'empty' };

    if (!isValidScript(lock_code_hash, lock_hash_type, lock_args)) {
      return res.status(400).json({ error: 'requires lock script to be specified as parameters' });
    }

    queryOptions.lock = {
      code_hash: lock_code_hash,
      hash_type: lock_hash_type,
      args: lock_args,
    };

    try {
      const cells = await indexer.collectCells(queryOptions);
      const cellsWithoutData = cells.filter((cell) => cell.data === '0x');
      const balance = cellsWithoutData.reduce((total, cell) => total + BigInt(cell.cell_output.capacity), BigInt(0));
      res.status(200).json({ balance: balance.toString() });
    } catch (err) {
      console.error(err);
      res.status(500).send();
    }
  }

  async getSUDTBalance(req, res) {
    const {
      lock_code_hash,
      lock_hash_type,
      lock_args,
      type_code_hash,
      type_hash_type,
      type_args,
    } = req.query;

    if (!isValidScript(lock_code_hash, lock_hash_type, lock_args) || !isValidScript(type_code_hash, type_hash_type, type_args)) {
      return res.status(400).json({ error: 'requires both lock and type scripts to be specified as parameters' });
    }

    const queryOptions = {
      lock: {
        code_hash: lock_code_hash,
        hash_type: lock_hash_type,
        args: lock_args,
      },
      type: {
        code_hash: type_code_hash,
        hash_type: type_hash_type,
        args: type_args,
      },
    };

    try {
      const cells = await indexer.collectCells(queryOptions);
      const balance = cells.reduce((total, cell) => total + formatter.readBigUInt128LE(cell.data), BigInt(0));
      res.status(200).json({ balance: balance.toString() });
    } catch (err) {
      console.error(err);
      res.status(500).send();
    }
  }
}

module.exports = new Controller();
