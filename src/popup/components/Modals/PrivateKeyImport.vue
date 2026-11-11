<template>
  <Modal
    class="private-key-import"
    from-bottom
    has-close-button
    @close="resolve"
  >
    <div class="heading text-center">
      <p
        class="text-heading-4"
        v-text="$t('modals.privateKeyImport.title', {
          protocol: getProtocolName(protocol),
        })"
      />
      <p v-text="$t('modals.privateKeyImport.subtitle')" />
    </div>

    <FormTextarea
      v-model="privateKey"
      size="sm"
      :label="$t('modals.privateKeyImport.privateKey')"
      :placeholder="$t('modals.privateKeyImport.placeholder')"
      :message="error"
      :resizable="false"
      data-cy="field-private-key"
      enter-submit
      show-help
      @submit="importPrivateKey()"
      @help="showPrivateKeyHelp()"
    />

    <template #footer>
      <BtnMain
        :disabled="!privateKey || !!error || isImporting"
        :text="$t('modals.privateKeyImport.btnText')"
        data-cy="btn-import"
        @click="importPrivateKey()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';

import type { Protocol, ResolveCallback } from '@/types';

import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { ImportedAccountsUnreadableError } from '@/lib/errors';
import { ACCOUNT_TYPES, MODAL_HELP } from '@/constants';
import { useAccounts, useModals } from '@/composables';

import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import FormTextarea from '@/popup/components/form/FormTextarea.vue';
import Modal from '@/popup/components/Modal.vue';

export default defineComponent({
  components: {
    BtnMain,
    Modal,
    FormTextarea,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    protocol: { type: String as PropType<Protocol>, required: true },
  },
  setup(props) {
    const { t } = useI18n();

    const { accounts, addPrivateKeyAccount, setActiveAccountByGlobalIdx } = useAccounts();
    const { openModal, openDefaultModal } = useModals();

    const privateKey = ref('');
    const error = ref('');
    const isImporting = ref(false);

    function getProtocolName(protocol: Protocol) {
      return ProtocolAdapterFactory.getAdapter(protocol).protocolName;
    }

    function isImported(secretKey: Uint8Array) {
      return accounts.value.some((item) => (
        item.secretKey
        && Buffer.from(item.secretKey).toString('hex') === Buffer.from(secretKey).toString('hex')
        && item.protocol === props.protocol
      ));
    }

    async function storePrivateKey() {
      const adapter = ProtocolAdapterFactory.getAdapter(props.protocol);
      let secretKey: Uint8Array | undefined;
      try {
        const account = adapter.resolveAccountRaw(
          {
            type: ACCOUNT_TYPES.privateKey,
            isRestored: false,
            protocol: props.protocol,
            privateKey: Buffer.from(privateKey.value, 'hex'),
          },
          0,
          0,
        );

        if (!account) {
          throw new Error(`Fail to resolve account with private key: ${privateKey.value}`);
        }

        if (isImported(account.secretKey)) {
          error.value = t('modals.privateKeyImport.privateKeyExist');
          return;
        }
        secretKey = account.secretKey;
      } catch (e) {
        error.value = t('modals.privateKeyImport.invalidPrivateKey', {
          protocol: getProtocolName(props.protocol),
        });
        return;
      }
      try {
        const globalIdx = await addPrivateKeyAccount({
          type: ACCOUNT_TYPES.privateKey,
          isRestored: false,
          protocol: props.protocol,
          privateKey: Buffer.from(privateKey.value, 'hex'),
        });
        setActiveAccountByGlobalIdx(globalIdx);
        props.resolve();
      } catch (e) {
        // The user is offered to remove them instead.
        if (!(e instanceof ImportedAccountsUnreadableError)) {
          openDefaultModal({
            icon: 'critical',
            // Kept in memory when only the device storage failed (mobile).
            msg: secretKey && isImported(secretKey)
              ? t('modals.privateKeyImport.saveFailedUntilClosed')
              : t('modals.privateKeyImport.saveFailed'),
          });
          throw e;
        }
      }
    }

    /** One at a time: a second submit meanwhile would import it again. */
    async function importPrivateKey() {
      if (isImporting.value) return;
      isImporting.value = true;
      try {
        await storePrivateKey();
      } finally {
        isImporting.value = false;
      }
    }

    function showPrivateKeyHelp() {
      openModal(MODAL_HELP, {
        title: t('modals.privateKeyImport.helpTitle'),
        msg: t('modals.privateKeyImport.helpMsg'),
        textCenter: true,
      });
    }

    watch(privateKey, () => {
      error.value = '';
    });

    return {
      error,
      isImporting,
      privateKey,
      getProtocolName,
      importPrivateKey,
      showPrivateKeyHelp,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/typography';

.private-key-import {
  .heading {
    @extend %text-body;

    line-height: 24px;
  }
}
</style>
