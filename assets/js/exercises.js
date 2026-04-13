(function () {
  var LETTERS = ['A', 'B', 'C', 'D', 'E'];
  var isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  var LABEL_SOLUTION = isEn ? 'View Solution' : '查看解析';

  function initExercises() {
    var exercises = document.querySelectorAll('.exercises .exercise');

    exercises.forEach(function (ex, i) {
      // ── Q-number label ──────────────────────────────────
      var label = document.createElement('p');
      label.className = 'exercise-label';
      label.textContent = 'Q' + (i + 1);
      ex.insertBefore(label, ex.firstChild);

      // ── MCQ ─────────────────────────────────────────────
      var correctLetter = (ex.getAttribute('data-answer') || '').toUpperCase();
      if (correctLetter) {
        var optionsDiv = ex.querySelector('.options');
        if (optionsDiv) {
          var optUl = optionsDiv.querySelector('ul') || optionsDiv.querySelector('ol');
          if (optUl) {
            optUl.classList.add('mcq-list');
            var items = Array.from(optUl.querySelectorAll(':scope > li'));
            var correctIndex = LETTERS.indexOf(correctLetter);

            items.forEach(function (item, idx) {
              item.classList.add('mcq-option');

              // Letter badge
              var badge = document.createElement('span');
              badge.className = 'mcq-option-badge';
              badge.textContent = LETTERS[idx] || String(idx + 1);
              item.insertBefore(badge, item.firstChild);

              item.addEventListener('click', function () {
                if (ex.hasAttribute('data-answered')) return;
                ex.setAttribute('data-answered', '1');
                items.forEach(function (it) { it.classList.add('mcq-disabled'); });

                if (idx === correctIndex) {
                  item.classList.add('mcq-correct');
                } else {
                  item.classList.add('mcq-wrong');
                  if (items[correctIndex]) items[correctIndex].classList.add('mcq-correct');
                }

                // Auto-open answer explanation
                var det = ex.querySelector('details.answer-details');
                if (det) det.open = true;
              });
            });
          }
        }
      }

      // ── Convert .answer → <details> ─────────────────────
      var ansDiv = ex.querySelector('.answer');
      if (ansDiv) {
        var details = document.createElement('details');
        details.className = 'answer-details';

        var summary = document.createElement('summary');
        summary.textContent = LABEL_SOLUTION;

        var inner = document.createElement('div');
        inner.className = 'answer-content';
        while (ansDiv.firstChild) inner.appendChild(ansDiv.firstChild);

        details.appendChild(summary);
        details.appendChild(inner);
        ansDiv.parentNode.replaceChild(details, ansDiv);
      }
    });
  }

  // Script is injected at end of <body> via include-after-body,
  // so DOM is already ready — run directly, with DOMContentLoaded as fallback.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExercises);
  } else {
    initExercises();
  }
})();
