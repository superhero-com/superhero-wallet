import { shallowMount } from '@vue/test-utils';
import TokenAmount from '../../src/popup/components/TokenAmount.vue';

let wrapper;

describe('TokenAmount', () => {
  beforeEach(() => {
    wrapper = shallowMount(TokenAmount, {
      propsData: {
        amount: 111,
        hideFiat: true,
        direction: 'sent',
        large: false,
        noSymbol: true,
        highPrecision: false,
      },
      mocks: {
        $store: {
          state: {},
          getters: {},
        },
      },
    });
  });

  it('should match the snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
