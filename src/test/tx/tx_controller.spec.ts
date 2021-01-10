import 'reflect-metadata'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'
import sinonStubPromise from 'sinon-stub-promise'

import { mockReq, mockRes } from 'sinon-express-mock'
import { HashType } from '@ckb-lumos/base'
import TxService from '../../modules/tx/tx_service'
import TxController from '../../modules/tx/tx_controller'
import { MockRepository, MockRepositoryFactory } from '../mock_repository_factory'
import { ckbTx, preCkbTx, preSudtTx, sudtTx, sudtTxList } from './mock_data'
import CkbTransactionWithStatusModelWrapper from '../../model/ckb/ckb_transaction_with_status'

chai.use(sinonChai)
chai.should()

sinonStubPromise(sinon)

describe('Tx controller', () => {
  let req
  let res
  let next
  let controller
  let mock_repository: MockRepository

  const lock = {
    code_hash: '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63',
    hash_type: <HashType>'type',
    args: '0x988485609e16d5d5c62be0a4ae12b665fefcb448'
  }

  const sudtType = {
    code_hash: '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
    hash_type: 'type',
    args: '0x6fe3733cd9df22d05b8a70f7b505d0fb67fb58fb88693217135ff5079713e902'
  }

  beforeEach(() => {
    mock_repository = MockRepositoryFactory.getDexRepositoryInstance()
    const service = new TxService(mock_repository)
    controller = new TxController(service)

    req = mockReq()
    res = mockRes()
    next = sinon.spy()
  })

  describe('#getTransactions()', () => {
    describe('valid requests', () => {
      describe('get sudt transaction list', () => {
        beforeEach(async () => {
          req.query = {
            lock_code_hash: lock.code_hash,
            lock_hash_type: lock.hash_type,
            lock_args: lock.args,
            type_code_hash: sudtType.code_hash,
            type_hash_type: sudtType.hash_type,
            type_args: sudtType.args
          }

          mock_repository.mockGetblockNumberByBlockHash()
            .withArgs('block1')
            .resolves(1)

          mock_repository.mockCollectTransactions()
            .resolves([sudtTxList])
          mock_repository.mockGetTransactions()
            .resolves([new CkbTransactionWithStatusModelWrapper(preSudtTx)])

          await controller.getSudtTransactions(req, res, next)
        })
        it('returns transaction', () => {
          res.status.should.have.been.calledWith(200)
          res.json.should.have.been.calledWith([{ hash: 'hash1', income: '-4000000000', timestamp: '111' }])
        })
      })

      describe('lumos query when the transaction is empty', () => {
        beforeEach(async () => {
          req.query = {
            lock_code_hash: lock.code_hash,
            lock_hash_type: lock.hash_type,
            lock_args: lock.args,
            type_code_hash: sudtType.code_hash,
            type_hash_type: sudtType.hash_type,
            type_args: sudtType.args
          }

          mock_repository.mockCollectTransactions()
            .resolves([])

          await controller.getSudtTransactions(req, res, next)
        })
        it('returns transaction', () => {
          res.status.should.have.been.calledWith(200)
          res.json.should.have.been.calledWith([])
        })
      })
    })

    describe('invalid requests', () => {
      describe('with no lock script', () => {
        beforeEach(async () => {
          req.query = {
            lock_code_hash: lock.code_hash,
            lock_hash_type: lock.hash_type,
            lock_args: lock.args
          }
          await controller.getSudtTransactions(req, res, next)
        })
        it('returns 400', () => {
          res.status.should.have.been.calledWith(400)
          res.json.should.have.been.calledWith({ error: 'requires either lock and type script specified as parameters' })
        })
      })
      describe('with no type script', () => {
        beforeEach(async () => {
          req.query = {
            type_code_hash: sudtType.code_hash,
            type_hash_type: sudtType.hash_type,
            type_args: sudtType.args
          }
          await controller.getSudtTransactions(req, res, next)
        })
        it('returns 400', () => {
          res.status.should.have.been.calledWith(400)
          res.json.should.have.been.calledWith({ error: 'requires either lock and type script specified as parameters' })
        })
      })
    })
  })

  describe('#getTransactionsByTxHash()', () => {
    describe('invalid requests', () => {
      describe('with no lock script', () => {
        beforeEach(async () => {
          req.query = {}
          await controller.getTransactionsByTxHash(req, res, next)
        })
        it('returns 400', () => {
          res.status.should.have.been.calledWith(400)
          res.json.should.have.been.calledWith({ error: 'requires lock script to be specified as parameters' })
        })
      })
      describe('with no type script', () => {
        beforeEach(async () => {
          req.query = {
            lock_code_hash: lock.code_hash,
            lock_hash_type: lock.hash_type,
            lock_args: lock.args,
            type_code_hash: sudtType.code_hash,
            type_hash_type: sudtType.hash_type
          }
          await controller.getTransactionsByTxHash(req, res, next)
        })
        it('returns 400', () => {
          res.status.should.have.been.calledWith(400)
          res.json.should.have.been.calledWith({ error: 'requires type script to be specified as parameters' })
        })
      })
      describe('transaction does not exist', () => {
        beforeEach(async () => {
          req.query = {
            lock_code_hash: lock.code_hash,
            lock_hash_type: lock.hash_type,
            lock_args: lock.args,
            type_code_hash: sudtType.code_hash,
            type_hash_type: sudtType.hash_type,
            type_args: sudtType.args,
            tx_hash: 'hash0'
          }

          const mock = mock_repository.mockGetTransactionByHash()
          mock.resolves(undefined)
          await controller.getTransactionsByTxHash(req, res, next)
        })
        it('returns 400', () => {
          res.status.should.have.been.calledWith(400)
          res.json.should.have.been.calledWith({ error: 'The transaction does not exist!' })
        })
      })
    })

    describe('valid requests', () => {
      describe('get ckb transaction', () => {
        beforeEach(async () => {
          req.query = {
            lock_code_hash: lock.code_hash,
            lock_hash_type: lock.hash_type,
            lock_args: lock.args,
            tx_hash: 'hash1'
          }

          mock_repository.mockGetblockNumberByBlockHash()
            .withArgs('block1')
            .resolves(1)

          mock_repository.mockGetTransactionByHash()
            .withArgs('hash1')
            .resolves(new CkbTransactionWithStatusModelWrapper(ckbTx))
          mock_repository.mockGetTransactions()
            .resolves([new CkbTransactionWithStatusModelWrapper(preCkbTx)])

          await controller.getTransactionsByTxHash(req, res, next)
        })
        it('returns transaction', () => {
          res.status.should.have.been.calledWith(200)
          res.json.should.have.been.calledWith({
            status: 'committed',
            transaction_fee: '1',
            amount: '-201',
            to: '0x252dae0a4b9d9b80f504f6418acd2d364c0c59cd',
            from: '0x988485609e16d5d5c62be0a4ae12b665fefcb448',
            hash: 'hash1',
            block_no: 1
          })
        })
      })

      describe('get sudt transaction', () => {
        beforeEach(async () => {
          req.query = {
            lock_code_hash: lock.code_hash,
            lock_hash_type: lock.hash_type,
            lock_args: lock.args,
            type_code_hash: sudtType.code_hash,
            type_hash_type: sudtType.hash_type,
            type_args: sudtType.args,
            tx_hash: 'hash1'
          }

          mock_repository.mockGetblockNumberByBlockHash()
            .withArgs('block1')
            .resolves(1)

          mock_repository.mockGetTransactionByHash()
            .withArgs('hash1')
            .resolves(new CkbTransactionWithStatusModelWrapper(sudtTx))
          mock_repository.mockGetTransactions()
            .resolves([new CkbTransactionWithStatusModelWrapper(preSudtTx)])

          await controller.getTransactionsByTxHash(req, res, next)
        })
        it('returns transaction', () => {
          res.status.should.have.been.calledWith(200)
          res.json.should.have.been.calledWith({
            status: 'committed',
            transaction_fee: '5000',
            amount: '-4000000000',
            to: '0x252dae0a4b9d9b80f504f6418acd2d364c0c59cd',
            from: '0x988485609e16d5d5c62be0a4ae12b665fefcb448',
            hash: 'hash1',
            block_no: 1
          })
        })
      })
    })
  })
})
