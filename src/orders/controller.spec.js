const chai = require('chai');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
chai.should();
const sinon = require('sinon');
const sinonStubPromise = require('sinon-stub-promise');
sinonStubPromise(sinon);
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
const {mockReq, mockRes} = require('sinon-express-mock');
const config = require('../config')

describe('Orders controller', () => {
  
  let req;
  let res;
  let next;
  let controller;
  let orders;

  const blockNumber = 12314234;

  beforeEach(() => {
    order = {
      amount: '1.001',
      rate: '0.000001',
      residuals: {
        current: '0.0001',
        previous: '0.0002'
      }
    };
    orders =[
      {
        // sUDTAmount: '5000000000',
        // orderAmount: '15000000000',
        // price: '50000000000',
        // isBid: true,
        "cell_output": {
          "capacity": "0x2e90edd000",
          "lock": {
            "code_hash": "0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160",
            "hash_type": "data",
            "args": "0x2946e43211d00ab3791ab1d8b598c99643c39649"
          },
          "type": {
            "code_hash": "0xc68fb287d8c04fd354f8332c3d81ca827deea2a92f12526e2f35be37968f6740",
            "hash_type": "type",
            "args": "0xbe7e812b85b692515a21ea3d5aed0ad37dccb3fcd86e9b8d6a30ac24808db1f7"
          }
        },
        "out_point": {
          "tx_hash": "0x2d662063751dd2b1bcc87a486e0186d489b6f8d20f9987978bdf3911b3de526d",
          "index": "0x0"
        },
        "block_hash": "0xfda1e2e23f258cf92e3496a0c2c684db38e57d6f85467fdd2976f0e29cb8ef40",
        "block_number": "0xf",
        "data": "0x00f2052a01000000000000000000000000d6117e03000000000000000000000000743ba40b00000000"
      },
      {
        // sUDTAmount: '5000000000',
        // orderAmount: '15000000000',
        // price: '70000000000',
        // isBid: true,
        "cell_output": {
          "capacity": "0x2e90edd000",
          "lock": {
            "code_hash": "0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160",
            "hash_type": "data",
            "args": "0x2946e43211d00ab3791ab1d8b598c99643c39649"
          },
          "type": {
            "code_hash": "0xc68fb287d8c04fd354f8332c3d81ca827deea2a92f12526e2f35be37968f6740",
            "hash_type": "type",
            "args": "0xbe7e812b85b692515a21ea3d5aed0ad37dccb3fcd86e9b8d6a30ac24808db1f7"
          }
        },
        "out_point": {
          "tx_hash": "0xd2fdccb50e40d30d9193af27532271616c9e09a33ab25dce4ed653c9e4dd72f8",
          "index": "0x0"
        },
        "block_hash": "0x2b17c782478f908110b1f653a1d3d322c39ac620d5f951d160977b02c2bcc9ce",
        "block_number": "0x13",
        "data": "0x00f2052a01000000000000000000000000d6117e030000000000000000000000003c534c1000000000"
      },
      {
        // sUDTAmount: '50000000000',
        // orderAmount: '100000000000',
        // price: '50000000000',
        // isBid: false,
        "cell_output": {
          "capacity": "0x12a05f2000",
          "lock": {
            "code_hash": "0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160",
            "hash_type": "data",
            "args": "0x688327ab52c054a99b30f2287de0f5ee67805ded"
          },
          "type": {
            "code_hash": "0xc68fb287d8c04fd354f8332c3d81ca827deea2a92f12526e2f35be37968f6740",
            "hash_type": "type",
            "args": "0xbe7e812b85b692515a21ea3d5aed0ad37dccb3fcd86e9b8d6a30ac24808db1f7"
          }
        },
        "out_point": {
          "tx_hash": "0xeea888c6bae03f54c58e09bb1aaa51453f82438d1363528c570a5780d5d5aa7a",
          "index": "0x0"
        },
        "block_hash": "0xcfeafc49705d16bcf0c85d71715f8e18fe2ab26f827cde5e4537d5a318b642cf",
        "block_number": "0x17",
        "data": "0x00743ba40b000000000000000000000000e8764817000000000000000000000000743ba40b00000001"
      },
      {
        // sUDTAmount: '50000000000',
        // orderAmount: '100000000000',
        // price: '55000000000',
        // isBid: false,
        "cell_output": {
          "capacity": "0x12a05f2000",
          "lock": {
            "code_hash": "0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160",
            "hash_type": "data",
            "args": "0x688327ab52c054a99b30f2287de0f5ee67805ded"
          },
          "type": {
            "code_hash": "0xc68fb287d8c04fd354f8332c3d81ca827deea2a92f12526e2f35be37968f6740",
            "hash_type": "type",
            "args": "0xbe7e812b85b692515a21ea3d5aed0ad37dccb3fcd86e9b8d6a30ac24808db1f7"
          }
        },
        "out_point": {
          "tx_hash": "0xb634202edd6409e6282b0d1d0b1dbcd5b3a52918a82235e9539dbe31961b1932",
          "index": "0x0"
        },
        "block_hash": "0x301326140a7ccf7735dc88deec20da679eb19a344321d849376b01a07a0c6a19",
        "block_number": "0x1b",
        "data": "0x00743ba40b000000000000000000000000e87648170000000000000000000000006641ce0c00000001"
      }
    ]
    indexer = {
      collectCells: sinon.stub().returnsPromise(),
      collectTransactions: sinon.stub().returnsPromise(),
    };
    controller = proxyquire('./controller', {
      '../indexer': indexer,
    });
    req = mockReq();
    res = mockRes();
    next = sinon.spy();
  });

  describe('#getBestPrice()', () => {
    describe('query best ask price', () => {
      beforeEach(async () => {
        indexer.collectCells.resolves(orders);
  
        req.query.is_bid = false
        await controller.getBestPrice(req, res, next);
      });
  
      it('returns highest bid price', () => {
        res.status.should.have.been.calledWith(200);
        res.json.should.have.been.called;
        res.json.should.have.been.calledWith({price: '70000000000'});
      });
    });
    describe('query best bid price', () => {
      beforeEach(async () => {
        indexer.collectCells.resolves(orders);
  
        req.query.is_bid = true
        await controller.getBestPrice(req, res, next);
      });
  
      it('returns lowest ask price', () => {
        res.status.should.have.been.calledWith(200);
        res.json.should.have.been.called;
        res.json.should.have.been.calledWith({price: '50000000000'});
      });
    });
  });

  describe('#getOrdersHistory()', () => {
    const typeScript = {
      "args": "type args",
      "code_hash": "type code hash",
      "hash_type": "type"
    }
    const orderLockScript = {
      "args": null,
      "code_hash": config.contracts.orderLock.codeHash,
      "hash_type": config.contracts.orderLock.hashType,
    }

    const U128_MAX = BigInt(2) ** BigInt(128) - BigInt(1);
    const U128_MIN = BigInt(0);

    const writeBigUInt128LE = (u128) => {
        if (u128 < U128_MIN) {
            throw new Error(`u128 ${u128} too small`);
        }
        if (u128 > U128_MAX) {
            throw new Error(`u128 ${u128} too large`);
        }
        const buf = Buffer.alloc(16);
        buf.writeBigUInt64LE(u128 & BigInt('0xFFFFFFFFFFFFFFFF'), 0);
        buf.writeBigUInt64LE(u128 >> BigInt(64), 8);
        return `0x${buf.toString('hex')}`;
    };

    const formatOrderData = (currentAmount, orderAmount, price, isBid) => {
      const udtAmountHex = writeBigUInt128LE(currentAmount);
      if (isBid === undefined) {
          return udtAmountHex;
      }

      const orderAmountHex = writeBigUInt128LE(orderAmount).replace('0x', '');

      const priceBuf = Buffer.alloc(8);
      priceBuf.writeBigUInt64LE(price);
      const priceHex = `${priceBuf.toString('hex')}`;

      const bidOrAskBuf = Buffer.alloc(1);
      bidOrAskBuf.writeInt8(isBid ? 0 : 1);
      const isBidHex = `${bidOrAskBuf.toString('hex')}`;

      const dataHex = udtAmountHex + orderAmountHex + priceHex + isBidHex;
      return dataHex;
    };

    describe('completed order', () => {
      beforeEach(async () => {
        const price = 1n;
        const publicKeyHash = 'publickeyhash'
        const transactions = [
          {
            transaction: {
              hash: 'hash1',
              inputs: [
                {
                  previous_output: {
                    index: '0x0',
                    tx_hash: 'hash0'
                  }
                },
              ],
              outputs: [
                {
                  capacity: '0x0',
                  lock: {
                    ...orderLockScript,
                    args: publicKeyHash,
                  },
                  type: typeScript,
                },
              ],
              outputs_data: [
                formatOrderData(1n, 1n, price, true),
              ],
            }
          },
          {
            transaction: {
              hash: 'hash2',
              inputs: [
                {
                  previous_output: {
                    index: '0x0',
                    tx_hash: 'hash1'
                  }
                },
              ],
              outputs: [
                {
                  capacity: '0x0',
                  lock: {
                    ...orderLockScript,
                    args: publicKeyHash,
                  },
                  type: typeScript,
                },
              ],
              outputs_data: [
                formatOrderData(2n, 0n, price, true),
              ],
            }
          },
        ];
  
        req.query.type_code_hash = typeScript.code_hash
        req.query.type_hash_type = typeScript.hash_type
        req.query.type_args = typeScript.args
        req.query.public_key_hash = publicKeyHash
        indexer.collectTransactions.resolves(transactions);

        await controller.getOrderHistory(req, res, next);
      });
      it('returns order history', () => {
        res.status.should.have.been.calledWith(200);
        res.json.should.have.been.called;
        res.json.should.have.been.calledWith(
          [
            {
              traded_amount: '1',
              order_amount: '1',
              turnover_rate: '1', //100%
              status: 'completed',
              claimable: true,
              last_order_cell_outpoint: {
                tx_hash: 'hash2',
                index: '0x0',
              }
            },
          ]
        );
  
        //check completed order cell 
          //if the order amount is 0
            //then it is completed
            //if it is live cell(end of history)
              //then claimable
          //link through the previous inputs
            //find the initial order cell
              //get the order amount, which is the total traded amount
  
        //check aborted order cell
          //if the order amount is non-zero 
          //and the lock of the next output is not the same as the current one(end of history)
            //then it is aborted
          //link through the previous inputs
            //find the initial order cell
              //get the order amount and subtract it by the order amount of the current order cell
  
        //check open order cell
          //if the order lock cell is live and the order amount is not 0
            //then the order is still incompleted
          //link through the previous inputs
            //find the initial order cell
              //get the order amount and subtract it by the order amount of the current order cell
      });
    });
    describe('incompleted order', () => {
      beforeEach(async () => {
        const price = 1n;
        const publicKeyHash = 'publickeyhash'
        const transactions = [
          {
            transaction: {
              hash: 'hash1',
              inputs: [
                {
                  previous_output: {
                    index: '0x0',
                    tx_hash: 'hash0'
                  }
                },
              ],
              outputs: [
                {
                  capacity: '0x0',
                  lock: {
                    ...orderLockScript,
                    args: publicKeyHash,
                  },
                  type: typeScript,
                },
              ],
              outputs_data: [
                formatOrderData(1n, 1n, price, true),
              ],
            }
          },
        ];
  
        req.query.type_code_hash = typeScript.code_hash
        req.query.type_hash_type = typeScript.hash_type
        req.query.type_args = typeScript.args
        req.query.public_key_hash = publicKeyHash
        indexer.collectTransactions.resolves(transactions);

        await controller.getOrderHistory(req, res, next);
      });
      it('returns order history', () => {
        res.status.should.have.been.calledWith(200);
        res.json.should.have.been.called;
        res.json.should.have.been.calledWith([
          {
            traded_amount: '0',
            order_amount: '1',
            turnover_rate: '0', //0%
            status: 'open',
            claimable: false,
            last_order_cell_outpoint: {
              tx_hash: 'hash1',
              index: '0x0',
            }
          },
        ]);
      });
    });
  });
});
