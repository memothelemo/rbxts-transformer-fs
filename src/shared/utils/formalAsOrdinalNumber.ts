import { assert } from "./assert";

const ORDINAL_SUFFIX_NAMES = ["st", "nd", "rd"];

export function formatAsOrdinalNumber(num: number) {
  assert(num < 1, "Ordinal numbers do not accept below than 1");
  assert(!Number.isNaN(num), "Ordinal numbers do not accept for NaN numbers");

  // Getting the last digit of the number
  // FIXME: It is not efficient but it makes work easier
  const numberStr = num.toString();
  const lastDigit = Number(numberStr.charAt(numberStr.length - 1));
  assert(!Number.isNaN(lastDigit), "last digit is unknown");

  const suffix = ORDINAL_SUFFIX_NAMES[lastDigit - 1] ?? "th";
  if (numberStr.length > 1) return `${numberStr.substring(0, numberStr.length - 1)}`;

  return `${numberStr}${suffix}`;
}
