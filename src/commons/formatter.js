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

module.exports = {
  parseOrderData,
  parseAmountFromLeHex,
  readBigUInt128LE,
  formatOrderCells,
};
