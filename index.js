// index.js (Core implementation)
function ff() {
  console.log("ff");
  return 1;
}

function toEodUtc(d, ms = "000") {
  const m = d.getUTCMonth() + 1;
  const mm = `${(m < 10 && "0") || ""}${m}`;
  const dd = `${(d.getUTCDate() < 10 && "0") || ""}${d.getUTCDate()}`;
  return `${d.getUTCFullYear()}-${mm}-${dd}T23:59:59.${ms}Z`;
}

function getFfSymbolCurrency(symbol) {
  const res = symbol.split(":");
  if (res[1] === "TSX") return "CAD";
  return "USD";
}

const defaultCreateOriginal = (row) => JSON.stringify(row);

function ffDividend({ amount }, { symbol, perShare }, paymentDate) {
  const date = `${paymentDate}T23:59:59.000Z`;
  const currency = getFfSymbolCurrency(symbol);
  return {
    externalSymbol: symbol,
    transactionDate: date,
    paymentDate: date,
    processingDate: date,
    symbol,
    symbolCurrency: currency,
    type: "DIVIDEND",
    amount: 0,
    price: 0,
    netAmount: (amount * perShare).toFixed(2) / 1,
    currency,
    description: `${perShare} per share on ${amount}`,
    fees: 0,
    assetType: "EQUITY",
  };
}

function ffBondTransaction({ amount, cost, settlementDate }, { symbol, isin }) {
  const price = ((cost / amount) * 100).toFixed(3) / 1;
  const date = toEodUtc(settlementDate);
  return {
    externalSymbol: isin,
    transactionDate: date,
    settlementDate: date,
    processingDate: date,
    symbol,
    symbolCurrency: "CAD",
    type: "TRADE",
    amount,
    price,
    netAmount: -cost,
    currency: "CAD",
    description: `Buy ${amount} Face Value @ ${price} (${isin})`,
    fees: 0,
    assetType: "FIXED_INCOME",
    instruction: "BUY",
  };
}
function ffExchange({
  assetType,
  currency,
  dateStr,
  description,
  label,
  amount,
  originalData,
  symbol,
  symbolCurrency,
}) {
  return {
    transactionDate: dateStr,
    settlementDate: dateStr,
    processingDate: dateStr,
    symbol,
    symbolCurrency,
    type: "EXCHANGE",
    amount,
    originalData: defaultCreateOriginal(originalData),
    netAmount: 0,
    label,
    currency,
    description,
    assetType,
  };
}

function ffFee({
  assetType,
  currency,
  dateStr,
  description,
  label,
  netAmount,
  originalData,
  symbol,
  symbolCurrency,
}) {
  return {
    transactionDate: dateStr,
    settlementDate: dateStr,
    processingDate: dateStr,
    symbol,
    symbolCurrency,
    type: "FEE",
    amount: 0,
    originalData: defaultCreateOriginal(originalData),
    netAmount,
    label,
    currency,
    description,
    assetType,
  };
}

function ffFeeInKind({
  assetType,
  currency,
  dateStr,
  description,
  label,
  amount,
  originalData,
  symbol,
  symbolCurrency,
}) {
  return {
    transactionDate: dateStr,
    settlementDate: dateStr,
    processingDate: dateStr,
    symbol,
    symbolCurrency,
    type: "FEE_IN_KIND",
    amount,
    originalData: defaultCreateOriginal(originalData),
    netAmount: 0,
    label,
    currency,
    description,
    assetType,
  };
}

function ffFuturesTrade({
  amount,
  assetType,
  currency,
  dateStr,
  description,
  instruction,
  label,
  originalData,
  price,
  symbol,
  symbolCurrency,
}) {
  return {
    transactionDate: dateStr,
    settlementDate: dateStr,
    processingDate: dateStr,
    symbol,
    symbolCurrency,
    type: "TRADE",
    amount,
    originalData: defaultCreateOriginal(originalData),
    price,
    label,
    netAmount: price * amount,
    currency,
    description,
    fees: 0,
    assetType,
    instruction,
  };
}

function ffCoupon({ amount }, { symbol, isin, coupon }, paymentDate) {
  const date = toEodUtc(paymentDate);
  return {
    externalSymbol: symbol,
    transactionDate: date,
    paymentDate: date,
    processingDate: date,
    symbol,
    symbolCurrency: "CAD",
    type: "INTEREST",
    amount: 0,
    price: 0,
    netAmount: (amount * coupon) / 2,
    currency: "CAD",
    description: `S/A Coupon on ${amount} (${isin})`,
    fees: 0,
    assetType: "FIXED_INCOME",
  };
}

function ffInterest({
  assetType,
  currency,
  dateStr,
  description,
  label,
  originalData,
  netAmount,
  symbol,
  symbolCurrency,
}) {
  return {
    transactionDate: dateStr,
    settlementDate: dateStr,
    processingDate: dateStr,
    symbol,
    symbolCurrency,
    type: "INTEREST",
    amount: 0,
    originalData: defaultCreateOriginal(originalData),
    netAmount,
    label,
    currency,
    description,
    assetType,
  };
}

function ffBondRedemption(
  { amount, cost, settlementDate },
  { symbol, isin },
  maturityDate
) {
  const date = toEodUtc(maturityDate, "990");
  return {
    externalSymbol: isin,
    transactionDate: date,
    settlementDate: date,
    processingDate: date,
    symbol,
    symbolCurrency: "CAD",
    type: "BOND_REDEMPTION",
    amount: -amount,
    //price,
    netAmount: amount,
    currency: "CAD",
    description: `Principal Repayment $${amount} (${isin})`,
    fees: 0,
    assetType: "FIXED_INCOME",
  };
}

function ffWireInSymbol({
  accountName,
  amount,
  assetType = undefined,
  currency,
  dateStr,
  description,
  externalSymbol,
  interest,
  label,
  originalData,
  paymentDate,
  price,
  symbol,
  symbolCurrency,
}) {
  return {
    accountName,
    transactionDate: dateStr,
    settlementDate: dateStr,
    processingDate: dateStr,
    symbol,
    symbolCurrency: currency,
    type: "WIRE_IN",
    amount,
    originalData: defaultCreateOriginal(originalData),
    netAmount: 0,
    currency,
    description,
    label,
    assetType,
    price,
  };
}

function ffWireInCurrency(
  {
    dateStr,
    netAmount,
    currency,
    description = "Wire-in transaction to fund bond purchase.",
    label = undefined,
    originalData,
  },
  { forceEodUtc = false } = { forceEodUtc: false }
) {
  const transactionDate = forceEodUtc ? toEodUtc(new Date(dateStr)) : dateStr;
  return {
    transactionDate,
    settlementDate: transactionDate,
    processingDate: transactionDate,
    symbol: "",
    symbolCurrency: currency,
    type: "WIRE_IN",
    amount: 0,
    originalData: defaultCreateOriginal(originalData),
    netAmount: netAmount.toFixed(2) / 1,
    currency: currency,
    description,
    label,
    // description:
    //   "Virtual wire in transaction created by Feather Finance upon initial upload, to represent the initial state of the portfolio.",
    // flags: {
    //   isVirtual: true,
    // },
  };
}
function ffWireOutCurrency(
  {
    dateStr,
    netAmount,
    currency = "CAD",
    description = "Wire-out proceeds not to leave uninvested amounts in portfolio.",
    label = undefined,
    originalData,
  },
  { forceEodUtc = false } = { forceEodUtc: false }
) {
  const transactionDate = forceEodUtc
    ? toEodUtc(new Date(dateStr), "999")
    : dateStr;
  return {
    transactionDate,
    settlementDate: transactionDate,
    processingDate: transactionDate,
    symbol: "",
    symbolCurrency: currency,
    type: "WIRE_OUT",
    amount: 0,
    originalData: defaultCreateOriginal(originalData),
    netAmount: netAmount,
    currency,
    description,
    label,
    // description:
    //   "Virtual wire in transaction created by Feather Finance upon initial upload, to represent the initial state of the portfolio.",
    // flags: {
    //   isVirtual: true,
    // },
  };
}
function ffWireOutSymbol({
  accountName,
  amount,
  assetType = undefined,
  currency,
  dateStr,
  description,
  externalSymbol,
  interest,
  label,
  originalData,
  paymentDate,
  price,
  symbol,
  symbolCurrency,
}) {
  const wireInSymbol = ffWireInSymbol({
    accountName,
    amount,
    assetType,
    currency,
    dateStr,
    description,
    externalSymbol,
    interest,
    label,
    originalData,
    paymentDate,
    price,
    symbol,
    symbolCurrency,
  });
  return { ...wireInSymbol, type: "WIRE_OUT" };
}

// CommonJS export (using module.exports)
module.exports = {
  ff,
  ffBondRedemption,
  ffBondTransaction,
  ffCoupon,
  ffDividend,
  ffExchange,
  ffFee,
  ffFeeInKind,
  ffFuturesTrade,
  ffInterest,
  ffWireInCurrency,
  ffWireInSymbol,
  ffWireOutCurrency,
  ffWireOutSymbol,
  toEodUtc,
};
