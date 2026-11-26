// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';
import en from '@/popup/locales/en-US.json';

/**
 * The comment backend checks the challenge signature against the author, and the
 * wallet signs with the active account, so the chosen author has to become active.
 * Runs the real page and account selector; mocks the account store, signing and backend.
 */
const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
const ACCOUNTS = [
  { protocol: 'aeternity', address: 'ak_first', idx: 0 },
  { protocol: 'aeternity', address: 'ak_second', idx: 1 },
];
const COMMENT_API = 'https://backend/comment/api/';

const BtnMainStub = {
  props: ['disabled'],
  emits: ['click'],
  template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
};
const SlotStub = { template: '<div><slot /></div>' };

describe('CommentNew page', () => {
  let postJson;

  beforeEach(async () => {
    vi.resetModules();
    postJson = vi.fn().mockResolvedValue({ challenge: 'challenge' });

    let activeAccount = ACCOUNTS[0];
    const aeAccountsSelectOptions = ref([]);
    const getAccountByProtocolAndAddress = (protocol, address) => ACCOUNTS
      .find((account) => account.protocol === protocol && account.address === address);

    const mockComposable = (path, mocks) => vi.doMock(path, () => mocks);
    mockComposable('vue-router', {
      useRoute: () => ({ query: { id: '1_v1', text: 'Nice tip' } }),
      useRouter: () => ({ push: vi.fn() }),
    });
    mockComposable('@/composables/accounts', {
      useAccounts: () => ({
        aeAccountsSelectOptions,
        getAccountByProtocolAndAddress,
        getLastActiveProtocolAccount: () => activeAccount,
        setActiveAccountByAddressAndProtocol: (address, protocol) => {
          activeAccount = getAccountByProtocolAndAddress(protocol, address);
        },
      }),
    });
    mockComposable('@/composables/aeSdk', {
      useAeSdk: () => ({
        getAeSdk: async () => ({}),
        fetchRespondChallenge: async ({ challenge }) => ({
          challenge,
          signature: `signed by ${activeAccount?.address}`,
        }),
        isTippingSupported: ref(true),
      }),
    });
    mockComposable('@/composables/modals', {
      useModals: () => ({
        // The user picks the second account
        openModal: async (name, { options }) => options[1].value,
        openDefaultModal: vi.fn(),
      }),
    });
    mockComposable('@/composables/deepLinkApi', {
      useDeepLinkApi: () => ({ openCallbackOrGoHome: vi.fn() }),
    });
    mockComposable('@/composables/ui', { useUi: () => ({ setLoaderVisible: vi.fn() }) });
    mockComposable('@/protocols/aeternity/composables/aeNetworkSettings', {
      useAeNetworkSettings: () => ({ aeActiveNetworkSettings: ref({ backendUrl: 'https://backend' }) }),
    });
    vi.doMock('@/utils', async (importOriginal) => ({ ...(await importOriginal()), postJson }));
    await import('@/protocols/registerAdapters');

    const { prepareAccountSelectOptions } = await import('@/utils');
    aeAccountsSelectOptions.value = prepareAccountSelectOptions(ACCOUNTS);
  });

  it('signs the comment with the account chosen as its author', async () => {
    const { default: CommentNew } = await import('@/popup/pages/CommentNew.vue');
    const wrapper = mount(CommentNew, {
      global: {
        plugins: [i18n],
        stubs: {
          Avatar: true,
          AddressTruncated: true,
          Truncate: true,
          BtnMain: BtnMainStub,
          PageWrapper: SlotStub,
          FixedScreenFooter: SlotStub,
        },
      },
    });
    await flushPromises();

    await wrapper.find('.form-select').trigger('click');
    await flushPromises();
    await wrapper.findAll('button')
      .find((button) => button.text() === en.common.confirm)
      .trigger('click');
    await flushPromises();

    expect(postJson).toHaveBeenNthCalledWith(1, COMMENT_API, {
      body: expect.objectContaining({ author: 'ak_second' }),
    });
    expect(postJson).toHaveBeenNthCalledWith(2, COMMENT_API, {
      body: { challenge: 'challenge', signature: 'signed by ak_second' },
    });
  });
});
