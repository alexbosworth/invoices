const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const {signSchnorr} = require('tiny-secp256k1');

const {createSignedInvoice} = require('./../../');
const {createUnsignedInvoice} = require('./../../');
const hexAsString = require('./../../bolt12/hex_as_string');
const {parseInvoice} = require('./../../');

const aliceSecret = Buffer.alloc(32, 0x41).toString('hex');
const bobSecret = Buffer.alloc(32, 0x42).toString('hex');
const key =
  '020202020202020202020202020202020202020202020202020202020202020202';

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

const unsigned = createUnsignedInvoice({
  request,
  created_at: '1970-01-01T00:00:01.000Z',
  id: '01'.repeat(32),
  mtokens: '10000',
  paths: [path],
});

// Sign the hash directly with Alice's key
const signature = Buffer.from(signSchnorr(
  Buffer.from(unsigned.hash, 'hex'),
  Buffer.from(aliceSecret, 'hex'),
  Buffer.alloc(32)
)).toString('hex');

// The signed invoice is the unsigned invoice with the signature record added
const encoded = `${unsigned.encoded}f040${signature}`;

const invoice = hexAsString({hex: encoded, prefix: 'lni'}).string;

const tests = [
  {
    args: {signature},
    description: 'An encoded unsigned invoice is required',
    error: 'ExpectedHexEncodedUnsignedStreamToSignStream',
  },
  {
    args: {encoded: unsigned.encoded},
    description: 'A secret or a signature is required',
    error: 'ExpectedSecretKeyOrSignatureToSignStream',
  },
  {
    args: {encoded: unsigned.encoded, secret: bobSecret},
    description: 'The node id secret is required',
    error: 'ExpectedSecretKeyForSigningPublicKeyToSignStream',
  },
  {
    args: {encoded: unsigned.encoded, signature: signature.replace(/a/g, 'b')},
    description: 'A valid signature is required',
    error: 'ExpectedValidSignatureForSigningPublicKeyToSignStream',
  },
  {
    args: {signature, encoded: unsigned.encoded},
    description: 'A signed invoice is assembled with a signature',
    expected: {encoded, invoice},
  },
  {
    args: {encoded: unsigned.encoded, secret: aliceSecret},
    description: 'A signed invoice is assembled with a secret',
    expected: {},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => createSignedInvoice(args), new Error(error), 'Got error');
    } else {
      const signed = createSignedInvoice(args);

      // A signature made with a secret is not predictable, but is valid
      if (!!expected.encoded) {
        strictSame(signed, expected, 'Got expected signed invoice');
      }

      const parsed = parseInvoice({invoice: signed.invoice});

      strictSame(parsed.encoded, signed.encoded, 'Signed invoice is parsed');
    }

    return end();
  });
});
