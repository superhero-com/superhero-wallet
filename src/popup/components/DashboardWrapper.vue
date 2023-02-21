<template>
  <div class="dashboard">
    <slot name="header" />

    <div class="dashboard-cards">
      <div
        v-if="$slots.buttons"
        class="buttons-row"
      >
        <slot name="buttons" />
      </div>

      <slot name="widgets" />

      <Card
        v-if="!backedUpSeed"
        :text="$t('dashboard.backUpCard.title')"
        :description="$t('dashboard.backUpCard.description')"
        :icon="SubtractIcon"
        data-cy="backup-seed-phrase"
      >
        <BtnMain
          class="card-button"
          variant="danger"
          inline
          :text="$t('dashboard.backUpCard.button')"
          :to="{ name: 'settings-seed-phrase' }"
        />
      </Card>

      <slot name="cards" />
    </div>
  </div>
</template>

<script lang="ts">
import { isEmpty } from 'lodash-es';
import {
  computed,
  defineComponent,
  watch,
} from '@vue/composition-api';
import { MODAL_TRANSFER_SEND } from '../utils';
import { useDispatch, useState } from '../../composables/vuex';

import BtnMain from './buttons/BtnMain.vue';
import Card from './Card.vue';

import SubtractIcon from '../../icons/subtract.svg?vue-component';

export default defineComponent({
  name: 'DashboardWrapper',
  components: {
    Card,
    BtnMain,
  },
  setup(props, { root }) {
    const backedUpSeed = useState('backedUpSeed');
    const openModal = useDispatch('modals/open');
    const query = computed(() => root.$route.query);

    watch(query, (value) => {
      if (!isEmpty(value)) {
        openModal({ name: MODAL_TRANSFER_SEND });
      }
    });

    return {
      backedUpSeed,
      SubtractIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.dashboard {
  display: flex;
  flex-direction: column;

  .dashboard-cards {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    margin-top: 8px;
    padding-inline: var(--screen-padding-x);
    padding-bottom: var(--screen-padding-x);

    .buttons-row {
      display: flex;
      gap: var(--gap);
    }

    .card-button {
      margin-top: 12px;
    }
  }
}
</style>
