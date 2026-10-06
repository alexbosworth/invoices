const {encodeTlvStream} = require('bolt01');

const merkleRoot = require('./merkle_root');
const recordRange = require('./record_range');
const taggedHash = require('./tagged_hash');

const fieldName = 'signature';
const {isArray} = Array;
const isSignature = type => recordRange({type}).range === 'signature';
const isString = n => typeof n === 'string';
const tagPrefix = 'lightning';
const utf8AsHex = utf8 => Buffer.from(utf8, 'utf8').toString('hex');

/** Derive the signing details for an unsigned BOLT 12 TLV stream

  The signature tag is "lightning" || messagename || fieldname and the message
  that is signed is the tagged hash of the Merkle root of the records.

  {
    message: <TLV Stream Message Name String>
    records: [{
      type: <Record Type Number String>
      value: <Record Value Hex String>
    }]
  }

  @throws
  <Error>

  @returns
  {
    encoded: <Unsigned TLV Stream Hex String>
    hash: <Tagged Merkle Root Hash To Sign Hex String>
    root: <Merkle Root Hash Hex String>
    tag: <Signature Tag String>
  }
*/
module.exports = ({message, records}) => {
  if (!message || !isString(message)) {
    throw new Error('ExpectedMessageNameToDeriveUnsignedDetails');
  }

  if (!isArray(records)) {
    throw new Error('ExpectedArrayOfRecordsToDeriveUnsignedDetails');
  }

  if (!records.every(n => !!n && !!n.type && isString(n.type))) {
    throw new Error('ExpectedRecordTypesToDeriveUnsignedDetails');
  }

  if (!records.every(n => isString(n.value))) {
    throw new Error('ExpectedRecordValuesToDeriveUnsignedDetails');
  }

  // Signature records are never part of the signed data
  const unsigned = records.filter(n => !isSignature(n.type));

  const {root} = merkleRoot({records: unsigned});

  const tag = `${tagPrefix}${message}${fieldName}`;

  return {
    root,
    tag,
    encoded: encodeTlvStream({records: unsigned}).encoded.toLowerCase(),
    hash: taggedHash({data: root, tag: utf8AsHex(tag)}).hash,
  };
};
