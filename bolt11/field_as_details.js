const {featureFlagsFromWords} = require('bolt09');

const taggedFields = require('./conf/tagged_fields');
const wordsAsBuffer = require('./words_as_buffer');
const wordsAsChainAddress = require('./words_as_chain_address');
const wordsAsHopHints = require('./words_as_hop_hints');
const wordsAsNumber = require('./words_as_number');

const bufferAsHex = buffer => buffer.toString('hex');
const descriptionHashByteLength = 32;
const destinationKeyByteLength = 33;
const paymentHashByteLength = 32;
const paymentIdentifierByteLength = 32;
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
  const field = taggedFields[code];

  // Exit early when field is unknown
  if (!field) {
    return {};
  }

  const feature = Object.keys(taggedFields).reduce((sum, n) => {
    sum[taggedFields[n].label] = taggedFields[n].label;

    return sum;
  },
  {});

  switch (field.label) {
  case feature.description_hash:
    try {
      wordsAsBuffer({trim, words}).toString('hex');
    } catch (err) {
      throw new Error('FailedToParsePaymentRequestDescriptionHash');
    }

    const descriptionHash = wordsAsBuffer({trim, words});

    if (descriptionHash.length !== descriptionHashByteLength) {
      throw new Error('UnexpectedByteLengthOfDescriptionHash');
    }

    return {description_hash: descriptionHash.toString('hex')};

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

    if (wordsAsBuffer({trim, words}).length !== destinationKeyByteLength) {
      throw new Error('UnexpectedByteLengthForDestinationPublicKey');
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

    if (wordsAsBuffer({trim, words}).length !== paymentHashByteLength) {
      throw new Error('UnexpectedByteLengthForPaymentHash');
    }

    return {id: wordsAsBuffer({trim, words}).toString('hex')};

  case feature.payment_identifier:
    try {
      wordsAsBuffer({trim, words});
    } catch (err) {
      throw new Error('FailedToParsePaymentRequestPaymentIdentifier');
    }

    if (wordsAsBuffer({trim, words}).length !== paymentIdentifierByteLength) {
      throw new Error('UnexpectedByteLengthForPaymentIdentifier');
    }

    return {payment: bufferAsHex(wordsAsBuffer({trim, words}))};

  case feature.routing:
    return {path: wordsAsHopHints({words}).hints};

  default:
    return {};
  }
};
