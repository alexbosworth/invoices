const networks = require('./conf/networks');

const {hasOwn} = Object;

/** Derive the chain hash for a network name

  {
    network: <Network Name String>
  }

  @throws
  <Error>

  @returns
  {
    chain: <Genesis Block Chain Hash Hex String>
  }
*/
module.exports = ({network}) => {
  if (!network || !hasOwn(networks, network)) {
    throw new Error('ExpectedKnownNetworkNameToDeriveChainHash');
  }

  return {chain: networks[network].chain};
};
