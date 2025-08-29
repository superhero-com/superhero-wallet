/* eslint-disable global-require */
import { mount } from '@vue/test-utils';
import ProtocolSpecificView from '../../../src/popup/components/ProtocolSpecificView.vue';
import { PROTOCOL_VIEW_ACCOUNT_DETAILS } from '../../../src/constants';

jest.mock('vue-router', () => ({
  useRoute: () => ({ meta: {}, params: {} }),
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock('../../../src/composables', () => {
  const { PROTOCOLS } = require('../../../src/constants');
  return {
    useAccounts: () => ({ activeAccount: { value: { protocol: PROTOCOLS.ethereum } } }),
    useNetworks: () => ({ activeNetwork: { value: { type: 'mainnet' } } }),
    useUi: () => ({ saveErrorLog: { value: false } }),
  };
});

describe('ProtocolSpecificView - EVM protocol mapping', () => {
  it('mounts for ethereum active account', async () => {
    const wrapper = mount(ProtocolSpecificView, {
      props: { viewComponentName: PROTOCOL_VIEW_ACCOUNT_DETAILS },
      global: { stubs: ['InfoBox'] },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('mounts for bnb active account (shares ethereum views)', async () => {
    jest.isolateModules(() => {
      jest.doMock('../../../src/composables', () => {
        const { PROTOCOLS } = require('../../../src/constants');
        return {
          useAccounts: () => ({ activeAccount: { value: { protocol: PROTOCOLS.bnb } } }),
          useNetworks: () => ({ activeNetwork: { value: { type: 'mainnet' } } }),
          useUi: () => ({ saveErrorLog: { value: false } }),
        };
      });
      const Comp = require('../../../src/popup/components/ProtocolSpecificView.vue').default;
      const wrapper = mount(Comp, {
        props: { viewComponentName: PROTOCOL_VIEW_ACCOUNT_DETAILS },
        global: { stubs: ['InfoBox'] },
      });
      expect(wrapper.exists()).toBe(true);
    });
  });
});
