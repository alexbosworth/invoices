const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const requestAsRecords = require('./../../bolt12/request_as_records');

const key =
  '020202020202020202020202020202020202020202020202020202020202020202';

const payerId =
  '0324653eac434488002cc06bbfb7f10fe18991e35f9fe4302dbea6d2353dc0ab1c';

const makeArgs = overrides => {
  const args = {metadata: '0000000000000000', payer_id: payerId};

  Object.keys(overrides).forEach(k => args[k] = overrides[k]);

  return args;
};

const tests = [
  {
    args: makeArgs({bip353_name: 1}),
    description: 'A BIP 353 name string is required',
    error: 'ExpectedBip353NameStringToCreateInvoiceRequest',
  },
  {
    args: makeArgs({features: 'features'}),
    description: 'An array of features is required',
    error: 'ExpectedArrayOfFeaturesToCreateInvoiceRequest',
  },
  {
    args: makeArgs({metadata: 1}),
    description: 'A metadata string is required',
    error: 'ExpectedMetadataHexStringToCreateInvoiceRequest',
  },
  {
    args: makeArgs({metadata: 'zz'}),
    description: 'Hex metadata is required',
    error: 'ExpectedHexEncodedMetadataToCreateInvoiceRequest',
  },
  {
    args: makeArgs({metadata: ''}),
    description: 'Non-empty metadata is required',
    error: 'ExpectedNonEmptyMetadataToCreateInvoiceRequest',
  },
  {
    args: makeArgs({mtokens: 1}),
    description: 'A millitokens number string is required',
    error: 'ExpectedMillitokensNumberStringToCreateInvoiceRequest',
  },
  {
    args: makeArgs({network: 1}),
    description: 'A network name string is required',
    error: 'ExpectedNetworkNameStringToCreateInvoiceRequest',
  },
  {
    args: makeArgs({payer_id: undefined}),
    description: 'A payer id is required',
    error: 'ExpectedPayerIdPublicKeyToCreateInvoiceRequest',
  },
  {
    args: makeArgs({payer_id: '00'}),
    description: 'A payer id public key is required',
    error: 'ExpectedPayerIdPublicKeyHexStringToCreateInvoiceRequest',
  },
  {
    args: makeArgs({payer_id: `02${'00'.repeat(32)}`}),
    description: 'A valid payer id public key is required',
    error: 'ExpectedValidPayerIdPublicKeyToCreateInvoiceRequest',
  },
  {
    args: makeArgs({payer_note: 1}),
    description: 'A payer note string is required',
    error: 'ExpectedPayerNoteStringToCreateInvoiceRequest',
  },
  {
    args: makeArgs({paths: 'paths'}),
    description: 'An array of paths is required',
    error: 'ExpectedArrayOfBlindedPathsToCreateInvoiceRequest',
  },
  {
    args: makeArgs({quantity: 2 ** 53}),
    description: 'A quantity within the safe integer range is required',
    error: 'ExpectedPositiveQuantityNumberToCreateInvoiceRequest',
  },
  {
    args: makeArgs({quantity: 0}),
    description: 'A positive quantity is required',
    error: 'ExpectedPositiveQuantityNumberToCreateInvoiceRequest',
  },
  {
    args: makeArgs({network: 'litecoin'}),
    description: 'A known network name is required',
    error: 'ExpectedKnownNetworkNameToCreateInvoiceRequest',
  },
  {
    args: makeArgs({}),
    description: 'Request records are derived',
    expected: {
      records: [
        {type: '0', value: '0000000000000000'},
        {type: '88', value: payerId},
      ],
    },
  },
  {
    args: makeArgs({network: 'bitcoin'}),
    description: 'A bitcoin chain is omitted',
    expected: {
      records: [
        {type: '0', value: '0000000000000000'},
        {type: '88', value: payerId},
      ],
    },
  },
  {
    args: makeArgs({
      bip353_name: 'alice@example.com',
      features: [{bit: 1}],
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
    description: 'All request records are derived',
    expected: {
      records: [
        {type: '0', value: '0000000000000000'},
        {
          type: '80',
          value:
            '43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000' +
            '0000',
        },
        {type: '82', value: '2710'},
        {type: '84', value: '02'},
        {type: '86', value: '02'},
        {type: '88', value: payerId},
        {type: '89', value: '7468616e6b73'},
        {type: '90', value: `${key}${key}01${key}000100`},
        {type: '91', value: '05616c6963650b6578616d706c652e636f6d'},
      ],
    },
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => requestAsRecords(args), new Error(error), 'Got error');
    } else {
      strictSame(requestAsRecords(args), expected, 'Got expected result');
    }

    return end();
  });
});
