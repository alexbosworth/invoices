const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const {encodeTlvStream} = require('bolt01');

const {createOffer} = require('./../../');
const {createSignedInvoice} = require('./../../');
const {createSignedInvoiceRequest} = require('./../../');
const {createUnsignedInvoice} = require('./../../');
const {createUnsignedInvoiceRequest} = require('./../../');
const hexAsRecords = require('./../../bolt12/hex_as_records');
const hexAsString = require('./../../bolt12/hex_as_string');
const {parseInvoice} = require('./../../');
const proofVectors = require('./vectors/payer_proofs.json');
const signStream = require('./../../bolt12/sign_stream');

const alice =
  '02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619';
const aliceSecret = Buffer.alloc(32, 0x41).toString('hex');
const bob =
  '0324653eac434488002cc06bbfb7f10fe18991e35f9fe4302dbea6d2353dc0ab1c';
const bobSecret = Buffer.alloc(32, 0x42).toString('hex');
const key =
  '020202020202020202020202020202020202020202020202020202020202020202';
const metadata = '0000000000000000';
const prefix = 'lni';

// From the BOLT 12 signature test vectors: Bob requests an invoice
const request =
  'lnr1qqyqqqqqqqqqqqqqqcp4256ypqqkgzshgysy6ct5dpjk6ct5d93kzmpq23e' +
  'x2ct5d9ek293pqthvwfzadd7jejes8q9lhc4rvjxd022zv5l44g6qah82ru5rdpnpjkppqvjx' +
  '204vgdzgsqpvcp4mldl3plscny0rt707gvpdh6ndydfacz43euzqhrurageg3n7kafgsek6gz' +
  '3e9w52parv8gs2hlxzk95tzeswywffxlkeyhml0hh46kndmwf4m6xma3tkq2lu04qz3slje2r' +
  'fthc89vss';

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

// Alice makes an invoice for Bob's request
const invoice = createSignedInvoice({
  encoded: createUnsignedInvoice({
    request,
    chain_addresses: ['bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'],
    created_at: '1970-01-01T00:00:01.000Z',
    features: [{bit: 17}],
    id: '01'.repeat(32),
    mtokens: '10000',
    paths: [path],
  }).encoded,
  secret: aliceSecret,
});

const {records} = hexAsRecords({hex: invoice.encoded});

// Alice makes an invoice for a request that is not for an offer
const standaloneInvoice = createSignedInvoice({
  encoded: createUnsignedInvoice({
    created_at: '1970-01-01T00:00:01.000Z',
    encoded: createUnsignedInvoiceRequest({
      metadata,
      description: 'refund',
      issuer: 'me',
      mtokens: '1000',
      payer_id: bob,
    }).encoded,
    id: '01'.repeat(32),
    node_id: alice,
    paths: [path],
  }).encoded,
  secret: aliceSecret,
});

// Bob requests an invoice for an offer that only has a path ending at Alice
const pathOffer = createOffer({
  description: 'Test vectors',
  mtokens: '1000',
  paths: [{
    key,
    hops: [
      {encrypted_data: '00', relay_key: key},
      {encrypted_data: '01', relay_key: alice},
    ],
    introduction_node: key,
  }],
});

const pathRequest = createSignedInvoiceRequest({
  encoded: createUnsignedInvoiceRequest({
    metadata,
    offer: pathOffer.offer,
    payer_id: bob,
  }).encoded,
  secret: bobSecret,
});

const pathInvoice = createSignedInvoice({
  encoded: createUnsignedInvoice({
    created_at: '1970-01-01T00:00:01.000Z',
    encoded: pathRequest.encoded,
    id: '01'.repeat(32),
    node_id: alice,
    paths: [path],
  }).encoded,
  secret: aliceSecret,
});

// Alice makes an invoice for a request that specifies an amount
const amountInvoice = createSignedInvoice({
  encoded: createUnsignedInvoice({
    created_at: '1970-01-01T00:00:01.000Z',
    encoded: createSignedInvoiceRequest({
      encoded: createUnsignedInvoiceRequest({
        metadata,
        mtokens: '1000',
        offer: createOffer({description: 'tip', issuer_id: alice}).offer,
        payer_id: bob,
      }).encoded,
      secret: bobSecret,
    }).encoded,
    id: '01'.repeat(32),
    paths: [path],
  }).encoded,
  secret: aliceSecret,
});

// Re-sign records that have been changed, without checking their validity
const resign = (alter, secret, source) => {
  const changed = (source || records).filter(n => n.type !== '240').map(alter);

  const {encoded} = encodeTlvStream({records: changed});

  const signed = signStream({encoded, secret, message: 'invoice', type: '176'});

  return signed.encoded;
};

// Records with an extra record added
const withRecord = record => encodeTlvStream({
  records: [].concat(records).concat(record),
}).encoded;

// A record in the signature range that is not the signature is ignored
const oddSignatureRecord = withRecord({type: '241', value: '00'});

// The signature record value of an encoded invoice
const signatureOf = hex => {
  return hexAsRecords({hex}).records.find(n => n.type === '240').value;
};

const expected = {
  metadata,
  bip353_name: undefined,
  chain_addresses: ['bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'],
  created_at: '1970-01-01T00:00:01.000Z',
  description: undefined,
  encoded: invoice.encoded,
  expires_at: '1970-01-01T02:00:01.000Z',
  features: [{bit: 17, is_required: false, type: 'multipath_payments_v0'}],
  id: '01'.repeat(32),
  invoice: invoice.invoice,
  is_expired: true,
  issuer: undefined,
  mtokens: '10000',
  network: 'bitcoin',
  node_id: alice,
  offer: 'lno1qcp4256ypqqkgzshgysy6ct5dpjk6ct5d93kzmpq23ex2ct5d9ek293pqthvwf' +
    'zadd7jejes8q9lhc4rvjxd022zv5l44g6qah82ru5rdpnpj',
  paths: [{
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
  }],
  payer_id: bob,
  payer_note: undefined,
  quantity: undefined,
  safe_tokens: 10,
  signature: signatureOf(invoice.encoded),
  tokens: 10,
};

const tests = [
  {
    args: {},
    description: 'An encoded invoice or invoice is required',
    error: 'ExpectedEncodedInvoiceOrInvoiceToParseInvoice',
  },
  {
    args: {encoded: invoice.encoded, invoice: invoice.invoice},
    description: 'Only one of encoded invoice or invoice is allowed',
    error: 'UnexpectedEncodedInvoiceAndInvoiceToParseInvoice',
  },
  {
    args: {encoded: 'zz'},
    description: 'A hex encoded invoice is required',
    error: 'ExpectedHexEncodedInvoiceToParseInvoice',
  },
  {
    args: {invoice: 1},
    description: 'An invoice string is required',
    error: 'ExpectedInvoiceStringToParseInvoice',
  },
  {
    args: {invoice: 'lno1'},
    description: 'An invoice prefix is required',
    error: 'UnexpectedPrefixInBolt12String',
  },
  {
    args: {encoded: invoice.encoded, request: 1},
    description: 'A request string is required to check the request',
    error: 'ExpectedInvoiceRequestStringToParseInvoice',
  },
  {
    args: {encoded: invoice.encoded, request: pathRequest.request},
    description: 'The invoice must be for the request that was sent',
    error: 'ExpectedInvoiceFieldsToMatchInvoiceRequestFields',
  },
  {
    args: {
      encoded: resign(
        n => n.type !== '176' ? n : {...n, value: bob},
        bobSecret,
        hexAsRecords({hex: pathInvoice.encoded}).records
      ),
    },
    description: 'An invoice for an offer with paths is from a path node',
    error: 'ExpectedInvoiceNodeIdToBeOfferPathNodeId',
  },
  {
    args: {encoded: withRecord({type: '1002', value: '00'})},
    description: 'Records outside of the invoice range are not allowed',
    error: 'UnexpectedRecordTypeOutsideInvoiceRangeInInvoice',
  },
  {
    args: {encoded: withRecord({type: '242', value: '00'})},
    description: 'Unknown even signature types are not allowed',
    error: 'UnexpectedUnknownEvenSignatureTypeInInvoice',
  },
  {
    args: {
      encoded: encodeTlvStream({
        records: records.filter(n => n.type !== '240'),
      }).encoded,
    },
    description: 'A signature is required',
    error: 'ExpectedSignatureInInvoice',
  },
  {
    args: {
      encoded: resign(
        n => n.type !== '176' ? n : {...n, value: bob},
        bobSecret
      ),
    },
    description: 'The node id must be the offer issuer id',
    error: 'ExpectedInvoiceNodeIdToBeOfferIssuerId',
  },
  {
    args: {
      encoded: resign(
        n => n.type !== '170' ? n : {...n, value: '01'},
        aliceSecret,
        hexAsRecords({hex: amountInvoice.encoded}).records
      ),
    },
    description: 'The amount must be the requested amount',
    error: 'ExpectedInvoiceAmountToBeRequestedAmount',
  },
  {
    args: {
      encoded: encodeTlvStream({
        records: records.map(n => n.type !== '240' ? n : {...n, value: '00'}),
      }).encoded,
    },
    description: 'A valid signature encoding is required',
    error: 'ExpectedValidSignatureEncodingInInvoice',
  },
  {
    args: {
      encoded: encodeTlvStream({
        records: records.map(n => n.type !== '240' ? n : {
          type: n.type,
          value: '00'.repeat(64),
        }),
      }).encoded,
    },
    description: 'A valid node id signature is required',
    error: 'ExpectedValidNodeIdSignatureInInvoice',
  },
  {
    expected,
    args: {invoice: invoice.invoice},
    description: 'An invoice is parsed',
  },
  {
    expected,
    args: {encoded: invoice.encoded},
    description: 'An encoded invoice is parsed',
  },
  {
    expected,
    args: {request, invoice: invoice.invoice},
    description: 'An invoice for the request that was sent is parsed',
  },
  {
    expected,
    args: {encoded: invoice.encoded.toUpperCase()},
    description: 'An uppercase encoded invoice is parsed',
  },
  {
    args: {encoded: oddSignatureRecord},
    description: 'An odd signature range record is ignored',
    expected: {
      ...expected,
      encoded: oddSignatureRecord,
      invoice: hexAsString({prefix, hex: oddSignatureRecord}).string,
    },
  },
  {
    args: {encoded: standaloneInvoice.encoded},
    description: 'An invoice for a request without an offer is parsed',
    expected: {
      ...expected,
      chain_addresses: undefined,
      description: 'refund',
      encoded: standaloneInvoice.encoded,
      features: [],
      invoice: standaloneInvoice.invoice,
      issuer: 'me',
      mtokens: '1000',
      offer: undefined,
      safe_tokens: 1,
      signature: signatureOf(standaloneInvoice.encoded),
      tokens: 1,
    },
  },
  {
    args: {encoded: pathInvoice.encoded, request: pathRequest.request},
    description: 'An invoice from an offer path node matches its request',
    expected: {
      ...expected,
      chain_addresses: undefined,
      encoded: pathInvoice.encoded,
      features: [],
      invoice: pathInvoice.invoice,
      mtokens: '1000',
      offer: pathOffer.offer,
      safe_tokens: 1,
      signature: signatureOf(pathInvoice.encoded),
      tokens: 1,
    },
  },
];

// The BOLT 12 payer proof test vectors have externally created invoices
const proofInvoices = proofVectors.valid_vectors.filter((vector, i, all) => {
  return all.findIndex(n => n.input.invoice === vector.input.invoice) === i;
});

// Expected details for the payer proof test vector invoices
const proofExpected = {
  full_disclosure: {
    features: [{bit: 99, is_required: false, type: undefined}],
  },
  minimal_disclosure: {},
};

proofInvoices.forEach(vector => {
  return tests.push({
    args: {invoice: vector.input.invoice},
    description: `Payer proof vector invoice is parsed: ${vector.name}`,
    expected: {
      bip353_name: undefined,
      chain_addresses: undefined,
      created_at: '2024-12-06T04:11:52.000Z',
      description: undefined,
      encoded: vector.input.invoice_hex,
      expires_at: '2024-12-06T06:11:52.000Z',
      features: [],
      id: '72cd6e8422c407fb6d098690f1130b7ded7ec2f7f5e1d30bd9d521f015363793',
      invoice: vector.input.invoice,
      is_expired: true,
      issuer: undefined,
      metadata: '00'.repeat(16),
      mtokens: '1000',
      network: 'bitcoin',
      node_id: proofVectors.keys.invoice_node_id.pubkey,
      offer: 'lno1zcssyj7z5vfx29flqlnsuzatppeyu6u9ugtl3ntz3n4k996zg7a5jvuz',
      paths: [{
        base_fee_mtokens: '1',
        cltv_delta: 3,
        features: [],
        fee_rate: 2,
        hops: [{
          encrypted_data: '00'.repeat(16),
          relay_key: proofVectors.keys.blinded_node_id.pubkey,
        }],
        introduction_edge: undefined,
        introduction_node: proofVectors.keys.first_node_id.pubkey,
        key: proofVectors.keys.first_path_key.pubkey,
        max_htlc_mtokens: '5',
        min_htlc_mtokens: '4',
      }],
      payer_id: proofVectors.keys.invreq_payer_id.pubkey,
      payer_note: undefined,
      quantity: undefined,
      safe_tokens: 1,
      signature: vector.working.invoice_signature,
      tokens: 1,
      ...proofExpected[vector.name],
    },
  });
});

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => parseInvoice(args), new Error(error), 'Got expected error');
    } else {
      strictSame(parseInvoice(args), expected, 'Got expected invoice details');
    }

    return end();
  });
});
