import 'reflect-metadata'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'
import sinonStubPromise from 'sinon-stub-promise'

import { mockReq, mockRes } from 'sinon-express-mock'
import { CkbUtils } from '../../component/formatter'
import { utils, Cell, HashType, Script } from '@ckb-lumos/base'
import BalanceService from '../../modules/balance/balance_service'
import BalanceController from '../../modules/balance/balance_controller'
import { contracts } from '../../config'
import { MockRepository, MockRepositoryFactory } from '../mock_repository_factory'
import { ckbCells, ckbOrderCells, ckbPendingCell, sudtCells, sudtOrderCells, sudtPendingCell } from './mock_data'

chai.use(sinonChai)
chai.should()

sinonStubPromise(sinon)

describe('Balance controller', () => {
  let req
  let res
  let next
  let controller
  let mock_repository: MockRepository

  const generateCell = (capacity: number, data: string, lock: Script, type: Script, txHash = '0x1') => {
    const cell: Cell = {
      cell_output: {
        capacity: `0x${capacity.toString(16)}`,
        lock: lock || {
          code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
          hash_type: 'type',
          args: '0x2946e43211d00ab3791ab1d8b598c99643c39649'
        }
      },
      out_point: {
        tx_hash: txHash,
        index: '0x0'
      },
      block_hash: '0xfda1e2e23f258cf92e3496a0c2c684db38e57d6f85467fdd2976f0e29cb8ef40',
      block_number: '0xf',
      data: data || '0x'
    }

    if (type) {
      cell.cell_output.type = type
    }

    return cell
  }

  const lock: Script = {
    code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
    hash_type: <HashType>'type',
    args: '0x2946e43211d00ab3791ab1d8b598c99643c39649'
  }
  const orderLock: Script = {
    code_hash: contracts.orderLock.codeHash,
    hash_type: contracts.orderLock.hashType,
    args: utils.computeScriptHash(lock)
  }
  const sudtType: Script = {
    code_hash: '0xc68fb287d8c04fd354f8332c3d81ca827deea2a92f12526e2f35be37968f6740',
    hash_type: 'type',
    args: '0xbe7e812b85b692515a21ea3d5aed0ad37dccb3fcd86e9b8d6a30ac24808db1f7'
  }

  const cellsWithNormalLock = [
    generateCell(30, null, lock, null),
    generateCell(10, null, lock, null),
    generateCell(40, '0x1111', lock, null),
    generateCell(20, null, lock, null),
    generateCell(1, CkbUtils.formatBigUInt128LE(BigInt(30)), lock, sudtType),
    generateCell(1, CkbUtils.formatBigUInt128LE(BigInt(10)), lock, sudtType),
    generateCell(1, CkbUtils.formatBigUInt128LE(BigInt(20)), lock, sudtType),
    generateCell(1, CkbUtils.formatBigUInt128LE(BigInt(20)), lock, sudtType)
  ]
  const cellsWithOrderLock = [
    generateCell(30, null, orderLock, null),
    generateCell(40, '0x1111', orderLock, null),
    generateCell(1, CkbUtils.formatOrderData(BigInt(20), 1, BigInt(1), BigInt(1), 0, true), orderLock, sudtType),
    generateCell(1, '0x121', orderLock, sudtType)
  ]

  const clone = (obj) => JSON.parse(JSON.stringify(obj))

  beforeEach(() => {
    mock_repository = MockRepositoryFactory.getDexRepositoryInstance()
    // mock_cells = sinon.stub(mock_repository, 'collectCells')
    const service = new BalanceService(mock_repository)
    controller = new BalanceController(service)

    req = mockReq()
    res = mockRes()
    next = sinon.spy()
  })

  describe('#getCKBBalance()', () => {
    describe('valid requests', () => {
      beforeEach(() => {
        req.query = {
          lock_code_hash: lock.code_hash,
          lock_hash_type: lock.hash_type,
          lock_args: lock.args
        }
      })
      describe('with mixed cells', () => {
        beforeEach(async () => {
          mock_repository.mockCollectCells()
            .withArgs({ lock })
            .resolves(cellsWithNormalLock)
            .withArgs({ lock: orderLock })
            .resolves(clone(cellsWithOrderLock))

          await controller.getCKBBalance(req, res, next)
        })
        it('returns balance', () => {
          res.status.should.have.been.calledWith(200)
          res.json.should.have.been.calledWith({
            free: '60',
            occupied: '44',
            locked_order: '72'
          })
        })
      })
      describe('with cells having non-empty data', () => {
        beforeEach(async () => {
          mock_repository.mockCollectCells()
            .withArgs({ lock })
            .resolves(clone([
              generateCell(10, null, lock, null),
              generateCell(40, '0x1111', lock, null)
            ]))
            .withArgs({ lock: orderLock })
            .resolves([])
          await controller.getCKBBalance(req, res, next)
        })
        it('returns balance excluding the amounts of cells having data', () => {
          res.status.should.have.been.calledWith(200)
          res.json.should.have.been.calledWith({
            free: '10',
            occupied: '40',
            locked_order: '0'
          })
        })
      })
      describe('with cells having type script', () => {
        beforeEach(async () => {
          mock_repository.mockCollectCells()
            .withArgs({ lock })
            .resolves(clone([
              generateCell(10, null, lock, null),
              generateCell(40, null, lock, sudtType)
            ]))
            .withArgs({ lock: orderLock })
            .resolves([])
          await controller.getCKBBalance(req, res, next)
        })
        it('returns balance excluding the amounts of cells having data', () => {
          res.status.should.have.been.calledWith(200)
          res.json.should.have.been.calledWith({
            free: '10',
            occupied: '40',
            locked_order: '0'
          })
        })
      })
      describe('with pending cells', () => {
        beforeEach(async () => {
          mock_repository.mockCollectCells()
            .withArgs({ lock })
            .resolves(ckbCells)
            .withArgs({ lock: orderLock })
            .resolves(ckbOrderCells)

          mock_repository.mockGetInputOutPointFromTheTxPool().resolves(ckbPendingCell)

          await controller.getCKBBalance(req, res, next)
        })
        it('returns balance', () => {
          res.status.should.have.been.calledWith(200)
          res.json.should.have.been.calledWith({ free: '5000000000', locked_order: '5000000000', occupied: '100000000' })
        })
      })
    })
    describe('invalid requests', () => {
      describe('with no lock script', () => {
        beforeEach(async () => {
          req.query = {}
          await controller.getCKBBalance(req, res, next)
        })
        it('returns 400', () => {
          res.status.should.have.been.calledWith(400)
          res.json.should.have.been.calledWith({ error: 'requires lock script to be specified as parameters' })
        })
      })
    })
  })

  describe('#getSUDTBalance()', () => {
    describe('valid requests', () => {
      beforeEach(async () => {
        req.query = {
          lock_code_hash: lock.code_hash,
          lock_hash_type: lock.hash_type,
          lock_args: lock.args,
          type_code_hash: sudtType.code_hash,
          type_hash_type: sudtType.hash_type,
          type_args: sudtType.args
        }
      })
      describe('get sudt balance', () => {
        beforeEach(async () => {
          mock_repository.mockCollectCells()
            .withArgs({
              lock,
              type: sudtType
            })
            .resolves(clone(cellsWithNormalLock))
            .withArgs({
              lock: orderLock,
              type: sudtType
            })
            .resolves(clone(cellsWithOrderLock))
          await controller.getSUDTBalance(req, res, next)
        })
        it('returns balance', () => {
          res.status.should.have.been.calledWith(200)
          res.json.should.have.been.calledWith({ free: '80', locked_order: '20' })
        })
      })
      describe('with pending cells', () => {
        beforeEach(async () => {
          mock_repository.mockCollectCells()
            .withArgs({
              lock,
              type: sudtType
            })
            .resolves(sudtCells)
            .withArgs({
              lock: orderLock,
              type: sudtType
            })
            .resolves(sudtOrderCells)

          mock_repository.mockGetInputOutPointFromTheTxPool().resolves(sudtPendingCell)

          await controller.getSUDTBalance(req, res, next)
        })
        it('returns balance', () => {
          res.status.should.have.been.calledWith(200)
          res.json.should.have.been.calledWith({ free: '200', locked_order: '250' })
        })
      })
    })
    describe('invalid requests', () => {
      describe('with no type script', () => {
        beforeEach(async () => {
          req.query = {
            lock_code_hash: lock.code_hash,
            lock_hash_type: lock.hash_type,
            lock_args: lock.args
          }
          await controller.getSUDTBalance(req, res, next)
        })
        it('returns 400', () => {
          res.status.should.have.been.calledWith(400)
          res.json.should.have.been.calledWith({ error: 'requires both lock and type scripts to be specified as parameters' })
        })
      })
      describe('with no lock script', () => {
        beforeEach(async () => {
          req.query = {
            type_code_hash: sudtType.code_hash,
            type_hash_type: sudtType.hash_type,
            type_args: sudtType.args
          }
          await controller.getSUDTBalance(req, res, next)
        })
        it('returns 400', () => {
          res.status.should.have.been.calledWith(400)
          res.json.should.have.been.calledWith({ error: 'requires both lock and type scripts to be specified as parameters' })
        })
      })
    })
  })
})
