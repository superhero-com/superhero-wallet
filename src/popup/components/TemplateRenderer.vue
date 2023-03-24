<script>
import { defineComponent, h } from 'vue';

const renderNodeContent = (createElement, node, option = null) => (!node.childNodes.length
  ? node.textContent
  : Array.from(node.childNodes)
    .filter((n) => [Node.ELEMENT_NODE, Node.TEXT_NODE].includes(n.nodeType))
    .map((n) => {
      switch (n.tagName) {
        case 'strong':
          return createElement('strong', renderNodeContent(createElement, n));
        case 'ol':
          return createElement('ol', renderNodeContent(createElement, n));
        case 'li':
          return createElement('li', renderNodeContent(createElement, n));
        case 'a':
          return createElement('a', { ...option }, renderNodeContent(createElement, n));
        case 'br':
          return createElement('br');
        default:
          return n.textContent;
      }
    })
);

export default defineComponent({
  name: 'TemplateRenderer',
  props: {
    str: { type: String, required: true },
    option: { type: Object, default: null },
  },
  setup(props, { attrs }) {
    return () => h('span', { class: attrs.class }, renderNodeContent(
      h,
      new DOMParser()
        .parseFromString(`<root>${props.str || ''}</root>`, 'text/xml').childNodes[0],
      props.option,
    ));
  },
});
</script>
<style lang="scss" scoped>
@use '../../styles/variables' as *;

ol {
  text-align: left;
  list-style-type: none;
  counter-reset: list-number;

  li {
    margin-bottom: 18px;

    &::before {
      counter-increment: list-number;
      content: counter(list-number);
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      padding: 2px;
      width: 24px;
      height: 24px;
      position: absolute;
      left: 24px;
      background: rgba($color-white, 0.03);
      border: 2px solid rgba($color-white, 0.15);
      border-radius: 28px;
    }
  }
}
</style>
