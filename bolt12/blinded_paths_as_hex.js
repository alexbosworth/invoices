const {isPoint} = require('tiny-secp256k1');

const edgeAsHex = require('./edge_as_hex');

const bufferAsHex = buffer => buffer.toString('hex');
const byteAsBuffer = byte => Buffer.from([byte]);
const {concat} = Buffer;
const edgePattern = /^(\d+x\d+x\d+)x([01])$/;
const encryptedDataLengthByteLength = 2;
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const hexByteLength = hex => hex.length / 2;
const {isArray} = Array;
const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const isHexString = n => typeof n === 'string' && isHex(n);
const isPublicKey = n => isString(n) && /^0[23][0-9A-F]{64}$/i.test(n);
const isString = n => typeof n === 'string';
const isValidPoint = key => isPoint(hexAsBuffer(key));
const maxEncryptedDataByteLength = 65535;
const maxHopsCount = 255;
const padHex = (hex, bytes) => hex.padStart(bytes * 2, '0');
const uintAsBuffer = (n, bytes) => hexAsBuffer(uintAsHex(n, bytes));
const uintAsHex = (n, bytes) => padHex(BigInt(n).toString(16), bytes);

/** Encode blinded paths as BOLT 4 blinded path bytes

  The introduction node is referenced either by its public key or by the
  channel edge that leads to it, with the edge direction as the final element.

  {
    paths: [{
      hops: [{
        encrypted_data: <Encrypted Recipient Data Hex String>
        relay_key: <Blinded Relaying Node Public Key Hex String>
      }]
      [introduction_edge]: <Introduction Node Edge Format Channel Id String>
      [introduction_node]: <Introduction Node Public Key Hex String>
      key: <First Hop Path Key Public Key Hex String>
    }]
  }

  @throws
  <Error>

  @returns
  {
    hex: <Encoded Blinded Paths Hex String>
  }
*/
module.exports = ({paths}) => {
  if (!isArray(paths) || !paths.length) {
    throw new Error('ExpectedArrayOfBlindedPathsToEncodeAsHex');
  }

  if (!paths.every(n => !!n && isArray(n.hops) && !!n.hops.length)) {
    throw new Error('ExpectedArrayOfHopsInBlindedPathToEncodeAsHex');
  }

  if (!paths.every(n => n.hops.length <= maxHopsCount)) {
    throw new Error('ExpectedFewerHopsInBlindedPathToEncodeAsHex');
  }

  // The hops of every path are checked together
  const allHops = paths.flatMap(n => n.hops);

  if (!allHops.every(hop => !!hop && !!hop.encrypted_data)) {
    throw new Error('ExpectedHopEncryptedDataInBlindedPathToEncodeAsHex');
  }

  if (!allHops.every(hop => isHexString(hop.encrypted_data))) {
    throw new Error('ExpectedHexHopEncryptedDataInBlindedPathToEncodeAsHex');
  }

  const isDataSizeOk = n => hexByteLength(n) <= maxEncryptedDataByteLength;

  if (!allHops.every(hop => isDataSizeOk(hop.encrypted_data))) {
    throw new Error('ExpectedShorterHopEncryptedDataInBlindedPathToEncode');
  }

  if (!allHops.every(hop => isPublicKey(hop.relay_key))) {
    throw new Error('ExpectedHopRelayKeyInBlindedPathToEncodeAsHex');
  }

  if (!allHops.every(hop => isValidPoint(hop.relay_key))) {
    throw new Error('ExpectedValidHopRelayKeyInBlindedPathToEncodeAsHex');
  }

  // The introduction node is either referenced by key or by channel edge
  if (!paths.every(n => !!n.introduction_edge !== !!n.introduction_node)) {
    throw new Error('ExpectedIntroductionNodeOrEdgeInBlindedPathToEncodeAsHex');
  }

  const edgePaths = paths.filter(n => n.introduction_edge !== undefined);

  if (!edgePaths.every(n => isString(n.introduction_edge))) {
    throw new Error('ExpectedIntroductionEdgeStringInBlindedPathToEncodeAsHex');
  }

  if (!edgePaths.every(n => edgePattern.test(n.introduction_edge))) {
    throw new Error('ExpectedIntroductionEdgeFormatInBlindedPathToEncodeAsHex');
  }

  const nodePaths = paths.filter(n => n.introduction_node !== undefined);

  if (!nodePaths.every(n => isPublicKey(n.introduction_node))) {
    throw new Error('ExpectedIntroductionNodeKeyInBlindedPathToEncodeAsHex');
  }

  if (!nodePaths.every(n => isValidPoint(n.introduction_node))) {
    throw new Error('ExpectedValidIntroductionNodeKeyInBlindedPathToEncode');
  }

  if (!paths.every(n => isPublicKey(n.key))) {
    throw new Error('ExpectedPathKeyInBlindedPathToEncodeAsHex');
  }

  if (!paths.every(n => isValidPoint(n.key))) {
    throw new Error('ExpectedValidPathKeyInBlindedPathToEncodeAsHex');
  }

  // The introduction is referenced by its public key or by a channel edge
  const introductionAsBuffer = path => {
    if (!!path.introduction_edge) {
      const {hex} = edgeAsHex({edge: path.introduction_edge});

      return hexAsBuffer(hex);
    }

    return hexAsBuffer(path.introduction_node);
  };

  const encoded = paths.map(path => {
    const hops = path.hops.map(hop => {
      const dataByteLength = hexByteLength(hop.encrypted_data);

      return concat([
        hexAsBuffer(hop.relay_key),
        uintAsBuffer(dataByteLength, encryptedDataLengthByteLength),
        hexAsBuffer(hop.encrypted_data),
      ]);
    });

    return concat([
      introductionAsBuffer(path),
      hexAsBuffer(path.key),
      byteAsBuffer(path.hops.length),
      concat(hops),
    ]);
  });

  return {hex: bufferAsHex(concat(encoded))};
};
