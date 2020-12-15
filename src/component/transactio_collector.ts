import { QueryOptions, Script, ScriptWrapper, utils } from "@ckb-lumos/base";
import { RPC, Reader, validators } from "ckb-js-toolkit";
import knex from "knex";

export class TransactionCollector {
  constructor(
    private knex: knex,
    private queryOptions: QueryOptions
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

  _assembleQuery(order = true) {
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

  // async count() {
  //   return parseInt((await this._assembleQuery(false)).length);
  // }

  async *collect() {
    // TODO: optimize this with streams
    const items = await this._assembleQuery()
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
    for (const item of items) {
      yield {
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
      };
    }
  }
}


function defaultLogger(level, message) {
  console.log(`[${level}] ${message}`);
}

function hexToDbBigInt(hex) {
  return BigInt(hex).toString();
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

function dbItemToScript(code_hash, hash_type, args) {
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

async function ensureScriptInserted(trx, script, hasReturning) {
  const data = {
    code_hash: hexToNodeBuffer(script.code_hash),
    hash_type: script.hash_type === "type" ? 1 : 0,
    args: hexToNodeBuffer(script.args),
  };
  let ids = await trx("scripts").where(data).select("id");
  if (ids.length === 0) {
    ids = await trx("scripts").insert([data], hasReturning ? ["id"] : null);
  }
  if (ids.length === 0) {
    throw new Error("Insertion failure!");
  }
  let id = ids[0];
  if (id instanceof Object) {
    id = id.id;
  }
  return id;
}