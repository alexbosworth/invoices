const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const bip353NameAsHex = require('./../../bolt12/bip353_name_as_hex');

const tests = [
  {
    args: {},
    description: 'A name is required',
    error: 'ExpectedBip353NameStringToEncodeAsHex',
  },
  {
    args: {bip353_name: 'alice'},
    description: 'A name with a domain is required',
    error: 'ExpectedUserAtDomainBip353NameToEncodeAsHex',
  },
  {
    args: {bip353_name: '₿alice@example.com'},
    description: 'Only allowed characters are permitted',
    error: 'ExpectedUserAtDomainBip353NameToEncodeAsHex',
  },
  {
    args: {bip353_name: `${'a'.repeat(256)}@example.com`},
    description: 'Name parts must fit within a length byte',
    error: 'ExpectedBip353NamePartsWithinMaximumLengthToEncode',
  },
  {
    args: {bip353_name: 'alice@example.com'},
    description: 'A name is encoded',
    expected: {hex: '05616c6963650b6578616d706c652e636f6d'},
  },
  {
    args: {bip353_name: 'a-b_c.d@Ex4mple.com'},
    description: 'A name with all allowed character types is encoded',
    expected: {hex: '07612d625f632e640b4578346d706c652e636f6d'},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => bip353NameAsHex(args), new Error(error), 'Got error');
    } else {
      strictSame(bip353NameAsHex(args), expected, 'Got expected result');
    }

    return end();
  });
});
