const {test} = require('@alexbosworth/tap');

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
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, ({end, strictSame, throws}) => {
    if (!!error) {
      throws(() => hrpAsMtokens(args), new Error(error), 'Got expected error');
    } else {
      const res = hrpAsMtokens(args);

      strictSame(res, expected, 'Mtokens derived from hrp');
    }

    return end();
  });
});
