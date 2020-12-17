import { QueryOptions, Script, ScriptWrapper, utils, Cell, TxStatus, TransactionWithStatus } from "@ckb-lumos/base";
import { Reader, RPC, validators } from "ckb-js-toolkit";
import knex from "knex";

export class TransactionCollector {
  constructor(
    private knex: knex,
    private queryOptions: QueryOptions,
    private rpc: RPC,
    private includeStatus = true
  ) {

    if(!queryOptions.argsLen) {
      queryOptions.argsLen = -1;
    }

    if(!queryOptions.order) {
      queryOptions.order = "asc";
    }

    if(!queryOptions.data) {
      queryOptions.data = "any";
    }

    if (!queryOptions.lock && (!queryOptions.type || queryOptions.type === "empty")) {
      throw new Error("Either lock or type script must be provided!");
    }
    // Wrap the plain `Script` into `ScriptWrapper`.
    if (queryOptions.lock && queryOptions.lock as Script) {
      const lock = <Script>queryOptions.lock;
      validators.ValidateScript(lock);
      queryOptions.lock = { script: lock, argsLen: queryOptions.argsLen };
      
    } else if (queryOptions.lock && queryOptions.lock as ScriptWrapper) {
      const lock = <ScriptWrapper>queryOptions.lock;
      validators.ValidateScript(lock.script);
      
      // check argsLen
      if (!lock.argsLen) {
        lock.argsLen = queryOptions.argsLen;
      }
    }


    if (queryOptions.type === "empty") {
      // queryOptions.type = queryOptions.type;

    } else if (queryOptions.type && typeof queryOptions.type === "object" && queryOptions.type as Script) {
      const type = <Script>queryOptions.type;
      validators.ValidateScript(type);
      queryOptions.type = { script: type, argsLen: queryOptions.argsLen };

    } else if (queryOptions.type && typeof queryOptions.type === "object" && queryOptions.type as ScriptWrapper) {
      const type = <ScriptWrapper>queryOptions.type;
      validators.ValidateScript(type.script);
      
      // check argsLen
      if (!type.argsLen) {
        type.argsLen = queryOptions.argsLen;
      }
    }
    if (queryOptions.fromBlock) {
      utils.assertHexadecimal("fromBlock", queryOptions.fromBlock);
    }
    if (queryOptions.toBlock) {
      utils.assertHexadecimal("toBlock", queryOptions.toBlock);
    }
    if (queryOptions.order !== "asc" && queryOptions.order !== "desc") {
      throw new Error("Order must be either asc or desc!");
    }
  
  }

  assembleQuery(order = true) {
    let query = this.knex("cells");
    if (order) {
      query = query.orderBy([
        { column: "cells.block_number", order: this.queryOptions.order },
        { column: "cells.tx_index", order: this.queryOptions.order },
        { column: "cells.index", order: this.queryOptions.order },
      ]);
    }
    if (this.queryOptions.fromBlock) {
      query = query.andWhere("cells.block_number", ">=", this.queryOptions.fromBlock);
    }
    if (this.queryOptions.toBlock) {
      query = query.andWhere("cells.block_number", "<=", this.queryOptions.toBlock);
    }
    if (this.queryOptions.lock) {
      const lock = <ScriptWrapper>this.queryOptions.lock;
      const binaryArgs = hexToNodeBuffer(lock.script.args);
      let lockQuery = this.knex("scripts")
        .select("id")
        .where({
          code_hash: hexToNodeBuffer(lock.script.code_hash),
          hash_type: lock.script.hash_type === "type" ? 1 : 0,
        })
        .whereRaw("substring(args, 1, ?) = ?", [
          binaryArgs.byteLength,
          binaryArgs,
        ]);
      if (lock.argsLen !== "any" && lock.argsLen > 0) {
        lockQuery = lockQuery.whereRaw("length(args) = ?", [lock.argsLen]);
      }
      query = query.andWhere(function () {
        return this.whereIn("lock_script_id", lockQuery);
      });
    }
    if (this.queryOptions.type) {
      const type = <ScriptWrapper>this.queryOptions.type;
      if (this.queryOptions.type !== "empty") {
        const binaryArgs = hexToNodeBuffer(type.script.args);
        let typeQuery = this.knex("scripts")
          .select("id")
          .where({
            code_hash: hexToNodeBuffer(type.script.code_hash),
            hash_type: type.script.hash_type === "type" ? 1 : 0,
          })
          .whereRaw("substring(args, 1, ?) = ?", [
            binaryArgs.byteLength,
            binaryArgs,
          ]);
        if (type.argsLen !== "any" && type.argsLen > 0) {
          typeQuery = typeQuery.whereRaw("length(args) = ?", [
            type.argsLen,
          ]);
        }
        query = query.andWhere(function () {
          return this.whereIn("type_script_id", typeQuery);
        });
      } else {
        query = query.whereNull("type_script_id");
      }
    }
    if (this.queryOptions.data !== "any") {
      query = query.andWhere("data", hexToNodeBuffer(this.queryOptions.data));
    }
    if (this.queryOptions.skip) {
      query = query.offset(this.queryOptions.skip);
    }
    return query;
  }

  async collectCells(): Promise<Cell[]> {
    // TODO: optimize this with streams
    const items = await this.assembleQuery()
      .innerJoin(
        "block_digests",
        "cells.block_number",
        "block_digests.block_number"
      )
      .innerJoin(
        this.knex.ref("scripts").as("lock_scripts"),
        "cells.lock_script_id",
        "lock_scripts.id"
      )
      .leftJoin(this.knex.ref("scripts").as("type_scripts"), function () {
        this.onNotNull("cells.type_script_id").on(
          "cells.type_script_id",
          "=",
          "type_scripts.id"
        );
      })
      .select(
        "block_digests.*",
        "cells.*",
        this.knex.ref("lock_scripts.code_hash").as("lock_script_code_hash"),
        this.knex.ref("lock_scripts.hash_type").as("lock_script_hash_type"),
        this.knex.ref("lock_scripts.args").as("lock_script_args"),
        this.knex.ref("type_scripts.code_hash").as("type_script_code_hash"),
        this.knex.ref("type_scripts.hash_type").as("type_script_hash_type"),
        this.knex.ref("type_scripts.args").as("type_script_args")
      );

    const cells: Cell[] = []
    for (const item of items) cells.push({
      cell_output: {
        capacity: dbBigIntToHex(item.capacity),
        lock: dbItemToScript(
          item.lock_script_code_hash,
          item.lock_script_hash_type,
          item.lock_script_args
        ),
        type: dbItemToScript(
          item.type_script_code_hash,
          item.type_script_hash_type,
          item.type_script_args
        ),
      },
      out_point: {
        tx_hash: nodeBufferToHex(item.tx_hash),
        index: dbBigIntToHex(item.index),
      },
      block_hash: nodeBufferToHex(item.block_hash),
      block_number: dbBigIntToHex(item.block_number),
      data: nodeBufferToHex(item.data),
    });

    return cells;
  }

  async *collect() {
  
    const outputs = await this.collectCells();
     
    // const txHashs = new Set();
    // const queryHash = [];
    // const groupByTxHash: Map<string, Cell[]> = new Map();
    // for (const cell of cells) {
    //   const hash = new Reader(cell.out_point.tx_hash).serializeJson();

    //   if(!txHashs.has(hash)) {
    //     txHashs.add(hash);
    //     queryHash.push(hash)
    //   }
    
    //   let outputs = groupByTxHash.get(hash);
    //   if(!outputs) {
    //     outputs = [];
    //     groupByTxHash.set(hash, outputs);
    //   }
    //   outputs.push(cell)
    // }

    const inputTxs = [];
    for (let i = 0; i < outputs.length; i++) {
      const cell = outputs[i];
      const hash = hexToNodeBuffer(cell.out_point.tx_hash);
      const index = parseInt(cell.out_point.index, 16);

      const tx = await this.knex("transaction_inputs").where("transaction_inputs.previous_tx_hash", "=", hash).andWhere("transaction_inputs.previous_index", "=", index)
        .leftJoin(
          "transaction_digests",
          "transaction_inputs.transaction_digest_id",
          "transaction_digests.id"
        ).select("transaction_digests.*");
      inputTxs.push(tx[0]);
    }

    console.log(inputTxs.length);
    console.log(outputs.length);
    

    for (const output of outputs) {
      const hash = new Reader(output.out_point.tx_hash).serializeJson();
      const tx = await this.rpc.get_transaction(hash);
      // if (!this.skipMissing && !tx) {
      //   throw new Error(`Transaction ${h} is missing!`);
      // }
      if (this.includeStatus) {
        yield tx;
      } else {
        yield tx.transaction;
      }
      
    }

  }
}
function dbBigIntToHex(i) {
  return "0x" + BigInt(i).toString(16);
}

function nodeBufferToHex(b) {
  return new Reader(
    b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
  ).serializeJson();
}

function hexToNodeBuffer(b) {
  return Buffer.from(new Reader(b).toArrayBuffer());
}

function dbItemToScript(code_hash, hash_type, args): Script {
  if (code_hash === null) {
    return undefined;
  } else {
    return {
      code_hash: nodeBufferToHex(code_hash),
      hash_type: hash_type === 1 ? "type" : "data",
      args: nodeBufferToHex(args),
    };
  }
}