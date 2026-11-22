const {bech32} = require('bech32');

const bufferAsHex = buffer => buffer.toString('hex');
const charset = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const {from} = Array;
const {fromWords} = bech32;
const isAscii = n => /^[\x21-\x7e]+$/.test(n);
const isConsistentCase = n => isLowerCase(n) || isUpperCase(n);
const isLowerCase = n => n === n.toLowerCase();
const isString = n => typeof n === 'string';
const isUpperCase = n => n === n.toUpperCase();
const joinPattern = /\+\s*/;
const maxDataLength = Math.ceil(32768 * 8 / 5);
const separator = '1';

/** Decode a BOLT 12 bech32 style string into its hex encoded data

  BOLT 12 strings have no checksum and may be split with `+` characters that
  are optionally followed by whitespace.

  {
    prefix: <Expected Human Readable Prefix String>
    string: <BOLT 12 Encoded String>
  }

  @throws
  <Error>

  @returns
  {
    hex: <Data Hex String>
  }
*/
module.exports = ({prefix, string}) => {
  if (!prefix || !isString(prefix)) {
    throw new Error('ExpectedPrefixToDecodeBolt12String');
  }

  if (!string || !isString(string)) {
    throw new Error('ExpectedBolt12StringToDecode');
  }

  // A plus sign and following whitespace can join parts of a split string
  const parts = string.split(joinPattern);

  // A join is only allowed between two encoded characters
  if (!parts.every(n => !!n.length)) {
    throw new Error('ExpectedJoinBetweenCharactersInBolt12String');
  }

  const joined = parts.join(String());

  // A stream is at most 32768 bytes and a character encodes 5 bits of it
  if (joined.length > `${prefix}${separator}`.length + maxDataLength) {
    throw new Error('ExpectedBolt12StringWithinMaximumLength');
  }

  // The string is either entirely upper case or entirely lower case
  if (!isConsistentCase(joined)) {
    throw new Error('ExpectedConsistentCaseInBolt12String');
  }

  const lowercase = joined.toLowerCase();

  if (!lowercase.startsWith(`${prefix}${separator}`)) {
    throw new Error('UnexpectedPrefixInBolt12String');
  }

  // Non-ASCII characters like the Kelvin sign can lowercase into bech32 chars
  if (!isAscii(joined)) {
    throw new Error('ExpectedAsciiCharactersInBolt12String');
  }

  const data = lowercase.slice(`${prefix}${separator}`.length);

  const words = from(data).map(char => charset.indexOf(char));

  if (!words.every(word => word >= Number())) {
    throw new Error('ExpectedBech32CharactersInBolt12String');
  }

  // Trailing bits must be zero and fewer than a full character
  try {
    return {hex: bufferAsHex(Buffer.from(fromWords(words)))};
  } catch (err) {
    throw new Error('ExpectedValidBech32PaddingInBolt12String');
  }
};
