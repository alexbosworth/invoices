const {test} = require('@alexbosworth/tap');

const {byteDecodeRequest} = require('./../../');
const {byteEncodeRequest} = require('./../../');
const {parsePaymentRequest} = require('./../../');

const tests = [
  {
    args: {},
    description: 'A payment request is expected',
    error: 'ExpectedPaymentRequestToByteEncode',
  },
  {
    args: {request: 'request'},
    description: 'A bech32 encoded payment request is expected',
    error: 'ExpectedLnPrefixToByteEncodePaymentRequest',
  },
  {
    args: {
      request: 'lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdpl2pkx2ctnv5sxxmmwwd5kgetjypeh2ursdae8g6twvus8g6rfwvs8qun0dfjkxaq8rkx3yf5tcsyz3d73gafnh3cax9rn449d9p5uxz9ezhhypd0elx87sjle52x86fux2ypatgddc6k63n7erqz25le42c4u4ecky03ylcqca784w',
    },
    description: 'Byte encode a payment request',
    expected: {
      encoded: '0b25fe64410d00004080c1014181c20240004080c1014181c20240004080c1014181c202404081a1fa83632b0b9b29031b7b739b4b232b91039bab83837b93a34b733903a3434b990383937b532b1ba038ec6891345e204145be8a3a99de38e98a39d6a569434e1845c8af7205afcfcc7f425fcd1463e93c32881ead0d6e356d467ec8c02553f9aab15e5738b11f127f00',
      mtokens: undefined,
      network: 'bitcoin',
      words: 232,
    },
  },
  {
    args: {
      request: 'lnbc2500u1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpuaztrnwngzn3kdzw5hydlzf03qdgm2hdq27cqv3agm2awhz5se903vruatfhq77w3ls4evs3ch9zw97j25emudupq63nyw24cg27h2rspfj9srp',
    },
    description: 'Byte encode a payment request with an amount',
    expected: {
      encoded: '0b25fe64410d00004080c1014181c20240004080c1014181c20240004080c1014181c202404081a0a189031bab81031b7b33332b2818020f3a258e6e9a0538d9a2752e46fc497c40d46d576815ec0191ea36aebae2a43257c583e7569b83de747f0ae5908e2e5138be92a99df1bc08351991caae10af5d438040',
      mtokens: '250000000',
      network: 'bitcoin',
      words: 194,
    },
  },
  {
    args: {
      request: 'lnbc2500u1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdpquwpc4curk03c9wlrswe78q4eyqc7d8d0xqzpuyk0sg5g70me25alkluzd2x62aysf2pyy8edtjeevuv4p2d5p76r4zkmneet7uvyakky2zr4cusd45tftc9c5fh0nnqpnl2jfll544esqchsrny',
    },
    description: 'Byte encode a payment request with an amount',
    expected: {
      encoded: '0b25fe64410d00004080c1014181c20240004080c1014181c20240004080c1014181c202404081a1071c1c571c1d9f1c15df1c1d9f1c15c9018f34ed798020f0967c114479fbcaa9dfdbfc13546d2ba482541210f96ae59cb38ca854da07da1d456dcf395fb8c276d622843ae3906d68b4af05c51377ce600cfea927ffa56b9800',
      mtokens: '250000000',
      network: 'bitcoin',
      words: 206,
    },
  },
  {
    args: {
      request: 'lnbc20m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqscc6gd6ql3jrc5yzme8v4ntcewwz5cnw92tz0pc8qcuufvq7khhr8wpald05e92xw006sq94mg8v2ndf4sefvf9sygkshp5zfem29trqq2yxxz7',
    },
    description: 'Byte encode a payment request with a desc hash',
    expected: {
      encoded: '0b25fe64410d00004080c1014181c20240004080c1014181c20240004080c1014181c202404082e1a1c92db7b3f161a001b7689049eea2701b46f8db7513629edf2408fac7eaedc608631a43740fc643c5082de4ecacd78cb9c2a626e2a962787070639c4b01eb5ee33b83dfb5f4c954673dfa800b5da0ec54da9ac329624b0222d0b86824e76a2ac60000',
      mtokens: '2000000000',
      network: 'bitcoin',
      words: 221,
    },
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, ({end, strictSame, throws}) => {
    if (!!error) {
      throws(() => byteEncodeRequest(args), new Error(error), 'Got error');
    } else {
      const details = byteEncodeRequest(args);

      const {request} = byteDecodeRequest(details);

      const original = parsePaymentRequest({request: args.request});
      const decoded = parsePaymentRequest({request})

      strictSame(original, decoded, 'Original payment details preserved');
      strictSame(details, expected, 'Got expected byte encoding');
    }

    return end();
  });
});
