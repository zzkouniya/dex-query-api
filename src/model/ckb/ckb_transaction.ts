import CkbCellModel from "./ckb_cell";
import CkbCellScriptModel from "./ckb_cell_script";
import CkbTransactionCellDepsModel from "./ckb_transaction_cell_deps";
import CkbTransactionInputsModel from "./ckb_transaction_inputs";
import CkbTransactionWithStatusModel from "./ckb_transaction_with_status";

export default interface CkbTransactionModel {
  cellDeps: Array<CkbTransactionCellDepsModel>;

  inputs: Array<CkbTransactionInputsModel>;

  outputs: Array<CkbCellModel>;

  outputsData: Array<string>;

  headerDeps: Array<any>;

  hash: string;

  version: string;

  witnesses: Array<string>;


}