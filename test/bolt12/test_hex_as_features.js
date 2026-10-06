const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const hexAsFeatures = require('./../../bolt12/hex_as_features');

const tests = [
  {
    args: {},
    description: 'Hex is required',
    error: 'ExpectedHexEncodedFeatureBitsToDecodeFeatures',
  },
  {
    args: {hex: 'zz'},
    description: 'Valid hex is required',
    error: 'ExpectedHexEncodedFeatureBitsToDecodeFeatures',
  },
  {
    args: {hex: '00'.repeat(65536)},
    description: 'Feature bits within the maximum length are required',
    error: 'ExpectedFeatureBitsWithinMaximumLengthToDecodeFeatures',
  },
  {
    args: {hex: ''},
    description: 'Empty features are decoded',
    expected: {features: []},
  },
  {
    args: {hex: '020000'},
    description: 'A feature bit is decoded',
    expected: {
      features: [{bit: 17, is_required: false, type: 'multipath_payments_v0'}],
    },
  },
  {
    args: {hex: '08000000000000000000000000'},
    description: 'An unknown feature bit is decoded',
    expected: {features: [{bit: 99, is_required: false, type: undefined}]},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => hexAsFeatures(args), new Error(error), 'Got error');
    } else {
      strictSame(hexAsFeatures(args), expected, 'Got expected result');
    }

    return end();
  });
});
