import { shallowMount } from '@vue/test-utils';
import DashboardHeader from '../../src/popup/components/DashboardHeader.vue';

jest.mock('../../src/composables/accounts.ts', () => ({
  useAccounts: jest.fn(() => ({
    accounts: [],
    protocolsInUse: [],
  })),
}));

describe('Dashboard header', () => {
  it('should render', () => {
    const wrapper = shallowMount(DashboardHeader, {
      global: {
        mocks: {
          $route: {
            meta: {
              isMultisigPage: false,
            },
          },
        },
      },
    });
    expect(wrapper.find('.dashboard-header').exists()).toBeTruthy();
  });
});
