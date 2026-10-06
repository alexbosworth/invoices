const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const hexAsBip353Name = require('./../../bolt12/hex_as_bip353_name');

const tests = [
  {
    args: {},
    description: 'Hex is required',
    error: 'ExpectedHexEncodedBip353NameToDecode',
  },
  {
    args: {hex: 'zz'},
    description: 'Valid hex is required',
    error: 'ExpectedHexEncodedBip353NameToDecode',
  },
  {
    args: {hex: ''},
    description: 'A name length byte is required',
    error: 'ExpectedLengthByteInEncodedBip353Name',
  },
  {
    args: {hex: '05616c6963'},
    description: 'Name bytes are required',
    error: 'ExpectedNamePartBytesInEncodedBip353Name',
  },
  {
    args: {hex: '05616c696365'},
    description: 'A domain length byte is required',
    error: 'ExpectedLengthByteInEncodedBip353Name',
  },
  {
    args: {hex: '05616c6963650b6578616d706c652e636f6d00'},
    description: 'Trailing bytes are not allowed',
    error: 'UnexpectedTrailingBytesInEncodedBip353Name',
  },
  {
    args: {hex: '000b6578616d706c652e636f6d'},
    description: 'A non-empty name is required',
    error: 'ExpectedValidCharactersInBip353Name',
  },
  {
    args: {hex: '05616c69406502ff00'},
    description: 'Allowed characters are required',
    error: 'ExpectedValidCharactersInBip353Name',
  },
  {
    args: {hex: '05616c6963650b6578616d706c652e636f6d'},
    description: 'A name is decoded',
    expected: {bip353_name: 'alice@example.com'},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => hexAsBip353Name(args), new Error(error), 'Got error');
    } else {
      strictSame(hexAsBip353Name(args), expected, 'Got expected result');
    }

    return end();
  });
});
