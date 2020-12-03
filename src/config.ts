import { HashType, Hash } from "@ckb-lumos/base";
import dotenv from "dotenv";
dotenv.config();

export const indexer_config = {
  dataPath: process.env.INDEXER_FOLDER_PATH || "./indexer_data",
  nodeUrl: process.env.CKB_NODE_RPC_URL || "http://localhost:8114",
};

interface Contracts {
  orderLock: OrderLock;
}

interface OrderLock {
  codeHash: Hash;
  hashType: HashType;
}

export const contracts: Contracts = {
  orderLock: {
    codeHash: process.env.ORDER_LOCK_CODE_HASH || "0xda1d1b96472a75861b77dc02948a008ddaef4431559a2e526955496653b6dce9",
    hashType: <HashType>(process.env.ORDER_LOCK_HASH_TYPE || "data"),
  }
};

export const env = process.env.NODE_ENV || "development";
export const port = process.env.PORT || 7001;
