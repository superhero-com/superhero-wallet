import { ContractByteArrayEncoder, TypeResolver } from '@aeternity/aepp-calldata';
import JsonBig from '@/lib/json-big';

const ADDRESS = 'ak_2swhLkgBPeeADxVTAVCJnZLY5NZtCFiM93JxsEaMuC59euuFRQ';

/** A call argument as the sign modal gets it from the decoded call data */
function decodeCallArgument(type: string | object, value: unknown) {
  const encoder = new ContractByteArrayEncoder();
  const fateType = new TypeResolver().resolveType(type);
  return encoder.decodeWithType(encoder.encodeWithType(value, fateType), fateType);
}

describe('JsonBig', () => {
  describe('parse', () => {
    it('keeps the numbers longer than 15 characters as strings', () => {
      expect(JsonBig.parse(
        '{"amount":20000000000000000000,"fee":16840000000000,"min":-12345678901234,'
        + '"diff":-123456789012345,"ratio":0.1234567890123456,"list":[1,[12345678901234567890]]}',
      )).toEqual({
        amount: '20000000000000000000',
        fee: 16840000000000,
        min: -12345678901234,
        diff: '-123456789012345',
        ratio: '0.1234567890123456',
        list: [1, ['12345678901234567890']],
      });
    });

    it('leaves the digits inside strings as they are', () => {
      expect(JsonBig.parse(
        '{"payload":"ba_12345678901234567890","quoted":"\\"12345678901234567890\\\\",'
        + '"12345678901234567890":12345678901234567890}',
      )).toEqual({
        payload: 'ba_12345678901234567890',
        quoted: '"12345678901234567890\\',
        '12345678901234567890': '12345678901234567890',
      });
    });

    it.each([
      ['an unterminated string', ''],
      ['a string ending in a backslash', '\\'],
      ['a string with a backslash before a line break', '\\\n"}'],
    ])('fails on %s without scanning it again from every quote', (_shape, end) => {
      const text = `{"note":"${'\\"'.repeat(65536)}${end}`; // 128 KB
      const start = performance.now();

      expect(() => JsonBig.parse(text)).toThrow(SyntaxError);
      expect(performance.now() - start).toBeLessThan(1000);
    });
  });

  describe('stringify', () => {
    it('writes bigints as strings next to any other value', () => {
      expect(JsonBig.stringify([
        ADDRESS,
        '',
        100n,
        true,
        { amount: 20000000000000000000n, nonce: 5 },
      ])).toBe(
        `["${ADDRESS}","","100",true,{"amount":"20000000000000000000","nonce":5}]`,
      );
    });

    it('writes the maps and bytes of decoded call arguments as arrays', () => {
      expect(JsonBig.stringify([
        decodeCallArgument({ map: ['address', 'int'] }, new Map([[ADDRESS, 5n]])),
        decodeCallArgument({ bytes: 2 }, 0xabcdn),
      ])).toBe(`[[["${ADDRESS}","5"]],[171,205]]`);
    });
  });
});
