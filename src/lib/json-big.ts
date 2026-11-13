/**
 * A string literal is matched whole, so the digits inside it are not taken for a number.
 */
const STRING_OR_NUMBER = /"[^"\\]*(?:\\.[^"\\]*)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

export default {
  /**
   * Keeps numbers longer than 15 characters (e.g. aettos) as strings,
   * as a JS number would lose their precision.
   */
  parse: (text: string) => JSON.parse(text.replace(
    STRING_OR_NUMBER,
    (token) => (token[0] !== '"' && token.length > 15 ? `"${token}"` : token),
  )),
  /** Writes bigints (e.g. aettos from the SDK) as strings. */
  stringify: (value: unknown) => JSON.stringify(
    value,
    (_key, item) => (typeof item === 'bigint' ? item.toString() : item),
  ),
};
