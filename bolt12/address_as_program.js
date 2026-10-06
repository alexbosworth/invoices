const {bech32} = require('bech32');
const {bech32m} = require('bech32');

const bufferAsHex = buffer => buffer.toString('hex');
const isString = n => typeof n === 'string';
const maxProgramByteLength = 40;
const maxVersion = 16;
const minProgramByteLength = 2;
const versionZeroProgramByteLengths = [20, 32];
const witnessVersionZero = 0;

/** Decode a bech32 encoded witness program chain address

  Version zero programs have a bech32 checksum and later versions have a
  bech32m checksum, as defined in BIP 173 and BIP 350.

  {
    address: <Chain Address String>
  }

  @throws
  <Error>

  @returns
  {
    prefix: <Human Readable Prefix String>
    program: <Witness Program Hex String>
    version: <Witness Version Number>
  }
*/
module.exports = ({address}) => {
  if (!address || !isString(address)) {
    throw new Error('ExpectedChainAddressStringToDecodeWitnessProgram');
  }

  // Decode with a checksum type, giving nothing when the checksum is invalid
  const decode = encoding => {
    try {
      return encoding.decode(address);
    } catch (err) {
      return undefined;
    }
  };

  const decodedBech32 = decode(bech32);
  const decodedBech32m = decode(bech32m);

  const decoded = decodedBech32 || decodedBech32m;

  if (!decoded) {
    throw new Error('ExpectedBech32EncodedChainAddressToDecodeWitnessProgram');
  }

  const [version, ...words] = decoded.words;

  if (version === undefined) {
    throw new Error('ExpectedWitnessVersionInChainAddress');
  }

  if (version > maxVersion) {
    throw new Error('ExpectedKnownWitnessVersionInChainAddress');
  }

  // Version zero uses the bech32 checksum and later versions use bech32m
  if ((version === witnessVersionZero) !== !!decodedBech32) {
    throw new Error('ExpectedChecksumTypeForWitnessVersionInChainAddress');
  }

  const program = {};

  try {
    program.bytes = Buffer.from(bech32.fromWords(words));
  } catch (err) {
    throw new Error('ExpectedValidWitnessProgramPaddingInChainAddress');
  }

  const {length} = program.bytes;

  if (version === witnessVersionZero) {
    if (!versionZeroProgramByteLengths.includes(length)) {
      throw new Error('ExpectedVersionZeroProgramByteLengthInChainAddress');
    }
  }

  if (length < minProgramByteLength || length > maxProgramByteLength) {
    throw new Error('ExpectedWitnessProgramByteLengthInChainAddress');
  }

  return {
    version,
    prefix: decoded.prefix,
    program: bufferAsHex(program.bytes),
  };
};
