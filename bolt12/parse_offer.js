const hexAsRecords = require('./hex_as_records');
const hexAsString = require('./hex_as_string');
const recordRange = require('./record_range');
const recordsAsOffer = require('./records_as_offer');
const stringAsHex = require('./string_as_hex');

const isHex = n => !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const isOfferType = type => recordRange({type}).range === 'offer';
const isString = n => typeof n === 'string';
const prefix = 'lno';

/** Parse a BOLT 12 offer into its component data

  `paths` are blinded paths to send invoice requests to

  `networks` are the known networks that the offer is for, an offer that is
  not for any known network cannot be parsed

  Either `encoded` or `offer` is required

  {
    [encoded]: <Offer TLV Stream Hex String>
    [offer]: <BOLT 12 Offer String>
  }

  @throws
  <Error>

  @returns
  {
    [amount]: <Amount in Currency Minor Units String>
    [currency]: <ISO 4217 Currency Code String>
    [description]: <Description String>
    encoded: <Offer TLV Stream Hex String>
    [expires_at]: <Offer Expires At ISO 8601 Date String>
    features: [{
      bit: <BOLT 09 Feature Bit Number>
      is_required: <Feature Support is Required Bool>
      type: <Feature Type String>
    }]
    is_expired: <Offer is Expired Bool>
    [issuer]: <Issuer Identifier String>
    [issuer_id]: <Issuer Node Public Key Hex String>
    [max_quantity]: <Maximum Quantity Number> (zero for unlimited)
    [metadata]: <Metadata Hex String>
    [mtokens]: <Amount Millitokens String>
    networks: [<Known Network Name String>]
    offer: <BOLT 12 Offer String>
    [paths]: [{
      hops: [{
        encrypted_data: <Encrypted Recipient Data Hex String>
        relay_key: <Blinded Relaying Node Public Key Hex String>
      }]
      [introduction_edge]: <Introduction Node Edge Format Channel Id String>
      [introduction_node]: <Introduction Node Public Key Hex String>
      key: <First Hop Path Key Public Key Hex String>
    }]
  }
*/
module.exports = ({encoded, offer}) => {
  if (!!encoded && !!offer) {
    throw new Error('UnexpectedEncodedOfferAndOfferToParseOffer');
  }

  if (!!encoded && (!isString(encoded) || !isHex(encoded))) {
    throw new Error('ExpectedHexEncodedOfferToParseOffer');
  }

  if (!encoded && (!offer || !isString(offer))) {
    throw new Error('ExpectedOfferStringToParseOffer');
  }

  // A string is decoded to hex, and hex is normalized to lower case
  const decoded = encoded || stringAsHex({prefix, string: offer}).hex;

  const hex = decoded.toLowerCase();

  const {records} = hexAsRecords({hex});

  // Offers are only allowed to have records in the offer type range
  if (!records.every(n => isOfferType(n.type))) {
    throw new Error('UnexpectedRecordTypeOutsideOfferRangeInOffer');
  }

  return {
    ...recordsAsOffer({records}),
    encoded: hex,
    offer: hexAsString({hex, prefix}).string,
  };
};
