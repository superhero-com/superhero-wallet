/**
 * A string literal is matched whole, so the digits inside it are not taken for a number.
 * A broken or unterminated one is matched too, so it isn't scanned again from every quote.
 */
const STRING_OR_NUMBER = /"[^"\\]*(?:\\[\s\S][^"\\]*)*(?:"|\\?$)|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

export default {
  /**
   * Keeps numbers longer than 15 characters (e.g. aettos) as strings,
   * as a JS number would lose their precision.
   */
  parse: (text: string) => JSON.parse(text.replace(
    STRING_OR_NUMBER,
    (token) => (token[0] !== '"' && token.length > 15 ? `"${token}"` : token),
  )),
  /**
   * Writes bigints (e.g. aettos from the SDK) as strings,
   * and the maps and bytes of decoded call data as arrays.
   */
  stringify: (value: unknown) => JSON.stringify(value, (_key, item) => {
    if (typeof item === 'bigint') return item.toString();
    if (item instanceof Map || item instanceof Uint8Array) return [...item];
    return item;
  }),
};
