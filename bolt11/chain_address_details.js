const {decodeBase58Address} = require('@alexbosworth/blockchain');
const {decodeBech32Address} = require('@alexbosworth/blockchain');

const addressVersion = require('./address_version');
const {chainNetworks} = require('./conf/address_versions');
const {networks} = require('./conf/address_versions');

const bufferAsHex = buffer => buffer.toString('hex');
const decodeBase58 = address => decodeBase58Address({address});
const decodeBech32 = address => decodeBech32Address({address});
const isBech32 = (prefix, n) => n.toLowerCase().startsWith(`${prefix}1`);

/** Derive chain address details

  {
    address: <Chain Address String>
    network: <Network Name String>
  }

  @throws
  <Error> on invalid chain address

  @returns
  {
    hash: <Address Data Hash Hex String>
    version: <Witness or Address Version Number>
  }
*/
module.exports = ({address, network}) => {
  if (!address) {
    throw new Error('ExpectedAddressToDeriveChainAddressDetails');
  }

  if (!network || !networks[chainNetworks[network]]) {
    throw new Error('ExpectedNetworkToDeriveChainAddressDetails');
  }

  const {bech32} = networks[chainNetworks[network]];

  // The bech32 prefix determines if an address is bech32 or base58 encoded
  const decode = isBech32(bech32, address) ? decodeBech32 : decodeBase58;

  // Confirm the address parses with the selected encoding
  try {
    decode(address);
  } catch (err) {
    throw new Error('ExpectedValidAddressToDeriveChainDetails');
  }

  const {hash, prefix, program, version} = decode(address);

  return {
    hash: bufferAsHex(program || hash),
    version: addressVersion({network, prefix, version}).version,
  };
};
