const {test} = require('tap');

const {byteDecodeRequest} = require('./../../');

const makeArgs = overrides => {
  const args = {
    encoded: '0b675c0ac10d388683237d00319b98b8c56c7325aaee5728c2ec02506fcd790d8406bcbd6d3a81a1ea932b0b21d1023b637b130b61021b93cb83a37b1bab93932b731bc902932b3bab630ba34b7b73001120dfa2ed0f3bee3252b6132a943032fe0158340b6784a5a9b2b018ec3ed2ee3fa8a0b8102e27747c432917543ea7476b2d43a33d6a55198d0f3fc4a89b2e5c8bd0',
    mtokens: '150000',
    network: 'testnet',
  };

  Object.keys(overrides).forEach(k => args[k] = overrides[k]);

  return args;
};

const tests = [
  {
    args: makeArgs({encoded: undefined}),
    description: 'Encoded data is required',
    error: 'ExpectedHexEncodedPaymentRequestDataToDecodeRequest',
  },
  {
    args: makeArgs({mtokens: undefined}),
    description: 'Millitokens is required',
    error: 'ExpectedAmountToDecodeByteEncodedRequest',
  },
  {
    args: makeArgs({network: undefined}),
    description: 'Network is required',
    error: 'ExpectedNetworkToDecodeByteEncodedRequest',
  },
  {
    args: makeArgs({network: 'network'}),
    description: 'A known network is required',
    error: 'ExpectedKnownNetworkToDecodeByteEncodedRequest',
  },
  {
    args: makeArgs({}),
    description: 'Byte encode a payment request',
    expected: {
      request: 'lntb1500n1pdn4czkpp5ugdqer05qrrxuchrzkcue94th9w2xzasp9qm7d0yxcgp4uh4kn4qdpa2fjkzep6yprkcmmzv9kzqsmj09c8gmmrw4e8yetwvdujq5n9va6kcct5d9hkucqzysdlghdpua7uvjjkcfj49psxtlqzkp5pdncffdfk2cp3mp76thrl29qhqgzufm503pjj96586n5w6edgw3n66j4rxxs707y4zdjuhyt6quatqte',
    },
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, ({end, strictSame, throws}) => {
    if (!!error) {
      throws(() => byteDecodeRequest(args), new Error(error), 'Got error');
    } else {
      const details = byteDecodeRequest(args);

      strictSame(details, expected, 'Got expected byte decoding');
    }

    return end();
  });
});
