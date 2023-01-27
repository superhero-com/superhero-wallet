<template>
  <Modal
    full-screen
    from-bottom
    has-close-button
    class="multisig-vault-create"
    @close="reject()"
  >
    <MultisigVaultCreationProgress
      v-if="showVaultCreationProgress"
      :progress="multisigProgress"
      :multisig-account="multisigAccount"
    />
    <template v-else>
      <div class="content">
        <h2 class="title">
          {{ $t('modals.createMultisigAccount.title') }}
        </h2>
        <div
          v-for="(signer, index) in signers"
          :key="`signer${index}`"
        >
          <InputField
            v-model.trim="signer.address"
            v-validate="{
              required: true,
              name_registered_address_or_url: true,
            }"
            :label="getSignerLabel(index)"
            :placeholder="$t('modals.createMultisigAccount.signerInputPlaceholder')"
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
          </InputField>
        </div>

        <div class="signers-add-wrapper">
          <BtnText
            :icon="PlusCircle"
            :text="$t('modals.createMultisigAccount.addSigner')"
            @click="addNewSigner"
          />

          <BtnHelp
            :title="$t('modals.createMultisigAccount.addSignerHelpTitle')"
            :msg="$t('modals.createMultisigAccount.addSignerHelpMsg')"
          />
        </div>

        <div class="consensus">
          <div class="description">
            {{ $t('modals.createMultisigAccount.consensusRequiredDesc') }}
          </div>

          <div class="signers-count">
            <select
              v-model="requiredNumOfConfirmations"
              class="num-of-singers-selector"
            >
              <template
                v-for="signerIdx of signers.length"
              >
                <option
                  v-if="signerIdx !== 1"
                  :key="`option-item-${signerIdx}`"
                  :value="signerIdx"
                >
                  {{ signerIdx }}
                </option>
              </template>
            </select>

            <i18n
              path="modals.createMultisigAccount.consensusRequiredContent"
              tag="div"
              class="text"
            >
              <span>
                {{ minNumOfSigners }}
              </span>
            </i18n>

            <BtnHelp
              :title="$t('modals.createMultisigAccount.consensusRequiredHelpTitle')"
              :msg="$t('modals.createMultisigAccount.consensusRequiredHelpMsg')"
            />
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <BtnMain
        v-if="showVaultCreationProgress"
        inline
        nowrap
        :disabled="isCreatingVault"
        @click="navigateToMultisigVault"
      >
        {{ $t('modals.creatingMultisigAccount.btnText') }}
      </BtnMain>
      <BtnMain
        v-else
        inline
        nowrap
        :disabled="!canCreateMultisig"
        @click="createMultisigAccount"
      >
        {{ $t('modals.createMultisigAccount.btnText') }}
      </BtnMain>
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
} from '@vue/composition-api';
import {
  MODAL_READ_QR_CODE,
  MODAL_DEFAULT,
  validateHash,
  MULTISIG_VAULT_MIN_NUM_OF_SIGNERS,
  handleUnknownError,
} from '../../utils';
import { ICreateMultisigAccount, IMultisigAccountBase } from '../../../types';
import { ROUTE_ACCOUNT_DETAILS } from '../../router/routeNames';
import { useMultisigAccounts } from '../../../composables';
import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import BtnText from '../buttons/BtnText.vue';
import BtnHelp from '../buttons/BtnHelp.vue';
import InputField from '../InputField.vue';
import MultisigVaultCreationProgress from '../MultisigVaultCreationProgress.vue';
import QrScanIcon from '../../../icons/qr-scan.svg?vue-component';
import PlusCircle from '../../../icons/plus-circle-fill.svg?vue-component';

export default defineComponent({
  name: 'MultisigVaultCreate',
  components: {
    Modal,
    BtnMain,
    BtnText,
    BtnHelp,
    InputField,
    MultisigVaultCreationProgress,
    QrScanIcon,
  },
  props: {
    resolve: { type: Function as PropType<() => void>, required: true },
    reject: { type: Function, required: true },
  },
  setup(props, { root }) {
    const { deployMultisigAccount, multisigProgress } = useMultisigAccounts({ store: root.$store });
    const multisigAccount = ref<IMultisigAccountBase | null>(null);
    const signers = ref<ICreateMultisigAccount[]>([]);
    const isCreatingVault = ref<boolean>(false);
    const requiredNumOfConfirmations = ref<number>(MULTISIG_VAULT_MIN_NUM_OF_SIGNERS);
    const minNumOfSigners = computed(
      () => signers.value.length < MULTISIG_VAULT_MIN_NUM_OF_SIGNERS
        ? MULTISIG_VAULT_MIN_NUM_OF_SIGNERS
        : signers.value.length,
    );

    function checkIfSignerAddressDuplicated(signer: ICreateMultisigAccount) {
      if (!validateHash(signer.address).valid) return false;

      return signers.value.filter(
        (_singer) => signer.address === _singer.address,
      ).length >= 2;
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
      ),
    );
    const showVaultCreationProgress = computed<boolean>(
      () => isCreatingVault.value || !!multisigAccount.value,
    );

    function addNewSigner() {
      signers.value.push({
        address: '',
      });
    }

    /**
     * Scans a QR code and add a signer address
     * @param {number} signerIndex - The index of the signer to update the address of
     */
    async function openScanQrModal(signerIndex: number) {
      const scanResult = await root.$store.dispatch('modals/open', {
        name: MODAL_READ_QR_CODE,
        title: root.$t('pages.send.scanAddress'),
        icon: 'critical',
      });

      if (!scanResult) return;

      const { valid, isName } = validateHash(scanResult);

      // check if the address is valid and it's not a name
      if (!(valid && !isName)) {
        root.$store.dispatch('modals/open', {
          name: MODAL_DEFAULT,
          title: root.$t('modals.invalid-qr-code.msg'),
          icon: 'critical',
        });
        return;
      }

      // Check if signer address already added
      if (signers.value.find((signer) => signer.address === scanResult)) {
        root.$store.dispatch('modals/open', {
          name: MODAL_DEFAULT,
          title: root.$t('modals.createMultisigAccount.errorDuplicatingSigner'),
          icon: 'critical',
        });
        return;
      }

      // Update the signer address
      signers.value[signerIndex].address = scanResult;
    }

    function getSignerLabel(index: number) {
      return `${root.$t('modals.createMultisigAccount.signer')} ${index + 1}`;
    }

    async function createMultisigAccount() {
      isCreatingVault.value = true;
      try {
        multisigAccount.value = await deployMultisigAccount(
          requiredNumOfConfirmations.value,
          signers.value.map((signer) => signer.address) as [string, string, ...string[]],
        );
        signers.value = [];
      } catch (error) {
        handleUnknownError(error);
      }
      isCreatingVault.value = false;
    }

    async function navigateToMultisigVault() {
      await props.resolve();
      // TODO:: change to multisig account details
      root.$router.push({ name: ROUTE_ACCOUNT_DETAILS });
    }

    onMounted(() => {
      if (!signers.value.length) {
        addNewSigner();
        addNewSigner();
      }
    });

    return {
      requiredNumOfConfirmations,
      signers,
      minNumOfSigners,
      isValidSigners,
      canCreateMultisig,
      createMultisigAccount,
      openScanQrModal,
      addNewSigner,
      getSignerLabel,
      isCreatingVault,
      multisigProgress,
      multisigAccount,
      navigateToMultisigVault,
      showVaultCreationProgress,
      checkIfSignerAddressDuplicated,
      PlusCircle,
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

  .content {
    .title {
      @extend %face-sans-18-medium;

      margin-bottom: 20px;
      line-height: 24px;
      text-align: center;
      color: variables.$color-white;
    }

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

    .signers-count {
      display: flex;
      align-items: center;
      padding: 6px 0;

      .num-of-singers-selector {
        width: 45px;
        height: 40px;
        border-radius: 10px;
        text-align: center;
        color: variables.$color-white;
        border-color: rgba(variables.$color-white, 0.08);
        background-color: rgba(variables.$color-white, 0.08);
      }

      .text {
        margin: 0 8px 0 10px;
      }
    }
  }
}
</style>
