const byteOffset = 0;

/** Encode an unsigned number as a fixed size big endian buffer

  {
    number: <Number to Encode Number or Numeric String>
    size: <Encoded Bytes Count Number>
  }

  @throws
  <Error>

  @returns
  <Big Endian Encoded Buffer Object>
*/
module.exports = ({number, size}) => {
  const encoded = Buffer.alloc(size);

  encoded.writeUIntBE(Number(number), byteOffset, size);

  return encoded;
};
