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

describe('Balance controller', () => {
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

  describe('#getCKBBalance()', () => {
    describe('valid requests', () => {
      describe('with only lock script', () => {
        beforeEach(async () => {
          req.query = {
            lock_code_hash: lock.code_hash,
            lock_hash_type: lock.hash_type,
            lock_args: lock.args,
          };
          indexer.collectCells.resolves(clone(cellsWithLock));
          await controller.getCKBBalance(req, res, next);
        });
        it('returns balance', () => {
          res.status.should.have.been.calledWith(200);
          res.json.should.have.been.calledWith({ balance: '60' });
        });
      });
    });
    describe('invalid requests', () => {
      describe('with no lock script', () => {
        beforeEach(async () => {
          req.query = {};
          indexer.collectCells.resolves(clone(cellsWithLock));
          await controller.getCKBBalance(req, res, next);
        });
        it('returns 400', () => {
          res.status.should.have.been.calledWith(400);
          res.json.should.have.been.calledWith({ error: 'requires lock script to be specified as parameters' });
        });
      });
    });
  });
  describe('#getSUDTBalance()', () => {
    describe('valid requests', () => {
      beforeEach(async () => {
        req.query = {
          lock_code_hash: lock.code_hash,
          lock_hash_type: lock.hash_type,
          lock_args: lock.args,
          type_code_hash: type.code_hash,
          type_hash_type: type.hash_type,
          type_args: type.args,
        };
        indexer.collectCells.resolves(clone(cellsWithBothLockType));
        await controller.getSUDTBalance(req, res, next);
      });
      it('returns balance', () => {
        res.status.should.have.been.calledWith(200);
        res.json.should.have.been.calledWith({ balance: '60' });
      });
    });
    describe('invalid requests', () => {
      describe('with no lock script', () => {
        beforeEach(async () => {
          req.query = {
            lock_code_hash: lock.code_hash,
            lock_hash_type: lock.hash_type,
            lock_args: lock.args,
          };
          indexer.collectCells.resolves(clone(cellsWithBothLockType));
          await controller.getSUDTBalance(req, res, next);
        });
        it('returns 400', () => {
          res.status.should.have.been.calledWith(400);
          res.json.should.have.been.calledWith({ error: 'requires both lock and type scripts to be specified as parameters' });
        });
      });
      describe('with no type script', () => {
        beforeEach(async () => {
          req.query = {
            type_code_hash: type.code_hash,
            type_hash_type: type.hash_type,
            type_args: type.args,
          };
          indexer.collectCells.resolves(clone(cellsWithBothLockType));
          await controller.getSUDTBalance(req, res, next);
        });
        it('returns 400', () => {
          res.status.should.have.been.calledWith(400);
          res.json.should.have.been.calledWith({ error: 'requires both lock and type scripts to be specified as parameters' });
        });
      });
    });
  });
});
