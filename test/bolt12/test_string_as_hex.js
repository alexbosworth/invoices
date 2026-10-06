const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const stringAsHex = require('./../../bolt12/string_as_hex');
const vectors = require('./vectors/format_strings.json');

// The BOLT 12 format string test vectors all encode the same offer
const hex = '08030f42400a16416e206578616d706c65206465736372697074696f6e12124' +
  '24f4c5420313220696e6475737472696573162102eec7245d6b7d2ccb30380bfbe2a3648' +
  'cd7a942653f5aa340edcea1f283686619';

const errors = {
  'Mixed case is invalid': 'ExpectedConsistentCaseInBolt12String',
  '+ must be surrounded by bech32 characters':
    'ExpectedJoinBetweenCharactersInBolt12String',
};

const tests = [
  {
    args: {string: 'lno1pg'},
    description: 'A prefix is required',
    error: 'ExpectedPrefixToDecodeBolt12String',
  },
  {
    args: {prefix: 'lno'},
    description: 'A string is required',
    error: 'ExpectedBolt12StringToDecode',
  },
  {
    args: {prefix: 'lno', string: 'lnr1pg'},
    description: 'The prefix must match',
    error: 'UnexpectedPrefixInBolt12String',
  },
  {
    args: {prefix: 'lno', string: 'lno1pgb'},
    description: 'Only bech32 characters are allowed',
    error: 'ExpectedBech32CharactersInBolt12String',
  },
  {
    args: {prefix: 'lno', string: 'lno1pgqcqq'},
    description: 'Padding must be less than a full character',
    error: 'ExpectedValidBech32PaddingInBolt12String',
  },
  {
    args: {prefix: 'lno', string: 'lno1pgqcq'},
    description: 'A short string is decoded',
    expected: {hex: '0a0180'},
  },
  {
    args: {prefix: 'lno', string: 'lno1'},
    description: 'An empty string is decoded',
    expected: {hex: ''},
  },
];

vectors.forEach(vector => {
  return tests.push({
    args: {prefix: 'lno', string: vector.string},
    description: `Format string vector: ${vector.comment}`,
    error: vector.valid ? undefined : errors[vector.comment],
    expected: vector.valid ? {hex} : undefined,
  });
});

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => stringAsHex(args), new Error(error), 'Got expected error');
    } else {
      strictSame(stringAsHex(args), expected, 'Got expected result');
    }

    return end();
  });
});
