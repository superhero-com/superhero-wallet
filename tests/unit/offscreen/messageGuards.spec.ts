// @ts-nocheck
describe('offscreen message guards', () => {
  beforeEach(() => {
    (global as any).browser = {
      runtime: { id: 'test-extension-id' },
    };
    jest.resetModules();
  });

  it('accepts only offscreen-targeted messages from this extension', () => {
    // eslint-disable-next-line global-require
    const { isAcceptedOffscreenSender } = require('@/offscreen/messageGuards');

    expect(isAcceptedOffscreenSender(
      { target: 'offscreen', method: 'eth_sendTransaction' },
      { id: 'test-extension-id' },
    )).toBe(true);
  });

  it.each([
    ['other extension', { target: 'offscreen' }, { id: 'other-extension-id' }],
    ['missing sender', { target: 'offscreen' }, undefined],
    ['sender without id', { target: 'offscreen' }, {}],
    ['wrong target', { target: 'background' }, { id: 'test-extension-id' }],
    ['missing message', undefined, { id: 'test-extension-id' }],
  ])('rejects %s', (_label, msg, sender) => {
    // eslint-disable-next-line global-require
    const { isAcceptedOffscreenSender } = require('@/offscreen/messageGuards');

    expect(isAcceptedOffscreenSender(msg, sender)).toBe(false);
  });
});
