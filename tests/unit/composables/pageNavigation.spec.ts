const { navigate, route } = vi.hoisted(() => ({
  navigate: vi.fn(),
  route: {
    fullPath: '/',
    meta: {} as Record<string, unknown>,
    params: {} as Record<string, string>,
  },
}));

vi.mock('@ionic/vue', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@ionic/vue')>()),
  useIonRouter: () => ({ navigate }),
}));
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => route,
}));
vi.mock('@/composables/accounts', async () => {
  const { ref } = await import('vue');
  return { useAccounts: () => ({ isLoggedIn: ref(true) }) };
});
vi.mock('@/composables/ui', async () => {
  const { ref } = await import('vue');
  return { useUi: () => ({ homeRouteName: ref('account') }) };
});

function openPage(fullPath: string, meta: Record<string, unknown> = {}, params = {}) {
  Object.assign(route, { fullPath, meta, params });
}

/** The setup's registerAdapters loads the composables, so load it again with the mocks. */
async function navigateBack() {
  const { usePageNavigation } = await import('@/composables/pageNavigation');
  usePageNavigation().navigateBack();
}

describe('usePageNavigation navigateBack', () => {
  beforeEach(() => {
    vi.resetModules();
    navigate.mockClear();
  });

  it('goes to the back route of the page', async () => {
    openPage('/account-details/transactions/th_1/ak_1', { backRoute: { name: 'account-details' } });
    await navigateBack();

    expect(navigate).toHaveBeenCalledExactlyOnceWith({ name: 'account-details' }, 'back', 'push');
  });

  it('goes to the back route the page gives for its params', async () => {
    openPage(
      '/coins/aeternity/transactions/th_1/ak_1',
      { backRoute: ({ params }: typeof route) => ({ name: 'coin', params: { id: params.id } }) },
      { id: 'aeternity' },
    );
    await navigateBack();

    expect(navigate).toHaveBeenCalledExactlyOnceWith(
      { name: 'coin', params: { id: 'aeternity' } },
      'back',
      'push',
    );
  });

  it('goes to the parent path without a back route', async () => {
    openPage('/more/about/');
    await navigateBack();

    expect(navigate).toHaveBeenCalledExactlyOnceWith('/more', 'back', 'push');
  });
});
