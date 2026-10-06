const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const hexAsUtf8 = require('./../../bolt12/hex_as_utf8');

const tests = [
  {
    args: {},
    description: 'Hex is required',
    error: 'ExpectedHexEncodedBytesToDecodeAsUtf8',
  },
  {
    args: {hex: 'zz'},
    description: 'Valid hex is required',
    error: 'ExpectedHexEncodedBytesToDecodeAsUtf8',
  },
  {
    args: {hex: 'ff'},
    description: 'Valid UTF-8 bytes are required',
    error: 'ExpectedValidUtf8EncodedBytesToDecode',
  },
  {
    args: {hex: 'e282'},
    description: 'Complete UTF-8 sequences are required',
    error: 'ExpectedValidUtf8EncodedBytesToDecode',
  },
  {
    args: {hex: ''},
    description: 'An empty string is decoded',
    expected: {string: ''},
  },
  {
    args: {hex: '5465737420766563746f7273'},
    description: 'A string is decoded',
    expected: {string: 'Test vectors'},
  },
  {
    args: {hex: 'e282bf'},
    description: 'A multi-byte character is decoded',
    expected: {string: '₿'},
  },
  {
    args: {hex: 'efbbbf436f66666565'},
    description: 'A leading U+FEFF character is preserved',
    expected: {string: '\ufeffCoffee'},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => hexAsUtf8(args), new Error(error), 'Got expected error');
    } else {
      strictSame(hexAsUtf8(args), expected, 'Got expected result');
    }

    return end();
  });
});
