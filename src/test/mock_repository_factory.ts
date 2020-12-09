import { Cell, Script, TransactionWithStatus } from '@ckb-lumos/base';
import sinon from 'sinon';
import { QueryOptions } from 'winston';
import { DexOrderData } from '../component';
import CkbTransactionWithStatusModelWrapper from '../model/ckb/ckb_transaction_with_status';
import { ckb_methons } from '../modules/ckb/ckb_service';
import { DexRepository } from '../modules/repository/dex_repository';


export class MockRepositoryFactory {
  static getInstance(): MockRepository {
    return new MockRepository()
  }

}

export class MockRepository implements DexRepository {

  tip(): Promise<number> {
    return null;
  }
  collectCells(queryOptions: QueryOptions): Promise<Cell[]> {
    console.log(queryOptions + " is mock");
    return null;
  }
  collectTransactions(queryOptions: QueryOptions): Promise<TransactionWithStatus[]> {
    console.log(queryOptions + " is mock");
    return null;
  }
  getLastMatchOrders(type: Script): Promise<Record<'ask_orders' | 'bid_orders', Array<DexOrderData> | null>> {
    console.log(type + " is mock");
    return null;
  }

  getTransactions(ckbReqParams: [method: ckb_methons, ...rest: []][]): Promise<Array<CkbTransactionWithStatusModelWrapper>> {
    console.log(ckbReqParams + " is mock");
    return null;
  }

  getTransactionByHash(txHash: string): Promise<CkbTransactionWithStatusModelWrapper> {
    console.log(txHash + " is mock");
    return null;
  }
  
  getblockNumberByBlockHash(blockHash: string): Promise<number> {
    console.log(blockHash + " is mock");
    return null;
  }
  
  async getBlockTimestampByHash(blockHash: string): Promise<string> {
    console.log(blockHash + " is mock");
    return "111";
  }

  /* eslint-disable */
  mockTip(): sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'tip');  
  }

  mockGetCollectCells(): sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'collectCells');  
  }

  mockGetCollectTransactions(): sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'collectTransactions');  
  }

  mockGetLastMatchOrders(): sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'getLastMatchOrders');  
  }

  mockGetTransactions(): sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'getTransactions');  
  }

  mockGetTransactionByHash(): sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'getTransactionByHash');  
  }

  mockGetblockNumberByBlockHash(): sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'getblockNumberByBlockHash');  
  }

  mockGetBlockTimestampByHash(): sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'getBlockTimestampByHash');  
  }
}