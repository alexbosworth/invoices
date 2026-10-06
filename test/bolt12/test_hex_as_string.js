const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const hexAsString = require('./../../bolt12/hex_as_string');

const tests = [
  {
    args: {prefix: 'lno'},
    description: 'Hex data is required',
    error: 'ExpectedHexDataToEncodeAsBolt12String',
  },
  {
    args: {hex: 'zz', prefix: 'lno'},
    description: 'Valid hex data is required',
    error: 'ExpectedHexDataToEncodeAsBolt12String',
  },
  {
    args: {hex: '0a0180'},
    description: 'A prefix is required',
    error: 'ExpectedPrefixToEncodeBolt12String',
  },
  {
    args: {hex: '0a0180', prefix: 'lno'},
    description: 'Hex data is encoded as a string',
    expected: {string: 'lno1pgqcq'},
  },
  {
    args: {hex: '', prefix: 'lnr'},
    description: 'Empty hex data is encoded as a string',
    expected: {string: 'lnr1'},
  },
  {
    args: {
      hex: '162102eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f2836' +
        '86619',
      prefix: 'lno',
    },
    description: 'A minimal offer is encoded as a string',
    expected: {
      string: 'lno1zcss9mk8y3wkklfvevcrszlmu23kfrxh49px20665dqwmn4p72pksese',
    },
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => hexAsString(args), new Error(error), 'Got expected error');
    } else {
      strictSame(hexAsString(args), expected, 'Got expected result');
    }

    return end();
  });
});
