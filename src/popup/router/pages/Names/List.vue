<template>
  <div class="list">
    <NameListHeader />
    <ul
      v-if="namesForAccount.length"
      class="names-list"
    >
      <NameRow
        v-for="({ name, owner, pending, autoExtend }, index) in namesForAccount"
        :key="index"
        :to="{ name: 'name-details', params: { name } }"
        :name="name"
        :address="owner"
      >
        <Truncate
          :str="name"
          class="name"
        />
        <Badge
          v-if="account.name === name"
          class="active-name"
        >
          {{ $t('pages.names.default') }}
        </Badge>
        <Badge
          v-if="pending"
          class="pending-name"
        >
          {{ $t('pages.names.pending-claim') }}
        </Badge>
        <span class="address">{{ owner }}</span>
        <CheckBox
          :value="autoExtend"
          @click.native.prevent="
            $store.commit('names/setAutoExtend', { name, value: !autoExtend })
          "
        >
          {{ $t('pages.names.auto-extend') }}
        </CheckBox>
      </NameRow>
    </ul>
    <p v-else>
      {{ $t('pages.names.list.no-names') }}
    </p>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import NameListHeader from '../../components/NameListHeader';
import Badge from '../../components/Badge';
import NameRow from '../../components/NameRow';
import Truncate from '../../components/Truncate';
import CheckBox from '../../components/CheckBox';

export default {
  components: {
    NameListHeader, Badge, NameRow, CheckBox, Truncate,
  },
  computed: {
    ...mapGetters(['account']),
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
.list .names-list {
  padding: 0;

  .name {
    width: 100%;
  }
}
</style>
