const {createHash} = require('crypto');

const bufferAsHex = buffer => buffer.toString('hex');
const {concat} = Buffer;
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const isString = n => typeof n === 'string';
const sha256 = data => createHash('sha256').update(data).digest();

/** BIP 340 style tagged hash of data

  H(tag, data) is SHA256(SHA256(tag) || SHA256(tag) || data)

  {
    data: <Data To Hash Hex String>
    tag: <Hash Tag Hex String>
  }

  @throws
  <Error>

  @returns
  {
    hash: <Tagged Hash Hex String>
  }
*/
module.exports = ({data, tag}) => {
  if (!isString(data) || !isHex(data)) {
    throw new Error('ExpectedHexEncodedDataToCalculateTaggedHash');
  }

  if (!tag || !isString(tag) || !isHex(tag)) {
    throw new Error('ExpectedHexEncodedTagToCalculateTaggedHash');
  }

  const tagHash = sha256(hexAsBuffer(tag));

  const hash = sha256(concat([tagHash, tagHash, hexAsBuffer(data)]));

  return {hash: bufferAsHex(hash)};
};
