import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import AssetSelector from '../../../../../src/popup/components/Modals/AssetSelector.vue';
import { PROTOCOLS } from '../../../../../src/constants';

const mockLoadAvailableTokens = jest.fn(async () => {});
const mockLoadSingleToken = jest.fn(async () => {});
const mockFetchAvailableTokensSearchPage = jest.fn(async (_searchTerm, searchBy) => ({
  data: searchBy === 'name'
    ? [{
      protocol: PROTOCOLS.aeternity,
      contractId: 'ct_remote_alpha',
      name: 'Alpha Remote',
      symbol: 'ALR',
    }]
    : [],
  next: null,
}));

const mockInitialAssets = [
  {
    protocol: PROTOCOLS.aeternity,
    contractId: 'ae',
    name: 'Aeternity',
    symbol: 'AE',
  },
  {
    protocol: PROTOCOLS.aeternity,
    contractId: 'ct_local_alpha',
    name: 'Alpha Local',
    symbol: 'ALP',
  },
  {
    protocol: PROTOCOLS.aeternity,
    contractId: 'ct_beta',
    name: 'Beta',
    symbol: 'BET',
  },
];

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await nextTick();
};

jest.mock('vue-i18n', () => ({
  useI18n: jest.fn(() => ({
    t: (key) => key,
  })),
}));

jest.mock('@/composables', () => ({
  useAccountAssetsList: jest.fn(({ searchTerm }) => ({
    accountAssetsFiltered: {
      get value() {
        const term = searchTerm.value.trim().toLowerCase();
        if (!term) {
          return mockInitialAssets;
        }

        return mockInitialAssets.filter(({ name, symbol }) => (
          name.toLowerCase().includes(term) || symbol.toLowerCase().includes(term)
        ));
      },
    },
  })),
  useFungibleTokens: jest.fn(() => ({
    loadAvailableTokens: mockLoadAvailableTokens,
    loadSingleToken: mockLoadSingleToken,
    isAvailableTokensLoading: { value: false },
  })),
}));

jest.mock('@/lib/ProtocolAdapterFactory', () => ({
  ProtocolAdapterFactory: {
    getAdapter: jest.fn(() => ({
      fetchAvailableTokensSearchPage: mockFetchAvailableTokensSearchPage,
    })),
  },
}));

const ModalStub = {
  template: '<div><slot name="header" /><slot /></div>',
};

const InputSearchStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: `
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    >
  `,
};

const InfiniteScrollStub = {
  props: ['items'],
  template: `
    <div>
      <slot
        v-for="(item, index) in items"
        :key="item.contractId"
        :item="item"
        :index="index"
      />
    </div>
  `,
};

const AssetListItemStub = {
  props: ['asset'],
  template: '<div class="asset-row">{{ asset.name }}</div>',
};

describe('AssetSelector', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  function mountComponent() {
    return mount(AssetSelector, {
      props: {
        resolve: jest.fn(),
        reject: jest.fn(),
        protocol: PROTOCOLS.aeternity,
      },
      global: {
        mocks: {
          $t: (key) => key,
        },
        stubs: {
          Modal: ModalStub,
          InputSearch: InputSearchStub,
          InfiniteScroll: InfiniteScrollStub,
          AssetListItem: AssetListItemStub,
          AnimatedSpinner: true,
        },
      },
    });
  }

  function getAssetNames(wrapper) {
    return wrapper.findAll('.asset-row').map((row) => row.text());
  }

  it('shows the first list again after a search is cleared', async () => {
    const wrapper = mountComponent();

    expect(getAssetNames(wrapper)).toEqual([
      'Aeternity',
      'Alpha Local',
      'Beta',
    ]);

    await wrapper.find('input').setValue('alp');
    jest.advanceTimersByTime(250);
    await flushPromises();

    expect(mockFetchAvailableTokensSearchPage).toHaveBeenCalledTimes(2);
    expect(getAssetNames(wrapper)).toEqual(['Alpha Local']);

    await wrapper.find('input').setValue('');
    await flushPromises();

    expect(getAssetNames(wrapper)).toEqual([
      'Aeternity',
      'Alpha Local',
      'Beta',
    ]);
    expect(mockLoadAvailableTokens).toHaveBeenCalledTimes(1);
  });
});
