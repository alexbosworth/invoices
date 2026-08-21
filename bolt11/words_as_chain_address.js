const {encodeBase58Address} = require('@alexbosworth/blockchain');
const {encodeBech32Address} = require('@alexbosworth/blockchain');

const addressVersions = require('./conf/address_versions');
const {chainNetworks} = require('./conf/address_versions');
const {networks} = require('./conf/address_versions');
const wordsAsBuffer = require('./words_as_buffer');

const asB58 = (hash, version) => encodeBase58Address({hash, version}).address;
const {isArray} = Array;

/** Words as a chain address

  {
    network: <Network Name String>
    words: [<Bech 32 Word Number>]
  }

  @throws
  <Error>

  @returns
  {
    [chain_address]: <Chain Address String>
  }
*/
module.exports = ({network, words}) => {
  if (!isArray(words) || !words.length) {
    throw new Error('ExpectedWordsToConvertToChainAddress');
  }

  // Signet shares the same chain address parameters as testnet
  const net = networks[chainNetworks[network]];
  const [version, ...hashWords] = words;

  if (!net) {
    throw new Error('UnrecognizedNetworkForChainAddress');
  }

  const hash = wordsAsBuffer({words: hashWords, trim: true});

  switch (version) {
  // P2PKH is a base58 encoded address
  case addressVersions.p2pkh:
    return {chain_address: asB58(hash, net.pubKeyHash)};

  // P2SH is a base58 encoded address
  case addressVersions.p2sh:
    return {chain_address: asB58(hash, net.scriptHash)};

  // SegWit and Taproot use bech32 address encoding
  case addressVersions.witnessV0:
  case addressVersions.witnessV1:
    const {address} = encodeBech32Address({
      version,
      prefix: net.bech32,
      program: hash,
    });

    return {chain_address: address};
  }

  return {};
};
