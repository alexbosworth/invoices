const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const {encodeTlvStream} = require('bolt01');

const {createOffer} = require('./../../');
const {createUnsignedInvoiceRequest} = require('./../../');
const hexAsString = require('./../../bolt12/hex_as_string');

const alice =
  '02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619';
const bitcoin =
  '6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000';
const bob =
  '0324653eac434488002cc06bbfb7f10fe18991e35f9fe4302dbea6d2353dc0ab1c';
const metadata = '0000000000000000';
const prefix = 'lnr';
const regtest =
  '06226e46111a0b59caaf126043eb5bbf28c34f3a5e332a1fc7b2b73cf188910f';
const tag = 'lightninginvoice_requestsignature';
const testnet =
  '43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000';
const testVectors = '0a0c5465737420766563746f7273';

// From the BOLT 12 signature test vectors: Alice's offer
const {offer} = createOffer({
  amount: '100',
  currency: 'USD',
  description: 'A Mathematical Treatise',
  issuer_id: alice,
});

const {offer: expiredOffer} = createOffer({
  description: 'Test vectors',
  expires_at: '1970-01-01T00:00:01.000Z',
  issuer_id: alice,
});

const {offer: testnetOffer} = createOffer({
  description: 'Test vectors',
  issuer_id: alice,
  networks: ['testnet'],
});

const {offer: multiNetworkOffer} = createOffer({
  description: 'Test vectors',
  issuer_id: alice,
  networks: ['testnet', 'bitcoin'],
});

// An offer with an unknown odd record in the experimental offer range
const experimentalOffer = hexAsString({
  hex: encodeTlvStream({
    records: [
      {type: '2', value: regtest},
      {type: '10', value: '5465737420766563746f7273'},
      {type: '22', value: alice},
      {type: '1000000001', value: '01'},
    ],
  }).encoded,
  prefix: 'lno',
}).string;

// The BOLT 12 signature test vectors invoice request for Alice's offer
const expected = {
  tag,
  encoded: '0008000000000000000006035553440801640a1741204d617468656d6174696' +
    '3616c205472656174697365162102eec7245d6b7d2ccb30380bfbe2a3648cd7a942653' +
    'f5aa340edcea1f28368661958210324653eac434488002cc06bbfb7f10fe18991e35f9' +
    'fe4302dbea6d2353dc0ab1c',
  hash: 'aefe3aa88a69772c246dcaef75ed3e7566c08ecc4e9f995233526a5651fc34cd',
  root: '608407c18ad9a94d9ea2bcdbe170b6c20c462a7833a197621c916f78cf18e624',
};

// A request that is not for an offer is complete without a signature
const refund = '00080000000000000000' +
  '0a06726566756e64' +
  '0e047a4297d8' +
  '12026d65' +
  `5020${testnet}` +
  '520203e8' +
  `5821${bob}`;

const refundWithoutExpiry =
  `000800000000000000000a06726566756e64520203e85821${bob}`;

// A request for an offer copies the offer records and adds request records
const testnetRequest = `0008${metadata}` +
  `0220${testnet}` +
  testVectors +
  `1621${alice}` +
  `5020${testnet}` +
  '520203e8' +
  `5821${bob}`;

const multiNetworkRequest = `0008${metadata}` +
  `0240${testnet}${bitcoin}` +
  testVectors +
  `1621${alice}` +
  '520203e8' +
  `5821${bob}`;

// Experimental offer records sort after the request records
const experimentalRequest = `0008${metadata}` +
  `0220${regtest}` +
  testVectors +
  `1621${alice}` +
  `5020${regtest}` +
  '520203e8' +
  `5821${bob}` +
  'fe3b9aca010101';

const makeArgs = overrides => {
  const args = {metadata, offer, payer_id: bob};

  Object.keys(overrides).forEach(k => args[k] = overrides[k]);

  return args;
};

const tests = [
  {
    args: makeArgs({offer: 1}),
    description: 'An offer string is required',
    error: 'ExpectedOfferStringToCreateInvoiceRequest',
  },
  {
    args: makeArgs({description: 'description'}),
    description: 'A description is not allowed with an offer',
    error: 'UnexpectedDescriptionForOfferToCreateInvoiceRequest',
  },
  {
    args: makeArgs({expires_at: new Date().toISOString()}),
    description: 'An expiry is not allowed with an offer',
    error: 'UnexpectedExpiresAtForOfferToCreateInvoiceRequest',
  },
  {
    args: makeArgs({issuer: 'issuer'}),
    description: 'An issuer is not allowed with an offer',
    error: 'UnexpectedIssuerForOfferToCreateInvoiceRequest',
  },
  {
    args: makeArgs({
      paths: [{
        hops: [{encrypted_data: '00', relay_key: bob}],
        introduction_node: alice,
        key: bob,
      }],
    }),
    description: 'Paths are not allowed with an offer',
    error: 'UnexpectedPathsForOfferToCreateInvoiceRequest',
  },
  {
    args: makeArgs({offer: undefined}),
    description: 'A description is required without an offer',
    error: 'ExpectedDescriptionToCreateInvoiceRequestWithoutOffer',
  },
  {
    args: makeArgs({description: 'refund', offer: undefined}),
    description: 'An amount is required without an offer',
    error: 'ExpectedMillitokensToCreateInvoiceRequestWithoutOffer',
  },
  {
    args: makeArgs({
      description: 'refund',
      expires_at: 'never',
      mtokens: '1',
      offer: undefined,
    }),
    description: 'A valid expiry date is required',
    error: 'ExpectedValidExpiresAtDateToCreateInvoiceRequest',
  },
  {
    args: makeArgs({
      description: 'refund',
      issuer: 1,
      mtokens: '1',
      offer: undefined,
    }),
    description: 'An issuer string is required',
    error: 'ExpectedIssuerStringToCreateInvoiceRequest',
  },
  {
    args: makeArgs({offer: expiredOffer}),
    description: 'An unexpired offer is required',
    error: 'ExpectedUnexpiredOfferToCreateInvoiceRequest',
  },
  {
    args: makeArgs({quantity: 1}),
    description: 'A quantity is not allowed for an offer without quantity',
    error: 'UnexpectedQuantityInInvoiceRequestForOffer',
  },
  {
    expected,
    args: makeArgs({}),
    description: 'An unsigned invoice request is created for an offer',
  },
  {
    args: makeArgs({
      description: 'refund',
      expires_at: '2034-12-31T13:30:00.000Z',
      issuer: 'me',
      mtokens: '1000',
      network: 'testnet',
      offer: undefined,
    }),
    description: 'An unsigned invoice request is created without an offer',
    expected: {
      encoded: refund,
      request: hexAsString({prefix, hex: refund}).string,
    },
  },
  {
    args: makeArgs({description: 'refund', mtokens: '1000', offer: undefined}),
    description: 'An unsigned invoice request without an expiry is created',
    expected: {
      encoded: refundWithoutExpiry,
      request: hexAsString({prefix, hex: refundWithoutExpiry}).string,
    },
  },
  {
    args: makeArgs({mtokens: '1000', offer: testnetOffer}),
    description: 'A testnet offer request defaults to the testnet chain',
    expected: {
      tag,
      encoded: testnetRequest,
      hash: 'fcbacdf60c43daa8ece499257153d59ab30ea356dc458e8b0da2625e6894b250',
      root: '0187cc68a4ac0f5a0d2ec6b2d33eb0bf73e71b216c7aabc090cef282ce9874b6',
    },
  },
  {
    args: makeArgs({mtokens: '1000', offer: multiNetworkOffer}),
    description: 'A request for a bitcoin and testnet offer omits the chain',
    expected: {
      tag,
      encoded: multiNetworkRequest,
      hash: '72b7731eaf5c270ab9a62aa194b7e82ccd7fa4306a0ded6b85f814a451c90761',
      root: '57eeb3445ec42f92d1bafff0c3df6cbe267b30a437eb885c7ac148d94361ec53',
    },
  },
  {
    args: makeArgs({mtokens: '1000', offer: experimentalOffer}),
    description: 'Experimental offer records are copied into the request',
    expected: {
      tag,
      encoded: experimentalRequest,
      hash: '6d70953426dd629e58749734e21a82dcc3fb747244129f2ecb64af55ce807ac8',
      root: 'fedacd2ca6c3b266b40574a3b2261d77815f0b8b8533a2f089e6263ffc27363d',
    },
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(
        () => createUnsignedInvoiceRequest(args),
        new Error(error),
        'Got error'
      );
    } else {
      strictSame(createUnsignedInvoiceRequest(args), expected, 'Got request');
    }

    return end();
  });
});
