// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils';
import About from '@/popup/pages/About.vue';

/**
 * The page shows the versions of the æternity middleware and node it talks to.
 * Runs the real page and network settings; fakes the status requests.
 */
function stubStatuses({ middleware, node }) {
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (url.endsWith('/mdw/status')) return middleware;
    if (url.endsWith('/v3/status')) return node;
    throw new Error(`Unexpected request ${url}`);
  }));
}

function mountAbout() {
  return mount(About, {
    global: {
      mocks: { $t: (key) => key },
      stubs: {
        PageWrapper: { template: '<div><slot /></div>' },
        Panel: { template: '<div><slot /></div>' },
        PanelItem: true,
        PanelTableItem: {
          props: ['name'],
          template: '<p :data-cy="name"><slot /></p>',
        },
      },
    },
  });
}

describe('About page', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows the middleware and node versions', async () => {
    stubStatuses({
      middleware: new Response(JSON.stringify({ mdw_version: '1.108.3' }), { status: 200 }),
      node: new Response(JSON.stringify({ node_version: '7.3.0' }), { status: 200 }),
    });

    const wrapper = mountAbout();
    await flushPromises();

    expect(wrapper.find('[data-cy="pages.about.middleware-version"]').text()).toBe('1.108.3');
    expect(wrapper.find('[data-cy="pages.about.node-version"]').text()).toBe('7.3.0');
  });

  it('shows the middleware version when the node status fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    stubStatuses({
      middleware: new Response(JSON.stringify({ mdw_version: '1.108.3' }), { status: 200 }),
      node: new Response('Service Unavailable', { status: 503 }),
    });

    const wrapper = mountAbout();
    await flushPromises();

    expect(wrapper.find('[data-cy="pages.about.middleware-version"]').text()).toBe('1.108.3');
    expect(wrapper.find('[data-cy="pages.about.node-version"]').exists()).toBe(false);
    expect(warn).toHaveBeenCalledWith('Unknown rejection', expect.objectContaining({ statusCode: 503 }));
  });

  it('shows the node version when the middleware status fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    stubStatuses({
      middleware: new Response('Service Unavailable', { status: 503 }),
      node: new Response(JSON.stringify({ node_version: '7.3.0' }), { status: 200 }),
    });

    const wrapper = mountAbout();
    await flushPromises();

    expect(wrapper.find('[data-cy="pages.about.node-version"]').text()).toBe('7.3.0');
    expect(wrapper.find('[data-cy="pages.about.middleware-version"]').exists()).toBe(false);
    expect(warn).toHaveBeenCalledWith('Unknown rejection', expect.objectContaining({ statusCode: 503 }));
  });
});
