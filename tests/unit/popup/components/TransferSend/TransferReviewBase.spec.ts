/**
 * [BLACK-BOX] The review shows a recipient as the wallet knows it, also one typed in another
 * case: with the name and the avatar it has elsewhere. The account sources are stubbed.
 */
import { enableAutoUnmount, mount } from '@vue/test-utils';
import { PROTOCOLS } from '@/constants';
import { i18n } from '@/popup/plugins/i18n';
import TransferReviewBase from '@/popup/components/TransferSend/TransferReviewBase.vue';
import Avatar from '@/popup/components/Avatar.vue';
import RecipientDetails from '@/popup/components/TransferSend/RecipientDetails.vue';

const { CHECKSUM, OWN_ADDRESS, AE_OWN_NAMED } = vi.hoisted(() => ({
  CHECKSUM: '0x5F00d657054991f0cb23Ce9EbAf073133a130762',
  OWN_ADDRESS: '0x909C407d6FD235DE14db97e2234fCB71E99d6E1c',
  AE_OWN_NAMED: 'ak_2iNDCz2sRLyxrASkGr2TGTqCsFU4crzuhEdRckF8fdqQ7jiwnC',
}));
const LOWER = CHECKSUM.toLowerCase();
const AE = 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5';
const AE_OTHER = 'ak_wTPFpksUJFjjntonTvwK4LJvDw11DPma7kZBneKbumb8yPeFq';

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
    useAeNames: () => ({
      ownedNames: ref([{ name: 'own.chain', pointers: { accountPubkey: AE_OWN_NAMED } }]),
    }),
  };
});

enableAutoUnmount(afterEach);

function getRecipient(address: string | string[], protocol: string = PROTOCOLS.ethereum) {
  return mount(TransferReviewBase, {
    props: {
      baseTokenSymbol: 'ETH',
      protocol: protocol as any,
      transferData: {
        amount: '1',
        fee: 0.0001,
        addresses: [address].flat() as any,
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
        RecipientDetails: true,
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

  it('has details for a single recipient on a chain that can look it up', () => {
    const recipient = getRecipient(AE, PROTOCOLS.aeternity);

    expect(recipient.getComponent(RecipientDetails).props()).toEqual({
      address: AE,
      shownAddress: AE,
      protocol: PROTOCOLS.aeternity,
    });
  });

  it.each([
    ['a name of the wallet, whose address the card shows', 'own.chain', AE_OWN_NAMED],
    ['any other name, which the card shows alone', 'other.chain', undefined],
  ])('tells the details the address shown for %s', (_, name, shownAddress) => {
    const recipient = getRecipient(name, PROTOCOLS.aeternity);

    expect(recipient.getComponent(RecipientDetails).props('shownAddress')).toBe(shownAddress);
  });

  it('puts the details on the color of a recipient the wallet owns', () => {
    const card = getRecipient('own.chain', PROTOCOLS.aeternity).get('.avatar-with-chain-name');

    expect(card.attributes('style')).toContain('background-color');
    expect(card.findComponent(RecipientDetails).exists()).toBe(true);
  });

  it.each([
    ['several recipients', [AE, AE_OTHER], PROTOCOLS.aeternity],
    ['a chain that cannot look a recipient up', [CHECKSUM], PROTOCOLS.ethereum],
  ])('has no details for %s, nor room for them', async (_, addresses, protocol) => {
    const recipient = getRecipient(addresses, protocol);
    // Expands several recipients
    await recipient.get('.label').trigger('click');

    expect(recipient.findAll('.avatar-with-chain-name')).toHaveLength(addresses.length);
    expect(recipient.findComponent(RecipientDetails).exists()).toBe(false);
    expect(recipient.find('.footer').exists()).toBe(false);
  });
});
