const parseOrderData = (hex) => {
  const sUDTAmount = parseAmountFromLeHex(hex.slice(0, 34));
  const orderAmount = parseAmountFromLeHex(hex.slice(34, 66));

  let price;
  try {
    const priceBuf = Buffer.from(hex.slice(66, 82), 'hex');
    price = priceBuf.readBigInt64LE();
  } catch (error) {
    price = null;
  }

  const isBid = hex.slice(82, 84) === '00';

  return {
    sUDTAmount,
    orderAmount,
    price,
    isBid,
  };
};

const formatOrderData = (currentAmount, orderAmount, price, isBid) => {
  const udtAmountHex = formatBigUInt128LE(currentAmount);
  if (isBid === undefined) {
    return udtAmountHex;
  }

  const orderAmountHex = formatBigUInt128LE(orderAmount).replace('0x', '');

  const priceBuf = Buffer.alloc(8);
  priceBuf.writeBigUInt64LE(price);
  const priceHex = `${priceBuf.toString('hex')}`;

  const bidOrAskBuf = Buffer.alloc(1);
  bidOrAskBuf.writeInt8(isBid ? 0 : 1);
  const isBidHex = `${bidOrAskBuf.toString('hex')}`;

  const dataHex = udtAmountHex + orderAmountHex + priceHex + isBidHex;
  return dataHex;
};

const parseAmountFromLeHex = (leHex) => {
  try {
    return readBigUInt128LE(leHex.startsWith('0x') ? leHex.slice(0, 34) : `0x${leHex.slice(0, 32)}`);
  } catch (error) {
    return BigInt(0);
  }
};

const readBigUInt128LE = (leHex) => {
  if (leHex.length !== 34 || !leHex.startsWith('0x')) {
    throw new Error('leHex format error');
  }
  const buf = Buffer.from(leHex.slice(2), 'hex');
  return (buf.readBigUInt64LE(8) << BigInt(64)) + buf.readBigUInt64LE(0);
};

const formatOrderCells = (orderCells) => {
  const formattedOrderCells = orderCells.map((orderCell) => {
    const parsedOrderData = parseOrderData(orderCell.data);
    return {
      sUDTAmount: parsedOrderData.sUDTAmount.toString(),
      orderAmount: parsedOrderData.orderAmount.toString(),
      price: parsedOrderData.price.toString(),
      isBid: parsedOrderData.isBid,
      rawData: orderCell,
    };
  });
  return formattedOrderCells;
};

const formatBigUInt128LE = (u128) => {
  const U128_MAX = BigInt(2) ** BigInt(128) - BigInt(1);
  const U128_MIN = BigInt(0);

  if (u128 < U128_MIN) {
    throw new Error(`u128 ${u128} too small`);
  }
  if (u128 > U128_MAX) {
    throw new Error(`u128 ${u128} too large`);
  }
  const buf = Buffer.alloc(16);
  buf.writeBigUInt64LE(u128 & BigInt('0xFFFFFFFFFFFFFFFF'), 0);
  buf.writeBigUInt64LE(u128 >> BigInt(64), 8);
  return `0x${buf.toString('hex')}`;
};

const isValidScript = (codeHash, hashType, args) => (codeHash && hashType && args);

module.exports = {
  parseOrderData,
  formatOrderData,
  parseAmountFromLeHex,
  readBigUInt128LE,
  formatOrderCells,
  formatBigUInt128LE,
  isValidScript,
};
