const chai = require('chai');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
chai.should();
const sinon = require('sinon');
const sinonStubPromise = require('sinon-stub-promise');

sinonStubPromise(sinon);
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
const { mockReq, mockRes } = require('sinon-express-mock');
const formatter = require('../commons/formatter');

describe('Cells controller', () => {
  let req;
  let res;
  let next;
  let controller;
  let indexer;

  const generateCell = (capacity, data, lock, type, txHash = '0x1') => {
    const cell = {
      cell_output: {
        capacity: `0x${capacity.toString(16)}`,
        lock: lock || {
          code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
          hash_type: 'data',
          args: '0x2946e43211d00ab3791ab1d8b598c99643c39649',
        },
      },
      out_point: {
        tx_hash: txHash,
        index: '0x0',
      },
      block_hash: '0xfda1e2e23f258cf92e3496a0c2c684db38e57d6f85467fdd2976f0e29cb8ef40',
      block_number: '0xf',
      data: data || '0x',
    };

    if (type) {
      cell.cell_output.type = type;
    }

    return cell;
  };

  const lock = {
    code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
    hash_type: 'data',
    args: '0x2946e43211d00ab3791ab1d8b598c99643c39649',
  };
  const type = {
    code_hash: '0xc68fb287d8c04fd354f8332c3d81ca827deea2a92f12526e2f35be37968f6740',
    hash_type: 'type',
    args: '0xbe7e812b85b692515a21ea3d5aed0ad37dccb3fcd86e9b8d6a30ac24808db1f7',
  };

  const cellsWithLock = [
    generateCell(30, null, lock),
    generateCell(10, null, lock),
    generateCell(20, null, lock),
  ];

  const cellsWithBothLockType = [
    generateCell('1', formatter.formatBigUInt128LE(BigInt(30)), lock, type),
    generateCell('1', formatter.formatBigUInt128LE(BigInt(10)), lock, type),
    generateCell('1', formatter.formatBigUInt128LE(BigInt(20)), lock, type),
  ];

  const clone = (obj) => JSON.parse(JSON.stringify(obj));

  beforeEach(() => {
    indexer = {
      collectCells: sinon.stub().returnsPromise(),
    };
    controller = proxyquire('./controller', {
      '../indexer': indexer,
    });
    req = mockReq();
    res = mockRes();
    next = sinon.spy();
  });

  describe('#getLiveCells()', () => {
    describe('valid requests', () => {
      describe('with only lock script', () => {
        beforeEach(async () => {
          req.query = {
            lock_code_hash: lock.code_hash,
            lock_hash_type: lock.hash_type,
            lock_args: lock.args,
          };
          indexer.collectCells.resolves(clone(cellsWithLock));
          await controller.getLiveCells(req, res, next);
        });
        it('returns cells', () => {
          res.status.should.have.been.calledWith(200);
          res.json.should.have.been.calledWith(cellsWithLock);
        });
      });
      describe('with only type script', () => {
        beforeEach(async () => {
          req.query = {
            type_code_hash: type.code_hash,
            type_hash_type: type.hash_type,
            type_args: type.args,
          };
          indexer.collectCells.resolves(clone(cellsWithLock));
          await controller.getLiveCells(req, res, next);
        });
        it('returns cells', () => {
          res.status.should.have.been.calledWith(200);
          res.json.should.have.been.calledWith(cellsWithLock);
        });
      });
      describe('with both lock and type scripts', () => {
        beforeEach(async () => {
          req.query = {
            type_code_hash: type.code_hash,
            type_hash_type: type.hash_type,
            type_args: type.args,
            lock_code_hash: lock.code_hash,
            lock_hash_type: lock.hash_type,
            lock_args: lock.args,
          };
          indexer.collectCells.resolves(clone(cellsWithLock));
          await controller.getLiveCells(req, res, next);
        });
        it('returns cells', () => {
          res.status.should.have.been.calledWith(200);
          res.json.should.have.been.calledWith(cellsWithLock);
        });
      });
    });
    describe('invalid requests', () => {
      describe('with neither lock nor type script', () => {
        beforeEach(async () => {
          req.query = {};
          indexer.collectCells.resolves(clone(cellsWithLock));
          await controller.getLiveCells(req, res, next);
        });
        it('returns cells', () => {
          res.status.should.have.been.calledWith(400);
          res.json.should.have.been.calledWith({ error: 'requires either lock or type script specified as parameters' });
        });
      });
    });
  });

  describe('#getLiveCellsForAmount()', () => {
    describe('with ckb_amount', () => {
      beforeEach(() => {
        req.query = {
          lock_code_hash: lock.code_hash,
          lock_hash_type: lock.hash_type,
          lock_args: lock.args,
        };
      });
      describe('with sufficient balance', () => {
        beforeEach(async () => {
          indexer.collectCells.resolves(clone(cellsWithLock));
          req.query.ckb_amount = '22';
          await controller.getLiveCellsForAmount(req, res, next);
        });
        it('type script indexer query option should be empty', () => {
          indexer.collectCells.should.have.been.calledWith({
            lock,
            type: 'empty',
          });
        });
        it('returns cells', () => {
          res.status.should.have.been.calledWith(200);
          res.json.should.have.been.calledWith([
            cellsWithLock[1],
            cellsWithLock[2],
          ]);
        });
      });
      describe('with could not find cells fulfilling the amount query', () => {
        beforeEach(async () => {
          indexer.collectCells.resolves(clone(cellsWithLock));
          req.query.ckb_amount = '100';
          await controller.getLiveCellsForAmount(req, res, next);
        });
        it('returns cells', () => {
          res.status.should.have.been.calledWith(404);
          res.json.should.have.been.calledWith({ error: 'could not find cells fulfilling the amount query' });
        });
      });
    });
    describe('with sudt_amount', () => {
      describe('valid requests', () => {
        beforeEach(() => {
          req.query = {
            lock_code_hash: lock.code_hash,
            lock_hash_type: lock.hash_type,
            lock_args: lock.args,
            type_code_hash: type.code_hash,
            type_hash_type: type.hash_type,
            type_args: type.args,
          };
        });
        describe('with sufficient balance', () => {
          beforeEach(async () => {
            indexer.collectCells.resolves(clone(cellsWithBothLockType));
            req.query.sudt_amount = '22';
            await controller.getLiveCellsForAmount(req, res, next);
          });
          it('returns cells', () => {
            res.status.should.have.been.calledWith(200);
            res.json.should.have.been.calledWith([
              cellsWithBothLockType[1],
              cellsWithBothLockType[2],
            ]);
          });
        });
        describe('with could not find cells fulfilling the amount query', () => {
          beforeEach(async () => {
            indexer.collectCells.resolves(clone(cellsWithBothLockType));
            req.query.sudt_amount = '100';
            await controller.getLiveCellsForAmount(req, res, next);
          });
          it('returns cells', () => {
            res.status.should.have.been.calledWith(404);
            res.json.should.have.been.calledWith({ error: 'could not find cells fulfilling the amount query' });
          });
        });
      });
      describe('invalid requests', () => {
        describe('when missing lock script', () => {
          beforeEach(async () => {
            req.query = {
              type_code_hash: type.code_hash,
              type_hash_type: type.hash_type,
              type_args: type.args,
              sudt_amount: '22',
            };
            await controller.getLiveCellsForAmount(req, res, next);
          });
          it('throws error', () => {
            res.status.should.have.been.calledWith(400);
            res.json.should.have.been.calledWith({ error: 'invalid lock script or type script' });
          });
        });
        describe('when missing lock script', () => {
          beforeEach(async () => {
            req.query = {
              lock_code_hash: lock.code_hash,
              lock_hash_type: lock.hash_type,
              lock_args: lock.args,
              sudt_amount: '22',
            };
            await controller.getLiveCellsForAmount(req, res, next);
          });
          it('throws error', () => {
            res.status.should.have.been.calledWith(400);
            res.json.should.have.been.calledWith({ error: 'invalid lock script or type script' });
          });
        });
      });
    });

    describe('failure cases', () => {
      describe('when both ckb_amount and sudt_amount query parameters are specified', () => {
        beforeEach(async () => {
          req.query.ckb_amount = '22';
          req.query.sudt_amount = '22';
          await controller.getLiveCellsForAmount(req, res, next);
        });
        it('throws error', async () => {
          res.status.should.have.been.calledWith(400);
          res.json.should.have.been.calledWith({ error: 'only support query either with ckb_amount or sudt_amount' });
        });
      });
      describe('when neither ckb_amount nor sudt_amount is specified', () => {
        beforeEach(async () => {
          await controller.getLiveCellsForAmount(req, res, next);
        });
        it('throws error', async () => {
          res.status.should.have.been.calledWith(400);
          res.json.should.have.been.calledWith({ error: 'requires either ckb_amount or sudt_amount' });
        });
      });
    });
  });
});
