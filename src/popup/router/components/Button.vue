<template>
    <button class="primary-button" @click="$emit('click')" :class="getClasses">
        <slot></slot>
    </button>
</template>

<script>
export default {
    props: {
        disabled: Boolean,
        extend: Boolean,
        half: Boolean
    },
    computed:{
        getClasses() {
            let c = []
            if(this.disabled) c.push('disabled')
            if(this.extend) c.push('extend')
            if(this.half) c.push('half')
            
            return c.join(" ")
        }
    }
}
</script>

<style lang="scss">
@import '../../../common/variables';

.primary-button {
    background: $button-color !important;
    width:270px !important;
    border-radius: 5px;
    font-size:18px;
    padding: 0;
    margin: 8px auto;
    color: $button-text-color !important;
    font-weight: normal !important;
    line-height: 40px;
    max-height: 40px;
}
.primary-button.disabled {
    opacity: .4;
    pointer-events: none;
}
.primary-button.extend {
    // width: 304px !important;
    width:100% !important;
}
.primary-button.half {
    // width: 148px !important;
    width:48% !important;
    margin:0 !important;

}
</style>