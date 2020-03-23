<template>
  <div class="popup">
    <ae-list class="noti-list">
      <ae-list-item fill="neutral" v-for="(noti, i) in notifications" :key="i" class="noti">
        <img src="../../../icons/icon_48.png" />
        <Component
          :is="noti.route ? 'RouterLink' : 'span'"
          :to="noti.route"
        >
          {{ noti.content }}
        </span>
      </ae-list-item>
    </ae-list>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  computed: mapGetters(['notifications']),
};
</script>
