const {featureFlagsAsHex} = require('bolt09');

const {isArray} = Array;
const {isInteger} = Number;
const lengthPrefixHexLength = 4;
const maxFeatureBit = 65535 * 8 - 1;

/** Encode feature bits as a raw feature bit vector

  BOLT 12 feature vectors are raw bytes without a length prefix

  {
    features: [{
      bit: <BOLT 09 Feature Bit Number>
    }]
  }

  @throws
  <Error>

  @returns
  {
    hex: <Feature Bit Vector Hex String>
  }
*/
module.exports = ({features}) => {
  if (!isArray(features)) {
    throw new Error('ExpectedArrayOfFeaturesToEncodeAsHex');
  }

  if (!features.every(n => !!n && isInteger(n.bit) && n.bit >= Number())) {
    throw new Error('ExpectedFeatureBitNumbersToEncodeAsHex');
  }

  // The feature bit vector has a 2 byte length prefix when it is encoded
  if (!features.every(n => n.bit <= maxFeatureBit)) {
    throw new Error('ExpectedFeatureBitWithinMaximumToEncodeAsHex');
  }

  const {encoded} = featureFlagsAsHex({features: features.map(n => n.bit)});

  // The length prefix is not used in the raw feature bit vector
  return {hex: encoded.slice(lengthPrefixHexLength)};
};
