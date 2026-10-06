const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const isNamePart = n => /^[0-9a-zA-Z\-_.]+$/.test(n);
const isString = n => typeof n === 'string';
const lengthByteLength = 1;
const separator = '@';

/** Decode BIP 353 human readable name bytes

  {
    hex: <Encoded BIP 353 Name Hex String>
  }

  @throws
  <Error>

  @returns
  {
    bip353_name: <BIP 353 Human Readable Name String>
  }
*/
module.exports = ({hex}) => {
  if (!isString(hex) || !isHex(hex)) {
    throw new Error('ExpectedHexEncodedBip353NameToDecode');
  }

  const encoded = hexAsBuffer(hex);

  // The user and the domain are each prefixed with a single length byte
  const cursor = {offset: Number()};

  const [user, domain] = [Number(), Number()].map(() => {
    if (encoded.length < cursor.offset + lengthByteLength) {
      throw new Error('ExpectedLengthByteInEncodedBip353Name');
    }

    const start = cursor.offset + lengthByteLength;
    const end = start + encoded.readUInt8(cursor.offset);

    if (encoded.length < end) {
      throw new Error('ExpectedNamePartBytesInEncodedBip353Name');
    }

    cursor.offset = end;

    return encoded.subarray(start, end).toString('latin1');
  });

  if (cursor.offset !== encoded.length) {
    throw new Error('UnexpectedTrailingBytesInEncodedBip353Name');
  }

  // Only a limited set of ASCII characters are allowed in the name parts
  if (!isNamePart(user) || !isNamePart(domain)) {
    throw new Error('ExpectedValidCharactersInBip353Name');
  }

  return {bip353_name: `${user}${separator}${domain}`};
};
