import { toURL } from '../../../src/utils';

describe('toURL', () => {
  [
    null,
    12,
    undefined,
    {},
    [],
    '',
    NaN,
  ].forEach((url) => it('should only accept non-empty string as parameter', () => {
    expect(() => toURL(url)).toThrowError();
  }));

  [
    { url: 'test.com' },
    { url: 'http://test.com', hasProtocol: true },
    { url: 'http://test', hasProtocol: true },
    { url: 'file://file.pdf', hasProtocol: true },
    { url: 'https://test.com', hasProtocol: true },
  ].forEach((test) => it('should add "https://" before URL if it lacks protocol and add "/" at the end of URL', () => {
    expect.assertions(1);
    const result = toURL(test.url).toString();

    if (test.hasProtocol) {
      expect(result).toEqual(`${test.url}/`);
      return;
    }

    expect(result.startsWith('https://')).toBeTruthy();
  }));
});
