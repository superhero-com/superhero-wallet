import Vue from 'vue';

Vue.directive('click-outside', {
  bind(el, { value }) {
    /* eslint-disable no-param-reassign */
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        if (value && typeof value === 'function') {
          value(event);
        }
      }
    };
    setTimeout(() => {
      document.body.addEventListener('click', el.clickOutsideEvent);
    }, 0);
  },
  unbind(el) {
    document.body.removeEventListener('click', el.clickOutsideEvent);
  },
});
