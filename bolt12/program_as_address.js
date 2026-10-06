const {bech32} = require('bech32');
const {bech32m} = require('bech32');

const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const hexByteLength = hex => hex.length / 2;
const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const {isInteger} = Number;
const isString = n => typeof n === 'string';
const maxProgramByteLength = 40;
const maxVersion = 16;
const minProgramByteLength = 2;
const versionZeroProgramByteLengths = [20, 32];
const witnessVersionZero = 0;

/** Encode a witness program as a bech32 encoded chain address

  Version zero programs have a bech32 checksum and later versions have a
  bech32m checksum, as defined in BIP 173 and BIP 350.

  {
    prefix: <Human Readable Prefix String>
    program: <Witness Program Hex String>
    version: <Witness Version Number>
  }

  @throws
  <Error>

  @returns
  {
    address: <Chain Address String>
  }
*/
module.exports = ({prefix, program, version}) => {
  if (!prefix || !isString(prefix)) {
    throw new Error('ExpectedPrefixToEncodeWitnessProgramAsChainAddress');
  }

  if (!isString(program) || !isHex(program)) {
    throw new Error('ExpectedHexProgramToEncodeWitnessProgramAsChainAddress');
  }

  if (!isInteger(version) || version < witnessVersionZero) {
    throw new Error('ExpectedWitnessVersionToEncodeProgramAsChainAddress');
  }

  if (version > maxVersion) {
    throw new Error('ExpectedKnownWitnessVersionToEncodeProgramAsChainAddress');
  }

  const length = hexByteLength(program);

  if (version === witnessVersionZero) {
    if (!versionZeroProgramByteLengths.includes(length)) {
      throw new Error('ExpectedVersionZeroProgramByteLengthToEncodeAddress');
    }
  }

  if (length < minProgramByteLength || length > maxProgramByteLength) {
    throw new Error('ExpectedWitnessProgramByteLengthToEncodeChainAddress');
  }

  // Version zero uses the bech32 checksum and later versions use bech32m
  const encoding = version === witnessVersionZero ? bech32 : bech32m;

  const words = [version].concat(bech32.toWords(hexAsBuffer(program)));

  return {address: encoding.encode(prefix, words)};
};
