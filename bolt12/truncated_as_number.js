const defaultMaxBytes = 8;
const hexByteLength = hex => hex.length / 2;
const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const isString = n => typeof n === 'string';
const leadingZeroByte = /^00/;

/** Decode a truncated big endian encoded number

  A truncated unsigned integer must be minimally encoded: no leading zero bytes

  {
    hex: <Truncated Big Endian Encoded Number Hex String>
    [max]: <Maximum Encoded Byte Length Number>
  }

  @throws
  <Error>

  @returns
  {
    number: <Unsigned Number String>
  }
*/
module.exports = ({hex, max}) => {
  if (!isString(hex) || !isHex(hex)) {
    throw new Error('ExpectedHexEncodedTruncatedNumberToDecode');
  }

  if (hexByteLength(hex) > (max || defaultMaxBytes)) {
    throw new Error('ExpectedTruncatedNumberWithinMaximumByteLength');
  }

  // Leading zero bytes are never present in a truncated number encoding
  if (leadingZeroByte.test(hex)) {
    throw new Error('ExpectedMinimalEncodingOfTruncatedNumber');
  }

  // An empty encoding represents a zero value
  if (!hex) {
    return {number: Number().toString()};
  }

  return {number: BigInt(`0x${hex}`).toString()};
};
