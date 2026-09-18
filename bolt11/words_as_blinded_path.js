const {decodeBigSize} = require('bolt01');
const {featureFlagsFromHex} = require('bolt09');
const {isPoint} = require('tiny-secp256k1');

const wordsAsBuffer = require('./words_as_buffer');

const bufferAsHex = buffer => buffer.toString('hex');
const {isArray} = Array;
const lengthBaseFeeBytes = 4;
const lengthCltvDeltaBytes = 2;
const lengthFeaturesLengthBytes = 2;
const lengthFeeRateBytes = 4;
const lengthHopsCountBytes = 1;
const lengthMaxHtlcBytes = 8;
const lengthMinHtlcBytes = 8;
const lengthPointBytes = 33;
const minHopsCount = 1;
const trim = true;

/** Words as a blinded path

  {
    words: [<Bech 32 Word Number>]
  }

  @throws
  <Error>

  @returns
  {
    path: {
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
  }
*/
module.exports = ({words}) => {
  if (!isArray(words)) {
    throw new Error('ExpectedWordsToInterpretAsBlindedPath');
  }

  const encoded = wordsAsBuffer({trim, words});

  // The payinfo starts with fixed length policy values and a features length
  const baseFeeEnd = lengthBaseFeeBytes;
  const feeRateEnd = baseFeeEnd + lengthFeeRateBytes;
  const cltvDeltaEnd = feeRateEnd + lengthCltvDeltaBytes;
  const minHtlcEnd = cltvDeltaEnd + lengthMinHtlcBytes;
  const maxHtlcEnd = minHtlcEnd + lengthMaxHtlcBytes;
  const featuresLengthEnd = maxHtlcEnd + lengthFeaturesLengthBytes;

  if (encoded.length < featuresLengthEnd) {
    throw new Error('ExpectedPaymentInfoInBlindedPath');
  }

  // The features bit vector is prefixed by its byte length
  const featuresEnd = featuresLengthEnd + encoded.readUInt16BE(maxHtlcEnd);

  if (encoded.length < featuresEnd) {
    throw new Error('ExpectedFeaturesInBlindedPath');
  }

  const keyEnd = featuresEnd + lengthPointBytes;
  const hopsCountEnd = keyEnd + lengthHopsCountBytes;

  if (encoded.length < hopsCountEnd) {
    throw new Error('ExpectedPathKeyInBlindedPath');
  }

  const key = encoded.subarray(featuresEnd, keyEnd);

  if (!isPoint(key)) {
    throw new Error('ExpectedValidPathKeyInBlindedPath');
  }

  const hopsCount = encoded[keyEnd];

  if (hopsCount < minHopsCount) {
    throw new Error('ExpectedHopsInBlindedPath');
  }

  const cursor = {offset: hopsCountEnd};

  // Every hop has a relaying key and BigSize length prefixed encrypted data
  const hops = [...Array(hopsCount)].map(() => {
    const relayKeyEnd = cursor.offset + lengthPointBytes;

    if (encoded.length < relayKeyEnd) {
      throw new Error('ExpectedHopPublicKeyInBlindedPath');
    }

    const relayKey = encoded.subarray(cursor.offset, relayKeyEnd);

    if (!isPoint(relayKey)) {
      throw new Error('ExpectedValidHopPublicKeyInBlindedPath');
    }

    const dataLength = {};

    try {
      const bigSize = decodeBigSize({
        encoded: bufferAsHex(encoded.subarray(relayKeyEnd)),
      });

      dataLength.bytes = Number(bigSize.decoded);
      dataLength.length = bigSize.length;
    } catch (err) {
      throw new Error('ExpectedEncryptedDataLengthInBlindedPath');
    }

    const dataStart = relayKeyEnd + dataLength.length;
    const dataEnd = dataStart + dataLength.bytes;

    if (encoded.length < dataEnd) {
      throw new Error('ExpectedEncryptedDataInBlindedPath');
    }

    cursor.offset = dataEnd;

    return {
      encrypted_data: bufferAsHex(encoded.subarray(dataStart, dataEnd)),
      relay_key: bufferAsHex(relayKey),
    };
  });

  // There should not be any data beyond the hops of the path
  if (cursor.offset !== encoded.length) {
    throw new Error('UnexpectedTrailingBytesInBlindedPath');
  }

  const features = featureFlagsFromHex({
    hex: bufferAsHex(encoded.subarray(maxHtlcEnd, featuresEnd)),
  });

  // The first hop is the introduction node, referenced by its unblinded key
  const [introduction] = hops;

  return {
    path: {
      hops,
      base_fee_mtokens: encoded.readUInt32BE(Number()).toString(),
      cltv_delta: encoded.readUInt16BE(feeRateEnd),
      features: features.features,
      fee_rate: encoded.readUInt32BE(baseFeeEnd),
      introduction_node: introduction.relay_key,
      key: bufferAsHex(key),
      max_htlc_mtokens: encoded.readBigUInt64BE(minHtlcEnd).toString(),
      min_htlc_mtokens: encoded.readBigUInt64BE(cltvDeltaEnd).toString(),
    },
  };
};
