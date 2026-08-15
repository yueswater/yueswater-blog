(function () {
  function buildCustomSort(container) {
    if (container.dataset.ywSortInit) return;

    var select = container.querySelector("select.form-select");
    if (!select) return;

    container.dataset.ywSortInit = "1";

    var options = Array.prototype.map.call(select.options, function (opt, idx) {
      return { index: idx, label: opt.textContent.trim(), selected: opt.selected };
    });
    var current = options.filter(function (o) { return o.selected; })[0] || options[0];

    var wrap = document.createElement("div");
    wrap.className = "yw-sort";

    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "yw-sort-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.innerHTML =
      '<i class="bi bi-sort-down" aria-hidden="true"></i>' +
      '<span class="yw-sort-label"></span>' +
      '<i class="bi bi-chevron-down yw-sort-chevron" aria-hidden="true"></i>';
    trigger.querySelector(".yw-sort-label").textContent = current.label;

    var panel = document.createElement("div");
    panel.className = "yw-sort-panel";
    panel.setAttribute("role", "listbox");

    function closePanel() {
      wrap.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKeydown);
    }

    function openPanel() {
      wrap.classList.add("open");
      trigger.setAttribute("aria-expanded", "true");
      document.addEventListener("click", onDocClick);
      document.addEventListener("keydown", onKeydown);
    }

    function onDocClick(e) {
      if (!wrap.contains(e.target)) closePanel();
    }

    function onKeydown(e) {
      if (e.key === "Escape") {
        closePanel();
        trigger.focus();
      }
    }

    options.forEach(function (o) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "yw-sort-option";
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", o.selected ? "true" : "false");
      btn.textContent = o.label;
      btn.addEventListener("click", function () {
        select.selectedIndex = o.index;
        select.dispatchEvent(new Event("change"));
        trigger.querySelector(".yw-sort-label").textContent = o.label;
        Array.prototype.forEach.call(panel.children, function (b) {
          b.setAttribute("aria-selected", "false");
        });
        btn.setAttribute("aria-selected", "true");
        closePanel();
      });
      panel.appendChild(btn);
    });

    trigger.addEventListener("click", function () {
      if (wrap.classList.contains("open")) {
        closePanel();
      } else {
        openPanel();
      }
    });

    wrap.appendChild(trigger);
    wrap.appendChild(panel);
    container.appendChild(wrap);
  }

  function init() {
    document.querySelectorAll(".quarto-listing-sort").forEach(buildCustomSort);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
