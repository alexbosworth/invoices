const BN = require('bn.js');

const divisors = require('./conf/divisors');
const parseHumanReadableValue = require('./parse_human_readable_value');

const decBase = 10;
const defaultDivisor = '1';
const maxMtokens = new BN(Number.MAX_SAFE_INTEGER).muln(1e3);
const mtokenDivisibility = new BN(1e11, 10);
const valuePattern = /^\d+$/;

/** Given a value string, return the number of millitokens

  {
    amount: <Amount String>
    units: <Amount Divisor String>
  }

  @throws
  <Error> when HRP is invalid

  @returns
  {
    mtokens: <Millitokens String>
  }
*/
module.exports = ({amount, units}) => {
  // Exit early when there is no value
  if (!amount) {
    return {};
  }

  const {divisor, value} = parseHumanReadableValue({amount, units});

  // Exit with error when the value is not numeric
  if (!valuePattern.test(value)) {
    throw new Error('ExpectedValidNumericAmountToParseHrpAsMtokens');
  }

  // Convert the value to a big number to do the big divisions
  const val = new BN(value, decBase);

  // HRPs can encode values smaller than tokens on the chain can represent
  const div = new BN(divisors[divisor] || defaultDivisor, decBase);

  const divided = val.mul(mtokenDivisibility).divmod(div);

  // Exit with error when the amount encodes fractional millitokens
  if (!divided.mod.isZero()) {
    throw new Error('ExpectedWholeMillitokensAmountToParseHrpAsMtokens');
  }

  // Exit with error when the amount exceeds the safe range for tokens
  if (divided.div.gt(maxMtokens)) {
    throw new Error('ExpectedMillitokensWithinSafeRangeToParseHrpAsMtokens');
  }

  return {mtokens: divided.div.toString()};
};
