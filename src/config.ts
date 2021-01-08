import { HashType, Hash } from "@ckb-lumos/base";
import dotenv from "dotenv";
import * as lumos from "@ckb-lumos/base"
dotenv.config();

export const indexer_config = {
  dataPath: process.env.INDEXER_FOLDER_PATH || "./indexer_data",
  nodeUrl: process.env.CKB_NODE_RPC_URL || "http://localhost:8114",
};

interface Contracts {
  orderLock: Script & { version: number };
}

interface Script {
  codeHash: Hash;
  hashType: HashType;
}

export const contracts: Contracts = {
  orderLock: {
    codeHash: process.env.ORDER_LOCK_CODE_HASH || "0xccb2a529cf5d8d1f4713b2711e443f9cec62baed84da77019c776c65845bba48",
    hashType: <HashType>(process.env.ORDER_LOCK_HASH_TYPE || "type"),
    version: 1,
  },
};

export const crossLockScript: lumos.Script = {
  code_hash: process.env.CROSS_CHAIN_HASH_CODE || "0xfd9515dc15ce2385aab85af21a6c89d7c003eac115dcbd195a8f29ad916ab316",
  hash_type: <HashType>process.env.CROSS_CHAIN_HASH_TYPE || "type",
  args: process.env.CROSS_CHAIN_ARGS || "0xf264a2adf7d5c683855828b5be39c25cee0a13dfc4401d8d5f05b958e6f1b884560f649cddfd9615bb867b58869bdcd636c2c1d0256dd087630ac88619dda33537f887889ddaa233"
}

export const env = process.env.NODE_ENV || "development";
export const port = process.env.PORT || 7001;
