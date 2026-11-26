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
const {
  realAccounts,
  realAeSdk,
  notPayableAddresses,
  unreachableAddresses,
} = vi.hoisted(() => {
  vi.resetModules();
  return {
    realAccounts: { useAccounts: () => ({}) },
    realAeSdk: { useAeSdk: () => ({}) },
    notPayableAddresses: new Set<string>(),
    unreachableAddresses: new Set<string>(),
  };
});

const OWN_ADDRESS = MemoryAccount.generate().address;
const RECIPIENT = MemoryAccount.generate().address;
const VAULT = MemoryAccount.generate().address;
const NAME = 'superhero.chain';
const CONTRACT = MemoryAccount.generate().address.replace('ak_', 'ct_');

// Without a wallet the real store has no active account. The real store is loaded in
// `beforeAll`: loading it in the factory would bind the composables barrel to it.
vi.mock('@/composables/accounts', () => ({
  useAccounts: () => ({
    ...realAccounts.useAccounts(),
    activeAccount: ref({ protocol: PROTOCOLS.aeternity, address: OWN_ADDRESS }),
  }),
}));

// The node knows every account; only the ones in `notPayableAddresses` are not payable.
vi.mock('@/composables/aeSdk', () => ({
  useAeSdk: () => ({
    ...realAeSdk.useAeSdk(),
    getDryAeSdk: async () => ({
      api: {
        getAccountByPubkey: async (address: string) => {
          if (unreachableAddresses.has(address)) {
            throw new Error('Network error');
          }
          return { payable: !notPayableAddresses.has(address) };
        },
      },
    }),
  }),
}));

// Offline: the tipping URL list is never fetched.
vi.stubGlobal('fetch', () => new Promise(() => {}));

enableAutoUnmount(afterEach);

beforeAll(async () => {
  realAccounts.useAccounts = (
    await vi.importActual<typeof import('@/composables/accounts')>('@/composables/accounts')
  ).useAccounts;
  realAeSdk.useAeSdk = (
    await vi.importActual<typeof import('@/composables/aeSdk')>('@/composables/aeSdk')
  ).useAeSdk;
  initVeeValidateRules();
});

afterEach(() => {
  notPayableAddresses.clear();
  unreachableAddresses.clear();
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

  it('lets a coin transfer go to a contract address', async () => {
    expect(await getRecipientMessage([CONTRACT], {
      aens_name_registered_or_address: true,
      token_to_an_address: [false],
    })).toEqual({ status: 'success' });
  });

  it('stops a token transfer to a contract address', async () => {
    expect(await getRecipientMessage([CONTRACT], {
      aens_name_registered_or_address: true,
      token_to_an_address: [true],
    })).toEqual({ status: 'error', text: tg('validation.tokenToAnAddress') });
  });

  it('lets a tip URL field take a contract address', async () => {
    expect(await getRecipientMessage([CONTRACT], {
      aens_name_registered_or_address_or_url: true,
    })).toEqual({ status: 'success' });
  });

  it('stops a coin transfer to a recipient that does not accept coins', async () => {
    notPayableAddresses.add(CONTRACT);

    const message = await getRecipientMessage([RECIPIENT, CONTRACT], {
      ae_recipient_payable: true,
    });

    expect(message.status).toBe('error');
    expect(message.text).toContain(tg('validation.recipientNotPayable', ['AE']));
    expect(message.text).toContain(CONTRACT);
    expect(message.text).not.toContain(RECIPIENT);
  });

  it('lets a coin transfer go to payable recipients', async () => {
    expect(await getRecipientMessage([RECIPIENT, CONTRACT], { ae_recipient_payable: true }))
      .toEqual({ status: 'success' });
  });

  it('lets a coin transfer go when the node cannot be asked about the recipient', async () => {
    notPayableAddresses.add(CONTRACT);
    unreachableAddresses.add(CONTRACT);

    expect(await getRecipientMessage([CONTRACT], { ae_recipient_payable: true }))
      .toEqual({ status: 'success' });
  });

  it('shows the AirGap error before the payability one', async () => {
    notPayableAddresses.add(CONTRACT);

    expect(await getRecipientMessage([CONTRACT, NAME], {
      airgap_to_an_address: true,
      ae_recipient_payable: true,
    })).toEqual({ status: 'error', text: tg('validation.airGapToAnAddress') });
  });

  it('shows an error before the vault warning', async () => {
    expect(await getRecipientMessage([VAULT, NAME], {
      address_not_same_as: [VAULT, PROTOCOLS.aeternity],
      token_to_an_address: [true],
    })).toEqual({ status: 'error', text: tg('validation.tokenToAnAddress') });
  });
});
