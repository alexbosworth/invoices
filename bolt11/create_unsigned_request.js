const {createHash} = require('crypto');

const {featureFlagsAsWords} = require('bolt09');
const {isPoint} = require('tiny-secp256k1');

const blindedPathAsHex = require('./blinded_path_as_hex');
const chainAddressAsWords = require('./chain_address_as_words');
const currencyCodes = require('./conf/bech32_currency_codes');
const descriptionAsWords = require('./description_as_words');
const hexAsWords = require('./hex_as_words');
const hopAsHex = require('./hop_as_hex');
const isDate = require('./is_date');
const mtokensAsHrp = require('./mtokens_as_hrp');
const numberAsWords = require('./number_as_words');
const padWords = require('./pad_words');
const tagLengthAsWords = require('./tag_length_as_words');
const taggedFields = require('./conf/tagged_fields');
const {textValidity} = require('./../bolt00');
const wordsAsBuffer = require('./words_as_buffer');

const decBase = 10;
const flatten = arr => [].concat(...arr);
const {floor} = Math;
const hashHexLength = 64;
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const {isArray} = Array;
const isHash = n => isHex(n) && n.length === hashHexLength;
const isHex = n => typeof n === 'string' && /^([0-9a-f]{2})*$/i.test(n);
const {isInteger} = Number;
const isKey = n => isHex(n) && keyPattern.test(n) && isPoint(hexAsBuffer(n));
const isPositiveSafeInteger = n => Number.isSafeInteger(n) && n > 0;
const isText = n => textValidity({text: n}).is_writable;
const keyPattern = /^0[23][0-9a-f]{64}$/i;
const {keys} = Object;
const maxDescriptionLen = 639;
const maxFeatureBit = 1023 * 5 - 1;
const maxRequestLength = 7089;
const maxTimestamp = Math.pow(2, 35) - 1;
const msPerSec = 1e3;
const mtokPerTok = 1e3;
const {now} = Date;
const {parse} = Date;
const signedOverheadLength = 1 + 104 + 6;
const timestampWordLength = 7;
const tokensAsMtokens = n => !n ? '0' : (BigInt(n) * BigInt(1e3)).toString();

/** Create an unsigned payment request

`paths` are bLIP 39 blinded paths. If using, omit `destination`, `payment`, and
`routes`

  {
    [chain_addresses]: [<Chain Address String>]
    [cltv_delta]: <Positive CLTV Delta Number>
    [created_at]: <Invoice Creation Date ISO 8601 String>
    [description]: <Description String>
    [description_hash]: <Description Hash Hex String>
    [destination]: <Public Key String>
    [expires_at]: <ISO 8601 Date String>
    features: [{
      bit: <BOLT 09 Feature Bit Number>
    }]
    id: <Preimage SHA256 Hash Hex String>
    [mtokens]: <Requested Milli-Tokens Value String> (can exceed Number limit)
    network: <Network Name String>
    [paths]: [{
      base_fee_mtokens: <Accumulated Base Fee Millitokens String>
      cltv_delta: <Accumulated CLTV Expiry Delta Number>
      [features]: [{
        bit: <BOLT 09 Feature Bit Number>
      }]
      fee_rate: <Accumulated Fee Rate Millitokens Per Million Number>
      hops: [{
        encrypted_data: <Encrypted Recipient Data Hex String>
        relay_key: <Relaying Node Public Key Hex String>
      }]
      [introduction_node]: <Introduction Node Public Key Hex String>
      key: <First Hop Path Key Public Key Hex String>
      max_htlc_mtokens: <Maximum HTLC Millitokens String>
      min_htlc_mtokens: <Minimum HTLC Millitokens String>
    }]
    [payment]: <Payment Identifier Hex String>
    [routes]: [[{
      [base_fee_mtokens]: <Base Fee Millitokens String>
      [channel]: <Standard Format Channel Id String>
      [cltv_delta]: <Final CLTV Expiration Blocks Delta Number>
      [fee_rate]: <Fee Rate Millitokens Per Million Number>
      public_key: <Forward Edge Public Key Hex String>
    }]]
    [tokens]: <Requested Chain Tokens Number> (note: can differ from mtokens)
  }

  @returns
  {
    hash: <Payment Request Signature Hash Hex String>
    hrp: <Human Readable Part of Payment Request String>
    preimage: <Signature Hash Preimage Hex String>
    tags: [<Data Tag Number>]
  }
*/
module.exports = args => {
  const cltvDelta = args.cltv_delta;

  if (cltvDelta !== undefined && !isPositiveSafeInteger(cltvDelta)) {
    throw new Error('ExpectedValidCltvDeltaToEncodePaymentRequest');
  }

  const addresses = args.chain_addresses;

  if (addresses !== undefined && !isArray(addresses)) {
    throw new Error('ExpectedArrayOfChainAddressesToEncodePaymentRequest');
  }

  // An explicit creation date must be a valid ISO 8601 date
  if (args.created_at !== undefined && !isDate(args.created_at)) {
    throw new Error('ExpectedValidCreatedAtDateToEncodePaymentRequest');
  }

  if (args.description === undefined && !args.description_hash) {
    throw new Error('ExpectedPaymentDescriptionOrDescriptionHashForPayReq');
  }

  if (Buffer.byteLength(args.description || '', 'utf8') > maxDescriptionLen) {
    throw new Error('ExpectedPaymentDescriptionWithinDescriptionByteLimit');
  }

  if (!isText(args.description || '')) {
    throw new Error('ExpectedValidUtf8DescriptionToEncodePaymentRequest');
  }

  const descriptionHash = args.description_hash;

  // A request has either a description or a description hash, not both
  if (args.description !== undefined && descriptionHash !== undefined) {
    throw new Error('UnexpectedDescriptionAndHashToEncodePaymentRequest');
  }

  if (descriptionHash !== undefined && !isHash(descriptionHash)) {
    throw new Error('ExpectedValidDescriptionHashToEncodePaymentRequest');
  }

  if (args.destination !== undefined && !isKey(args.destination)) {
    throw new Error('ExpectedValidDestinationKeyToEncodePaymentRequest');
  }

  // An explicit expiration date must be a valid ISO 8601 date
  if (args.expires_at !== undefined && !isDate(args.expires_at)) {
    throw new Error('ExpectedValidExpiresAtDateToEncodePaymentRequest');
  }

  if (!args.id) {
    throw new Error('ExpectedPaymentHashWhenEncodingPaymentRequest');
  }

  // Hex that is not valid would be cut short when it is encoded
  if (!isHash(args.id)) {
    throw new Error('ExpectedValidPaymentHashToEncodePaymentRequest');
  }

  if (args.features !== undefined && !isArray(args.features)) {
    throw new Error('ExpectedArrayOfFeaturesToEncodePaymentRequest');
  }

  const features = args.features || [];

  if (!features.every(n => !!n && isInteger(n.bit) && n.bit >= Number())) {
    throw new Error('ExpectedFeatureBitNumbersToEncodePaymentRequest');
  }

  // A tagged field holds up to 1023 words that each have 5 feature bits
  if (!features.every(n => n.bit <= maxFeatureBit)) {
    throw new Error('ExpectedFeatureBitWithinMaximumToEncodePaymentRequest');
  }

  const {metadata} = args;

  if (metadata !== undefined && (!metadata || !isHex(metadata))) {
    throw new Error('ExpectedHexMetadataToEncodePaymentRequest');
  }

  if (args.paths !== undefined && !isArray(args.paths)) {
    throw new Error('ExpectedArrayOfBlindedPathsToEncodePaymentRequest');
  }

  // Blinded paths replace route hints, a request cannot have both
  if (!!args.paths && !!args.routes) {
    throw new Error('UnexpectedRoutesAndBlindedPathsInPaymentRequest');
  }

  // A path id in the encrypted data replaces the payment identifier
  if (!!args.paths && !!args.payment) {
    throw new Error('UnexpectedPaymentIdAndBlindedPathsInPaymentRequest');
  }

  if (args.payment !== undefined && !isHash(args.payment)) {
    throw new Error('ExpectedValidPaymentIdentifierToEncodePaymentRequest');
  }

  const isRoutes = n => isArray(n) && n.every(route => isArray(route));

  if (args.routes !== undefined && !isRoutes(args.routes)) {
    throw new Error('ExpectedArrayOfRoutesToEncodePaymentRequest');
  }

  const createdAtMs = !args.created_at ? now() : parse(args.created_at);

  const createdAt = floor(createdAtMs / msPerSec);

  // The timestamp is 35 bits of seconds: from 1970 until late in 3058
  if (createdAt < Number() || createdAt > maxTimestamp) {
    throw new Error('ExpectedCreatedAtDateWithinRangeToEncodePaymentRequest');
  }

  const expirySeconds = args.expires_at === undefined ?
    undefined : floor(parse(args.expires_at) / msPerSec) - createdAt;

  // The expiry is encoded as seconds after the creation date, zero is expired
  if (expirySeconds !== undefined && expirySeconds <= 0) {
    throw new Error('ExpectedExpiresAtAfterCreatedAtToEncodePaymentRequest');
  }

  const currencyPrefix = keys(currencyCodes)
    .map(code => ({code, network: currencyCodes[code]}))
    .find(({network}) => network === args.network);

  if (!currencyPrefix) {
    throw new Error('ExpectedKnownNetworkToEncodePaymentRequest');
  }

  const timestamp = numberAsWords({number: createdAt}).words;

  // The timestamp has a fixed length: an early date has leading zero words
  const {words: createdAtWords} = padWords({
    word_count: timestampWordLength,
    words: timestamp,
  });

  const mtokens = args.mtokens || tokensAsMtokens(args.tokens);

  const hrp = `ln${currencyPrefix.code}${mtokensAsHrp({mtokens}).hrp}`;

  const fieldWords = flatten(keys(taggedFields).map(field => {
    switch (taggedFields[field].label) {
    case 'blinded_path':
      if (!args.paths) {
        return {};
      }

      return args.paths.map(path => ({
        field,
        words: hexAsWords({hex: blindedPathAsHex(path).hex}).words,
      }));

    case 'description':
      return {
        field,
        words: descriptionAsWords({description: args.description}).words,
      }

    case 'description_hash':
      if (!args.description_hash) {
        return {};
      }

      return {
        field,
        words: hexAsWords({hex: args.description_hash}).words,
      };

    case 'destination_public_key':
      return {
        field,
        words: hexAsWords({hex: args.destination}).words,
      };

    case 'expiry':
      if (expirySeconds === undefined) {
        return {};
      }

      return {
        field,
        words: numberAsWords({number: expirySeconds}).words,
      };

    case 'feature_bits':
      // The features field is left out when there are no feature bits to set
      if (!features.length) {
        return {};
      }

      const bits = features.map(n => n.bit);

      return {
        field,
        words: featureFlagsAsWords({features: bits}).words,
      };

    case 'fallback_address':
      if (!args.chain_addresses) {
        return {};
      }

      return args.chain_addresses.map(address => ({
        field,
        words: chainAddressAsWords({address, network: args.network}).words,
      }));

    case 'metadata':
      if (!args.metadata) {
        return {};
      }

      return {
        field,
        words: hexAsWords({hex: args.metadata}).words,
      };

    case 'min_final_cltv_expiry':
      if (cltvDelta === undefined) {
        return {};
      }

      return {
        field,
        words: numberAsWords({number: cltvDelta}).words,
      };

    case 'payment_hash':
      return {
        field,
        words: hexAsWords({hex: args.id}).words,
      };

    case 'payment_identifier':
      if (!args.payment) {
        return {};
      }

      return {
        field,
        words: hexAsWords({hex: args.payment}).words,
      };

    case 'routing':
      if (!args.routes) {
        return {};
      }

      return args.routes.map(route => {
        let pubKeyCursor;

        const paths = route.map(hop => {
          if (!hop.channel) {
            pubKeyCursor = hop.public_key;

            return;
          }

          const {hex} = hopAsHex({
            base_fee_mtokens: hop.base_fee_mtokens,
            channel: hop.channel,
            cltv_delta: hop.cltv_delta,
            fee_rate: hop.fee_rate,
            public_key: pubKeyCursor,
          });

          pubKeyCursor = hop.public_key;

          return hex;
        });

        const {words} = hexAsWords({hex: paths.filter(n => !!n).join('')});

        return {field, words};
      });
    }

    throw new Error('UnexpectedTaggedFieldType');
  }));

  const tagWords = fieldWords.filter(n => !!n.words).map(({field, words}) => {
    const sizeWords = tagLengthAsWords(words.length);
    const typeWord = [parseInt(field, decBase)];

    return [].concat(typeWord).concat(sizeWords).concat(words);
  });

  const allTags = flatten(createdAtWords.concat(tagWords));

  // Signing adds a separator, 104 signature words and a 6 character checksum
  const signedLength = hrp.length + allTags.length + signedOverheadLength;

  // A request that would be over the limit when signed is refused up front
  if (signedLength > maxRequestLength) {
    throw new Error('ExpectedLengthWithinLimitToEncodePaymentRequest');
  }

  const preimage = Buffer.concat([
    Buffer.from(hrp, 'ascii'),
    wordsAsBuffer({words: allTags}),
  ]);

  const hash = createHash('sha256').update(preimage).digest().toString('hex');

  return {hash, hrp, preimage: preimage.toString('hex'), tags: allTags};
};
