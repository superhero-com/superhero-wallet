<template>
  <div class="list">
    <template v-if="namesForAccount.length">
      <NameItem
        v-for="({ name, owner, autoExtend }, index) in namesForAccount"
        :key="index"
        :name="name"
        :address="owner"
        :auto-extend="autoExtend"
      />
    </template>
    <AnimatedSpinner
      v-else-if="areNamesFetching"
      class="spinner"
    />
    <RegisterName
      v-else
      :msg="$t('pages.names.list.no-names')"
    />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import NameItem from '../../components/NameItem.vue';
import RegisterName from '../../components/RegisterName.vue';
import AnimatedSpinner from '../../../../icons/animated-spinner.svg?skip-optimize';

export default {
  components: {
    NameItem,
    AnimatedSpinner,
    RegisterName,
  },
  computed: {
    ...mapGetters(['account']),
    ...mapState('names', ['areNamesFetching']),
    ...mapState({
      namesForAccount({ names: { owned } }, { account }) {
        return owned.filter((n) => n.owner === account.address);
      },
    }),
  },
  mounted() {
    const id = setInterval(() => this.$store.dispatch('names/fetchOwned'), 10000);
    this.$once('hook:destroyed', () => clearInterval(id));
  },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';
@use '../../../../styles/typography';

.list {
  .name-item {
    margin-top: 1px;
  }

  .spinner {
    display: flex;
    width: 56px;
    height: 56px;
    margin: 72px auto 0 auto;
  }
}
</style>
