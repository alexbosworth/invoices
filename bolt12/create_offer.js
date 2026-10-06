const {encodeTlvStream} = require('bolt01');

const hexAsString = require('./hex_as_string');
const offerAsRecords = require('./offer_as_records');

const prefix = 'lno';

/** Create a BOLT 12 offer

  Either an `issuer_id` or `paths` is required. A `description` is required
  when there is an `mtokens` or `amount`. An `amount` requires a `currency`.

  `max_quantity` of zero means the maximum quantity is unknown or unlimited

  {
    [amount]: <Amount in Currency Minor Units String>
    [currency]: <ISO 4217 Currency Code String>
    [description]: <Description String>
    [expires_at]: <Offer Expires At ISO 8601 Date String>
    [features]: [{
      bit: <BOLT 09 Feature Bit Number>
    }]
    [issuer]: <Issuer Identifier String>
    [issuer_id]: <Issuer Node Public Key Hex String>
    [max_quantity]: <Maximum Quantity Number> (zero for unlimited)
    [metadata]: <Metadata Hex String>
    [mtokens]: <Amount Millitokens String>
    [networks]: [<Network Name String>]
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

  @throws
  <Error>

  @returns
  {
    offer: <BOLT 12 Offer String>
  }
*/
module.exports = args => {
  const {records} = offerAsRecords(args);

  const {encoded} = encodeTlvStream({records});

  return {offer: hexAsString({prefix, hex: encoded}).string};
};
