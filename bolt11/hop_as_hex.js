const {rawChanId} = require('bolt07');
const {isPoint} = require('tiny-secp256k1');

const unsignedAsBuffer = require('./unsigned_as_buffer');

const baseFeeByteLength = 4;
const bufferAsHex = buffer => buffer.toString('hex');
const cltvDeltaByteLength = 2;
const feeRateByteLength = 4;
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const isChannel = n => typeof n === 'string' && /^\d+x\d+x\d+$/.test(n);
const isMtokens = n => typeof n === 'string' && /^\d+$/.test(n);
const isPublicKey = n => typeof n === 'string' && publicKey.test(n);
const isUnsigned = (n, max) => Number.isInteger(n) && n >= 0 && n <= max;
const maxBaseFeeMtokens = 4294967295;
const maxCltvDelta = 65535;
const maxFeeRate = 4294967295;
const publicKey = /^0[23][0-9a-f]{64}$/i;

/** Hop as raw hop hint hex data

  {
    base_fee_mtokens: <Base Fee Millitokens String>
    channel: <Standard Format Channel Id String>
    cltv_delta: <Final CLTV Expiration Blocks Delta Number>
    fee_rate: <Fee Rate Millitokens Per Million Number>
    public_key: <Forward Edge Public Key Hex String>
  }

  @throws
  <Error>

  @returns
  {
    hex: <Raw Hop Encoding Hex String>
  }
*/
module.exports = args => {
  if (!args.base_fee_mtokens) {
    throw new Error('ExpectedBaseFeeMillitokensToConvertHopToHex');
  }

  const baseFee = args.base_fee_mtokens;

  // Only decimal digits are a number of millitokens: 0x10 is not sixteen
  if (!isMtokens(baseFee) || !isUnsigned(Number(baseFee), maxBaseFeeMtokens)) {
    throw new Error('ExpectedEncodeableBaseFeeMtokensToConvertHopToHex');
  }

  if (!args.channel) {
    throw new Error('ExpectedChannelToConvertHopToHex');
  }

  // A channel id that is missing a part would be encoded as a different id
  if (!isChannel(args.channel)) {
    throw new Error('ExpectedStandardFormatChannelToConvertHopToHex');
  }

  if (!args.cltv_delta) {
    throw new Error('ExpectedCltvDeltaToConvertHopToHex');
  }

  if (!isUnsigned(args.cltv_delta, maxCltvDelta)) {
    throw new Error('ExpectedEncodeableCltvDeltaToConvertHopToHex');
  }

  if (args.fee_rate === undefined) {
    throw new Error('ExpectedHopFeeRateToConvertHopToHex');
  }

  if (!isUnsigned(args.fee_rate, maxFeeRate)) {
    throw new Error('ExpectedEncodeableHopFeeRateToConvertHopToHex');
  }

  if (!args.public_key) {
    throw new Error('ExpectedHopPublicKeyToConvertHopToHex');
  }

  // Hex that is not valid would be cut short when it is encoded
  if (!isPublicKey(args.public_key)) {
    throw new Error('ExpectedHexHopPublicKeyToConvertHopToHex');
  }

  // A key that is not a point on the curve cannot be routed through
  if (!isPoint(hexAsBuffer(args.public_key))) {
    throw new Error('ExpectedValidHopPublicKeyToConvertHopToHex');
  }

  const encoded = Buffer.concat([
    hexAsBuffer(args.public_key),
    hexAsBuffer(rawChanId({channel: args.channel}).id),
    unsignedAsBuffer({number: args.base_fee_mtokens, size: baseFeeByteLength}),
    unsignedAsBuffer({number: args.fee_rate, size: feeRateByteLength}),
    unsignedAsBuffer({number: args.cltv_delta, size: cltvDeltaByteLength}),
  ]);

  return {hex: bufferAsHex(encoded)};
};
