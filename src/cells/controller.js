const indexer = require('../indexer');

class Controller {
  async getLiveCells(req, res) {
    const {
      type_code_hash,
      type_hash_type,
      type_args,
      lock_code_hash,
      lock_hash_type,
      lock_args,
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
      const cells = await indexer.collectCells(queryOptions);
      res.status(200).json(cells);
    } catch (err) {
      console.error(err);
      res.status(500).send();
    }
  }
}

module.exports = new Controller();
