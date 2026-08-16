/**
 * English homepage at /en/. Hexo's built-in index generator only ever
 * produces the zh-TW root "/", so this adds the English counterpart by
 * hand, reusing the same profile layout.
 */
hexo.extend.generator.register('home_en', function (locals) {
  return {
    path: 'en/',
    layout: ['home'],
    data: {
      title: 'Home',
      lang: 'en',
      is_home_en: true
    }
  };
});
