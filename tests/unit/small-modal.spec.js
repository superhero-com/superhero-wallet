import { shallowMount } from '@vue/test-utils';
import SmallModal from '../../src/popup/router/components/SmallModal.vue';

describe('SmallModal', () => {
  it('should close on button close click', async () => {
    const wrapper = shallowMount(SmallModal);
    await wrapper.find('.overlay').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('close')).toBeTruthy();
  });
  it('should have default slot', () => {
    const testPhrase = 'Slot Content';
    const wrapper = shallowMount(SmallModal, {
      slots: {
        default: testPhrase,
      },
    });

    expect(wrapper.text()).toContain(testPhrase);
  });
});
