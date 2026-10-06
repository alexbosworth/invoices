const {encodeTlvStream} = require('bolt01');

const hexAsRecords = require('./hex_as_records');
const recordRange = require('./record_range');
const signHash = require('./sign_hash');
const types = require('./conf/tlv_types');
const unsignedDetails = require('./unsigned_details');
const verifySignature = require('./verify_signature');

const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const isSignatureType = type => recordRange({type}).range === 'signature';
const isString = n => typeof n === 'string';

/** Add a signature record to an unsigned BOLT 12 TLV stream

  Either a `secret` key to sign with or a `signature` is required

  The signing public key is expected in the record of the key `type`

  {
    encoded: <Unsigned TLV Stream Hex String>
    message: <TLV Stream Message Name String>
    [secret]: <Signing Private Key Hex String>
    [signature]: <BIP 340 Signature Hex String>
    type: <Signing Public Key Record Type Number String>
  }

  @throws
  <Error>

  @returns
  {
    encoded: <Signed TLV Stream Hex String>
  }
*/
module.exports = ({encoded, message, secret, signature, type}) => {
  if (!encoded || !isString(encoded) || !isHex(encoded)) {
    throw new Error('ExpectedHexEncodedUnsignedStreamToSignStream');
  }

  if (!message || !isString(message)) {
    throw new Error('ExpectedMessageNameToSignStream');
  }

  if (!secret && !signature) {
    throw new Error('ExpectedSecretKeyOrSignatureToSignStream');
  }

  if (!!secret && !!signature) {
    throw new Error('UnexpectedSecretKeyAndSignatureToSignStream');
  }

  if (!type || !isString(type)) {
    throw new Error('ExpectedSigningKeyRecordTypeToSignStream');
  }

  const {records} = hexAsRecords({hex: encoded});

  // The unsigned stream should not already have a signature
  if (!!records.filter(n => isSignatureType(n.type)).length) {
    throw new Error('UnexpectedSignatureRecordInUnsignedStreamToSign');
  }

  const key = records.find(n => n.type === type);

  if (!key) {
    throw new Error('ExpectedSigningPublicKeyRecordInStreamToSign');
  }

  const {hash} = unsignedDetails({message, records});

  const signed = !secret ? {signature} : signHash({hash, secret});

  // A secret key must correspond to the signing public key
  if (!!secret && signed.public_key !== key.value) {
    throw new Error('ExpectedSecretKeyForSigningPublicKeyToSignStream');
  }

  const verified = {};

  try {
    verified.signature = verifySignature({
      hash,
      public_key: key.value,
      signature: signed.signature,
    });
  } catch (err) {
    throw new Error('ExpectedValidSignatureEncodingToSignStream');
  }

  if (!verified.signature.is_valid) {
    throw new Error('ExpectedValidSignatureForSigningPublicKeyToSignStream');
  }

  const signedStream = encodeTlvStream({
    records: [].concat(records).concat({
      type: types.signature,
      value: signed.signature.toLowerCase(),
    }),
  });

  return {encoded: signedStream.encoded};
};
