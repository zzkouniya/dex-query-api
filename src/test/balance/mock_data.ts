import { HashType, utils } from '@ckb-lumos/base'
import { CkbUtils } from '../../component'
import { contracts } from '../../config'

const tx =
{
  ckbTransactionWithStatus:
  {
    transaction: {
      cellDeps: [],
      hash: 'hash1',
      headerDeps: [],
      inputs: [
        {
          previousOutput: {
            index: '0x0',
            tx_hash: 'hash'
          },
          since: '0x0'
        }
      ],
      outputs: [
        {
          capacity: `0x${5000000000n.toString(16)}`,
          lock: {
            args: '0xa60a0c56a0f243e8beee05ef9146f772608007f2d5c9b0edede5cd67b9c095c0',
            code_hash: '0x279bee9fa98959029766c0e0ce19cd91b7180fd15b600a9e95140149b524c53b',
            hash_type: 'type'
          },
          type: {
            args: '0x6fe3733cd9df22d05b8a70f7b505d0fb67fb58fb88693217135ff5079713e902',
            code_hash: '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
            hash_type: 'type'
          }
        },
        {
          capacity: `0x${5000000000n.toString(16)}`,
          lock: {
            args: '0x2946e43211d00ab3791ab1d8b598c99643c39649',
            code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
            hash_type: 'type'
          },
          type: null
        }
      ],
      outputsData: [
        '0x0000000000000000000000000000000000ca9a3b0000000000000000000000000000a0dec5adc935360000000000000000',
        '0x'
      ],
      version: '0x0',
      witnesses: []
    },
    txStatus: {
      blockHash: 'hash',
      status: 'pending'
    }
  }
}

export const ckbPendingCell = new Map()
ckbPendingCell.set('hash:0x0', tx)

export const ckbCells = [
  {
    cell_output: {
      capacity: `0x${1000000000n.toString(16)}`,
      lock: {
        args: '0x2946e43211d00ab3791ab1d8b598c99643c39649',
        code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
        hash_type: 'type'
      },
      type: undefined
    },
    out_point: {
      tx_hash: 'hash',
      index: '0x0'
    },
    block_hash: '0x2a83acd30af733dd3b8f3b09955ff8b6610aa5c893f37b1cfc75440e541cc62a',
    block_number: '0xdc413',
    data: '0x'
  },
  {
    cell_output: {
      capacity: `0x${100000000n.toString(16)}`,
      lock: {
        args: '0x2946e43211d00ab3791ab1d8b598c99643c39649',
        code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
        hash_type: 'type'
      },
      type: undefined
    },
    out_point: {
      tx_hash: 'hash1',
      index: '0x80ab27a7dc0000000000000000000000'
    },
    block_hash: '0x2c329db7dc304d841d72634a6e8648a620101e22879435906c4198c9c5e3b194',
    block_number: '0xdc56c',
    data: '0x12312312312312312'
  }
]

export const ckbOrderCells = [
  {
    cell_output: {
      capacity: `0x${5000000000n.toString(16)}`,
      lock: {
        code_hash: contracts.orderLock.codeHash,
        hash_type: contracts.orderLock.hashType,
        args: utils.computeScriptHash({
          code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
          hash_type: <HashType>'type',
          args: '0x2946e43211d00ab3791ab1d8b598c99643c39649'
        })
      },
      type: undefined
    },
    out_point: {
      tx_hash: '0xa553ec8758de53687c3832fbcc914d840b14fdac946f6f66d9e4f75d9dcc0ba5',
      index: '0x0'
    },
    block_hash: '0xa2d17536fe9b225e3c39fcb5c6e15ae4144d5902c1685d8eaf9beb9e4d01e9b9',
    block_number: '0xd614b',
    data: '0x00000000000000000000000000000000c42aad000000000000000000000000000000340b6a2f8dc42f0000000000000000'
  }
]

const sudtTx =
{
  ckbTransactionWithStatus:
  {
    transaction: {
      cellDeps: [],
      hash: 'hash1',
      headerDeps: [],
      inputs: [
        {
          previousOutput: {
            index: '0x0',
            tx_hash: 'hash'
          },
          since: '0x0'
        }
      ],
      outputs: [
        {
          capacity: `0x${5000000000n.toString(16)}`,
          lock: {
            code_hash: contracts.orderLock.codeHash,
            hash_type: contracts.orderLock.hashType,
            args: utils.computeScriptHash({
              code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
              hash_type: <HashType>'type',
              args: '0x2946e43211d00ab3791ab1d8b598c99643c39649'
            })
          },
          type: {
            code_hash: '0xc68fb287d8c04fd354f8332c3d81ca827deea2a92f12526e2f35be37968f6740',
            hash_type: 'type',
            args: '0xbe7e812b85b692515a21ea3d5aed0ad37dccb3fcd86e9b8d6a30ac24808db1f7'
          }
        },
        {
          capacity: `0x${5000000000n.toString(16)}`,
          lock: {
            args: '0x2946e43211d00ab3791ab1d8b598c99643c39649',
            code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
            hash_type: 'type'
          },
          type: {
            code_hash: '0xc68fb287d8c04fd354f8332c3d81ca827deea2a92f12526e2f35be37968f6740',
            hash_type: 'type',
            args: '0xbe7e812b85b692515a21ea3d5aed0ad37dccb3fcd86e9b8d6a30ac24808db1f7'
          }
        }
      ],
      outputsData: [
        CkbUtils.formatBigUInt128LE(BigInt(200)),
        CkbUtils.formatBigUInt128LE(BigInt(100))
      ],
      version: '0x0',
      witnesses: []
    },
    txStatus: {
      blockHash: 'hash',
      status: 'pending'
    }
  }
}

export const sudtPendingCell = new Map()
sudtPendingCell.set('hash:0x0', sudtTx)

export const sudtCells = [
  {
    cell_output: {
      capacity: `0x${1000000000n.toString(16)}`,
      lock: {
        args: '0x2946e43211d00ab3791ab1d8b598c99643c39649',
        code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
        hash_type: 'type'
      },
      type: {
        code_hash: '0xc68fb287d8c04fd354f8332c3d81ca827deea2a92f12526e2f35be37968f6740',
        hash_type: 'type',
        args: '0xbe7e812b85b692515a21ea3d5aed0ad37dccb3fcd86e9b8d6a30ac24808db1f7'
      }
    },
    out_point: {
      tx_hash: 'hash',
      index: '0x0'
    },
    block_hash: '0x2a83acd30af733dd3b8f3b09955ff8b6610aa5c893f37b1cfc75440e541cc62a',
    block_number: '0xdc413',
    data: CkbUtils.formatBigUInt128LE(BigInt(300))
  },
  {
    cell_output: {
      capacity: `0x${100000000n.toString(16)}`,
      lock: {
        args: '0x2946e43211d00ab3791ab1d8b598c99643c39649',
        code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
        hash_type: 'type'
      },
      type: {
        code_hash: '0xc68fb287d8c04fd354f8332c3d81ca827deea2a92f12526e2f35be37968f6740',
        hash_type: 'type',
        args: '0xbe7e812b85b692515a21ea3d5aed0ad37dccb3fcd86e9b8d6a30ac24808db1f7'
      }
    },
    out_point: {
      tx_hash: 'hash1',
      index: '0x80ab27a7dc0000000000000000000000'
    },
    block_hash: '0x2c329db7dc304d841d72634a6e8648a620101e22879435906c4198c9c5e3b194',
    block_number: '0xdc56c',
    data: CkbUtils.formatBigUInt128LE(BigInt(100))
  }
]

export const sudtOrderCells = [
  {
    cell_output: {
      capacity: `0x${5000000000n.toString(16)}`,
      lock: {
        code_hash: contracts.orderLock.codeHash,
        hash_type: contracts.orderLock.hashType,
        args: utils.computeScriptHash({
          code_hash: '0x04878826e4bf143a93eb33cb298a46f96e4014533d98865983e048712da65160',
          hash_type: <HashType>'type',
          args: '0x2946e43211d00ab3791ab1d8b598c99643c39649'
        })
      },
      type: {
        code_hash: '0xc68fb287d8c04fd354f8332c3d81ca827deea2a92f12526e2f35be37968f6740',
        hash_type: 'type',
        args: '0xbe7e812b85b692515a21ea3d5aed0ad37dccb3fcd86e9b8d6a30ac24808db1f7'
      }
    },
    out_point: {
      tx_hash: '0xa553ec8758de53687c3832fbcc914d840b14fdac946f6f66d9e4f75d9dcc0ba5',
      index: '0x0'
    },
    block_hash: '0xa2d17536fe9b225e3c39fcb5c6e15ae4144d5902c1685d8eaf9beb9e4d01e9b9',
    block_number: '0xd614b',
    data: CkbUtils.formatBigUInt128LE(BigInt(50))
  }
]
