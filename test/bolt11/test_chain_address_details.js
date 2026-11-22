const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const chainAddressDetails = require('./../../bolt11/chain_address_details');

const makeArgs = overrides => {
  const args = {
    address: 'mk2QpYatsKicvFVuTAQLBryyccRXMUaGHP',
    network: 'testnet',
  };

  Object.keys(overrides).forEach(k => args[k] = overrides[k]);

  return args;
};

const tests = [
  {
    args: makeArgs({address: undefined}),
    description: 'Address is required',
    error: 'ExpectedAddressToDeriveChainAddressDetails',
  },
  {
    args: makeArgs({network: undefined}),
    description: 'Network name is required',
    error: 'ExpectedNetworkToDeriveChainAddressDetails',
  },
  {
    args: makeArgs({address: 'address'}),
    description: 'A valid address is required',
    error: 'ExpectedValidAddressToDeriveChainDetails',
  },
  {
    args: makeArgs({address: 'bc1pfeessrawgf', network: 'bitcoin'}),
    description: 'A pay to anchor address is converted to details',
    expected: {hash: '4e73', version: 1},
  },
  {
    args: makeArgs({
      address: 'bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0',
      network: 'bitcoin',
    }),
    description: 'A Taproot address is converted to details',
    expected: {
      hash: '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
      version: 1,
    },
  },
  {
    args: makeArgs({}),
    description: 'A chain address is converted to words',
    expected: {
      hash: '3172b5654f6683c8fb146959d347ce303cae4ca7',
      version: 17,
    },
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => chainAddressDetails(args), new Error(error), 'Got err');
    } else {
      strictSame(chainAddressDetails(args), expected, 'Got expected details');
    }

    return end();
  });
});
