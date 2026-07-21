document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("figcaption.quarto-float-fig").forEach((caption) => {
    const textNode = [...caption.childNodes].find(
      (node) => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim(),
    );

    if (!textNode) return;

    const match = textNode.nodeValue.match(/^(\s*(?:圖|Figure)\s+[^:\s]+\s*:)(\s*)/);
    if (!match) return;

    const label = document.createElement("strong");
    label.textContent = match[1].trimStart();
    textNode.replaceWith(label, document.createTextNode(match[2] + textNode.nodeValue.slice(match[0].length)));
  });
});
