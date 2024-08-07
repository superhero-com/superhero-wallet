<script>
import { defineComponent, h } from 'vue';

const renderNodeContent = (createElement, node, option = null) => (!node.childNodes.length
  ? node.textContent
  : Array.from(node.childNodes)
    .filter((n) => [Node.ELEMENT_NODE, Node.TEXT_NODE].includes(n.nodeType))
    .map((n) => {
      switch (n.tagName) {
        case 'strong':
        case 'ol':
        case 'li':
        case 'p':
          return createElement(n.tagName, renderNodeContent(createElement, n));
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
