const {equal} = require('node:assert').strict;
const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const {parsePaymentRequest} = require('./../../');
const vectors = require('./vectors/invoices.json');

const {keys} = Object;

// The node key that signs the valid BOLT 11 test vectors
const destination =
  '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad';

// The payment secret in the valid BOLT 11 test vectors
const payment =
  '1111111111111111111111111111111111111111111111111111111111111111';

// Invalid test vectors that are parsed by choice, and what shows the problem
const accepted = {
  // Legacy requests and bLIP 39 blinded path requests do not have an `s` field
  'Missing required `s` field': {payment: undefined},
  // Unknown required feature bits are returned so that a payer can reject them
  'Same, but adding invalid unknown feature 100': {
    destination,
    features: [
      {bit: 8, is_required: true, type: 'tlv_onion'},
      {bit: 14, is_required: true, type: 'payment_identifier'},
      {bit: 99, is_required: false, type: undefined},
      {bit: 100, is_required: true, type: undefined},
    ],
  },
};

// Errors for the invalid BOLT 11 invoice test vectors
const errors = {
  'Bech32 checksum is invalid': 'ExpectedValidBech32EncodedPaymentRequest',
  'Malformed bech32 string (mixed case)':
    'ExpectedValidBech32EncodedPaymentRequest',
  'Signature is not recoverable':
    'ExpectedRecoverableSignatureInPaymentRequest',
  'Same, but with an `n` field of invalid length':
    'UnexpectedDestinationKeyLengthInPaymentRequest',
  'Missing required `p` field': 'ExpectedPaymentHashInPaymentRequest',
  'Two distinct p fields in an otherwise valid invoice':
    'UnexpectedDuplicatePaymentHashInPaymentRequest',
  'The same p field twice in an otherwise valid invoice':
    'UnexpectedDuplicatePaymentHashInPaymentRequest',
  'Two distinct s fields in an otherwise valid invoice':
    'UnexpectedDuplicatePaymentIdentifierInPaymentRequest',
  'Malformed bech32 string (no 1)': 'ExpectedLnPrefix',
  'String is too short': 'InvalidOrMissingSignatureInPaymentRequest',
  'Invalid multiplier': 'InvalidAmountMultiplier',
  'Invalid sub-millisatoshi precision':
    'ExpectedWholeMillitokensAmountToParseHrpAsMtokens',
  // The duplicate `s` field in this vector is detected first
  'Non canonical signature (high-S) with \'n\' field defined':
    'UnexpectedDuplicatePaymentIdentifierInPaymentRequest',
};

// Details of valid test vectors, when they are not the usual details
const unusual = {
  // The S value is negated but the recovery flag is not, so the key changes
  'Public-key recovery with high-S signature': {
    payment,
    destination:
      '02d0139ce7427d6dfffd26a326c18be754ef1e64672b42694ba5b23ef6e6e7803d',
  },
};

// A reworded test vector description should not silently drop an expectation
test('Every expected result is for an invoice test vector', (t, end) => {
  const descriptions = vectors.map(n => n.description);

  const expectations = [accepted, errors, unusual];

  expectations.forEach(expected => {
    return keys(expected).forEach(description => {
      return equal(descriptions.includes(description), true, description);
    });
  });

  return end();
});

vectors.forEach(({description, invoice, valid}) => {
  return test(`Invoice vector: ${description}`, (t, end) => {
    const request = invoice;

    // An invalid vector fails with an error unless it is parsed by choice
    if (!valid && !accepted[description]) {
      const error = new Error(errors[description]);

      throws(() => parsePaymentRequest({request}), error, 'Got error');

      return end();
    }

    const details = parsePaymentRequest({request});

    const usual = {destination, payment};

    const expected = accepted[description] || unusual[description] || usual;

    keys(expected).forEach(key => {
      return strictSame(details[key], expected[key], `Got expected ${key}`);
    });

    return end();
  });
});
