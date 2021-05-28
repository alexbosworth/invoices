const {multipliers} = require('./conf/multipliers');

const isEmpty = n => !n || n === '0';
const isNumeric = n => /^\d+$/.test(n);
const asPico = amount => (amount * BigInt(10)).toString() + 'p';
const isString = n => typeof n === 'string';

/** Get Tokens as the Human Readable Part of a BOLT11 payment request

  {
    [mtokens]: <Millitokens Number> // default: 0
  }

  @throws
  <Error>

  @returns
  {
    hrp: <Human Readable Part String>
  }
*/
module.exports = ({mtokens}) => {
  // Exit early when there are no mtokens
  if (isEmpty(mtokens)) {
    return {hrp: String()};
  }

  if (!isString(mtokens)) {
    throw new Error('ExpectedStringValueToConvertMtokensToHrp');
  }

  if (!isNumeric(mtokens)) {
    throw new Error('ExpectedNumericStringValueToConvertMtokensToHrp');
  }

  const amount = BigInt(mtokens);

  // Map the amount into multiplier representations and select the shortest
  const [hrp] = multipliers
    .map(({letter, value}) => ({letter, value: BigInt(value)}))
    .filter(({value}) => !(amount % value))
    .map(({letter, value}) => `${amount / value}${letter}`)
    .sort((a, b) => a.length - b.length);

  // The smallest amounts do not have any multiplier
  if (!hrp) {
    return {hrp: asPico(amount)};
  }

  return {hrp};
};
