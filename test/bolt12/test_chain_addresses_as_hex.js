const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const chainAddressesAsHex = require('./../../bolt12/chain_addresses_as_hex');

const p2wpkh = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';

const p2tr = 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr';

const encodedP2wpkh = '000014751e76e8199196d454941c45d1b3a323f1433bd6';

const encodedP2tr = '010020a60869f0dbcf1dc659c9cecbaf8050135ea9e8cdc487053f1d' +
  'c6880949dc684c';

const simnetP2wpkh = 'sb1qw508d6qejxtdg4y5r3zarvary0c5xw7krxe8se';

const tests = [
  {
    args: {network: 'bitcoin'},
    description: 'Chain addresses are required',
    error: 'ExpectedArrayOfChainAddressesToEncodeAsFallbacks',
  },
  {
    args: {chain_addresses: [1], network: 'bitcoin'},
    description: 'Chain address strings are required',
    error: 'ExpectedChainAddressStringsToEncodeAsFallbacks',
  },
  {
    args: {chain_addresses: [p2wpkh]},
    description: 'A network is required',
    error: 'ExpectedKnownNetworkToEncodeChainAddressesAsFallbacks',
  },
  {
    args: {chain_addresses: [p2wpkh], network: 'constructor'},
    description: 'A known network is required',
    error: 'ExpectedKnownNetworkToEncodeChainAddressesAsFallbacks',
  },
  {
    args: {
      chain_addresses: ['1RustyRX2oai4EYYDpQGWvEL62BBGqN9T'],
      network: 'bitcoin',
    },
    description: 'A bech32 address is required',
    error: 'ExpectedValidBech32ChainAddressToEncodeAsFallback',
  },
  {
    args: {chain_addresses: [p2wpkh], network: 'testnet'},
    description: 'An address for the network is required',
    error: 'ExpectedChainAddressForNetworkToEncodeAsFallback',
  },
  {
    args: {chain_addresses: [p2wpkh], network: 'bitcoin'},
    description: 'A chain address is encoded',
    expected: {hex: encodedP2wpkh},
  },
  {
    args: {chain_addresses: [p2wpkh, p2tr], network: 'bitcoin'},
    description: 'Multiple chain addresses are encoded',
    expected: {hex: `${encodedP2wpkh}${encodedP2tr}`},
  },
  {
    args: {chain_addresses: [simnetP2wpkh], network: 'simnet'},
    description: 'A simnet chain address is encoded',
    expected: {hex: encodedP2wpkh},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => chainAddressesAsHex(args), new Error(error), 'Got error');
    } else {
      strictSame(chainAddressesAsHex(args), expected, 'Got expected result');
    }

    return end();
  });
});
