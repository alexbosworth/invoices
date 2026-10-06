const {rawChanId} = require('bolt07');

const bufferAsHex = buffer => buffer.toString('hex');
const byteAsBuffer = byte => Buffer.from([byte]);
const {concat} = Buffer;
const edgePattern = /^(\d+x\d+x\d+)x([01])$/;
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const isString = n => typeof n === 'string';

/** Encode a channel edge as BOLT 4 blinded path introduction bytes

  An edge is a standard format channel id followed by the direction of the
  introduction node in the channel, for example `1x2x3x1`.

  {
    edge: <Introduction Node Edge Format Channel Id String>
  }

  @throws
  <Error>

  @returns
  {
    hex: <Encoded Introduction Edge Hex String>
  }
*/
module.exports = ({edge}) => {
  if (!edge || !isString(edge)) {
    throw new Error('ExpectedEdgeFormatChannelIdToEncodeAsHex');
  }

  if (!edgePattern.test(edge)) {
    throw new Error('ExpectedChannelIdWithDirectionToEncodeEdgeAsHex');
  }

  const [, channel, direction] = edge.match(edgePattern);

  const {id} = rawChanId({channel});

  // An introduction edge is a direction byte followed by the raw channel id
  const encoded = concat([byteAsBuffer(Number(direction)), hexAsBuffer(id)]);

  return {hex: bufferAsHex(encoded)};
};
