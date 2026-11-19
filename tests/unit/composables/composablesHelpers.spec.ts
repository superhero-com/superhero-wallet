import {
  defineComponent,
  h,
  ref,
  type Ref,
} from 'vue';
import { mount } from '@vue/test-utils';
import { createIonPage, setIonPageHidden } from '../helpers/ionPage';

const INTERVAL = 10000;

const isOnline = ref(true);
const isAppActive = ref(true);

type PollingWatcher = (callback: () => void) => void;

function mountWithSetup(setup: () => void, attachTo?: Element, render: () => any = () => h('div')) {
  return mount(defineComponent({
    setup() {
      setup();
      return {};
    },
    render,
  }), { attachTo });
}

describe('createPollingBasedOnMountedComponents', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
    isOnline.value = true;
    isAppActive.value = true;
    vi.doMock('@/composables/connection', () => ({ useConnection: () => ({ isOnline }) }));
    vi.doMock('@/composables/ui', () => ({ useUi: () => ({ isAppActive }) }));
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  async function createPollingWatcher(): Promise<PollingWatcher> {
    const { createPollingBasedOnMountedComponents } = await import('@/composables/composablesHelpers');
    return createPollingBasedOnMountedComponents(INTERVAL);
  }

  function mountConsumer(
    pollingWatcher: PollingWatcher,
    callback: () => void,
    attachTo?: Element,
    render: () => any = () => h('div'),
  ) {
    return mountWithSetup(() => pollingWatcher(callback), attachTo, render);
  }

  it('calls immediately on mount, then every interval until unmounted', async () => {
    const pollingWatcher = await createPollingWatcher();
    const callback = vi.fn();
    const wrapper = mountConsumer(pollingWatcher, callback, createIonPage());

    expect(callback).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(INTERVAL * 2);
    expect(callback).toHaveBeenCalledTimes(3);

    wrapper.unmount();
    vi.advanceTimersByTime(INTERVAL * 2);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('polls once for several components until the last one is unmounted', async () => {
    const pollingWatcher = await createPollingWatcher();
    const callback = vi.fn();
    const page = createIonPage();
    const wrapperA = mountConsumer(pollingWatcher, callback, page);
    const wrapperB = mountConsumer(pollingWatcher, callback, page);

    expect(callback).toHaveBeenCalledTimes(1);

    wrapperA.unmount();
    vi.advanceTimersByTime(INTERVAL);
    expect(callback).toHaveBeenCalledTimes(2);

    wrapperB.unmount();
    vi.advanceTimersByTime(INTERVAL);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('polls for components outside of Ionic pages', async () => {
    const pollingWatcher = await createPollingWatcher();
    const callback = vi.fn();
    mountConsumer(pollingWatcher, callback, document.body);

    vi.advanceTimersByTime(INTERVAL);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('pauses while the page is hidden and calls at once when shown after the interval', async () => {
    const pollingWatcher = await createPollingWatcher();
    const callback = vi.fn();
    const page = createIonPage();
    mountConsumer(pollingWatcher, callback, page);

    await setIonPageHidden(page, true);
    vi.advanceTimersByTime(INTERVAL * 3);
    expect(callback).toHaveBeenCalledTimes(1);

    await setIonPageHidden(page, false);
    expect(callback).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(INTERVAL);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('keeps the interval when the page is shown again before it passes', async () => {
    const pollingWatcher = await createPollingWatcher();
    const callback = vi.fn();
    const page = createIonPage();
    mountConsumer(pollingWatcher, callback, page);

    vi.advanceTimersByTime(2000);
    await setIonPageHidden(page, true);
    vi.advanceTimersByTime(3000);
    await setIonPageHidden(page, false);
    expect(callback).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(INTERVAL - 5000 - 1);
    expect(callback).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(INTERVAL);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('stays paused when the page is hidden again before the delayed call', async () => {
    const pollingWatcher = await createPollingWatcher();
    const callback = vi.fn();
    const page = createIonPage();
    mountConsumer(pollingWatcher, callback, page);

    await setIonPageHidden(page, true);
    await setIonPageHidden(page, false);
    await setIonPageHidden(page, true);
    vi.advanceTimersByTime(INTERVAL * 2);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('keeps a single polling when another component mounts before the delayed call', async () => {
    const pollingWatcher = await createPollingWatcher();
    const callback = vi.fn();
    const page = createIonPage();
    mountConsumer(pollingWatcher, callback, page);

    await setIonPageHidden(page, true);
    await setIonPageHidden(page, false);
    mountConsumer(pollingWatcher, callback, createIonPage());
    vi.advanceTimersByTime(INTERVAL * 2);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('waits no longer than the interval when the clock is set back', async () => {
    const pollingWatcher = await createPollingWatcher();
    const callback = vi.fn();
    const page = createIonPage();
    mountConsumer(pollingWatcher, callback, page);

    await setIonPageHidden(page, true);
    vi.setSystemTime(Date.now() - INTERVAL * 100);
    await setIonPageHidden(page, false);
    vi.advanceTimersByTime(INTERVAL);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('pauses when an outer page of a nested router outlet is hidden', async () => {
    const pollingWatcher = await createPollingWatcher();
    const callback = vi.fn();
    const outerPage = createIonPage();
    mountConsumer(pollingWatcher, callback, createIonPage(outerPage));

    await setIonPageHidden(outerPage, true);
    vi.advanceTimersByTime(INTERVAL * 2);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('keeps polling while a component on a visible page is mounted', async () => {
    const pollingWatcher = await createPollingWatcher();
    const callback = vi.fn();
    const hiddenPage = createIonPage();
    mountConsumer(pollingWatcher, callback, hiddenPage);
    mountConsumer(pollingWatcher, callback, createIonPage());

    await setIonPageHidden(hiddenPage, true);
    vi.advanceTimersByTime(INTERVAL);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('counts a component on a hidden page only once when it is unmounted', async () => {
    const pollingWatcher = await createPollingWatcher();
    const callback = vi.fn();
    const hiddenPage = createIonPage();
    const hiddenWrapper = mountConsumer(pollingWatcher, callback, hiddenPage);
    const visibleWrapper = mountConsumer(pollingWatcher, callback, createIonPage());

    await setIonPageHidden(hiddenPage, true);
    hiddenWrapper.unmount();
    vi.advanceTimersByTime(INTERVAL);
    expect(callback).toHaveBeenCalledTimes(2);

    visibleWrapper.unmount();
    vi.advanceTimersByTime(INTERVAL);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('does not start polling for a component mounted on a hidden page', async () => {
    const pollingWatcher = await createPollingWatcher();
    const callback = vi.fn();
    const page = createIonPage();
    page.classList.add('ion-page-hidden');
    mountConsumer(pollingWatcher, callback, page);

    vi.advanceTimersByTime(INTERVAL);
    expect(callback).not.toHaveBeenCalled();

    await setIonPageHidden(page, false);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('finds the page of a component that renders no element', async () => {
    const pollingWatcher = await createPollingWatcher();
    const callback = vi.fn();
    const page = createIonPage();
    mountConsumer(pollingWatcher, callback, page, () => null);

    await setIonPageHidden(page, true);
    vi.advanceTimersByTime(INTERVAL);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('skips calls while offline and makes the first call once back online', async () => {
    const pollingWatcher = await createPollingWatcher();
    const callback = vi.fn();
    isOnline.value = false;
    mountConsumer(pollingWatcher, callback, createIonPage());

    vi.advanceTimersByTime(INTERVAL);
    expect(callback).not.toHaveBeenCalled();

    isOnline.value = true;
    vi.advanceTimersByTime(INTERVAL);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('skips calls while the app is inactive', async () => {
    const pollingWatcher = await createPollingWatcher();
    const callback = vi.fn();
    isAppActive.value = false;
    mountConsumer(pollingWatcher, callback, createIonPage());

    vi.advanceTimersByTime(INTERVAL);
    expect(callback).not.toHaveBeenCalled();

    isAppActive.value = true;
    vi.advanceTimersByTime(INTERVAL);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does nothing outside of a component', async () => {
    const pollingWatcher = await createPollingWatcher();
    const callback = vi.fn();
    pollingWatcher(callback);

    vi.advanceTimersByTime(INTERVAL);
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('usePageVisibility', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock('@/composables/connection', () => ({ useConnection: () => ({ isOnline }) }));
    vi.doMock('@/composables/ui', () => ({ useUi: () => ({ isAppActive }) }));
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function mountWithVisibility(attachTo?: Element) {
    const { usePageVisibility } = await import('@/composables/composablesHelpers');
    let isPageVisible: Ref<boolean> | undefined;
    mountWithSetup(() => {
      isPageVisible = usePageVisibility();
    }, attachTo);
    return isPageVisible!;
  }

  it('follows the page and the outer pages of nested router outlets', async () => {
    const outerPage = createIonPage();
    const page = createIonPage(outerPage);
    const isPageVisible = await mountWithVisibility(page);
    expect(isPageVisible.value).toBe(true);

    await setIonPageHidden(outerPage, true);
    expect(isPageVisible.value).toBe(false);
    await setIonPageHidden(outerPage, false);
    expect(isPageVisible.value).toBe(true);
    await setIonPageHidden(page, true);
    expect(isPageVisible.value).toBe(false);
  });

  it('is hidden when mounted on a hidden page', async () => {
    const page = createIonPage();
    page.classList.add('ion-page-hidden');

    expect((await mountWithVisibility(page)).value).toBe(false);
  });

  it('is visible outside of Ionic pages and outside of a component', async () => {
    expect((await mountWithVisibility(document.body)).value).toBe(true);
    const { usePageVisibility } = await import('@/composables/composablesHelpers');
    expect(usePageVisibility().value).toBe(true);
  });
});
