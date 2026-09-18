const {encodeBigSize} = require('bolt01');
const {featureFlagsAsHex} = require('bolt09');
const {isPoint} = require('tiny-secp256k1');

const unsignedAsBuffer = require('./unsigned_as_buffer');

const baseFeeByteLength = 4;
const bufferAsHex = buffer => buffer.toString('hex');
const byteLength = hex => hex.length / 2;
const cltvDeltaByteLength = 2;
const {concat} = Buffer;
const feeRateByteLength = 4;
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const hopsCountByteLength = 1;
const htlcMtokensByteLength = 8;
const {isArray} = Array;
const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const {isInteger} = Number;
const isHexString = n => typeof n === 'string' && isHex(n);
const isMtokens = n => typeof n === 'string' && /^\d+$/.test(n);
const isUnsigned = (n, max) => isInteger(n) && n >= 0 && n <= max;
const maxBaseFeeMtokens = BigInt(4294967295);
const maxCltvDelta = 65535;
const maxFeeRate = 4294967295;
const maxHopsCount = 255;
const maxHtlcMtokens = BigInt('18446744073709551615');
const maxPathByteLength = 639;
const pointByteLength = 33;

const isPublicKey = n => isHexString(n) && byteLength(n) === pointByteLength;

/** Blinded path as raw bLIP 39 blinded payinfo hex data

  The unblinded introduction node public key is encoded as the relay key of
  the first hop. When `introduction_node` is given it is encoded in place of
  the first hop `relay_key`, which allows for a first hop with a blinded key.

  {
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
  }

  @throws
  <Error>

  @returns
  {
    hex: <Raw Blinded Path Encoding Hex String>
  }
*/
module.exports = args => {
  if (!isMtokens(args.base_fee_mtokens)) {
    throw new Error('ExpectedBaseFeeMillitokensToConvertBlindedPathToHex');
  }

  if (BigInt(args.base_fee_mtokens) > maxBaseFeeMtokens) {
    throw new Error('ExpectedEncodeableBaseFeeToConvertBlindedPathToHex');
  }

  if (args.cltv_delta === undefined) {
    throw new Error('ExpectedCltvDeltaToConvertBlindedPathToHex');
  }

  if (!isUnsigned(args.cltv_delta, maxCltvDelta)) {
    throw new Error('ExpectedEncodeableCltvDeltaToConvertBlindedPathToHex');
  }

  if (args.features !== undefined && !isArray(args.features)) {
    throw new Error('ExpectedArrayOfFeaturesToConvertBlindedPathToHex');
  }

  if (!!args.features && !args.features.every(n => !!n && isInteger(n.bit))) {
    throw new Error('ExpectedFeatureBitsToConvertBlindedPathToHex');
  }

  if (args.fee_rate === undefined) {
    throw new Error('ExpectedFeeRateToConvertBlindedPathToHex');
  }

  if (!isUnsigned(args.fee_rate, maxFeeRate)) {
    throw new Error('ExpectedEncodeableFeeRateToConvertBlindedPathToHex');
  }

  if (!isArray(args.hops) || !args.hops.length) {
    throw new Error('ExpectedArrayOfHopsToConvertBlindedPathToHex');
  }

  // The count of hops is encoded in a single byte
  if (args.hops.length > maxHopsCount) {
    throw new Error('ExpectedFewerHopsToConvertBlindedPathToHex');
  }

  if (!args.hops.every(n => !!n && !!n.encrypted_data)) {
    throw new Error('ExpectedHopEncryptedDataToConvertBlindedPathToHex');
  }

  if (!args.hops.every(n => isHexString(n.encrypted_data))) {
    throw new Error('ExpectedHexHopEncryptedDataToConvertBlindedPathToHex');
  }

  if (!args.hops.every(n => isPublicKey(n.relay_key))) {
    throw new Error('ExpectedHopRelayKeyToConvertBlindedPathToHex');
  }

  if (!args.hops.every(n => isPoint(hexAsBuffer(n.relay_key)))) {
    throw new Error('ExpectedValidHopRelayKeyToConvertBlindedPathToHex');
  }

  if (args.introduction_node !== undefined) {
    if (!isPublicKey(args.introduction_node)) {
      throw new Error('ExpectedIntroductionNodeKeyToConvertBlindedPathToHex');
    }

    if (!isPoint(hexAsBuffer(args.introduction_node))) {
      throw new Error('ExpectedValidIntroductionNodeToConvertBlindedPathToHex');
    }
  }

  if (!isPublicKey(args.key)) {
    throw new Error('ExpectedPathKeyToConvertBlindedPathToHex');
  }

  if (!isPoint(hexAsBuffer(args.key))) {
    throw new Error('ExpectedValidPathKeyToConvertBlindedPathToHex');
  }

  if (!isMtokens(args.max_htlc_mtokens)) {
    throw new Error('ExpectedMaxHtlcMillitokensToConvertBlindedPathToHex');
  }

  if (BigInt(args.max_htlc_mtokens) > maxHtlcMtokens) {
    throw new Error('ExpectedEncodeableMaxHtlcToConvertBlindedPathToHex');
  }

  if (!isMtokens(args.min_htlc_mtokens)) {
    throw new Error('ExpectedMinHtlcMillitokensToConvertBlindedPathToHex');
  }

  if (BigInt(args.min_htlc_mtokens) > maxHtlcMtokens) {
    throw new Error('ExpectedEncodeableMinHtlcToConvertBlindedPathToHex');
  }

  // HTLC millitoken limits are encoded as big endian unsigned 64 bit numbers
  const htlcMtokensAsBuffer = mtokens => {
    const encoded = Buffer.alloc(htlcMtokensByteLength);

    encoded.writeBigUInt64BE(BigInt(mtokens));

    return encoded;
  };

  // The features bit vector is prefixed with its byte length
  const features = featureFlagsAsHex({
    features: (args.features || []).map(n => n.bit),
  });

  // The introduction node key takes the place of the first hop relay key
  const [introduction] = args.hops;

  const relayKeys = args.hops.map(hop => {
    return hop === introduction && !!args.introduction_node ?
      args.introduction_node : hop.relay_key;
  });

  // Every hop has a relaying key and BigSize length prefixed encrypted data
  const hops = args.hops.map((hop, i) => {
    const size = encodeBigSize({number: `${byteLength(hop.encrypted_data)}`});

    return concat([
      hexAsBuffer(relayKeys[i]),
      hexAsBuffer(size.encoded),
      hexAsBuffer(hop.encrypted_data),
    ]);
  });

  const encoded = concat([
    unsignedAsBuffer({number: args.base_fee_mtokens, size: baseFeeByteLength}),
    unsignedAsBuffer({number: args.fee_rate, size: feeRateByteLength}),
    unsignedAsBuffer({number: args.cltv_delta, size: cltvDeltaByteLength}),
    htlcMtokensAsBuffer(args.min_htlc_mtokens),
    htlcMtokensAsBuffer(args.max_htlc_mtokens),
    hexAsBuffer(features.encoded),
    hexAsBuffer(args.key),
    unsignedAsBuffer({number: args.hops.length, size: hopsCountByteLength}),
    concat(hops),
  ]);

  // A tagged field data length limits a path to fit within 1023 words
  if (encoded.length > maxPathByteLength) {
    throw new Error('ExpectedBlindedPathWithinDataLengthLimitToConvertToHex');
  }

  return {hex: bufferAsHex(encoded)};
};
