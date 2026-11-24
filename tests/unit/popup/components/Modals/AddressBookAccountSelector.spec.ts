import { nextTick } from 'vue';
import { enableAutoUnmount, mount } from '@vue/test-utils';
import { PROTOCOLS } from '@/constants';
import { i18n } from '@/popup/plugins/i18n';
import AddressBookAccountSelector from '@/popup/components/Modals/AddressBookAccountSelector.vue';
import AddressBookList from '@/popup/components/AddressBook/AddressBookList.vue';

const CHECKSUM = '0x5F00d657054991f0cb23Ce9EbAf073133a130762';
const LOWER = CHECKSUM.toLowerCase();
const OTHER = '0x909C407d6FD235DE14db97e2234fCB71E99d6E1c';
const AE = 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5';

const BtnMainStub = {
  props: ['disabled', 'text'],
  emits: ['click'],
  template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ text }}</button>',
};

enableAutoUnmount(afterEach);

function mountSelector(preSelectedAddresses: string[], protocol: string = PROTOCOLS.ethereum) {
  const resolve = vi.fn();
  const wrapper = mount(AddressBookAccountSelector, {
    props: {
      resolve,
      reject: vi.fn(),
      allowMultiple: true,
      preSelectedAddresses,
      protocol: protocol as any,
    },
    global: {
      plugins: [i18n],
      stubs: {
        Modal: { template: '<div><slot /><slot name="footer" /></div>' },
        IonPage: { template: '<div><slot /></div>' },
        AddressBookList: true,
        Tabs: true,
        Tab: true,
        BtnMain: BtnMainStub,
      },
    },
  });
  const list = wrapper.findComponent(AddressBookList);
  return { wrapper, resolve, list };
}

describe('AddressBookAccountSelector with recipients typed in another case', () => {
  it('shows them selected as their entries', () => {
    const { list } = mountSelector([LOWER, OTHER.toLowerCase()]);

    expect(list.props('isMultiple')).toBe(true);
    expect(list.props('selectedAddresses')).toEqual([CHECKSUM, OTHER]);
  });

  it('unselects one by its entry instead of adding the entry', async () => {
    const { wrapper, resolve, list } = mountSelector([LOWER, OTHER]);

    list.vm.$emit('select-address', CHECKSUM);
    await nextTick();
    await wrapper.get('[data-cy=submit]').trigger('click');

    expect(resolve).toHaveBeenCalledWith([OTHER]);
  });

  it('keeps them as typed next to an added entry', async () => {
    const { wrapper, resolve, list } = mountSelector([LOWER, AE]);

    list.vm.$emit('select-address', OTHER);
    await nextTick();
    await wrapper.get('[data-cy=submit]').trigger('click');

    expect(resolve).toHaveBeenCalledWith([LOWER, AE, OTHER]);
  });

  it('gives them back as typed on cancel', async () => {
    const { wrapper, resolve } = mountSelector([LOWER, OTHER]);

    await wrapper.get('[data-cy=cancel]').trigger('click');

    expect(resolve).toHaveBeenCalledWith([LOWER, OTHER]);
  });

  it('keeps aeternity addresses and names as they are', () => {
    const { list } = mountSelector([AE, 'superhero.chain'], PROTOCOLS.aeternity);

    expect(list.props('selectedAddresses')).toEqual([AE, 'superhero.chain']);
  });
});
