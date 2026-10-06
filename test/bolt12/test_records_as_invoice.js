const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const recordsAsInvoice = require('./../../bolt12/records_as_invoice');

const key =
  '020202020202020202020202020202020202020202020202020202020202020202';

const alice =
  '02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619';

const amount = {type: '170', value: '2710'};
const createdAt = {type: '164', value: '01'};
const nodeId = {type: '176', value: alice};
const paths = {type: '160', value: `${key}${key}01${key}000100`};

const payinfo = {
  type: '162',
  value: '000003e800000064009000000000000003e80000000005f5e1000000',
};

const paymentHash = {type: '168', value: '01'.repeat(32)};

const path = {
  key,
  base_fee_mtokens: '1000',
  cltv_delta: 144,
  features: [],
  fee_rate: 100,
  hops: [{encrypted_data: '00', relay_key: key}],
  introduction_edge: undefined,
  introduction_node: key,
  max_htlc_mtokens: '100000000',
  min_htlc_mtokens: '1000',
};

const records = [paths, payinfo, createdAt, paymentHash, amount, nodeId];

const makeArgs = overrides => {
  const args = {records, network: 'bitcoin'};

  Object.keys(overrides).forEach(k => args[k] = overrides[k]);

  return args;
};

const makeExpected = overrides => {
  const details = {
    chain_addresses: undefined,
    created_at: '1970-01-01T00:00:01.000Z',
    expires_at: '1970-01-01T02:00:01.000Z',
    features: [],
    id: paymentHash.value,
    is_expired: true,
    mtokens: '10000',
    node_id: alice,
    paths: [path],
  };

  Object.keys(overrides).forEach(k => details[k] = overrides[k]);

  return details;
};

// Replace a record in the records with a different value
const replace = (type, value) => records.map(n => {
  return n.type !== type ? n : {type, value};
});

// Remove a record from the records
const without = type => records.filter(n => n.type !== type);

const tests = [
  {
    args: makeArgs({network: undefined}),
    description: 'A network is required',
    error: 'ExpectedNetworkNameToDeriveInvoiceDetails',
  },
  {
    args: makeArgs({records: undefined}),
    description: 'Records are required',
    error: 'ExpectedArrayOfRecordsToDeriveInvoiceDetails',
  },
  {
    args: makeArgs({records: [{}]}),
    description: 'Record types and values are required',
    error: 'ExpectedRecordTypesAndValuesToDeriveInvoiceDetails',
  },
  {
    args: makeArgs({records: [].concat(records, {type: '178', value: ''})}),
    description: 'Unknown even invoice types are not allowed',
    error: 'UnexpectedUnknownEvenRecordTypeInInvoice',
  },
  {
    args: makeArgs({records: without('170')}),
    description: 'An amount is required',
    error: 'ExpectedAmountInInvoice',
  },
  {
    args: makeArgs({records: without('164')}),
    description: 'A created at is required',
    error: 'ExpectedCreatedAtInInvoice',
  },
  {
    args: makeArgs({records: without('168')}),
    description: 'A payment hash is required',
    error: 'ExpectedPaymentHashInInvoice',
  },
  {
    args: makeArgs({records: replace('168', '00')}),
    description: 'A 32 byte payment hash is required',
    error: 'ExpectedPaymentHashByteLengthInInvoice',
  },
  {
    args: makeArgs({records: without('176')}),
    description: 'A node id is required',
    error: 'ExpectedNodeIdInInvoice',
  },
  {
    args: makeArgs({records: replace('176', '00')}),
    description: 'A public key node id is required',
    error: 'ExpectedPublicKeyNodeIdInInvoice',
  },
  {
    args: makeArgs({records: replace('176', `02${'00'.repeat(32)}`)}),
    description: 'A valid public key node id is required',
    error: 'ExpectedValidPublicKeyNodeIdInInvoice',
  },
  {
    args: makeArgs({records: without('160')}),
    description: 'Blinded paths are required',
    error: 'ExpectedBlindedPathsInInvoice',
  },
  {
    args: makeArgs({records: without('162')}),
    description: 'Blinded payinfo is required',
    error: 'ExpectedBlindedPayinfoInInvoice',
  },
  {
    args: makeArgs({records: replace('170', '0001')}),
    description: 'A minimally encoded amount is required',
    error: 'ExpectedValidAmountInInvoice',
  },
  {
    args: makeArgs({records: replace('164', '0001')}),
    description: 'A minimally encoded created at is required',
    error: 'ExpectedValidCreatedAtInInvoice',
  },
  {
    args: makeArgs({records: replace('164', 'ffffffffffffffff')}),
    description: 'A created at within the date range is required',
    error: 'ExpectedCreatedAtWithinDateRangeInInvoice',
  },
  {
    args: makeArgs({records: [].concat(records, {type: '166', value: '0001'})}),
    description: 'A minimally encoded relative expiry is required',
    error: 'ExpectedValidRelativeExpiryInInvoice',
  },
  {
    args: makeArgs({records: [].concat(records, {type: '174', value: '01'})}),
    description: 'Unknown required features are not allowed',
    error: 'UnexpectedUnknownRequiredFeatureBitInInvoice',
  },
  {
    args: makeArgs({records: replace('160', '00')}),
    description: 'Valid blinded paths are required',
    error: 'ExpectedValidBlindedPathsInInvoice',
  },
  {
    args: makeArgs({records: replace('160', '')}),
    description: 'Blinded paths are required in paths',
    error: 'ExpectedBlindedPathsInInvoicePaths',
  },
  {
    args: makeArgs({records: replace('162', '00')}),
    description: 'Valid blinded payinfo is required',
    error: 'ExpectedValidBlindedPayinfoInInvoice',
  },
  {
    args: makeArgs({records: replace('162', '')}),
    description: 'Blinded payinfo is required for every path',
    error: 'ExpectedBlindedPayinfoForEveryBlindedPathInInvoice',
  },
  {
    args: makeArgs({
      records: replace(
        '162',
        `${payinfo.value.slice(0, -4)}000d10${'00'.repeat(12)}`
      ),
    }),
    description: 'A usable path is required',
    error: 'ExpectedUsableBlindedPathInInvoice',
  },
  {
    args: makeArgs({
      records: replace('162', `${payinfo.value.slice(0, -4)}000101`),
    }),
    description: 'A path with any required feature is not usable',
    error: 'ExpectedUsableBlindedPathInInvoice',
  },
  {
    args: makeArgs({records: replace('164', '07dba8218000')}),
    description: 'An expiry within the date range is required',
    error: 'ExpectedExpiryWithinDateRangeInInvoice',
  },
  {
    args: makeArgs({}),
    description: 'Invoice details are derived',
    expected: makeExpected({}),
  },
  {
    args: makeArgs({records: replace('164', '07dba82163e0')}),
    description: 'An invoice that expires far in the future is not expired',
    expected: makeExpected({
      created_at: '+275760-09-12T22:00:00.000Z',
      expires_at: '+275760-09-13T00:00:00.000Z',
      is_expired: false,
    }),
  },
  {
    args: makeArgs({
      records: [].concat(records, [
        {type: '166', value: '0e10'},
        {type: '172', value: '000014751e76e8199196d454941c45d1b3a323f1433bd6'},
        {type: '174', value: '020000'},
      ]),
    }),
    description: 'Invoice details with optional records are derived',
    expected: makeExpected({
      chain_addresses: ['bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'],
      expires_at: '1970-01-01T01:00:01.000Z',
      features: [{bit: 17, is_required: false, type: 'multipath_payments_v0'}],
    }),
  },
  {
    args: makeArgs({
      records: replace('162', `${payinfo.value.slice(0, -4)}000102`),
    }),
    description: 'Known payinfo features are usable',
    expected: makeExpected({
      paths: [{
        ...path,
        features: [{bit: 1, is_required: false, type: 'data_loss_protection'}],
      }],
    }),
  },
  {
    args: makeArgs({
      records: [].concat(records, {type: '174', value: '010000'}),
    }),
    description: 'A required multipath payments feature is a known feature',
    expected: makeExpected({
      features: [{bit: 16, is_required: true, type: 'multipath_payments_v0'}],
    }),
  },
  {
    args: makeArgs({
      records: records.map(n => {
        switch (n.type) {
        case '160':
          return {type: n.type, value: `${paths.value}${paths.value}`};

        case '162':
          return {
            type: n.type,
            value: `${payinfo.value}${payinfo.value.slice(0, -4)}000101`,
          };

        default:
          return n;
        }
      }),
    }),
    description: 'A path with unknown required features is not returned',
    expected: makeExpected({paths: [path]}),
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => recordsAsInvoice(args), new Error(error), 'Got error');
    } else {
      strictSame(recordsAsInvoice(args), expected, 'Got expected result');
    }

    return end();
  });
});
