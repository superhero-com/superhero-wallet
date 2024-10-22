import { mount } from '@vue/test-utils';
import ProtocolSpecificView from '../../../../src/popup/components/ProtocolSpecificView.vue';
import { PROTOCOL_VIEW_ACCOUNT_DETAILS } from '../../../../src/constants';

let mockActiveProtocol = 'ethereum';

jest.mock('vue-router', () => ({
  useRoute: () => ({ meta: {}, params: {} }),
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock('@ionic/vue', () => ({
  IonRouterOutlet: { template: '<div><slot /></div>' },
  IonPage: { template: '<div><slot /></div>' },
  isPlatform: jest.fn(() => false),
  useIonRouter: () => ({ navigate: jest.fn() }),
  onIonViewDidEnter: jest.fn(),
  onIonViewDidLeave: jest.fn(),
  onIonViewWillEnter: jest.fn(),
  onIonViewWillLeave: jest.fn(),
}));

jest.mock('@/protocols/ethereum/views', () => ({
  __esModule: true,
  default: {
    AccountDetails: () => Promise.resolve({
      template: '<div data-cy="evm-account-details" />',
    }),
  },
}));

jest.mock('../../../../src/composables', () => ({
  useAccounts: () => ({ activeAccount: { value: { protocol: mockActiveProtocol } } }),
  useNetworks: () => ({ activeNetwork: { value: { type: 'mainnet' } } }),
  useUi: () => ({ saveErrorLog: { value: false } }),
}));

describe('ProtocolSpecificView - EVM protocol mapping', () => {
  beforeEach(() => {
    mockActiveProtocol = 'ethereum';
  });

  it('mounts for ethereum active account', async () => {
    const wrapper = mount(ProtocolSpecificView, {
      props: { viewComponentName: PROTOCOL_VIEW_ACCOUNT_DETAILS },
      global: { stubs: ['InfoBox'] },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('mounts for bnb active account (shares ethereum views)', async () => {
    mockActiveProtocol = 'bnb';

    const wrapper = mount(ProtocolSpecificView, {
      props: { viewComponentName: PROTOCOL_VIEW_ACCOUNT_DETAILS },
      global: { stubs: ['InfoBox'] },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
