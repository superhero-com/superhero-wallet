/**
 * [BLACK-BOX] The review shows a recipient as the wallet knows it, also one typed in another
 * case: with the name and the avatar it has elsewhere. The account sources are stubbed.
 */
import { enableAutoUnmount, mount } from '@vue/test-utils';
import { PROTOCOLS } from '@/constants';
import { i18n } from '@/popup/plugins/i18n';
import TransferReviewBase from '@/popup/components/TransferSend/TransferReviewBase.vue';
import Avatar from '@/popup/components/Avatar.vue';

const { CHECKSUM, OWN_ADDRESS } = vi.hoisted(() => ({
  CHECKSUM: '0x5F00d657054991f0cb23Ce9EbAf073133a130762',
  OWN_ADDRESS: '0x909C407d6FD235DE14db97e2234fCB71E99d6E1c',
}));
const LOWER = CHECKSUM.toLowerCase();
const AE = 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5';

vi.mock('@/composables', async (importOriginal) => {
  const { ref } = await import('vue');
  return {
    ...(await importOriginal<typeof import('@/composables')>()),
    useAccounts: () => ({
      activeAccount: ref({ address: OWN_ADDRESS, protocol: 'ethereum' }),
      accountsGroupedByProtocol: ref({}),
    }),
    useAccountSelector: () => ({
      allAccounts: ref([{
        name: 'Bob', address: CHECKSUM, isBookmarked: false, protocol: 'ethereum',
      }]),
    }),
    useMultisigAccounts: () => ({ multisigAccounts: ref([]) }),
  };
});

vi.mock('@/protocols/aeternity/composables/aeNames', async (importOriginal) => {
  const { ref } = await import('vue');
  return {
    ...(await importOriginal<typeof import('@/protocols/aeternity/composables/aeNames')>()),
    useAeNames: () => ({ ownedNames: ref([]) }),
  };
});

enableAutoUnmount(afterEach);

function getRecipient(address: string, protocol: string = PROTOCOLS.ethereum) {
  return mount(TransferReviewBase, {
    props: {
      baseTokenSymbol: 'ETH',
      protocol: protocol as any,
      transferData: {
        amount: '1',
        fee: 0.0001,
        addresses: [address as any],
        selectedAsset: { symbol: 'ETH' } as any,
      },
    },
    global: {
      plugins: [i18n],
      stubs: {
        ModalHeader: true,
        PayloadDetails: true,
        TokenAmount: true,
        Avatar: true,
        AddressFormatted: true,
      },
    },
  }).get('[data-cy=review-recipient]');
}

describe('TransferReviewBase recipient', () => {
  it.each([
    LOWER,
    LOWER.slice(2),
    `0X${CHECKSUM.slice(2)}`,
  ])('names the contact typed as %s and draws its avatar', (typed) => {
    const recipient = getRecipient(typed);

    expect(recipient.get('.address-name').text()).toBe('Bob');
    expect(recipient.getComponent(Avatar).props('address')).toBe(CHECKSUM);
  });

  it('keeps an aeternity recipient as it is', () => {
    const recipient = getRecipient(AE, PROTOCOLS.aeternity);

    expect(recipient.getComponent(Avatar).props('address')).toBe(AE);
  });
});
