const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const chainAsNetwork = require('./../../bolt12/chain_as_network');

const tests = [
  {
    args: {},
    description: 'A chain hash is required',
    error: 'ExpectedChainHashToDeriveNetworkName',
  },
  {
    args: {chain: 'zz'},
    description: 'A hex chain hash is required',
    error: 'ExpectedChainHashToDeriveNetworkName',
  },
  {
    args: {
      chain: '1466275836220db2944ca059a3a10ef6fd2ea684b0688d2c379296888a206003',
    },
    description: 'A known chain hash is required',
    error: 'UnknownChainHashToDeriveNetworkName',
  },
  {
    args: {
      chain: '6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000',
    },
    description: 'The bitcoin chain hash is mapped to bitcoin',
    expected: {network: 'bitcoin'},
  },
  {
    args: {
      chain: '43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000',
    },
    description: 'The testnet chain hash is mapped to testnet',
    expected: {network: 'testnet'},
  },
  {
    args: {
      chain: '06226e46111a0b59caaf126043eb5bbf28c34f3a5e332a1fc7b2b73cf188910f',
    },
    description: 'The regtest chain hash is mapped to regtest',
    expected: {network: 'regtest'},
  },
  {
    args: {
      chain: '6FE28C0AB6F1B372C1A6A246AE63F74F931E8365E15A089C68D6190000000000',
    },
    description: 'An uppercase chain hash is mapped to its network',
    expected: {network: 'bitcoin'},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => chainAsNetwork(args), new Error(error), 'Got error');
    } else {
      strictSame(chainAsNetwork(args), expected, 'Got expected result');
    }

    return end();
  });
});
