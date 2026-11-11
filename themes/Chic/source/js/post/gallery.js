/**
 * Paging for the {% gallery %} carousel (see scripts/galleryTag.js).
 *
 * Every slide, dot and caption is already in the markup with the first one
 * active, so this only moves the active flag around: chevrons, dots, arrow
 * keys while the carousel has focus, swipe on touch, and fullscreen.
 */
(function () {
    function setup(gallery) {
        var viewport = gallery.querySelector('.gallery-viewport');
        var slides = gallery.querySelectorAll('.gallery-slide');
        var captions = gallery.querySelectorAll('.gallery-caption');
        var dots = gallery.querySelectorAll('.gallery-dot');
        var fullscreenBtn = gallery.querySelector('.gallery-fullscreen');
        var index = 0;

        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', function () {
                if (document.fullscreenElement) document.exitFullscreen();
                else if (viewport.requestFullscreen) viewport.requestFullscreen();
            });
        }

        if (slides.length < 2) return;

        function show(next) {
            index = (next + slides.length) % slides.length;
            for (var i = 0; i < slides.length; i++) {
                var on = i === index;
                if (on) slides[i].setAttribute('data-active', 'true');
                else slides[i].removeAttribute('data-active');
                if (captions[i]) {
                    if (on) captions[i].setAttribute('data-active', 'true');
                    else captions[i].removeAttribute('data-active');
                }
                if (dots[i]) dots[i].classList.toggle('is-active', on);
            }
        }

        gallery.querySelector('.gallery-prev').addEventListener('click', function () {
            show(index - 1);
        });
        gallery.querySelector('.gallery-next').addEventListener('click', function () {
            show(index + 1);
        });

        Array.prototype.forEach.call(dots, function (dot) {
            dot.addEventListener('click', function () {
                show(parseInt(dot.getAttribute('data-gallery-index'), 10));
            });
        });

        // arrow keys work once something inside the carousel has focus
        gallery.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowLeft') { show(index - 1); e.preventDefault(); }
            else if (e.key === 'ArrowRight') { show(index + 1); e.preventDefault(); }
        });

        var touchX = null;
        viewport.addEventListener('touchstart', function (e) {
            touchX = e.changedTouches[0].clientX;
        }, { passive: true });
        viewport.addEventListener('touchend', function (e) {
            if (touchX === null) return;
            var dx = e.changedTouches[0].clientX - touchX;
            if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
            touchX = null;
        }, { passive: true });
    }

    document.addEventListener('DOMContentLoaded', function () {
        Array.prototype.forEach.call(document.querySelectorAll('.gallery'), setup);
    });
})();
