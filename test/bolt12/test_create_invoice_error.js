const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const {createInvoiceError} = require('./../../');

const tests = [
  {
    args: {erroneous_field: 82, message: 'message'},
    description: 'An erroneous field type number string is required',
    error: 'ExpectedErroneousFieldTypeNumberToCreateInvoiceError',
  },
  {
    args: {},
    description: 'An error message is required',
    error: 'ExpectedErrorMessageStringToCreateInvoiceError',
  },
  {
    args: {message: 'message', suggested_value: 1},
    description: 'A suggested value string is required',
    error: 'ExpectedSuggestedValueHexStringToCreateInvoiceError',
  },
  {
    args: {message: 'message', suggested_value: 'zz'},
    description: 'A hex suggested value is required',
    error: 'ExpectedHexEncodedSuggestedValueToCreateInvoiceError',
  },
  {
    args: {message: 'message', suggested_value: '00'},
    description: 'An erroneous field is required for a suggested value',
    error: 'ExpectedErroneousFieldForSuggestedValueInInvoiceError',
  },
  {
    args: {message: 'Amount too low'},
    description: 'An invoice error is created',
    expected: {encoded: '050e416d6f756e7420746f6f206c6f77'},
  },
  {
    args: {
      erroneous_field: '82',
      message: 'Amount too low',
      suggested_value: '2710',
    },
    description: 'An invoice error with a suggestion is created',
    expected: {encoded: '01015203022710050e416d6f756e7420746f6f206c6f77'},
  },
  {
    args: {erroneous_field: '82', message: 'Amount', suggested_value: 'AB'},
    description: 'A suggested value is encoded in lower case',
    expected: {encoded: '0101520301ab0506416d6f756e74'},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => createInvoiceError(args), new Error(error), 'Got error');
    } else {
      strictSame(createInvoiceError(args), expected, 'Got expected result');
    }

    return end();
  });
});
