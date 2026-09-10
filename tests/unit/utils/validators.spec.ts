import { isSeedLengthValid, isUrlValid } from '@/utils/validators';

describe('isUrlValid', () => {
  it('accepts a valid https FQDN', () => {
    expect(isUrlValid('https://example.com')).toBe(true);
  });

  it('accepts localhost', () => {
    expect(isUrlValid('http://localhost')).toBe(true);
    expect(isUrlValid('http://localhost:8080')).toBe(true);
  });

  it('accepts subdomains', () => {
    expect(isUrlValid('https://sub.example.com/path?query=1')).toBe(true);
  });

  it('rejects non-FQDN hosts', () => {
    expect(isUrlValid('https://not-a-real-tld')).toBe(false);
  });

  it('rejects non-http(s) protocols', () => {
    expect(isUrlValid('ftp://example.com')).toBe(false);
    expect(isUrlValid('data:text/plain,hello')).toBe(false);
  });

  it('rejects malformed URLs', () => {
    expect(isUrlValid('not a url')).toBe(false);
  });
});

describe('isSeedLengthValid', () => {
  it('accepts a 12-word seed', () => {
    expect(isSeedLengthValid(new Array(12).fill('word').join(' '))).toBe(true);
  });

  it('rejects a seed with fewer words than required', () => {
    expect(isSeedLengthValid('too short seed')).toBe(false);
  });
});
