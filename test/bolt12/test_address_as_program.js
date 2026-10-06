const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const addressAsProgram = require('./../../bolt12/address_as_program');

const p2wpkh = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
const program = '751e76e8199196d454941c45d1b3a323f1433bd6';

const p2tr = 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr';

const tests = [
  {
    args: {},
    description: 'A chain address is required',
    error: 'ExpectedChainAddressStringToDecodeWitnessProgram',
  },
  {
    args: {address: '1RustyRX2oai4EYYDpQGWvEL62BBGqN9T'},
    description: 'A bech32 encoded chain address is required',
    error: 'ExpectedBech32EncodedChainAddressToDecodeWitnessProgram',
  },
  {
    args: {address: 'bc1gmk9yu'},
    description: 'A witness version is required',
    error: 'ExpectedWitnessVersionInChainAddress',
  },
  {
    args: {address: 'bc13w508d6qejxtdg4y5r3zarvary0c5xw7kxflzvg'},
    description: 'A witness version higher than 16 is unknown',
    error: 'ExpectedKnownWitnessVersionInChainAddress',
  },
  {
    args: {address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kemeawh'},
    description: 'A version zero program requires a bech32 checksum',
    error: 'ExpectedChecksumTypeForWitnessVersionInChainAddress',
  },
  {
    args: {
      address: 'bc1pqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs3wf0qm',
    },
    description: 'A later version program requires a bech32m checksum',
    error: 'ExpectedChecksumTypeForWitnessVersionInChainAddress',
  },
  {
    args: {address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kqkhhp9x'},
    description: 'Excess padding is not allowed',
    error: 'ExpectedValidWitnessProgramPaddingInChainAddress',
  },
  {
    args: {address: 'bc1q4w46h2at4w46h2at4w46h2at4w46h2at4dnhv4sd'},
    description: 'Non-zero padding is not allowed',
    error: 'ExpectedValidWitnessProgramPaddingInChainAddress',
  },
  {
    args: {address: 'bc1q4w46h2at4w46h2at4w46h2at4w46h2at4vwpcqdl'},
    description: 'A version zero program is 20 or 32 bytes',
    error: 'ExpectedVersionZeroProgramByteLengthInChainAddress',
  },
  {
    args: {address: 'bc1p4vjcm322'},
    description: 'A program is at least 2 bytes',
    error: 'ExpectedWitnessProgramByteLengthInChainAddress',
  },
  {
    args: {
      address: 'bc1p4w46h2at4w46h2at4w46h2at4w46h2at4w46h2at4w46h2at4w46h2at' +
        '4w46h2at4vty5v9f',
    },
    description: 'A program is at most 40 bytes',
    error: 'ExpectedWitnessProgramByteLengthInChainAddress',
  },
  {
    args: {address: p2wpkh},
    description: 'A pay to witness public key hash address is decoded',
    expected: {program, prefix: 'bc', version: 0},
  },
  {
    args: {address: p2wpkh.toUpperCase()},
    description: 'An uppercase address is decoded',
    expected: {program, prefix: 'bc', version: 0},
  },
  {
    args: {address: p2tr},
    description: 'A pay to taproot address is decoded',
    expected: {
      prefix: 'bc',
      program: 'a60869f0dbcf1dc659c9cecbaf8050135ea9e8cdc487053f1dc6880949dc6' +
        '84c',
      version: 1,
    },
  },
  {
    args: {address: 'bc1s4w4swezzp4'},
    description: 'A future witness version address is decoded',
    expected: {prefix: 'bc', program: 'abab', version: 16},
  },
  {
    args: {address: 'sb1qw508d6qejxtdg4y5r3zarvary0c5xw7krxe8se'},
    description: 'A simnet address is decoded',
    expected: {program, prefix: 'sb', version: 0},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => addressAsProgram(args), new Error(error), 'Got error');
    } else {
      strictSame(addressAsProgram(args), expected, 'Got expected program');
    }

    return end();
  });
});
