const { utils } = require('@ckb-lumos/base');
const indexer = require('../indexer');
const formatter = require('../commons/formatter');
const { isValidScript } = require('../commons/formatter');
const { contracts } = require('../config');

class Controller {
  async getCKBBalance(req, res) {
    const {
      lock_code_hash,
      lock_hash_type,
      lock_args,
    } = req.query;

    if (!isValidScript(lock_code_hash, lock_hash_type, lock_args)) {
      return res.status(400).json({ error: 'requires lock script to be specified as parameters' });
    }

    try {
      const queryLock = {
        code_hash: lock_code_hash,
        hash_type: lock_hash_type,
        args: lock_args,
      };
      const cells = await indexer.collectCells({
        lock: queryLock,
      });
      const normalCells = cells.filter((cell) => cell.data === '0x' && !cell.type);
      const balance = normalCells.reduce((total, cell) => total + BigInt(cell.cell_output.capacity), BigInt(0));

      const occupiedCells = cells.filter((cell) => cell.data !== '0x' || cell.type);
      const occupiedBalance = occupiedCells.reduce((total, cell) => total + BigInt(cell.cell_output.capacity), BigInt(0));

      const queryLockHash = utils.computeScriptHash(queryLock);
      const orderLock = {
        code_hash: contracts.orderLock.codeHash,
        hash_type: contracts.orderLock.hashType,
        args: queryLockHash,
      };
      const orderCells = await indexer.collectCells({
        lock: orderLock,
      });

      const lockedOrderBalance = orderCells.reduce(
        (total, cell) => total + BigInt(cell.cell_output.capacity),
        BigInt(0),
      );

      res.status(200).json({
        free: balance.toString(),
        occupied: occupiedBalance.toString(),
        locked_order: lockedOrderBalance.toString(),
      });
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
