const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const {verifySchnorr} = require('tiny-secp256k1');

const signHash = require('./../../bolt12/sign_hash');

// From the BOLT 12 signature test vectors: Bob signs the invoice request
const hash = 'aefe3aa88a69772c246dcaef75ed3e7566c08ecc4e9f995233526a5651fc34cd';
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const publicKey =
  '24653eac434488002cc06bbfb7f10fe18991e35f9fe4302dbea6d2353dc0ab1c';
const secret = Buffer.alloc(32, 0x42).toString('hex');

// Signatures have random auxiliary bytes, so they are checked for validity
const isValidSignature = signature => verifySchnorr(
  hexAsBuffer(hash),
  hexAsBuffer(publicKey),
  hexAsBuffer(signature)
);

const tests = [
  {
    args: {secret},
    description: 'A hash is required',
    error: 'ExpectedHexEncodedHashToSignWithSchnorrSignature',
  },
  {
    args: {secret, hash: 'zz'},
    description: 'A hex hash is required',
    error: 'ExpectedHexEncodedHashToSignWithSchnorrSignature',
  },
  {
    args: {secret, hash: '00'},
    description: 'A 32 byte hash is required',
    error: 'ExpectedHashByteLengthToSignWithSchnorrSignature',
  },
  {
    args: {hash},
    description: 'A secret is required',
    error: 'ExpectedHexEncodedSecretKeyToSignHash',
  },
  {
    args: {hash, secret: 'zz'},
    description: 'A hex secret is required',
    error: 'ExpectedHexEncodedSecretKeyToSignHash',
  },
  {
    args: {hash, secret: '00'},
    description: 'A 32 byte secret is required',
    error: 'ExpectedSecretKeyByteLengthToSignHash',
  },
  {
    args: {hash, secret: Buffer.alloc(32).toString('hex')},
    description: 'A valid secret is required',
    error: 'ExpectedValidSecretKeyToSignHash',
  },
  {
    args: {hash, secret},
    description: 'A hash is signed',
    expected: {public_key: `03${publicKey}`},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => signHash(args), new Error(error), 'Got expected error');
    } else {
      const {public_key, signature} = signHash(args);

      strictSame(public_key, expected.public_key, 'Got signing public key');
      strictSame(isValidSignature(signature), true, 'Got a valid signature');
    }

    return end();
  });
});
