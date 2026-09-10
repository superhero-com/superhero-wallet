import { mount } from '@vue/test-utils';
import { ref } from 'vue';

import NamesList from '@/popup/pages/Names/NamesList.vue';

const pollCallbacks = [];

vi.mock('@/utils', () => ({
  executeAndSetInterval: vi.fn((callback) => {
    pollCallbacks.push(callback);
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

function mountNamesList() {
  return mount(NamesList, {
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
}

describe('NamesList.vue', () => {
  beforeEach(() => {
    pollCallbacks.length = 0;
  });

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

    const wrapper = mountNamesList();

    const renderedItems = wrapper.findAll('.name-item-stub');
    expect(renderedItems).toHaveLength(1);
    expect(renderedItems[0].text()).toBe('verylongsupername.chain|false');
  });

  it('skips a poll tick while a fetch is still running, and resumes once it lands', async () => {
    // Runs do not coalesce, so an unguarded tick stacks a full account fan-out on top
    // of every one still going. The flag must also let the poll resume afterwards.
    const areNamesFetching = ref(false);
    const updateOwnedNames = vi.fn();
    useUi.mockReturnValue({ isAppActive: ref(true) });
    useAccounts.mockReturnValue({ activeAccount: ref({ address: 'ak_test' }) });
    useAeSdk.mockReturnValue({ nodeNetworkId: ref('ae_testnet') });
    useAeNames.mockReturnValue({
      areNamesFetching,
      ownedNames: ref([]),
      preclaimedNames: ref({}),
      updateOwnedNames,
    });

    mountNamesList();
    const [poll] = pollCallbacks;
    expect(updateOwnedNames).toHaveBeenCalledTimes(1);

    areNamesFetching.value = true;
    poll();
    expect(updateOwnedNames).toHaveBeenCalledTimes(1);

    areNamesFetching.value = false;
    poll();
    expect(updateOwnedNames).toHaveBeenCalledTimes(2);
  });
});
