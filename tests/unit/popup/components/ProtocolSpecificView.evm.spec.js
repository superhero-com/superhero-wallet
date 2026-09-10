import { flushPromises, mount } from '@vue/test-utils';
import ProtocolSpecificView from '../../../../src/popup/components/ProtocolSpecificView.vue';
import {
  PROTOCOL_VIEW_ACCOUNT_DETAILS,
  PROTOCOL_VIEW_TRANSFER_SEND,
} from '../../../../src/constants';

let mockActiveProtocol = 'ethereum';

vi.mock('vue-router', () => ({
  useRoute: () => ({ meta: {}, params: {} }),
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@ionic/vue', () => ({
  IonRouterOutlet: { template: '<div><slot /></div>' },
  IonPage: { template: '<div><slot /></div>' },
  isPlatform: vi.fn(() => false),
  useIonRouter: () => ({ navigate: vi.fn() }),
  onIonViewDidEnter: vi.fn(),
  onIonViewDidLeave: vi.fn(),
  onIonViewWillEnter: vi.fn(),
  onIonViewWillLeave: vi.fn(),
}));

vi.mock('@/protocols/ethereum/views', () => ({
  __esModule: true,
  default: {
    AccountDetails: () => Promise.resolve({
      template: '<div data-cy="evm-account-details" />',
    }),
    TransferSendModal: () => Promise.resolve({
      props: {
        isMultisig: Boolean,
        tokenContractId: String,
      },
      template: `
        <div
          data-cy="evm-transfer-send"
          :data-is-multisig="String(isMultisig)"
          :data-token-contract-id="tokenContractId"
        />
      `,
    }),
  },
}));

vi.mock('../../../../src/composables', () => ({
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

  it('forwards modal attributes to the protocol-specific view', async () => {
    const wrapper = mount(ProtocolSpecificView, {
      props: {
        viewComponentName: PROTOCOL_VIEW_TRANSFER_SEND,
      },
      attrs: {
        isMultisig: true,
        tokenContractId: 'ct_test',
      },
      global: { stubs: ['InfoBox'] },
    });
    await flushPromises();

    const modal = wrapper.find('[data-cy="evm-transfer-send"]');
    expect(modal.attributes('data-is-multisig')).toBe('true');
    expect(modal.attributes('data-token-contract-id')).toBe('ct_test');
  });
});
