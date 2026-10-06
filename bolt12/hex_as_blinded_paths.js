const {chanFormat} = require('bolt07');
const {isPoint} = require('tiny-secp256k1');

const bufferAsHex = buffer => buffer.toString('hex');
const byteAsBuffer = byte => Buffer.from([byte]);
const channelIdByteLength = 8;
const {concat} = Buffer;
const directionByteLength = 1;
const edgeDirections = [0, 1];
const encryptedDataLengthByteLength = 2;
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const hopsCountByteLength = 1;
const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const isString = n => typeof n === 'string';
const minHopsCount = 1;
const pointByteLength = 33;
const pointPrefixes = [2, 3];

/** Decode BOLT 4 blinded path bytes as blinded paths

  The introduction node is either a public key or a reference to a channel
  edge: the channel id with the direction of the node in the channel

  {
    hex: <Encoded Blinded Paths Hex String>
  }

  @throws
  <Error>

  @returns
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
*/
module.exports = ({hex}) => {
  if (!isString(hex) || !isHex(hex)) {
    throw new Error('ExpectedHexEncodedBlindedPathsToDecode');
  }

  const encoded = hexAsBuffer(hex);
  const paths = [];

  const cursor = {offset: Number()};

  // Read a fixed number of bytes off of the encoded data
  const read = (bytes, error) => {
    if (encoded.length < cursor.offset + bytes) {
      throw new Error(error);
    }

    const data = encoded.subarray(cursor.offset, cursor.offset + bytes);

    cursor.offset += bytes;

    return data;
  };

  // Paths are concatenated together, keep reading until the data runs out
  while (cursor.offset < encoded.length) {
    const [prefix] = read(
      directionByteLength,
      'ExpectedIntroductionNodeInBlindedPath'
    );

    const path = {hops: []};

    // A point prefix means the introduction is a public key, else an edge
    if (pointPrefixes.includes(prefix)) {
      const key = concat([
        byteAsBuffer(prefix),
        read(
          pointByteLength - directionByteLength,
          'ExpectedIntroductionNodePublicKeyInBlindedPath'
        ),
      ]);

      if (!isPoint(key)) {
        throw new Error('ExpectedValidIntroductionNodePublicKeyInBlindedPath');
      }

      path.introduction_node = bufferAsHex(key);
    } else if (edgeDirections.includes(prefix)) {
      const id = read(
        channelIdByteLength,
        'ExpectedChannelIdInBlindedPath'
      );

      const {channel} = chanFormat({id: bufferAsHex(id)});

      path.introduction_edge = `${channel}x${prefix}`;
    } else {
      throw new Error('UnexpectedIntroductionNodeEncodingInBlindedPath');
    }

    const key = read(pointByteLength, 'ExpectedPathKeyInBlindedPath');

    if (!isPoint(key)) {
      throw new Error('ExpectedValidPathKeyInBlindedPath');
    }

    path.key = bufferAsHex(key);

    const [hopsCount] = read(
      hopsCountByteLength,
      'ExpectedHopsCountInBlindedPath'
    );

    if (hopsCount < minHopsCount) {
      throw new Error('ExpectedHopsInBlindedPath');
    }

    // Every hop has a blinded node key and length prefixed encrypted data
    [...Array(hopsCount)].forEach(() => {
      const relayKey = read(
        pointByteLength,
        'ExpectedHopPublicKeyInBlindedPath'
      );

      if (!isPoint(relayKey)) {
        throw new Error('ExpectedValidHopPublicKeyInBlindedPath');
      }

      const dataLength = read(
        encryptedDataLengthByteLength,
        'ExpectedEncryptedDataLengthInBlindedPath'
      );

      const data = read(
        dataLength.readUInt16BE(),
        'ExpectedEncryptedDataInBlindedPath'
      );

      path.hops.push({
        encrypted_data: bufferAsHex(data),
        relay_key: bufferAsHex(relayKey),
      });
    });

    paths.push(path);
  }

  return {paths};
};
