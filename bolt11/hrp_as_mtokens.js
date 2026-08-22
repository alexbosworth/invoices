const divisors = require('./conf/divisors');
const parseHumanReadableValue = require('./parse_human_readable_value');

const defaultDivisor = '1';
const maxMtokens = BigInt(Number.MAX_SAFE_INTEGER) * BigInt(1e3);
const mtokenDivisibility = BigInt(1e11);
const none = BigInt(Number());
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
  const val = BigInt(value);

  // HRPs can encode values smaller than tokens on the chain can represent
  const div = BigInt(divisors[divisor] || defaultDivisor);

  const mtokens = val * mtokenDivisibility / div;

  // Exit with error when the amount encodes fractional millitokens
  if (val * mtokenDivisibility % div !== none) {
    throw new Error('ExpectedWholeMillitokensAmountToParseHrpAsMtokens');
  }

  // Exit with error when the amount exceeds the safe range for tokens
  if (mtokens > maxMtokens) {
    throw new Error('ExpectedMillitokensWithinSafeRangeToParseHrpAsMtokens');
  }

  return {mtokens: mtokens.toString()};
};
