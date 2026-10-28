// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import AccountImportRow from '@/popup/components/AccountImportRow.vue';

const account = { protocol: 'aeternity', address: 'ak_import' };

function mountRow() {
  return mount(AccountImportRow, {
    props: { account },
    global: {
      stubs: {
        AccountSelectOptionsItem: {
          name: 'AccountSelectOptionsItem',
          props: ['outsideBalance'],
          template: '<div />',
        },
      },
    },
  });
}

describe('AccountImportRow', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the fetched balance', async () => {
    vi.spyOn(ProtocolAdapterFactory.getAdapter('aeternity'), 'fetchBalance').mockResolvedValue('1.5');

    const wrapper = mountRow();
    await flushPromises();

    expect(wrapper.findComponent({ name: 'AccountSelectOptionsItem' }).props('outsideBalance')).toBe(1.5);
  });

  it('shows 0 and logs when the balance fetch fails', async () => {
    const error = new Error('Network Error');
    vi.spyOn(ProtocolAdapterFactory.getAdapter('aeternity'), 'fetchBalance').mockRejectedValue(error);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const wrapper = mountRow();
    await flushPromises();

    expect(wrapper.findComponent({ name: 'AccountSelectOptionsItem' }).props('outsideBalance')).toBe(0);
    expect(warnSpy).toHaveBeenCalledWith('Unknown rejection', error);
  });
});
