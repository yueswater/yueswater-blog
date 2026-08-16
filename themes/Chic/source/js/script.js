// declaraction of document.ready() function.
(function () {
    var ie = !!(window.attachEvent && !window.opera);
    var wk = /webkit\/(\d+)/i.test(navigator.userAgent) && (RegExp.$1 < 525);
    var fn = [];
    var run = function () {
        for (var i = 0; i < fn.length; i++) fn[i]();
    };
    var d = document;
    d.ready = function (f) {
        if (!ie && !wk && d.addEventListener)
            return d.addEventListener('DOMContentLoaded', f, false);
        if (fn.push(f) > 1) return;
        if (ie)
            (function () {
                try {
                    d.documentElement.doScroll('left');
                    run();
                } catch (err) {
                    setTimeout(arguments.callee, 0);
                }
            })();
        else if (wk)
            var t = setInterval(function () {
                if (/^(loaded|complete)$/.test(d.readyState))
                    clearInterval(t), run();
            }, 0);
    };
})();


document.ready(
    // toggleTheme function.
    // this script shouldn't be changed.
    () => {
        const pagebody = document.getElementsByTagName('body')[0]

        const default_theme = 'light' // 'dark'

        function setTheme(status = 'light') {
            const checkboxes = document.getElementsByClassName('switch_default')
            if (status === 'dark') {
                window.sessionStorage.theme = 'dark'
                pagebody.classList.add('dark-theme');
                for (let i = 0; i < checkboxes.length; i++) checkboxes[i].checked = true
            } else {
                window.sessionStorage.theme = 'light'
                pagebody.classList.remove('dark-theme');
                for (let i = 0; i < checkboxes.length; i++) checkboxes[i].checked = false
            }
        };

        setTheme(window.sessionStorage.theme ?? default_theme)

        const toggleBtns = document.getElementsByClassName('toggleBtn')
        for (let i = 0; i < toggleBtns.length; i++) {
            toggleBtns[i].addEventListener('click', () => {
                window.sessionStorage.theme = window.sessionStorage.theme === 'dark' ? 'light' : 'dark'
                setTheme(window.sessionStorage.theme)
            })
        }
    }
);
