const bech32CurrencyCodes = require('./conf/bech32_currency_codes');

const simplePrefixPattern = /^ln(\S+)$/;
const standardPrefixPattern = /^ln(\S+?)(\d*)([a-zA-Z]?)$/;

/** Decode payment request prefix

  {
    prefix: <Payment Request String>
  }

  @throws
  <Error>

  @returns
  {
    amount: <Amount String>
    network: <Network Name String>
    units: <Amount Units String>
  }
*/
module.exports = ({prefix}) => {
  const matches = prefix.match(standardPrefixPattern);

  if (!matches || !matches.length) {
    throw new Error('InvalidPaymentRequestPrefix');
  }

  const [,, type] = matches;

  const prefixElements = !type ?  prefix.match(simplePrefixPattern) : matches;

  const [, currency, amount, units] = prefixElements;

  const network = bech32CurrencyCodes[currency];

  if (!network) {
    throw new Error('UnknownCurrencyCodeInPaymentRequest');
  }

  return {amount, network, units};
};
