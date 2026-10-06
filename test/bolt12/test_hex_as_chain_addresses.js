const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const hexAsChainAddresses = require('./../../bolt12/hex_as_chain_addresses');

const p2wpkh = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';

const p2tr = 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr';

const encodedP2wpkh = '000014751e76e8199196d454941c45d1b3a323f1433bd6';

const encodedP2tr = '010020a60869f0dbcf1dc659c9cecbaf8050135ea9e8cdc487053f1d' +
  'c6880949dc684c';

const tests = [
  {
    args: {network: 'bitcoin'},
    description: 'Hex is required',
    error: 'ExpectedHexEncodedFallbackAddressesToDecode',
  },
  {
    args: {hex: 'zz', network: 'bitcoin'},
    description: 'Valid hex is required',
    error: 'ExpectedHexEncodedFallbackAddressesToDecode',
  },
  {
    args: {hex: encodedP2wpkh},
    description: 'A network is required',
    error: 'ExpectedKnownNetworkToDecodeFallbackAddresses',
  },
  {
    args: {hex: encodedP2wpkh, network: 'constructor'},
    description: 'A known network is required',
    error: 'ExpectedKnownNetworkToDecodeFallbackAddresses',
  },
  {
    args: {hex: '00', network: 'bitcoin'},
    description: 'A program length is required',
    error: 'ExpectedProgramLengthInFallbackAddress',
  },
  {
    args: {hex: '000014', network: 'bitcoin'},
    description: 'A witness program is required',
    error: 'ExpectedWitnessProgramInFallbackAddress',
  },
  {
    args: {hex: '', network: 'bitcoin'},
    description: 'No data means no addresses',
    expected: {chain_addresses: []},
  },
  {
    args: {hex: encodedP2wpkh, network: 'bitcoin'},
    description: 'A chain address is decoded',
    expected: {chain_addresses: [p2wpkh]},
  },
  {
    args: {hex: `${encodedP2wpkh}${encodedP2tr}`, network: 'bitcoin'},
    description: 'Multiple chain addresses are decoded',
    expected: {chain_addresses: [p2wpkh, p2tr]},
  },
  {
    args: {hex: `11000100${encodedP2wpkh}`, network: 'bitcoin'},
    description: 'Invalid fallback addresses are ignored',
    expected: {chain_addresses: [p2wpkh]},
  },
  {
    args: {hex: `110014${'ab'.repeat(20)}${encodedP2wpkh}`, network: 'bitcoin'},
    description: 'A fallback with a version greater than 16 is ignored',
    expected: {chain_addresses: [p2wpkh]},
  },
  {
    args: {hex: `010001ab${encodedP2wpkh}`, network: 'bitcoin'},
    description: 'A fallback with a program under two bytes is ignored',
    expected: {chain_addresses: [p2wpkh]},
  },
  {
    args: {hex: `010029${'ab'.repeat(41)}${encodedP2wpkh}`, network: 'bitcoin'},
    description: 'A fallback with a program over forty bytes is ignored',
    expected: {chain_addresses: [p2wpkh]},
  },
  {
    args: {hex: `000015${'ab'.repeat(21)}${encodedP2wpkh}`, network: 'bitcoin'},
    description: 'A version zero fallback with an unknown length is ignored',
    expected: {chain_addresses: [p2wpkh]},
  },
  {
    args: {hex: `100014${'ab'.repeat(20)}`, network: 'bitcoin'},
    description: 'A fallback with an unknown future version is decoded',
    expected: {
      chain_addresses: ['bc1s4w46h2at4w46h2at4w46h2at4w46h2atty9xlx'],
    },
  },
  {
    args: {hex: encodedP2wpkh, network: 'testnet'},
    description: 'A chain address is decoded for a network',
    expected: {chain_addresses: ['tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx']},
  },
  {
    args: {hex: encodedP2wpkh, network: 'simnet'},
    description: 'A chain address is decoded for simnet',
    expected: {chain_addresses: ['sb1qw508d6qejxtdg4y5r3zarvary0c5xw7krxe8se']},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => hexAsChainAddresses(args), new Error(error), 'Got error');
    } else {
      strictSame(hexAsChainAddresses(args), expected, 'Got expected result');
    }

    return end();
  });
});
