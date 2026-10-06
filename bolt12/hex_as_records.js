const {decodeTlvStream} = require('bolt01');

const hexByteLength = hex => hex.length / 2;
const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const isString = n => typeof n === 'string';
const maxByteLength = 32768;

/** Decode a hex encoded TLV stream into its records

  Record types in a TLV stream must be strictly increasing

  A stream is limited to the maximum size of an onion message, 32768 bytes

  {
    hex: <TLV Stream Hex String>
  }

  @throws
  <Error>

  @returns
  {
    records: [{
      type: <Record Type Number String>
      value: <Record Value Hex String>
    }]
  }
*/
module.exports = ({hex}) => {
  if (!isString(hex) || !isHex(hex)) {
    throw new Error('ExpectedHexEncodedTlvStreamToDecodeRecords');
  }

  if (hexByteLength(hex) > maxByteLength) {
    throw new Error('ExpectedShorterTlvStreamToDecodeRecords');
  }

  const decoded = {};

  try {
    decoded.records = decodeTlvStream({encoded: hex.toLowerCase()}).records;
  } catch (err) {
    throw new Error('ExpectedValidTlvStreamToDecodeRecords');
  }

  // Types must ascend, which also means that a type cannot be repeated
  const isOrdered = decoded.records.every((record, i, records) => {
    const previous = records[i - [record].length];

    return !previous || BigInt(record.type) > BigInt(previous.type);
  });

  if (!isOrdered) {
    throw new Error('ExpectedAscendingRecordTypesInTlvStream');
  }

  return {records: decoded.records.map(({type, value}) => ({type, value}))};
};
