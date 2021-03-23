<template>
  <div class="list">
    <NameListHeader />
    <ul v-if="owned.length" class="names-list">
      <NameRow
        v-for="({ name, owner, pending, autoExtend }, index) in owned"
        :key="index"
        :to="{ name: 'name-details', params: { name } }"
        :name="name"
        :address="owner"
      >
        <OverflowableText :text="name" class="name" />
        <Badge v-if="account.name === name" class="active-name">
          {{ $t('pages.names.default') }}
        </Badge>
        <Badge v-if="pending" class="pending-name">
          {{ $t('pages.names.pending-claim') }}
        </Badge>
        <span class="address">{{ owner }}</span>
        <CheckBox
          :value="autoExtend"
          @click.native.prevent="
            $store.commit('names/setAutoExtend', { index, value: !autoExtend })
          "
        >
          {{ $t('pages.names.auto-extend') }}
        </CheckBox>
      </NameRow>
    </ul>
    <p v-else>{{ $t('pages.names.list.no-names') }}</p>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import NameListHeader from '../../components/NameListHeader';
import Badge from '../../components/Badge';
import NameRow from '../../components/NameRow';
import OverflowableText from '../../components/OverflowableText';
import CheckBox from '../../components/CheckBox';

export default {
  components: { NameListHeader, Badge, NameRow, CheckBox, OverflowableText },
  computed: {
    ...mapGetters(['account']),
    ...mapState('names', ['owned']),
  },
  mounted() {
    this.$store.dispatch('names/fetchOwned');
    const id = setInterval(() => this.$store.dispatch('names/fetchOwned'), 10000);
    this.$once('hook:destroyed', () => clearInterval(id));
  },
};
</script>

<style scoped>
.list .names-list {
  padding: 0;
}
</style>
