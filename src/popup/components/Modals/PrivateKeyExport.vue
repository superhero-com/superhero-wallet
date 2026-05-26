<template>
  <Modal
    class="private-key-export"
    from-bottom
    has-close-button
    centered
    @close="resolve"
  >
    <h1
      class="text-heading-4 heading"
      v-text="$t('modals.privateKeyExport.title')"
    />
    <AccountInfo
      :account="activeAccount"
      avatar-size="rg"
      is-list-name
      show-protocol-icon
      show-explorer-link
    />
    <InfoBox
      class="warning"
      type="warning"
      :text="$t('modals.privateKeyExport.warning')"
    />
    <Form @submit="handleMainButtonClick()">
      <InputPassword
        v-if="!privateKey && !IS_MOBILE_APP && !isUsingDefaultPassword"
        v-model="password"
        data-cy="password"
        autofocus
        :placeholder="$t('pages.secureLogin.login.placeholder')"
        :label="$t('pages.secureLogin.login.label')"
        :message="isAuthFailed ? $t('pages.secureLogin.login.error') : null"
        @input="isAuthFailed = false"
      />
      <template v-else-if="privateKey">
        <DetailsItem :label="$t('modals.privateKeyImport.privateKey')">
          <template #label>
            <BtnHelp
              :title="$t('modals.privateKeyImport.helpTitle')"
              :msg="$t('modals.privateKeyExport.helpMsg')"
            />
          </template>

          <template #value>
            <CopyText
              data-cy="copy"
              :value="privateKey"
              :copied="copied"
              hide-icon
              class="private-key"
              @click="copyPrivateKey()"
            />
          </template>
        </DetailsItem>
      </template>
    </Form>

    <template #footer>
      <BtnMain
        variant="muted"
        :text="$t('common.cancel')"
        @click="resolve()"
      />
      <BtnMain
        :disabled="(
          (!password.length || isAuthenticating || isAuthFailed)
          && !IS_MOBILE_APP
          && !isUsingDefaultPassword
        )"
        :text="mainButtonText"
        @click="handleMainButtonClick()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  ref,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { Form } from 'vee-validate';

import type { ResolveCallback } from '@/types';

import { decrypt, generateEncryptionKey } from '@/utils';
import {
  useAccounts,
  useAuth,
  useCopy,
  useModals,
  useUi,
} from '@/composables';
import { IS_MOBILE_APP } from '@/constants';

import AccountInfo from '@/popup/components/AccountInfo.vue';
import BtnHelp from '@/popup/components/buttons/BtnHelp.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import CopyText from '@/popup/components/CopyText.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import InfoBox from '@/popup/components/InfoBox.vue';
import InputPassword from '@/popup/components/InputPassword.vue';
import Modal from '@/popup/components/Modal.vue';

import PrivateKeyIcon from '@/icons/private-key.svg?vue-component';

export default defineComponent({
  components: {
    AccountInfo,
    BtnHelp,
    BtnMain,
    CopyText,
    DetailsItem,
    Form,
    InfoBox,
    InputPassword,
    Modal,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
  },
  setup() {
    const { t } = useI18n();

    const isAuthFailed = ref(false);
    const isAuthenticating = ref(false);
    const password = ref('');
    const privateKey = ref('');

    const { activeAccount } = useAccounts();
    const {
      checkBiometricLoginAvailability,
      encryptionSalt,
      mnemonicEncrypted,
      isUsingDefaultPassword,
    } = useAuth();
    const { copy, copied } = useCopy();
    const { openBiometricLoginModal, openConfirmModal } = useModals();
    const { isBiometricLoginEnabled } = useUi();

    const mainButtonText = computed(() => {
      if (copied.value) {
        return t('modals.receive.copied');
      }
      if (privateKey.value) {
        return t('modals.privateKeyExport.copyBtnText');
      }
      return t('modals.privateKeyExport.mainBtnText');
    });

    /**
     * Three-way re-auth gate before revealing the private key, mirroring
     * the seed-phrase route guard in `router/routes.ts`:
     *
     *  - Mobile app with biometry available & enabled: force a fresh biometric
     *    prompt so a user who just unlocked the app still has to confirm.
     *  - Extension/web (including mobile web) with a real password: verify it by attempting the
     *    mnemonic decryption (the catch below marks `isAuthFailed`).
     *  - Everything else (mobile app with biometry off, or extension in
     *    skip-password mode) has no strong re-auth available; fall back to
     *    an explicit confirm prompt so the private key never surfaces
     *    silently on a click-through. This closes the gap where the modal
     *    previously revealed the key with no gate at all in those states.
     */
    async function login() {
      if (isAuthenticating.value) {
        return;
      }
      isAuthenticating.value = true;
      try {
        if (
          IS_MOBILE_APP
          && isBiometricLoginEnabled.value
          && await checkBiometricLoginAvailability()
        ) {
          const authenticated = await openBiometricLoginModal({ force: true })
            .then(() => true)
            .catch(() => false);
          if (!authenticated) {
            return;
          }
        } else if (!isUsingDefaultPassword.value && !IS_MOBILE_APP) {
          try {
            const key = await generateEncryptionKey(password.value, encryptionSalt.value!);
            await decrypt(key, mnemonicEncrypted.value!);
          } catch {
            isAuthFailed.value = true;
            return;
          }
        } else {
          const confirmed = await openConfirmModal({
            title: t('modals.privateKeyExport.title'),
            msg: t('modals.privateKeyExport.warning'),
          })
            .then(() => true)
            .catch(() => false);
          if (!confirmed) {
            return;
          }
        }
        privateKey.value = Buffer.from(activeAccount.value.secretKey).toString('hex');
      } finally {
        isAuthenticating.value = false;
      }
    }

    function copyPrivateKey() {
      copy(privateKey.value);
    }

    function handleMainButtonClick() {
      if (privateKey.value) {
        copyPrivateKey();
      } else {
        login();
      }
    }

    return {
      PrivateKeyIcon,
      IS_MOBILE_APP,
      activeAccount,
      copied,
      isAuthenticating,
      isAuthFailed,
      isUsingDefaultPassword,
      mainButtonText,
      password,
      privateKey,
      copyPrivateKey,
      handleMainButtonClick,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/typography';

.private-key-export {
  .heading {
    margin-bottom: 1em;
  }

  .warning {
    text-align: left;
  }

  .private-key {
    @extend %face-sans-14-medium;

    letter-spacing: 0.2em;
    text-align: left;
  }
}
</style>
