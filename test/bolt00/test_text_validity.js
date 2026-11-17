const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const {textValidity} = require('./../../bolt00');

const tests = [
  {
    args: {},
    description: 'Text is required',
    error: 'ExpectedTextStringToDetermineTextValidity',
  },
  {
    args: {text: ''},
    description: 'Empty text is valid',
    expected: {is_readable: true, is_writable: true},
  },
  {
    args: {text: 'ナンセンス 1杯 ₿'},
    description: 'Letters, numbers, spaces and symbols are valid',
    expected: {is_readable: true, is_writable: true},
  },
  {
    args: {text: 'coffee\nbeans'},
    description: 'A control character is not valid',
    expected: {is_readable: false, is_writable: false},
  },
  {
    args: {text: 'coffee\u200dbeans'},
    description: 'A format character is not valid',
    expected: {is_readable: false, is_writable: false},
  },
  {
    args: {text: 'coffee\ud800beans'},
    description: 'A surrogate outside of a surrogate pair is not valid',
    expected: {is_readable: false, is_writable: false},
  },
  {
    args: {text: 'coffee\ue000beans'},
    description: 'A private use character is not valid',
    expected: {is_readable: false, is_writable: false},
  },
  {
    args: {text: 'coffee\u2028beans'},
    description: 'A line separator is not valid',
    expected: {is_readable: false, is_writable: false},
  },
  {
    args: {text: 'coffee\u2029beans'},
    description: 'A paragraph separator is not valid',
    expected: {is_readable: false, is_writable: false},
  },
  {
    args: {text: 'coffee\uffffbeans'},
    description: 'An unassigned character can be read but is not written',
    expected: {is_readable: true, is_writable: false},
  },
  {
    args: {text: 'coffee\u{1fffd}beans'},
    description: 'An unassigned slot held for pictographs can be written',
    expected: {is_readable: true, is_writable: true},
  },
  {
    args: {text: 'coffee\u{1faea}beans'},
    description: 'An emoji that is newer than the runtime can be written',
    expected: {is_readable: true, is_writable: true},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => textValidity(args), new Error(error), 'Got error');
    } else {
      strictSame(textValidity(args), expected, 'Got expected validity');
    }

    return end();
  });
});
