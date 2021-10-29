const {test} = require('@alexbosworth/tap');

const fieldAsDetails = require('./../../bolt11/field_as_details');

const tests = [
  {
    args: {
      code: Number.MAX_SAFE_INTEGER,
      network: 'bitcoin',
      words: [0],
    },
    description: 'Unknown field is ignored',
    expected: {},
  },
  {
    args: {code: 23, network: 'bitcoin'},
    description: 'Description hash is invalid',
    error: 'FailedToParsePaymentRequestDescriptionHash',
  },
  {
    args: {code: 23, network: 'bitcoin', words: []},
    description: 'Description hash length is invalid',
    error: 'UnexpectedByteLengthOfDescriptionHash',
  },
  {
    args: {code: 13, network: 'bitcoin'},
    description: 'Description is invalid',
    error: 'InvalidDescriptionInPaymentRequest',
  },
  {
    args: {code: 9, network: 'bitcoin'},
    description: 'Fallback address is invalid',
    error: 'FailedToParsePaymentRequestFallbackAddress',
  },
  {
    args: {code: 1, network: 'bitcoin'},
    description: 'Payment hash is invalid',
    error: 'FailedToParsePaymentRequestPaymentHash',
  },
  {
    args: {code: 1, network: 'bitcoin', words: [0]},
    description: 'Payment hash length is invalid',
    error: 'UnexpectedByteLengthForPaymentHash',
  },
  {
    args: {code: 16, network: 'bitcoin'},
    description: 'Payment identifier is invalid',
    error: 'FailedToParsePaymentRequestPaymentIdentifier',
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, ({end, strictSame, throws}) => {
    if (!!error) {
      throws(() => fieldAsDetails(args), new Error(error), 'Got error');
    } else {
      const details = fieldAsDetails(args);

      strictSame(details, expected, 'Got expected result');
    }

    return end();
  });
});
