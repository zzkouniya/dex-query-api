import { CkbTransactionWithStatusModel } from '../../model/ckb/ckb_transaction_with_status'

export const tx: CkbTransactionWithStatusModel = {
  transaction: {
    cellDeps: [],
    inputs: [ 
      {
        previousOutput: {
          txHash: 'hash0',
          index: '0x0'
        },
        since: '0x0'
      }
    ],
    outputs: [ 
      {
        lock: {
          "args": "0x252dae0a4b9d9b80f504f6418acd2d364c0c59cd",
          "codeHash": "0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63",
          "hashType": "type"
        },
        type: null,
        capacity: `0x${200n.toString(16)}`
      },
      {
        lock: {
          codeHash: '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63',
          hashType: 'type',
          args: '0x988485609e16d5d5c62be0a4ae12b665fefcb448'
        },
        type: null,
        capacity: `0x${299n.toString(16)}`
      }
    ],
    outputsData: [ '0x', '0x' ],
    headerDeps: [],
    hash: '0x34c5ba66e5be46e4b78d3dafe6a9f124912af64bad2f3a3ff53e1c684b7694c7',
    version: "",
    witnesses: []
  },
  txStatus: {
    blockHash: 'block1',
    status: 'committed'
  }
  
}


export const preTx: CkbTransactionWithStatusModel = {
  transaction: {
    cellDeps: [],
    inputs: [ 
      {
        previousOutput: {
          txHash: 'hash0',
          index: '0x0'
        },
        since: '0x0'
      }
    ],
    outputs: [ 
      {
        lock: {
          codeHash: '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63',
          hashType: 'type',
          args: '0x988485609e16d5d5c62be0a4ae12b665fefcb448'
        },
        type: null,
        capacity: `0x${500n.toString(16)}`
      }
    ],
    outputsData: [ '0x', '0x' ],
    headerDeps: [],
    hash: 'hash0',
    version: "",
    witnesses: []
  },
  txStatus: {
    blockHash: 'block0',
    status: 'committed'
  }
}



