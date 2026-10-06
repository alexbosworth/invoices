const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const proofVectors = require('./vectors/payer_proofs.json');
const unsignedDetails = require('./../../bolt12/unsigned_details');

// The payer proof test vectors have invoices with their roots and sig hashes
const proofInvoices = proofVectors.valid_vectors.filter((vector, i, all) => {
  return all.findIndex(n => n.input.invoice === vector.input.invoice) === i;
});

// The invoice fields include the signature record, which is not signed
const proofRecords = vector => vector.input.invoice_fields.map(field => ({
  type: field.type.toString(),
  value: field.hex,
}));

// From the BOLT 12 signature test vectors
const records = [
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
];

const signature = {
  type: '240',
  value: 'b8f83ea3288cfd6ea510cdb481472575141e8d8744157f98562d162cc1c472526' +
    'fdb24befefbdebab4dbb726bbd1b7d8aec057f8fa805187e5950d2bbe0e5642',
};

const expected = {
  encoded: '0008000000000000000006035553440801640a1741204d617468656d6174696' +
    '3616c205472656174697365162102eec7245d6b7d2ccb30380bfbe2a3648cd7a942653' +
    'f5aa340edcea1f28368661958210324653eac434488002cc06bbfb7f10fe18991e35f9' +
    'fe4302dbea6d2353dc0ab1c',
  hash: 'aefe3aa88a69772c246dcaef75ed3e7566c08ecc4e9f995233526a5651fc34cd',
  root: '608407c18ad9a94d9ea2bcdbe170b6c20c462a7833a197621c916f78cf18e624',
  tag: 'lightninginvoice_requestsignature',
};

const tests = [
  {
    args: {records},
    description: 'A message name is required',
    error: 'ExpectedMessageNameToDeriveUnsignedDetails',
  },
  {
    args: {message: 'invoice_request'},
    description: 'Records are required',
    error: 'ExpectedArrayOfRecordsToDeriveUnsignedDetails',
  },
  {
    args: {message: 'invoice_request', records: [{}]},
    description: 'Record types are required',
    error: 'ExpectedRecordTypesToDeriveUnsignedDetails',
  },
  {
    args: {message: 'invoice_request', records: [{type: '1'}]},
    description: 'Record values are required',
    error: 'ExpectedRecordValuesToDeriveUnsignedDetails',
  },
  {
    expected,
    args: {records, message: 'invoice_request'},
    description: 'Unsigned details are derived',
  },
  {
    expected,
    args: {message: 'invoice_request', records: [].concat(records, signature)},
    description: 'Signature records are excluded from the unsigned details',
  },
];

proofInvoices.forEach(vector => {
  // The unsigned stream is the invoice without its signature record
  const signatureRecord = `f040${vector.working.invoice_signature}`;

  return tests.push({
    args: {message: 'invoice', records: proofRecords(vector)},
    description: `Payer proof vector invoice signing details: ${vector.name}`,
    expected: {
      encoded: vector.input.invoice_hex.replace(signatureRecord, String()),
      hash: vector.working.invoice_sighash,
      root: vector.working.invoice_merkle_root,
      tag: 'lightninginvoicesignature',
    },
  });
});

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => unsignedDetails(args), new Error(error), 'Got error');
    } else {
      strictSame(unsignedDetails(args), expected, 'Got expected result');
    }

    return end();
  });
});
