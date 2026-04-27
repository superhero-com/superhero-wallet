// @ts-nocheck
describe('callback URL security helpers', () => {
  const loadHelpers = () => {
    jest.resetModules();
    jest.doMock('@/constants', () => ({
      AGGREGATOR_URL: 'https://superhero.com',
    }));
    // eslint-disable-next-line global-require
    return require('@/utils/callbackUrl');
  };

  it.each([
    'https://superhero.com/callback',
    'https://chat.superhero.com/callback',
    'https://deep.nested.superhero.com/callback',
  ])('trusts the aggregator host and https subdomain %s', (url) => {
    const { isTrustedCallbackUrl, validateCallbackUrl } = loadHelpers();
    const parsed = validateCallbackUrl(url);

    expect(parsed).toBeInstanceOf(URL);
    expect(isTrustedCallbackUrl(parsed)).toBe(true);
  });

  it.each([
    'https://superhero.com.attacker.example/callback',
    'https://evilsuperhero.com/callback',
    'https://attacker.example/?next=https://superhero.com',
    'http://superhero.com/callback',
  ])('does not trust spoofed or downgraded URL %s', (url) => {
    const { isTrustedCallbackUrl, validateCallbackUrl } = loadHelpers();
    const parsed = validateCallbackUrl(url);

    if (parsed) {
      expect(isTrustedCallbackUrl(parsed)).toBe(false);
    } else {
      expect(parsed).toBeNull();
    }
  });

  it.each([
    'http://localhost:3000/callback',
    'http://127.0.0.1:8080/callback',
    'http://0.0.0.0:8080/callback',
  ])('allows loopback http callbacks for local development %s', (url) => {
    const { validateCallbackUrl, isTrustedCallbackUrl } = loadHelpers();
    const parsed = validateCallbackUrl(url);

    expect(parsed).toBeInstanceOf(URL);
    expect(isTrustedCallbackUrl(parsed)).toBe(false);
  });

  it.each([
    'superhero://wallet/callback?tx={transaction}',
    'wc:7f6e12@2?relay-protocol=irn&symKey=abc',
  ])('allows registered native callback scheme %s', (url) => {
    const { validateCallbackUrl, isTrustedCallbackUrl } = loadHelpers();
    const parsed = validateCallbackUrl(url);

    expect(parsed).toBeInstanceOf(URL);
    expect(isTrustedCallbackUrl(parsed)).toBe(true);
  });

  it.each([
    'http://example.com/callback',
    // eslint-disable-next-line no-script-url
    'javascript:alert(1)',
    'myapp://callback',
    'not a url',
    '%ZZ',
  ])('rejects unsafe callback URL %s', (url) => {
    const { validateCallbackUrl } = loadHelpers();

    expect(validateCallbackUrl(url)).toBeNull();
  });

  it('requires both success and cancel callbacks to be trusted Superhero URLs', () => {
    const { checkIfSuperheroCallbackUrl } = loadHelpers();

    expect(checkIfSuperheroCallbackUrl({
      'x-success': 'https://superhero.com/success',
      'x-cancel': 'https://wallet.superhero.com/cancel',
    })).toBe(true);
    expect(checkIfSuperheroCallbackUrl({
      'x-success': 'https://superhero.com.attacker.example/success',
      'x-cancel': 'https://superhero.com/cancel',
    })).toBe(false);
    expect(checkIfSuperheroCallbackUrl({
      'x-success': 'https://superhero.com/success',
    })).toBe(false);
  });
});
