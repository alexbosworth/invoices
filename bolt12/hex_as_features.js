const {featureFlagsFromHex} = require('bolt09');

const hexByteLength = hex => hex.length / 2;
const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const isString = n => typeof n === 'string';
const lengthByteLength = 2;
const maxByteLength = 65535;
const padHex = (hex, bytes) => hex.padStart(bytes * 2, '0');
const uintAsHex = (n, bytes) => padHex(BigInt(n).toString(16), bytes);

/** Decode a raw feature bit vector

  BOLT 12 feature vectors are raw bytes without a length prefix

  {
    hex: <Feature Bit Vector Hex String>
  }

  @throws
  <Error>

  @returns
  {
    features: [{
      bit: <BOLT 09 Feature Bit Number>
      is_required: <Feature Support is Required Bool>
      type: <Feature Type String>
    }]
  }
*/
module.exports = ({hex}) => {
  if (!isString(hex) || !isHex(hex)) {
    throw new Error('ExpectedHexEncodedFeatureBitsToDecodeFeatures');
  }

  if (hexByteLength(hex) > maxByteLength) {
    throw new Error('ExpectedFeatureBitsWithinMaximumLengthToDecodeFeatures');
  }

  // The features decoder expects a length prefix before the feature bits
  const prefix = uintAsHex(hexByteLength(hex), lengthByteLength);

  return featureFlagsFromHex({hex: `${prefix}${hex}`});
};
