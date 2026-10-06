const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const proofVectors = require('./vectors/payer_proofs.json');
const verifySignature = require('./../../bolt12/verify_signature');

// From the BOLT 12 signature test vectors
const hash = 'aefe3aa88a69772c246dcaef75ed3e7566c08ecc4e9f995233526a5651fc34cd';

const publicKey =
  '0324653eac434488002cc06bbfb7f10fe18991e35f9fe4302dbea6d2353dc0ab1c';

const signature = 'b8f83ea3288cfd6ea510cdb481472575141e8d8744157f98562d162cc1' +
  'c472526fdb24befefbdebab4dbb726bbd1b7d8aec057f8fa805187e5950d2bbe0e5642';

const makeArgs = overrides => {
  const args = {hash, signature, public_key: publicKey};

  Object.keys(overrides).forEach(k => args[k] = overrides[k]);

  return args;
};

const tests = [
  {
    args: makeArgs({hash: undefined}),
    description: 'A hash is required',
    error: 'ExpectedHexEncodedHashToVerifySignature',
  },
  {
    args: makeArgs({hash: '00'}),
    description: 'A 32 byte hash is required',
    error: 'ExpectedHashByteLengthToVerifySignature',
  },
  {
    args: makeArgs({public_key: undefined}),
    description: 'A public key is required',
    error: 'ExpectedHexEncodedPublicKeyToVerifySignature',
  },
  {
    args: makeArgs({public_key: '00'}),
    description: 'A compressed public key is required',
    error: 'ExpectedCompressedPublicKeyToVerifySignature',
  },
  {
    args: makeArgs({public_key: Buffer.alloc(33).toString('hex')}),
    description: 'A valid public key is required',
    error: 'ExpectedValidPublicKeyToVerifySignature',
  },
  {
    args: makeArgs({signature: undefined}),
    description: 'A signature is required',
    error: 'ExpectedHexEncodedSignatureToVerifySignature',
  },
  {
    args: makeArgs({signature: '00'}),
    description: 'A 64 byte signature is required',
    error: 'ExpectedSignatureByteLengthToVerifySignature',
  },
  {
    args: makeArgs({}),
    description: 'A valid signature is verified',
    expected: {is_valid: true},
  },
  {
    args: makeArgs({hash: hash.replace(/a/g, 'b')}),
    description: 'An invalid signature is not verified',
    expected: {is_valid: false},
  },
];

// The payer proof test vectors have invoice signatures by the invoice node id
proofVectors.valid_vectors.forEach(vector => {
  return tests.push({
    args: {
      hash: vector.working.invoice_sighash,
      public_key: proofVectors.keys.invoice_node_id.pubkey,
      signature: vector.working.invoice_signature,
    },
    description: `Payer proof vector invoice signature: ${vector.name}`,
    expected: {is_valid: true},
  });
});

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => verifySignature(args), new Error(error), 'Got error');
    } else {
      strictSame(verifySignature(args), expected, 'Got expected result');
    }

    return end();
  });
});
