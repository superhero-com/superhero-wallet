import Vue from 'vue';
import { Validator, install as VeeValidate } from 'vee-validate/dist/vee-validate.minimal.esm';
import { required } from 'vee-validate/dist/rules.esm';
import { i18n } from './languages';

Vue.use(VeeValidate);

Validator.extend('required', required);

Validator.localize('en', {
  messages: {
    required: () => i18n.t('validation.required'),
  },
});

export default () => {};
