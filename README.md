# Invoices

Utility methods for parsing Lightning Network BOLT 11 payment requests, as well
as encoding unsigned requests and signing payment requests.

## Methods

### byteDecodeRequest

Derive a payment request from request data.

    {
      encoded: <Payment Request Details Hex String>
      [mtokens]: <Millitokens Number String>
      network: <Network Name String>
      words: <Words Count Number>
    }

    @throws
    <Error>

    @returns
    {
      request: <BOLT 11 Encoded Payment Request String>
    }

Example:

```node
const {byteDecodeRequest} = require('invoices');

// Get a BOLT 11 payment request for this invoice data
const {request} = byteDecodeRequest({
  encoded: paymentRequestDetailsHexString,
  mtokens: '0',
  network: 'bitcoin',
});
```

### byteEncodeRequest

Derive bytes for payment request details

    {
      request: <BOLT 11 Encoded Payment Request String>
    }

    @throws
    <Error>

    @returns
    {
      encoded: <Payment Request Details Hex String>
      mtokens: <Millitokens Number String>
      network: <Network Name String>
      words: <Word Length Number>
    }

Example:

```node
const {byteEncodeRequest} = require('invoices');

// Get the bytes for a payment request
const {encoded, mtokens, network} = byteEncodeRequest({
  request: bolt11EncodedPaymentRequestString,
});
```

### createSignedRequest

Assemble a signed payment request

    {
      destination: <Destination Public Key Hex String>
      hrp: <Request Human Readable Part String>
      signature: <Request Hash Signature Hex String>
      tags: [<Request Tag Word Number>]
    }

    @throws
    <Error>

    @returns
    {
      request: <BOLT 11 Encoded Payment Request String>
    }

Example:

```node
const {createSignedRequest} = require('invoices');

// Get hrp and signature from createUnsignedRequest
// Get signature via standard private key signing, or LND signBytes
const {request} = createSignedRequest({
  destination: nodePublicKey,
  hrp: amountAndNetworkHrp,
  signature: signedPreimageHash,
  tags: paymentRequestTags,
});
```

### createUnsignedRequest

Create an unsigned payment request

    {
      [chain_addresses]: [<Chain Address String>]
      [cltv_delta]: <CLTV Delta Number>
      [created_at]: <Invoice Creation Date ISO 8601 String>
      [description]: <Description String>
      [description_hash]: <Description Hash Hex String>
      destination: <Public Key String>
      [expires_at]: <ISO 8601 Date String>
      features: [{
        bit: <BOLT 09 Feature Bit Number>
      }]
      id: <Preimage SHA256 Hash Hex String>
      [mtokens]: <Requested Milli-Tokens Value String> (can exceed Number limit)
      network: <Network Name String>
      [payment]: <Payment Identifier Hex String>
      [routes]: [[{
        [base_fee_mtokens]: <Base Fee Millitokens String>
        [channel]: <Standard Format Channel Id String>
        [cltv_delta]: <Final CLTV Expiration Blocks Delta Number>
        [fee_rate]: <Fee Rate Millitokens Per Million Number>
        public_key: <Forward Edge Public Key Hex String>
      }]]
      [tokens]: <Requested Chain Tokens Number> (note: can differ from mtokens)
    }

    @returns
    {
      hash: <Payment Request Signature Hash Hex String>
      hrp: <Human Readable Part of Payment Request String>
      preimage: <Signature Hash Preimage Hex String>
      tags: [<Data Tag Number>]
    }

Example:

```node
const {createUnsignedRequest} = require('invoices');

const unsignedComponents = createUnsignedRequest({
  destination: nodePublicKey,
  id: rHashHexString,
  network: 'bitcoin',
});
// Use createSignedRequest and a signature to create a complete request
```

### parsePaymentRequest

Parse a BOLT 11 payment request into its component data

Note: either description or description_hash will be returned

    {
      request: <BOLT 11 Payment Request String>
    }

    @throws
    <Error>

    @returns
    {
      [chain_addresses]: [<Chain Address String>]
      cltv_delta: <CLTV Delta Number>
      created_at: <Invoice Creation Date ISO 8601 String>
      [description]: <Description String>
      [description_hash]: <Description Hash Hex String>
      destination: <Public Key String>
      expires_at: <ISO 8601 Date String>
      features: [{
        bit: <BOLT 09 Feature Bit Number>
        is_required: <Feature Support is Required To Pay Bool>
        type: <Feature Type String>
      }]
      id: <Payment Request Hash String>
      is_expired: <Invoice is Expired Bool>
      [mtokens]: <Requested Milli-Tokens Value String> (can exceed Number limit)
      network: <Network Name String>
      [payment]: <Payment Identifier Hex Encoded String>
      [routes]: [[{
        [base_fee_mtokens]: <Base Fee Millitokens String>
        [channel]: <Standard Format Channel Id String>
        [cltv_delta]: <Final CLTV Expiration Blocks Delta Number>
        [fee_rate]: <Fee Rate Millitokens Per Million Number>
        public_key: <Forward Edge Public Key Hex String>
      }]]
      [safe_tokens]: <Requested Chain Tokens Rounded Up Number>
      [tokens]: <Requested Chain Tokens Number> (note: can differ from mtokens)
    }

```node
const {parsePaymentRequest} = require('invoices');

// Decoded details of the payment request
const requestDetails = parsePaymentRequest({request: 'paymentRequestString'});
```
