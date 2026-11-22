const bech32CurrencyCodes = require('./conf/bech32_currency_codes');

const {hasOwn} = Object;
const simplePrefixPattern = /^ln(\S+)$/;
const standardPrefixPattern = /^ln([a-zA-Z]+?)(\d*)([a-zA-Z]?)$/;

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

  // Only own keys are currency codes, names like constructor are inherited
  if (!hasOwn(bech32CurrencyCodes, currency)) {
    throw new Error('UnknownCurrencyCodeInPaymentRequest');
  }

  return {amount, units, network: bech32CurrencyCodes[currency]};
};
