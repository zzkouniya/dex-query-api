import { Hash } from '@ckb-lumos/base'
import CkbCellModel from './ckb_cell'
import CkbTransactionCellDepsModel from './ckb_transaction_cell_deps'
import CkbTransactionInputsModel from './ckb_transaction_inputs'

export default interface CkbTransactionModel {
  cellDeps: CkbTransactionCellDepsModel[]

  inputs: CkbTransactionInputsModel[]

  outputs: CkbCellModel[]

  outputsData: string[]

  headerDeps: Hash[]

  hash: string

  version: string

  witnesses: string[]

}
