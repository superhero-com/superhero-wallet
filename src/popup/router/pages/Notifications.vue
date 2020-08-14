<template>
  <div class="popup">
    <ae-list class="noti-list">
      <ae-list-item fill="neutral" v-for="(noti, i) in notifications" :key="i" class="noti">
        <img src="../../../icons/logo-small.svg" />
        <Component :is="noti.route ? 'RouterLink' : 'span'" :to="noti.route">
          {{ noti.content }}
        </Component>
      </ae-list-item>
    </ae-list>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex';

export default {
  computed: mapState(['notifications']),
  methods: mapMutations(['SET_NOTIFICATIONS_VISITED']),
  async created() {
    this.SET_NOTIFICATIONS_VISITED();
  },
};
</script>
