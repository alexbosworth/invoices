# Versions

## 2.0.2

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
