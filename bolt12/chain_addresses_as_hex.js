const addressAsProgram = require('./address_as_program');
const networks = require('./conf/networks');

const bufferAsHex = buffer => buffer.toString('hex');
const byteAsBuffer = byte => Buffer.from([byte]);
const {concat} = Buffer;
const {hasOwn} = Object;
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const hexByteLength = hex => hex.length / 2;
const {isArray} = Array;
const isString = n => typeof n === 'string';
const padHex = (hex, bytes) => hex.padStart(bytes * 2, '0');
const programLengthByteLength = 2;
const uintAsBuffer = (n, bytes) => hexAsBuffer(uintAsHex(n, bytes));
const uintAsHex = (n, bytes) => padHex(BigInt(n).toString(16), bytes);

/** Encode chain addresses as BOLT 12 fallback address bytes

  Only bech32 encoded witness program addresses can be encoded as fallbacks

  {
    chain_addresses: [<Chain Address String>]
    network: <Network Name String>
  }

  @throws
  <Error>

  @returns
  {
    hex: <Encoded Fallback Addresses Hex String>
  }
*/
module.exports = args => {
  if (!isArray(args.chain_addresses) || !args.chain_addresses.length) {
    throw new Error('ExpectedArrayOfChainAddressesToEncodeAsFallbacks');
  }

  if (!args.chain_addresses.every(n => !!n && isString(n))) {
    throw new Error('ExpectedChainAddressStringsToEncodeAsFallbacks');
  }

  if (!args.network || !hasOwn(networks, args.network)) {
    throw new Error('ExpectedKnownNetworkToEncodeChainAddressesAsFallbacks');
  }

  const encoded = args.chain_addresses.map(address => {
    const decoded = {};

    try {
      decoded.address = addressAsProgram({address});
    } catch (err) {
      throw new Error('ExpectedValidBech32ChainAddressToEncodeAsFallback');
    }

    const {prefix, program, version} = decoded.address;

    // The address must be for the network of the invoice
    if (prefix !== networks[args.network].bech32) {
      throw new Error('ExpectedChainAddressForNetworkToEncodeAsFallback');
    }

    return concat([
      byteAsBuffer(version),
      uintAsBuffer(hexByteLength(program), programLengthByteLength),
      hexAsBuffer(program),
    ]);
  });

  return {hex: bufferAsHex(concat(encoded))};
};
