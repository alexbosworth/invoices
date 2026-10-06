const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const networkAsChain = require('./../../bolt12/network_as_chain');

const tests = [
  {
    args: {},
    description: 'A network is required',
    error: 'ExpectedKnownNetworkNameToDeriveChainHash',
  },
  {
    args: {network: 'litecoin'},
    description: 'A known network is required',
    error: 'ExpectedKnownNetworkNameToDeriveChainHash',
  },
  {
    args: {network: 'constructor'},
    description: 'The constructor property is not a network',
    error: 'ExpectedKnownNetworkNameToDeriveChainHash',
  },
  {
    args: {network: 'toString'},
    description: 'The toString property is not a network',
    error: 'ExpectedKnownNetworkNameToDeriveChainHash',
  },
  {
    args: {network: '__proto__'},
    description: 'The prototype property is not a network',
    error: 'ExpectedKnownNetworkNameToDeriveChainHash',
  },
  {
    args: {network: 'bitcoin'},
    description: 'Bitcoin is mapped to its chain hash',
    expected: {
      chain: '6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000',
    },
  },
  {
    args: {network: 'signet'},
    description: 'Signet is mapped to its chain hash',
    expected: {
      chain: 'f61eee3b63a380a477a063af32b2bbc97c9ff9f01f2c4225e973988108000000',
    },
  },
  {
    args: {network: 'simnet'},
    description: 'Simnet is mapped to its chain hash',
    expected: {
      chain: 'f67ad7695d9b662a72ff3d8edbbb2de0bfa67b13974bb9910d116d5cbd863e68',
    },
  },
  {
    args: {network: 'testnet4'},
    description: 'Testnet4 is mapped to its chain hash',
    expected: {
      chain: '43f08bdab050e35b567c864b91f47f50ae725ae2de53bcfbbaf284da00000000',
    },
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => networkAsChain(args), new Error(error), 'Got error');
    } else {
      strictSame(networkAsChain(args), expected, 'Got expected result');
    }

    return end();
  });
});
