<template>
  <ae-modal-light
    class="popup-modal"
    v-if="popup.show"
    @close="closePopup"
    :title="popup.title"
    :class="(popup.secondBtn ? 'modal-two-buttons ' : '') + (popup.class ? popup.class : '')"
  >
    <div class="popup-message" v-html="popup.msg"></div>
    <Button half @click="closePopup" slot="buttons">
      {{ popup.buttonsTextPrimary }}
    </Button>
    <ae-button v-if="popup.secondBtn" class="popup-button" face="round" :fill="popup.buttonsFillSecondary" uppercase @click.native="clickSecondBtn" slot="buttons">{{
      popup.buttonsTextSecondary
    }}</ae-button>
  </ae-modal-light>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  props: ['popupSecondBtnClick', 'redirect'],
  computed: {
    ...mapGetters(['popup']),
  },
  methods: {
    closePopup() {
      const { noRedirect } = this.popup;
      this.$store.commit('HIDE_POPUP');
      this.$store.commit('DEF_POPUP');
      if (this.redirect && !noRedirect) {
        this.$store.commit('SET_AEPP_POPUP', false);
        this.$router.push('/account');
      }
    },
    clickSecondBtn() {
      this.$parent[this.popupSecondBtnClick]();
      this.closePopup();
    },
  },
};
</script>

<style lang="scss">
@import '../../../common/variables';
.ae-overlay {
  background: rgba(18, 18, 23, 0.8) !important;
}
.ae-overlay .ae-modal-light,
.ae-overlay .ae-modal {
  background: $border-color !important;
  width: 310px !important;
  border-radius: 5px !important;
}
.ae-overlay .ae-modal {
  width: 100% !important;
}
.ae-overlay .ae-modal .mobile-right {
  display: none !important;
}

.ae-overlay .ae-modal-light h1 {
  display: none;
}
.ae-overlay .ae-modal-light .popup-message {
  font-size: 14px;
}
</style>
