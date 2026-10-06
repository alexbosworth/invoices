const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const invoiceAsRecords = require('./../../bolt12/invoice_as_records');

const key =
  '020202020202020202020202020202020202020202020202020202020202020202';

const alice =
  '02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619';

const path = {
  key,
  base_fee_mtokens: '1000',
  cltv_delta: 144,
  fee_rate: 100,
  hops: [{encrypted_data: '00', relay_key: key}],
  introduction_node: key,
  max_htlc_mtokens: '100000000',
  min_htlc_mtokens: '1000',
};

const makeArgs = overrides => {
  const args = {
    created_at: '1970-01-01T00:00:01.000Z',
    expires_at: '1970-01-01T02:00:01.000Z',
    id: '01'.repeat(32),
    mtokens: '10000',
    network: 'bitcoin',
    node_id: alice,
    paths: [path],
  };

  Object.keys(overrides).forEach(k => args[k] = overrides[k]);

  return args;
};

const tests = [
  {
    args: makeArgs({chain_addresses: 'address'}),
    description: 'An array of chain addresses is required',
    error: 'ExpectedArrayOfChainAddressesToCreateInvoice',
  },
  {
    args: makeArgs({created_at: 'never'}),
    description: 'A valid created at date is required',
    error: 'ExpectedValidCreatedAtDateToCreateInvoice',
  },
  {
    args: makeArgs({expires_at: 'never'}),
    description: 'A valid expires at date is required',
    error: 'ExpectedValidExpiresAtDateToCreateInvoice',
  },
  {
    args: makeArgs({features: 'features'}),
    description: 'An array of features is required',
    error: 'ExpectedArrayOfFeaturesToCreateInvoice',
  },
  {
    args: makeArgs({id: undefined}),
    description: 'A payment hash is required',
    error: 'ExpectedPaymentHashHexStringToCreateInvoice',
  },
  {
    args: makeArgs({id: '00'}),
    description: 'A 32 byte payment hash is required',
    error: 'ExpectedPaymentHashByteLengthToCreateInvoice',
  },
  {
    args: makeArgs({mtokens: 1}),
    description: 'A millitokens number string is required',
    error: 'ExpectedMillitokensNumberStringToCreateInvoice',
  },
  {
    args: makeArgs({network: undefined}),
    description: 'A network name is required',
    error: 'ExpectedNetworkNameToCreateInvoice',
  },
  {
    args: makeArgs({node_id: undefined}),
    description: 'A node id is required',
    error: 'ExpectedNodeIdPublicKeyHexStringToCreateInvoice',
  },
  {
    args: makeArgs({node_id: '00'}),
    description: 'A node id public key is required',
    error: 'ExpectedNodeIdPublicKeyToCreateInvoice',
  },
  {
    args: makeArgs({node_id: `02${'00'.repeat(32)}`}),
    description: 'A valid node id public key is required',
    error: 'ExpectedValidNodeIdPublicKeyToCreateInvoice',
  },
  {
    args: makeArgs({paths: []}),
    description: 'Blinded paths are required',
    error: 'ExpectedArrayOfBlindedPathsToCreateInvoice',
  },
  {
    args: makeArgs({paths: [null]}),
    description: 'Blinded path details are required',
    error: 'ExpectedBlindedPathDetailsToCreateInvoice',
  },
  {
    args: makeArgs({expires_at: '1970-01-01T00:00:00.000Z'}),
    description: 'An expiry after the creation date is required',
    error: 'ExpectedExpiresAtWithinRelativeExpiryRangeForInvoice',
  },
  {
    args: makeArgs({}),
    description: 'Invoice records are derived',
    expected: {
      records: [
        {type: '160', value: `${key}${key}01${key}000100`},
        {
          type: '162',
          value: '000003e800000064009000000000000003e80000000005f5e1000000',
        },
        {type: '164', value: '01'},
        {type: '168', value: '01'.repeat(32)},
        {type: '170', value: '2710'},
        {type: '176', value: alice},
      ],
    },
  },
  {
    args: makeArgs({
      chain_addresses: ['bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'],
      expires_at: '1970-01-01T01:00:01.000Z',
      features: [{bit: 17}],
    }),
    description: 'Invoice records with optional records are derived',
    expected: {
      records: [
        {type: '160', value: `${key}${key}01${key}000100`},
        {
          type: '162',
          value: '000003e800000064009000000000000003e80000000005f5e1000000',
        },
        {type: '164', value: '01'},
        {type: '166', value: '0e10'},
        {type: '168', value: '01'.repeat(32)},
        {type: '170', value: '2710'},
        {type: '172', value: '000014751e76e8199196d454941c45d1b3a323f1433bd6'},
        {type: '174', value: '020000'},
        {type: '176', value: alice},
      ],
    },
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => invoiceAsRecords(args), new Error(error), 'Got error');
    } else {
      strictSame(invoiceAsRecords(args), expected, 'Got expected result');
    }

    return end();
  });
});
