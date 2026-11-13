import JsonBig from '@/lib/json-big';

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
  });

  describe('stringify', () => {
    it('writes bigints as strings next to any other value', () => {
      expect(JsonBig.stringify([
        'ak_2swhLkgBPeeADxVTAVCJnZLY5NZtCFiM93JxsEaMuC59euuFRQ',
        '',
        100n,
        true,
        { amount: 20000000000000000000n, nonce: 5 },
      ])).toBe(
        '["ak_2swhLkgBPeeADxVTAVCJnZLY5NZtCFiM93JxsEaMuC59euuFRQ","",'
        + '"100",true,{"amount":"20000000000000000000","nonce":5}]',
      );
    });
  });
});
