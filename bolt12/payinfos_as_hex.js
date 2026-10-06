const {featureFlagsAsHex} = require('bolt09');

const baseFeeByteLength = 4;
const bufferAsHex = buffer => buffer.toString('hex');
const cltvDeltaByteLength = 2;
const {concat} = Buffer;
const feeRateByteLength = 4;
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const htlcMtokensByteLength = 8;
const {isArray} = Array;
const isBitInRange = n => n.bit <= maxFeatureBit;
const {isInteger} = Number;
const isMtokens = n => typeof n === 'string' && /^\d+$/.test(n);
const isUnsigned = (n, max) => isInteger(n) && n >= 0 && n <= max;
const maxBaseFeeMtokens = BigInt(4294967295);
const maxCltvDelta = 65535;
const maxFeatureBit = 65535 * 8 - 1;
const maxFeeRate = 4294967295;
const maxHtlcMtokens = BigInt('18446744073709551615');
const padHex = (hex, bytes) => hex.padStart(bytes * 2, '0');
const uintAsBuffer = (n, bytes) => hexAsBuffer(uintAsHex(n, bytes));
const uintAsHex = (n, bytes) => padHex(BigInt(n).toString(16), bytes);

/** Encode blinded payment info as BOLT 12 blinded payinfo bytes

  {
    payinfos: [{
      base_fee_mtokens: <Accumulated Base Fee Millitokens String>
      cltv_delta: <Accumulated CLTV Expiry Delta Number>
      [features]: [{
        bit: <BOLT 09 Feature Bit Number>
      }]
      fee_rate: <Accumulated Fee Rate Millitokens Per Million Number>
      max_htlc_mtokens: <Maximum HTLC Millitokens String>
      min_htlc_mtokens: <Minimum HTLC Millitokens String>
    }]
  }

  @throws
  <Error>

  @returns
  {
    hex: <Encoded Blinded Payinfos Hex String>
  }
*/
module.exports = ({payinfos}) => {
  if (!isArray(payinfos) || !payinfos.length) {
    throw new Error('ExpectedArrayOfBlindedPayinfosToEncodeAsHex');
  }

  if (!payinfos.every(n => !!n && isMtokens(n.base_fee_mtokens))) {
    throw new Error('ExpectedBaseFeeMillitokensInBlindedPayinfoToEncode');
  }

  const isBaseFeeOk = n => BigInt(n.base_fee_mtokens) <= maxBaseFeeMtokens;

  if (!payinfos.every(isBaseFeeOk)) {
    throw new Error('ExpectedEncodeableBaseFeeInBlindedPayinfoToEncode');
  }

  if (!payinfos.every(n => isUnsigned(n.cltv_delta, maxCltvDelta))) {
    throw new Error('ExpectedEncodeableCltvDeltaInBlindedPayinfoToEncode');
  }

  const isFeaturesOk = n => n.features === undefined || isArray(n.features);

  if (!payinfos.every(isFeaturesOk)) {
    throw new Error('ExpectedArrayOfFeaturesInBlindedPayinfoToEncode');
  }

  const isBit = n => !!n && isInteger(n.bit) && n.bit >= Number();

  if (!payinfos.every(n => (n.features || []).every(isBit))) {
    throw new Error('ExpectedFeatureBitsInBlindedPayinfoToEncode');
  }

  // The features length is a 2 byte number
  if (!payinfos.every(n => (n.features || []).every(isBitInRange))) {
    throw new Error('ExpectedFeatureBitWithinMaximumInBlindedPayinfoToEncode');
  }

  if (!payinfos.every(n => isUnsigned(n.fee_rate, maxFeeRate))) {
    throw new Error('ExpectedEncodeableFeeRateInBlindedPayinfoToEncode');
  }

  if (!payinfos.every(n => isMtokens(n.max_htlc_mtokens))) {
    throw new Error('ExpectedMaxHtlcMillitokensInBlindedPayinfoToEncode');
  }

  if (!payinfos.every(n => BigInt(n.max_htlc_mtokens) <= maxHtlcMtokens)) {
    throw new Error('ExpectedEncodeableMaxHtlcInBlindedPayinfoToEncode');
  }

  if (!payinfos.every(n => isMtokens(n.min_htlc_mtokens))) {
    throw new Error('ExpectedMinHtlcMillitokensInBlindedPayinfoToEncode');
  }

  if (!payinfos.every(n => BigInt(n.min_htlc_mtokens) <= maxHtlcMtokens)) {
    throw new Error('ExpectedEncodeableMinHtlcInBlindedPayinfoToEncode');
  }

  const encoded = payinfos.map(payinfo => {
    // The features bit vector is prefixed with its byte length
    const features = featureFlagsAsHex({
      features: (payinfo.features || []).map(n => n.bit),
    });

    return concat([
      uintAsBuffer(payinfo.base_fee_mtokens, baseFeeByteLength),
      uintAsBuffer(payinfo.fee_rate, feeRateByteLength),
      uintAsBuffer(payinfo.cltv_delta, cltvDeltaByteLength),
      uintAsBuffer(payinfo.min_htlc_mtokens, htlcMtokensByteLength),
      uintAsBuffer(payinfo.max_htlc_mtokens, htlcMtokensByteLength),
      hexAsBuffer(features.encoded),
    ]);
  });

  return {hex: bufferAsHex(concat(encoded))};
};
