require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
const port = process.env.PORT || 8080;

const contracts = {
  orderLock: {
    codeHash: process.env.ORDER_LOCK_CODE_HASH,
    hashType: process.env.ORDER_LOCK_HASH_TYPE,
  },
};

const indexer = {
  dataPath: process.env.INDEXER_FOLDER_PATH || 'http://127.0.0.1:8554',
  nodeUrl: process.env.CKB_NODE_RPC_URL || 'http://localhost:8114',
};

module.exports = {
  env, port, contracts, indexer,
};
