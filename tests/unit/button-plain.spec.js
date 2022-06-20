import { shallowMount } from '@vue/test-utils';
import ButtonPlain from '../../src/popup/router/components/ButtonPlain.vue';

describe('ButtonPlain', () => {
  it('should have default slot', async () => {
    const testPhrase = 'Slot Content';
    const wrapper = shallowMount(ButtonPlain, {
      slots: {
        default: testPhrase,
      },
    });
    expect(wrapper.find('.button-plain').text()).toContain(testPhrase);
  });
});
