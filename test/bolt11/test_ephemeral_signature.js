const {equal} = require('node:assert').strict;
const {notEqual} = require('node:assert').strict;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const {isPoint} = require('tiny-secp256k1');
const {verify} = require('tiny-secp256k1');

const ephemeralSignature = require('./../../bolt11/ephemeral_signature');

const hash = Buffer.alloc(32, 1);
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const isLowSRequired = true;

const tests = [
  {
    args: {hash: hash.toString('hex')},
    description: 'A hash buffer is required',
    error: 'ExpectedHashToSignWithEphemeralKey',
  },
  {
    args: {hash: hash.subarray(1)},
    description: 'A hash of the expected length is required',
    error: 'ExpectedHashToSignWithEphemeralKey',
  },
  {
    args: {hash},
    description: 'A hash is signed with a random ephemeral key',
  },
];

tests.forEach(({args, description, error}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => ephemeralSignature(args), new Error(error), 'Got error');

      return end();
    }

    const first = ephemeralSignature(args);
    const second = ephemeralSignature(args);

    [first, second].forEach(({public_key, signature}) => {
      equal(isPoint(hexAsBuffer(public_key)), true, 'Got a valid public key');

      const isValid = verify(
        args.hash,
        hexAsBuffer(public_key),
        hexAsBuffer(signature),
        isLowSRequired
      );

      equal(isValid, true, 'Got a valid low S signature of the hash');
    });

    notEqual(first.public_key, second.public_key, 'Got a random key');

    return end();
  });
});
