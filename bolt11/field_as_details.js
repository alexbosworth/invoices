const {featureFlagsFromWords} = require('bolt09');

const taggedFields = require('./conf/tagged_fields');
const wordsAsBlindedPath = require('./words_as_blinded_path');
const wordsAsBuffer = require('./words_as_buffer');
const wordsAsChainAddress = require('./words_as_chain_address');
const wordsAsHopHints = require('./words_as_hop_hints');
const wordsAsNumber = require('./words_as_number');

const bufferAsHex = buffer => buffer.toString('hex');
const descriptionHashWordLength = 52;
const destinationKeyWordLength = 53;
const paymentHashWordLength = 52;
const paymentIdentifierWordLength = 52;
const trim = true;

/** Interpret a tagged field as payment request details

  {
    code: <Payment Request Element Code Number>
    network: <Network Name String>
    words: [<Element Word Number>]
  }

  @throws
  <Error>

  @returns
  {
    [blinded_path]: {
      base_fee_mtokens: <Accumulated Base Fee Millitokens String>
      cltv_delta: <Accumulated CLTV Expiry Delta Number>
      features: [{
        bit: <BOLT 09 Feature Bit Number>
        is_required: <Feature Support is Required To Pay Bool>
        type: <Feature Type String>
      }]
      fee_rate: <Accumulated Fee Rate Millitokens Per Million Number>
      hops: [{
        encrypted_data: <Encrypted Recipient Data Hex String>
        relay_key: <Relaying Node Public Key Hex String>
      }]
      introduction_node: <Introduction Node Public Key Hex String>
      key: <First Hop Path Key Public Key Hex String>
      max_htlc_mtokens: <Maximum HTLC Millitokens String>
      min_htlc_mtokens: <Minimum HTLC Millitokens String>
    }
    [chain_address]: <Chain Address String>
    [cltv_delta]: <CLTV Delta Number>
    [description]: <Description String>
    [description_hash]: <Description Hash Hex String>
    [destination]: <Destination Public Key Hex String>
    [expiry_seconds]: <Seconds After Creation Until Soft Expiration Number>
    [features]: [{
      bit: <BOLT 09 Feature Bit Number>
      is_required: <Feature Support is Required To Pay Bool>
      type: <Feature Type String>
    }]
    [id]: <Payment Request Hash String>
    [path]: [{
      [base_fee_mtokens]: <Base Fee Millitokens String>
      [channel]: <Standard Format Channel Id String>
      [cltv_delta]: <Final CLTV Expiration Blocks Delta Number>
      [fee_rate]: <Fee Rate Millitokens Per Million Number>
      public_key: <Forward Edge Public Key Hex String>
    }]
    [payment]: <Payment Identifier Hex Encoded String>
  }
*/
module.exports = ({code, network, words}) => {
  const field = taggedFields[code] || {};

  const feature = Object.keys(taggedFields).reduce((sum, n) => {
    sum[taggedFields[n].label] = taggedFields[n].label;

    return sum;
  },
  {});

  switch (field.label) {
  case feature.blinded_path:
    return {blinded_path: wordsAsBlindedPath({words}).path};

  case feature.description_hash:
    try {
      wordsAsBuffer({trim, words}).toString('hex');
    } catch (err) {
      throw new Error('FailedToParsePaymentRequestDescriptionHash');
    }

    // A description hash field must have the expected data length
    if (words.length !== descriptionHashWordLength) {
      throw new Error('UnexpectedDescriptionHashLengthInPaymentRequest');
    }

    return {description_hash: wordsAsBuffer({trim, words}).toString('hex')};

  case feature.description:
    try {
      return {description: wordsAsBuffer({trim, words}).toString('utf8')};
    } catch (err) {
      throw new Error('InvalidDescriptionInPaymentRequest');
    }

  case feature.destination_public_key:
    try {
      wordsAsBuffer({trim, words});
    } catch (err) {
      throw new Error('FailedToParsePaymentRequestDestinationKey');
    }

    // A destination key field must have the expected data length
    if (words.length !== destinationKeyWordLength) {
      throw new Error('UnexpectedDestinationKeyLengthInPaymentRequest');
    }

    return {destination: bufferAsHex(wordsAsBuffer({trim, words}))};

  case feature.fallback_address:
    try {
      return {
        chain_address: wordsAsChainAddress({network, words}).chain_address,
      };
    } catch (err) {
      throw new Error('FailedToParsePaymentRequestFallbackAddress');
    }

  case feature.expiry:
    return {expiry_seconds: wordsAsNumber({words})};

  case feature.feature_bits:
    return {features: featureFlagsFromWords({words}).features};

  case feature.metadata:
    try {
      return {metadata: bufferAsHex(wordsAsBuffer({trim, words}))};
    } catch (err) {
      throw new Error('FailedToParsePaymentContextualMetadata');
    }

  case feature.min_final_cltv_expiry:
    return {cltv_delta: wordsAsNumber({words})};

  case feature.payment_hash:
    try {
      wordsAsBuffer({trim, words});
    } catch (err) {
      throw new Error('FailedToParsePaymentRequestPaymentHash');
    }

    // A payment hash field must have the expected data length
    if (words.length !== paymentHashWordLength) {
      throw new Error('UnexpectedPaymentHashLengthInPaymentRequest');
    }

    return {id: wordsAsBuffer({trim, words}).toString('hex')};

  case feature.payment_identifier:
    try {
      wordsAsBuffer({trim, words});
    } catch (err) {
      throw new Error('FailedToParsePaymentRequestPaymentIdentifier');
    }

    // A payment identifier field must have the expected data length
    if (words.length !== paymentIdentifierWordLength) {
      throw new Error('UnexpectedPaymentIdentifierLengthInPaymentRequest');
    }

    return {payment: bufferAsHex(wordsAsBuffer({trim, words}))};

  case feature.routing:
    return {path: wordsAsHopHints({words}).hints};
  }

  return {};
};
