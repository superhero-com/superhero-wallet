<template>
  <Modal
    from-bottom
    has-close-button
    @close="resolve()"
  >
    <div class="permission-manager">
      <p
        class="text-heading-4 text-center"
        v-text="(editView) ? $t('pages.titles.permissionsEdit') : $t('pages.titles.permissionsAdd')"
      />
      <div
        v-if="!editView"
        class="text-description"
        v-text="$t('pages.permissions.add-description')"
      />

      <div class="inputs">
        <div class="permission-row">
          <Field
            v-slot="{ field, errorMessage }"
            name="name"
            :rules="{
              required: true,
              max_len: 32,
            }"
          >
            <InputField
              v-bind="field"
              v-model="permission.name"
              name="name"
              :label="$t('pages.permissions.custom-name')"
              :placeholder="$t('pages.permissions.enter-custom-name')"
              :text-limit="32"
              :message="errorMessage"
            />
          </Field>
        </div>

        <div class="permission-row">
          <Field
            v-slot="{ field, errorMessage }"
            name="url"
            :rules="{
              required: true,
              url: permissionHostValidation,
            }"
          >
            <InputField
              v-bind="field"
              v-model="permission.host"
              type="url"
              name="url"
              :label="$t('pages.permissions.permissions-for-url')"
              :placeholder="$t('pages.permissions.enter-url')"
              :message="errorMessage"
            />
          </Field>
        </div>
      </div>
      <div class="permission-row switch">
        <SwitchButton
          v-model="permission.address"
          :label="$t('pages.permissions.login')"
        />
      </div>

      <div class="permission-row switch">
        <SwitchButton
          v-model="permission.addressList"
          :label="$t('pages.permissions.addressList')"
        />
      </div>

      <div class="permission-row switch">
        <SwitchButton
          v-model="permission.messageSign"
          :label="$t('pages.permissions.message-sign')"
        />
      </div>

      <div class="permission-row switch">
        <SwitchButton
          v-model="permission.dailySpendLimit"
          :label="$t('pages.permissions.daily-spending-limit')"
        />
      </div>

      <transition
        name="fade-transition"
        mode="out-in"
      >
        <div
          v-if="permission.dailySpendLimit"
          class="transaction-sign-limit"
        >
          <Field
            v-slot="{ field }"
            name="transactionSignLimit"
            :rules="{
              min_value_exclusive: 0,
              does_not_exceed_decimals: selectedAsset.decimals,
            }"
          >
            <InputAmount
              v-bind="field"
              v-model="permission.transactionSignLimit"
              class="transaction-limit-input"
              name="transactionSignLimit"
              label=" "
              :selected-asset="selectedAsset"
              :protocol="PROTOCOLS.aeternity"
              readonly
            />
          </Field>

          <DetailsItem :label="$t('pages.permissions.spent-today')">
            <TokenAmount
              class="transaction-limit-amount"
              :amount="permission.transactionSignSpent"
              :protocol="PROTOCOLS.aeternity"
            />
          </DetailsItem>
          <DetailsItem :label="$t('pages.permissions.left-today')">
            <TokenAmount
              class="transaction-limit-amount"
              :amount="permission.transactionSignLimit - permission.transactionSignSpent"
              :protocol="PROTOCOLS.aeternity"
            />
          </DetailsItem>
          <DetailsItem :label="$t('pages.account.balance')">
            <TokenAmount
              class="transaction-limit-amount"
              :amount="+balance"
              :protocol="PROTOCOLS.aeternity"
            />
          </DetailsItem>
        </div>
      </transition>
    </div>

    <template #footer>
      <BtnMain
        variant="muted"
        :text="$t('common.cancel')"
        @click="resolve()"
      />
      <BtnMain
        class="confirm"
        extra-padded
        :text="$t('common.confirm')"
        :disabled="!permissionChanged"
        @click="savePermission()"
      />
      <BtnMain
        v-if="editView"
        extend
        variant="muted"
        :text="$t('pages.permissions.delete')"
        :icon="DeleteIcon"
        @click="removePermissionAndRedirect()"
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
  watch,
} from 'vue';
import { useForm, Field } from 'vee-validate';

import type { IPermission, RejectCallback, ResolveCallback } from '@/types';
import { PERMISSION_DEFAULTS, PROTOCOLS } from '@/constants';
import { useBalances, useCurrencies, usePermissions } from '@/composables';
import { ROUTE_PERMISSIONS_SETTINGS } from '@/popup/router/routeNames';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import DetailsItem from '@/popup/components/DetailsItem.vue';
import SwitchButton from '@/popup/components/SwitchButton.vue';
import InputAmount from '@/popup/components/InputAmount.vue';
import InputField from '@/popup/components/InputField.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import DeleteIcon from '@/icons/trash.svg?vue-component';
import Modal from '../Modal.vue';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    DetailsItem,
    Field,
    InputAmount,
    InputField,
    SwitchButton,
    TokenAmount,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
    host: { type: String, default: null },
  },
  setup(props) {
    const { validate, setValues } = useForm();

    const { balance } = useBalances();
    const { marketData } = useCurrencies();
    const { permissions, addPermission, removePermission } = usePermissions();

    const editView = !!props.host;

    const permission = ref<IPermission>({ ...PERMISSION_DEFAULTS });
    const permissionChanged = ref(false);

    const selectedAsset = computed(() => ProtocolAdapterFactory
      .getAdapter(PROTOCOLS.aeternity)
      .getDefaultCoin(marketData.value!, +balance.value));

    const permissionHostValidation = computed(() => !permission.value.host?.includes('localhost'));

    function removePermissionAndRedirect() {
      removePermission(props.host);
      props.resolve();
    }

    async function savePermission() {
      if (!(await validate()).valid) {
        return;
      }
      const hostValue = permission.value.host.toLowerCase();
      const { host } = (new URL(
        `${hostValue.includes('http') ? '' : 'http://'}${hostValue}`,
      ));

      if (host !== props.host) {
        removePermission(props.host);
      }

      if (!permission.value.dailySpendLimit) {
        permission.value.transactionSignLimit = 0;
      }

      addPermission({ ...permission.value, host });
      props.resolve();
    }

    if (editView) {
      const savedPermission = permissions.value[props.host];
      if (!savedPermission) {
        // props.reject();
      } else {
        if (typeof savedPermission.transactionSignLimit === 'string') {
          savedPermission.transactionSignLimit = +savedPermission.transactionSignLimit;
        }

        setValues({ url: savedPermission.host, ...savedPermission });
        permission.value = { ...PERMISSION_DEFAULTS, ...savedPermission };
      }
    }

    watch(permission, (val) => {
      permissionChanged.value = !!val.name;
    }, { deep: true });

    return {
      PROTOCOLS,
      ROUTE_PERMISSIONS_SETTINGS,
      DeleteIcon,
      editView,
      balance,
      permission,
      permissionHostValidation,
      permissionChanged,
      selectedAsset,
      removePermissionAndRedirect,
      savePermission,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.permission-manager {
  color: $color-white;

  .inputs {
    margin-bottom: 32px;
  }

  .permission-row {
    margin: 10px 0;

    &.switch {
      margin-bottom: 0;
      padding-top: 3px;
      padding-right: 5px;
    }
  }

  .transaction-sign-limit {
    .transaction-limit-input {
      margin-bottom: 16px;
    }

    .transaction-limit-amount {
      justify-content: space-between;
      width: 100%;
    }
  }

  .bottom {
    padding-top: 38px;

    .actions {
      width: 100%;
      display: flex;
      padding-bottom: 12px;
      gap: 12px;

      .confirm {
        flex: 1.8;
      }
    }
  }
}
</style>
