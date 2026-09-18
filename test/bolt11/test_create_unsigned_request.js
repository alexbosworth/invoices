const {sign} = require('tiny-secp256k1');

const {equal} = require('node:assert').strict;
const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const {createSignedRequest} = require('./../../');
const {createUnsignedRequest} = require('./../../');
const {parsePaymentRequest} = require('./../../');
const taggedFields = require('./../../bolt11/conf/tagged_fields');
const wordsAsBuffer = require('./../../bolt11/words_as_buffer');

const blindedKey = '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad';
const bufFromHex = hex => Buffer.from(hex, 'hex');

// The bLIP 39 test vector blinded paths
const blindedPaths = [
  {
    base_fee_mtokens: '40',
    cltv_delta: 130,
    features: [],
    fee_rate: 20,
    hops: [
      {
        encrypted_data: '0102030405',
        relay_key: '03a8c97ed5cd40d474e4ef18c899854b25e5070106504cb225e6d2c112d61a805e',
      },
      {
        encrypted_data: '0504030201',
        relay_key: '0220293926219d8efe733336e2b674570dd96aa763acb3564e6e367b384d861a0a',
      },
      {
        encrypted_data: '0102030405060708090a0b0c0d0e',
        relay_key: '02c75eb336a038294eaaf760158b2e851c3c0937262e35401ae64a1bee71a2e40c',
      },
    ],
    introduction_node: '03a8c97ed5cd40d474e4ef18c899854b25e5070106504cb225e6d2c112d61a805e',
    key: '03f3311e948feb5115242c4e396c81c448ab7ee5fd24c4e24e66c73533cc4f98b8',
    max_htlc_mtokens: '100',
    min_htlc_mtokens: '2',
  },
  {
    base_fee_mtokens: '4',
    cltv_delta: 10,
    features: [],
    fee_rate: 2,
    hops: [{
      encrypted_data: '0102030405',
      relay_key: '0220293926219d8efe733336e2b674570dd96aa763acb3564e6e367b384d861a0a',
    }],
    introduction_node: '0220293926219d8efe733336e2b674570dd96aa763acb3564e6e367b384d861a0a',
    key: '02c75eb336a038294eaaf760158b2e851c3c0937262e35401ae64a1bee71a2e40c',
    max_htlc_mtokens: '10',
    min_htlc_mtokens: '0',
  },
];

// The blinded paths in the BOLT 12 shape where the first hop key is blinded
const blindedFirstHopPaths = blindedPaths.map(path => ({
  ...path,
  hops: path.hops.map((hop, i) => ({
    encrypted_data: hop.encrypted_data,
    relay_key: !i ? blindedKey : hop.relay_key,
  })),
}));

// The bLIP 39 test vector payment request
const blindedPathsRequest = 'lnbc20m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4js5fdqqqqq2qqqqqpgqyzqqqqqqqqqqqqyqqqqqqqqqqqvsqqqqlnxy0ffrlt2y2jgtzw89kgr3zg4dlwtlfycn3yuek8x5eucnuchqps82xf0m2u6sx5wnjw7xxgnxz5kf09quqsv5zvkgj7d5kpzttp4qz7q5qsyqcyq5pzq2feycsemrh7wvendc4kw3tsmkt25a36ev6kfehrv7ecfkrp5zs9q5zqxqspqtr4avek5quzjn427asptzews5wrczfhychr2sq6ue9phmn35tjqcrspqgpsgpgxquyqjzstpsxsu59zqqqqqpqqqqqqyqq2qqqqqqqqqqqqqqqqqqqqqqqqpgqqqqk8t6endgpc99824amqzk9japgu8synwf3wx4qp4ej2r0h8rghypsqsygpf8ynzr8vwleenxdhzke69wrwed2nk8t9n2e8xudnm8pxcvxs2q5qsyqcyq5y4rdlhtf84f8rgdj34275juwls2ftxtcfh035863q3p9k6s94hpxhdmzfn5gxpsazdznxs56j4vt3fdhe00g9v2l3szher50hp4xlggqkxf77f';

const tests = [
  {
    args: {
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      network: 'bitcoin',
    },
    description: 'A description or description hash is required',
    error: 'ExpectedPaymentDescriptionOrDescriptionHashForPayReq',
  },
  {
    args: {
      description: 'x'.repeat(640),
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      network: 'bitcoin',
    },
    description: 'A description within the byte limit is required',
    error: 'ExpectedPaymentDescriptionWithinDescriptionByteLimit',
  },
  {
    args: {description: 'coffee beans', network: 'bitcoin'},
    description: 'A payment hash is required',
    error: 'ExpectedPaymentHashWhenEncodingPaymentRequest',
  },
  {
    args: {
      description: 'coffee beans',
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      network: 'network',
    },
    description: 'A known network is required',
    error: 'ExpectedKnownNetworkToEncodePaymentRequest',
  },
  {
    args: {
      description: 'coffee beans',
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      network: 'bitcoin',
      paths: 'paths',
    },
    description: 'Blinded paths are expected as an array',
    error: 'ExpectedArrayOfBlindedPathsToEncodePaymentRequest',
  },
  {
    args: {
      description: 'coffee beans',
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      network: 'bitcoin',
      paths: blindedPaths,
      routes: [[{
        public_key: '029e03a901b85534ff1e92c43c74431f7ce72046060fcf7a95c37e148f78c77255',
      }]],
    },
    description: 'Blinded paths cannot be combined with routes',
    error: 'UnexpectedRoutesAndBlindedPathsInPaymentRequest',
  },
  {
    args: {
      description: 'coffee beans',
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      network: 'bitcoin',
      paths: blindedPaths,
      payment: '1111111111111111111111111111111111111111111111111111111111111111',
    },
    description: 'Blinded paths cannot be combined with a payment identifier',
    error: 'UnexpectedPaymentIdAndBlindedPathsInPaymentRequest',
  },
  {
    args: {
      created_at: '2017-06-01T10:57:38.000Z',
      description_hash: '3925b6f67e2c340036ed12093dd44e0368df1b6ea26c53dbe4811f58fd5db8c1',
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      mtokens: '2000000000',
      network: 'bitcoin',
    },
    description: 'Test creating a regular unsigned request',
    expected: {
      data: '0b25fe64410d00004080c1014181c20240004080c1014181c20240004080c1014181c202404082e1a1c92db7b3f161a001b7689049eea2701b46f8db7513629edf2408fac7eaedc60800',
      hash: 'b6025e8a10539dddbcbe6840a9650707ae3f147b8dcfda338561ada710508916',
      hrp: 'lnbc20m',
    },
    verify: {
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      private_key: 'e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734',
    },
  },
  {
    args: {
      created_at: '2017-06-01T10:57:38.000Z',
      description: 'Please consider supporting this project',
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      network: 'bitcoin',
    },
    description: 'Test creating a donation payment request',
    expected: {
      data: '0b25fe64410d00004080c1014181c20240004080c1014181c20240004080c1014181c202404081a1fa83632b0b9b29031b7b739b4b232b91039bab83837b93a34b733903a3434b990383937b532b1ba0',
      hash: 'c3d4e83f646fa79a393d75277b1d858db1d1f7ab7137dcb7835db2ecd518e1c9',
      hrp: 'lnbc',
    },
    verify: {
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      private_key: 'e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734',
    },
  },
  {
    args: {
      created_at: '2017-06-01T10:57:38.000Z',
      description: '',
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      network: 'bitcoin',
    },
    description: 'Test creating an empty description request',
    expected: {
      data: '0b25fe64410d00004080c1014181c20240004080c1014181c20240004080c1014181c202404081a000',
      hash: 'a7c24a7ac6369ea6b25ca3534cba0e5971d7b3ac93a2cb74e620b6eac52be9d9',
      hrp: 'lnbc',
    },
    verify: {
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      private_key: 'e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734',
    },
  },
  {
    args: {
      created_at: '2017-06-01T10:57:38.000Z',
      description: '1 cup coffee',
      expires_at: '2017-06-01T10:58:38.000Z',
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      mtokens: '250000000',
      network: 'bitcoin',
    },
    description: 'Payment request with expiration time',
    expected: {
      data: '0b25fe64410d00004080c1014181c20240004080c1014181c20240004080c1014181c202404080c01078d050c4818dd5c0818dbd9999959400',
      hash: '41545c21535123568d875cf108983e97323857e05d302e8c0c8091540f496b6e',
      hrp: 'lnbc2500u',
    },
    verify: {
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      private_key: 'e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734',
    },
  },
  {
    args: {
      created_at: '2017-06-01T10:57:38.000Z',
      description: 'ナンセンス 1杯',
      expires_at: '2017-06-01T10:58:38.000Z',
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      network: 'bitcoin',
      tokens: 250000,
    },
    description: 'Payment request with utf8 characters in description',
    expected: {
      data: '0b25fe64410d00004080c1014181c20240004080c1014181c20240004080c1014181c202404080c01078d0838e0e2b8e0ecf8e0aef8e0ecf8e0ae480c79a76bc',
      hash: 'a66929bfdba1ef8480f41f0a509646d100971a1b1ef074ecc2ad283ef872fb78',
      hrp: 'lnbc2500u',
    },
    verify: {
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      private_key: 'e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734',
    },
  },
  {
    args: {
      created_at: '2017-06-01T10:57:38.000Z',
      description_hash: '3925b6f67e2c340036ed12093dd44e0368df1b6ea26c53dbe4811f58fd5db8c1',
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      mtokens: '2000000000',
      network: 'bitcoin',
    },
    description: 'Payment request with hash of list of items',
    expected: {
      data: '0b25fe64410d00004080c1014181c20240004080c1014181c20240004080c1014181c202404082e1a1c92db7b3f161a001b7689049eea2701b46f8db7513629edf2408fac7eaedc60800',
      hash: 'b6025e8a10539dddbcbe6840a9650707ae3f147b8dcfda338561ada710508916',
      hrp: 'lnbc20m',
    },
    verify: {
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      private_key: 'e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734',
    },
  },
  {
    args: {
      chain_addresses: ['mk2QpYatsKicvFVuTAQLBryyccRXMUaGHP'],
      created_at: '2017-06-01T10:57:38.000Z',
      description_hash: '3925b6f67e2c340036ed12093dd44e0368df1b6ea26c53dbe4811f58fd5db8c1',
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      mtokens: '2000000000',
      network: 'testnet',
    },
    description: 'Payment request with a fallback address',
    expected: {
      data: '0b25fe64410d00004080c1014181c20240004080c1014181c20240004080c1014181c202404081210c4c5cad5953d9a0f23ec51a5674d1f38c0f2b9329ee1a1c92db7b3f161a001b7689049eea2701b46f8db7513629edf2408fac7eaedc6080',
      hash: '8a70928b442c583b3c2206bd72c2edf3bbe514444134285d6abbc6e98c552d92',
      hrp: 'lntb20m',
    },
    verify: {
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      private_key: 'e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734',
    },
  },
  {
    args: {
      chain_addresses: ['1RustyRX2oai4EYYDpQGWvEL62BBGqN9T'],
      created_at: '2017-06-01T10:57:38.000Z',
      description_hash: '3925b6f67e2c340036ed12093dd44e0368df1b6ea26c53dbe4811f58fd5db8c1',
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      network: 'bitcoin',
      routes: [[
        {
          public_key: '029e03a901b85534ff1e92c43c74431f7ce72046060fcf7a95c37e148f78c77255',
        },
        {
          base_fee_mtokens: '1',
          channel: '66051x263430x1800',
          cltv_delta: 3,
          fee_rate: 20,
          public_key: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
        },
      ]],
      tokens: 2000000,
    },
    description: 'Payment request with routing hints',
    expected: {
      data: '0b25fe64410d00004080c1014181c20240004080c1014181c20240004080c1014181c202404080629014f01d480dc2a9a7f8f49621e3a218fbe7390230307e7bd4ae1bf0a47bc63b92a8081018202830384000000008000000a0001890862096c3efb83d41b9328488c99880c9b8ac9b23d1370d0e496dbd9f8b0d000dbb44824f751380da37c6dba89b14f6f92047d63f576e3040',
      hash: '215f17ac50e01dbcce070aa15d9ebd29088c7e7e37eb8f6ae071770ca40dd47b',
      hrp: 'lnbc20m',
    },
    verify: {
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      private_key: 'e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734',
    },
  },
  {
    args: {
      chain_addresses: [
        '1RustyRX2oai4EYYDpQGWvEL62BBGqN9T',
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
      ],
      created_at: '2017-06-01T10:57:38.000Z',
      description_hash: '3925b6f67e2c340036ed12093dd44e0368df1b6ea26c53dbe4811f58fd5db8c1',
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      network: 'bitcoin',
      tokens: 2000000,
    },
    description: 'Payment request with multiple fallback addresses',
    expected: {
      data: '0b25fe64410d00004080c1014181c20240004080c1014181c20240004080c1014181c202404081210c412d87df707a83726509119331019371593647a2521081d479dba066465b515250711746ce8c8fc50cef5ae1a1c92db7b3f161a001b7689049eea2701b46f8db7513629edf2408fac7eaedc60800',
      hash: 'cb12f07a83e2c28af9cbba95ffbf54812369be93448e124271f28ece026d7267',
      hrp: 'lnbc20m',
    },
    verify: {
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      private_key: 'e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734',
    },
  },
  {
    args: {
      chain_addresses: ['3EktnHQD7RiAE6uzMj2ZifT9YgRrkSgzQX'],
      created_at: '2017-06-01T10:57:38.000Z',
      description_hash: '3925b6f67e2c340036ed12093dd44e0368df1b6ea26c53dbe4811f58fd5db8c1',
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      network: 'bitcoin',
      tokens: 2000000,
    },
    description: 'Payment request with p2sh',
    expected: {
      data: '0b25fe64410d00004080c1014181c20240004080c1014181c20240004080c1014181c202404081210ca3d5558ee6867cc870847a6e7ce337da1ba81e116e1a1c92db7b3f161a001b7689049eea2701b46f8db7513629edf2408fac7eaedc6080',
      hash: 'aff3372fd3da5db4d6cc7cd757c5ad2804ab76f7eb68a79617e4f9edf329cdb3',
      hrp: 'lnbc20m',
    },
    verify: {
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      private_key: 'e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734',
    },
  },
  {
    args: {
      chain_addresses: ['bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'],
      created_at: '2017-06-01T10:57:38.000Z',
      description_hash: '3925b6f67e2c340036ed12093dd44e0368df1b6ea26c53dbe4811f58fd5db8c1',
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      network: 'bitcoin',
      tokens: 2000000,
    },
    description: 'Payment request with p2wpkh',
    expected: {
      data: '0b25fe64410d00004080c1014181c20240004080c1014181c20240004080c1014181c20240408121081d479dba066465b515250711746ce8c8fc50cef5ae1a1c92db7b3f161a001b7689049eea2701b46f8db7513629edf2408fac7eaedc6080',
      hash: '53c4634f904ae9e1888e5158d6b7e352c4352cb2e43bf60019352baa471551cd',
      hrp: 'lnbc20m',
    },
    verify: {
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      private_key: 'e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734',
    },
  },
  {
    args: {
      chain_addresses: ['bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3'],
      created_at: '2017-06-01T10:57:38.000Z',
      description_hash: '3925b6f67e2c340036ed12093dd44e0368df1b6ea26c53dbe4811f58fd5db8c1',
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      network: 'bitcoin',
      tokens: 2000000,
    },
    description: 'Payment request with p2wsh',
    expected: {
      data: '0b25fe64410d00004080c1014181c20240004080c1014181c20240004080c1014181c20240408121a80618c50f0531459a012f46480cd5b684db26159e335349e86e318ca581240c9882e1a1c92db7b3f161a001b7689049eea2701b46f8db7513629edf2408fac7eaedc60800',
      hash: '827b34dedbcebfbead318c8ca5d0fdeffb47e79261035980b059dcf66ae83ade',
      hrp: 'lnbc20m',
    },
    verify: {
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      private_key: 'e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734',
    },
  },
  {
    args: {
      created_at: '2017-06-01T10:57:38.000Z',
      description: 'coffee beans',
      features: [
        {
          bit: 15,
          is_required: false,
          type: 'payment_identifier',
        },
        {
          bit: 99,
          is_required: false,
          type: undefined,
        },
      ],
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      network: 'bitcoin',
      payment: '1111111111111111111111111111111111111111111111111111111111111111',
      tokens: 2000000,
    },
    description: 'With features and payment identifier',
    expected: {
      data: '0b25fe64410d00004080c1014181c20240004080c1014181c20240004080c1014181c202404080a0a40000000000000000000040003414636f66666565206265616e730806822222222222222222222222222222222222222222222222222222222222222220',
      hash: 'ca79ddcfb01fc3232cf784075742a259afa0d3506c0db278b95175154a89bda5',
      hrp: 'lnbc20m',
    },
    verify: {
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      private_key: 'e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734',
    },
  },
  {
    args: {
      cltv_delta: 144,
      created_at: '2017-06-01T10:57:38.000Z',
      description: 'coffee beans',
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      network: 'bitcoin',
    },
    description: 'Payment request with a final cltv delta',
    expected: {
      data: '0b25fe64410d00004080c1014181c20240004080c1014181c20240004080c1014181c202404081a0a31b7b33332b2903132b0b739860022400',
      hash: 'a7d7be40da3f5939b58a0840674adbee0f7a221b3da5f7ff3639e4c99a445180',
      hrp: 'lnbc',
    },
    verify: {
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      private_key: 'e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734',
    },
  },
  {
    args: {
      created_at: '2017-06-01T10:57:38.000Z',
      description: 'coffee beans',
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      metadata: '01020304',
      network: 'bitcoin',
    },
    description: 'Payment request with payment metadata',
    expected: {
      data: '0b25fe64410d00004080c1014181c20240004080c1014181c20240004080c1014181c202404081a0a31b7b33332b2903132b0b73986c070102030400',
      hash: 'fb94e6b958da3b329909bbf8c8789fa7de72f3e8af99ddf0eeab1b520ac61eaf',
      hrp: 'lnbc',
    },
    verify: {
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      private_key: 'e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734',
    },
  },
  {
    args: {
      created_at: '2017-06-01T10:57:38.000Z',
      description: '1 cup coffee',
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      mtokens: '2000000000',
      network: 'bitcoin',
      paths: blindedPaths,
    },
    description: 'Payment request with blinded paths',
    expected: {
      data: '0b25fe64410d00004080c1014181c20240004080c1014181c20240004080c1014181c202404081a0a189031bab81031b7b33332b28512d0000002800000014008200000000000000020000000000000064000003f3311e948feb5115242c4e396c81c448ab7ee5fd24c4e24e66c73533cc4f98b80303a8c97ed5cd40d474e4ef18c899854b25e5070106504cb225e6d2c112d61a805e0501020304050220293926219d8efe733336e2b674570dd96aa763acb3564e6e367b384d861a0a05050403020102c75eb336a038294eaaf760158b2e851c3c0937262e35401ae64a1bee71a2e40c0e0102030405060708090a0b0c0d0e50a20000000400000002000a0000000000000000000000000000000a000002c75eb336a038294eaaf760158b2e851c3c0937262e35401ae64a1bee71a2e40c010220293926219d8efe733336e2b674570dd96aa763acb3564e6e367b384d861a0a05010203040500',
      hash: '503fb76c15e4dfb5df212bdae60297bbe64ab6742219d8704b4808b273e491f6',
      hrp: 'lnbc20m',
    },
    verify: {
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      private_key: 'e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734',
    },
  },
  {
    args: {
      created_at: '2017-06-01T10:57:38.000Z',
      description: '1 cup coffee',
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      mtokens: '2000000000',
      network: 'bitcoin',
      paths: blindedFirstHopPaths,
    },
    description: 'Payment request with blinded first hop key blinded paths',
    expected: {
      data: '0b25fe64410d00004080c1014181c20240004080c1014181c20240004080c1014181c202404081a0a189031bab81031b7b33332b28512d0000002800000014008200000000000000020000000000000064000003f3311e948feb5115242c4e396c81c448ab7ee5fd24c4e24e66c73533cc4f98b80303a8c97ed5cd40d474e4ef18c899854b25e5070106504cb225e6d2c112d61a805e0501020304050220293926219d8efe733336e2b674570dd96aa763acb3564e6e367b384d861a0a05050403020102c75eb336a038294eaaf760158b2e851c3c0937262e35401ae64a1bee71a2e40c0e0102030405060708090a0b0c0d0e50a20000000400000002000a0000000000000000000000000000000a000002c75eb336a038294eaaf760158b2e851c3c0937262e35401ae64a1bee71a2e40c010220293926219d8efe733336e2b674570dd96aa763acb3564e6e367b384d861a0a05010203040500',
      hash: '503fb76c15e4dfb5df212bdae60297bbe64ab6742219d8704b4808b273e491f6',
      hrp: 'lnbc20m',
      paths: blindedPaths,
    },
    verify: {
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      private_key: 'e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734',
    },
  },
];

tests.forEach(({args, description, error, expected, verify}) => {
  return test(description, (t, end) => {
    if (!!error) {
      throws(() => createUnsignedRequest(args), new Error(error), 'Got err');

      return end();
    }

    const {hash, hrp, tags} = createUnsignedRequest(args);

    const data = wordsAsBuffer({words: tags}).toString('hex');

    equal(data, expected.data, 'Tags calculated for payment request');
    equal(hash, expected.hash, 'Hash calculated for payment request');
    equal(hrp, expected.hrp, 'Hrp calculated for payment request');

    const signature = sign(bufFromHex(hash), bufFromHex(verify.private_key));

    const {request} = createSignedRequest({
      hrp,
      tags,
      destination: verify.destination,
      signature: Buffer.from(signature).toString('hex'),
    });

    const parsed = parsePaymentRequest({request});

    strictSame(parsed.chain_addresses, args.chain_addresses, 'Fallbacks');
    equal(parsed.cltv_delta, args.cltv_delta || 18, 'Request cltv expected');
    equal(parsed.created_at, args.created_at, 'Request create_at is expected');
    equal(parsed.description, args.description, 'Req description expected');
    equal(parsed.description_hash, args.description_hash, 'Got Desc hash');
    equal(parsed.destination, verify.destination, 'Destination key expected');

    if (!!args.features) {
      strictSame(parsed.features, args.features, 'Got expected feature bits');
    }

    if (!!args.metadata) {
      equal(parsed.metadata, args.metadata, 'Payment metadata expected');
    }

    if (!!args.mtokens) {
      equal(parsed.mtokens, args.mtokens, 'Payment request mtokens expected');
    }

    if (!!args.paths) {
      strictSame(parsed.paths, expected.paths || args.paths, 'Got paths');
    }

    if (!!args.payment) {
      equal(parsed.payment, args.payment, 'Payment identifier expected');
    }

    if (!!args.routes) {
      strictSame(parsed.routes, args.routes, 'Payment request as expected');
    }

    if (!!args.tokens) {
      equal(parsed.tokens, args.tokens, 'Payment request tokens as expected');
    }

    return end();
  });
});

// An unknown tagged field type in the configuration cannot be encoded
test('An unexpected tagged field type cannot be encoded', (t, end) => {
  taggedFields['99'] = {label: 'unexpected_field', name: 'z'};

  try {
    throws(
      () => createUnsignedRequest({
        description: 'coffee beans',
        id: '0001020304050607080900010203040506070809000102030405060708090102',
        network: 'bitcoin',
      }),
      new Error('UnexpectedTaggedFieldType'),
      'Got unexpected tagged field type error'
    );
  } finally {
    delete taggedFields['99'];
  }

  return end();
});

// Signing a blinded paths request with the bLIP 39 key gives its test vector
test('A blinded paths request matches the bLIP 39 test vector', (t, end) => {
  const {hash, hrp, tags} = createUnsignedRequest({
    created_at: '2017-06-01T10:57:38.000Z',
    description: '1 cup coffee',
    id: '0001020304050607080900010203040506070809000102030405060708090102',
    mtokens: '2000000000',
    network: 'bitcoin',
    paths: blindedPaths,
  });

  const signature = sign(
    bufFromHex(hash),
    bufFromHex('e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734')
  );

  const {request} = createSignedRequest({
    hrp,
    tags,
    destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
    signature: Buffer.from(signature).toString('hex'),
  });

  equal(request, blindedPathsRequest, 'Got bLIP 39 test vector request');

  return end();
});
