const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const programAsAddress = require('./../../bolt12/program_as_address');

const prefix = 'bc';
const program = '751e76e8199196d454941c45d1b3a323f1433bd6';

const makeArgs = overrides => {
  const args = {prefix, program, version: 0};

  Object.keys(overrides).forEach(k => args[k] = overrides[k]);

  return args;
};

const tests = [
  {
    args: makeArgs({prefix: undefined}),
    description: 'A prefix is required',
    error: 'ExpectedPrefixToEncodeWitnessProgramAsChainAddress',
  },
  {
    args: makeArgs({program: 'zz'}),
    description: 'A hex program is required',
    error: 'ExpectedHexProgramToEncodeWitnessProgramAsChainAddress',
  },
  {
    args: makeArgs({version: '0'}),
    description: 'A witness version number is required',
    error: 'ExpectedWitnessVersionToEncodeProgramAsChainAddress',
  },
  {
    args: makeArgs({version: 17}),
    description: 'A witness version higher than 16 is unknown',
    error: 'ExpectedKnownWitnessVersionToEncodeProgramAsChainAddress',
  },
  {
    args: makeArgs({program: 'ab'.repeat(21)}),
    description: 'A version zero program is 20 or 32 bytes',
    error: 'ExpectedVersionZeroProgramByteLengthToEncodeAddress',
  },
  {
    args: makeArgs({program: 'ab', version: 1}),
    description: 'A program is at least 2 bytes',
    error: 'ExpectedWitnessProgramByteLengthToEncodeChainAddress',
  },
  {
    args: makeArgs({program: 'ab'.repeat(41), version: 1}),
    description: 'A program is at most 40 bytes',
    error: 'ExpectedWitnessProgramByteLengthToEncodeChainAddress',
  },
  {
    args: makeArgs({}),
    description: 'A pay to witness public key hash address is encoded',
    expected: {address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'},
  },
  {
    args: makeArgs({
      program: 'a60869f0dbcf1dc659c9cecbaf8050135ea9e8cdc487053f1dc6880949dc6' +
        '84c',
      version: 1,
    }),
    description: 'A pay to taproot address is encoded',
    expected: {
      address: 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
    },
  },
  {
    args: makeArgs({program: 'abab', version: 16}),
    description: 'A future witness version address is encoded',
    expected: {address: 'bc1s4w4swezzp4'},
  },
  {
    args: makeArgs({prefix: 'sb'}),
    description: 'A simnet address is encoded',
    expected: {address: 'sb1qw508d6qejxtdg4y5r3zarvary0c5xw7krxe8se'},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => programAsAddress(args), new Error(error), 'Got error');
    } else {
      strictSame(programAsAddress(args), expected, 'Got expected address');
    }

    return end();
  });
});
