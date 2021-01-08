import { HashType, Hash } from '@ckb-lumos/base'
import dotenv from 'dotenv'
dotenv.config()

export const indexer_config = {
  dataPath: process.env.INDEXER_FOLDER_PATH ? process.env.INDEXER_FOLDER_PATH : './indexer_data',
  nodeUrl: process.env.CKB_NODE_RPC_URL ? process.env.CKB_NODE_RPC_URL : 'http://localhost:8114'
}

interface Contracts {
  orderLock: Script & { version: number }
}

interface Script {
  codeHash: Hash
  hashType: HashType
}

export const contracts: Contracts = {
  orderLock: {
    codeHash: process.env.ORDER_LOCK_CODE_HASH || '0xccb2a529cf5d8d1f4713b2711e443f9cec62baed84da77019c776c65845bba48',
    hashType: <HashType>(process.env.ORDER_LOCK_HASH_TYPE || 'type'),
    version: 1
  }
}

export const env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development'
export const port = process.env.PORT ? process.env.PORT : 7001
