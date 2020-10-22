require('dotenv').config();
const env = process.env.NODE_ENV || 'development';
const port = process.env.PORT || 8080;

const contracts = {
  orderLock: {
    codeHash: process.env.ORDER_LOCK_CODE_HASH,
    hashType: process.env.ORDER_LOCK_HASH_TYPE,
  }
}

module.exports = {env, port, contracts};
