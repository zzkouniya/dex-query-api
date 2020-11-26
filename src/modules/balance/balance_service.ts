import { inject, injectable, LazyServiceIdentifer } from "inversify";
import { utils, Script, QueryOptions, Cell } from "@ckb-lumos/base";
import IndexerWrapper from "../indexer/indexer";
import { modules } from "../../ioc";
import { contracts } from "../../config";
import { CkbUtils, DexLogger } from "../../component";
import BalanceCkbModel from "./balance_ckb_model";
import BalanceSudtModel from "./balance_sudt_model";
import { IndexerService } from '../indexer/indexer_service';

@injectable()
export default class BalanceService {
  private logger: DexLogger;
  constructor(
    @inject(new LazyServiceIdentifer(() => modules[IndexerWrapper.name]))
    private indexer: IndexerService
  ) {
    this.logger = new DexLogger(BalanceService.name);
  }

  async getCKBBalance(
    lock_code_hash: any,
    lock_hash_type: any,
    lock_args: any
  ): Promise<BalanceCkbModel> {
    
    const queryLock: Script = {
      code_hash: lock_code_hash,
      hash_type: lock_hash_type,
      args: lock_args,
    };

    const cells = await this.indexer.collectCells({
      lock: queryLock,
    });  

    const normalCells = cells.filter(
      (cell: Cell) => cell.data === "0x" && !cell.cell_output.type);

    const balance = normalCells.reduce(
      (total, cell) => total + BigInt(cell.cell_output.capacity),
      BigInt(0)
    );

    const occupiedCells = cells.filter(
      (cell) => cell.data !== "0x" || cell.cell_output.type
    );

    const occupiedBalance = occupiedCells.reduce(
      (total, cell) => total + BigInt(cell.cell_output.capacity),
      BigInt(0)
    );

    const queryLockHash = utils.computeScriptHash(queryLock);
    const orderLock: Script = {
      code_hash: contracts.orderLock.codeHash,
      hash_type: contracts.orderLock.hashType,
      args: queryLockHash,
    };

    const orderCells = await this.indexer.collectCells({
      lock: orderLock,
    });

    // this.logger.error("orderCells" + orderCells)
    const lockedOrderBalance = orderCells.reduce(
      (total, cell) => total + BigInt(cell.cell_output.capacity),
      BigInt(0)
    );

    return {
      free: balance.toString(),
      occupied: occupiedBalance.toString(),
      locked_order: lockedOrderBalance.toString(),
    };
  }

  async getSUDTBalance(
    lock_code_hash: any,
    lock_hash_type: any,
    lock_args: any,
    type_code_hash: any,
    type_hash_type: any,
    type_args: any
  ): Promise<BalanceSudtModel> {

    const queryOptions: QueryOptions = {
      lock: {
        code_hash: lock_code_hash,
        hash_type: lock_hash_type,
        args: lock_args,
      },
      type: {
        code_hash: type_code_hash,
        hash_type: type_hash_type,
        args: type_args,
      },
    };

    const cells = await this.indexer.collectCells(queryOptions);
    const balance = cells.reduce((total, cell) => {
      try {
        return total + CkbUtils.readBigUInt128LE(cell.data);
      } catch (error) {
        console.error(error);
        return total;
      }
    }, BigInt(0));    

    const queryLockHash = utils.computeScriptHash(<Script>queryOptions.lock);
    const orderLock: Script = {
      code_hash: contracts.orderLock.codeHash,
      hash_type: contracts.orderLock.hashType,
      args: queryLockHash,
    };

    const orderCells = await this.indexer.collectCells({
      lock: orderLock,
      type: queryOptions.type,
    });

    const lockedOrderBalance = orderCells.reduce((total, cell: Cell) => {
      try {
        return total + CkbUtils.parseOrderData(cell.data).sUDTAmount;
      } catch (error) {
        console.error(error);
        return total;
      }
    }, BigInt(0));
    
    return {
      free: balance.toString(),
      locked_order: lockedOrderBalance.toString(),
    };
  }

}
