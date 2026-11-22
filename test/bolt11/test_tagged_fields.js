const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const taggedFields = require('./../../bolt11/tagged_fields');

const tests = [
  {
    args: {words: [13, 0]},
    description: 'A field has a type and two words of data length',
    error: 'ExpectedCompleteTaggedFieldInPaymentRequest',
  },
  {
    args: {words: [13, 0, 2, 31]},
    description: 'A field data length cannot run past the end of the words',
    error: 'ExpectedCompleteTaggedFieldInPaymentRequest',
  },
  {
    args: {words: []},
    description: 'No words have no tagged fields',
    expected: {fields: []},
  },
  {
    args: {words: [13, 0, 2, 31, 30, 6, 0, 0]},
    description: 'Words are split into tagged fields',
    expected: {
      fields: [{code: 13, words: [31, 30]}, {code: 6, words: []}],
    },
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => taggedFields(args), new Error(error), 'Got expected error');
    } else {
      strictSame(taggedFields(args), expected, 'Got expected tagged fields');
    }

    return end();
  });
});
