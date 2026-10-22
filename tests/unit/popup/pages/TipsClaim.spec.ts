// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';
import en from '@/popup/locales/en-US.json';
import { MODAL_CLAIM_SUCCESS } from '@/constants';

/**
 * Claiming tips posts the URL to the tipping backend. Runs the real page and backend
 * composable; fakes the backend responses, the tipping contract and the UI state.
 */
const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
const ACCOUNT = { protocol: 'aeternity', address: 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR' };
const TIP_URL = 'https://example.com/';

const BtnMainStub = {
  props: ['disabled'],
  emits: ['click'],
  template: '<button data-cy="confirm" :disabled="disabled" @click="$emit(\'click\')" />',
};
const InputFieldStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<input data-cy="url" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
};

describe('TipsClaim page', () => {
  let routerPush;
  let openModal;
  let openDefaultModal;

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    routerPush = vi.fn();
    openModal = vi.fn();
    openDefaultModal = vi.fn();

    const mockModule = (path, mocks) => vi.doMock(path, () => mocks);
    mockModule('vue-router', { useRouter: () => ({ push: routerPush }) });
    mockModule('@/composables/tippingContracts', {
      useTippingContracts: () => ({
        getTippingContracts: async () => ({
          tippingV1: {
            unclaimed_for_url: async () => ({ decodedResult: 10n ** 18n }),
          },
        }),
      }),
    });
    mockModule('@/composables/aeSdk', { useAeSdk: () => ({ isTippingSupported: ref(true) }) });
    mockModule('@/composables/accounts', { useAccounts: () => ({ activeAccount: ref(ACCOUNT) }) });
    mockModule('@/composables/modals', { useModals: () => ({ openModal, openDefaultModal }) });
    mockModule('@/composables/ui', { useUi: () => ({ setLoaderVisible: vi.fn() }) });
    await import('@/protocols/registerAdapters');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubClaimResponse(response) {
    vi.stubGlobal('fetch', vi.fn(async (url) => (
      url.endsWith('/claim/submit') ? response : new Response('{}', { status: 200 })
    )));
  }

  /** Resolves the error the page passes on, if any */
  async function claim() {
    let passedOnError;
    const { default: TipsClaim } = await import('@/popup/pages/TipsClaim.vue');
    const wrapper = mount(TipsClaim, {
      global: {
        plugins: [i18n],
        config: { errorHandler: (error) => { passedOnError = error; } },
        stubs: {
          PageWrapper: { template: '<div><slot /></div>' },
          AccountInfo: true,
          BtnHelp: true,
          InputField: InputFieldStub,
          BtnMain: BtnMainStub,
        },
      },
    });
    await wrapper.find('[data-cy=url]').setValue(TIP_URL);
    await wrapper.find('[data-cy=confirm]').trigger('click');
    await flushPromises();
    return passedOnError;
  }

  it('shows the claim success and leaves the page', async () => {
    stubClaimResponse(new Response(JSON.stringify({ claimUUID: 'uuid' }), { status: 200 }));

    expect(await claim()).toBeUndefined();

    expect(openModal).toHaveBeenCalledWith(MODAL_CLAIM_SUCCESS, { url: TIP_URL, claimAmount: 1 });
    expect(routerPush).toHaveBeenCalled();
    expect(openDefaultModal).not.toHaveBeenCalled();
  });

  it('shows the error of the backend and stays on the page', async () => {
    stubClaimResponse(new Response(
      JSON.stringify({ error: 'MORE_ORACLES_NEEDED' }),
      { status: 500 },
    ));

    expect(await claim()).toBeUndefined();

    expect(openDefaultModal).toHaveBeenCalledWith({ msg: en.pages.claim.moreOracles });
    expect(openModal).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('passes on a backend failure without a message, with the URL', async () => {
    stubClaimResponse(new Response(null, { status: 502 }));

    expect(await claim()).toMatchObject({ statusCode: 502, payload: { url: TIP_URL } });
    expect(openModal).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('passes on a backend failure with an error that is not a message', async () => {
    stubClaimResponse(new Response(
      JSON.stringify({ error: { code: 'UNKNOWN' } }),
      { status: 500 },
    ));

    expect(await claim()).toMatchObject({ statusCode: 500, payload: { url: TIP_URL } });
    expect(openDefaultModal).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
  });
});
