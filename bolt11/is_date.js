const datePrefix = /^([+-]\d{6}|\d{4})(?:-(\d{2})(?:-(\d{2}))?)?/;
const {isNaN} = Number;
const isString = n => typeof n === 'string';
const {parse} = Date;
const time = /^(?:[T ]\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:?\d\d)?)?$/i;

/** Check if a string represents a valid ISO 8601 date

  <Date String>

  @returns
  <Date is Valid Bool>
*/
module.exports = date => {
  const parts = isString(date) ? date.match(datePrefix) : null;

  if (!parts) {
    return false;
  }

  const [calendar, year, month, day] = parts;

  if (!time.test(date.slice(calendar.length)) || isNaN(parse(date))) {
    return false;
  }

  // Date.parse can roll an impossible day into the next month.
  return day === undefined ||
    new Date(`${year}-${month}-${day}T00:00:00Z`).getUTCDate() === Number(day);
};
