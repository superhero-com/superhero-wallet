/**
 * [BLACK-BOX] The recipient details on the transfer review, in each state the adapter's answer
 * can put them in. The adapter is faked.
 */
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import type { IRecipientDetails } from '@/types';
import { PROTOCOLS } from '@/constants';
import { formatDate, formatTime } from '@/utils';
import { i18n } from '@/popup/plugins/i18n';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import RecipientDetails from '@/popup/components/TransferSend/RecipientDetails.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';
import AddressFormatted from '@/popup/components/AddressFormatted.vue';

const ADDRESS = 'ak_wTPFpksUJFjjntonTvwK4LJvDw11DPma7kZBneKbumb8yPeFq';
const CONTRACT = 'ct_azbNZ1XrPjXfqBqbAh1ffLNTQ1sbnuUDFvJrXjYz7JQA1saQ3';
const NAME = 'recipient.chain';
const CREATED_AT = 1565798572713;
const LAST_SENT_AT = 1795575794289;

enableAutoUnmount(afterEach);

let fetchRecipientDetails: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchRecipientDetails = vi.fn();
  vi.spyOn(ProtocolAdapterFactory, 'getAdapter').mockReturnValue({
    fetchRecipientDetails,
    getExplorer: () => ({ prepareUrlForAccount: (address: string) => `https://explorer/${address}` }),
  } as any);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mountDetails(address = ADDRESS, { shownAddress }: { shownAddress?: string } = {}) {
  return mount(RecipientDetails, {
    props: { address, shownAddress, protocol: PROTOCOLS.aeternity },
    global: {
      plugins: [i18n],
      stubs: { TokenAmount: true, AddressFormatted: true },
    },
  });
}

const details = (overrides: Partial<IRecipientDetails> = {}): IRecipientDetails => ({
  address: ADDRESS,
  isUnused: false,
  type: 'basic',
  balance: '13286.01',
  createdAt: CREATED_AT,
  lastSentAt: LAST_SENT_AT,
  ...overrides,
});

describe('RecipientDetails', () => {
  it('is collapsed until the toggle is pressed, then shows the account', async () => {
    fetchRecipientDetails.mockResolvedValue(details());
    const wrapper = mountDetails();
    await flushPromises();

    const toggle = wrapper.get('[data-cy=recipient-details-toggle]');
    expect(toggle.text()).toBe('Recipient details');
    expect(toggle.attributes('aria-expanded')).toBe('false');
    expect(wrapper.find('dl').exists()).toBe(false);

    await toggle.trigger('click');

    expect(toggle.attributes('aria-expanded')).toBe('true');
    expect(wrapper.get('[data-cy=recipient-type] dd').text()).toBe('Basic account');
    expect(wrapper.getComponent(TokenAmount).props('amount')).toBe(13286.01);
    expect(wrapper.get('[data-cy=recipient-created-at] dd').text())
      .toBe(`${formatDate(CREATED_AT)} ${formatTime(CREATED_AT)}`);
    expect(wrapper.get('[data-cy=recipient-last-sent-at] dd').text())
      .toBe(`${formatDate(LAST_SENT_AT)} ${formatTime(LAST_SENT_AT)}`);
    expect(wrapper.get('[data-cy=recipient-explorer]').attributes('href'))
      .toBe(`https://explorer/${ADDRESS}`);
    expect(wrapper.find('[data-cy=recipient-name-address]').exists()).toBe(false);
    expect(fetchRecipientDetails).toHaveBeenCalledWith(ADDRESS);
  });

  it.each([
    ['generalized', 'Generalized account'],
    ['contract', 'Smart contract'],
  ] as const)('names a %s', async (type, label) => {
    fetchRecipientDetails.mockResolvedValue(details({ type, lastSentAt: undefined }));
    const wrapper = mountDetails();
    await flushPromises();
    await wrapper.get('[data-cy=recipient-details-toggle]').trigger('click');

    expect(wrapper.get('[data-cy=recipient-type] dd').text()).toBe(label);
    expect(wrapper.find('[data-cy=recipient-last-sent-at]').exists()).toBe(false);
    expect(wrapper.find('[data-cy=recipient-consensus]').exists()).toBe(false);
  });

  it('names a multisig vault and how many of its signers approve a transaction', async () => {
    fetchRecipientDetails.mockResolvedValue(details({
      type: 'multisig', confirmationsRequired: 2, signersCount: 3,
    }));
    const wrapper = mountDetails();
    await flushPromises();
    await wrapper.get('[data-cy=recipient-details-toggle]').trigger('click');

    expect(wrapper.get('[data-cy=recipient-type] dd').text()).toBe('Multisig vault');
    expect(wrapper.get('[data-cy=recipient-consensus] dt').text()).toBe('Consensus');
    expect(wrapper.get('[data-cy=recipient-consensus] dd').text()).toBe('2 of 3 signers');
  });

  it('says when an account has never sent a transaction', async () => {
    fetchRecipientDetails.mockResolvedValue(details({ lastSentAt: null }));
    const wrapper = mountDetails();
    await flushPromises();
    await wrapper.get('[data-cy=recipient-details-toggle]').trigger('click');

    expect(wrapper.get('[data-cy=recipient-last-sent-at] dd').text()).toBe('Never');
  });

  it('leaves out the times the middleware could not tell', async () => {
    fetchRecipientDetails.mockResolvedValue(details({
      createdAt: undefined, lastSentAt: undefined,
    }));
    const wrapper = mountDetails();
    await flushPromises();
    await wrapper.get('[data-cy=recipient-details-toggle]').trigger('click');

    expect(wrapper.find('[data-cy=recipient-type]').exists()).toBe(true);
    expect(wrapper.find('[data-cy=recipient-created-at]').exists()).toBe(false);
    expect(wrapper.find('[data-cy=recipient-last-sent-at]').exists()).toBe(false);
  });

  it('shows the address a name points to without expanding, and links it in the explorer', async () => {
    fetchRecipientDetails.mockResolvedValue(details());
    const wrapper = mountDetails(NAME);
    await flushPromises();

    expect(wrapper.get('[data-cy=recipient-name-address] dt').text()).toBe('Name points to');
    expect(wrapper.getComponent(AddressFormatted).props('address')).toBe(ADDRESS);
    expect(wrapper.find('[data-cy=recipient-type]').exists()).toBe(false);

    await wrapper.get('[data-cy=recipient-details-toggle]').trigger('click');

    expect(wrapper.get('[data-cy=recipient-explorer]').attributes('href'))
      .toBe(`https://explorer/${ADDRESS}`);
  });

  it('leaves out the address a name points to when the card shows it', async () => {
    fetchRecipientDetails.mockResolvedValue(details());
    const wrapper = mountDetails(NAME, { shownAddress: ADDRESS });
    await flushPromises();
    await wrapper.get('[data-cy=recipient-details-toggle]').trigger('click');

    expect(wrapper.find('[data-cy=recipient-type]').exists()).toBe(true);
    expect(wrapper.find('[data-cy=recipient-name-address]').exists()).toBe(false);
  });

  it('says an unused address has no transactions, with nothing to expand', async () => {
    fetchRecipientDetails.mockResolvedValue({ address: ADDRESS, isUnused: true });
    const wrapper = mountDetails();
    await flushPromises();

    expect(wrapper.get('[data-cy=recipient-unused]').text())
      .toBe('This address has no transactions yet.');
    expect(wrapper.find('[data-cy=recipient-details-toggle]').exists()).toBe(false);
    expect(wrapper.find('dl').exists()).toBe(false);
  });

  it('warns that no contract exists at an unknown contract address', async () => {
    fetchRecipientDetails.mockResolvedValue({ address: CONTRACT, isUnused: true, type: 'contract' });
    const wrapper = mountDetails(CONTRACT);
    await flushPromises();

    const message = wrapper.get('[data-cy=recipient-unused]');
    expect(message.text()).toBe('No contract exists at this address.');
    expect(message.classes()).toContain('warning');
    expect(wrapper.find('[data-cy=recipient-details-toggle]').exists()).toBe(false);
  });

  it('shows the unused account a name points to', async () => {
    fetchRecipientDetails.mockResolvedValue({ address: ADDRESS, isUnused: true });
    const wrapper = mountDetails(NAME);
    await flushPromises();

    expect(wrapper.find('[data-cy=recipient-unused]').exists()).toBe(true);
    expect(wrapper.find('[data-cy=recipient-details-toggle]').exists()).toBe(false);
    expect(wrapper.get('[data-cy=recipient-name-address] dt').text()).toBe('Name points to');
    expect(wrapper.getComponent(AddressFormatted).props('address')).toBe(ADDRESS);
    expect(wrapper.findAll('dl > div')).toHaveLength(1);
  });

  it('warns that a name points to no account, with nothing to expand', async () => {
    fetchRecipientDetails.mockResolvedValue(null);
    const wrapper = mountDetails(NAME);
    await flushPromises();

    const message = wrapper.get('[data-cy=recipient-no-account]');
    expect(message.text()).toBe('The recipient name points to no account.');
    expect(message.classes()).toContain('warning');
    expect(wrapper.find('[data-cy=recipient-details-toggle]').exists()).toBe(false);
    expect(wrapper.find('dl').exists()).toBe(false);
  });

  it('loads while expanded, then shows an error when the lookup fails', async () => {
    let reject!: (error: Error) => void;
    fetchRecipientDetails.mockReturnValue(new Promise((_, rejectFn) => { reject = rejectFn; }));
    const wrapper = mountDetails();
    await wrapper.get('[data-cy=recipient-details-toggle]').trigger('click');

    expect(wrapper.find('[data-cy=recipient-details-loading]').exists()).toBe(true);

    reject(new Error('node is down'));
    await flushPromises();

    expect(wrapper.find('[data-cy=recipient-details-loading]').exists()).toBe(false);
    expect(wrapper.get('[data-cy=recipient-details-error]').text())
      .toBe("Couldn't load the recipient details.");
  });

  it('keeps the details of the latest address when an earlier lookup answers last', async () => {
    let resolveFirst!: (value: IRecipientDetails) => void;
    fetchRecipientDetails
      .mockReturnValueOnce(new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce({ address: ADDRESS, isUnused: true });
    const wrapper = mountDetails(NAME);
    await wrapper.setProps({ address: ADDRESS });
    await flushPromises();

    resolveFirst(details());
    await flushPromises();

    expect(wrapper.find('[data-cy=recipient-unused]').exists()).toBe(true);
  });
});
