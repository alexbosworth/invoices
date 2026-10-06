const decoder = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true});
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const isString = n => typeof n === 'string';

/** Decode hex encoded bytes as a UTF-8 string

  Invalid UTF-8 byte sequences are rejected rather than replaced

  {
    hex: <UTF-8 Bytes Hex String>
  }

  @throws
  <Error>

  @returns
  {
    string: <Decoded UTF-8 String>
  }
*/
module.exports = ({hex}) => {
  if (!isString(hex) || !isHex(hex)) {
    throw new Error('ExpectedHexEncodedBytesToDecodeAsUtf8');
  }

  // Buffer decoding replaces invalid bytes, a fatal decoder rejects them
  try {
    return {string: decoder.decode(hexAsBuffer(hex))};
  } catch (err) {
    throw new Error('ExpectedValidUtf8EncodedBytesToDecode');
  }
};
