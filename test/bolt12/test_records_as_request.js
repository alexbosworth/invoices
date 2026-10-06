const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const recordsAsRequest = require('./../../bolt12/records_as_request');

const metadata = {type: '0', value: '0000000000000000'};

const payerId = {
  type: '88',
  value: '0324653eac434488002cc06bbfb7f10fe18991e35f9fe4302dbea6d2353dc0ab1c',
};

const key =
  '020202020202020202020202020202020202020202020202020202020202020202';

const path = key + key + '01' + key + '000100';

const makeExpected = overrides => {
  const details = {
    bip353_name: undefined,
    features: [],
    metadata: metadata.value,
    mtokens: undefined,
    network: 'bitcoin',
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
    error: 'ExpectedArrayOfRecordsToDeriveInvoiceRequestDetails',
  },
  {
    args: {records: [{}]},
    description: 'Record types and values are required',
    error: 'ExpectedRecordTypesAndValuesToDeriveRequestDetails',
  },
  {
    args: {records: [metadata, {type: '92', value: '00'}, payerId]},
    description: 'Unknown even request types are not allowed',
    error: 'UnexpectedUnknownEvenRecordTypeInInvoiceRequest',
  },
  {
    args: {records: [payerId]},
    description: 'Metadata is required',
    error: 'ExpectedMetadataInInvoiceRequest',
  },
  {
    args: {records: [metadata]},
    description: 'A payer id is required',
    error: 'ExpectedPayerIdInInvoiceRequest',
  },
  {
    args: {records: [metadata, {type: '88', value: '00'}]},
    description: 'A public key payer id is required',
    error: 'ExpectedPublicKeyPayerIdInInvoiceRequest',
  },
  {
    args: {
      records: [metadata, {type: '88', value: `02${'00'.repeat(32)}`}],
    },
    description: 'A valid public key payer id is required',
    error: 'ExpectedValidPublicKeyPayerIdInInvoiceRequest',
  },
  {
    args: {records: [metadata, {type: '80', value: '00'}, payerId]},
    description: 'A chain hash is required in the chain',
    error: 'ExpectedChainHashInInvoiceRequestChain',
  },
  {
    args: {
      records: [metadata, {type: '80', value: '00'.repeat(32)}, payerId],
    },
    description: 'A known chain hash is required in the chain',
    error: 'UnknownChainInInvoiceRequestChain',
  },
  {
    args: {records: [metadata, {type: '82', value: '0001'}, payerId]},
    description: 'A minimally encoded amount is required',
    error: 'ExpectedValidAmountInInvoiceRequest',
  },
  {
    args: {records: [metadata, {type: '84', value: '01'}, payerId]},
    description: 'Unknown required features are not allowed',
    error: 'UnexpectedUnknownRequiredFeatureBitInInvoiceRequest',
  },
  {
    args: {records: [metadata, {type: '86', value: '0001'}, payerId]},
    description: 'A minimally encoded quantity is required',
    error: 'ExpectedValidQuantityInInvoiceRequest',
  },
  {
    args: {
      records: [metadata, {type: '86', value: 'ffffffffffffffff'}, payerId],
    },
    description: 'A quantity within the safe range is required',
    error: 'ExpectedQuantityWithinSafeRangeInInvoiceRequest',
  },
  {
    args: {records: [metadata, payerId, {type: '89', value: 'ff'}]},
    description: 'A valid UTF-8 payer note is required',
    error: 'ExpectedValidUtf8PayerNoteInInvoiceRequest',
  },
  {
    args: {records: [metadata, payerId, {type: '90', value: '00'}]},
    description: 'Valid blinded paths are required',
    error: 'ExpectedValidBlindedPathsInInvoiceRequest',
  },
  {
    args: {records: [metadata, payerId, {type: '90', value: ''}]},
    description: 'Blinded paths are required in paths',
    error: 'ExpectedBlindedPathsInInvoiceRequestPaths',
  },
  {
    args: {records: [metadata, payerId, {type: '91', value: '00'}]},
    description: 'A valid BIP 353 name is required',
    error: 'ExpectedValidBip353NameInInvoiceRequest',
  },
  {
    args: {records: [metadata, payerId]},
    description: 'Request details are derived',
    expected: makeExpected({}),
  },
  {
    args: {
      records: [
        metadata,
        {type: '22', value: '00'},
        {
          type: '80',
          value:
            '43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000' +
            '0000',
        },
        {type: '82', value: '2710'},
        {type: '84', value: '02'},
        {type: '86', value: '02'},
        payerId,
        {type: '89', value: '7468616e6b73'},
        {type: '90', value: path},
        {type: '91', value: '05616c6963650b6578616d706c652e636f6d'},
      ],
    },
    description: 'All request details are derived',
    expected: makeExpected({
      bip353_name: 'alice@example.com',
      features: [
        {bit: 1, is_required: false, type: 'data_loss_protection'},
      ],
      mtokens: '10000',
      network: 'testnet',
      payer_note: 'thanks',
      paths: [{
        key,
        hops: [{encrypted_data: '00', relay_key: key}],
        introduction_node: key,
      }],
      quantity: 2,
    }),
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => recordsAsRequest(args), new Error(error), 'Got error');
    } else {
      strictSame(recordsAsRequest(args), expected, 'Got expected result');
    }

    return end();
  });
});
