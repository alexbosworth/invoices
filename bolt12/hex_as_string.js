const {bech32} = require('bech32');

const charset = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const isString = n => typeof n === 'string';
const separator = '1';
const {toWords} = bech32;

/** Encode hex data as a BOLT 12 bech32 style string

  BOLT 12 strings are bech32 encoded data with a prefix but without a checksum

  {
    hex: <Data Hex String>
    prefix: <Human Readable Prefix String>
  }

  @throws
  <Error>

  @returns
  {
    string: <BOLT 12 Encoded String>
  }
*/
module.exports = ({hex, prefix}) => {
  if (!isString(hex) || !isHex(hex)) {
    throw new Error('ExpectedHexDataToEncodeAsBolt12String');
  }

  if (!prefix || !isString(prefix)) {
    throw new Error('ExpectedPrefixToEncodeBolt12String');
  }

  const data = toWords(hexAsBuffer(hex)).map(word => charset[word]);

  return {string: `${prefix}${separator}${data.join(String())}`};
};
