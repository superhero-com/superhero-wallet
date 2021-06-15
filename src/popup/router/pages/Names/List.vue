<template>
  <div class="list">
    <template v-if="namesForAccount.length">
      <NameItem
        v-for="({ name, owner, autoExtend }, index) in namesForAccount"
        :key="index"
        :index="index"
        :name="name"
        :address="owner"
        :auto-extend="autoExtend"
      />
    </template>
    <AnimatedSpinner
      v-else-if="loading"
      class="spinner"
    />
    <template v-else>
      <p>
        {{ $t('pages.names.list.no-names') }}
      </p>
      <Button :to="{ name: 'name-claim' }">
        {{ $t('pages.names.list.register-name') }}
      </Button>
    </template>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import NameItem from '../../components/NameItem';
import Button from '../../components/Button';
import AnimatedSpinner from '../../../../icons/animated-spinner.svg?skip-optimize';

export default {
  components: { NameItem, Button, AnimatedSpinner },
  data: () => ({ loading: false }),
  computed: {
    ...mapGetters(['account']),
    ...mapState({
      namesForAccount({ names: { owned } }, { account }) {
        return owned.filter((n) => n.owner === account.address);
      },
    }),
  },
  mounted() {
    const id = setInterval(() => this.updateNames, 10000);
    this.$once('hook:destroyed', () => clearInterval(id));
  },
  methods: {
    async updateNames() {
      this.loading = true;
      await this.$store.dispatch('names/fetchOwned');
      this.loading = false;
    },
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

  p {
    text-align: center;
    margin: 32px;
    color: variables.$color-light-grey;

    @extend %face-sans-15-medium;
  }

  > .button {
    text-align: center;
  }
}
</style>
