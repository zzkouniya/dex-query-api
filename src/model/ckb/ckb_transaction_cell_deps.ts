
import CkbOutPointModel from './ckb_out_point'

export default interface CkbTransactionCellDepsModel {
  outPoint: CkbOutPointModel
  depType: string
}
