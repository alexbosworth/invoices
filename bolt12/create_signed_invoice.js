const hexAsString = require('./hex_as_string');
const parseInvoice = require('./parse_invoice');
const signStream = require('./sign_stream');
const types = require('./conf/tlv_types');

const message = 'invoice';
const prefix = 'lni';

/** Assemble a signed BOLT 12 invoice

  Either a `secret` key to sign with or a `signature` is required

  The `signature` is a BIP 340 signature by the `node_id` key over the `hash`
  from the unsigned invoice, such as from `signBytes` with the invoice `root`
  as the preimage, the invoice `tag` as the tag, and `schnorr` as the type.

  {
    encoded: <Unsigned Invoice TLV Stream Hex String>
    [secret]: <Node Id Private Key Hex String>
    [signature]: <Node Id BIP 340 Signature Hex String>
  }

  @throws
  <Error>

  @returns
  {
    encoded: <Signed Invoice TLV Stream Hex String>
    invoice: <BOLT 12 Invoice String>
  }
*/
module.exports = ({encoded, secret, signature}) => {
  const signed = signStream({
    encoded,
    message,
    secret,
    signature,
    type: types.invoice.node_id,
  });

  // Confirm that the signed invoice is a valid invoice
  parseInvoice({encoded: signed.encoded});

  return {
    encoded: signed.encoded,
    invoice: hexAsString({prefix, hex: signed.encoded}).string,
  };
};
