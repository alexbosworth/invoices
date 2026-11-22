const {bech32} = require('bech32');

const decodePrefix = require('./decode_prefix');
const hrpAsMtokens = require('./hrp_as_mtokens');
const wordsAsBuffer = require('./words_as_buffer');

const attempt = method => { try { return method(); } catch (err) { return; } };
const bufferAsHex = buffer => buffer.toString('hex');
const {decode} = bech32;
const isAscii = n => /^[\x21-\x7e]+$/.test(n);
const isString = n => typeof n === 'string';
const lnPrefix = 'ln';
const maxRequestLength = Number.MAX_SAFE_INTEGER;

/** Derive bytes for payment request details

  {
    request: <BOLT 11 Encoded Payment Request String>
  }

  @throws
  <Error>

  @returns
  {
    encoded: <Payment Request Details Hex String>
    mtokens: <Millitokens Number String>
    network: <Network Name String>
    words: <Word Length Number>
  }
*/
module.exports = ({request}) => {
  if (!request || !isString(request)) {
    throw new Error('ExpectedPaymentRequestToByteEncode');
  }

  if (request.slice(Number(), lnPrefix.length).toLowerCase() !== lnPrefix) {
    throw new Error('ExpectedLnPrefixToByteEncodePaymentRequest');
  }

  // Non-ASCII characters like the Kelvin sign can lowercase into bech32 chars
  if (!isAscii(request)) {
    throw new Error('ExpectedAsciiCharactersToByteEncodePaymentRequest');
  }

  // The 7089 character limit of signing and parsing is not applied here, as
  // this only changes the encoding of a request that already exists

  // Decoding fails on a bad checksum, mixed case or a non-bech32 character
  const decoded = attempt(() => decode(request, maxRequestLength));

  if (!decoded) {
    throw new Error('ExpectedBech32EncodedRequestToByteEncode');
  }

  const {prefix, words} = decoded;

  const {amount, network, units} = decodePrefix({prefix});

  // Decode the request amount millitokens requested amount
  const {mtokens} = hrpAsMtokens({amount, units});

  // Encode the words as binary data in a  hex string
  const encoded = bufferAsHex(wordsAsBuffer({words}));

  return {encoded, network, mtokens, words: words.length};
};
