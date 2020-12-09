import "reflect-metadata"
import chai from 'chai';
import sinonChai from "sinon-chai";

chai.use(sinonChai);
chai.should();
import sinon from "sinon";
import sinonStubPromise from "sinon-stub-promise";

sinonStubPromise(sinon);

import { mockReq, mockRes } from "sinon-express-mock";
import { HashType } from '@ckb-lumos/base';
import TxService from '../../modules/tx/tx_service';
import TxController from '../../modules/tx/tx_controller';
import { MockRepository, MockRepositoryFactory } from '../mock_repository_factory';
import { preTx, tx } from './mock_data';
import CkbTransactionWithStatusModelWrapper from '../../model/ckb/ckb_transaction_with_status';

describe('Balance controller', () => {
  let req;
  let res;
  let next;
  let controller;
  let mock_repository: MockRepository;

  const lock = {
    code_hash: '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63',
    hash_type: <HashType>'type',
    args: '0x988485609e16d5d5c62be0a4ae12b665fefcb448',
  };
  // const orderLock = {
  //   code_hash: contracts.orderLock.codeHash,
  //   hash_type: contracts.orderLock.hashType,
  //   args: utils.computeScriptHash(lock),
  // };
  const sudtType = {
    code_hash: '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
    hash_type: 'data',
    args: '0x9668cc9f8652ff7f1821dd265a54bf4b9c4a6345e3457bbfbcda95fe899a6097',
  };

  beforeEach(() => {
    mock_repository = MockRepositoryFactory.getInstance();
    const service = new TxService(mock_repository);
    controller = new TxController(service);
    
    req = mockReq();
    res = mockRes();
    next = sinon.spy();
  });


  describe('#getSudtTransactions()', () => {
    describe('invalid requests', () => {
      describe('with no lock script', () => {
        beforeEach(async () => {
          req.query = {
            lock_code_hash: lock.code_hash,
            lock_hash_type: lock.hash_type,
            lock_args: lock.args,
          };
          await controller.getSudtTransactions(req, res, next);
        });
        it('returns 400', () => {
          res.status.should.have.been.calledWith(400);
          res.json.should.have.been.calledWith({ error: 'requires either lock and type script specified as parameters' });
        });
      });
      describe('with no type script', () => {
        beforeEach(async () => {
          req.query = {
            type_code_hash: sudtType.code_hash,
            type_hash_type: sudtType.hash_type,
            type_args: sudtType.args,
          };
          await controller.getSudtTransactions(req, res, next);
        });
        it('returns 400', () => {
          res.status.should.have.been.calledWith(400);
          res.json.should.have.been.calledWith({ error: 'requires either lock and type script specified as parameters' });
        });
      });
    });
  })

  describe('#getTransactionsByTxHash()', () => {
    describe('invalid requests', () => {
      describe('with no lock script', () => {
        beforeEach(async () => {
          req.query = {};
          await controller.getTransactionsByTxHash(req, res, next);
        });
        it('returns 400', () => {
          res.status.should.have.been.calledWith(400);
          res.json.should.have.been.calledWith({ error: 'requires lock script to be specified as parameters' });
        });
      });
      describe('with no type script', () => {
        beforeEach(async () => {
          req.query = {
            lock_code_hash: lock.code_hash,
            lock_hash_type: lock.hash_type,
            lock_args: lock.args,
            type_code_hash: sudtType.code_hash,
            type_hash_type: sudtType.hash_type,
          };
          await controller.getTransactionsByTxHash(req, res, next);
        });
        it('returns 400', () => {
          res.status.should.have.been.calledWith(400);
          res.json.should.have.been.calledWith({ error: 'requires type script to be specified as parameters' });
        });
      });
      describe('transaction does not exist', () => {
        beforeEach(async () => {
          req.query = {
            lock_code_hash: lock.code_hash,
            lock_hash_type: lock.hash_type,
            lock_args: lock.args,
            type_code_hash: sudtType.code_hash,
            type_hash_type: sudtType.hash_type,
            type_args: sudtType.args,
            tx_hash: "hash0"
          };

          const mock = mock_repository.mockGetTransactionByHash();
          mock.resolves(undefined);
          await controller.getTransactionsByTxHash(req, res, next);
        });
        it('returns 400', () => {
          res.status.should.have.been.calledWith(400);
          res.json.should.have.been.calledWith({ error: "The transaction does not exist!" });
        });
      });
    });

    describe('valid requests', () => {
      describe('with no lock script', () => {
        beforeEach(async () => {
          req.query = {
            lock_code_hash: lock.code_hash,
            lock_hash_type: lock.hash_type,
            lock_args: lock.args,
            tx_hash: "hash1"
          };
  
          mock_repository.mockGetblockNumberByBlockHash()
            .withArgs("block1")
            .resolves(1);
  
          mock_repository.mockGetTransactionByHash()
            .withArgs("hash1")
            .resolves(new CkbTransactionWithStatusModelWrapper(tx));
          mock_repository.mockGetTransactions()
            .resolves([new CkbTransactionWithStatusModelWrapper(preTx)]);
  
          await controller.getTransactionsByTxHash(req, res, next);
        });
        it('returns balance', () => {
          res.status.should.have.been.calledWith(200);
          res.json.should.have.been.calledWith({
            status: 'committed',
            transaction_fee: '1',
            amount: '-200',
            to: '0x252dae0a4b9d9b80f504f6418acd2d364c0c59cd',
            from: '0x988485609e16d5d5c62be0a4ae12b665fefcb448',
            hash: 'hash1',
            block_no: 1
          });
        });
      });
    });
  })

});
