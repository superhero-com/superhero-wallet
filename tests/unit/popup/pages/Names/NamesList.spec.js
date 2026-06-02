import { mount } from '@vue/test-utils';
import { ref } from 'vue';

import NamesList from '@/popup/pages/Names/NamesList.vue';

vi.mock('@/utils', () => ({
  executeAndSetInterval: vi.fn((callback) => {
    callback();
    return 1;
  }),
}));

vi.mock('@/composables', () => ({
  useAccounts: vi.fn(),
  useAeSdk: vi.fn(),
  useUi: vi.fn(),
}));

vi.mock('@/protocols/aeternity/composables/aeNames', () => ({
  useAeNames: vi.fn(),
}));

const { useAccounts, useAeSdk, useUi } = (await import('@/composables'));
const { useAeNames } = (await import('@/protocols/aeternity/composables/aeNames'));

describe('NamesList.vue', () => {
  it('prefers the owned name entry when pointer update is still pending', async () => {
    useUi.mockReturnValue({
      isAppActive: ref(true),
    });
    useAccounts.mockReturnValue({
      activeAccount: ref({ address: 'ak_test' }),
    });
    useAeSdk.mockReturnValue({
      nodeNetworkId: ref('ae_testnet'),
    });
    useAeNames.mockReturnValue({
      areNamesFetching: ref(false),
      ownedNames: ref([{
        owner: 'ak_test',
        name: 'verylongsupername.chain',
        hash: 'nm_test',
        pointers: { accountPubkey: 'ak_test' },
        autoExtend: false,
        pending: false,
        createdAtHeight: 1,
        expiresAt: 100,
      }]),
      preclaimedNames: ref({
        ae_testnet: {
          'verylongsupername.chain': {
            address: 'ak_test',
            name: 'verylongsupername.chain',
            salt: 123,
            blockHeight: 10,
            autoExtend: false,
            status: 'pointer-update-pending',
            claimTxHash: 'th_test',
          },
        },
      }),
      updateOwnedNames: vi.fn(),
    });

    const wrapper = mount(NamesList, {
      global: {
        stubs: {
          IonPage: { template: '<div><slot /></div>' },
          IonContent: { template: '<div><slot /></div>' },
          RegisterName: true,
          AnimatedSpinner: true,
          NameItem: {
            props: ['nameEntry'],
            template: '<div class="name-item-stub">{{ nameEntry.name }}|{{ String(!!nameEntry.pending) }}</div>',
          },
        },
        mocks: {
          $t: (key) => key,
        },
      },
    });

    const renderedItems = wrapper.findAll('.name-item-stub');
    expect(renderedItems).toHaveLength(1);
    expect(renderedItems[0].text()).toBe('verylongsupername.chain|false');
  });
});
