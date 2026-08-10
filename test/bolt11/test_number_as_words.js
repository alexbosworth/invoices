const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');

const numberAsWords = require('./../../bolt11/number_as_words');

const tests = [
  {
    args: {},
    description: 'No number yields no words',
    expected: {},
  },
  {
    args: {number: 0},
    description: 'Zero is a single zero word',
    expected: {words: [0]},
  },
  {
    args: {number: 31},
    description: 'The largest single word number',
    expected: {words: [31]},
  },
  {
    args: {number: 32},
    description: 'Crossing the word boundary takes two words',
    expected: {words: [1, 0]},
  },
  {
    args: {number: 144},
    description: 'A cltv delta number is converted to words',
    expected: {words: [4, 16]},
  },
  {
    args: {number: 604800},
    description: 'A week of expiration seconds is converted to words',
    expected: {words: [18, 14, 20, 0]},
  },
];

tests.forEach(({args, description, expected}) => {
  return test(description, (t, end) => {
    strictSame(numberAsWords(args), expected, 'Got expected words');

    return end();
  });
});
