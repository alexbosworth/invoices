const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const {parseInvoiceError} = require('./../../');

const tests = [
  {
    args: {},
    description: 'An encoded invoice error is required',
    error: 'ExpectedHexEncodedInvoiceErrorToParseInvoiceError',
  },
  {
    args: {encoded: '0200050e416d6f756e7420746f6f206c6f77'},
    description: 'Unknown even types are not allowed',
    error: 'UnexpectedUnknownEvenRecordTypeInInvoiceError',
  },
  {
    args: {encoded: '010152'},
    description: 'An error message is required',
    error: 'ExpectedErrorMessageInInvoiceError',
  },
  {
    args: {encoded: '03022710050e416d6f756e7420746f6f206c6f77'},
    description: 'An erroneous field is required for a suggested value',
    error: 'ExpectedErroneousFieldForSuggestedValueInInvoiceError',
  },
  {
    args: {encoded: '01020052050e416d6f756e7420746f6f206c6f77'},
    description: 'A minimally encoded erroneous field is required',
    error: 'ExpectedValidErroneousFieldInInvoiceError',
  },
  {
    args: {encoded: '0501ff'},
    description: 'A valid UTF-8 error message is required',
    error: 'ExpectedValidUtf8ErrorMessageInInvoiceError',
  },
  {
    args: {encoded: '050e416d6f756e7420746f6f206c6f77'},
    description: 'An invoice error is parsed',
    expected: {
      erroneous_field: undefined,
      message: 'Amount too low',
      suggested_value: undefined,
    },
  },
  {
    args: {encoded: '01015203022710050e416d6f756e7420746f6f206c6f77'},
    description: 'An invoice error with a suggestion is parsed',
    expected: {
      erroneous_field: '82',
      message: 'Amount too low',
      suggested_value: '2710',
    },
  },
  {
    args: {encoded: '050e416d6f756e7420746f6f206c6f770700'},
    description: 'Unknown odd types are ignored',
    expected: {
      erroneous_field: undefined,
      message: 'Amount too low',
      suggested_value: undefined,
    },
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => parseInvoiceError(args), new Error(error), 'Got error');
    } else {
      strictSame(parseInvoiceError(args), expected, 'Got expected result');
    }

    return end();
  });
});
