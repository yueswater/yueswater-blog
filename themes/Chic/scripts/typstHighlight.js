/**
 * Teach Hexo's highlight.js about Typst. Without this, ```typst fences are
 * rendered as plain text. hexo-util resolves the same top-level `highlight.js`
 * instance as this require, so registering here is enough; the token classes
 * (keyword, built_in, meta, ...) are styled in source/css/_vendor/highlight/ocean.styl.
 */
var hljs = require('highlight.js');
var typst = require('highlightjs-typst');

hljs.registerLanguage('typst', typst.default || typst);
