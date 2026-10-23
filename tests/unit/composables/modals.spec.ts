import { useModals } from '@/composables/modals';
import {
  MODAL_CONFIRM_CONNECT,
  MODAL_MESSAGE_SIGN,
} from '@/constants';
import { RejectedByUserError } from '@/lib/errors';
import { usePopupProps } from '@/composables/popupProps';

/**
 * The confirmation modals read their request from `usePopupProps`, which is how
 * the side panel and the web frame popups pass it to them.
 */
describe('useModals', () => {
  const { openModal, registerModal } = useModals();
  const { popupProps, setPopupProps } = usePopupProps();

  afterEach(() => setPopupProps(null));

  it('hands the props of a confirmation modal to usePopupProps', async () => {
    registerModal('test-confirmation', { showInPopupIfWebFrame: true });

    const result = openModal('test-confirmation', { message: 'hello' });
    expect(popupProps.value).toMatchObject({ message: 'hello' });

    popupProps.value!.resolve('signed');
    await expect(result).resolves.toBe('signed');
  });

  it('answers a dapp\'s request closed with the other modals as rejected', async () => {
    const { closeAllModals, modalsOpen } = useModals();
    registerModal(MODAL_MESSAGE_SIGN, { showInPopupIfWebFrame: true });
    registerModal(MODAL_CONFIRM_CONNECT, { showInPopupIfWebFrame: true });
    registerModal('test-reset', {});
    registerModal('test-extra', {});

    const request = openModal(MODAL_MESSAGE_SIGN, { message: 'hello' });
    const reset = openModal('test-reset');
    const secondRequest = openModal(MODAL_CONFIRM_CONNECT, { message: 'world' });
    const extra = openModal('test-extra');
    const isResetSettled = vi.fn();
    const isExtraSettled = vi.fn();
    reset.finally(isResetSettled);
    extra.finally(isExtraSettled);
    closeAllModals();

    await expect(request).rejects.toBeInstanceOf(RejectedByUserError);
    await expect(secondRequest).rejects.toBeInstanceOf(RejectedByUserError);
    // Settles itself after closing the others
    expect(isResetSettled).not.toHaveBeenCalled();
    expect(isExtraSettled).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(modalsOpen.value).toHaveLength(0));
  });

  it('leaves usePopupProps alone for other modals', () => {
    registerModal('test-default', {});

    openModal('test-default', { message: 'hello' });
    expect(popupProps.value).toBeNull();
  });
});
