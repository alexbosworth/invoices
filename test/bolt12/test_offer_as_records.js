const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const offerAsRecords = require('./../../bolt12/offer_as_records');

const issuerId =
  '02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619';

const makeArgs = overrides => {
  const args = {description: 'Test vectors', issuer_id: issuerId};

  Object.keys(overrides).forEach(k => args[k] = overrides[k]);

  return args;
};

const tests = [
  {
    args: makeArgs({amount: 1}),
    description: 'A currency amount number string is required',
    error: 'ExpectedCurrencyAmountNumberStringToCreateOffer',
  },
  {
    args: makeArgs({amount: '1'}),
    description: 'A currency is required for a currency amount',
    error: 'ExpectedCurrencyForCurrencyAmountToCreateOffer',
  },
  {
    args: makeArgs({amount: '1', currency: 'usd'}),
    description: 'An ISO 4217 currency code is required',
    error: 'ExpectedIso4217CurrencyCodeToCreateOffer',
  },
  {
    args: makeArgs({currency: 'USD'}),
    description: 'A currency amount is required for a currency',
    error: 'ExpectedCurrencyAmountForCurrencyToCreateOffer',
  },
  {
    args: makeArgs({mtokens: 1}),
    description: 'A millitokens number string is required',
    error: 'ExpectedMillitokensNumberStringToCreateOffer',
  },
  {
    args: makeArgs({amount: '1', currency: 'USD', mtokens: '1'}),
    description: 'Only one of millitokens or currency amount is allowed',
    error: 'UnexpectedMillitokensAndCurrencyAmountToCreateOffer',
  },
  {
    args: makeArgs({mtokens: '0'}),
    description: 'A non-zero amount is required',
    error: 'ExpectedNonZeroAmountToCreateOffer',
  },
  {
    args: makeArgs({description: 1}),
    description: 'A description string is required',
    error: 'ExpectedDescriptionStringToCreateOffer',
  },
  {
    args: makeArgs({description: undefined, mtokens: '1'}),
    description: 'A description is required for an amount',
    error: 'ExpectedDescriptionForAmountToCreateOffer',
  },
  {
    args: makeArgs({expires_at: 'never'}),
    description: 'A valid expires at date is required',
    error: 'ExpectedValidExpiresAtDateToCreateOffer',
  },
  {
    args: makeArgs({features: [{bit: 98}]}),
    description: 'Offer feature bits must be optional',
    error: 'ExpectedOptionalFeatureBitsToCreateOffer',
  },
  {
    args: makeArgs({features: 'features'}),
    description: 'An array of features is required',
    error: 'ExpectedArrayOfFeaturesToCreateOffer',
  },
  {
    args: makeArgs({issuer: 1}),
    description: 'An issuer string is required',
    error: 'ExpectedIssuerStringToCreateOffer',
  },
  {
    args: makeArgs({issuer_id: undefined}),
    description: 'An issuer id or paths is required',
    error: 'ExpectedIssuerIdOrPathsToCreateOffer',
  },
  {
    args: makeArgs({issuer_id: 1}),
    description: 'An issuer id hex string is required',
    error: 'ExpectedIssuerIdPublicKeyHexStringToCreateOffer',
  },
  {
    args: makeArgs({issuer_id: '00'}),
    description: 'An issuer id public key is required',
    error: 'ExpectedIssuerIdPublicKeyToCreateOffer',
  },
  {
    args: makeArgs({issuer_id: `02${Buffer.alloc(32).toString('hex')}`}),
    description: 'A valid issuer id public key is required',
    error: 'ExpectedValidIssuerIdPublicKeyToCreateOffer',
  },
  {
    args: makeArgs({max_quantity: -1}),
    description: 'A max quantity number is required',
    error: 'ExpectedMaxQuantityNumberToCreateOffer',
  },
  {
    args: makeArgs({max_quantity: Number.MAX_SAFE_INTEGER + 1}),
    description: 'A max quantity within the safe integer range is required',
    error: 'ExpectedMaxQuantityNumberToCreateOffer',
  },
  {
    args: makeArgs({metadata: 1}),
    description: 'A metadata string is required',
    error: 'ExpectedMetadataHexStringToCreateOffer',
  },
  {
    args: makeArgs({metadata: 'zz'}),
    description: 'Hex metadata is required',
    error: 'ExpectedHexEncodedMetadataToCreateOffer',
  },
  {
    args: makeArgs({networks: 'bitcoin'}),
    description: 'An array of networks is required',
    error: 'ExpectedArrayOfNetworksToCreateOffer',
  },
  {
    args: makeArgs({networks: []}),
    description: 'Network names are required in networks',
    error: 'ExpectedNetworkNamesToCreateOffer',
  },
  {
    args: makeArgs({paths: 'paths'}),
    description: 'An array of paths is required',
    error: 'ExpectedArrayOfBlindedPathsToCreateOffer',
  },
  {
    args: makeArgs({networks: ['litecoin']}),
    description: 'Known network names are required',
    error: 'ExpectedKnownNetworkNameToCreateOffer',
  },
  {
    args: makeArgs({networks: ['constructor']}),
    description: 'Object properties cannot be used as network names',
    error: 'ExpectedKnownNetworkNameToCreateOffer',
  },
  {
    args: makeArgs({}),
    description: 'Offer records are derived',
    expected: {
      records: [
        {type: '10', value: '5465737420766563746f7273'},
        {type: '22', value: issuerId},
      ],
    },
  },
  {
    args: makeArgs({networks: ['bitcoin', 'testnet']}),
    description: 'Multiple chains are encoded',
    expected: {
      records: [
        {
          type: '2',
          value: '6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d61900000' +
            '0000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000' +
            '00000',
        },
        {type: '10', value: '5465737420766563746f7273'},
        {type: '22', value: issuerId},
      ],
    },
  },
  {
    args: makeArgs({description: ''}),
    description: 'An empty description is encoded',
    expected: {
      records: [{type: '10', value: ''}, {type: '22', value: issuerId}],
    },
  },
  {
    args: makeArgs({max_quantity: Number.MAX_SAFE_INTEGER}),
    description: 'The maximum safe quantity is encoded',
    expected: {
      records: [
        {type: '10', value: '5465737420766563746f7273'},
        {type: '20', value: '1fffffffffffff'},
        {type: '22', value: issuerId},
      ],
    },
  },
  {
    args: makeArgs({max_quantity: 0}),
    description: 'An unlimited quantity is encoded as zero',
    expected: {
      records: [
        {type: '10', value: '5465737420766563746f7273'},
        {type: '20', value: ''},
        {type: '22', value: issuerId},
      ],
    },
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => offerAsRecords(args), new Error(error), 'Got error');
    } else {
      strictSame(offerAsRecords(args), expected, 'Got expected result');
    }

    return end();
  });
});
