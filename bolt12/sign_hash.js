const {randomBytes} = require('crypto');

const {isPrivate} = require('tiny-secp256k1');
const {pointFromScalar} = require('tiny-secp256k1');
const {signSchnorr} = require('tiny-secp256k1');

const auxiliaryByteLength = 32;
const bufferAsHex = buffer => buffer.toString('hex');
const hashByteLength = 32;
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const hexByteLength = hex => hex.length / 2;
const isCompressed = true;
const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const isString = n => typeof n === 'string';
const secretByteLength = 32;

/** Sign a hash with a BIP 340 Schnorr signature

  {
    hash: <Hash To Sign Hex String>
    secret: <Signing Private Key Hex String>
  }

  @throws
  <Error>

  @returns
  {
    public_key: <Signing Public Key Hex String>
    signature: <BIP 340 Signature Hex String>
  }
*/
module.exports = ({hash, secret}) => {
  if (!isString(hash) || !isHex(hash)) {
    throw new Error('ExpectedHexEncodedHashToSignWithSchnorrSignature');
  }

  if (hexByteLength(hash) !== hashByteLength) {
    throw new Error('ExpectedHashByteLengthToSignWithSchnorrSignature');
  }

  if (!isString(secret) || !isHex(secret)) {
    throw new Error('ExpectedHexEncodedSecretKeyToSignHash');
  }

  if (hexByteLength(secret) !== secretByteLength) {
    throw new Error('ExpectedSecretKeyByteLengthToSignHash');
  }

  if (!isPrivate(hexAsBuffer(secret))) {
    throw new Error('ExpectedValidSecretKeyToSignHash');
  }

  const key = hexAsBuffer(secret);

  // Auxiliary random data protects the signature against fault attacks
  const signature = signSchnorr(
    hexAsBuffer(hash),
    key,
    randomBytes(auxiliaryByteLength)
  );

  const publicKey = pointFromScalar(key, isCompressed);

  return {
    public_key: bufferAsHex(Buffer.from(publicKey)),
    signature: bufferAsHex(Buffer.from(signature)),
  };
};
