const mockConnectionInstances: any[] = [];
const mockExecuteAndSetInterval = vi.fn((handler: () => void) => {
  handler();
  return 1;
});

vi.mock('@aeternity/aepp-sdk', () => ({
  BrowserWindowMessageConnection: vi.fn().mockImplementation(function MockConnection(
    this: any,
    options: any,
  ) {
    this.origin = options.origin;
    this.options = options;
    this.connect = vi.fn();
    mockConnectionInstances.push(this);
  }),
}));

vi.mock('@/utils', () => ({
  executeAndSetInterval: mockExecuteAndSetInterval,
  handleUnknownError: vi.fn(),
}));

describe('FramesConnection', () => {
  beforeEach(async () => {
    vi.resetModules();
    mockConnectionInstances.length = 0;
    mockExecuteAndSetInterval.mockClear();
    window.history.replaceState({}, '', '/');
    Object.defineProperty(document, 'referrer', {
      value: '',
      configurable: true,
    });
  });

  it('connects only to the embedding parent frame', async () => {
    const parentFrame = { frames: [{}, {}] };
    Object.defineProperty(window, 'parent', {
      value: parentFrame,
      configurable: true,
    });
    Object.defineProperty(document, 'referrer', {
      value: 'https://dapp.example/page',
      configurable: true,
    });

    const { FramesConnection } = await import('@/lib/FramesConnection');
    const aeSdk = {
      addRpcClient: vi.fn(() => 'client-id'),
      removeRpcClient: vi.fn(),
      shareWalletInfo: vi.fn(),
    };

    FramesConnection.init(aeSdk as any);

    expect(mockConnectionInstances).toHaveLength(1);
    expect(mockConnectionInstances[0].options).toMatchObject({
      target: parentFrame,
      origin: 'https://dapp.example',
    });
    expect(aeSdk.shareWalletInfo).toHaveBeenCalledWith('client-id');
  });

  it('uses parentOrigin query hint when referrer is absent', async () => {
    const parentFrame = {};
    Object.defineProperty(window, 'parent', {
      value: parentFrame,
      configurable: true,
    });
    window.history.replaceState({}, '', '/?parentOrigin=https%3A%2F%2Fhint.example%2Fpath');

    const { FramesConnection } = await import('@/lib/FramesConnection');

    FramesConnection.init({
      addRpcClient: vi.fn(() => 'client-id'),
      removeRpcClient: vi.fn(),
      shareWalletInfo: vi.fn(),
    } as any);

    expect(mockConnectionInstances[0].options).toMatchObject({
      target: parentFrame,
      origin: 'https://hint.example',
    });
  });
});
