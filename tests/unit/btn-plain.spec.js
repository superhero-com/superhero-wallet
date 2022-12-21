import { shallowMount } from '@vue/test-utils';
import BtnPlain from '../../src/popup/components/buttons/BtnPlain.vue';

describe('BtnPlain', () => {
  it('should have default slot', async () => {
    const testPhrase = 'Slot Content';
    const wrapper = shallowMount(BtnPlain, {
      slots: {
        default: testPhrase,
      },
    });
    expect(wrapper.find('.button-plain').text()).toContain(testPhrase);
  });
});
