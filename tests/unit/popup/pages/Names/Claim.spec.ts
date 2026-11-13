// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';
import BigNumber from 'bignumber.js';
import en from '@/popup/locales/en-US.json';
import registerRules from '@/popup/plugins/veeValidate';
import Claim from '@/popup/pages/Names/Claim.vue';
import { ROUTE_ACCOUNT_DETAILS_NAMES, ROUTE_AUCTION_BID } from '@/popup/router/routeNames';
import { restError } from '../../../helpers/restError';

const mocks = vi.hoisted(() => ({
  state: {},
  addNameToClaimQueue: vi.fn(),
  getAeSdk: vi.fn(),
  ensureNodeNetworkId: vi.fn(),
  openDefaultModal: vi.fn(),
  openModal: vi.fn(),
  setLoaderVisible: vi.fn(),
  setNameClaimInfoModalHidden: vi.fn(),
  updateBalances: vi.fn(),
  fetchNameAuction: vi.fn(),
  setAuctionEntry: vi.fn(),
  push: vi.fn(),
  leave: undefined,
}));

vi.mock('@/composables', () => ({
  useAccounts: () => ({ activeAccount: mocks.state.account }),
  useBalances: () => ({ balance: mocks.state.balance, updateBalances: mocks.updateBalances }),
  useCurrencies: () => ({ currencyRates: mocks.state.currencyRates }),
  useModals: () => ({ openDefaultModal: mocks.openDefaultModal, openModal: mocks.openModal }),
  useAeSdk: () => ({
    getAeSdk: mocks.getAeSdk,
    nodeNetworkId: mocks.state.networkId,
    ensureNodeNetworkId: mocks.ensureNodeNetworkId,
  }),
  useNetworks: () => ({ activeNetwork: mocks.state.network }),
  useUi: () => ({
    isLoaderVisible: mocks.state.loader,
    isNameClaimInfoModalHidden: mocks.state.hideInfo,
    setLoaderVisible: mocks.setLoaderVisible,
    setNameClaimInfoModalHidden: mocks.setNameClaimInfoModalHidden,
  }),
}));
vi.mock('@/protocols/aeternity/composables/aeNames', () => ({
  NAME_CLAIM_STATUS: {
    preclaimSubmitted: 'preclaim-submitted',
    preclaimed: 'preclaimed',
    claimSubmitted: 'claim-submitted',
    pointerUpdatePending: 'pointer-update-pending',
    claimed: 'claimed',
  },
  useAeNames: () => ({
    addNameToClaimQueue: mocks.addNameToClaimQueue,
    preclaimedNames: mocks.state.preclaimedNames,
    fetchNameAuction: mocks.fetchNameAuction,
    setAuctionEntry: mocks.setAuctionEntry,
  }),
}));
vi.mock('@ionic/vue', async (importOriginal) => ({
  ...(await importOriginal()),
  onIonViewWillEnter: vi.fn(),
  onIonViewWillLeave: (callback) => { mocks.leave = callback; },
}));
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => ({ push: mocks.push }),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
const wrappers = [];
const InputFieldStub = {
  props: ['modelValue', 'message'],
  emits: ['update:modelValue'],
  template: `<div>
    <input data-cy="name" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />
    <span data-cy="name-message">{{ message }}</span>
  </div>`,
};
const ButtonStub = {
  props: ['disabled'],
  emits: ['click'],
  template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
};
const notFound = () => restError('Not found', { statusCode: 404 });
const auction = { expiration: 1000, bids: [], highestBid: { accountId: 'ak_other', nameFee: new BigNumber(10) } };
let node;
let sdk;

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function mountClaim() {
  const wrapper = mount(Claim, {
    global: {
      plugins: [i18n],
      stubs: {
        IonPage: { template: '<div><slot /></div>' },
        IonContent: { template: '<div><slot /></div>' },
        InputField: InputFieldStub,
        CheckBox: true,
        BtnHelp: true,
        BtnMain: ButtonStub,
        BtnPlain: ButtonStub,
      },
    },
  });
  wrappers.push(wrapper);
  return wrapper;
}

async function enterName(wrapper, name = 'testname') {
  await wrapper.find('[data-cy=name]').setValue(name);
  await vi.advanceTimersByTimeAsync(300);
  await flushPromises();
}

const registerButton = (wrapper) => wrapper.find('[data-cy=register-name]');
const availabilityAction = (wrapper) => wrapper.find('[data-cy=name-availability-action]');

describe('Claim registration availability', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vi.clearAllMocks();
    mocks.state = {
      account: ref({ address: 'ak_test' }),
      balance: ref(new BigNumber(100000)),
      currencyRates: ref({ aeternity: { usd: 1 } }),
      networkId: ref('ae_uat'),
      network: ref({ name: 'Mainnet', protocols: { aeternity: { nodeUrl: 'https://node.test' } } }),
      preclaimedNames: ref({}),
      loader: ref(false),
      hideInfo: ref(true),
    };
    node = {
      getNameEntryByName: vi.fn().mockRejectedValue(notFound()),
      getAuctionEntryByName: vi.fn().mockRejectedValue(notFound()),
    };
    sdk = { api: node };
    mocks.getAeSdk.mockReset().mockResolvedValue(sdk);
    mocks.ensureNodeNetworkId.mockReset()
      .mockImplementation(async () => mocks.state.networkId.value);
    mocks.addNameToClaimQueue.mockReset().mockResolvedValue(true);
    mocks.openModal.mockReset().mockResolvedValue(false);
    mocks.openDefaultModal.mockReset().mockResolvedValue(undefined);
    mocks.fetchNameAuction.mockReset().mockResolvedValue(auction);
    mocks.push.mockReset().mockResolvedValue(undefined);
    mocks.updateBalances.mockReset().mockResolvedValue(undefined);
    mocks.setLoaderVisible.mockImplementation((value) => { mocks.state.loader.value = value; });
    mocks.setNameClaimInfoModalHidden.mockImplementation((value) => {
      mocks.state.hideInfo.value = value;
    });
    registerRules();
  });

  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it.each(['preclaim-submitted', 'preclaimed', 'claim-submitted'])(
    'does not register a name with a %s claim already queued',
    async (status) => {
      mocks.state.preclaimedNames.value = {
        ae_uat: { 'testname.chain': { address: 'ak_test', name: 'testname.chain', status } },
      };
      const wrapper = mountClaim();
      await wrapper.find('[data-cy=name]').setValue('testname');

      await wrapper.vm.claim();

      expect(mocks.openDefaultModal).toHaveBeenCalledWith(expect.objectContaining({
        msg: en.modals['name-already-preclaimed'].msg,
      }));
      expect(mocks.getAeSdk).not.toHaveBeenCalled();
      expect(mocks.addNameToClaimQueue).not.toHaveBeenCalled();
      expect(mocks.state.loader.value).toBe(false);
    },
  );

  it.each(['testname', 'verylongsupername'])(
    'still registers the available name %s',
    async (name) => {
      const wrapper = mountClaim();
      await enterName(wrapper, name);
      expect(registerButton(wrapper).attributes('disabled')).toBeUndefined();

      await registerButton(wrapper).trigger('click');
      await flushPromises();

      expect(mocks.addNameToClaimQueue).toHaveBeenCalledWith(`${name}.chain`, 'ak_test', false);
      expect(mocks.push).toHaveBeenCalledWith({ name: ROUTE_ACCOUNT_DETAILS_NAMES });
      expect(mocks.state.loader.value).toBe(false);
    },
  );

  it('recovers an unknown network id before registering', async () => {
    mocks.state.networkId.value = undefined;
    mocks.ensureNodeNetworkId.mockImplementation(async () => {
      mocks.state.networkId.value = 'ae_uat';
      return 'ae_uat';
    });
    let networkIdOnAdmission;
    mocks.addNameToClaimQueue.mockImplementation(async () => {
      networkIdOnAdmission = mocks.state.networkId.value;
      return true;
    });
    const wrapper = mountClaim();
    await enterName(wrapper);
    // Checked again with the network id it recovered
    await vi.advanceTimersByTimeAsync(300);
    await flushPromises();
    expect(registerButton(wrapper).attributes('disabled')).toBeUndefined();

    await registerButton(wrapper).trigger('click');
    await flushPromises();

    expect(networkIdOnAdmission).toBe('ae_uat');
    expect(mocks.push).toHaveBeenCalledWith({ name: ROUTE_ACCOUNT_DETAILS_NAMES });
  });

  it.each(['ak_test', 'ak_other'])('blocks a registered name owned by %s', async (owner) => {
    node.getNameEntryByName.mockResolvedValue({ owner });
    const wrapper = mountClaim();
    await enterName(wrapper);

    expect(wrapper.find('[data-cy=name-message]').text()).toBe(en.validation.nameUnregistered);
    expect(registerButton(wrapper).attributes('disabled')).toBeDefined();
    await wrapper.vm.claim();
    expect(mocks.addNameToClaimQueue).not.toHaveBeenCalled();
    expect(node.getAuctionEntryByName).not.toHaveBeenCalled();
  });

  it.each(['ak_test', 'ak_other'])(
    'opens an auction led by %s even with no registration balance',
    async (highestBidder) => {
      mocks.state.balance.value = new BigNumber(0);
      node.getAuctionEntryByName.mockResolvedValue({ highestBidder });
      const wrapper = mountClaim();
      await enterName(wrapper);

      expect(registerButton(wrapper).attributes('disabled')).toBeDefined();
      expect(availabilityAction(wrapper).attributes('disabled')).toBeUndefined();
      await availabilityAction(wrapper).trigger('click');
      await flushPromises();

      expect(mocks.fetchNameAuction).toHaveBeenCalledWith('testname.chain');
      expect(mocks.setAuctionEntry).toHaveBeenCalledWith({ name: 'testname.chain', ...auction });
      expect(mocks.push).toHaveBeenCalledWith({ name: ROUTE_AUCTION_BID, params: { name: 'testname.chain' } });
      expect(mocks.addNameToClaimQueue).not.toHaveBeenCalled();
    },
  );

  it('keeps a newly detected auction usable for retry while the middleware has not indexed it', async () => {
    node.getAuctionEntryByName.mockResolvedValue({ highestBidder: 'ak_other' });
    mocks.fetchNameAuction.mockRejectedValueOnce(notFound()).mockResolvedValueOnce(auction);
    const wrapper = mountClaim();
    await enterName(wrapper);

    await availabilityAction(wrapper).trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain(en.pages.names.claim['auction-loading-error']);
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.addNameToClaimQueue).not.toHaveBeenCalled();

    await availabilityAction(wrapper).trigger('click');
    await flushPromises();
    expect(mocks.push).toHaveBeenCalledWith({ name: ROUTE_AUCTION_BID, params: { name: 'testname.chain' } });
  });

  it.each([503, 429, 400])('offers retry without registration after HTTP %s', async (statusCode) => {
    node.getNameEntryByName.mockRejectedValue(restError('Unavailable', { statusCode }));
    const wrapper = mountClaim();
    await enterName(wrapper);

    expect(wrapper.text()).toContain(en.pages.names.claim['availability-error']);
    expect(registerButton(wrapper).attributes('disabled')).toBeDefined();
    expect(mocks.addNameToClaimQueue).not.toHaveBeenCalled();

    node.getNameEntryByName.mockRejectedValue(notFound());
    await availabilityAction(wrapper).trigger('click');
    await flushPromises();
    expect(registerButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('retains the real balance validation for available names', async () => {
    mocks.state.balance.value = new BigNumber(0);
    const wrapper = mountClaim();
    await enterName(wrapper);

    expect(wrapper.find('[data-cy=name-message]').text()).toContain('AE');
    await wrapper.vm.claim();
    expect(mocks.updateBalances).toHaveBeenCalled();
    expect(mocks.addNameToClaimQueue).not.toHaveBeenCalled();
    expect(mocks.state.loader.value).toBe(false);
  });

  it('discards an old auction response after a different name was checked', async () => {
    const first = deferred();
    node.getNameEntryByName.mockImplementation((name) => (
      name === 'first.chain' ? first.promise : Promise.reject(notFound())
    ));
    node.getAuctionEntryByName.mockImplementation((name) => (
      name === 'first.chain' ? Promise.resolve({ highestBidder: 'ak_other' }) : Promise.reject(notFound())
    ));
    const wrapper = mountClaim();
    await enterName(wrapper, 'first');
    await enterName(wrapper, 'second');

    first.reject(notFound());
    await flushPromises();

    expect(registerButton(wrapper).attributes('disabled')).toBeUndefined();
    expect(availabilityAction(wrapper).exists()).toBe(false);
    expect(mocks.addNameToClaimQueue).not.toHaveBeenCalled();
  });

  it('offers retry when the selected node changes during a lookup', async () => {
    const pendingLookup = deferred();
    node.getNameEntryByName.mockReturnValue(pendingLookup.promise);
    const wrapper = mountClaim();
    await enterName(wrapper);

    sdk.api = {
      getNameEntryByName: vi.fn().mockRejectedValue(notFound()),
      getAuctionEntryByName: vi.fn().mockRejectedValue(notFound()),
    };
    pendingLookup.reject(notFound());
    await flushPromises();

    expect(wrapper.text()).toContain(en.pages.names.claim['availability-error']);
    expect(availabilityAction(wrapper).exists()).toBe(true);
    expect(mocks.addNameToClaimQueue).not.toHaveBeenCalled();
    await availabilityAction(wrapper).trigger('click');
    await flushPromises();
    expect(registerButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it.each(['name', 'account', 'network', 'page'])(
    'aborts if the %s changes while the information modal is open',
    async (change) => {
      mocks.state.hideInfo.value = false;
      const modal = deferred();
      mocks.openModal.mockReturnValue(modal.promise);
      const wrapper = mountClaim();
      await enterName(wrapper);
      const pending = wrapper.vm.claim();
      await flushPromises();
      expect(mocks.openModal).toHaveBeenCalledOnce();

      if (change === 'name') await wrapper.find('[data-cy=name]').setValue('othername');
      if (change === 'account') mocks.state.account.value = { address: 'ak_other' };
      if (change === 'network') mocks.state.network.value = { name: 'Other', protocols: {} };
      if (change === 'page') mocks.leave();
      modal.resolve(false);
      await pending;

      expect(mocks.addNameToClaimQueue).not.toHaveBeenCalled();
      expect(mocks.push).not.toHaveBeenCalled();
      expect(mocks.state.loader.value).toBe(false);
    },
  );

  it.each([false, true])('keeps the information modal preference %s separate from submission', async (hide) => {
    mocks.state.hideInfo.value = false;
    mocks.openModal.mockResolvedValue(hide);
    const wrapper = mountClaim();
    await enterName(wrapper);

    await wrapper.vm.claim();

    expect(mocks.addNameToClaimQueue).toHaveBeenCalledOnce();
    expect(mocks.state.hideInfo.value).toBe(hide);
  });

  it('serializes repeated submissions while the information modal hides the loader', async () => {
    mocks.state.hideInfo.value = false;
    const modal = deferred();
    mocks.openModal.mockReturnValue(modal.promise);
    const wrapper = mountClaim();
    await enterName(wrapper);
    const pending = wrapper.vm.claim();
    await flushPromises();
    expect(mocks.state.loader.value).toBe(false);

    await wrapper.vm.claim();
    modal.resolve(false);
    await pending;

    expect(mocks.openModal).toHaveBeenCalledOnce();
    expect(mocks.addNameToClaimQueue).toHaveBeenCalledOnce();
  });

  it('refreshes availability when the final admission detects a new auction', async () => {
    mocks.addNameToClaimQueue.mockImplementation(async () => {
      node.getAuctionEntryByName.mockResolvedValue({ highestBidder: 'ak_other' });
      return false;
    });
    const wrapper = mountClaim();
    await enterName(wrapper);

    await wrapper.vm.claim();
    await flushPromises();

    expect(wrapper.text()).toContain(en.pages.names.claim['in-auction']);
    expect(availabilityAction(wrapper).text()).toBe(en.pages.names.claim['view-auction']);
    expect(registerButton(wrapper).attributes('disabled')).toBeDefined();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(wrapper.find('[data-cy=name]').element.value).toBe('testname');
  });

  it('does not clear a newer input or navigate after an earlier admission completes', async () => {
    const admission = deferred();
    mocks.addNameToClaimQueue.mockReturnValue(admission.promise);
    const wrapper = mountClaim();
    await enterName(wrapper);
    const pending = wrapper.vm.claim();
    await flushPromises();
    expect(mocks.addNameToClaimQueue).toHaveBeenCalledOnce();

    await wrapper.find('[data-cy=name]').setValue('othername');
    admission.resolve(true);
    await pending;

    expect(wrapper.find('[data-cy=name]').element.value).toBe('othername');
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('releases submission state after a thrown admission error', async () => {
    mocks.addNameToClaimQueue.mockRejectedValue(new Error('Submission failed'));
    const wrapper = mountClaim();
    await enterName(wrapper);

    await wrapper.vm.claim();
    await flushPromises();

    expect(mocks.openDefaultModal).toHaveBeenCalledWith({ msg: 'Submission failed' });
    expect(registerButton(wrapper).attributes('disabled')).toBeUndefined();
    expect(mocks.state.loader.value).toBe(false);
  });

  it('does not clear a loader acquired by the destination page', async () => {
    mocks.push.mockImplementation(async () => {
      mocks.leave();
      mocks.state.loader.value = true;
    });
    const wrapper = mountClaim();
    await enterName(wrapper);

    await wrapper.vm.claim();

    expect(mocks.push).toHaveBeenCalledWith({ name: ROUTE_ACCOUNT_DETAILS_NAMES });
    expect(mocks.state.loader.value).toBe(true);
  });
});
