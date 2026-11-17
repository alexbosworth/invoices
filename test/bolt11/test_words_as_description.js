const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const descriptionAsWords = require('./../../bolt11/description_as_words');
const hexAsWords = require('./../../bolt11/hex_as_words');
const wordsAsDescription = require('./../../bolt11/words_as_description');

const asWords = description => descriptionAsWords({description}).words;

const tests = [
  {
    args: {},
    description: 'Words are required',
    error: 'ExpectedWordsToInterpretAsDescription',
  },
  {
    args: {words: hexAsWords({hex: 'ff'}).words},
    description: 'Valid UTF-8 bytes are required',
    error: 'ExpectedValidUtf8WordsToInterpretAsDescription',
  },
  {
    args: {words: hexAsWords({hex: 'e282'}).words},
    description: 'Complete UTF-8 sequences are required',
    error: 'ExpectedValidUtf8WordsToInterpretAsDescription',
  },
  {
    args: {words: []},
    description: 'No words are an empty description',
    expected: {description: ''},
  },
  {
    args: {words: asWords('1 cup coffee')},
    description: 'Words are decoded as a description',
    expected: {description: '1 cup coffee'},
  },
  {
    args: {words: asWords('ナンセンス 1杯')},
    description: 'Multi-byte characters are decoded',
    expected: {description: 'ナンセンス 1杯'},
  },
  {
    args: {words: asWords('coffee\nbeans')},
    description: 'A control character is decoded',
    expected: {description: 'coffee\nbeans'},
  },
  {
    args: {words: asWords('coffee\u200dbeans')},
    description: 'A format character is decoded',
    expected: {description: 'coffee\u200dbeans'},
  },
  {
    args: {words: asWords('\ufeffcoffee')},
    description: 'A leading U+FEFF character is preserved',
    expected: {description: '\ufeffcoffee'},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => wordsAsDescription(args), new Error(error), 'Got error');
    } else {
      strictSame(wordsAsDescription(args), expected, 'Got description');
    }

    return end();
  });
});
