import { mount } from '@vue/test-utils';
import TermsOfService from '../../src/popup/pages/TermsOfService.vue';

describe('TermsOfService', () => {
  it('opens and closes accordion', async () => {
    const wrapper = mount(TermsOfService, {
      global: {
        stubs: { IonPage: false, IonContent: false },
        mocks: { $t: () => 'Lorem ipsum' },
      },
    });

    expect(wrapper.find('[data-cy=accordion-item-content]').exists()).toBe(false);
    await wrapper.find('[data-cy=accordion-item-label]:nth-child(1)').trigger('click');
    expect(wrapper.find('[data-cy=accordion-item-content]').exists()).toBe(true);
  });
});
