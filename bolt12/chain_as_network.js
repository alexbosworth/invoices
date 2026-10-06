const networks = require('./conf/networks');

const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const isString = n => typeof n === 'string';
const {keys} = Object;

/** Derive the network name for a chain hash

  {
    chain: <Genesis Block Chain Hash Hex String>
  }

  @throws
  <Error>

  @returns
  {
    network: <Network Name String>
  }
*/
module.exports = ({chain}) => {
  if (!chain || !isString(chain) || !isHex(chain)) {
    throw new Error('ExpectedChainHashToDeriveNetworkName');
  }

  // Chain hashes are compared in lower case
  const hash = chain.toLowerCase();

  const network = keys(networks).find(n => networks[n].chain === hash);

  if (!network) {
    throw new Error('UnknownChainHashToDeriveNetworkName');
  }

  return {network};
};
