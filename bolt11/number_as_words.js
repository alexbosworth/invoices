const boundary = Math.pow(2, 5);
const {floor} = Math;
const {isFinite} = Number;

/** Number as bech32 words

  {
    [number]: <Value Number>
  }

  @throws
  <Error>

  @returns
  {
    [words]: [<Bech32 Word Number>]
  }
*/
module.exports = ({number}) => {
  if (number === undefined) {
    return {};
  }

  let cursor = floor(number);

  if (!cursor) {
    return {words: [[].length]};
  }

  // A negative or infinite number would never be reduced down to zero
  if (cursor < Number() || !isFinite(cursor)) {
    throw new Error('ExpectedUnsignedFiniteNumberToConvertNumberToWords');
  }

  const words = [];

  while (!!cursor) {
    words.unshift(cursor & (boundary - [cursor].length));

    cursor = floor(cursor / boundary);
  }

  return {words};
};
