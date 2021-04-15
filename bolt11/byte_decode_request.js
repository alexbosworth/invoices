const {bech32} = require('bech32');

const currencyCodes = require('./conf/bech32_currency_codes');
const mtokensAsHrp = require('./mtokens_as_hrp');

const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const isHex = n => !!n && !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const {keys} = Object;
const limit = Number.MAX_SAFE_INTEGER;

/** Derive a payment request from request data

  {
    encoded: <Payment Request Details Hex String>
    mtokens: <Millitokens Number String>
    network: <Network Name String>
  }

  @throws
  <Error>

  @returns
  {
    request: <BOLT 11 Encoded Payment Request String>
  }
*/
module.exports = ({encoded, mtokens, network}) => {
  if (!isHex(encoded)) {
    throw new Error('ExpectedHexEncodedPaymentRequestDataToDecodeRequest');
  }

  if (!mtokens) {
    throw new Error('ExpectedAmountToDecodeByteEncodedRequest');
  }

  if (!network) {
    throw new Error('ExpectedNetworkToDecodeByteEncodedRequest');
  }

  const currencyPrefix = keys(currencyCodes)
    .map(code => ({code, network: currencyCodes[code]}))
    .find((n) => n.network === network);

  if (!currencyPrefix) {
    throw new Error('ExpectedKnownNetworkToDecodeByteEncodedRequest');
  }

  const prefix = `ln${currencyPrefix.code}${mtokensAsHrp({mtokens}).hrp}`;
  const words = bech32.toWords(hexAsBuffer(encoded));

  return {request: bech32.encode(prefix, words, limit)};
};
