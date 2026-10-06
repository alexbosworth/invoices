const bufferAsHex = buffer => buffer.toString('hex');
const byteAsBuffer = byte => Buffer.from([byte]);
const {concat} = Buffer;
const isString = n => typeof n === 'string';
const isUserAtDomain = n => /^[0-9a-zA-Z\-_.]+@[0-9a-zA-Z\-_.]+$/.test(n);
const maxPartByteLength = 255;
const separator = '@';
const utf8AsBuffer = utf8 => Buffer.from(utf8, 'utf8');

/** Encode a BIP 353 human readable name as bytes

  {
    bip353_name: <BIP 353 Human Readable Name String>
  }

  @throws
  <Error>

  @returns
  {
    hex: <Encoded BIP 353 Name Hex String>
  }
*/
module.exports = args => {
  if (!isString(args.bip353_name)) {
    throw new Error('ExpectedBip353NameStringToEncodeAsHex');
  }

  if (!isUserAtDomain(args.bip353_name)) {
    throw new Error('ExpectedUserAtDomainBip353NameToEncodeAsHex');
  }

  const [user, domain] = args.bip353_name.split(separator);

  const parts = [utf8AsBuffer(user), utf8AsBuffer(domain)];

  if (!parts.every(n => n.length <= maxPartByteLength)) {
    throw new Error('ExpectedBip353NamePartsWithinMaximumLengthToEncode');
  }

  const encoded = parts.map(n => concat([byteAsBuffer(n.length), n]));

  return {hex: bufferAsHex(concat(encoded))};
};
