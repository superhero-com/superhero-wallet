<template>
  <div class="permission-manager">
    <div
      v-if="!editView"
      class="text-description"
    >
      {{ $t('pages.permissions.add-description') }}
    </div>

    <div class="inputs">
      <div class="permission-row">
        <Field
          v-slot="{ field, errorMessage }"
          name="name"
          rules="required"
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
            url: permissionHostValidation
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
          }"
        >
          <InputAmount
            v-bind="field"
            v-model="permission.transactionSignLimit"
            class="transaction-limit-input"
            name="transactionSignLimit"
            label=" "
            :selected-asset="selectedAsset"
            ae-only
          />
        </Field>

        <div class="limit-info">
          <TokenAmount
            :label="$t('pages.permissions.spent-today')"
            :amount="permission.transactionSignLimitLeft"
          />
        </div>
        <div class="limit-info">
          <TokenAmount
            :label="$t('pages.permissions.left-today')"
            :amount="permission.transactionSignLimit - permission.transactionSignLimitLeft"
          />
        </div>
        <div class="limit-info">
          <TokenAmount
            :label="$t('pages.account.balance')"
            :amount="+balance"
          />
        </div>
      </div>
    </transition>

    <div class="bottom">
      <div class="actions">
        <BtnMain
          variant="muted"
          :text="$t('common.cancel')"
          :to="{ name: 'permissions-settings' }"
        />
        <BtnMain
          class="confirm"
          extra-padded
          :text="$t('common.confirm')"
          :disabled="!permissionChanged"
          @click="savePermission"
        />
      </div>
      <BtnMain
        v-if="editView"
        extend
        variant="muted"
        :text="$t('pages.permissions.delete')"
        :icon="DeleteIcon"
        @click="removePermission"
      />
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  watch,
} from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useForm, Field } from 'vee-validate';

import type { IPermission } from '@/types';
import { PERMISSION_DEFAULTS } from '@/config';
import { useBalances, useCurrencies } from '@/composables';
import { useState } from '@/composables/vuex';
import { ROUTE_NOT_FOUND } from '@/popup/router/routeNames';
import { AE_CONTRACT_ID, AE_SYMBOL } from '@/protocols/aeternity/config';

import SwitchButton from '../components/SwitchButton.vue';
import InputAmount from '../components/InputAmount.vue';
import InputField from '../components/InputField.vue';
import TokenAmount from '../components/TokenAmount.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import DeleteIcon from '../../icons/trash.svg?vue-component';

export default defineComponent({
  components: {
    SwitchButton,
    InputField,
    InputAmount,
    TokenAmount,
    BtnMain,
    Field,
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const { validate, setValues } = useForm();

    const { balance } = useBalances({ store });
    const { currentCurrencyRate } = useCurrencies();

    const routeHost = route.params.host as string;
    const editView = !!route.meta?.isEdit;

    const permission = ref<IPermission>({ ...PERMISSION_DEFAULTS });
    const permissionChanged = ref(false);
    const originalTransactionSignLimit = ref<number>(0);

    const permissions = useState<Record<string, IPermission>>('permissions');

    const selectedAsset = computed(() => ({
      contractId: AE_CONTRACT_ID,
      symbol: AE_SYMBOL,
      currentPrice: currentCurrencyRate.value,
    }));

    const permissionHostValidation = computed(() => !permission.value.host?.includes('localhost'));

    function removePermission() {
      store.commit('permissions/removePermission', routeHost);
      router.push({ name: 'permissions-settings' });
    }

    async function savePermission() {
      if (!(await validate()).valid) {
        return;
      }
      const hostValue = permission.value.host.toLowerCase();
      const { host } = (new URL(
        `${hostValue.includes('http') ? '' : 'http://'}${hostValue}`,
      ));

      if (host !== routeHost) {
        store.commit('permissions/removePermission', routeHost);
      }

      if (!permission.value.dailySpendLimit) {
        permission.value.transactionSignLimit = 0;
      } else if (originalTransactionSignLimit.value !== permission.value.transactionSignLimit) {
        permission.value.transactionSignLimitLeft += (
          permission.value.transactionSignLimit - originalTransactionSignLimit.value
        );
      }

      store.commit('permissions/addPermission', {
        ...permission.value,
        host,
      });
      router.push({ name: 'permissions-settings' });
    }

    if (editView) {
      const savedPermission = permissions.value[routeHost];
      if (!savedPermission) {
        router.replace({ name: ROUTE_NOT_FOUND });
      } else {
        if (typeof savedPermission.transactionSignLimit === 'string') {
          savedPermission.transactionSignLimit = parseInt(
            savedPermission.transactionSignLimit,
            10,
          );
          originalTransactionSignLimit.value = savedPermission.transactionSignLimit;
        }

        if (typeof savedPermission.transactionSignLimitLeft === 'string') {
          savedPermission.transactionSignLimitLeft = parseInt(
            savedPermission.transactionSignLimitLeft,
            10,
          );
        }

        setValues({ url: savedPermission.host, ...savedPermission });
        permission.value = savedPermission;
      }
    }

    watch(permission, (val) => {
      permissionChanged.value = !!val.name;
    }, { deep: true });

    return {
      DeleteIcon,
      editView,
      balance,
      permission,
      permissionHostValidation,
      permissionChanged,
      selectedAsset,
      removePermission,
      savePermission,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.permission-manager {
  --screen-padding-x: 14px;

  padding-inline: var(--screen-padding-x);
  color: variables.$color-white;

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

    .limit-info {
      padding: 4px 0;
    }
  }

  .bottom {
    padding-top: 38px;
    padding-bottom: 16px;

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
