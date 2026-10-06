const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const {verifySchnorr} = require('tiny-secp256k1');

const signStream = require('./../../bolt12/sign_stream');

// The payer id x-only key and the signature hash from the test vectors
const hash = 'aefe3aa88a69772c246dcaef75ed3e7566c08ecc4e9f995233526a5651fc34cd';
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const publicKey =
  '24653eac434488002cc06bbfb7f10fe18991e35f9fe4302dbea6d2353dc0ab1c';
const signatureHexLength = 128;

// Signatures have random auxiliary bytes, so they are checked for validity
const isValidSignature = signature => verifySchnorr(
  hexAsBuffer(hash),
  hexAsBuffer(publicKey),
  hexAsBuffer(signature)
);

// From the BOLT 12 signature test vectors: Bob requests an invoice
const encoded = '0008000000000000000006035553440801640a1741204d617468656d6174' +
  '6963616c205472656174697365162102eec7245d6b7d2ccb30380bfbe2a3648cd7a9426' +
  '53f5aa340edcea1f28368661958210324653eac434488002cc06bbfb7f10fe18991e35f' +
  '9fe4302dbea6d2353dc0ab1c';

const signature = 'b8f83ea3288cfd6ea510cdb481472575141e8d8744157f98562d162cc1' +
  'c472526fdb24befefbdebab4dbb726bbd1b7d8aec057f8fa805187e5950d2bbe0e5642';

const makeArgs = overrides => {
  const args = {encoded, signature, message: 'invoice_request', type: '88'};

  Object.keys(overrides).forEach(k => args[k] = overrides[k]);

  return args;
};

const tests = [
  {
    args: makeArgs({encoded: undefined}),
    description: 'An encoded stream is required',
    error: 'ExpectedHexEncodedUnsignedStreamToSignStream',
  },
  {
    args: makeArgs({message: undefined}),
    description: 'A message name is required',
    error: 'ExpectedMessageNameToSignStream',
  },
  {
    args: makeArgs({signature: undefined}),
    description: 'A secret or a signature is required',
    error: 'ExpectedSecretKeyOrSignatureToSignStream',
  },
  {
    args: makeArgs({secret: Buffer.alloc(32, 0x42).toString('hex')}),
    description: 'Only one of a secret or a signature is allowed',
    error: 'UnexpectedSecretKeyAndSignatureToSignStream',
  },
  {
    args: makeArgs({type: undefined}),
    description: 'A signing key record type is required',
    error: 'ExpectedSigningKeyRecordTypeToSignStream',
  },
  {
    args: makeArgs({encoded: `${encoded}f040${signature}`}),
    description: 'An already signed stream is not allowed',
    error: 'UnexpectedSignatureRecordInUnsignedStreamToSign',
  },
  {
    args: makeArgs({type: '176'}),
    description: 'A signing key record is required',
    error: 'ExpectedSigningPublicKeyRecordInStreamToSign',
  },
  {
    args: makeArgs({
      secret: Buffer.alloc(32, 0x41).toString('hex'),
      signature: undefined,
    }),
    description: 'The secret must be for the signing public key',
    error: 'ExpectedSecretKeyForSigningPublicKeyToSignStream',
  },
  {
    args: makeArgs({signature: '00'}),
    description: 'A valid signature encoding is required',
    error: 'ExpectedValidSignatureEncodingToSignStream',
  },
  {
    args: makeArgs({signature: signature.replace(/a/g, 'b')}),
    description: 'A valid signature is required',
    error: 'ExpectedValidSignatureForSigningPublicKeyToSignStream',
  },
  {
    args: makeArgs({}),
    description: 'A signature is added to the stream',
    expected: {encoded: `${encoded}f040${signature}`},
  },
  {
    args: makeArgs({
      secret: Buffer.alloc(32, 0x42).toString('hex'),
      signature: undefined,
    }),
    description: 'A stream is signed with a secret',
    expected: {encoded: `${encoded}f040`},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => signStream(args), new Error(error), 'Got expected error');
    } else {
      const signed = signStream(args);

      // A signature made with a secret is not predictable, but is valid
      const signature = signed.encoded.slice(-signatureHexLength);

      strictSame(signed.encoded.startsWith(expected.encoded), true, 'Stream');
      strictSame(isValidSignature(signature), true, 'Got a valid signature');
    }

    return end();
  });
});
