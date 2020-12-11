/* eslint-disable @typescript-eslint/no-empty-function */
import sinon from 'sinon';
import { DexCache } from '../modules/cache/dex_cache';



export class MockCacheFactory {
  static getInstance(): MockCache {
    return new MockCache()
  }
  
}

export class MockCache implements DexCache {

  // eslint-disable-next-line @typescript-eslint/no-empty-function 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  set(key: string): void {

  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  exists(key: string): Promise<boolean> {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockSet(): sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'set');  
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockExists(): sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'exists');  
  }

}
