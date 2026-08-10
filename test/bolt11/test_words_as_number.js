const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const wordsAsNumber = require('./../../bolt11/words_as_number');

const tests = [
  {
    args: {words: [Number()]},
    description: 'A zero word is converted to zero',
    expected: Number(),
  },
  {
    args: {words: [1, Number()]},
    description: 'Words are converted to a big endian number',
    expected: 32,
  },
  {
    args: {words: [31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31]},
    description: 'A number within the safe integer range is required',
    error: 'ExpectedSafeIntegerValueToConvertWordsToNumber',
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => wordsAsNumber(args), new Error(error), 'Got error');
    } else {
      strictSame(wordsAsNumber(args), expected, 'Got expected number');
    }

    return end();
  });
});
