const {isPoint} = require('tiny-secp256k1');
const {verifySchnorr} = require('tiny-secp256k1');

const hashByteLength = 32;
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const hexByteLength = hex => hex.length / 2;
const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const isString = n => typeof n === 'string';
const pointByteLength = 33;
const signatureByteLength = 64;
const xOnlyStart = 1;

/** Verify a BIP 340 Schnorr signature over a hash

  The signature is checked against the x-only form of the public key

  {
    hash: <Signed Hash Hex String>
    public_key: <Signing Public Key Hex String>
    signature: <BIP 340 Signature Hex String>
  }

  @throws
  <Error>

  @returns
  {
    is_valid: <Signature Is Valid Bool>
  }
*/
module.exports = args => {
  if (!isString(args.hash) || !isHex(args.hash)) {
    throw new Error('ExpectedHexEncodedHashToVerifySignature');
  }

  if (hexByteLength(args.hash) !== hashByteLength) {
    throw new Error('ExpectedHashByteLengthToVerifySignature');
  }

  if (!isString(args.public_key) || !isHex(args.public_key)) {
    throw new Error('ExpectedHexEncodedPublicKeyToVerifySignature');
  }

  if (hexByteLength(args.public_key) !== pointByteLength) {
    throw new Error('ExpectedCompressedPublicKeyToVerifySignature');
  }

  if (!isPoint(hexAsBuffer(args.public_key))) {
    throw new Error('ExpectedValidPublicKeyToVerifySignature');
  }

  if (!isString(args.signature) || !isHex(args.signature)) {
    throw new Error('ExpectedHexEncodedSignatureToVerifySignature');
  }

  if (hexByteLength(args.signature) !== signatureByteLength) {
    throw new Error('ExpectedSignatureByteLengthToVerifySignature');
  }

  const isValid = verifySchnorr(
    hexAsBuffer(args.hash),
    hexAsBuffer(args.public_key).subarray(xOnlyStart),
    hexAsBuffer(args.signature)
  );

  return {is_valid: isValid};
};
