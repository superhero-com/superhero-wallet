<script>
const renderNodeContent = (createElement, node) => (!node.childNodes.length
  ? node.textContent
  : Array.from(node.childNodes)
    .filter((n) => [Node.ELEMENT_NODE, Node.TEXT_NODE].includes(n.nodeType))
    .map((n) => {
      switch (n.tagName) {
        case 'strong':
          return createElement('strong', renderNodeContent(createElement, n));
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
    node: { type: Node, required: true },
  },
  render(createElement, { data, props }) {
    return createElement(
      'span',
      { class: data.staticClass },
      renderNodeContent(createElement, props.node),
    );
  },
};
</script>
