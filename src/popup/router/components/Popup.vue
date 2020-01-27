<template>
    <ae-modal-light
        class="popup-modal"
        v-if="popup.show"
        @close="closePopup"
        :title="popup.title"
        :class="(popup.secondBtn ? 'modal-two-buttons ' : '') + (popup.class ? popup.class : '')"
    >
        <div class="popup-message" v-html="popup.msg"></div>
        <ae-button
            size="small"
            type="exciting"
            class="popup-button"
            face="round"
            :fill="popup.buttonsFillPrimary"
            uppercase
            @click.native="closePopup"
            slot="buttons"
        >{{ popup.buttonsTextPrimary }}</ae-button>
        <ae-button
            v-if="popup.secondBtn"
            class="popup-button"
            face="round"
            :fill="popup.buttonsFillSecondary"
            uppercase
            @click.native="clickSecondBtn"
            slot="buttons"
        >{{ popup.buttonsTextSecondary }}</ae-button>
    </ae-modal-light>
</template>

<script>

import { mapGetters } from 'vuex';

export default {
    props: [
        'popupSecondBtnClick',
        'redirect'
    ],
    computed: {
        ...mapGetters(['popup']),
    },
    methods: {
        closePopup() {
            let { noRedirect } = this.popup
            this.$store.commit('HIDE_POPUP');
            this.$store.commit('DEF_POPUP');
            if(this.redirect && !noRedirect) {
                this.$store.commit('SET_AEPP_POPUP',false)
                this.$router.push('/account')

            }
        },
        clickSecondBtn() {
            this.$parent[this.popupSecondBtnClick]();
            this.closePopup();
        },
    }
    
}
</script>

<style>

</style>
