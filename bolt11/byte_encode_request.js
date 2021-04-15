const {bech32} = require('bech32');

const decodePrefix = require('./decode_prefix');
const hrpAsTokens = require('./hrp_as_tokens');
const wordsAsBuffer = require('./words_as_buffer');

const bufferAsHex = buffer => buffer.toString('hex');
const {decode} = bech32;
const lnPrefix = 'ln';
const maxRequestLength = Number.MAX_SAFE_INTEGER;
const trim = true;

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
  }
*/
module.exports = ({request}) => {
  if (!request) {
    throw new Error('ExpectedPaymentRequestToByteEncode');
  }

  if (request.slice(Number(), lnPrefix.length).toLowerCase() !== lnPrefix) {
    throw new Error('ExpectedLnPrefixToByteEncodePaymentRequest');
  }

  const {prefix, words} = decode(request, maxRequestLength);

  const {amount, network, units} = decodePrefix({prefix});

  const {mtokens} = hrpAsTokens({amount, units});

  const encoded = bufferAsHex(wordsAsBuffer({trim, words}));

  return {encoded, mtokens, network};
};
