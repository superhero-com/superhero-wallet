<template>
    <button class="primary-button" @click="$emit('click')" :class="disabled ? 'disabled': ''">
        <slot></slot>
    </button>
</template>

<script>
export default {
    props: {
        disabled: Boolean
    }
}
</script>

<style lang="scss">
@import '../../../common/variables';

.primary-button {
    background: $button-color !important;
    width:270px !important;
    border-radius: 5px;
    font-size:1.3rem;
    padding: 13px;
    margin: 8px auto;
    color: $button-text-color !important;
    font-weight: normal !important;
}
.primary-button.disabled {
    opacity: .4;
    pointer-events: none;
}
</style>