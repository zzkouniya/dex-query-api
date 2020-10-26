const indexer = require('../indexer');
const formatter = require('../commons/formatter');

class Controller {
  async getLiveCells(req, res) {
    const {
      type_code_hash,
      type_hash_type,
      type_args,
      lock_code_hash,
      lock_hash_type,
      lock_args,
      amount,
    } = req.query;

    const queryOptions = {};
    if (type_code_hash) {
      queryOptions.type = {
        code_hash: type_code_hash,
        hash_type: type_hash_type,
        args: type_args,
      };
    }

    if (lock_code_hash) {
      queryOptions.lock = {
        code_hash: lock_code_hash,
        hash_type: lock_hash_type,
        args: lock_args,
      };
    }

    try {
      let cells = await indexer.collectCells(queryOptions);
      if (amount) {
        if (queryOptions.type) {
          cells = collectCellsBySudtAmount(cells, amount);
        } else {
          cells = collectCellsByCKBAmount(cells, amount);
        }
      }

      if (!cells.length) {
        return res.status(404).json({ error: 'insufficient balance' });
      }
      res.status(200).json(cells);
    } catch (err) {
      console.error(err);
      res.status(500).send();
    }
  }
}

const collectCellsBySudtAmount = (cells, amount) => {
  cells.sort((a, b) => {
    const aSudtAmount = formatter.readBigUInt128LE(a.data);
    const bSudtAmount = formatter.readBigUInt128LE(b.data);

    // eslint-disable-next-line no-nested-ternary
    return (aSudtAmount < bSudtAmount) ? -1 : ((aSudtAmount > bSudtAmount) ? 1 : 0);
  });

  const collectedCells = [];
  let summedAmount = BigInt(0);
  for (const cell of cells) {
    summedAmount += formatter.readBigUInt128LE(cell.data);
    collectedCells.push(cell);

    if (summedAmount > BigInt(amount)) {
      break;
    }
  }

  if (summedAmount < amount) {
    return [];
  }

  return collectedCells;
};

const collectCellsByCKBAmount = (cells, amount) => {
  const filtered = cells.filter((cell) => cell.data === '0x');

  filtered.sort((a, b) => {
    const aAmount = BigInt(a.cell_output.capacity);
    const bAmount = BigInt(b.cell_output.capacity);

    // eslint-disable-next-line no-nested-ternary
    return (aAmount < bAmount) ? -1 : ((aAmount > bAmount) ? 1 : 0);
  });

  const collectedCells = [];
  let summedAmount = BigInt(0);
  for (const cell of filtered) {
    summedAmount += BigInt(cell.cell_output.capacity);
    collectedCells.push(cell);

    if (summedAmount > BigInt(amount)) {
      break;
    }
  }

  if (summedAmount < amount) {
    return [];
  }

  return collectedCells;
};

module.exports = new Controller();
