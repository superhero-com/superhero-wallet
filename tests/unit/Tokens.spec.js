import { shallowMount } from '@vue/test-utils';
import Tokens from '../../src/popup/components/Tokens.vue';

let wrapper;

describe('Tokens', () => {
  beforeEach(() => {
    wrapper = shallowMount(Tokens, {
      propsData: {
        tokens: [{ symbol: 'test123', contractId: '1' }, { symbol: 'test456', contractId: '2' }],
        vertical: true,
      },
    });
  });

  it('should match the snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('should test getAvailableCharLength', async () => {
    const getAvailableCharLength = jest.spyOn(wrapper.vm, 'getAvailableCharLength');
    let length = wrapper.vm.getAvailableCharLength();
    expect(getAvailableCharLength).toHaveBeenCalled();
    expect(length).toEqual(5);
    await wrapper.setProps({
      symbolLength: 11,
      doubleSymbolLength: 5,
      tokens: [{ symbol: 'test' }, { symbol: 'test456' }],
      vertical: true,
    });
    length = wrapper.vm.getAvailableCharLength();
    expect(length).toEqual(7);
  });
});
