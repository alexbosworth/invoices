const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const numberAsTruncated = require('./../../bolt12/number_as_truncated');

const tests = [
  {
    args: {},
    description: 'A number is required',
    error: 'ExpectedUnsignedNumberStringToEncodeAsTruncatedNumber',
  },
  {
    args: {number: 1},
    description: 'A number string is required',
    error: 'ExpectedUnsignedNumberStringToEncodeAsTruncatedNumber',
  },
  {
    args: {number: '18446744073709551616'},
    description: 'A number within the 64 bit limit is required',
    error: 'ExpectedNumberWithinTruncatedNumberEncodingLimit',
  },
  {
    args: {number: '0'},
    description: 'Zero is encoded as no bytes',
    expected: {hex: ''},
  },
  {
    args: {number: '1'},
    description: 'A small number is encoded as a single byte',
    expected: {hex: '01'},
  },
  {
    args: {number: '10000'},
    description: 'A number is encoded as truncated bytes',
    expected: {hex: '2710'},
  },
  {
    args: {number: '18446744073709551615'},
    description: 'The maximum number is encoded as eight bytes',
    expected: {hex: 'ffffffffffffffff'},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => numberAsTruncated(args), new Error(error), 'Got error');
    } else {
      strictSame(numberAsTruncated(args), expected, 'Got expected result');
    }

    return end();
  });
});
