// @ts-nocheck
import { h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import en from '@/popup/locales/en-US.json';
import { PROTOCOLS } from '@/constants';
import { AE_CONTRACT_ID } from '@/protocols/aeternity/config';

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

describe('TransferReviewTip', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock('@/composables/accounts', () => ({
      useAccounts: () => ({
        activeAccount: ref({ address: 'ak_sender', name: 'Sender', protocol: PROTOCOLS.aeternity }),
      }),
    }));
  });

  // Bound like TransferSendModal binds its current step.
  async function mountInModal(transferData) {
    const { default: TransferReviewTip } = await import('@/protocols/aeternity/components/TransferReviewTip.vue');
    const model = ref(transferData);
    const error = ref(false);
    const wrapper = mount(() => h(TransferReviewTip, {
      transferData: model.value,
      'onUpdate:transferData': (value) => { model.value = value; },
      onError: (value) => { error.value = value; },
    }), {
      global: {
        plugins: [i18n],
        stubs: {
          ModalHeader: true,
          TokenAmount: true,
          Avatar: true,
          AddressTruncated: true,
          Truncate: true,
          LinkButton: true,
        },
      },
    });
    return { wrapper, model, error };
  }

  const transferData = {
    addresses: ['https://superhero.com'],
    amount: '1',
    selectedAsset: { contractId: AE_CONTRACT_ID, symbol: 'AE' },
  };

  it('passes the typed note on to the transfer', async () => {
    const { wrapper, model } = await mountInModal(transferData);

    await wrapper.find('textarea').setValue('Thanks!');

    expect(model.value).toEqual({ ...transferData, note: 'Thanks!' });
  });

  it('shows the note already in the transfer', async () => {
    const { wrapper } = await mountInModal({ ...transferData, note: 'Thanks!' });

    expect(wrapper.find('textarea').element.value).toBe('Thanks!');
  });

  it('blocks the next step while the note already in the transfer is too long', async () => {
    const { wrapper, error } = await mountInModal({ ...transferData, note: 'a'.repeat(281) });

    expect(error.value).toBe(true);

    await wrapper.find('textarea').setValue('a'.repeat(280));

    expect(error.value).toBe(false);
  });
});
