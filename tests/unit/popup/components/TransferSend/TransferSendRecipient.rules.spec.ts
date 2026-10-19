/**
 * [BLACK-BOX] The recipient field with the app's real validation rules, as the
 * aeternity send form configures them. Only the first message of the field is shown
 * and only an error blocks the form. The active account is stubbed.
 */
import { defineComponent, h, ref } from 'vue';
import { useForm } from 'vee-validate';
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { MemoryAccount } from '@aeternity/aepp-sdk';

import '@/protocols/registerAdapters';
import { PROTOCOLS } from '@/constants';
import { i18n, tg } from '@/popup/plugins/i18n';
import initVeeValidateRules from '@/popup/plugins/veeValidate';
import TransferSendRecipient from '@/popup/components/TransferSend/TransferSendRecipient.vue';
import FormAccountInput from '@/popup/components/form/FormAccountInput.vue';

// The setup files already loaded the composables with the real deps; reload them to apply mocks.
const { realAccounts } = vi.hoisted(() => {
  vi.resetModules();
  return { realAccounts: { useAccounts: () => ({}) } };
});

const OWN_ADDRESS = MemoryAccount.generate().address;
const RECIPIENT = MemoryAccount.generate().address;
const VAULT = MemoryAccount.generate().address;
const NAME = 'superhero.chain';

// Without a wallet the real store has no active account. The real store is loaded in
// `beforeAll`: loading it in the factory would bind the composables barrel to it.
vi.mock('@/composables/accounts', () => ({
  useAccounts: () => ({
    ...realAccounts.useAccounts(),
    activeAccount: ref({ protocol: PROTOCOLS.aeternity, address: OWN_ADDRESS }),
  }),
}));

// Offline: the tipping URL list is never fetched.
vi.stubGlobal('fetch', () => new Promise(() => {}));

enableAutoUnmount(afterEach);

beforeAll(async () => {
  realAccounts.useAccounts = (
    await vi.importActual<typeof import('@/composables/accounts')>('@/composables/accounts')
  ).useAccounts;
  initVeeValidateRules();
});

/**
 * Mounts the field and returns a reader of its message. The rules are built on every
 * render, as the form's template does.
 */
function mountRecipient(addresses: string[], getValidationRules: () => object) {
  const Form = defineComponent({
    setup() {
      const { errors } = useForm();
      return () => h(TransferSendRecipient, {
        modelValue: addresses,
        errors: errors.value,
        protocol: PROTOCOLS.aeternity,
        validationRules: getValidationRules(),
      });
    },
  });
  const wrapper = mount(Form, {
    global: {
      plugins: [i18n],
      stubs: { FormAccountInput: true },
    },
  });
  return async () => {
    await flushPromises();
    return wrapper.findComponent(FormAccountInput).props('message');
  };
}

/** Returns the message the field shows for these recipients. */
function getRecipientMessage(addresses: string[], validationRules: object) {
  return mountRecipient(addresses, () => validationRules)();
}

describe('TransferSendRecipient rules', () => {
  it('stops a token transfer to a name', async () => {
    expect(await getRecipientMessage([VAULT, NAME], { token_to_an_address: [true] }))
      .toEqual({ status: 'error', text: tg('validation.tokenToAnAddress') });
  });

  it('lets a coin transfer go to a name', async () => {
    expect(await getRecipientMessage([NAME], { token_to_an_address: [false] }))
      .toEqual({ status: 'success' });
  });

  it('lets a token transfer go to an address', async () => {
    expect(await getRecipientMessage([RECIPIENT], { token_to_an_address: [true] }))
      .toEqual({ status: 'success' });
  });

  it('follows the asset picked after the field is set up', async () => {
    // The send form picks its default coin only after the recipient field is set up.
    const isToken = ref(true);
    const getMessage = mountRecipient([NAME], () => ({ token_to_an_address: [isToken.value] }));
    expect(await getMessage()).toEqual({ status: 'error', text: tg('validation.tokenToAnAddress') });

    isToken.value = false;
    expect(await getMessage()).toEqual({ status: 'success' });

    isToken.value = true;
    expect(await getMessage()).toEqual({ status: 'error', text: tg('validation.tokenToAnAddress') });
  });

  it('stops an AirGap account from sending to a name', async () => {
    expect(await getRecipientMessage([NAME], { airgap_to_an_address: true }))
      .toEqual({ status: 'error', text: tg('validation.airGapToAnAddress') });
  });

  it('lets an AirGap account send to an address', async () => {
    expect(await getRecipientMessage([RECIPIENT], { airgap_to_an_address: true }))
      .toEqual({ status: 'success' });
  });

  it('warns about sending from a multisig vault to itself', async () => {
    const message = await getRecipientMessage([VAULT], {
      address_not_same_as: [VAULT, PROTOCOLS.aeternity],
    });

    expect(message.status).toBe('warning');
    expect(message.text).toContain(VAULT);
  });

  it('warns about sending to the own account by default', async () => {
    const message = await getRecipientMessage([OWN_ADDRESS], {});

    expect(message.status).toBe('warning');
    expect(message.text).toContain(OWN_ADDRESS);
  });

  it('lets a transfer go to another account by default', async () => {
    expect(await getRecipientMessage([RECIPIENT], {})).toEqual({ status: 'success' });
  });

  it('shows an error before the vault warning', async () => {
    expect(await getRecipientMessage([VAULT, NAME], {
      address_not_same_as: [VAULT, PROTOCOLS.aeternity],
      token_to_an_address: [true],
    })).toEqual({ status: 'error', text: tg('validation.tokenToAnAddress') });
  });
});
