const {equal} = require('node:assert').strict;
const strictSame = require('node:assert').strict.deepStrictEqual;
const test = require('node:test');
const {throws} = require('node:assert').strict;

const {parsePaymentRequest} = require('./../../');

const msPerSec = 1e3;

const tests = [
  {
    description: 'A payment request is required',
    error: 'ExpectedPaymentRequest',
  },
  {
    description: 'A request with the ln prefix is required',
    error: 'ExpectedLnPrefix',
    request: 'bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080',
  },
  {
    description: 'A payment request within the maximum length is required',
    error: 'ExpectedPaymentRequestWithinMaximumLength',
    request: 'ln'.padEnd(7090, 'q'),
  },
  {
    description: 'A payment request with a valid checksum is required',
    error: 'Invalid checksum for lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdpl2pkx2ctnv5sxxmmwwd5kgetjypeh2ursdae8g6twvus8g6rfwvs8qun0dfjkxaq8rkx3yf5tcsyz3d73gafnh3cax9rn449d9p5uxz9ezhhypd0elx87sjle52x86fux2ypatgddc6k63n7erqz25le42c4u4ecky03ylcqca784x',
    request: 'lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdpl2pkx2ctnv5sxxmmwwd5kgetjypeh2ursdae8g6twvus8g6rfwvs8qun0dfjkxaq8rkx3yf5tcsyz3d73gafnh3cax9rn449d9p5uxz9ezhhypd0elx87sjle52x86fux2ypatgddc6k63n7erqz25le42c4u4ecky03ylcqca784x',
  },
  {
    description: 'A payment request with consistent letter case is required',
    error: 'Mixed-case string lnbc2500u1PvJlUeZ',
    request: 'lnbc2500u1PvJlUeZ',
  },
  {
    description: 'A payment request with non-ASCII characters is rejected',
    error: 'ExpectedAsciiCharactersInPaymentRequest',
    request: 'LNBC25M1PVJLUEZPP5QQQSYQCYQ5RQWZQFQQQSYQCYQ5RQWZQFQQQSYQCYQ5RQWZQFQYPQDQ5VDHKVEN9V5SXYETPDEESSP5ZYG3ZYG3ZYG3ZYG3ZYG3ZYG3ZYG3ZYG3ZYG3ZYG3ZYG3ZYG3ZYGS9Q5SQQQQQQQQQQQQQQQQSGQ2A25DXL5HRNTDTN6ZVYDT7D66HYZSYHQS4WDYNAVYS42XGL6SGX9C4G7ME86A27T07MDTFRY458RTJR0V92CNMSWPSJSCGT2VCSE3SGPZ3UAPA',
  },
  {
    description: 'A payment request with a separator character is required',
    error: 'No separator character for lnbc2500u',
    request: 'lnbc2500u',
  },
  {
    description: 'A pico amount that encodes fractional millitokens fails',
    error: 'ExpectedWholeMillitokensAmountToParseHrpAsMtokens',
    request: 'lnbc1p1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq2vdhkven9v5sp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygs42qugy3a024d7v30sjh984mcaz8hv4nfahvc6fuadka6d0telkehk7z97uec4q0w5c26mnh4dtr3vpxyxync6quh2465uh5xpcwc8nspsy3akd',
  },
  {
    description: 'A description or a description hash is required',
    error: 'ExpectedDescriptionOrDescriptionHashInPaymentRequest',
    request: 'lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqsp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygsmux4cg7ekl35nvz5y34s7ny87876k23qew3ld9js4s9k28uncg8hqpnefpwhu3p93w66a8nlwwgrxycxpynhy6r2nur23h2cj2w7jyqqeklgla',
  },
  {
    description: 'A payment hash may only be specified once',
    error: 'UnexpectedDuplicatePaymentHashInPaymentRequest',
    request: 'lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqpp5yg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3qdq2vdhkven9v5sp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygsdxyne60kcxjjpynjc2js6hs2qz0avyxp2uth6p6x0lhqu6sh3zdxpyj8zsk8hcq4thd5qgttj76guxrmutwsqff705m7f7uge9f32vgpr9p4zs',
  },
  {
    description: 'A description and a description hash are mutually exclusive',
    error: 'UnexpectedDescriptionAndDescriptionHashInRequest',
    request: 'lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq2vdhkven9v5sp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygshp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqs6m5mwgzej2e0636ya683mlqj7zdhhxecuqhwlhtl77ltlz3g3p89zwqnlmazg93v3x2cv7hjdztr4srkeyrcypr8yvn5np9s9uzktysq5fhwhu',
  },
  {
    description: 'A payment hash is required',
    error: 'ExpectedPaymentHashInPaymentRequest',
    request: 'lnbc25m1pvjluezdq5vdhkven9v5sxyetpdeessp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygs0qnw0tehhth2mgpmss9srdgtkk6nsdt37glufpzwx7spd89m9ze3afga0dmxtwzkzqkztcartz8hlp3scr2d2czf7a26e4je456544qqed4vdy',
  },
  {
    description: 'A payment identifier may only be specified once',
    error: 'UnexpectedDuplicatePaymentIdentifierInPaymentRequest',
    request: 'lnbc25m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5vdhkven9v5sxyetpdeessp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygssp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygsa6qm6aslp6pyhvq3xrcnhdtv6p6du6mnc4d3d9a32a4trstugz8p9gev3lahhqsx7qpkz67atayvp5xh35santdd95tmpqlrfg2gd6cpkg3s8t',
  },
  {
    description: 'A description may only be specified once',
    error: 'UnexpectedDuplicateDescriptionInPaymentRequest',
    request: 'lnbc25m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5vdhkven9v5sxyetpdeesdq2vdhkven9v5sp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygss4gwhp75ww5hzr6qwqhf4dus05n0k44w73vf0g8njphdsqml540jtzfmcacw9xyc2dkhewncq0teh2dpkcgjc82nkxh87pu8suj430gqe65kpj',
  },
  {
    description: 'A description hash may only be specified once',
    error: 'UnexpectedDuplicateDescriptionHashInPaymentRequest',
    request: 'lnbc25m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqhp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqhp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqsp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygsr4jd5a00dwjp4ga4yecyre0c55g756mh2j9q426gyana0hs9cn8qqdz4xpg3s0qd36wpmm5mm4q8ujltguvzag7e9t2jt82nm8u0qaqqpjhvlz',
  },
  {
    description: 'A destination public key may only be specified once',
    error: 'UnexpectedDuplicateDestinationKeyInPaymentRequest',
    request: 'lnbc25m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5vdhkven9v5sxyetpdeessp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygsnp4q0n326hr8v9zprg8gsvezcch06gfaqqhde2aj730yg0durunfhv66np4q0n326hr8v9zprg8gsvezcch06gfaqqhde2aj730yg0durunfhv66dccm5l62rtqazf7t6wrnkgjyn0rpen3ux2kkskptrydvfaqst7uxwghjc83xl0nt2fwkpxhkfqvhe4luj2vj38hdfd2vwsdrmkmjx4gqzmft6v',
  },
  {
    description: 'An expiry may only be specified once',
    error: 'UnexpectedDuplicateExpiryInPaymentRequest',
    request: 'lnbc25m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5vdhkven9v5sxyetpdeessp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygsxqzpuxqzpue7gv755lrtkshj5mf68xs6r45rmga9u3gnuf2kzt83saccwfvf98gkpql68fx8kaes5l5fua0vx84pcw3unej9vvqzrsklc5m2qgqlsqg72p48',
  },
  {
    description: 'A cltv delta may only be specified once',
    error: 'UnexpectedDuplicateCltvDeltaInPaymentRequest',
    request: 'lnbc25m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5vdhkven9v5sxyetpdeessp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygscqzyscqzyspu4ghqmsp2d5t9qkjcllkn7wn2qvzfyfd5t0j7t0rt3udhluvsz5mgp8anw9623myazs989dft842g646pmfd3d95f477gx0664a3qcp9vn8up',
  },
  {
    description: 'Feature bits may only be specified once',
    error: 'UnexpectedDuplicateFeatureBitsInPaymentRequest',
    request: 'lnbc25m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5vdhkven9v5sxyetpdeessp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygs9qrsgq9qrsgqehagdqt7nvumee5t4mfguqtffys02gyrazphud5msjkqlkl5vc4ydwdht8264rvwwq2rgh4hlxer69k89sekh8j5dy0asu92cr4fdscqgmsc66',
  },
  {
    description: 'Metadata may only be specified once',
    error: 'UnexpectedDuplicateMetadataInPaymentRequest',
    request: 'lnbc25m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5vdhkven9v5sxyetpdeessp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygsmq8q8a04uqmq8q8a04uqf4tc77g35uceu3w42p8pecy0shzp6fn3zul6slq98dgreskrycgnq3ajge95y22nv8rr4uymzm35044krmq7m3vzcwmj2nt4gg6uxssqfpfldm',
  },
  {
    description: 'An unknown required feature bit is surfaced',
    expected: {
      cltv_delta: 18,
      created_at: new Date(1496314658 * msPerSec).toISOString(),
      description: 'coffee beans',
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      expires_at: new Date((1496314658 + 3600) * msPerSec).toISOString(),
      features: [
        {bit: 8, is_required: true, type: 'tlv_onion'},
        {bit: 14, is_required: true, type: 'payment_identifier'},
        {bit: 99, is_required: false, type: undefined},
        {bit: 100, is_required: true, type: undefined},
      ],
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      is_expired: true,
      mtokens: '2500000000',
      network: 'bitcoin',
      payment: '1111111111111111111111111111111111111111111111111111111111111111',
      safe_tokens: 2500000,
      tokens: 2500000,
    },
    request: 'lnbc25m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5vdhkven9v5sxyetpdeessp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygs9q4psqqqqqqqqqqqqqqqqsgqtqyx5vggfcsll4wu246hz02kp85x4katwsk9639we5n5yngc3yhqkm35jnjw4len8vrnqnf5ejh0mzj9n3vz2px97evektfm2l6wqccp3y7372',
  },
  {
    description: 'A non-minimal expiry encoding is rejected',
    error: 'ExpectedMinimalExpiryEncodingInPaymentRequest',
    request: 'lnbc25m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5vdhkven9v5sxyetpdeessp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygsxqrqpuwluxynj5w3xs97s9j94s5tlvj92kww76lfypj8xycves02zjpqx8gsvxgfuuj62v5jjtk2ke4p3a5ah92zymnz9pz5avcaxygnq3ulcptv8dyr',
  },
  {
    description: 'A non-minimal cltv delta encoding is rejected',
    error: 'ExpectedMinimalCltvDeltaEncodingInPaymentRequest',
    request: 'lnbc25m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5vdhkven9v5sxyetpdeessp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygscqrqys25at0ltpvldws0258qy256fkxergsgexml6ezkc47mezf9pn2hhqr6pmlstks8z6404jwu8te8lcsj5yn3hh2rfddquct5xurwhucxsp9qfllv',
  },
  {
    description: 'A non-minimal feature bits encoding is rejected',
    error: 'ExpectedMinimalFeatureBitsEncodingInPaymentRequest',
    request: 'lnbc25m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5vdhkven9v5sxyetpdeessp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygs9qyqsgq6yhva4zpyn8ynyglw4ngfuewjvr8csm8jlk06h6n836fyrznmrzs58hz3g6zefkx5hymra7z3cl4udm9fq3c6u80e5hffax6j8c3uvgqquj4us',
  },
  {
    description: 'A truncated route hint is rejected',
    error: 'UnexpectedRouteHintsLengthInPaymentRequest',
    request: 'lnbc25m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5vdhkven9v5sxyetpdeessp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygsrzsq20q82gphp2nflc7jtzrcazrra7wwgzxqc8u7754cdlpfrmccae92qgzqvzq2ps8pqqqqqq2qqqqq9qq3wmc2y58c9erc3n26gx2fawt5twhk6fplzymptv7wmpzh92n83l9m25zm0k3rccyvea3qmr2p89frvntk8lq0f5mgn2l44nql7kgjysqfnap3k',
  },
  {
    description: 'An empty route hint field is rejected',
    error: 'UnexpectedRouteHintsLengthInPaymentRequest',
    request: 'lnbc25m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5vdhkven9v5sxyetpdeessp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygsrqq79lfgrhkk79l2hq6afz0304sa4dg36gpatzaagx2s8js6gelvkz4ceez90x8ye27se6x8ls07pk9khrmw9duutze6ex78vxdyx6ffgsqy8v4tw',
  },
  {
    description: 'An expiry past the end of the date range is rejected',
    error: 'ExpectedExpiryWithinDateRangeInPaymentRequest',
    request: 'lnbc25m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5vdhkven9v5sxyetpdeessp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygsxqtyqqqqqqqqqqe5aegq9plvql3au0r20ak23eaaefvktx7dx3hacmfeacx2c7nn3r75fctvn84mgmysn9t8762c0z2v8j0nj4es3p2y8uj4jgewnev5gp2m87w3',
  },
  {
    description: 'An all upper case payment request is parsed',
    expected: {
      cltv_delta: 18,
      created_at: new Date(1496314658 * msPerSec).toISOString(),
      description: 'coffee beans',
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      expires_at: new Date((1496314658 + 3600) * msPerSec).toISOString(),
      features: [
        {bit: 8, is_required: true, type: 'tlv_onion'},
        {bit: 14, is_required: true, type: 'payment_identifier'},
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
    request: 'LNBC25M1PVJLUEZPP5QQQSYQCYQ5RQWZQFQQQSYQCYQ5RQWZQFQQQSYQCYQ5RQWZQFQYPQDQ5VDHKVEN9V5SXYETPDEESSP5ZYG3ZYG3ZYG3ZYG3ZYG3ZYG3ZYG3ZYG3ZYG3ZYG3ZYG3ZYG3ZYGS9Q5SQQQQQQQQQQQQQQQQSGQ2A25DXL5HRNTDTN6ZVYDT7D66HYZSYHQS4WDYNAVYS42XGL6SGX9C4G7ME86A27T07MDTFRY458RTJR0V92CNMSWPSJSCGT2VCSE3SGPZ3UAPA',
  },
  {
    description: 'A payment hash must have the expected length',
    error: 'UnexpectedPaymentHashLengthInPaymentRequest',
    request: 'lnbc1pvjluezppnqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypdq2vdhkven9v5sp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygsludftt9y69r4cl40p39ecjrls8yrv8camdtce74dlzvfpz8023ekllr66yxz22zp3mdmlj0rt3jrj00zrdq63tqjahy8at0jrnng03sq7u6drs',
  },
  {
    description: 'A description hash must have the expected length',
    error: 'UnexpectedDescriptionHashLengthInPaymentRequest',
    request: 'lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq2vdhkven9v5hpnqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypsp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygsj2k447hcsz8zfh59g49kmy6z6a3hy82vzfchsy2te6f2punamwyycp7g9asjjsr87dv4awce2wg7yzztghxlxlyz0qyrljrs7whjkugpqggz30',
  },
  {
    description: 'A payment identifier must have the expected length',
    error: 'UnexpectedPaymentIdentifierLengthInPaymentRequest',
    request: 'lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq2vdhkven9v5spjzyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyzckc2t6dy0sxfpy2yk2w2pp4vf26swkurpt8awkf6h7cs749ey8hsqvkul5fq74emn5nktrkp5yf72cakqm4dvdsv4rd8trwh7tz4kgpsx2qep',
  },
  {
    description: 'A destination public key must have the expected length',
    error: 'UnexpectedDestinationKeyLengthInPaymentRequest',
    request: 'lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq2vdhkven9v5sp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygsnp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygsu244axjc2rpwl6ywgcc2gjpwktxjg7l8magay0jt698jjp8jxgznls8vuvr3wvk0ln6vp7e309fxs4dwcerqfkll379gk259uwnzn7cpxvlgf2',
  },
  {
    description: 'A destination public key must be a valid public key',
    error: 'InvalidDestinationPublicKeyInPaymentRequest',
    request: 'lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq2vdhkven9v5sp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygsnp4qtllllllllllllllllllllllllllllllllllllllllllllllllll7vse9g0dp8awcl65cpuujze54uyd9nmjnqq3vkqa249vx0gkheae3jrsgz67aevaf5xhjsecx7mgck4v0k2ctx50fs4cqnvrrns88wmcpfdantr',
  },
  {
    description: 'A signature must be valid for a given destination public key',
    error: 'InvalidSignatureForDestinationPublicKey',
    request: 'lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq2vdhkven9v5sp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygsnp4qvdcf32k0vfxgsyet5ldt246q4jaw8scx3sysx0lnstlt6w4m5rc7h7364g7pfuhh9etce8y399rcr0ap87drcl7l6af6syrjsalrthw5qxdugelrlcswc355cla0pnmctlgnf5jgagg9fs0xyq4jg5kverqp6ryc0z',
  },
  {
    description: 'A signature must recover to a public key',
    error: 'ExpectedRecoverableSignatureInPaymentRequest',
    request: 'lnbc25m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5vdhkven9v5sxyetpdeessp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygs9q5sqqqqqqqqqqqqqqqqsgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqgzky20nr',
  },
  {
    description: 'A low-S signature is required with a destination public key',
    error: 'InvalidSignatureForDestinationPublicKey',
    request: 'lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq2vdhkven9v5sp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygsnp4qvdcf32k0vfxgsyet5ldt246q4jaw8scx3sysx0lnstlt6w4m5rc738hxj8g6cccxpyv7v9azt5ephff75xmpd5az8zwgdl28zjevj9l07stkxrymwcyecs06fh3tvd7nkjdcttxc4jfly0ehlu5xpejmdjqq27lun0',
  },
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
    description: 'Fixed length fields with incorrect lengths are rejected',
    error: 'UnexpectedPaymentHashLengthInPaymentRequest',
    request: 'lnbc25m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5vdhkven9v5sxyetpdeessp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygs9q5sqqqqqqqqqqqqqqqqsgq2qrqqqfppnqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqppnqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpp4qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhpnqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhp4qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqspnqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsp4qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqnp5qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqnpkqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqz599y53s3ujmcfjp5xrdap68qxymkqphwsexhmhr8wdz5usdzkzrse33chw6dlp3jhuhge9ley7j2ayx36kawe7kmgg8sv5ugdyusdcqzn8z9x',
  },
  {
    description: 'Fields that must be ignored are skipped',
    expected: {
      cltv_delta: 18,
      created_at: new Date(1496314658 * msPerSec).toISOString(),
      description: 'coffee beans',
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      expires_at: new Date((1496314658 + 3600) * msPerSec).toISOString(),
      features: [
        {bit: 8, is_required: true, type: 'tlv_onion'},
        {bit: 14, is_required: true, type: 'payment_identifier'},
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
    request: 'lnbc25m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5vdhkven9v5sxyetpdeessp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygs9q5sqqqqqqqqqqqqqqqqsgq2qrqqqfppnqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqcsenjd934c02h7v9deyju0t43ye2y38nd2h2wr0ykzlqs7v873jkvvg36kfwwmp9lftrn8a3gp4ax52zpvyc7quffgjjj7avx7we9zcp3dce9d',
  },
  {
    description: 'A legacy request that has no payment identifier is parsed',
    expected: {
      cltv_delta: 18,
      created_at: new Date(1496314658 * msPerSec).toISOString(),
      description_hash: '3925b6f67e2c340036ed12093dd44e0368df1b6ea26c53dbe4811f58fd5db8c1',
      destination: '0212cfa0137a4bfa5b76de84c3a89ceff01c5f22d0dbf1360258000b8372a58e70',
      expires_at: new Date((1496314658 + 3600) * msPerSec).toISOString(),
      features: [
        {bit: 8, is_required: true, type: 'tlv_onion'},
        {bit: 14, is_required: true, type: 'payment_identifier'},
      ],
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      is_expired: true,
      mtokens: '2000000000',
      network: 'bitcoin',
      safe_tokens: 2000000,
      tokens: 2000000,
    },
    request: 'lnbc20m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqs9qrsgq7ea976txfraylvgzuxs8kgcw23ezlrszfnh8r6qtfpr6cxga50aj6txm9rxrydzd06dfeawfk6swupvz4erwnyutnjq7x39ymw6j38gp49qdkj',
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
          bit: 8,
          is_required: true,
          type: 'tlv_onion',
        },
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
  {
    description: 'P2TR fallback address',
    expected: {
      chain_addresses: [
        'bc1pptdvg0d2nj99568qn6ssdy4cygnwuxgw2ukmnwgwz7jpqjz2kszse2s3lm',
      ],
      cltv_delta: 18,
      created_at: '2017-06-01T10:57:38.000Z',
      description_hash: '3925b6f67e2c340036ed12093dd44e0368df1b6ea26c53dbe4811f58fd5db8c1',
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      expires_at: '2017-06-01T11:57:38.000Z',
      features: [
        {
          bit: 8,
          is_required: true,
          type: 'tlv_onion',
        },
        {
          bit: 14,
          is_required: true,
          type: 'payment_identifier',
        },
      ],
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      is_expired: true,
      mtokens: '2000000000',
      network: 'bitcoin',
      payment: '1111111111111111111111111111111111111111111111111111111111111111',
      tokens: 2000000,
    },
    request: 'lnbc20m1pvjluezsp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqsfp4pptdvg0d2nj99568qn6ssdy4cygnwuxgw2ukmnwgwz7jpqjz2kszs9qrsgqy606dznq28exnydt2r4c29y56xjtn3sk4mhgjtl4pg2y4ar3249rq4ajlmj9jy8zvlzw7cr8mggqzm842xfr0v72rswzq9xvr4hknfsqwmn6xd',
  },
  {
    description: 'Signet request with a fallback address and route hints',
    expected: {
      chain_addresses: ['tb1q6qh9jsxr9tsf4fu5q29p26fmc8zh8m3rsjsp3c'],
      cltv_delta: 147,
      created_at: '2023-02-13T19:04:04.000Z',
      description: 'Test',
      destination: '031d1bbeca35a5490fce8e9c9e8a77487e32157d11a18b77b162612cc6a6a92482',
      expires_at: '2023-02-14T19:04:04.000Z',
      features: [
        {bit: 9, is_required: false, type: 'tlv_onion'},
        {bit: 15, is_required: false, type: 'payment_identifier'},
        {bit: 17, is_required: false, type: 'multipath_payments_v0'},
        {bit: 149, is_required: false, type: undefined},
      ],
      id: '8f629ed0ac74d28242459d61950c54c160ce52e175d6eb19f925a2bd73f84469',
      is_expired: true,
      mtokens: '0',
      network: 'signet',
      payment: '85b857970c81aa41f2c6dd3ba33d2ae1e995de8d321cd520a23d336f113c2e77',
      routes: [[
        {
          public_key: '03108c224ee3889c2d472f9bbe410f45dcaae6e664ec42c06feefc3c7e25805869',
        },
        {
          base_fee_mtokens: '0',
          channel: '115966x2x1',
          cltv_delta: 6,
          fee_rate: 100,
          public_key: '031d1bbeca35a5490fce8e9c9e8a77487e32157d11a18b77b162612cc6a6a92482',
        },
      ]],
      tokens: 0,
    },
    request: 'lntbs1p374zdypp53a3fa59vwnfgysj9n4se2rz5c9svu5hpwhtwkx0eyk3t6ulcg35ssp5sku909cvsx4yrukxm5a6x0f2u85eth5dxgwd2g9z85ek7yfu9emsdq823jhxaqcqzynxqyz5vq9q7sqqqqqqqqqqqqqqqqqqqqqqqqq9qsqfppq6qh9jsxr9tsf4fu5q29p26fmc8zh8m3rrzjqvggcgjwuwyfct2897dmusg0ghw24ehxvnky9sr0am7rcl39spvxjqwylcqqqqsqqyqqqqqqqqqqqeqqqc8vj4p363fva9zczjvmw2ugru9wcqufsf6ukylwk0ajqcm8q54788zrnjsz7qdrlvzt8s3kk6p5pnua93kzzmf7fjgu3e30d8rnyy6ecpq8frd8',
  },
  {
    description: 'A destination public key field validates the signature',
    expected: {
      cltv_delta: 18,
      created_at: new Date(1496314658 * msPerSec).toISOString(),
      description: 'coffee',
      destination: '031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f',
      expires_at: new Date((1496314658 + 3600) * msPerSec).toISOString(),
      features: [],
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      is_expired: true,
      mtokens: '0',
      network: 'bitcoin',
      payment: '1111111111111111111111111111111111111111111111111111111111111111',
      tokens: 0,
    },
    request: 'lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq2vdhkven9v5sp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygsnp4qvdcf32k0vfxgsyet5ldt246q4jaw8scx3sysx0lnstlt6w4m5rc738hxj8g6cccxpyv7v9azt5ephff75xmpd5az8zwgdl28zjevj9lqp05feumy38mx80s9kgw5njpvxu8ksgvjglmpzlx9ymqxc8gg57gphadln3',
  },
  {
    description: 'A payment request that has yet to expire is not expired',
    expected: {
      cltv_delta: 18,
      created_at: '2026-01-01T00:00:00.000Z',
      description: 'valid for a century',
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      expires_at: '2126-01-01T00:00:00.000Z',
      features: [],
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      is_expired: false,
      mtokens: '2500000000',
      network: 'bitcoin',
      safe_tokens: 2500000,
      tokens: 2500000,
    },
    request: 'lnbc25m1p54twgqpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqxq8z7p0ssqdqlweskc6tyypnx7u3qvysxxetww36hy7gr4f9scvxhcr4ldxdq9hkpc5rw0l6qka5f7jvza5nuj43u3aqy94hw2zg6tu7n8kzkxed6j25zts5qedu0phyy9qhe5fgegg7tuskf3sp0kakl5',
  },
  {
    description: 'A payment request with blinded paths has paths',
    expected: {
      cltv_delta: 18,
      created_at: new Date(1496314658 * msPerSec).toISOString(),
      description: '1 cup coffee',
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      expires_at: new Date((1496314658 + 3600) * msPerSec).toISOString(),
      features: [],
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      is_expired: true,
      mtokens: '2000000000',
      network: 'bitcoin',
      paths: [
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
      ],
      safe_tokens: 2000000,
      tokens: 2000000,
    },
    request: 'lnbc20m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4js5fdqqqqq2qqqqqpgqyzqqqqqqqqqqqqyqqqqqqqqqqqvsqqqqlnxy0ffrlt2y2jgtzw89kgr3zg4dlwtlfycn3yuek8x5eucnuchqps82xf0m2u6sx5wnjw7xxgnxz5kf09quqsv5zvkgj7d5kpzttp4qz7q5qsyqcyq5pzq2feycsemrh7wvendc4kw3tsmkt25a36ev6kfehrv7ecfkrp5zs9q5zqxqspqtr4avek5quzjn427asptzews5wrczfhychr2sq6ue9phmn35tjqcrspqgpsgpgxquyqjzstpsxsu59zqqqqqpqqqqqqyqq2qqqqqqqqqqqqqqqqqqqqqqqqpgqqqqk8t6endgpc99824amqzk9japgu8synwf3wx4qp4ej2r0h8rghypsqsygpf8ynzr8vwleenxdhzke69wrwed2nk8t9n2e8xudnm8pxcvxs2q5qsyqcyq5y4rdlhtf84f8rgdj34275juwls2ftxtcfh035863q3p9k6s94hpxhdmzfn5gxpsazdznxs56j4vt3fdhe00g9v2l3szher50hp4xlggqkxf77f',
  },
  {
    description: 'A blinded paths request with the blinded paths feature bit is parsed',
    expected: {
      cltv_delta: 18,
      created_at: new Date(1496314658 * msPerSec).toISOString(),
      description: '1 cup coffee',
      destination: '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad',
      expires_at: new Date((1496314658 + 3600) * msPerSec).toISOString(),
      features: [{bit: 262, is_required: true, type: undefined}],
      id: '0001020304050607080900010203040506070809000102030405060708090102',
      is_expired: true,
      mtokens: '2000000000',
      network: 'bitcoin',
      paths: [
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
      ],
      safe_tokens: 2000000,
      tokens: 2000000,
    },
    request: 'lnbc20m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4js5fdqqqqq2qqqqqpgqyzqqqqqqqqqqqqyqqqqqqqqqqqvsqqqqlnxy0ffrlt2y2jgtzw89kgr3zg4dlwtlfycn3yuek8x5eucnuchqps82xf0m2u6sx5wnjw7xxgnxz5kf09quqsv5zvkgj7d5kpzttp4qz7q5qsyqcyq5pzq2feycsemrh7wvendc4kw3tsmkt25a36ev6kfehrv7ecfkrp5zs9q5zqxqspqtr4avek5quzjn427asptzews5wrczfhychr2sq6ue9phmn35tjqcrspqgpsgpgxquyqjzstpsxsu59zqqqqqpqqqqqqyqq2qqqqqqqqqqqqqqqqqqqqqqqqpgqqqqk8t6endgpc99824amqzk9japgu8synwf3wx4qp4ej2r0h8rghypsqsygpf8ynzr8vwleenxdhzke69wrwed2nk8t9n2e8xudnm8pxcvxs2q5qsyqcyq59p4yqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq4k0whvnzh56j86af7s6uu377hpten7l8faxjvyydhm66th9wudln5nakccmq6fg8daxf5rqu3lndsksykqpsckw9dwhc84dgraq65msq7a3xmf',
  },
  {
    description: 'A payment request cannot have both route hints and blinded paths',
    error: 'UnexpectedRouteHintsAndBlindedPathsInRequest',
    request: 'lnbc20m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4js5fdqqqqq2qqqqqpgqyzqqqqqqqqqqqqyqqqqqqqqqqqvsqqqqlnxy0ffrlt2y2jgtzw89kgr3zg4dlwtlfycn3yuek8x5eucnuchqps82xf0m2u6sx5wnjw7xxgnxz5kf09quqsv5zvkgj7d5kpzttp4qz7q5qsyqcyq5pzq2feycsemrh7wvendc4kw3tsmkt25a36ev6kfehrv7ecfkrp5zs9q5zqxqspqtr4avek5quzjn427asptzews5wrczfhychr2sq6ue9phmn35tjqcrspqgpsgpgxquyqjzstpsxsu59zqqqqqpqqqqqqyqq2qqqqqqqqqqqqqqqqqqqqqqqqpgqqqqk8t6endgpc99824amqzk9japgu8synwf3wx4qp4ej2r0h8rghypsqsygpf8ynzr8vwleenxdhzke69wrwed2nk8t9n2e8xudnm8pxcvxs2q5qsyqcyq5rzjq20q82gphp2nflc7jtzrcazrra7wwgzxqc8u7754cdlpfrmccae92qgzqvzq2ps8pqqqqqqpqqqqq9qqqvyp0lqgz2r9zwud5q6h8kjcgld94klwg6szamped2zj8s0nzrygpjflwq02jv0qnax85se4gyvhe3e653g6fpsj609r0m9dteyy07rusqq4jqnz',
  },
];

tests.forEach(args => {
  const {description, error, expected} = args;

  return test(description, (t, end) => {
    const {request} = args;

    if (!!error) {
      throws(() => parsePaymentRequest({request}), new Error(error), 'Err');

      return end();
    }

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
    strictSame(details.paths, expected.paths, 'Parse blinded paths');
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
