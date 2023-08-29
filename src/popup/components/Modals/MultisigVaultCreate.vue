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
      <h2 class="text-heading-1">
        {{ $t('modals.createMultisigAccount.title') }}
      </h2>
      <div
        v-for="(signer, index) in signers"
        :key="`signer${index}`"
      >
        <FormSelect
          v-if="index === 0"
          v-model.trim="signer.address"
          :default-text="$t('modals.createMultisigAccount.signerInputPlaceholder')"
          :label="getSignerLabel(index)"
          item-title="address"
          :options="aeAccountsSelectOptions"
          account-select
        />
        <Field
          v-else
          v-slot="{ field, errorMessage }"
          v-model.trim="signer.address"
          :name="`signer-address-${index}`"
          :rules="{
            required: true,
            account_address: true,
          }"
        >
          <FormTextarea
            v-bind="field"
            :model-value="signer.address"
            auto-height
            :label="getSignerLabel(index)"
            :placeholder="$t('modals.createMultisigAccount.signerInputPlaceholder')"
            :name="`signer-address-${index}`"
            :message="errorMessage || getErrorMessage(signer)"
            :class="{
              error: checkIfSignerAddressDuplicated(signer)
            }"
          >
            <template #label-after>
              <a
                class="scan-button"
                @click.prevent="openScanQrModal(index)"
              >
                <QrScanIcon />
              </a>
            </template>
            <template #after>
              <a
                v-if="index >= MULTISIG_VAULT_MIN_NUM_OF_SIGNERS"
                @click="removeSigner(index)"
              >
                <PlusCircleIcon
                  class="btn-remove-signer"
                />
              </a>
            </template>
          </FormTextarea>
        </Field>
      </div>

      <div class="signers-add-wrapper">
        <BtnText
          :icon="PlusCircleIcon"
          :text="$t('modals.createMultisigAccount.addSigner')"
          @click="addNewSigner"
        />

        <BtnHelp
          :title="$t('multisig.authorizedSigners')"
          :msg="$t('modals.createMultisigAccount.addSignerHelpMsg')"
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
          :text="$t('modals.createMultisigAccount.btnTextShort')"
          wide
          :disabled="multisigAccountCreationPhase != MULTISIG_CREATION_PHASES.signed
            || notEnoughBalanceToCreateMultisig"
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
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  Field,
  Form,
  useFormErrors,
} from 'vee-validate';
import { Encoded } from '@aeternity/aepp-sdk';

import {
  MODAL_READ_QR_CODE,
  PROTOCOL_AETERNITY,
} from '@/constants';
import {
  excludeFalsy,
  handleUnknownError,
} from '@/utils';
import type {
  ICreateMultisigAccount,
  ObjectValues,
} from '@/types';
import { ROUTE_MULTISIG_DETAILS_INFO } from '@/popup/router/routeNames';
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

import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import BtnText from '../buttons/BtnText.vue';
import BtnHelp from '../buttons/BtnHelp.vue';
import FormSelect from '../form/FormSelect.vue';
import FormTextarea from '../form/FormTextarea.vue';
import FormNumberSelect from '../form/FormNumberSelect.vue';
import MultisigVaultCreateReview from '../MultisigVaultCreateReview.vue';
import MultisigVaultCreateProgress from '../MultisigVaultCreateProgress.vue';

import QrScanIcon from '../../../icons/qr-scan.svg?vue-component';
import PlusCircleIcon from '../../../icons/plus-circle-fill.svg?vue-component';

const STEPS = {
  form: 'form',
  review: 'review',
  processing: 'processing',
} as const;
type Step = ObjectValues<typeof STEPS>;

export default defineComponent({
  name: 'MultisigVaultCreate',
  components: {
    FormNumberSelect,
    FormTextarea,
    Modal,
    BtnMain,
    BtnText,
    BtnHelp,
    MultisigVaultCreateProgress,
    QrScanIcon,
    PlusCircleIcon,
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
    const store = useStore();
    const router = useRouter();
    const { t } = useI18n();

    const { aeAccountsSelectOptions } = useAccounts({ store });
    const { openModal, openDefaultModal } = useModals();
    const errors = useFormErrors();

    const {
      setActiveMultisigAccountId,
    } = useMultisigAccounts({ store, pollOnce: true });

    const {
      multisigAccount,
      multisigAccountCreationPhase,
      pendingMultisigCreationTxs,
      multisigAccountCreationFee,
      isMultisigAccountAccessible,
      isMultisigAccountCreated,
      prepareVaultCreationAttachTx,
      deployMultisigAccount,
      notEnoughBalanceToCreateMultisig,
    } = useMultisigAccountCreate({ store });

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

    function getErrorMessage(signer: ICreateMultisigAccount) {
      return checkIfSignerAddressDuplicated(signer)
        ? t('modals.createMultisigAccount.errorDuplicatingInputMessage')
        : null;
    }

    /**
     * Scans a QR code and add a signer address
     * @param {number} signerIndex - The index of the signer to update the address of
     */
    async function openScanQrModal(signerIndex: number) {
      const scanResult = await openModal(MODAL_READ_QR_CODE, {
        title: t(
          'pages.send.scanAddress',
          { protocolName: ProtocolAdapterFactory.getAdapter(PROTOCOL_AETERNITY).protocolName },
        ),
        icon: 'critical',
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

      // Check if signer address already added
      if (signers.value.find((signer) => signer.address === scanResult)) {
        openDefaultModal({
          title: t('modals.createMultisigAccount.errorDuplicatingSigner'),
          icon: 'critical',
        });
        return;
      }

      // Update the signer address
      signers.value[signerIndex].address = scanResult;
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
      } catch (error) {
        handleUnknownError(error);
        await openDefaultModal({
          title: t('multisig.multisigVaultCreationFailed'),
          icon: 'critical',
        });
        currentStep.value = STEPS.form;
      }
    }

    async function navigateToMultisigVault() {
      if (multisigAccount.value) {
        await props.resolve();
        setActiveMultisigAccountId(multisigAccount.value.gaAccountId);
        router.push({ name: ROUTE_MULTISIG_DETAILS_INFO });
      }
    }

    onMounted(() => {
      if (!signers.value.length) {
        // eslint-disable-next-line no-plusplus
        for (let n = 0; n < MULTISIG_VAULT_MIN_NUM_OF_SIGNERS; n++) {
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
      PlusCircleIcon,
      MULTISIG_VAULT_MIN_NUM_OF_SIGNERS,
      MULTISIG_CREATION_PHASES,
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
      openScanQrModal,
      addNewSigner,
      removeSigner,
      getSignerLabel,
      navigateToMultisigVault,
      checkIfSignerAddressDuplicated,
      notEnoughBalanceToCreateMultisig,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.multisig-vault-create {
  padding-top: env(safe-area-inset-top);

  // Step 1
  &-form {
    .scan-button {
      color: variables.$color-white;
      display: block;
      width: 32px;
      height: 24px;
    }

    .signers-add-wrapper {
      display: flex;
      align-items: center;
      margin: 20px 0;

      .btn-help {
        display: flex;
        margin-left: 4px;
      }
    }

    .btn-remove-signer {
      width: 20px !important;
      margin: -4px -6px -4px 0;
      transform: rotate(45deg);
      cursor: pointer;
      transition: variables.$transition-interactive;
      color: variables.$color-grey-light;

      &:hover {
        opacity: 0.8;
      }
    }

    .description,
    .signers-count {
      color: rgba(variables.$color-white, 0.5);
    }

    .signers-count {
      display: flex;
      align-items: center;
      padding: 6px 0;

      .text-emphasis {
        color: rgba(variables.$color-white, 0.75);
      }

      .num-of-signers-selector {
        @extend %face-sans-15-regular;

        width: 45px;
        height: 40px;
        margin-right: 10px;
        border-radius: 10px;
        text-align: center;
        color: variables.$color-white;
        border: 2px solid rgba(variables.$color-white, 0.08);
        background-color: rgba(variables.$color-white, 0.08);

        option {
          color: variables.$color-white;
          background-color: variables.$color-bg-6;
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
