// @ts-nocheck
import {
  checkIfSuperheroCallbackUrl,
  isTrustedCallbackUrl,
  validateCallbackUrl,
} from '@/utils/callbackUrl';
import { AGGREGATOR_URL } from '@/constants';

/**
 * Pure security helpers — no mocks at all. The trusted host is derived from the REAL
 * `AGGREGATOR_URL` constant rather than a stubbed one, so this spec keeps testing the
 * host the app actually ships with.
 */
describe('callback URL security helpers', () => {
  it('derives the trusted host from the real AGGREGATOR_URL', () => {
    expect(new URL(AGGREGATOR_URL).hostname).toBe('superhero.com');
  });

  it.each([
    'https://superhero.com/callback',
    'https://chat.superhero.com/callback',
    'https://deep.nested.superhero.com/callback',
  ])('trusts the aggregator host and its https subdomains: %s', (url) => {
    const parsed = validateCallbackUrl(url);

    expect(parsed).toBeInstanceOf(URL);
    expect(isTrustedCallbackUrl(parsed)).toBe(true);
  });

  it.each([
    // Prefix spoofing — the real host is `attacker.example`.
    'https://superhero.com.attacker.example/callback',
    // Suffix spoofing — same letters at the end, different owner. Guards the
    // leading dot in the `.${host}` subdomain check.
    'https://evilsuperhero.com/callback',
    // `superhero.com` in a query/path is not the destination host.
    'https://attacker.example/?next=https://superhero.com',
    // Protocol downgrade must not inherit trust.
    'http://superhero.com/callback',
  ])('does not trust spoofed or downgraded URL: %s', (url) => {
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
    'http://192.168.100.42:5173/callback',
    'http://example.com/callback',
  ])('allows http callbacks but never trusts them: %s', (url) => {
    const parsed = validateCallbackUrl(url);

    expect(parsed).toBeInstanceOf(URL);
    expect(isTrustedCallbackUrl(parsed)).toBe(false);
  });

  it.each([
    'superhero://wallet/callback?tx={transaction}',
    'wc:7f6e12@2?relay-protocol=irn&symKey=abc',
  ])('allows and trusts the app\'s own registered native scheme: %s', (url) => {
    const parsed = validateCallbackUrl(url);

    expect(parsed).toBeInstanceOf(URL);
    expect(isTrustedCallbackUrl(parsed)).toBe(true);
  });

  it.each([
    // eslint-disable-next-line no-script-url
    'javascript:alert(1)',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    'file:///etc/passwd',
    'vbscript:msgbox',
    'blob:https://example.com/abc',
    'chrome-extension://abc/popup.html',
    // An app scheme we did NOT register must stay rejected.
    'myapp://callback',
    'intent://wallet/callback#Intent;scheme=myapp;end',
    'mailto:test@example.com',
    'not a url',
    '%ZZ',
    '',
  ])('rejects unsafe or malformed callback URL: %s', (url) => {
    expect(validateCallbackUrl(url)).toBeNull();
  });

  it('rejects non-string query values', () => {
    expect(validateCallbackUrl(undefined)).toBeNull();
    expect(validateCallbackUrl(null)).toBeNull();
    expect(validateCallbackUrl(['https://superhero.com'])).toBeNull();
  });

  describe('checkIfSuperheroCallbackUrl', () => {
    it('requires BOTH success and cancel callbacks to be trusted Superhero URLs', () => {
      expect(checkIfSuperheroCallbackUrl({
        'x-success': 'https://superhero.com/success',
        'x-cancel': 'https://wallet.superhero.com/cancel',
      })).toBe(true);

      // One spoofed side is enough to fail the whole check.
      expect(checkIfSuperheroCallbackUrl({
        'x-success': 'https://superhero.com.attacker.example/success',
        'x-cancel': 'https://superhero.com/cancel',
      })).toBe(false);

      // A missing side is not trusted either.
      expect(checkIfSuperheroCallbackUrl({
        'x-success': 'https://superhero.com/success',
      })).toBe(false);

      expect(checkIfSuperheroCallbackUrl({})).toBe(false);
    });
  });
});
