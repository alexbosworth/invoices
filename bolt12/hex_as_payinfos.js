const hexAsFeatures = require('./hex_as_features');

const baseFeeByteLength = 4;
const bufferAsHex = buffer => buffer.toString('hex');
const cltvDeltaByteLength = 2;
const featuresLengthByteLength = 2;
const feeRateByteLength = 4;
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const htlcMtokensByteLength = 8;
const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const isString = n => typeof n === 'string';

/** Decode BOLT 12 blinded payinfo bytes as blinded payment info

  {
    hex: <Encoded Blinded Payinfos Hex String>
  }

  @throws
  <Error>

  @returns
  {
    payinfos: [{
      base_fee_mtokens: <Accumulated Base Fee Millitokens String>
      cltv_delta: <Accumulated CLTV Expiry Delta Number>
      features: [{
        bit: <BOLT 09 Feature Bit Number>
        is_required: <Feature Support is Required To Pay Bool>
        type: <Feature Type String>
      }]
      fee_rate: <Accumulated Fee Rate Millitokens Per Million Number>
      max_htlc_mtokens: <Maximum HTLC Millitokens String>
      min_htlc_mtokens: <Minimum HTLC Millitokens String>
    }]
  }
*/
module.exports = ({hex}) => {
  if (!isString(hex) || !isHex(hex)) {
    throw new Error('ExpectedHexEncodedBlindedPayinfosToDecode');
  }

  const encoded = hexAsBuffer(hex);
  const payinfos = [];

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

  // Payinfos are concatenated together, keep reading until data runs out
  while (cursor.offset < encoded.length) {
    const baseFee = read(
      baseFeeByteLength,
      'ExpectedBaseFeeInBlindedPayinfo'
    );

    const feeRate = read(
      feeRateByteLength,
      'ExpectedFeeRateInBlindedPayinfo'
    );

    const cltv = read(
      cltvDeltaByteLength,
      'ExpectedCltvDeltaInBlindedPayinfo'
    );

    const minHtlc = read(
      htlcMtokensByteLength,
      'ExpectedMinHtlcInPayinfo'
    );

    const maxHtlc = read(
      htlcMtokensByteLength,
      'ExpectedMaxHtlcInPayinfo'
    );

    // The features bit vector is prefixed by its byte length
    const featuresLength = read(
      featuresLengthByteLength,
      'ExpectedFeaturesLengthInBlindedPayinfo'
    );

    const featureBits = read(
      featuresLength.readUInt16BE(),
      'ExpectedFeaturesInBlindedPayinfo'
    );

    const {features} = hexAsFeatures({hex: bufferAsHex(featureBits)});

    payinfos.push({
      features,
      base_fee_mtokens: baseFee.readUInt32BE().toString(),
      cltv_delta: cltv.readUInt16BE(),
      fee_rate: feeRate.readUInt32BE(),
      max_htlc_mtokens: maxHtlc.readBigUInt64BE().toString(),
      min_htlc_mtokens: minHtlc.readBigUInt64BE().toString(),
    });
  }

  return {payinfos};
};
