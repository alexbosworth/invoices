const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const truncatedAsNumber = require('./../../bolt12/truncated_as_number');

const tests = [
  {
    args: {},
    description: 'Hex is required',
    error: 'ExpectedHexEncodedTruncatedNumberToDecode',
  },
  {
    args: {hex: 'zz'},
    description: 'Valid hex is required',
    error: 'ExpectedHexEncodedTruncatedNumberToDecode',
  },
  {
    args: {hex: '010000000000000000'},
    description: 'A number within the default byte length is required',
    error: 'ExpectedTruncatedNumberWithinMaximumByteLength',
  },
  {
    args: {hex: '0100000000', max: 4},
    description: 'A number within the maximum byte length is required',
    error: 'ExpectedTruncatedNumberWithinMaximumByteLength',
  },
  {
    args: {hex: '0001'},
    description: 'A minimally encoded number is required',
    error: 'ExpectedMinimalEncodingOfTruncatedNumber',
  },
  {
    args: {hex: ''},
    description: 'No bytes is decoded as zero',
    expected: {number: '0'},
  },
  {
    args: {hex: '2710'},
    description: 'Bytes are decoded as a number',
    expected: {number: '10000'},
  },
  {
    args: {hex: 'ffffffffffffffff'},
    description: 'The maximum number is decoded',
    expected: {number: '18446744073709551615'},
  },
  {
    args: {hex: 'ffffffff', max: 4},
    description: 'A number within the maximum byte length is decoded',
    expected: {number: '4294967295'},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => truncatedAsNumber(args), new Error(error), 'Got error');
    } else {
      strictSame(truncatedAsNumber(args), expected, 'Got expected result');
    }

    return end();
  });
});
