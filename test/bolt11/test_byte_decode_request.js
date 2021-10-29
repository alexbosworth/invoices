const {test} = require('@alexbosworth/tap');

const {byteDecodeRequest} = require('./../../');

const makeArgs = overrides => {
  const args = {
    encoded: '0b25fe64410d00004080c1014181c20240004080c1014181c20240004080c1014181c202404081a1fa83632b0b9b29031b7b739b4b232b91039bab83837b93a34b733903a3434b990383937b532b1ba038ec6891345e204145be8a3a99de38e98a39d6a569434e1845c8af7205afcfcc7f425fcd1463e93c32881ead0d6e356d467ec8c02553f9aab15e5738b11f127f00',
    mtokens: '150000',
    network: 'testnet',
    words: 232,
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
      request: 'lntb1500n1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdpl2pkx2ctnv5sxxmmwwd5kgetjypeh2ursdae8g6twvus8g6rfwvs8qun0dfjkxaq8rkx3yf5tcsyz3d73gafnh3cax9rn449d9p5uxz9ezhhypd0elx87sjle52x86fux2ypatgddc6k63n7erqz25le42c4u4ecky03ylcqz03uuk',
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
