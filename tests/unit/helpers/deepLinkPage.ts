// The stand-ins for the app's components are small, with untyped props
/* eslint-disable vue/one-component-per-file, vue/require-prop-types */
import {
  computed,
  defineComponent,
  h,
  ref,
  type Component,
} from 'vue';
import {
  enableAutoUnmount,
  flushPromises,
  mount,
  type VueWrapper,
} from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { MemoryAccount, decode } from '@aeternity/aepp-sdk';

import en from '@/popup/locales/en-US.json';

/**
 * Runs a deep-link page (`/address`, `/sign-message`, `/sign-jwt`) the way the
 * app does. The real page, `useDeepLinkApi`, `useModals` with the app's modal
 * registry and confirmation modals, `AeSdkSuperhero`, `AeAccountHdWallet` and
 * the SDK's crypto run as shipped.
 *
 * Replaced, as the boundaries of the app:
 * - the accounts the wallet holds: an in-memory store with real keys, which
 *   follows the active-account rules of `useAccounts`,
 * - the æternity node: the SDK has no node, and the network id is `ae_uat`,
 * - the route (the deep link is the test input) and Ionic's router,
 * - `Logger`, which shows errors to the user,
 * - `window.open`, through which the wallet hands the result to the dapp.
 *
 * The modules are loaded again for every page, because `registerAdapters` (a
 * setup file) already loaded the app with the real accounts.
 */

export const NETWORK_ID = 'ae_uat';

/** For what the page does on its own, also on a busy CI runner */
const WAIT = { timeout: 5000 };

/**
 * For a property test of a page. Each run opens the page anew. 12 runs of the JWT page
 * took over 60 s on CI, and the runs left over after a timeout broke the next tests.
 */
export const PROPERTY_RUNS = 4;
export const PROPERTY_TIMEOUT = 60_000;

enableAutoUnmount(afterEach);

export interface IWalletAccount {
  protocol: string;
  address: string;
  idx: number;
  globalIdx: number;
  type: string;
  secretKey?: Buffer;
}

/** An æternity account of the wallet with a fresh key. */
export function createAeAccount(globalIdx: number): IWalletAccount {
  const memoryAccount = MemoryAccount.generate();
  return {
    protocol: 'aeternity',
    address: memoryAccount.address,
    idx: globalIdx,
    globalIdx,
    type: 'hd-wallet',
    secretKey: Buffer.from(decode(memoryAccount.secretKey)),
  };
}

export function createEthAccount(globalIdx: number): IWalletAccount {
  return {
    protocol: 'ethereum',
    address: `0x${String(globalIdx + 1).padStart(40, '0')}`,
    idx: 0,
    globalIdx,
    type: 'hd-wallet',
  };
}

/**
 * The accounts the wallet holds. The account that is active and the last active
 * one of each protocol behave as in `useAccounts`.
 */
function createWalletAccounts(list: IWalletAccount[], activeGlobalIdx: number) {
  const accounts = ref(list);
  const activeAccountGlobalIdx = ref(activeGlobalIdx);
  const protocolLastActiveGlobalIdx = ref<Record<string, number>>({});

  const activeAccount = computed(() => (
    accounts.value.find(({ globalIdx }) => globalIdx === activeAccountGlobalIdx.value) || {}
  )) as any;
  const aeAccounts = computed(() => accounts.value.filter((acc) => acc.protocol === 'aeternity'));

  function getAccountByProtocolAndAddress(protocol: string, address: string) {
    return accounts.value.find((acc) => acc.protocol === protocol && acc.address === address);
  }

  function getLastActiveProtocolAccount(protocol: string) {
    if (activeAccount.value.protocol === protocol) {
      return activeAccount.value;
    }
    const lastUsedGlobalIdx = protocolLastActiveGlobalIdx.value[protocol];
    return accounts.value.find(({ globalIdx }) => globalIdx === lastUsedGlobalIdx)
      ?? accounts.value.find((acc) => acc.protocol === protocol);
  }

  function setActiveAccountByAddressAndProtocol(address: string, protocol: string) {
    const account = getAccountByProtocolAndAddress(protocol, address);
    if (account) {
      activeAccountGlobalIdx.value = account.globalIdx;
      protocolLastActiveGlobalIdx.value[account.protocol] = account.globalIdx;
    }
  }

  function getAccountsSelectOptionsByProtocol(protocol: string) {
    return accounts.value
      .filter((acc) => acc.protocol === protocol)
      .map((acc) => ({ text: acc.address, value: `${acc.protocol}:${acc.address}` }));
  }

  return {
    accounts,
    activeAccount,
    aeAccounts,
    getAccountByProtocolAndAddress,
    getLastActiveProtocolAccount,
    getAccountsSelectOptionsByProtocol,
    setActiveAccountByAddressAndProtocol,
  };
}

/** Renders the default and footer slots, so the text the user reads is in the DOM */
const SlotsStub = (name: string) => defineComponent({
  name,
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h('div', attrs, [slots.default?.(), slots.footer?.()]);
  },
});

const BtnMainStub = defineComponent({
  name: 'BtnMain',
  props: ['text', 'disabled'],
  emits: ['click'],
  setup(props, { emit, slots }) {
    return () => h(
      'button',
      { disabled: props.disabled, onClick: () => emit('click') },
      [props.text, slots.default?.()],
    );
  },
});

/** Like `CopyText`: its slot, or the value without one */
const CopyTextStub = defineComponent({
  name: 'CopyText',
  props: ['value'],
  setup: (props, { slots }) => () => h('span', slots.default ? slots.default() : props.value),
});

/** The account pickers: the test picks by emitting what the real ones emit */
const SignAccountSelectStub = defineComponent({
  name: 'SignAccountSelect',
  props: ['account', 'protocol', 'label'],
  emits: ['select'],
  setup: (props) => () => h('div', { class: 'sign-account-select' }, props.account?.address),
});
const FormSelectStub = defineComponent({
  name: 'FormSelect',
  props: ['modelValue', 'options'],
  emits: ['select'],
  setup: (props) => () => h('div', { class: 'form-select' }, props.modelValue),
});

const PAGES = {
  Address: () => import('@/popup/pages/Address.vue'),
  SignMessage: () => import('@/popup/pages/SignMessage.vue'),
  JwtSign: () => import('@/popup/pages/JwtSign.vue'),
};

export type DeepLinkPage = keyof typeof PAGES;

export interface IDeepLinkPageOptions {
  page: DeepLinkPage;
  /** The query of the deep link */
  query: Record<string, string>;
  accounts: IWalletAccount[];
  activeGlobalIdx?: number;
  /** Why the wallet can't reach the æternity node, when it can't */
  nodeError?: Error;
}

export async function openDeepLinkPage({
  page,
  query,
  accounts: accountList,
  activeGlobalIdx = 0,
  nodeError,
}: IDeepLinkPageOptions) {
  vi.resetModules();

  const walletAccounts = createWalletAccounts(accountList, activeGlobalIdx);
  const routerReplace = vi.fn();
  const loggerWrite = vi.fn(async () => {});
  // The spy of an earlier page, if any, with its calls cleared
  const windowOpen = vi.spyOn(window, 'open');
  windowOpen.mockReset().mockImplementation(() => null);

  vi.doMock('vue-router', async (importOriginal) => ({
    ...await importOriginal<typeof import('vue-router')>(),
    useRoute: () => ({ query }),
  }));
  vi.doMock('@ionic/vue', async (importOriginal) => ({
    ...await importOriginal<typeof import('@ionic/vue')>(),
    useIonRouter: () => ({ replace: routerReplace }),
  }));
  vi.doMock('@/composables/accounts', () => ({ useAccounts: () => walletAccounts }));
  vi.doMock('@/lib/logger', () => ({ default: { write: loggerWrite } }));

  const nodeNetworkId = ref<string | undefined>(NETWORK_ID);
  let aeSdk: any;
  let AeSdkSuperhero: typeof import('@/protocols/aeternity/libs/AeSdkSuperhero').AeSdkSuperhero;
  vi.doMock('@/composables/aeSdk', () => ({
    useAeSdk: () => ({
      nodeNetworkId,
      isAeSdkUpdating: ref(false),
      ensureNodeNetworkId: async () => {},
      async getAeSdk() {
        if (nodeError) {
          throw nodeError;
        }
        if (!aeSdk) {
          aeSdk = new AeSdkSuperhero({
            name: 'Superhero',
            id: 'Superhero',
            type: 'window' as any,
            nodes: [],
            onConnection() {},
            onDisconnect() {},
            onSubscription() { return {} as any; },
            onAskAccounts() { return [] as any; },
            onAskToSelectNetwork() {},
          }, nodeNetworkId);
        }
        return aeSdk;
      },
    }),
  }));

  ({ AeSdkSuperhero } = await import('@/protocols/aeternity/libs/AeSdkSuperhero'));
  const { default: registerModals } = await import('@/popup/router/modals');
  const { useModals } = await import('@/composables/modals');
  const pageModule = await PAGES[page]();
  registerModals();

  const i18n = createI18n({
    legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en },
  });

  /** The app's window: the routed page and, above it, the open modals */
  const AppWindow = defineComponent({
    setup() {
      const { modalsOpen } = useModals();
      return () => h('div', [
        h(pageModule.default as Component),
        ...modalsOpen.value.map(({ component, key, props }: any) => (
          h(component, { key, ...props })
        )),
      ]);
    },
  });

  const wrapper: VueWrapper = mount(AppWindow, {
    global: {
      plugins: [i18n],
      stubs: {
        IonPage: SlotsStub('IonPage'),
        Modal: SlotsStub('Modal'),
        CopyText: CopyTextStub,
        BtnMain: BtnMainStub,
        SignAccountSelect: SignAccountSelectStub,
        FormSelect: FormSelectStub,
        TransactionInfo: true,
        AccountSelectOptionsItem: true,
        NetworkButton: true,
        Avatar: true,
        Card: SlotsStub('Card'),
        NoOriginWarning: true,
        TemplateRenderer: SlotsStub('TemplateRenderer'),
        CheckBox: true,
        AccountSkeleton: true,
        InfoBox: true,
        Truncate: SlotsStub('Truncate'),
      },
    },
  });

  async function settle() {
    await flushPromises();
    await flushPromises();
  }

  /** The modal the user answers now, by what it shows */
  function findModal(dataCy = 'popup-aex2') {
    return wrapper.find(`[data-cy="${dataCy}"]`);
  }

  async function waitForModal(dataCy?: string) {
    await vi.waitFor(() => expect(findModal(dataCy).exists()).toBe(true), WAIT);
    return findModal(dataCy);
  }

  async function click(dataCy: string) {
    const button = () => wrapper.find(`[data-cy="${dataCy}"]`);
    await vi.waitFor(() => expect(button().exists()).toBe(true), WAIT);
    await button().trigger('click');
    await settle();
  }

  /** Clicks the button the user reads `text` on */
  async function clickButton(text: string) {
    await vi.waitFor(() => expect(
      wrapper.findAll('button').some((button) => button.text() === text),
    ).toBe(true), WAIT);
    await wrapper.findAll('button').find((button) => button.text() === text)!.trigger('click');
    await settle();
  }

  /** Picks another account in the open sign modal */
  async function pickAccount(account: IWalletAccount) {
    const signSelect = wrapper.findComponent(SignAccountSelectStub);
    if (signSelect.exists()) {
      signSelect.vm.$emit('select', account);
    } else {
      wrapper.findComponent(FormSelectStub).vm.$emit('select', `${account.protocol}:${account.address}`);
    }
    await settle();
  }

  /** The value the user reads in a details row of the open modal */
  function shownText(dataCy: string) {
    return wrapper.find(`[data-cy="${dataCy}"] .value`).text();
  }

  /** The URL the wallet opened to hand the result to the dapp */
  async function waitForCallback(): Promise<URL> {
    await vi.waitFor(() => expect(windowOpen).toHaveBeenCalled(), WAIT);
    return new URL(String(windowOpen.mock.calls.at(-1)![0]));
  }

  return {
    wrapper,
    loggerWrite,
    windowOpen,
    settle,
    findModal,
    waitForModal,
    click,
    clickButton,
    pickAccount,
    shownText,
    waitForCallback,
  };
}
