import CkbCellScriptModel from './ckb_cell_script'

export default interface CkbCellModel {
  lock: CkbCellScriptModel
  type: CkbCellScriptModel
  capacity: string
}
