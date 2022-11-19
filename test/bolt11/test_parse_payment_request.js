const {test} = require('@alexbosworth/tap');

const {parsePaymentRequest} = require('./../../');

const msPerSec = 1e3;

const tests = [
  {
    description: "Test word length",
    expected: {
      cltv_delta: 144,
      created_at: '2018-07-03T02:32:54.000Z',
      description: 'Read: Global Cryptocurrency Regulation',
      destination: '02212d3ec887188b284dbb7b2e6eb40629a6e14fb049673f22d2a0aa05f902090e',
      expires_at: '2018-07-03T03:32:54.000Z',
      features: [],
      id: 'e21a0c8df400c66e62e315b1cc96abb95ca30bb00941bf35e436101af2f5b4ea',
      is_expired: true,
      mtokens: '150000',
      network: 'testnet',
      tokens: 150,
    },
    request: 'lntb1500n1pdn4czkpp5ugdqer05qrrxuchrzkcue94th9w2xzasp9qm7d0yxcgp4uh4kn4qdpa2fjkzep6yprkcmmzv9kzqsmj09c8gmmrw4e8yetwvdujq5n9va6kcct5d9hkucqzysdlghdpua7uvjjkcfj49psxtlqzkp5pdncffdfk2cp3mp76thrl29qhqgzufm503pjj96586n5w6edgw3n66j4rxxs707y4zdjuhyt6qqe5weu4',
  },
  {
    description: "Test capitalization",
    expected: {
      cltv_delta: 144,
      created_at: '2018-07-03T02:32:54.000Z',
      description: 'Read: Global Cryptocurrency Regulation',
      destination: '02212d3ec887188b284dbb7b2e6eb40629a6e14fb049673f22d2a0aa05f902090e',
      expires_at: '2018-07-03T03:32:54.000Z',
      features: [],
      id: 'e21a0c8df400c66e62e315b1cc96abb95ca30bb00941bf35e436101af2f5b4ea',
      is_expired: true,
      mtokens: '150000',
      network: 'testnet',
      tokens: 150,
    },
    request: 'LNTB1500N1PDN4CZKPP5UGDQER05QRRXUCHRZKCUE94TH9W2XZASP9QM7D0YXCGP4UH4KN4QDPA2FJKZEP6YPRKCMMZV9KZQSMJ09C8GMMRW4E8YETWVDUJQ5N9VA6KCCT5D9HKUCQZYSDLGHDPUA7UVJJKCFJ49PSXTLQZKP5PDNCFFDFK2CP3MP76THRL29QHQGZUFM503PJJ96586N5W6EDGW3N66J4RXXS707Y4ZDJUHYT6QQE5WEU4',
  },
  {
    description: 'Please make a donation of any amount using payment_hash',
    expected: {
      cltv_delta: 18,
      created_at: new Date(1496314658 * msPerSec).toISOString(),
      description: 'Please consider supporting this project',
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      expires_at: new Date((1496314658 + 3600) * msPerSec).toISOString(),
      features: [],
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      is_expired: true,
      mtokens: '0',
      network: 'bitcoin',
      tokens: 0,
    },
    request: 'lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdpl2pkx2ctnv5sxxmmwwd5kgetjypeh2ursdae8g6twvus8g6rfwvs8qun0dfjkxaq8rkx3yf5tcsyz3d73gafnh3cax9rn449d9p5uxz9ezhhypd0elx87sjle52x86fux2ypatgddc6k63n7erqz25le42c4u4ecky03ylcqca784w',
  },
  {
    description: 'Please send $3 for a cup of coffee to the same peer, within 1 minute',
    expected: {
      cltv_delta: 18,
      created_at: new Date(1496314658 * msPerSec).toISOString(),
      description: '1 cup coffee',
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      expires_at: new Date((1496314658 + 60) * msPerSec).toISOString(),
      features: [],
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      is_expired: true,
      mtokens: '250000000',
      network: 'bitcoin',
      tokens: 250000,
    },
    request: 'lnbc2500u1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpuaztrnwngzn3kdzw5hydlzf03qdgm2hdq27cqv3agm2awhz5se903vruatfhq77w3ls4evs3ch9zw97j25emudupq63nyw24cg27h2rspfj9srp',
  },
  {
    description: 'Please send 0.0025 BTC for a cup of nonsense (ナンセンス 1杯) to the same peer, within 1 minute',
    expected: {
      cltv_delta: 18,
      created_at: new Date(1496314658 * msPerSec).toISOString(),
      description: 'ナンセンス 1杯',
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      expires_at: new Date((1496314658 + 60) * msPerSec).toISOString(),
      features: [],
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      is_expired: true,
      mtokens: '250000000',
      network: 'bitcoin',
      tokens: 250000,
    },
    request: 'lnbc2500u1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdpquwpc4curk03c9wlrswe78q4eyqc7d8d0xqzpuyk0sg5g70me25alkluzd2x62aysf2pyy8edtjeevuv4p2d5p76r4zkmneet7uvyakky2zr4cusd45tftc9c5fh0nnqpnl2jfll544esqchsrny',
  },
  {
    description: 'Now send $24 for an entire list of things (hashed)',
    expected: {
      cltv_delta: 18,
      created_at: new Date(1496314658 * msPerSec).toISOString(),
      description_hash: '3925b6f67e2c340036ed12093dd44e0368df1b6ea26c53dbe4811f58fd5db8c1',
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      expires_at: new Date((1496314658 + 3600) * msPerSec).toISOString(),
      features: [],
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      is_expired: true,
      mtokens: '2000000000',
      network: 'bitcoin',
      tokens: 2000000,
    },
    request: 'lnbc20m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqscc6gd6ql3jrc5yzme8v4ntcewwz5cnw92tz0pc8qcuufvq7khhr8wpald05e92xw006sq94mg8v2ndf4sefvf9sygkshp5zfem29trqq2yxxz7',
  },
  {
    description: 'On mainnet, with fallback address 1RustyRX2oai4EYYDpQGWvEL62BBGqN9T with extra routing info',
    expected: {
      chain_addresses: ['1RustyRX2oai4EYYDpQGWvEL62BBGqN9T'],
      cltv_delta: 18,
      created_at: new Date(1496314658 * msPerSec).toISOString(),
      description_hash: '3925b6f67e2c340036ed12093dd44e0368df1b6ea26c53dbe4811f58fd5db8c1',
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      expires_at: new Date((1496314658 + 3600) * msPerSec).toISOString(),
      features: [],
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      is_expired: true,
      mtokens: '2000000000',
      network: 'bitcoin',
      routes: [
        [
          {
            public_key: '029e03a901b85534ff1e92c43c74431f7ce72046060fcf7a95c37e148f78c77255',
          },
          {
            base_fee_mtokens: '1',
            channel: '66051x263430x1800',
            cltv_delta: 3,
            fee_rate: 20,
            public_key: '039e03a901b85534ff1e92c43c74431f7ce72046060fcf7a95c37e148f78c77255',
          },
          {
            base_fee_mtokens: '2',
            channel: '197637x395016x2314',
            cltv_delta: 4,
            fee_rate: 30,
            public_key: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
          },
        ],
      ],
      tokens: 2000000,
    },
    request: 'lnbc20m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqsfpp3qjmp7lwpagxun9pygexvgpjdc4jdj85fr9yq20q82gphp2nflc7jtzrcazrra7wwgzxqc8u7754cdlpfrmccae92qgzqvzq2ps8pqqqqqqpqqqqq9qqqvpeuqafqxu92d8lr6fvg0r5gv0heeeqgcrqlnm6jhphu9y00rrhy4grqszsvpcgpy9qqqqqqgqqqqq7qqzqj9n4evl6mr5aj9f58zp6fyjzup6ywn3x6sk8akg5v4tgn2q8g4fhx05wf6juaxu9760yp46454gpg5mtzgerlzezqcqvjnhjh8z3g2qqdhhwkj',
  },
  {
    description: 'On mainnet, with fallback (P2SH) address 3EktnHQD7RiAE6uzMj2ZifT9YgRrkSgzQX',
    expected: {
      chain_addresses: ['3EktnHQD7RiAE6uzMj2ZifT9YgRrkSgzQX'],
      cltv_delta: 18,
      created_at: new Date(1496314658 * msPerSec).toISOString(),
      description_hash: '3925b6f67e2c340036ed12093dd44e0368df1b6ea26c53dbe4811f58fd5db8c1',
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      expires_at: new Date((1496314658 + 3600) * msPerSec).toISOString(),
      features: [],
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      is_expired: true,
      mtokens: '2000000000',
      network: 'bitcoin',
      tokens: 2000000,
    },
    request: 'lnbc20m1pvjluezhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqfppj3a24vwu6r8ejrss3axul8rxldph2q7z9kmrgvr7xlaqm47apw3d48zm203kzcq357a4ls9al2ea73r8jcceyjtya6fu5wzzpe50zrge6ulk4nvjcpxlekvmxl6qcs9j3tz0469gq5g658y',
  },
  {
    description: 'On mainnet, with fallback (P2WPKH) address bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    expected: {
      chain_addresses: ['bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'],
      cltv_delta: 18,
      created_at: new Date(1496314658 * msPerSec).toISOString(),
      description_hash: '3925b6f67e2c340036ed12093dd44e0368df1b6ea26c53dbe4811f58fd5db8c1',
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      expires_at: new Date((1496314658 + 3600) * msPerSec).toISOString(),
      features: [],
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      is_expired: true,
      mtokens: '2000000000',
      network: 'bitcoin',
      tokens: 2000000,
    },
    request: 'lnbc20m1pvjluezhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqfppqw508d6qejxtdg4y5r3zarvary0c5xw7kepvrhrm9s57hejg0p662ur5j5cr03890fa7k2pypgttmh4897d3raaq85a293e9jpuqwl0rnfuwzam7yr8e690nd2ypcq9hlkdwdvycqa0qza8',
  },
  {
    description: 'On mainnet, with fallback (P2WSH) address bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3',
    expected: {
      chain_addresses: ['bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3'],
      cltv_delta: 18,
      created_at: new Date(1496314658 * msPerSec).toISOString(),
      description_hash: '3925b6f67e2c340036ed12093dd44e0368df1b6ea26c53dbe4811f58fd5db8c1',
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      expires_at: new Date((1496314658 + 3600) * msPerSec).toISOString(),
      features: [],
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      is_expired: true,
      mtokens: '2000000000',
      network: 'bitcoin',
      tokens: 2000000,
    },
    request: 'lnbc20m1pvjluezhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqfp4qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q28j0v3rwgy9pvjnd48ee2pl8xrpxysd5g44td63g6xcjcu003j3qe8878hluqlvl3km8rm92f5stamd3jw763n3hck0ct7p8wwj463cql26ava',
  },
  {
    description: 'On testnet, no fallback address, small number of tokens',
    expected: {
      cltv_delta: 144,
      created_at: '2018-04-13T15:24:41.000Z',
      description: "Read Article: Soros Entering Bitcoin Market Be",
      destination: '0220f9fae5058ec9ddb46b4839b04298affa18913f104081aedd680816fb8165e3',
      expires_at: '2018-04-13T16:24:41.000Z',
      features: [],
      id: 'a8b626e4f842ca9157106d4854064c5550634cda9cd343bb9a0d117ff4406cec',
      is_expired: true,
      mtokens: '150000',
      network: 'testnet',
      tokens: 150,
    },
    request: 'lntb1500n1pddpjaepp54zmzde8cgt9fz4csd4y9gpjv24gxxnx6nnf58wu6p5ghlazqdnkqdz22fjkzepqg9e8g6trd3jn5gzndaex7ueqg4h8getjd9hxwgzzd96xxmmfdcsy6ctjddjhggzzv5cqzysp3mwgxdlhzxlj748qwsvmye6v062lpfnvwxmfadw3qfuktj4463nk4ms06zjculkp0sz9k3sklr3ee9x0wsya6x2takk5mpzyjpcuuspaqazd9',
  },
  {
    description: 'Partial tokens',
    expected: {
      chain_addresses: ['tb1qvzxxvnahw6gkj9aqpptktxpt6906cn2svvhayd'],
      cltv_delta: 18,
      created_at: new Date(1533923529 * msPerSec).toISOString(),
      description: '',
      destination: '032bb4f2cd2bf877429f1d79f91de0794e4a3b7b772febbf60fc21bb3475f7cd5e',
      expires_at: new Date((1533923529 + 172800) * msPerSec).toISOString(),
      features: [],
      id: '5c23c315170c4fc9b1020641651aae17021d7f2488160fc759bbcb666af771c6',
      is_expired: true,
      mtokens: '493020',
      network: 'testnet',
      routes: [[
        {
          public_key: '03933884aaf1d6b108397e5efe5c86bcf2d8ca8d2f700eda99db9214fc2712b134',
        },
        {
          base_fee_mtokens: '1000',
          channel: '1352828x35x0',
          cltv_delta: 144,
          fee_rate: 100,
          public_key: '032bb4f2cd2bf877429f1d79f91de0794e4a3b7b772febbf60fc21bb3475f7cd5e',
        },
      ]],
      tokens: 493,
    },
    request: 'lntb4930200p1pdkm5xfrzjqwfn3p9278ttzzpe0e00uhyxhned3j5d9acqak5emwfpflp8z2cng99y0sqqqgcqqqqqqqlgqqqqqeqqjqfppqvzxxvnahw6gkj9aqpptktxpt6906cn2sdqqxqy9gcqpp5ts3ux9ghp38unvgzqeqk2x4wzupp6ley3qtql36eh09kv6hhw8rqlsewhluvdsc05q8pcfwnrfplrglgzlzqmgkzamrhvxj8lep7hhajx6pu5s3ay6pjunw679nx9nrvkdl52n9l273ah4rxwm4tj8fcjcqqh4ku2d',
  },
  {
    description: 'Features and payment identifier',
    expected: {
      cltv_delta: 18,
      created_at: new Date(1496314658 * 1e3).toISOString(),
      description: 'coffee beans',
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      expires_at: new Date((1496314658 * 1e3) + (1000 * 60 * 60)).toISOString(),
      features: [
        {bit: 15, is_required: false, type: 'payment_identifier'},
        {bit: 99, is_required: false, type: undefined},
      ],
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      is_expired: true,
      mtokens: '2500000000',
      network: 'bitcoin',
      payment: '1111111111111111111111111111111111111111111111111111111111111111',
      safe_tokens: 2500000,
      tokens: 2500000,
    },
    request: 'lnbc25m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5vdhkven9v5sxyetpdeessp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygs9q5sqqqqqqqqqqqqqqqpqqq4u9s93jtgysm3mrwll70zr697y3mf902hvxwej0v7c62rsltw83ng0pu8w3j230sluc5gxkdmm9dvpy9y6ggtjd2w544mzdrcs42t7sqdkcy8h',
  },
  {
    description: 'TLV onion payment request',
    expected: {
      cltv_delta: 99,
      created_at: '2019-12-15T22:55:21.000Z',
      description: 'Read: Global Cryptocurrency Regulation',
      destination: '02ff85a8569c0e0a959af504398c4730def961c3b7104b9b27f3bcf527ff5da0e9',
      expires_at: '2019-12-15T23:55:21.000Z',
      features: [{bit: 9, is_required: false, type: 'tlv_onion'}],
      id: '7426ba0604c3f8682c7016b44673f85c5bd9da2fa6c1080810cf53ae320c9863',
      is_expired: true,
      mtokens: '150000',
      network: 'regtest',
      payment: 'a4bbb8285d8f4b74097889562d1a03098791a503b3720835658dfa277c65b78e',
      safe_tokens: 150,
      tokens: 150,
    },
    request: 'lnbcrt1500n1pwldwwepp5wsnt5psyc0uxstrsz66yvulct3dank305mqsszqseaf6uvsvnp3sdpa2fjkzep6yprkcmmzv9kzqsmj09c8gmmrw4e8yetwvdujq5n9va6kcct5d9hkucqzrr9qzsqsp55jams2za3a9hgztc39tz6xsrpxrerfgrkdeqsdt93hazwlr9k78q03hl88h8fsu0pyz2ex4fsz62ycm48s55gqc9kjxahlnp6jj0rjq5ssyp2xr4qmsyec3szqphngxmkm65j8ttga2ulg3xzwmq5ry5xvqpet0rgz',
  },
  {
    description: 'Metadata blob request',
    expected: {
      cltv_delta: 18,
      created_at: '2017-06-01T10:57:38.000Z',
      description: 'payment metadata inside',
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      expires_at: '2017-06-01T11:57:38.000Z',
      features: [
        {
          bit: 14,
          is_required: true,
          type: 'payment_identifier',
        },
        {
          bit: 48,
          is_required: true,
          type: 'pay_includes_metadata',
        },
        {
          bit: 8,
          is_required: true,
          type: 'tlv_onion',
        },
      ],
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      is_expired: true,
      metadata: '01fafaf0',
      mtokens: '1000000000',
      network: 'bitcoin',
      payment: '1111111111111111111111111111111111111111111111111111111111111111',
      tokens: 1000000,
    },
    request: 'lnbc10m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdp9wpshjmt9de6zqmt9w3skgct5vysxjmnnd9jx2mq8q8a04uqsp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygs9q2gqqqqqqsgq7hf8he7ecf7n4ffphs6awl9t6676rrclv9ckg3d3ncn7fct63p6s365duk5wrk202cfy3aj5xnnp5gs3vrdvruverwwq7yzhkf5a3xqpd05wjc',
  },
];

tests.forEach(({description, expected, request}) => {
  return test(description, ({end, equal, strictSame}) => {
    const details = parsePaymentRequest({request});

    strictSame(details.chain_addresses, expected.chain_addresses, 'Parse address');
    equal(details.cltv_delta, expected.cltv_delta, 'Parse cltv delta');
    equal(details.created_at, expected.created_at, 'Parse created at date');
    equal(details.description, expected.description, 'Parse description');
    equal(details.description_hash, expected.description_hash, 'Desc hash');
    equal(details.destination, expected.destination, 'Parse dest pubkey');
    equal(details.expires_at, expected.expires_at, 'Parse expiration date');
    strictSame(details.features, expected.features, 'Parse feature bits');
    equal(details.id, expected.id, 'Parse payment hash');
    equal(details.is_expired, expected.is_expired, 'Check expiration status');
    equal(details.metadata, expected.metadata, 'Parse metadata blob');
    equal(details.mtokens, expected.mtokens, 'Parse millitokens amount');
    equal(details.network, expected.network, 'Parse network');
    equal(details.payment, expected.payment, 'Parse payment identifier');
    equal(details.tokens, expected.tokens, 'Parse tokens amount');

    if (Array.isArray(details.routes) || Array.isArray(expected.routes)) {
      equal(Array.isArray(expected.routes), true, 'Routes were expected');
      equal(Array.isArray(details.routes), true, 'Routes were parsed');
      equal(details.routes.length, expected.routes.length, 'Parse all routes');

      details.routes.forEach((route, i) => {
        return route.forEach((hop, j) => {
          const expect = expected.routes[i][j];

          equal(hop.base_fee_mtokens, expect.base_fee_mtokens, 'Hop base-fee');
          equal(hop.channel, expect.channel, 'Parsed hop channel id');
          equal(hop.cltv_delta, expect.cltv_delta, 'Parsed hop cltv delta');
          equal(hop.fee_rate, expect.fee_rate, 'Parsed hop fee rate');
          equal(hop.public_key, expect.public_key, 'Parsed hop public key');

          return;
        });
      });
    }

    return end();
  });
});
