const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const featuresAsHex = require('./../../bolt12/features_as_hex');

const tests = [
  {
    args: {},
    description: 'Features are required',
    error: 'ExpectedArrayOfFeaturesToEncodeAsHex',
  },
  {
    args: {features: [{}]},
    description: 'Feature bits are required',
    error: 'ExpectedFeatureBitNumbersToEncodeAsHex',
  },
  {
    args: {features: [{bit: -1}]},
    description: 'Unsigned feature bits are required',
    error: 'ExpectedFeatureBitNumbersToEncodeAsHex',
  },
  {
    args: {features: []},
    description: 'No features are encoded as empty',
    expected: {hex: ''},
  },
  {
    args: {features: [{bit: 524280}]},
    description: 'A feature bit must fit in the maximum vector length',
    error: 'ExpectedFeatureBitWithinMaximumToEncodeAsHex',
  },
  {
    args: {features: [{bit: 17}]},
    description: 'A feature bit is encoded',
    expected: {hex: '020000'},
  },
  {
    args: {features: [{bit: 99}]},
    description: 'A high feature bit is encoded',
    expected: {hex: '08000000000000000000000000'},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => featuresAsHex(args), new Error(error), 'Got error');
    } else {
      strictSame(featuresAsHex(args), expected, 'Got expected result');
    }

    return end();
  });
});
