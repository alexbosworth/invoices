const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const fieldAsDetails = require('./../../bolt11/field_as_details');
const hexAsWords = require('./../../bolt11/hex_as_words');

// The bLIP 39 test vector blinded path with 1 hop
const blindedPathHex = [
  '00000004',
  '00000002',
  '000a',
  '0000000000000000',
  '000000000000000a',
  '0000',
  '02c75eb336a038294eaaf760158b2e851c3c0937262e35401ae64a1bee71a2e40c',
  '01',
  '0220293926219d8efe733336e2b674570dd96aa763acb3564e6e367b384d861a0a',
  '05',
  '0102030405',
].join('');

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
    args: {code: 20, network: 'bitcoin'},
    description: 'Blinded path is invalid',
    error: 'ExpectedWordsToInterpretAsBlindedPath',
  },
  {
    args: {
      code: 20,
      network: 'bitcoin',
      words: hexAsWords({hex: blindedPathHex}).words,
    },
    description: 'A blinded path is parsed',
    expected: {
      blinded_path: {
        base_fee_mtokens: '4',
        cltv_delta: 10,
        features: [],
        fee_rate: 2,
        hops: [{
          encrypted_data: '0102030405',
          relay_key: '0220293926219d8efe733336e2b674570dd96aa763acb3564e6e367b384d861a0a',
        }],
        introduction_node: '0220293926219d8efe733336e2b674570dd96aa763acb3564e6e367b384d861a0a',
        key: '02c75eb336a038294eaaf760158b2e851c3c0937262e35401ae64a1bee71a2e40c',
        max_htlc_mtokens: '10',
        min_htlc_mtokens: '0',
      },
    },
  },
  {
    args: {code: 6, network: 'bitcoin', words: [0, 1]},
    description: 'A non-minimal expiry encoding is rejected',
    error: 'ExpectedMinimalExpiryEncodingInPaymentRequest',
  },
  {
    args: {code: 24, network: 'bitcoin', words: [0, 1]},
    description: 'A non-minimal cltv delta encoding is rejected',
    error: 'ExpectedMinimalCltvDeltaEncodingInPaymentRequest',
  },
  {
    args: {code: 5, network: 'bitcoin', words: [0, 1]},
    description: 'A non-minimal feature bits encoding is rejected',
    error: 'ExpectedMinimalFeatureBitsEncodingInPaymentRequest',
  },
  {
    args: {code: 23, network: 'bitcoin'},
    description: 'Description hash is invalid',
    error: 'FailedToParsePaymentRequestDescriptionHash',
  },
  {
    args: {code: 23, network: 'bitcoin', words: []},
    description: 'A description hash must have the expected length',
    error: 'UnexpectedDescriptionHashLengthInPaymentRequest',
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
    args: {code: 27, network: 'bitcoin'},
    description: 'Metadata is invalid',
    error: 'FailedToParsePaymentContextualMetadata',
  },
  {
    args: {code: 1, network: 'bitcoin'},
    description: 'Payment hash is invalid',
    error: 'FailedToParsePaymentRequestPaymentHash',
  },
  {
    args: {code: 1, network: 'bitcoin', words: [0]},
    description: 'A payment hash must have the expected length',
    error: 'UnexpectedPaymentHashLengthInPaymentRequest',
  },
  {
    args: {code: 16, network: 'bitcoin'},
    description: 'Payment identifier is invalid',
    error: 'FailedToParsePaymentRequestPaymentIdentifier',
  },
  {
    args: {code: 16, network: 'bitcoin', words: [0]},
    description: 'A payment identifier must have the expected length',
    error: 'UnexpectedPaymentIdentifierLengthInPaymentRequest',
  },
  {
    args: {code: 19, network: 'bitcoin'},
    description: 'Destination public key is invalid',
    error: 'FailedToParsePaymentRequestDestinationKey',
  },
  {
    args: {code: 19, network: 'bitcoin', words: [0]},
    description: 'A destination public key must have the expected length',
    error: 'UnexpectedDestinationKeyLengthInPaymentRequest',
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => fieldAsDetails(args), new Error(error), 'Got error');
    } else {
      const details = fieldAsDetails(args);

      strictSame(details, expected, 'Got expected result');
    }

    return end();
  });
});
