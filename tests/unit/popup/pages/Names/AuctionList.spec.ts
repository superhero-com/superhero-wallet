// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';
import en from '@/popup/locales/en-US.json';

/**
 * The page loads the active auctions from the middleware when it opens.
 * Runs the real page and middleware composable; fakes the middleware responses.
 */
const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
const SlotStub = { template: '<div><slot /></div>' };

describe('AuctionList page', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.doMock('@/composables/topHeader', () => ({
      useTopHeaderData: () => ({ topBlockHeight: ref(0) }),
    }));
    await import('@/protocols/registerAdapters');
  });

  afterEach(() => {
    vi.doUnmock('@/composables/topHeader');
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('stops the spinner when the middleware fails', async () => {
    const pendingRequests = [];
    vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => { pendingRequests.push(resolve); })));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { default: AuctionList } = await import('@/popup/pages/Names/AuctionList.vue');
    const wrapper = mount(AuctionList, {
      global: {
        plugins: [i18n],
        stubs: {
          IonPage: SlotStub,
          IonToolbar: SlotStub,
          IonContent: SlotStub,
          Filters: true,
          NameAuctionListItem: true,
          AnimatedSpinner: { template: '<i class="spinner" />' },
          RegisterName: { template: '<p class="no-auctions" />' },
        },
      },
    });
    await flushPromises();
    expect(wrapper.find('.spinner').exists()).toBe(true);

    pendingRequests.forEach((respond) => respond(
      new Response('Internal Server Error', { status: 500 }),
    ));
    await flushPromises();

    expect(wrapper.find('.spinner').exists()).toBe(false);
    expect(wrapper.find('.no-auctions').exists()).toBe(true);
    expect(warn).toHaveBeenCalledWith('Unknown rejection', expect.objectContaining({ statusCode: 500 }));
  });
});
