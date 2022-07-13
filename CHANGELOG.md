# Versions

## 2.1.0

- Add support for the signet currency code

## 2.0.7

- `createUnsignedRequest`: Include specified pubkey in unsigned request

## 2.0.5

### Breaking Change

- `parsePaymentRequest`: Change undefined to zero for `mtokens`, `safe_tokens`, `tokens`

## 1.2.1

Fix issues with millitoken value invoices and add additional test coverage for sub-token requests.

- `byteDecodeRequest`: Fix decoding issue, add required word count argument
- `byteEncodeRequest`: Return word count with encoding

## 1.2.0

- `byteDecodeRequest`: Add method to derive a payment request from request bytes
- `byteEncodeRequest`: Add method to derive bytes from a payment request

## 1.1.7

- `createUnsignedRequest`: Allow empty descriptions

## 1.1.2

- Add simnet support

## 1.0.3

Bump dependencies

## 1.0.0

Initial release
