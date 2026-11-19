/**
 * [BLACK-BOX] The æternity send form going on to the review when Next is pressed. A spend
 * to a contract that isn't payable always fails, so the form stays, also when Next comes
 * before the node's answer; Next shows it waits meanwhile. The recipient field and its
 * rules are real; the node and the active account are stubbed.
 */
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { MemoryAccount } from '@aeternity/aepp-sdk';

import '@/protocols/registerAdapters';
import type { TransferFormModel } from '@/types';
import { PROTOCOLS } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { i18n } from '@/popup/plugins/i18n';
import initVeeValidateRules from '@/popup/plugins/veeValidate';
import TransferSendForm from '@/protocols/aeternity/components/TransferSendForm.vue';
import TransferSendRecipient from '@/popup/components/TransferSend/TransferSendRecipient.vue';
import TransferSendAmount from '@/popup/components/TransferSend/TransferSendAmount.vue';

// The setup files already loaded the composables with the real deps; reload them to apply mocks.
const { real, node } = vi.hoisted(() => {
  vi.resetModules();
  return {
    real: {
      useAccounts: () => ({}),
      useAeSdk: () => ({}),
    },
    node: {
      notPayable: new Set<string>(),
      isUnreachable: false,
      /** Answers wait for `releaseAnswers` */
      isHeld: false,
      held: [] as (() => void)[],
      getAccountByPubkey: vi.fn(),
    },
  };
});

const SENDER = MemoryAccount.generate().address;
const RECIPIENT = MemoryAccount.generate().address;
const CONTRACT = MemoryAccount.generate().address.replace('ak_', 'ct_');
const TOKEN = MemoryAccount.generate().address.replace('ak_', 'ct_');

// The real stores are loaded in `beforeAll`: loading them here would bind the barrel to them.
vi.mock('@/composables/accounts', async () => {
  const { ref } = await import('vue');
  return {
    useAccounts: () => ({
      ...real.useAccounts(),
      activeAccount: ref({ protocol: PROTOCOLS.aeternity, address: SENDER }),
    }),
  };
});

vi.mock('@/composables/aeSdk', () => ({
  useAeSdk: () => ({
    ...real.useAeSdk(),
    // The SDK's node requests skip `fetch`
    getAeSdk: () => new Promise(() => {}),
    getDryAeSdk: async () => ({ api: { getAccountByPubkey: node.getAccountByPubkey } }),
  }),
}));

// Offline: requests never settle.
vi.stubGlobal('fetch', () => new Promise(() => {}));

async function answer(address: string) {
  if (node.isHeld) {
    await new Promise<void>((resolve) => { node.held.push(resolve); });
  }
  if (node.isUnreachable) {
    throw new Error('Network error');
  }
  return { payable: !node.notPayable.has(address) };
}

function releaseAnswers() {
  node.held.splice(0).forEach((resolve) => resolve());
}

/** Answers one at a time, so each run resumes before the next answer */
async function answerOldest(count = 1) {
  for (let i = 0; i < count; i += 1) {
    node.held.shift()!();
    // eslint-disable-next-line no-await-in-loop
    await flushPromises();
  }
}

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { render: () => null } }],
});

enableAutoUnmount(afterEach);

beforeAll(async () => {
  real.useAccounts = (
    await vi.importActual<typeof import('@/composables/accounts')>('@/composables/accounts')
  ).useAccounts;
  real.useAeSdk = (
    await vi.importActual<typeof import('@/composables/aeSdk')>('@/composables/aeSdk')
  ).useAeSdk;
  initVeeValidateRules();
});

beforeEach(() => {
  node.getAccountByPubkey.mockReset().mockImplementation(answer);
});

afterEach(() => {
  node.notPayable.clear();
  node.isUnreachable = false;
  node.isHeld = false;
  releaseAnswers();
});

const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.aeternity);

const coinTransfer = (addresses: string[]): TransferFormModel => ({
  addresses,
  amount: '1',
  selectedAsset: adapter.getDefaultCoin(),
});

async function mountForm(transferData: TransferFormModel) {
  const wrapper = mount(TransferSendForm, {
    props: { transferData },
    global: {
      plugins: [i18n, router],
      stubs: {
        FormAccountInput: true,
        TransferSendAmount: true,
        AccountItem: true,
      },
    },
  });
  await flushPromises();
  return wrapper;
}

/** Presses Next as the send modal does, without waiting for the form. */
function pressNext(wrapper: Awaited<ReturnType<typeof mountForm>>) {
  (wrapper.vm as any).submit();
}

const hasGoneOn = (wrapper: Awaited<ReturnType<typeof mountForm>>) => !!wrapper.emitted('success');

/** The modal disables Next on it */
const showsError = (wrapper: Awaited<ReturnType<typeof mountForm>>) => (
  wrapper.emitted('error')?.at(-1)?.[0] === true
);

/** The modal shows Next as busy from it */
const isBusy = (wrapper: Awaited<ReturnType<typeof mountForm>>) => (
  (wrapper.vm as any).isSubmitting as boolean
);

describe('æternity send form going on to the review', () => {
  it('goes on for payable recipients', async () => {
    const wrapper = await mountForm(coinTransfer([RECIPIENT, CONTRACT]));

    pressNext(wrapper);
    await flushPromises();

    expect(hasGoneOn(wrapper)).toBe(true);
  });

  it('stays for a recipient that does not accept coins', async () => {
    node.notPayable.add(CONTRACT);
    const wrapper = await mountForm(coinTransfer([RECIPIENT, CONTRACT]));

    pressNext(wrapper);
    await flushPromises();

    expect(hasGoneOn(wrapper)).toBe(false);
    expect(showsError(wrapper)).toBe(true);
  });

  it('waits for the node when Next comes before its answer', async () => {
    node.notPayable.add(CONTRACT);
    node.isHeld = true;
    const wrapper = await mountForm(coinTransfer([CONTRACT]));

    pressNext(wrapper);
    await flushPromises();
    expect(hasGoneOn(wrapper)).toBe(false);
    expect(isBusy(wrapper)).toBe(true);

    releaseAnswers();
    await flushPromises();
    expect(hasGoneOn(wrapper)).toBe(false);
    expect(isBusy(wrapper)).toBe(false);
    expect(showsError(wrapper)).toBe(true);
  });

  it('goes on once the node answers that the recipient is payable', async () => {
    node.isHeld = true;
    const wrapper = await mountForm(coinTransfer([CONTRACT]));

    pressNext(wrapper);
    await flushPromises();
    expect(hasGoneOn(wrapper)).toBe(false);
    expect(isBusy(wrapper)).toBe(true);

    releaseAnswers();
    await flushPromises();
    expect(hasGoneOn(wrapper)).toBe(true);
    expect(isBusy(wrapper)).toBe(false);
  });

  it('stays when Next is pressed twice before the node answers', async () => {
    node.notPayable.add(CONTRACT);
    node.isHeld = true;
    const wrapper = await mountForm(coinTransfer([CONTRACT]));
    // The field asks on mount too: vee-validate's silent run and the value's
    const fieldLookups = node.held.length;

    pressNext(wrapper);
    pressNext(wrapper);
    await flushPromises();
    // The field's lookups, then the first press's
    await answerOldest(fieldLookups + 1);
    expect(hasGoneOn(wrapper)).toBe(false);
    expect(isBusy(wrapper)).toBe(true);

    await answerOldest();
    expect(hasGoneOn(wrapper)).toBe(false);
    expect(isBusy(wrapper)).toBe(false);
    expect(showsError(wrapper)).toBe(true);
  });

  it('drops the press when the recipient changes before the node answers', async () => {
    node.isHeld = true;
    const wrapper = await mountForm(coinTransfer([CONTRACT]));

    pressNext(wrapper);
    await flushPromises();
    wrapper.findComponent(TransferSendRecipient).vm.$emit('update:modelValue', [RECIPIENT]);
    await flushPromises();
    // Next is free for the changed form at once
    expect(isBusy(wrapper)).toBe(false);
    releaseAnswers();
    await flushPromises();

    expect(hasGoneOn(wrapper)).toBe(false);
  });

  it('waits for its own answer when Next is pressed again after a change', async () => {
    const wrapper = await mountForm(coinTransfer([CONTRACT]));
    node.isHeld = true;

    pressNext(wrapper);
    await flushPromises();
    wrapper.findComponent(TransferSendRecipient).vm.$emit('update:modelValue', [RECIPIENT]);
    await flushPromises();
    pressNext(wrapper);
    await flushPromises();
    // The first press's answer drops it
    await answerOldest();
    expect(hasGoneOn(wrapper)).toBe(false);
    expect(isBusy(wrapper)).toBe(true);

    releaseAnswers();
    await flushPromises();
    expect(hasGoneOn(wrapper)).toBe(true);
    expect(isBusy(wrapper)).toBe(false);
  });

  it('drops the press when the asset changes before the node answers', async () => {
    node.isHeld = true;
    // An account address passes the token rules too
    const wrapper = await mountForm(coinTransfer([RECIPIENT]));

    pressNext(wrapper);
    await flushPromises();
    wrapper.findComponent(TransferSendAmount).vm.$emit(
      'asset-selected',
      { ...adapter.getDefaultCoin(), contractId: TOKEN },
    );
    await flushPromises();
    expect(isBusy(wrapper)).toBe(false);
    releaseAnswers();
    await flushPromises();

    expect(hasGoneOn(wrapper)).toBe(false);
  });

  it('goes on when the node cannot be reached', async () => {
    node.notPayable.add(CONTRACT);
    node.isUnreachable = true;
    const wrapper = await mountForm(coinTransfer([CONTRACT]));

    pressNext(wrapper);
    await flushPromises();

    expect(hasGoneOn(wrapper)).toBe(true);
  });

  it('does not ask the node about a token transfer, which sends no coins', async () => {
    const wrapper = await mountForm({
      ...coinTransfer([RECIPIENT]),
      selectedAsset: { ...adapter.getDefaultCoin(), contractId: TOKEN },
    });

    pressNext(wrapper);
    await flushPromises();

    expect(node.getAccountByPubkey).not.toHaveBeenCalled();
    expect(hasGoneOn(wrapper)).toBe(true);
  });
});
