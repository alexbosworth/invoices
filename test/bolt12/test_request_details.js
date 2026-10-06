const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const requestDetails = require('./../../bolt12/request_details');

const amount = {type: '8', value: '2710'};
const chains = {
  type: '2',
  value: '6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000',
};
const description = {type: '10', value: '5465737420766563746f7273'};
const features = {type: '12', value: '00'};
const metadata = {type: '0', value: '0000000000000000'};
const quantityMax = {type: '20', value: '05'};
const unlimitedQuantity = {type: '20', value: ''};

const issuerId = {
  type: '22',
  value: '02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619',
};

const payerId = {
  type: '88',
  value: '0324653eac434488002cc06bbfb7f10fe18991e35f9fe4302dbea6d2353dc0ab1c',
};

const testnetChain = {
  type: '80',
  value: '43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000',
};

const makeExpected = overrides => {
  const details = {
    bip353_name: undefined,
    description: undefined,
    expires_at: undefined,
    features: [],
    issuer: undefined,
    metadata: metadata.value,
    mtokens: undefined,
    network: 'bitcoin',
    offer: 'lno1pgx9getnwss8vetrw3hhyuckyypwa3eyt44h6txtxquqh7lz5djge4afgfj' +
      'n7k4rgrkuag0jsd5xvxg',
    payer_id: payerId.value,
    payer_note: undefined,
    paths: undefined,
    quantity: undefined,
  };

  Object.keys(overrides).forEach(k => details[k] = overrides[k]);

  return details;
};

const tests = [
  {
    args: {},
    description: 'Records are required',
    error: 'ExpectedArrayOfRecordsToDeriveRequestDetails',
  },
  {
    args: {records: [{}]},
    description: 'Record types and values are required',
    error: 'ExpectedRecordTypesAndValuesToDeriveRequestDetails',
  },
  {
    args: {records: [metadata, chains, description, payerId]},
    description: 'Offer chains are not allowed without an offer',
    error: 'UnexpectedOfferChainsInInvoiceRequestWithoutOffer',
  },
  {
    args: {records: [metadata, description, features, payerId]},
    description: 'Offer features are not allowed without an offer',
    error: 'UnexpectedOfferFeaturesInInvoiceRequestWithoutOffer',
  },
  {
    args: {records: [metadata, description, quantityMax, payerId]},
    description: 'Offer quantity max is not allowed without an offer',
    error: 'UnexpectedQuantityMaxInInvoiceRequestWithoutOffer',
  },
  {
    args: {records: [metadata, description, payerId]},
    description: 'An amount is required without an offer',
    error: 'ExpectedAmountInInvoiceRequestWithoutOffer',
  },
  {
    args: {records: [metadata, description, issuerId, testnetChain, payerId]},
    description: 'The chain must be an offer chain',
    error: 'ExpectedInvoiceRequestChainToBeOfferChain',
  },
  {
    args: {records: [metadata, description, quantityMax, issuerId, payerId]},
    description: 'A quantity is required for an offer with a quantity',
    error: 'ExpectedQuantityInInvoiceRequestForOfferWithQuantity',
  },
  {
    args: {
      records: [
        metadata,
        description,
        quantityMax,
        issuerId,
        {type: '86', value: ''},
        payerId,
      ],
    },
    description: 'A non-zero quantity is required',
    error: 'ExpectedNonZeroQuantityInInvoiceRequest',
  },
  {
    args: {
      records: [
        metadata,
        description,
        quantityMax,
        issuerId,
        {type: '86', value: '06'},
        payerId,
      ],
    },
    description: 'A quantity within the maximum is required',
    error: 'ExpectedQuantityWithinOfferMaximumInInvoiceRequest',
  },
  {
    args: {
      records: [
        metadata,
        description,
        issuerId,
        {type: '86', value: '01'},
        payerId,
      ],
    },
    description: 'A quantity is not allowed for an offer without a quantity',
    error: 'UnexpectedQuantityInInvoiceRequestForOffer',
  },
  {
    args: {records: [metadata, description, issuerId, payerId]},
    description: 'An amount is required for an offer without an amount',
    error: 'ExpectedAmountInInvoiceRequestForOfferWithoutAmount',
  },
  {
    args: {
      records: [
        metadata,
        amount,
        description,
        issuerId,
        {type: '82', value: '270f'},
        payerId,
      ],
    },
    description: 'The requested amount must be at least the offer amount',
    error: 'ExpectedInvoiceRequestAmountAtLeastOfferAmount',
  },
  {
    args: {
      records: [
        metadata,
        amount,
        description,
        quantityMax,
        issuerId,
        {type: '82', value: '4e1f'},
        {type: '86', value: '02'},
        payerId,
      ],
    },
    description: 'The requested amount must be at least the total amount',
    error: 'ExpectedInvoiceRequestAmountAtLeastOfferAmount',
  },
  {
    args: {
      records: [metadata, description, {type: '82', value: '2710'}, payerId],
    },
    description: 'Request details without an offer are derived',
    expected: makeExpected({
      description: 'Test vectors',
      mtokens: '10000',
      offer: undefined,
    }),
  },
  {
    args: {
      records: [
        metadata,
        description,
        {type: '14', value: '01'},
        {type: '18', value: '6d65'},
        {type: '82', value: '2710'},
        payerId,
      ],
    },
    description: 'Request details without an offer have an expiry and issuer',
    expected: makeExpected({
      description: 'Test vectors',
      expires_at: '1970-01-01T00:00:01.000Z',
      issuer: 'me',
      mtokens: '10000',
      offer: undefined,
    }),
  },
  {
    args: {records: [metadata, amount, description, issuerId, payerId]},
    description: 'Request details for an offer are derived',
    expected: makeExpected({
      offer:
        'lno1pqpzwyq2p32x2um5ypmx2cm5dae8x93pqthvwfzadd7jejes8q9lhc4rvjxd' +
        '022zv5l44g6qah82ru5rdpnpj',
    }),
  },
  {
    args: {
      records: [
        metadata,
        amount,
        description,
        unlimitedQuantity,
        issuerId,
        {type: '82', value: '4e20'},
        {type: '86', value: '02'},
        payerId,
      ],
    },
    description: 'Request details for an unlimited quantity offer are derived',
    expected: makeExpected({
      mtokens: '20000',
      offer:
        'lno1pqpzwyq2p32x2um5ypmx2cm5dae8x9qqzcss9mk8y3wkklfvevcrszlmu23k' +
        'frxh49px20665dqwmn4p72pksese',
      quantity: 2,
    }),
  },
  {
    args: {
      records: [
        metadata,
        {type: '6', value: '555344'},
        amount,
        description,
        issuerId,
        payerId,
      ],
    },
    description: 'Request details for a currency offer need no amount',
    expected: makeExpected({
      offer:
        'lno1qcp4256ypqpzwyq2p32x2um5ypmx2cm5dae8x93pqthvwfzadd7jejes8q9l' +
        'hc4rvjxd022zv5l44g6qah82ru5rdpnpj',
    }),
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => requestDetails(args), new Error(error), 'Got error');
    } else {
      strictSame(requestDetails(args), expected, 'Got expected result');
    }

    return end();
  });
});
