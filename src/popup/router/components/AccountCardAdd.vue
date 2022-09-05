<template>
  <button
    class="account-card-add"
    @click="openCreateAccountModal()"
  >
    <div class="title">
      <PlusCircle />
      {{ $t('pages.accounts.add-account') }}
    </div>
    <div class="description">
      {{ $t('pages.accounts.add-account-description') }}
    </div>
  </button>
</template>

<script>
import { mapActions } from 'vuex';
import { MODAL_ACCOUNT_CREATE } from '../../utils/constants';
import PlusCircle from '../../../icons/plus-circle-fill.svg?vue-component';

export default {
  components: {
    PlusCircle,
  },
  methods: {
    ...mapActions('modals', {
      openModal: 'open',
    }),
    openCreateAccountModal() {
      this.openModal({
        name: MODAL_ACCOUNT_CREATE,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.account-card-add {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 192px;
  border-radius: 16px;
  background: variables.$color-green-dark;
  padding: 16px;
  text-align: left;
  cursor: pointer;

  .title {
    display: inline-flex;
    align-items: center;
    padding-bottom: 12px;
    color: variables.$color-white;
    font-weight: 500;

    @extend %face-sans-20-bold;

    svg {
      width: 48px;
      height: 48px;
      margin-right: 8px;
    }
  }

  .description {
    text-align: center;
    padding: 0 16px;
    color: rgba(variables.$color-white, 0.85);
    line-height: 22px;

    @extend %face-sans-16-regular;
  }
}
</style>
