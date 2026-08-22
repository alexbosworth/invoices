const {rawChanId} = require('bolt07');

const unsignedAsBuffer = require('./unsigned_as_buffer');

const baseFeeByteLength = 4;
const bufferAsHex = buffer => buffer.toString('hex');
const cltvDeltaByteLength = 2;
const feeRateByteLength = 4;
const isUnsigned = (n, max) => Number.isInteger(n) && n >= 0 && n <= max;
const maxBaseFeeMtokens = 4294967295;
const maxCltvDelta = 65535;
const maxFeeRate = 4294967295;

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

  if (!isUnsigned(Number(args.base_fee_mtokens), maxBaseFeeMtokens)) {
    throw new Error('ExpectedEncodeableBaseFeeMtokensToConvertHopToHex');
  }

  if (!args.channel) {
    throw new Error('ExpectedChannelToConvertHopToHex');
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

  const encoded = Buffer.concat([
    Buffer.from(args.public_key, 'hex'),
    Buffer.from(rawChanId({channel: args.channel}).id, 'hex'),
    unsignedAsBuffer({number: args.base_fee_mtokens, size: baseFeeByteLength}),
    unsignedAsBuffer({number: args.fee_rate, size: feeRateByteLength}),
    unsignedAsBuffer({number: args.cltv_delta, size: cltvDeltaByteLength}),
  ]);

  return {hex: bufferAsHex(encoded)};
};
