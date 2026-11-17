import { flushPromises, mount } from '@vue/test-utils';

import BtnBase from '@/popup/components/buttons/BtnBase.vue';
import { useInAppBrowser } from '@/composables/inAppBrowser';

const platform = vi.hoisted(() => ({ IS_MOBILE_APP: true }));

vi.mock('@/constants', () => platform);
vi.mock('@/composables/inAppBrowser', () => ({ useInAppBrowser: vi.fn() }));

const href = 'https://example.com/';
let openInAppBrowser: ReturnType<typeof vi.fn>;
let windowOpen: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  platform.IS_MOBILE_APP = true;
  openInAppBrowser = vi.fn();
  vi.mocked(useInAppBrowser).mockReturnValue({ openInAppBrowser });
  windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('BtnBase link on mobile', () => {
  it('opens in the system browser', async () => {
    const wrapper = mount(BtnBase, { props: { href } });

    await wrapper.trigger('click');
    expect(windowOpen).toHaveBeenCalledWith(href, '_system');
    expect(openInAppBrowser).not.toHaveBeenCalled();
  });

  it('opens in the in-app browser when asked', async () => {
    const wrapper = mount(BtnBase, { props: { href, inAppBrowser: true } });

    await wrapper.trigger('click');
    await vi.waitFor(() => expect(openInAppBrowser).toHaveBeenCalledWith(href));
    expect(windowOpen).not.toHaveBeenCalled();
  });
});

describe('BtnBase link on web and in the extension', () => {
  it('is left to the browser to open in a new tab', async () => {
    platform.IS_MOBILE_APP = false;
    const wrapper = mount(BtnBase, { props: { href, inAppBrowser: true } });
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    expect(wrapper.element.tagName).toBe('A');
    expect(wrapper.attributes()).toMatchObject({ href, target: '_blank' });
    wrapper.element.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(false);
    expect(windowOpen).not.toHaveBeenCalled();
    await flushPromises();
    expect(openInAppBrowser).not.toHaveBeenCalled();
  });
});
