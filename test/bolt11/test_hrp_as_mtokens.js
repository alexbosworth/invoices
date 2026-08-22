const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const hrpAsMtokens = require('./../../bolt11/hrp_as_mtokens');

const tests = [
  {
    args: {amount: '', units: ''},
    description: 'Amount is optional, it indicates zero',
    expected: {},
  },
  {
    args: {amount: 'abcd', units: 'p'},
    description: 'Amount should be a number',
    error: 'ExpectedValidNumericAmountToParseHrpAsMtokens',
  },
  {
    args: {amount: '2500', units: 'x'},
    description: 'A known amount multiplier is required',
    error: 'InvalidAmountMultiplier',
  },
  {
    args: {amount: '1', units: ''},
    description: 'BTC is the basic unit with no divisor',
    expected: {mtokens: (1e11).toString()},
  },
  {
    args: {amount: '10', units: 'p'},
    description: 'Pico is the smallest unit and 10 of them is 1 mtoken',
    expected: {mtokens: '1'},
  },
  {
    args: {amount: '1', units: 'p'},
    description: 'Pico amounts that encode fractional millitokens fail',
    error: 'ExpectedWholeMillitokensAmountToParseHrpAsMtokens',
  },
  {
    args: {amount: '2500000001', units: 'p'},
    description: 'Pico amounts must encode whole millitokens',
    error: 'ExpectedWholeMillitokensAmountToParseHrpAsMtokens',
  },
  {
    args: {amount: '10', units: 'n'},
    description: 'Nano tokens are similar to pico but 10 of them is 1 token',
    expected: {mtokens: '1000'},
  },
  {
    args: {amount: '100', units: 'n'},
    description: 'More nano tokens',
    expected: {mtokens: '10000'},
  },
  {
    args: {amount: '1234567890', units: 'n'},
    description: 'A ton of nano tokens',
    expected: {mtokens: '123456789000'},
  },
  {
    args: {amount: '1', units: 'u'},
    description: 'Move up to micro tokens',
    expected: {mtokens: '100000'},
  },
  {
    args: {amount: '2500', units: 'u'},
    description: 'A substantial number of micro tokens: 0.00250000000',
    expected: {mtokens: '250000000'},
  },
  {
    args: {amount: '20', units: 'm'},
    description: 'Higher amounts use milli units',
    expected: {mtokens: '2000000000'},
  },
  {
    args: {amount: '9678785340', units: 'p'},
    description: 'Precise amounts use pico units: 0.00967878534',
    expected: {mtokens: '967878534'},
  },
  {
    args: {amount: '90071992547409910000', units: 'p'},
    description: 'The largest safe amount of tokens is supported',
    expected: {mtokens: '9007199254740991000'},
  },
  {
    args: {amount: '90071992547409910010', units: 'p'},
    description: 'Amounts of millitokens beyond safe token values fail',
    error: 'ExpectedMillitokensWithinSafeRangeToParseHrpAsMtokens',
  },
  {
    args: {amount: '100000000', units: ''},
    description: 'Whole token amounts beyond safe token values fail',
    error: 'ExpectedMillitokensWithinSafeRangeToParseHrpAsMtokens',
  },
  {
    args: {amount: '0', units: ''},
    description: 'A zero amount encodes zero millitokens',
    expected: {mtokens: '0'},
  },
  {
    args: {amount: '007', units: 'm'},
    description: 'Leading zeros in an amount are supported',
    expected: {mtokens: '700000000'},
  },
  {
    args: {amount: '1.5', units: 'm'},
    description: 'Decimal amounts are not valid numeric amounts',
    error: 'ExpectedValidNumericAmountToParseHrpAsMtokens',
  },
  {
    args: {amount: '123456789012345670', units: 'p'},
    description: 'Amounts beyond float precision are exactly represented',
    expected: {mtokens: '12345678901234567'},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => hrpAsMtokens(args), new Error(error), 'Got expected error');
    } else {
      const res = hrpAsMtokens(args);

      strictSame(res, expected, 'Mtokens derived from hrp');
    }

    return end();
  });
});
