const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const {encodeTlvStream} = require('bolt01');

const {createOffer} = require('./../../');
const {createSignedInvoiceRequest} = require('./../../');
const {createUnsignedInvoice} = require('./../../');
const {createUnsignedInvoiceRequest} = require('./../../');

const alice =
  '02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619';
const bob =
  '0324653eac434488002cc06bbfb7f10fe18991e35f9fe4302dbea6d2353dc0ab1c';
const bobSecret = Buffer.alloc(32, 0x42).toString('hex');
const key =
  '020202020202020202020202020202020202020202020202020202020202020202';
const metadata = '0000000000000000';
const tag = 'lightninginvoicesignature';

// From the BOLT 12 signature test vectors: Bob requests an invoice
const request =
  'lnr1qqyqqqqqqqqqqqqqqcp4256ypqqkgzshgysy6ct5dpjk6ct5d93kzmpq23e' +
  'x2ct5d9ek293pqthvwfzadd7jejes8q9lhc4rvjxd022zv5l44g6qah82ru5rdpnpjkppqvjx' +
  '204vgdzgsqpvcp4mldl3plscny0rt707gvpdh6ndydfacz43euzqhrurageg3n7kafgsek6gz' +
  '3e9w52parv8gs2hlxzk95tzeswywffxlkeyhml0hh46kndmwf4m6xma3tkq2lu04qz3slje2r' +
  'fthc89vss';

const requestEncoded = '0008000000000000000006035553440801640a1741204d6174' +
  '68656d61746963616c205472656174697365162102eec7245d6b7d2ccb30380bfbe2a364' +
  '8cd7a942653f5aa340edcea1f28368661958210324653eac434488002cc06bbfb7f10fe1' +
  '8991e35f9fe4302dbea6d2353dc0ab1c';

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

// Sign a request for an offer with Bob's payer key
const sign = unsigned => createSignedInvoiceRequest({
  encoded: unsigned.encoded,
  secret: bobSecret,
});

// A request for an offer with an amount and a quantity
const quantityRequest = createUnsignedInvoiceRequest({
  metadata,
  offer: createOffer({
    description: 'coffee',
    issuer_id: alice,
    max_quantity: 3,
    mtokens: '250000',
  }).offer,
  payer_id: bob,
  quantity: 2,
});

// A request for an offer that has already expired
const expiredRequest = encodeTlvStream({
  records: [
    {type: '0', value: metadata},
    {type: '10', value: '5465737420766563746f7273'},
    {type: '14', value: '01'},
    {type: '22', value: alice},
    {type: '82', value: '03e8'},
    {type: '88', value: bob},
  ],
});

// A request with an amount for an offer without an amount
const amountRequest = createUnsignedInvoiceRequest({
  metadata,
  mtokens: '1000',
  offer: createOffer({description: 'Test vectors', issuer_id: alice}).offer,
  payer_id: bob,
});

// A request that is not for an offer, which is not signed
const standaloneRequest = createUnsignedInvoiceRequest({
  metadata,
  description: 'refund',
  mtokens: '1000',
  payer_id: bob,
});

// A request that is not for an offer, which has expired
const expiredStandaloneRequest = createUnsignedInvoiceRequest({
  metadata,
  description: 'refund',
  expires_at: '2020-01-01T00:00:00.000Z',
  mtokens: '1000',
  payer_id: bob,
});

// A request for an offer that is only for testnet
const testnetRequest = createUnsignedInvoiceRequest({
  metadata,
  mtokens: '1000',
  offer: createOffer({
    description: 'Test vectors',
    issuer_id: alice,
    networks: ['testnet'],
  }).offer,
  payer_id: bob,
});

// A request for an offer that only has a path, which ends at Alice
const pathRequest = createUnsignedInvoiceRequest({
  metadata,
  offer: createOffer({
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
  }).offer,
  payer_id: bob,
});

// The invoice records follow the request records in an invoice
const paths = `a067${key}${key}01${key}000100`;
const payinfo = 'a21c000003e800000064009000000000000003e80000000005f5e1000000';
const paymentHash = `a820${'01'.repeat(32)}`;

// An experimental invoice record, which encodes with a four byte type
const record = {type: '3000805805', value: '0102'};

const makeArgs = overrides => {
  const args = {
    request,
    created_at: '1970-01-01T00:00:01.000Z',
    id: '01'.repeat(32),
    mtokens: '10000',
    paths: [path],
  };

  Object.keys(overrides).forEach(k => args[k] = overrides[k]);

  return args;
};

const tests = [
  {
    args: makeArgs({request: undefined}),
    description: 'A request is required',
    error: 'ExpectedEncodedRequestOrRequestToParseInvoiceRequest',
  },
  {
    args: makeArgs({mtokens: undefined}),
    description: 'An amount is required for a currency offer',
    error: 'ExpectedMillitokensToCreateInvoiceForRequest',
  },
  {
    args: makeArgs({mtokens: 'abc'}),
    description: 'A millitokens number string is required',
    error: 'ExpectedMillitokensNumberStringToCreateInvoice',
  },
  {
    args: makeArgs({mtokens: '1', request: sign(amountRequest).request}),
    description: 'The amount must match the requested amount',
    error: 'ExpectedInvoiceMillitokensToMatchRequestMillitokens',
  },
  {
    args: makeArgs({node_id: bob}),
    description: 'The node id must match the offer issuer id',
    error: 'ExpectedInvoiceNodeIdToMatchOfferIssuerId',
  },
  {
    args: makeArgs({mtokens: '1', request: sign(quantityRequest).request}),
    description: 'The amount must match the offer amount times the quantity',
    error: 'ExpectedInvoiceMillitokensToMatchRequestMillitokens',
  },
  {
    args: makeArgs({created_at: 'never'}),
    description: 'A valid created at date is required',
    error: 'ExpectedValidCreatedAtDateToCreateInvoice',
  },
  {
    args: makeArgs({created_at: '+275760-09-13T00:00:00.000Z'}),
    description: 'A created at date must leave room for the default expiry',
    error: 'ExpectedCreatedAtDateWithinRangeToCreateInvoice',
  },
  {
    args: makeArgs({
      mtokens: undefined,
      request: sign(expiredRequest).request,
    }),
    description: 'An invoice cannot be created for an expired offer',
    error: 'ExpectedUnexpiredOfferToCreateInvoice',
  },
  {
    args: makeArgs({
      mtokens: undefined,
      node_id: alice,
      request: expiredStandaloneRequest.request,
    }),
    description: 'An expired request without an offer is not responded to',
    error: 'ExpectedUnexpiredInvoiceRequestToCreateInvoice',
  },
  {
    args: makeArgs({mtokens: undefined, request: sign(pathRequest).request}),
    description: 'A node id is required for an offer without an issuer id',
    error: 'ExpectedNodeIdToCreateInvoiceForRequest',
  },
  {
    args: makeArgs({
      mtokens: undefined,
      node_id: bob,
      request: sign(pathRequest).request,
    }),
    description: 'A node id for an offer with paths is a final path node id',
    error: 'ExpectedNodeIdFromOfferPathsToCreateInvoice',
  },
  {
    args: makeArgs({mtokens: undefined, request: standaloneRequest.request}),
    description: 'A node id is required when there is no issuer id',
    error: 'ExpectedNodeIdToCreateInvoiceForRequest',
  },
  {
    args: makeArgs({
      chain_addresses: ['bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'],
      mtokens: undefined,
      request: sign(testnetRequest).request,
    }),
    description: 'Chain addresses must be for the network of the request',
    error: 'ExpectedChainAddressForNetworkToEncodeAsFallback',
  },
  {
    args: makeArgs({
      mtokens: undefined,
      node_id: alice,
      records: 'records',
      request: sign(pathRequest).request,
    }),
    description: 'An array of experimental records is required',
    error: 'ExpectedArrayOfRecordsToCreateInvoice',
  },
  {
    args: makeArgs({
      mtokens: undefined,
      node_id: alice,
      records: [{type: '161', value: '00'}],
      request: sign(pathRequest).request,
    }),
    description: 'Only experimental invoice records can be added',
    error: 'ExpectedExperimentalInvoiceRecordsToCreateInvoice',
  },
  {
    args: makeArgs({
      mtokens: undefined,
      node_id: alice,
      records: [{type: '2000000001', value: '00'}],
      request: sign(pathRequest).request,
    }),
    description: 'Experimental request records cannot be added',
    error: 'ExpectedExperimentalInvoiceRecordsToCreateInvoice',
  },
  {
    args: makeArgs({
      mtokens: undefined,
      node_id: alice,
      records: [record, record],
      request: sign(pathRequest).request,
    }),
    description: 'Experimental record types must be unique',
    error: 'ExpectedUniqueRecordTypesToCreateInvoice',
  },
  {
    args: makeArgs({}),
    description: 'An unsigned invoice is created',
    expected: {
      tag,
      encoded: `${requestEncoded}${paths}${payinfo}a40101${paymentHash}` +
        `aa022710b021${alice}`,
      hash: '038299fd0f5076fe5c7bf8dc07e7ce6faef063ff610afdab2f7e434fad3ce2e5',
      root: '30d3bfcb5d9288224876395c9956a84657e752c0d97d1b559fe47ffd17bbc1f5',
    },
  },
  {
    args: makeArgs({
      mtokens: undefined,
      request: sign(quantityRequest).request,
    }),
    description: 'The amount defaults to the offer amount times the quantity',
    expected: {
      tag,
      encoded: `${quantityRequest.encoded}${paths}${payinfo}a40101` +
        `${paymentHash}aa0307a120b021${alice}`,
      hash: '37c1c4e5607c980aff10394aa5a8aa7abf8246d20622ba01036dd59b43a25902',
      root: '0188dc02cdbe702adee40f76e58d2c71da2a332bf454ef9971ea497d5df2c8eb',
    },
  },
  {
    args: makeArgs({
      expires_at: '1970-01-01T01:00:01.000Z',
      mtokens: undefined,
      node_id: alice,
      request: standaloneRequest.request,
    }),
    description: 'A node id and expiry are set for a request without an offer',
    expected: {
      tag,
      encoded: `${standaloneRequest.encoded}${paths}${payinfo}a40101` +
        `a6020e10${paymentHash}aa0203e8b021${alice}`,
      hash: 'a062cc1cf76c40d8e2d8739e3f8e69ea345de30fa5325d7e041e21405946fd3c',
      root: '1d593e4fc3fcfc54835a68190d38a398bdaa5c21031925cbc229d410f943d944',
    },
  },
  {
    args: makeArgs({mtokens: '01000', request: sign(amountRequest).request}),
    description: 'An amount with leading zeros matches the requested amount',
    expected: {
      tag,
      encoded: `${amountRequest.encoded}${paths}${payinfo}a40101` +
        `${paymentHash}aa0203e8b021${alice}`,
      hash: 'f2116b409af0d007fbbc48cb932b1a5274542c5cab09f801757cf41e2e8c09d9',
      root: 'baa6033e5dd13c8630ad6340b2e3afadcd7a88998f70b52f5ee29bf01874e4e2',
    },
  },
  {
    args: makeArgs({created_at: '1970-01-01T00:00:00.000Z'}),
    description: 'An invoice created at the epoch has a zero created at',
    expected: {
      tag,
      encoded: `${requestEncoded}${paths}${payinfo}a400${paymentHash}` +
        `aa022710b021${alice}`,
      hash: '33226bae2ab74341f11d9e842b09199ab274c8b2f505d5c149ac1b3419ba8d27',
      root: '0af22565728a318a1b22c304c952cd6291b1a1f175642bd40c2af3e3e640121d',
    },
  },
  {
    args: makeArgs({
      chain_addresses: ['tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx'],
      mtokens: undefined,
      request: sign(testnetRequest).request,
    }),
    description: 'An invoice for a testnet request has testnet fallbacks',
    expected: {
      tag,
      encoded: `${testnetRequest.encoded}${paths}${payinfo}a40101` +
        `${paymentHash}aa0203e8` +
        'ac17000014751e76e8199196d454941c45d1b3a323f1433bd6' +
        `b021${alice}`,
      hash: '0af026ebbd188e2981535be3473dc1fac2642aac3991bfe3cb7fa50f48fb1390',
      root: '0ce745e2b05a7c56023f05c65bb811e3057f28c2e8da3b4b0f845a67ac819da9',
    },
  },
  {
    args: makeArgs({
      mtokens: undefined,
      node_id: alice.toUpperCase(),
      request: sign(pathRequest).request,
    }),
    description: 'An invoice for an offer with paths uses a path node id',
    expected: {
      tag,
      encoded: `${pathRequest.encoded}${paths}${payinfo}a40101${paymentHash}` +
        `aa0203e8b021${alice}`,
      hash: 'f999c552e310fe6b19a5367505f34d5907f213572b60a912661c07c07572c6ac',
      root: 'cdef421d52847b075f70851dfb5a0bc5e6e8cbdcbd57f42b10d122a661e93777',
    },
  },
  {
    args: makeArgs({
      mtokens: undefined,
      node_id: alice,
      records: [record],
      request: sign(pathRequest).request,
    }),
    description: 'An invoice can have experimental invoice records',
    expected: {
      tag,
      encoded: `${pathRequest.encoded}${paths}${payinfo}a40101${paymentHash}` +
        `aa0203e8b021${alice}feb2dca9ad020102`,
      hash: '91a18a87083c17b9eba676c555f66752f358272896dbfa6c60988630040d14ce',
      root: '51adbf9771f5e2576c77c3021512ac010d011c79005c4d3f352ae4a5248339df',
    },
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => createUnsignedInvoice(args), new Error(error), 'Got error');
    } else {
      strictSame(createUnsignedInvoice(args), expected, 'Got expected result');
    }

    return end();
  });
});
