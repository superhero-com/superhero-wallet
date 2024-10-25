<template>
  <Modal
    full-screen
    from-bottom
    has-close-button
    class="multisig-vault-create"
    @close="reject()"
  >
    <!--
      Step 1: The form
    -->
    <Form
      v-if="currentStep === STEPS.form"
      class="multisig-vault-create-form"
      @submit.prevent="openReviewStep"
    >
      <h2 class="text-heading-3">
        {{ $t('modals.createMultisigAccount.title') }}
      </h2>
      <div
        v-for="(signer, index) in signers"
        :key="`signer${index}`"
        :data-signer-idx="`signer-address-${index}`"
      >
        <FormSelect
          v-if="index === 0"
          v-model.trim="signer.address"
          :default-text="$t('modals.createMultisigAccount.signerInputPlaceholder')"
          :label="getSignerLabel(index)"
          :options="aeAccountsSelectOptions"
          item-title="value"
          account-select
        />
        <Field
          v-else
          v-slot="{ field, errorMessage }"
          v-model="signer.address"
          :name="`signer-address-${index}`"
          :rules="{
            required: true,
            account_address: [PROTOCOLS.aeternity],
          }"
        >
          <FormAccountInput
            v-bind="field"
            :model-value="signer.address"
            hide-clear-icon
            :label="getSignerLabel(index)"
            :placeholder="$t('modals.createMultisigAccount.signerInputPlaceholder')"
            :name="`signer-address-${index}`"
            :message="errorMessage || getErrorMessage(signer)"
            :class="{
              error: checkIfSignerAddressDuplicated(signer),
            }"
          >
            <template #label-after>
              <div class="buttons">
                <BtnIcon
                  :icon="AddressBookIcon"
                  @click="updateSignerFromAddressBook(index)"
                />
                <BtnIcon
                  :icon="QrScanIcon"
                  @click.prevent="scanSignerAccountQrCode(index)"
                />
              </div>
            </template>
            <template #after>
              <BtnIcon
                v-if="(
                  signers.length > MULTISIG_VAULT_MIN_NUM_OF_SIGNERS
                  && (!signer.address || signer.address.length === 0)
                )"
                :icon="TrashIcon"
                data-cy="clear-address-button"
                class="close-icon"
                size="sm"
                @click="removeSigner(index)"
              />
              <BtnIcon
                v-if="signer.address?.length > 0"
                :icon="CircleCloseIcon"
                data-cy="clear-address-button"
                class="close-icon"
                size="sm"
                @click="clearSigner(index)"
              />
            </template>
          </FormAccountInput>
        </Field>
      </div>

      <div class="signers-add-wrapper">
        <BtnText
          :icon="PlusCircleIcon"
          :text="$t('modals.createMultisigAccount.addSigner')"
          data-cy="add-signer-btn"
          @click="addNewSigner"
        />

        <BtnHelp
          :title="$t('multisig.authorizedSigners')"
          :msg="$t('modals.createMultisigAccount.addSignerHelpMsg')"
          data-cy="add-signer-btn-help"
        />
      </div>

      <div class="consensus">
        <div class="description">
          {{ $t('modals.createMultisigAccount.consensusRequiredDesc') }}
        </div>

        <div class="signers-count">
          <FormNumberSelect
            v-model="confirmationsRequired"
            :size="signers.length"
            data-cy="multisig-num-of-signers-selector"
          />

          <i18n-t
            keypath="modals.createMultisigAccount.consensusRequiredContent"
            tag="span"
            class="text"
            scope="global"
          >
            <span class="text-emphasis">{{ signers.length }} </span>
          </i18n-t>

          <BtnHelp
            :title="$t('modals.createMultisigAccount.consensusRequiredHelpTitle')"
            :msg="$t('modals.createMultisigAccount.consensusRequiredHelpMsg')"
            data-cy="multisig-num-of-signers-selector-help"
          />
        </div>
      </div>
    </Form>

    <!--
      Step 2: Review
    -->
    <MultisigVaultCreateReview
      v-else-if="currentStep === STEPS.review"
      :signers="signers"
      :phase="multisigAccountCreationPhase"
      :confirmations-required="confirmationsRequired"
      :account-id="currentMultisigAccountId"
    />

    <!--
      Step 3: Creation progress summary
    -->
    <MultisigVaultCreateProgress
      v-else-if="currentStep === STEPS.processing"
      :phase="multisigAccountCreationPhase"
      :multisig-account="multisigAccount"
      :is-accessible="isMultisigAccountAccessible"
      :is-created="isMultisigAccountCreated"
    />

    <template #footer>
      <BtnMain
        v-if="currentStep === STEPS.form"
        :text="$t('modals.createMultisigAccount.btnText')"
        :disabled="!canCreateMultisig"
        @click.once="openReviewStep"
      />
      <template v-else-if="currentStep === STEPS.review">
        <BtnMain
          variant="muted"
          :text="$t('common.edit')"
          @click="openFormStep"
        />
        <BtnMain
          :text="$t('modals.createMultisigAccount.createMultisigVault')"
          wide
          :disabled="(
            multisigAccountCreationPhase !== MULTISIG_CREATION_PHASES.signed
            || notEnoughBalanceToCreateMultisig
          )"
          @click="createMultisigAccount"
        />
      </template>
      <BtnMain
        v-else-if="currentStep === STEPS.processing"
        :text="$t('modals.creatingMultisigAccount.btnText')"
        :disabled="!(isMultisigAccountCreated || isMultisigAccountAccessible)"
        @click="navigateToMultisigVault"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  ref,
  watch,
} from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  Field,
  Form,
  useFormErrors,
} from 'vee-validate';
import { Encoded } from '@aeternity/aepp-sdk';

import type { ICreateMultisigAccount, ObjectValues } from '@/types';
import { MODAL_ADDRESS_BOOK_ACCOUNT_SELECTOR, PROTOCOLS } from '@/constants';
import { excludeFalsy, handleUnknownError } from '@/utils';
import { ROUTE_MULTISIG_ACCOUNT } from '@/popup/router/routeNames';
import {
  useAccounts,
  useModals,
  useMultisigAccountCreate,
  useMultisigAccounts,
} from '@/composables';
import { validateHash } from '@/protocols/aeternity/helpers';
import {
  MULTISIG_CREATION_PHASES,
  MULTISIG_VAULT_MIN_NUM_OF_SIGNERS,
} from '@/protocols/aeternity/config';

import FormAccountInput from '@/popup/components/form/FormAccountInput.vue';
import Modal from '@/popup/components/Modal.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import BtnIcon from '@/popup/components/buttons/BtnIcon.vue';
import BtnText from '@/popup/components/buttons/BtnText.vue';
import BtnHelp from '@/popup/components/buttons/BtnHelp.vue';
import FormSelect from '@/popup/components/form/FormSelect.vue';
import FormNumberSelect from '@/popup/components/form/FormNumberSelect.vue';
import MultisigVaultCreateReview from '@/popup/components/MultisigVaultCreateReview.vue';
import MultisigVaultCreateProgress from '@/popup/components/MultisigVaultCreateProgress.vue';

import TrashIcon from '@/icons/trash.svg?vue-component';
import CircleCloseIcon from '@/icons/circle-close.svg?vue-component';
import QrScanIcon from '@/icons/qr-scan.svg?vue-component';
import AddressBookIcon from '@/icons/menu-card-fill.svg?vue-component';
import PlusCircleIcon from '@/icons/plus-circle-fill.svg?vue-component';

const STEPS = {
  form: 'form',
  review: 'review',
  processing: 'processing',
} as const;
type Step = ObjectValues<typeof STEPS>;

export default defineComponent({
  name: 'MultisigVaultCreate',
  components: {
    FormAccountInput,
    FormNumberSelect,
    Modal,
    BtnMain,
    BtnIcon,
    BtnText,
    BtnHelp,
    MultisigVaultCreateProgress,
    MultisigVaultCreateReview,
    FormSelect,
    Field,
    Form,
  },
  props: {
    resolve: { type: Function as PropType<() => void>, required: true },
    reject: { type: Function, required: true },
  },
  setup(props) {
    const router = useRouter();
    const { t } = useI18n();

    const { aeAccountsSelectOptions } = useAccounts();
    const { openDefaultModal, openScanQrModal, openModal } = useModals();
    const errors = useFormErrors();

    const {
      setActiveMultisigAccountId,
    } = useMultisigAccounts({ pollOnce: true });

    const {
      multisigAccount,
      multisigAccountCreationPhase,
      multisigAccountCreationFee,
      isMultisigAccountAccessible,
      isMultisigAccountCreated,
      notEnoughBalanceToCreateMultisig,
      pendingMultisigCreationTxs,
      prepareVaultCreationAttachTx,
      deployMultisigAccount,
    } = useMultisigAccountCreate();

    const currentStep = ref<Step>(STEPS.form);

    const signers = ref<ICreateMultisigAccount[]>([]);
    const confirmationsRequired = ref<number>(MULTISIG_VAULT_MIN_NUM_OF_SIGNERS);
    const currentMultisigAccountId = ref<Encoded.AccountAddress>();

    const signersAddressList = computed(
      (): Encoded.AccountAddress[] => (signers.value)
        .map(({ address }) => address)
        .filter(excludeFalsy),
    );

    function checkIfSignerAddressDuplicated(signer: ICreateMultisigAccount): boolean {
      return (
        validateHash(signer.address).valid
        && signers.value.filter(({ address }) => signer.address === address).length >= 2
      );
    }

    const isValidSigners = computed(
      () => !signers.value.filter(
        (signer) => (
          !validateHash(signer.address).valid
          || checkIfSignerAddressDuplicated(signer)
        ),
      ).length,
    );

    const canCreateMultisig = computed(
      () => (
        signers.value.length >= MULTISIG_VAULT_MIN_NUM_OF_SIGNERS
        && isValidSigners.value
        && !errors.value?.length
      ),
    );

    function addNewSigner() {
      signers.value.push({ address: undefined });
    }

    function removeSigner(index: number) {
      signers.value.splice(index, 1);
    }

    function clearSigner(index: number) {
      signers.value[index].address = undefined;
    }

    function updateSigner(index: number, address: Encoded.AccountAddress) {
      // Check if signer address already added
      if (
        signers.value.find((signer) => signer.address === address)
        && signers.value[index].address !== address
      ) {
        openDefaultModal({
          title: t('modals.createMultisigAccount.errorDuplicatingSigner'),
          icon: 'critical',
        });
        return;
      }

      // Update the signer address
      signers.value[index].address = address;
    }

    async function updateSignerFromAddressBook(index: number) {
      const address = await openModal<Encoded.AccountAddress>(
        MODAL_ADDRESS_BOOK_ACCOUNT_SELECTOR,
        { protocol: PROTOCOLS.aeternity, isSigner: true },
      );
      if (address) {
        updateSigner(index, address);
      }
    }

    function getErrorMessage(signer: ICreateMultisigAccount) {
      return checkIfSignerAddressDuplicated(signer)
        ? t('modals.createMultisigAccount.errorDuplicatingInputMessage')
        : null;
    }

    /**
     * Scans a QR code and add a signer address
     * @param {number} signerIndex - The index of the signer to update the address of
     */
    async function scanSignerAccountQrCode(signerIndex: number) {
      const scanResult = await openScanQrModal({
        title: t('multisig.scanAddress'),
      });

      if (!scanResult) return;

      const { valid, isName } = validateHash(scanResult);

      // Check if the address is valid and it's not a name
      if (!(valid && !isName)) {
        openDefaultModal({
          title: t('modals.invalid-qr-code.msg'),
          icon: 'critical',
        });
        return;
      }

      updateSigner(signerIndex, scanResult as Encoded.AccountAddress);
    }

    function getSignerLabel(index: number) {
      return `${t('modals.createMultisigAccount.signer')} ${index + 1}`;
    }

    function openFormStep() {
      currentStep.value = STEPS.form;
    }

    async function openReviewStep() {
      currentMultisigAccountId.value = await prepareVaultCreationAttachTx(
        confirmationsRequired.value,
        signersAddressList.value,
      );
      currentStep.value = STEPS.review;
    }

    async function createMultisigAccount() {
      currentStep.value = STEPS.processing;
      try {
        if (!currentMultisigAccountId.value) {
          throw Error(String(t('multisig.multisigVaultCreationFailed')));
        }
        await deployMultisigAccount(
          currentMultisigAccountId.value,
          confirmationsRequired.value,
          signersAddressList.value,
        );
      } catch (error: any) {
        handleUnknownError(error);
        await openDefaultModal({
          title: t('multisig.multisigVaultCreationFailed'),
          icon: 'critical',
          msg: error?.details?.reason,
          textCenter: true,
        });
        currentStep.value = STEPS.form;
      }
    }

    async function navigateToMultisigVault() {
      if (multisigAccount.value) {
        props.resolve();
        setActiveMultisigAccountId(multisigAccount.value.gaAccountId);
        router.push({ name: ROUTE_MULTISIG_ACCOUNT });
      }
    }

    onMounted(() => {
      if (!signers.value.length) {
        for (let n = 0; n < MULTISIG_VAULT_MIN_NUM_OF_SIGNERS; n += 1) {
          addNewSigner();
        }
      }
    });

    watch(
      () => signers.value.length,
      (newSignersLength, oldSignersLength) => {
        if (newSignersLength < oldSignersLength && newSignersLength < confirmationsRequired.value) {
          confirmationsRequired.value = newSignersLength;
        }
      },
    );

    return {
      TrashIcon,
      CircleCloseIcon,
      QrScanIcon,
      AddressBookIcon,
      PlusCircleIcon,
      MULTISIG_VAULT_MIN_NUM_OF_SIGNERS,
      MULTISIG_CREATION_PHASES,
      PROTOCOLS,
      STEPS,
      currentMultisigAccountId,
      aeAccountsSelectOptions,
      multisigAccount,
      multisigAccountCreationPhase,
      pendingMultisigCreationTxs,
      multisigAccountCreationFee,
      isMultisigAccountAccessible,
      isMultisigAccountCreated,
      currentStep,
      confirmationsRequired,
      signers,
      isValidSigners,
      canCreateMultisig,
      openFormStep,
      getErrorMessage,
      openReviewStep,
      createMultisigAccount,
      scanSignerAccountQrCode,
      addNewSigner,
      removeSigner,
      clearSigner,
      getSignerLabel,
      navigateToMultisigVault,
      checkIfSignerAddressDuplicated,
      updateSignerFromAddressBook,
      notEnoughBalanceToCreateMultisig,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.multisig-vault-create {
  padding-top: env(safe-area-inset-top);

  // Step 1

  &-form {
    .signers-add-wrapper {
      display: flex;
      align-items: center;
      margin: 20px 0;

      .btn-help {
        display: flex;
        margin-left: 4px;
      }
    }

    .close-icon {
      padding: 0;
      opacity: 0.5;
      z-index: 0;
    }

    .buttons {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
    }

    .description,
    .signers-count {
      color: rgba($color-white, 0.5);
    }

    .signers-count {
      display: flex;
      align-items: center;
      padding: 6px 0;

      .text-emphasis {
        color: rgba($color-white, 0.75);
      }

      .num-of-signers-selector {
        @extend %face-sans-15-regular;

        width: 45px;
        height: 40px;
        margin-right: 10px;
        border-radius: 10px;
        text-align: center;
        color: $color-white;
        border: 2px solid rgba($color-white, 0.08);
        background-color: rgba($color-white, 0.08);

        option {
          color: $color-white;
          background-color: $color-bg-6;
        }
      }

      .text {
        margin-left: 4px;
        margin-right: 8px;
      }
    }
  }
}
</style>
