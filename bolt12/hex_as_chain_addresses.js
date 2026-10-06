const networks = require('./conf/networks');
const programAsAddress = require('./program_as_address');

const bufferAsHex = buffer => buffer.toString('hex');
const {hasOwn} = Object;
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const isString = n => typeof n === 'string';
const programLengthByteLength = 2;
const versionByteLength = 1;

/** Decode BOLT 12 fallback address bytes as chain addresses

  Fallback addresses that are not valid witness programs are ignored

  {
    hex: <Encoded Fallback Addresses Hex String>
    network: <Network Name String>
  }

  @throws
  <Error>

  @returns
  {
    chain_addresses: [<Chain Address String>]
  }
*/
module.exports = ({hex, network}) => {
  if (!isString(hex) || !isHex(hex)) {
    throw new Error('ExpectedHexEncodedFallbackAddressesToDecode');
  }

  if (!network || !hasOwn(networks, network)) {
    throw new Error('ExpectedKnownNetworkToDecodeFallbackAddresses');
  }

  const addresses = [];
  const encoded = hexAsBuffer(hex);

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

  // Fallbacks are concatenated together, keep reading until data runs out
  while (cursor.offset < encoded.length) {
    const [version] = read(versionByteLength, 'ExpectedVersionInFallback');

    const programByteLength = read(
      programLengthByteLength,
      'ExpectedProgramLengthInFallbackAddress'
    ).readUInt16BE();

    const program = read(
      programByteLength,
      'ExpectedWitnessProgramInFallbackAddress'
    );

    // An address that does not meet the known requirements is not used
    try {
      const {address} = programAsAddress({
        version,
        prefix: networks[network].bech32,
        program: bufferAsHex(program),
      });

      addresses.push(address);
    } catch (err) {
      // Ignore errors
    }
  }

  return {chain_addresses: addresses};
};
