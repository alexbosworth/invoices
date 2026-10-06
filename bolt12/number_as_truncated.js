const evenLength = hex => hex.length % 2 ? `0${hex}` : hex;
const isNumber = n => typeof n === 'string' && /^\d+$/.test(n);
const maxValue = BigInt('18446744073709551615');

/** Encode a number as truncated big endian bytes

  A truncated unsigned integer omits its leading zero bytes, so zero is empty

  {
    number: <Unsigned Number String>
  }

  @throws
  <Error>

  @returns
  {
    hex: <Truncated Big Endian Encoded Number Hex String>
  }
*/
module.exports = ({number}) => {
  if (!isNumber(number)) {
    throw new Error('ExpectedUnsignedNumberStringToEncodeAsTruncatedNumber');
  }

  const value = BigInt(number);

  if (value > maxValue) {
    throw new Error('ExpectedNumberWithinTruncatedNumberEncodingLimit');
  }

  // Zero has no bytes at all in the truncated encoding
  if (!value) {
    return {hex: String()};
  }

  return {hex: evenLength(value.toString(16))};
};
