import CkbOutPointModel from './ckb_out_point'

export default interface CkbTransactionInputsModel {
  previousOutput: CkbOutPointModel
  since: string
}
