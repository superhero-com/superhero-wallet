<template>
  <DetailsItem
    v-if="callData"
    class="call-data-details"
    :label="$t('transaction.data')"
  >
    <Tabs class="tabs">
      <Tab
        v-for="({ name, text }) in dataTabs"
        :key="name"
        :data-cy="name"
        :text="text"
        :active="activeTab === name"
        @click="setActiveTab(name)"
      />
    </Tabs>
    <div class="tabs-content">
      <DetailsItem v-if="activeTab === dataTabs[0].name">
        <AnimatedSpinner
          v-if="loading"
          class="loader"
        />
        <div v-else-if="callDataDecoded">
          <DetailsItem
            :label="$t('modals.confirmTransactionSign.functionName')"
            :value="callDataDecoded?.functionName"
          />
          <DetailsItem :label="$t('modals.confirmTransactionSign.arguments')">
            <template #value>
              <Panel class="arguments">
                <PanelTableItem
                  v-for="([key, value]) in argumentsEntries"
                  :key="key"
                  :name="key"
                  variant="left-aligned-name-bolder"
                >
                  <div class="value">
                    {{ typeof value === 'bigint' ? Number(value) : value }}
                  </div>
                </PanelTableItem>
              </Panel>
            </template>
          </DetailsItem>
        </div>
        <InfoBox
          v-else
          type="warning"
          :text="$t('transaction.decodingDataFailed')"
        />
      </DetailsItem>

      <!-- Raw Data -->
      <DetailsItem
        v-if="activeTab === dataTabs[1].name"
        :value="callData"
      />
    </div>
  </DetailsItem>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  ref,
} from 'vue';
import { useI18n } from 'vue-i18n';

import type { Dictionary } from '@/types';

import Panel from '@/popup/components/Panel.vue';
import PanelTableItem from '@/popup/components/PanelTableItem.vue';
import Tabs from '@/popup/components/tabs/Tabs.vue';
import Tab from '@/popup/components/tabs/Tab.vue';
import InfoBox from '@/popup/components/InfoBox.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';

import AnimatedSpinner from '@/icons/animated-spinner.svg?vue-component';

export default defineComponent({
  name: 'TransactionCallDataDetails',
  components: {
    Panel,
    PanelTableItem,
    Tabs,
    Tab,
    InfoBox,
    DetailsItem,
    AnimatedSpinner,
  },
  props: {
    callData: { type: String, default: null },
    callDataDecoded: { type: Object as PropType<Dictionary>, default: null },
    loading: Boolean,
  },
  setup(props) {
    const { t } = useI18n();

    const dataTabs = [
      {
        name: 'decoded',
        text: t('transaction.decoded'),
      },
      {
        name: 'raw',
        text: t('transaction.rawData'),
      },
    ];

    const activeTab = ref(dataTabs[0].name);

    const argumentsEntries = computed(
      () => props.callDataDecoded?.args
        ? Object.entries(props.callDataDecoded.args)
          .filter(([key]) => !Number.isNaN(parseInt(key, 10)))
        : undefined,
    );

    function setActiveTab(tabName: string) {
      activeTab.value = tabName;
    }

    return {
      dataTabs,
      activeTab,
      argumentsEntries,
      setActiveTab,
    };
  },
});
</script>

<style lang="scss" scoped>
.call-data-details {
  width: 100%;

  .tabs-content {
    .loader {
      height: 70px;
      width: 100%;
    }

    .value {
      text-align: left;
      line-height: 15px;
      word-break: break-all;
    }

    .arguments {
      margin-top: 8px;
    }
  }
}
</style>
