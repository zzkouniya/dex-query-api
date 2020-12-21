import { Cell, HexString, Output } from "@ckb-lumos/base";
import BigNumber from 'bignumber.js';
import { contracts } from '../config';

export interface DexOrderData {
  sUDTAmount: bigint;
  version: bigint;
  orderAmount: bigint;
  effect: bigint,
  exponent: number,
  isBid: boolean,
  price: number
}

export interface DexOrderCellFormat {
  sUDTAmount: string;
  version: string;
  orderAmount: string;
  effect: string,
  exponent: string,
  isBid: boolean,
  price: number,
  rawData: Cell
}

export class CkbUtils {
  static parseOrderData(hex: HexString): DexOrderData {
    const sUDTAmount = this.parseAmountFromLeHex(hex.slice(0, 34));

    const versionBuf: Buffer = Buffer.from(hex.slice(34, 50), "hex");
    const version = versionBuf.readBigUInt64LE();
    
    const orderAmount = this.parseAmountFromLeHex(hex.slice(50, 82));
  
    const effectBuf: Buffer = Buffer.from(hex.slice(82, 98), "hex");
    const effect = effectBuf.readBigUInt64LE();
  
    const exponentBuf: Buffer = Buffer.from(hex.slice(98, 100), "hex");
    const exponent = exponentBuf.readInt8();
  
    const isBid = hex.slice(100, 102) === "00";

    const price = this.getPrice(effect, exponent);
  
    const orderData = {
      sUDTAmount,
      version,
      orderAmount,
      effect,
      exponent,
      isBid,
      price
    };
  
    return orderData;
  }

  static getPrice(effect: bigint, exponent: number): number {
    return Number(`${effect}e${exponent}`);
  }

  static parseAmountFromLeHex(leHex: HexString): bigint {
    try {
      return this.readBigUInt128LE(
        leHex.startsWith("0x") ? leHex.slice(0, 34) : `0x${leHex.slice(0, 32)}`
      );
    } catch (error) {
      return BigInt(0);
    }
  }

  static readBigUInt128LE(leHex: HexString): bigint {
    if (leHex.length !== 34 || !leHex.startsWith("0x")) {
      throw new Error("leHex format error");
    }
    const buf = Buffer.from(leHex.slice(2), "hex");

    return (buf.readBigUInt64LE(8) << BigInt(64)) + buf.readBigUInt64LE(0);
  }

  static formatOrderCells(orderCells: Cell[]): Array<DexOrderCellFormat> {
    const formattedOrderCells = orderCells.map((orderCell) => {
      const parsedOrderData = this.parseOrderData(orderCell.data);

      const price = this.getPrice(parsedOrderData.effect, parsedOrderData.exponent);
      const result: DexOrderCellFormat = {
        sUDTAmount: parsedOrderData.sUDTAmount.toString(),
        version: parsedOrderData.version.toString(),
        orderAmount: parsedOrderData.orderAmount.toString(),
        effect: parsedOrderData.effect.toString(),
        exponent: parsedOrderData.exponent.toString(),
        isBid: parsedOrderData.isBid,
        price: price,
        rawData: orderCell,
      };

      return result;
    });
    
    return formattedOrderCells;
  }

  static formatBigUInt128LE(u128: bigint): string {
    const U128_MAX = BigInt(2) ** BigInt(128) - BigInt(1);
    const U128_MIN = BigInt(0);

    if (u128 < U128_MIN) {
      throw new Error(`u128 ${u128} too small`);
    }
    if (u128 > U128_MAX) {
      throw new Error(`u128 ${u128} too large`);
    }
    const buf = Buffer.alloc(16);
    buf.writeBigUInt64LE(u128 & BigInt("0xFFFFFFFFFFFFFFFF"), 0);
    buf.writeBigUInt64LE(u128 >> BigInt(64), 8);
    return `0x${buf.toString("hex")}`;
  }

  static formatOrderData(currentAmount: bigint, version: bigint, orderAmount: bigint, effect: bigint, exponent: number, isBid: boolean): string {
    const udtAmountHex = this.formatBigUInt128LE(currentAmount);
    if (isBid === undefined) {
      return udtAmountHex;
    }

    const versionBuf = Buffer.alloc(8);
    versionBuf.writeBigUInt64LE(version);
    const versionHex = `${versionBuf.toString("hex")}`;
  

    const orderAmountHex = this.formatBigUInt128LE(orderAmount).replace(
      "0x",
      ""
    );

    const effectBuf = Buffer.alloc(8);
    effectBuf.writeBigUInt64LE(effect);
    const effectHex = `${effectBuf.toString("hex")}`;

    const exponentBuf = Buffer.alloc(1);
    exponentBuf.writeInt8(exponent)
    const exponentHex = `${exponentBuf.toString("hex")}`;

    const bidOrAskBuf = Buffer.alloc(1);
    bidOrAskBuf.writeInt8(isBid ? 0 : 1);
    const isBidHex = `${bidOrAskBuf.toString("hex")}`;

    const dataHex = udtAmountHex + versionHex + orderAmountHex + effectHex + exponentHex + isBidHex;
    return dataHex;
  }

  static isOrder(type: { code_hash: string, hash_type: 'data' | 'type', args: string }, output: Output): boolean {
    return output.type
      && output.lock.code_hash === contracts.orderLock.codeHash
      && output.lock.hash_type === contracts.orderLock.hashType
      && output.type.code_hash === type.code_hash
      && output.type.hash_type === type.hash_type
      && output.type.args === type.args
  }

  static roundHalfUp(price: string): string {
    return new BigNumber(price).toFormat(BigNumber.ROUND_HALF_UP);
  }

  static getRequiredDataLength(): number {
    return 102;
  } 

  static getOrderCellCapacitySize(): bigint {
    return 18100000000n
  }

  static getOrdersLimit(): number {
    return 7;
  }

}
