const BN = require('bn.js');

const dividedRemainder = require('./divided_remainder');
const divisors = require('./conf/divisors');
const parseHumanReadableValue = require('./parse_human_readable_value');

const decBase = 10;
const max = 3; // Maximum total divisibility
const tokenDivisibility = new BN(1e8, 10);
const valuePattern = /^\d+$/;
const zeros = '000';

/** Given a value string, return the number of millitokens

  {
    amount: <Amount String>
    units: <Amount Divisor String>
  }

  @throws
  <Error> when HRP is invalid

  @returns
  {
    mtokens: <Complete Channel Tokens Big Number String>
  }
*/
module.exports = ({amount, units}) => {
  // Exit early when there is no value
  if (!amount) {
    return {};
  }

  const {divisor, value} = parseHumanReadableValue({amount, units});

  // Exit with error when the value is not numeric
  if (!value.match(valuePattern)) {
    throw new Error('InvalidAmountFoundWhenParsingHrpAsTokens');
  }

  const val = new BN(value, decBase);

  // Exit early when there is no divisor and we alraedy have the full value
  if (!divisor) {
    return {mtokens: val.mul(tokenDivisibility).toString()};
  }

  // HRPs can encode values smaller than tokens on the chain can represent
  const div = new BN(divisors[divisor], decBase);

  const divmod = val.mul(tokenDivisibility).divmod(div);

  const {mod} = divmod;

  const isMillitokens = mod.toString() !== Number().toString();

  const decimals = !isMillitokens ? zeros : dividedRemainder({div, mod, max});

  return {mtokens: `${divmod.div.toString()}${decimals}`};
};
