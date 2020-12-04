import "reflect-metadata"
import chai from 'chai';
import sinonChai from "sinon-chai";

chai.use(sinonChai);
chai.should();
import sinon from "sinon";
import sinonStubPromise from "sinon-stub-promise";

sinonStubPromise(sinon);

import { mockReq, mockRes } from "sinon-express-mock";
import { CkbUtils } from "../component/formatter";
import OrdersService from '../modules/orders/orders_service';
import OrdersHistoryService from '../modules/orders/orders_history_service';
import OrderController from '../modules/orders/orders_controller';

import { contracts } from "../config";
import { QueryOptions, Cell, TransactionWithStatus } from '@ckb-lumos/base';
import { DexRepository } from '../modules/repository/dex_repository';
import CkbTransactionWithStatusModelWrapper from '../model/ckb/ckb_transaction_with_status';
import { ckb_methons } from '../modules/ckb/ckb_service';


describe('Orders controller', () => {
  let req;
  let res;
  let next;
  let controller;
  let orders;
  let mock_cell;
  let mock_transaction;
  let mock_last_match_orders;
  let mock_getblockNumberByBlockHash;

  beforeEach(() => {
    orders = [
      {
        sUDTAmount: '5000000000',
        orderAmount: '15000000000',
        price: '50000000000',
        isBid: true,
        cell_output: {
          capacity: `0x${BigInt(200000000000).toString(16)}`,
          lock: {
            code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
            hash_type: 'data',
            args: `0x${'0'.repeat(64)}`,
          },
          type: {
            code_hash: '0xc68fb287d8c04fd354f8332c3d81ca827deea2a92f12526e2f35be37968f6740',
            hash_type: 'type',
            args: '0xbe7e812b85b692515a21ea3d5aed0ad37dccb3fcd86e9b8d6a30ac24808db1f7',
          },
        },
        out_point: {
          tx_hash: '0x2d662063751dd2b1bcc87a486e0186d489b6f8d20f9987978bdf3911b3de526d',
          index: '0x0',
        },
        block_hash: '0xfda1e2e23f258cf92e3496a0c2c684db38e57d6f85467fdd2976f0e29cb8ef40',
        block_number: '0xf',
        data: CkbUtils.formatOrderData(5000000000n, 15000000000n, 50000000000n, true),
      },
      {
        sUDTAmount: '5000000000',
        orderAmount: '15000000000',
        price: '70000000000',
        isBid: true,
        cell_output: {
          capacity: `0x${BigInt(200000000000).toString(16)}`,
          lock: {
            code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
            hash_type: 'data',
            args: `0x${'0'.repeat(64)}`,
          },
          type: {
            code_hash: '0xc68fb287d8c04fd354f8332c3d81ca827deea2a92f12526e2f35be37968f6740',
            hash_type: 'type',
            args: '0xbe7e812b85b692515a21ea3d5aed0ad37dccb3fcd86e9b8d6a30ac24808db1f7',
          },
        },
        out_point: {
          tx_hash: '0xd2fdccb50e40d30d9193af27532271616c9e09a33ab25dce4ed653c9e4dd72f8',
          index: '0x0',
        },
        block_hash: '0x2b17c782478f908110b1f653a1d3d322c39ac620d5f951d160977b02c2bcc9ce',
        block_number: '0x13',
        data: CkbUtils.formatOrderData(5000000000n, 15000000000n, 70000000000n, true),
      },
      {
        sUDTAmount: '50000000000',
        orderAmount: '100000000000',
        price: '50000000000',
        isBid: false,
        cell_output: {
          capacity: `0x${BigInt(80000000000).toString(16)}`,
          lock: {
            code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
            hash_type: 'data',
            args: `0x${'0'.repeat(64)}`,
          },
          type: {
            code_hash: '0xc68fb287d8c04fd354f8332c3d81ca827deea2a92f12526e2f35be37968f6740',
            hash_type: 'type',
            args: '0xbe7e812b85b692515a21ea3d5aed0ad37dccb3fcd86e9b8d6a30ac24808db1f7',
          },
        },
        out_point: {
          tx_hash: '0xeea888c6bae03f54c58e09bb1aaa51453f82438d1363528c570a5780d5d5aa7a',
          index: '0x0',
        },
        block_hash: '0xcfeafc49705d16bcf0c85d71715f8e18fe2ab26f827cde5e4537d5a318b642cf',
        block_number: '0x17',
        data: CkbUtils.formatOrderData(50000000000n, 100000000000n, 50000000000n, false),
      },
      {
        sUDTAmount: '50000000000',
        orderAmount: '100000000000',
        price: '55000000000',
        isBid: false,
        cell_output: {
          capacity: `0x${BigInt(80000000000).toString(16)}`,
          lock: {
            code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
            hash_type: 'data',
            args: `0x${'0'.repeat(64)}`,
          },
          type: {
            code_hash: '0xc68fb287d8c04fd354f8332c3d81ca827deea2a92f12526e2f35be37968f6740',
            hash_type: 'type',
            args: '0xbe7e812b85b692515a21ea3d5aed0ad37dccb3fcd86e9b8d6a30ac24808db1f7',
          },
        },
        out_point: {
          tx_hash: '0xb634202edd6409e6282b0d1d0b1dbcd5b3a52918a82235e9539dbe31961b1932',
          index: '0x0',
        },
        block_hash: '0x301326140a7ccf7735dc88deec20da679eb19a344321d849376b01a07a0c6a19',
        block_number: '0x1b',
        data: CkbUtils.formatOrderData(50000000000n, 100000000000n, 55000000000n, false),
      },
    ];

    class MockRepository implements DexRepository {

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
      getLastMatchOrders(type) {
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

    }

    const mock: MockRepository = new MockRepository();
    mock_cell = sinon.stub(mock, 'collectCells');  
    mock_transaction = sinon.stub(mock, 'collectTransactions');  
    mock_getblockNumberByBlockHash = sinon.stub(mock, 'getblockNumberByBlockHash');
    const service = new OrdersService(mock);
    const historyService = new OrdersHistoryService(mock);
    controller = new OrderController(service, historyService);

    req = mockReq();
    res = mockRes();
    next = sinon.spy();
  });

  describe('#getBestPrice()', () => {
    describe('query best ask price', () => {
      beforeEach(async () => {
        mock_cell.resolves(orders);

        req.query.is_bid = false;
        await controller.getBestPrice(req, res, next);
      });

      it('returns highest bid price', () => {
        res.status.should.have.been.calledWith(200);
        res.json.should.have.been.calledWith({ price: '70000000000' });
      });
    });
    describe('query best bid price', () => {
      beforeEach(async () => {
        mock_cell.resolves(orders);

        req.query.is_bid = true;
        await controller.getBestPrice(req, res, next);
      });

      it('returns lowest ask price', () => {
        res.status.should.have.been.calledWith(200);
        res.json.should.have.been.calledWith({ price: '50000000000' });
      });
    });
    describe('with order live cells having zero order amount', () => {
      const fakeOrders = [
        {
          cell_output: {
            capacity: `0x${BigInt(18700000000n).toString(16)}`,
            lock: {
              code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
              hash_type: 'data',
              args: `0x${'0'.repeat(64)}`,
            },
          },
          data: CkbUtils.formatOrderData(BigInt(1), BigInt(0), BigInt(20), true),
        },
        {
          cell_output: {
            capacity: `0x${BigInt(18700000001n).toString(16)}`,
            lock: {
              code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
              hash_type: 'data',
              args: `0x${'0'.repeat(64)}`,
            },
          },
          data: CkbUtils.formatOrderData(BigInt(1), BigInt(1), BigInt(10), true),
        },
        {
          cell_output: {
            capacity: `0x${BigInt(18700000000n).toString(16)}`,
            lock: {
              code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
              hash_type: 'data',
              args: `0x${'0'.repeat(64)}`,
            },
          },
          data: CkbUtils.formatOrderData(BigInt(1), BigInt(1), BigInt(15), false),
        },
      ];
      beforeEach(async () => {
        mock_cell.resolves(fakeOrders);

        req.query.is_bid = false;
        await controller.getBestPrice(req, res, next);
      });
      it('returns the price from the order cell having non-zero order amount', () => {
        res.status.should.have.been.calledWith(200);
        res.json.should.have.been.calledWith({ price: '10' });
      });
    });
    describe('with insufficient sudt amount or capacity', () => {
      const orderLock = {
        code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
        hash_type: 'data',
        args: `0x${'0'.repeat(64)}`,
      };

      describe('when query for best price for bid order', () => {
        const insufficientCapacity = BigInt(1870000000n);
        const sufficientCapacity = BigInt(18700000000n);
        const validOrderData = CkbUtils.formatOrderData(BigInt(25075 * 10 ** 5), BigInt(5 * 10 ** 9), BigInt(2 * 10 ** 10), false);
        const invalidOrderData = CkbUtils.formatOrderData(BigInt(2 * 10 ** 10), BigInt(4 * 10 ** 9), BigInt(2 * 10 ** 9), false);
        const fakeOrders = [
          {
            cell_output: {
              capacity: `0x${insufficientCapacity.toString(16)}`,
              lock: orderLock,
            },
            data: validOrderData,
          },
          {
            cell_output: {
              capacity: `0x${sufficientCapacity.toString(16)}`,
              lock: orderLock,
            },
            data: validOrderData,
          },
          {
            cell_output: {
              capacity: `0x${sufficientCapacity.toString(16)}`,
              lock: orderLock,
            },
            data: invalidOrderData,
          },
        ];
        beforeEach(async () => {
          mock_cell.resolves(fakeOrders);

          req.query.is_bid = true;
          await controller.getBestPrice(req, res, next);
        });
        it('returns the price from the order cell having non-zero order amount', () => {
          res.status.should.have.been.calledWith(200);
          res.json.should.have.been.calledWith({ price: '20000000000' });
        });
      });
      describe('when query for best price for ask order', () => {
        const orderAmount = BigInt(5 * 10 ** 9);
        const price = 2n;
        const sufficientCapacity = (BigInt(orderAmount * price) * BigInt(1003)) / BigInt(1000) + 18700000000n;
        const insufficientCapacity = sufficientCapacity - 2n;
        const fakeOrders = [
          {
            cell_output: {
              capacity: `0x${sufficientCapacity.toString(16)}`,
              lock: orderLock,
            },
            data: CkbUtils.formatOrderData(BigInt(0), orderAmount, BigInt(1 * 10 ** 10), true),
          },
          {
            cell_output: {
              capacity: `0x${sufficientCapacity.toString(16)}`,
              lock: orderLock,
            },
            data: CkbUtils.formatOrderData(BigInt(0), orderAmount, BigInt(2 * 10 ** 10), true),
          },
          {
            cell_output: {
              capacity: `0x${insufficientCapacity.toString(16)}`,
              lock: orderLock,
            },
            data: CkbUtils.formatOrderData(BigInt(0), orderAmount, BigInt(2 * 10 ** 10), true),
          },
        ];
        beforeEach(async () => {
          mock_cell.resolves(fakeOrders);

          req.query.is_bid = false;
          await controller.getBestPrice(req, res, next);
        });
        it('returns the price from the order cell having non-zero order amount', () => {
          res.status.should.have.been.calledWith(200);
          res.json.should.have.been.calledWith({ price: '20000000000' });
        });
      });
    });
  });

  describe('#getOrdersHistory()', () => {
    const typeScript = {
      args: 'type args',
      code_hash: 'type code hash',
      hash_type: 'type',
    };
    const orderLockScript = {
      args: null,
      code_hash: contracts.orderLock.codeHash,
      hash_type: contracts.orderLock.hashType,
    };


    const price = 1n;
    const orderLockArgs = 'orderLockArgs';
    const orderCell1 = {
      capacity: '0x1',
      lock: {
        ...orderLockScript,
        args: orderLockArgs,
      },
      type: typeScript,
      data: CkbUtils.formatOrderData(1n, 1n, price, true)
    }
    const orderCell2 = {
      capacity: '0x0',
      lock: {
        ...orderLockScript,
        args: orderLockArgs,
      },
      type: typeScript,
      data: CkbUtils.formatOrderData(2n, 0n, price, true)
    }

    describe('completed order', () => {
      let transactions;

      describe('with single order history', () => {
        beforeEach(async () => {
          transactions = [
            {
              transaction: {
                hash: 'hash1',
                inputs: [
                  {
                    previous_output: {
                      index: '0x0',
                      tx_hash: 'hash0',
                    },
                  },
                ],
                outputs: [
                  {
                    capacity: orderCell1.capacity,
                    lock: orderCell1.lock,
                    type: orderCell1.type,
                  },
                ],
                outputs_data: [
                  orderCell1.data,
                ],
              },
              tx_status: {
                block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
                status: 'committed'
              }
            },
            {
              transaction: {
                hash: 'hash2',
                inputs: [
                  {
                    previous_output: {
                      index: '0x0',
                      tx_hash: 'hash1',
                    },
                  },
                ],
                outputs: [
                  {
                    capacity: orderCell2.capacity,
                    lock: orderCell2.lock,
                    type: orderCell2.type,
                  },
                ],
                outputs_data: [
                  orderCell2.data,
                ],
              },
              tx_status: {
                block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
                status: 'committed'
              }
            },
          ];

          req.query.type_code_hash = typeScript.code_hash;
          req.query.type_hash_type = typeScript.hash_type;
          req.query.type_args = typeScript.args;
          req.query.order_lock_args = orderLockArgs;
        });
        describe('when order cell is live', () => {
          beforeEach(async () => {
            mock_transaction.resolves(transactions);
            await controller.getOrderHistory(req, res, next);
          });
          it('returns order history', () => {
            res.status.should.have.been.calledWith(200);
            res.json.should.have.been.calledWith(
              [
                {
                  block_hash: "0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9",
                  paid_amount: '1',
                  price: '1',
                  traded_amount: '1',
                  order_amount: '1',
                  turnover_rate: '1',
                  status: 'completed',
                  is_bid: true,
                  last_order_cell_outpoint: {
                    tx_hash: 'hash2',
                    index: '0x0',
                  },
                  order_cells: [
                    { index: "0", tx_hash: "hash1" },
                    { index: "0", tx_hash: "hash2" },
                  ]
                },
              ],
            );
          });
        });
        describe('when order cell is not live', () => {
          describe('with order lock or type mismatched', () => {
            beforeEach(async () => {
              transactions.push({
                transaction: {
                  hash: 'hash3',
                  inputs: [
                    {
                      previous_output: {
                        index: '0x0',
                        tx_hash: 'hash2',
                      },
                    },
                  ],
                  outputs: [
                    {
                      capacity: '0x2',
                      lock: {
                        ...orderLockScript,
                        args: orderLockArgs,
                      },
                    },
                  ],
                  outputs_data: ['0x'],
                },
                tx_status: {
                  block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
                  status: 'committed'
                }
              });
              mock_transaction.resolves(transactions);
              await controller.getOrderHistory(req, res, next);
            });
            it('returns order history', () => {
              res.status.should.have.been.calledWith(200);
              res.json.should.have.been.calledWith(
                [
                  {
                    block_hash: "0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9",
                    paid_amount: '1',
                    traded_amount: '1',
                    order_amount: '1',
                    turnover_rate: '1',
                    price: '1',
                    status: 'claimed',
                    is_bid: true,
                    last_order_cell_outpoint: {
                      tx_hash: 'hash3',
                      index: '0x1',
                    },
                    order_cells: [
                      { index: "0", tx_hash: "hash1" },
                      { index: "0", tx_hash: "hash2" },
                    ]
                  },
                ],
              );
            });
          });
        });
      });
      describe('with multiple order history', () => {
        const orderCell1_1 = {
          capacity: '0x3',
          lock: {
            ...orderLockScript,
            args: orderLockArgs,
          },
          type: typeScript,
          data: CkbUtils.formatOrderData(1n, 1n, price, true)
        }
        const orderCell1_2 = {
          capacity: '0x1',
          lock: {
            ...orderLockScript,
            args: orderLockArgs,
          },
          type: typeScript,
          data: CkbUtils.formatOrderData(2n, 0n, price, true)
        }
        const orderCell2_1 = {
          capacity: '0x4',
          lock: {
            ...orderLockScript,
            args: orderLockArgs,
          },
          type: typeScript,
          data: CkbUtils.formatOrderData(10n, 10n, price, true)
        }
        const orderCell2_2 = {
          capacity: '0x1',
          lock: {
            ...orderLockScript,
            args: orderLockArgs,
          },
          type: typeScript,
          data: CkbUtils.formatOrderData(20n, 0n, price, true)
        }
        describe('with one input transaction to one output transaction', () => {
          beforeEach(async () => {
            transactions = [
              {
                transaction: {
                  hash: 'hash1',
                  inputs: [
                    {
                      previous_output: {
                        index: '0x0',
                        tx_hash: 'hash0',
                      },
                    },
                  ],
                  outputs: [
                    {
                      capacity: orderCell1_1.capacity,
                      lock: orderCell1_1.lock,
                      type: orderCell1_1.type,
                    },
                    {
                      capacity: orderCell2_1.capacity,
                      lock: orderCell2_1.lock,
                      type: orderCell2_1.type,
                    },
                  ],
                  outputs_data: [
                    orderCell1_1.data,
                    orderCell2_1.data,
                  ],
                },
                tx_status: {
                  block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
                  status: 'committed'
                }
              },
              {
                transaction: {
                  hash: 'hash2',
                  inputs: [
                    {
                      previous_output: {
                        index: '0x0',
                        tx_hash: 'hash1',
                      },
                    },
                    {
                      previous_output: {
                        index: '0x1',
                        tx_hash: 'hash1',
                      },
                    },
                  ],
                  outputs: [
                    {
                      capacity: '0x0',
                      lock: {
                        ...orderLockScript,
                        args: orderLockArgs,
                      },
                    },
                    {
                      capacity: orderCell1_2.capacity,
                      lock: orderCell1_2.lock,
                      type: orderCell1_2.type,
                    },
                    {
                      capacity: orderCell2_2.capacity,
                      lock: orderCell2_2.lock,
                      type: orderCell2_2.type,
                    },
                  ],
                  outputs_data: [
                    '0x',
                    orderCell1_2.data,
                    orderCell2_2.data,
                  ],
                },
                tx_status: {
                  block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
                  status: 'committed'
                }
              },
            ];

            req.query.type_code_hash = typeScript.code_hash;
            req.query.type_hash_type = typeScript.hash_type;
            req.query.type_args = typeScript.args;
            req.query.order_lock_args = orderLockArgs;
          });
          describe('when order cell is live', () => {
            beforeEach(async () => {
              mock_transaction.resolves(transactions);
              await controller.getOrderHistory(req, res, next);
            });
            it('returns order history', () => {
              res.status.should.have.been.calledWith(200);
              res.json.should.have.been.calledWith(
                [
                  {
                    block_hash: "0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9",
                    paid_amount: '2',
                    traded_amount: '1',
                    order_amount: '1',
                    turnover_rate: '1',
                    price: '1',
                    status: 'completed',
                    is_bid: true,
                    last_order_cell_outpoint: {
                      tx_hash: 'hash2',
                      index: '0x1',
                    },
                    order_cells: [
                      { index: "0", tx_hash: "hash1" },
                      { index: "1", tx_hash: "hash2" },
                    ]
                  },
                  {
                    block_hash: "0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9",
                    paid_amount: '3',
                    traded_amount: '10',
                    order_amount: '10',
                    turnover_rate: '1',
                    price: '1',
                    status: 'completed',
                    is_bid: true,
                    last_order_cell_outpoint: {
                      tx_hash: 'hash2',
                      index: '0x2',
                    },
                    order_cells: [
                      { index: "1", tx_hash: "hash1" },
                      { index: "2", tx_hash: "hash2" },
                    ]
                  },
                ],
              );
            });
          });
        });
        describe('with two input transactions to one transaction', () => {
          beforeEach(async () => {
            transactions = [
              {
                transaction: {
                  hash: 'hash1',
                  inputs: [
                    {
                      previous_output: {
                        index: '0x0',
                        tx_hash: 'hash0',
                      },
                    },
                  ],
                  outputs: [
                    {
                      capacity: orderCell1_1.capacity,
                      lock: orderCell1_1.lock,
                      type: orderCell1_1.type,
                    },
                  ],
                  outputs_data: [
                    orderCell1_1.data,
                  ],
                },
                tx_status: {
                  block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
                  status: 'committed'
                }
              },
              {
                transaction: {
                  hash: 'hash2',
                  inputs: [
                    {
                      previous_output: {
                        index: '0x1',
                        tx_hash: 'hash0',
                      },
                    },
                  ],
                  outputs: [
                    {
                      capacity: orderCell2_1.capacity,
                      lock: orderCell2_1.lock,
                      type: orderCell2_1.type,
                    },
                  ],
                  outputs_data: [
                    orderCell2_1.data,
                  ],
                },
                tx_status: {
                  block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
                  status: 'committed'
                }
              },
              {
                transaction: {
                  hash: 'hash3',
                  inputs: [
                    {
                      previous_output: {
                        index: '0x0',
                        tx_hash: 'hash-1',
                      },
                    },
                    {
                      previous_output: {
                        index: '0x0',
                        tx_hash: 'hash2',
                      },
                    },
                    {
                      previous_output: {
                        index: '0x0',
                        tx_hash: 'hash1',
                      },
                    },
                  ],
                  outputs: [
                    {
                      capacity: '0x0',
                      lock: {
                        ...orderLockScript,
                        args: orderLockArgs,
                      },
                    },
                    {
                      capacity: orderCell2_2.capacity,
                      lock: orderCell2_2.lock,
                      type: orderCell2_2.type,
                    },
                    {
                      capacity: orderCell1_2.capacity,
                      lock: orderCell1_2.lock,
                      type: orderCell1_2.type,
                    },
                  ],
                  outputs_data: [
                    '0x',
                    orderCell2_2.data,
                    orderCell1_2.data,
                  ],
                },
                tx_status: {
                  block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
                  status: 'committed'
                }
              },
            ];

            req.query.type_code_hash = typeScript.code_hash;
            req.query.type_hash_type = typeScript.hash_type;
            req.query.type_args = typeScript.args;
            req.query.order_lock_args = orderLockArgs;

            mock_transaction.resolves(transactions);
            await controller.getOrderHistory(req, res, next);
          });
          it('returns order history', () => {
            res.status.should.have.been.calledWith(200);
            res.json.should.have.been.calledWith(
              [
                {
                  block_hash: "0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9",
                  paid_amount: '2',
                  traded_amount: '1',
                  order_amount: '1',
                  turnover_rate: '1',
                  price: '1',
                  status: 'completed',
                  is_bid: true,
                  last_order_cell_outpoint: {
                    tx_hash: 'hash3',
                    index: '0x2',
                  },
                  order_cells: [
                    { index: "0", tx_hash: "hash1" },
                    { index: "2", tx_hash: "hash3" },
                  ]
                },
                {
                  block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
                  paid_amount: '3',
                  traded_amount: '10',
                  order_amount: '10',
                  turnover_rate: '1',
                  price: '1',
                  status: 'completed',
                  is_bid: true,
                  last_order_cell_outpoint: {
                    tx_hash: 'hash3',
                    index: '0x1',
                  },
                  order_cells: [
                    { index: "0", tx_hash: "hash2" },
                    { index: "1", tx_hash: "hash3" },
                  ]
                },
              ],
            );
          });
        });
      });
    });
    describe('aborted order', () => {
      beforeEach(async () => {
        const transactions = [
          {
            transaction: {
              hash: 'hash1',
              inputs: [
                {
                  previous_output: {
                    index: '0x0',
                    tx_hash: 'hash0',
                  },
                },
              ],
              outputs: [
                {
                  capacity: orderCell1.capacity,
                  lock: orderCell1.lock,
                  type: orderCell1.type,
                },
              ],
              outputs_data: [
                orderCell1.data,
              ],
            },
            tx_status: {
              block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
              status: 'committed'
            }
          },
          {
            transaction: {
              hash: 'hash2',
              inputs: [
                {
                  previous_output: {
                    index: '0x0',
                    tx_hash: 'hash1',
                  },
                },
              ],
              outputs: [
                {
                  capacity: '0x2',
                  lock: {
                    ...orderLockScript,
                    args: orderLockArgs,
                  },
                },
              ],
              outputs_data: ['0x'],
            },
            tx_status: {
              block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
              status: 'committed'
            }
          },
        ];

        req.query.type_code_hash = typeScript.code_hash;
        req.query.type_hash_type = typeScript.hash_type;
        req.query.type_args = typeScript.args;
        req.query.order_lock_args = orderLockArgs;
        mock_transaction.resolves(transactions);

        await controller.getOrderHistory(req, res, next);
      });
      it('returns order history', () => {
        res.status.should.have.been.calledWith(200);
        res.json.should.have.been.calledWith([
          {
            block_hash: "0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9",
            paid_amount: '0',
            traded_amount: '0',
            order_amount: '1',
            turnover_rate: '0',
            price: '1',
            status: 'aborted',
            is_bid: true,
            last_order_cell_outpoint: {
              tx_hash: 'hash2',
              index: '0x1',
            },
            order_cells: [
              {index: "0", tx_hash: "hash1"},
            ]
          },
        ]);
      });
    });
    describe('incompleted order', () => {
      beforeEach(async () => {
        const orderLockArgs = 'orderLockArgs';
        const transactions = [
          {
            transaction: {
              hash: 'hash1',
              inputs: [
                {
                  previous_output: {
                    index: '0x0',
                    tx_hash: 'hash0',
                  },
                },
              ],
              outputs: [
                {
                  capacity: orderCell1.capacity,
                  lock: orderCell1.lock,
                  type: orderCell1.type,
                },
              ],
              outputs_data: [
                orderCell1.data,
              ],
            },
            tx_status: {
              block_hash: '0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9',
              status: 'committed'
            }
          },
        ];

        req.query.type_code_hash = typeScript.code_hash;
        req.query.type_hash_type = typeScript.hash_type;
        req.query.type_args = typeScript.args;
        req.query.order_lock_args = orderLockArgs;
        mock_transaction.resolves(transactions);

        await controller.getOrderHistory(req, res, next);
      });
      it('returns order history', () => {
        res.status.should.have.been.calledWith(200);
        res.json.should.have.been.calledWith([
          {
            block_hash: "0x50c20ecc2b3b56ed336e4d8b840cf99a29069ffa7b279433e1c7093a359657b9",
            paid_amount: '0',
            traded_amount: '0',
            order_amount: '1',
            turnover_rate: '0',
            price: '1',
            status: 'opening',
            is_bid: true,
            last_order_cell_outpoint: {
              tx_hash: 'hash1',
              index: '0x0',
            },
            order_cells: [
              { index: "0", tx_hash: "hash1" }
            ]
          },
        ]);
      });
    });
  });

  describe('#getOrders()', () => {
    beforeEach(() => {
      const TYPE_SCRIPT = {
        code_hash: '0xe1e354d6d643ad42724d40967e334984534e0367405c5ae42a9d7d63d77df419',
        hash_type: 'data',
        args: '0x32e555f3ff8e135cece1351a6a2971518392c1e30375c1e006ad0ce8eac07947'
      }
      req.query.type_code_hash = TYPE_SCRIPT.code_hash
      req.query.type_hash_type = TYPE_SCRIPT.hash_type
      req.query.type_args = TYPE_SCRIPT.args;
      mock_cell.resolves(orders)
    })

    it('should return bid orders and ask orders', async () => {
      await controller.getOrders(req, res, next);
      res.status.should.have.been.calledWith(200);
      res.json.should.have.been.calledWith({
        ask_orders: [
          { price: "55000000000", receive: "100000000000" }, { price: "50000000000", receive: "100000000000" }
        ],
        bid_orders: [
          { price: "70000000000", receive: "15000000000" }, { price: "50000000000", receive: "15000000000" }
        ]
      });
    })
  })

  describe('#getCurrentPrice', () => {
    beforeEach(() => {
      const TYPE_SCRIPT = {
        code_hash: '0xe1e354d6d643ad42724d40967e334984534e0367405c5ae42a9d7d63d77df419',
        hash_type: 'data',
        args: '0x32e555f3ff8e135cece1351a6a2971518392c1e30375c1e006ad0ce8eac07947'
      };
      req.query.type_code_hash = TYPE_SCRIPT.code_hash;
      req.query.type_hash_type = TYPE_SCRIPT.hash_type;
      req.query.type_args = TYPE_SCRIPT.args;
    })

    describe('when orders are found', () => {
      beforeEach(() => {
        const transactions = [
          {
            transaction: {
              cell_deps: [],
              hash: '0xdc2afe16fe64dfaa410b0929a398ebd9ddeeae9bb33fccc1846611cf6f6af841',
              header_deps: [],
              inputs: [ 
                {
                  previous_output: {
                    index: '0x0',
                    tx_hash: '0x6e378ba6ebe2334fd5d20f36ea79a6db4ea3073269cf50370b085656afb7c2cf'
                  },
                  since: '0x0'
                },
                {
                  previous_output: {
                    index: '0x2',
                    tx_hash: '0x6e378ba6ebe2334fd5d20f36ea79a6db4ea3073269cf50370b085656afb7c2cf'
                  },
                  since: '0x0'
                },
                {
                  previous_output: {
                    index: '0x0',
                    tx_hash: '0x344c64b678ee4f6f0f569b44a484203b61a791a600e0e79a6f6188bbdbd43935'
                  },
                  since: '0x0'
                }
              ],
              outputs: [ 
                {
                  capacity: '0x38d8761aedb13',
                  lock: {
                    args: '0x921e55249a7072f945a8adae259a8665196289bc',
                    code_hash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
                    hash_type: 'type'
                  },
                  type: {
                    args: '0x32e555f3ff8e135cece1351a6a2971518392c1e30375c1e006ad0ce8eac07947',
                    code_hash: '0xe1e354d6d643ad42724d40967e334984534e0367405c5ae42a9d7d63d77df419',
                    hash_type: 'data'
                  }
                },
                {
                  capacity: '0x7d7f7fe47e',
                  lock: {
                    args: '0xc07b294df4873625d2c97d904a6cd91ff68c8d68e6b343b0b2490e15d79c094f',
                    code_hash: '0xaebf4e5c3b523d91499da8f95dc13ab79f565b1486ab243ea3e7c6ffeec215ba',
                    hash_type: 'type'
                  },
                  type: {
                    args: '0x32e555f3ff8e135cece1351a6a2971518392c1e30375c1e006ad0ce8eac07947',
                    code_hash: '0xe1e354d6d643ad42724d40967e334984534e0367405c5ae42a9d7d63d77df419',
                    hash_type: 'data'
                  }
                },
                {
                  capacity: '0x950fa012ce',
                  lock: {
                    args: '0xc07b294df4873625d2c97d904a6cd91ff68c8d68e6b343b0b2490e15d79c094f',
                    code_hash: '0xaebf4e5c3b523d91499da8f95dc13ab79f565b1486ab243ea3e7c6ffeec215ba',
                    hash_type: 'type'
                  },
                  type: {
                    args: '0x32e555f3ff8e135cece1351a6a2971518392c1e30375c1e006ad0ce8eac07947',
                    code_hash: '0xe1e354d6d643ad42724d40967e334984534e0367405c5ae42a9d7d63d77df419',
                    hash_type: 'data'
                  }
                }
              ],
              outputs_data: [
                '0x4210d24d000000000000000000000000',
                '0xfadfec2004000000000000000000000002000000000000000000000000000000000050efe2d6e41a1b0000000000000001',
                '0x15a367c20e0000000000000000000000345f8b80120000000000000000000000000070b53d9373f2250000000000000000'
              ],
              version: '0x0',
              witnesses: []
            },
            tx_status: {
              block_hash: '0xb86a4590f6c07c32b9bb1c8643869aa318720580f7deb0f7a63dec8c2297c8f2',
              status: 'committed'
            }
          },
          {
            transaction: {
              cell_deps: [],
              hash: '0x6e378ba6ebe2334fd5d20f36ea79a6db4ea3073269cf50370b085656afb7c2cf',
              header_deps: [],
              inputs: [ 
                {
                  previous_output: {
                    index: '0x0',
                    tx_hash: '0x3b0f1524b45a59a85d210871dcbee2949852999cc7d9593afe2c810a0ebe7aa4'
                  },
                  since: '0x0'
                },
                {
                  previous_output: {
                    index: '0x0',
                    tx_hash: '0xd2bc38dcc242a87047ff1b25967e34769f4691857a58470ea7ce5a9c2551f4f0'
                  },
                  since: '0x0'
                },
                {
                  previous_output: {
                    index: '0x2',
                    tx_hash: '0x3b0f1524b45a59a85d210871dcbee2949852999cc7d9593afe2c810a0ebe7aa4'
                  },
                  since: '0x0'
                }
              ],
              outputs: [ 
                {
                  capacity: '0x38d871dbc5e97',
                  lock: {
                    args: '0x921e55249a7072f945a8adae259a8665196289bc',
                    code_hash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
                    hash_type: 'type'
                  },
                  type: {
                    args: '0x32e555f3ff8e135cece1351a6a2971518392c1e30375c1e006ad0ce8eac07947',
                    code_hash: '0xe1e354d6d643ad42724d40967e334984534e0367405c5ae42a9d7d63d77df419',
                    hash_type: 'data'
                  }
                },
                {
                  capacity: '0x4f010c4e0',
                  lock: {
                    args: '0xc07b294df4873625d2c97d904a6cd91ff68c8d68e6b343b0b2490e15d79c094f',
                    code_hash: '0xaebf4e5c3b523d91499da8f95dc13ab79f565b1486ab243ea3e7c6ffeec215ba',
                    hash_type: 'type'
                  },
                  type: {
                    args: '0x32e555f3ff8e135cece1351a6a2971518392c1e30375c1e006ad0ce8eac07947',
                    code_hash: '0xe1e354d6d643ad42724d40967e334984534e0367405c5ae42a9d7d63d77df419',
                    hash_type: 'data'
                  }
                },
                {
                  capacity: '0x24f1121200',
                  lock: {
                    args: '0xc07b294df4873625d2c97d904a6cd91ff68c8d68e6b343b0b2490e15d79c094f',
                    code_hash: '0xaebf4e5c3b523d91499da8f95dc13ab79f565b1486ab243ea3e7c6ffeec215ba',
                    hash_type: 'type'
                  },
                  type: {
                    args: '0x32e555f3ff8e135cece1351a6a2971518392c1e30375c1e006ad0ce8eac07947',
                    code_hash: '0xe1e354d6d643ad42724d40967e334984534e0367405c5ae42a9d7d63d77df419',
                    hash_type: 'data'
                  }
                }
              ],
              outputs_data: [
                '0xa43f7c42000000000000000000000000',
                '0x00ca9a3b000000000000000000000000000000000000000000000000000000000000a0dec5adc935360000000000000000',
                '0xad53aaee12000000000000000000000080d26d8e580000000000000000000000000050efe2d6e41a1b0000000000000001'
              ],
              version: '0x0',
              witnesses: []
            },
            tx_status: {
              block_hash: '0x0c6379436b821d3174cb99a7792d14895c8e7797748a97c9f23e1471e9db864a',
              status: 'committed'
            }
          },
          {
            transaction: {
              cell_deps: [],
              hash: '0x6e378ba6ebe2334fd5d20f36ea79a6db4ea3073269cf50370b085656afb7c2cf',
              header_deps: [],
              inputs: [ 
                {
                  previous_output: {
                    index: '0x0',
                    tx_hash: '0x3b0f1524b45a59a85d210871dcbee2949852999cc7d9593afe2c810a0ebe7aa4'
                  },
                  since: '0x0'
                },
                {
                  previous_output: {
                    index: '0x0',
                    tx_hash: '0xd2bc38dcc242a87047ff1b25967e34769f4691857a58470ea7ce5a9c2551f4f0'
                  },
                  since: '0x0'
                },
                {
                  previous_output: {
                    index: '0x2',
                    tx_hash: '0x3b0f1524b45a59a85d210871dcbee2949852999cc7d9593afe2c810a0ebe7aa4'
                  },
                  since: '0x0'
                }
              ],
              outputs: [ 
                {
                  capacity: '0x38d871dbc5e97',
                  lock: {
                    args: '0x921e55249a7072f945a8adae259a8665196289bc',
                    code_hash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
                    hash_type: 'type'
                  },
                  type: {
                    args: '0x32e555f3ff8e135cece1351a6a2971518392c1e30375c1e006ad0ce8eac07947',
                    code_hash: '0xe1e354d6d643ad42724d40967e334984534e0367405c5ae42a9d7d63d77df419',
                    hash_type: 'data'
                  }
                },
                {
                  capacity: '0x4f010c4e0',
                  lock: {
                    args: '0xc07b294df4873625d2c97d904a6cd91ff68c8d68e6b343b0b2490e15d79c094f',
                    code_hash: '0xaebf4e5c3b523d91499da8f95dc13ab79f565b1486ab243ea3e7c6ffeec215ba',
                    hash_type: 'type'
                  },
                  type: {
                    args: '0x32e555f3ff8e135cece1351a6a2971518392c1e30375c1e006ad0ce8eac07947',
                    code_hash: '0xe1e354d6d643ad42724d40967e334984534e0367405c5ae42a9d7d63d77df419',
                    hash_type: 'data'
                  }
                },
                {
                  capacity: '0x24f1121200',
                  lock: {
                    args: '0xc07b294df4873625d2c97d904a6cd91ff68c8d68e6b343b0b2490e15d79c094f',
                    code_hash: '0xaebf4e5c3b523d91499da8f95dc13ab79f565b1486ab243ea3e7c6ffeec215ba',
                    hash_type: 'type'
                  },
                  type: {
                    args: '0x32e555f3ff8e135cece1351a6a2971518392c1e30375c1e006ad0ce8eac07947',
                    code_hash: '0xe1e354d6d643ad42724d40967e334984534e0367405c5ae42a9d7d63d77df419',
                    hash_type: 'data'
                  }
                }
              ],
              outputs_data: [
                '0xa43f7c42000000000000000000000000',
                '0x00ca9a3b000000000000000000000000000000000000000000000000000000000000a0dec5adc935360000000000000000',
                '0xad53aaee12000000000000000000000080d26d8e580000000000000000000000000050efe2d6e41a1b0000000000000001'
              ],
              version: '0x0',
              witnesses: []
            },
            tx_status: {
              block_hash: '0x0c6379436b821d3174cb99a7792d14895c8e7797748a97c9f23e1471e9db864a',
              status: 'committed'
            }
          },
          {
            transaction: {
              cell_deps: [],
              hash: '0x344c64b678ee4f6f0f569b44a484203b61a791a600e0e79a6f6188bbdbd43935',
              header_deps: [],
              inputs: [ 
                {
                  previous_output: {
                    index: '0x1',
                    tx_hash: '0xd2bc38dcc242a87047ff1b25967e34769f4691857a58470ea7ce5a9c2551f4f0'
                  },
                  since: '0x0'
                }
              ],
              outputs: [ 
                {
                  capacity: '0xede210c900',
                  lock: {
                    args: '0xc07b294df4873625d2c97d904a6cd91ff68c8d68e6b343b0b2490e15d79c094f',
                    code_hash: '0xaebf4e5c3b523d91499da8f95dc13ab79f565b1486ab243ea3e7c6ffeec215ba',
                    hash_type: 'type'
                  },
                  type: {
                    args: '0x32e555f3ff8e135cece1351a6a2971518392c1e30375c1e006ad0ce8eac07947',
                    code_hash: '0xe1e354d6d643ad42724d40967e334984534e0367405c5ae42a9d7d63d77df419',
                    hash_type: 'data'
                  }
                }
              ],
              outputs_data: [
                '0x000000000000000000000000000000004902f342210000000000000000000000000070b53d9373f2250000000000000000',
                '0x'
              ],
              version: '0x0',
              witnesses: []
            },
            tx_status: {
              block_hash: '0x0c6379436b821d3174cb99a7792d14895c8e7797748a97c9f23e1471e9db864a',
              status: 'committed'
            }
          }
        ]
        mock_transaction.resolves(transactions)
        mock_getblockNumberByBlockHash
          .withArgs("0xb86a4590f6c07c32b9bb1c8643869aa318720580f7deb0f7a63dec8c2297c8f2")
          .resolves(600330)
          .withArgs("0x0c6379436b821d3174cb99a7792d14895c8e7797748a97c9f23e1471e9db864a")
          .resolves(600325)
      })

      it('should return bid orders and ask orders', async () => {
        await controller.getCurrentPrice(req, res, next);
        res.status.should.have.been.calledWith(200);
        res.json.should.have.been.calledWith("600000000000000000000");
      })
    })

    describe('when orders are not found', () => {
      beforeEach(() => {
        mock_transaction.resolves([]);
      })

      it('should return bid orders and ask orders', async () => {
        await controller.getCurrentPrice(req, res, next);
        res.status.should.have.been.calledWith(200);
        res.json.should.have.been.calledWith("");
      })
    })

  })
});
