const {randomBytes} = require('crypto');

const {isPrivate} = require('tiny-secp256k1');
const {pointFromScalar} = require('tiny-secp256k1');
const {sign} = require('tiny-secp256k1');

const bufferAsHex = buffer => buffer.toString('hex');
const hashByteLength = 32;
const {isBuffer} = Buffer;
const privateKeyByteLength = 32;

/** Sign a hash with a random ephemeral key

  {
    hash: <Hash To Sign Buffer Object>
  }

  @throws
  <Error>

  @returns
  {
    public_key: <Ephemeral Signing Public Key Hex String>
    signature: <Hash Signature Hex String>
  }
*/
module.exports = ({hash}) => {
  if (!isBuffer(hash) || hash.length !== hashByteLength) {
    throw new Error('ExpectedHashToSignWithEphemeralKey');
  }

  const key = {};

  // Random bytes have a negligible chance of being outside the key range
  do {
    key.secret = randomBytes(privateKeyByteLength);
  } while (!isPrivate(key.secret));

  return {
    public_key: bufferAsHex(Buffer.from(pointFromScalar(key.secret, true))),
    signature: bufferAsHex(Buffer.from(sign(hash, key.secret))),
  };
};
