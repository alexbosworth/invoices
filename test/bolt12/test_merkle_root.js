const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const merkleRoot = require('./../../bolt12/merkle_root');
const proofVectors = require('./vectors/payer_proofs.json');

// The payer proof test vector invoices have ten and twelve leaf trees
const proofInvoices = proofVectors.valid_vectors.filter((vector, i, all) => {
  return all.findIndex(n => n.input.invoice === vector.input.invoice) === i;
});

// From the BOLT 12 signature test vectors
const tlv1 = {type: '1', value: '03e8'};
const tlv2 = {type: '2', value: '0000010000020003'};

const tlv3 = {
  type: '3',
  value: '0266e4598d1d3c415f572a8488830b60f7e744ed9235eb0b1ba93283b315c035180' +
    '0000000000000010000000000000002',
};

const requestRecords = [
  {type: '0', value: '0000000000000000'},
  {type: '6', value: '555344'},
  {type: '8', value: '64'},
  {type: '10', value: '41204d617468656d61746963616c205472656174697365'},
  {
    type: '22',
    value: '02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619',
  },
  {
    type: '88',
    value: '0324653eac434488002cc06bbfb7f10fe18991e35f9fe4302dbea6d2353dc0ab1c',
  },
  {
    type: '240',
    value: 'b8f83ea3288cfd6ea510cdb481472575141e8d8744157f98562d162cc1c47252' +
      '6fdb24befefbdebab4dbb726bbd1b7d8aec057f8fa805187e5950d2bbe0e5642',
  },
];

const tests = [
  {
    args: {},
    description: 'Records are required',
    error: 'ExpectedArrayOfRecordsToCalculateMerkleRoot',
  },
  {
    args: {records: [{}]},
    description: 'Record types are required',
    error: 'ExpectedRecordTypesToCalculateMerkleRoot',
  },
  {
    args: {records: [{type: '1'}]},
    description: 'Record values are required',
    error: 'ExpectedRecordValuesToCalculateMerkleRoot',
  },
  {
    args: {records: [{type: '240', value: '00'}]},
    description: 'Non-signature records are required',
    error: 'ExpectedNonSignatureRecordsToCalculateMerkleRoot',
  },
  {
    args: {records: [tlv1]},
    description: 'A single record has a root of the leaf and nonce branch',
    expected: {
      root: 'b013756c8fee86503a0b4abdab4cddeb1af5d344ca6fc2fa8b6c08938caa6f93',
    },
  },
  {
    args: {records: [tlv2, tlv1]},
    description: 'Two records are combined into a root',
    expected: {
      root: 'c3774abbf4815aa54ccaa026bff6581f01f3be5fe814c620a252534f434bc0d1',
    },
  },
  {
    args: {records: [tlv1, tlv2, tlv3]},
    description: 'An odd node is carried up to combine into the root',
    expected: {
      root: 'ab2e79b1283b0b31e0b035258de23782df6b89a38cfa7237bde69aed1a658c5d',
    },
  },
  {
    args: {records: requestRecords},
    description: 'The signature record is not included in the root',
    expected: {
      root: '608407c18ad9a94d9ea2bcdbe170b6c20c462a7833a197621c916f78cf18e624',
    },
  },
];

proofInvoices.forEach(vector => {
  const records = vector.input.invoice_fields.map(field => ({
    type: field.type.toString(),
    value: field.hex,
  }));

  return tests.push({
    args: {records},
    description: `Payer proof vector invoice root: ${vector.name}`,
    expected: {root: vector.working.invoice_merkle_root},
  });
});

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => merkleRoot(args), new Error(error), 'Got expected error');
    } else {
      strictSame(merkleRoot(args), expected, 'Got expected result');
    }

    return end();
  });
});
