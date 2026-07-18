// Quarto binds citation tooltips (tippy) to the inner <a role="doc-biblioref"> only.
// Forward hover from the whole .citation span so the tooltip shows when hovering
// the author name and parentheses too, not just the linked year.
window.addEventListener("load", function () {
  document.querySelectorAll("span.citation").forEach(function (span) {
    var link = span.querySelector('a[role="doc-biblioref"]');
    if (!link) return;
    span.addEventListener("mouseenter", function () {
      link.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
    });
    span.addEventListener("mouseleave", function () {
      link.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false }));
    });
    span.addEventListener("click", function (e) {
      if (e.target !== link) link.click();
    });
  });
});
