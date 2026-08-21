const {chainNetworks} = require('./conf/address_versions');
const {networks} = require('./conf/address_versions');
const {p2pkh} = require('./conf/address_versions');
const {p2sh} = require('./conf/address_versions');

/** Get the LN address version

  BOLT11 has its own numbering system for p2pkh and p2sh that differs from the
  regular chain address versions.

  Either a prefix or a network and version is required

  {
    [network]: <Network Name String>
    [prefix]: <Bech32 Prefix String>
    [version]: <Chain Address Version Number>
  }

  @throws
  <Error>

  @returns
  {
    version: <BOLT 11 Chain Address Version Number>
  }
*/
module.exports = ({network, prefix, version}) => {
  // Exit early: a bech32 witness version is already a BOLT 11 version
  if (!!prefix) {
    return {version};
  }

  if (!network) {
    throw new Error('ExpectedNetworkToDeriveAddressVersion');
  }

  if (!networks[chainNetworks[network]]) {
    throw new Error('UnexpectedNetworkToDeriveAddressVersion');
  }

  if (version === undefined) {
    throw new Error('ExpectedVersionToDeriveAddressVersion');
  }

  // Translate the network version byte into a BOLT 11 fallback version
  switch (version) {
  case networks[chainNetworks[network]].pubKeyHash:
    return {version: p2pkh};

  case networks[chainNetworks[network]].scriptHash:
    return {version: p2sh};

  default:
    throw new Error('UnexpectedVersionToDeriveBoltOnChainAddressVersion');
  }
};
