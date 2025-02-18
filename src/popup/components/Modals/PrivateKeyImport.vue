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
        :disabled="!privateKey || !!error"
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
import { ACCOUNT_TYPES, MODAL_HELP } from '@/constants';
import { useAccounts, useModals } from '@/composables';

import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import FormTextarea from '@/popup/components/form/FormTextarea.vue';
import Modal from '@/popup/components/Modal.vue';
import { isAddressValid, Encoding, decode } from '@aeternity/aepp-sdk';

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
    const { openModal } = useModals();

    const privateKey = ref('');
    const error = ref('');

    function getProtocolName(protocol: Protocol) {
      return ProtocolAdapterFactory.getAdapter(protocol).protocolName;
    }

    async function importPrivateKey() {
      const adapter = ProtocolAdapterFactory.getAdapter(props.protocol);
      let privateKeyBuffer;
      try {
        privateKeyBuffer = isAddressValid(privateKey.value, Encoding.AccountSecretKey)
          ? decode(privateKey.value) : Buffer.from(privateKey.value, 'hex');
        const account = adapter.resolveAccountRaw(
          {
            type: ACCOUNT_TYPES.privateKey,
            isRestored: false,
            protocol: props.protocol,
            privateKey: privateKeyBuffer,
          },
          0,
          0,
        );

        if (!account) {
          throw new Error(`Fail to resolve account with private key: ${privateKey.value}`);
        }

        if (
          accounts.value.find(({ protocol, secretKey }) => (
            secretKey
            && Buffer.from(secretKey).toString('hex') === Buffer.from(account.secretKey).toString('hex')
            && protocol === props.protocol
          ))
        ) {
          error.value = t('modals.privateKeyImport.privateKeyExist');
          return;
        }
      } catch (e) {
        error.value = t('modals.privateKeyImport.invalidPrivateKey', {
          protocol: getProtocolName(props.protocol),
        });
        return;
      }
      const globalIdx = await addPrivateKeyAccount({
        type: ACCOUNT_TYPES.privateKey,
        isRestored: false,
        protocol: props.protocol,
        privateKey: privateKeyBuffer,
      });
      setActiveAccountByGlobalIdx(globalIdx);
      props.resolve();
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
