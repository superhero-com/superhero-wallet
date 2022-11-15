<script>
const renderNodeContent = (createElement, node, option = null) => (!node.childNodes.length
  ? node.textContent
  : Array.from(node.childNodes)
    .filter((n) => [Node.ELEMENT_NODE, Node.TEXT_NODE].includes(n.nodeType))
    .map((n) => {
      switch (n.tagName) {
        case 'strong':
          return createElement('strong', renderNodeContent(createElement, n));
        case 'a':
          return createElement('a', { ...option }, renderNodeContent(createElement, n));
        case 'br':
          return createElement('br');
        default:
          return n.textContent;
      }
    })
);

export default {
  functional: true,
  props: {
    str: { type: String, required: true },
    option: { type: Object, default: null },
  },
  render(createElement, { data, props }) {
    return createElement(
      'span',
      { class: data.class },
      renderNodeContent(createElement, new DOMParser()
        .parseFromString(`<root>${props.str || ''}</root>`, 'text/xml').childNodes[0],
      props.option),
    );
  },
};
</script>
