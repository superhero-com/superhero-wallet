<template>
  <div class="popup">
    <ae-list class="noti-list">
      <ae-list-item fill="neutral" v-for="(noti, i) in notifications" :key="i" class="noti">
        <img :src="icon" />
        <span> {{ noti.content }} </span>
      </ae-list-item>
    </ae-list>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  data: () => ({ icon: browser.runtime.getURL('../../../icons/icon_48.png') }),
  computed: mapGetters(['notifications']),
};
</script>
