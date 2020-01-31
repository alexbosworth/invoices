const amountMultiplierPattern = /^[^munp0-9]$/;
const divisibilityMarkerLen = 1;
const divisibilityPattern = /^[munp]$/;

/** Parse human readable value into a value number and divisor

  {
    amount: <Amount String>
    units: <Amount Divisor String>
  }

  @throws
  <Error>

  @returns
  {
    divisor: <Payment Request Value Divisor String>
    value: <Payment Request Value String>
  }
*/
module.exports = ({amount, units}) => {
  const hrp = `${amount}${units}`;

  // Exit early when there is a divide marker
  if (hrp.slice(-divisibilityMarkerLen).match(divisibilityPattern)) {
    return {
      divisor: hrp.slice(-divisibilityMarkerLen),
      value: hrp.slice(Number(), -divisibilityMarkerLen),
    };
  }

  if (hrp.slice(-divisibilityMarkerLen).match(amountMultiplierPattern)) {
    throw new Error('InvalidAmountMultiplier');
  }

  return {value: hrp};
};
