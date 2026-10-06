const ranges = require('./conf/record_ranges');

const isTypeNumber = n => typeof n === 'string' && /^\d+$/.test(n);
const {keys} = Object;

/** Determine the BOLT 12 range that a TLV record type falls into

  Offer fields are copied into invoice requests, which are copied into
  invoices, so each form has a distinct range of types, plus an experimental
  range. Signature elements are excluded from the signed Merkle tree.

  {
    type: <TLV Record Type Number String>
  }

  @throws
  <Error>

  @returns
  {
    [range]: <Record Type Range Name String>
  }
*/
module.exports = ({type}) => {
  if (!isTypeNumber(type)) {
    throw new Error('ExpectedRecordTypeNumberStringToDetermineRecordRange');
  }

  const number = BigInt(type);

  const isInRange = ({end, start}) => {
    return number >= BigInt(start) && number <= BigInt(end);
  };

  const range = keys(ranges).find(n => ranges[n].some(isInRange));

  return {range};
};
