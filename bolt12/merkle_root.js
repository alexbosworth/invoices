const {encodeBigSize} = require('bolt01');
const {encodeTlvRecord} = require('bolt01');

const recordRange = require('./record_range');
const taggedHash = require('./tagged_hash');

const branchTag = Buffer.from('LnBranch', 'utf8').toString('hex');
const bufferAsHex = buffer => buffer.toString('hex');
const {compare} = Buffer;
const {concat} = Buffer;
const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const {isArray} = Array;
const isSignature = type => recordRange({type}).range === 'signature';
const isString = n => typeof n === 'string';
const leafTag = Buffer.from('LnLeaf', 'utf8').toString('hex');
const nonceTag = Buffer.from('LnNonce', 'utf8').toString('hex');
const pairSize = 2;
const sortByType = (a, b) => BigInt(a.type) < BigInt(b.type) ? -1 : 1;

/** Calculate the BOLT 12 Merkle root of a TLV stream

  Signature records are not included in the tree. Every other record has a
  leaf hash paired with a nonce leaf derived from the first record. Inner
  nodes hash the lesser child before the greater child, with any odd node at
  the end of a level carried up to the next level unchanged.

  {
    records: [{
      type: <Record Type Number String>
      value: <Record Value Hex String>
    }]
  }

  @throws
  <Error>

  @returns
  {
    root: <Merkle Root Hash Hex String>
  }
*/
module.exports = ({records}) => {
  if (!isArray(records)) {
    throw new Error('ExpectedArrayOfRecordsToCalculateMerkleRoot');
  }

  if (!records.every(n => !!n && !!n.type && isString(n.type))) {
    throw new Error('ExpectedRecordTypesToCalculateMerkleRoot');
  }

  if (!records.every(n => isString(n.value))) {
    throw new Error('ExpectedRecordValuesToCalculateMerkleRoot');
  }

  const signed = records.filter(n => !isSignature(n.type)).sort(sortByType);

  if (!signed.length) {
    throw new Error('ExpectedNonSignatureRecordsToCalculateMerkleRoot');
  }

  const encoded = signed.map(({type, value}) => {
    return encodeTlvRecord({type, value}).encoded;
  });

  // The nonce tag commits to the numerically first record in the stream
  const [first] = encoded;

  // The lesser hash goes before the greater hash when hashing a branch
  const branch = (a, b) => {
    const hashes = [hexAsBuffer(a), hexAsBuffer(b)];

    const [lesser, greater] = hashes.sort(compare);

    const {hash} = taggedHash({
      data: bufferAsHex(concat([lesser, greater])),
      tag: branchTag,
    });

    return hash;
  };

  const leaves = signed.map((record, i) => {
    const leaf = taggedHash({data: encoded[i], tag: leafTag}).hash;

    const {hash} = taggedHash({
      data: encodeBigSize({number: record.type}).encoded,
      tag: `${nonceTag}${first}`,
    });

    return branch(leaf, hash);
  });

  // Combine pairs of adjacent nodes until there is only a single root node
  const reduce = nodes => {
    if (nodes.length === [nodes].length) {
      return nodes;
    }

    const level = [];

    for (let i = Number(); i < nodes.length; i += pairSize) {
      const [a, b] = nodes.slice(i, i + pairSize);

      level.push(!b ? a : branch(a, b));
    }

    return reduce(level);
  };

  const [root] = reduce(leaves);

  return {root};
};
