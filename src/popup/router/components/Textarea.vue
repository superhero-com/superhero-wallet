<template>
    <textarea
        class="textarea"
        :class="error ? 'has-error' : ''"
        :value="value" @input="$emit('input', $event.target.value)" />
</template>

<script>
export default {
    props:['value','error'],
}
</script>

<style lang="scss">
@import '../../../common/variables';

textarea {
    display: block;
    width:100%;
    border-radius: 5px;
    border:2px solid $border-color !important;
    background: $input-bg-color !important;
    padding:15px;
    margin-bottom:22px;
    color: $text-color !important;
    font-size:$font-size;
    min-height: 200px !important;
    width:330px;
    margin-left:auto;
    margin-right: auto;
}
textarea:focus {
    border-color: $accent-color !important;
}
textarea.has-error {
    border-color: $secondary-color !important;
}
</style>