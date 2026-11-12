// Banner copy, zh-TW and en. English only when the page language starts with "en".
(function (root) {
  var zh = {
    title: 'Cookie 同意',
    body: '本站預設只使用必要的儲存（瀏覽數計數、主題偏好）。你可以允許匿名的流量來源統計，讓我知道讀者從哪裡來。',
    accept: '接受',
    reject: '拒絕',
    manage: '管理設定',
    save: '儲存設定',
    necessaryTitle: '必要',
    necessaryBody: '瀏覽數計數器與主題偏好，網站運作所需，一律開啟。',
    analyticsTitle: '分析',
    analyticsBody: '每次造訪只記錄一筆：頁面、語言、來源網站與活動標籤（utm）。不記錄 IP 與瀏覽器資訊，不設定 cookie，保留 13 個月。',
    footer: 'Cookie 設定'
  };
  var en = {
    title: 'Cookie consent',
    body: 'By default this site only uses necessary storage (view counter, theme preference). You can allow anonymous traffic-source statistics, so I know where readers come from.',
    accept: 'Accept',
    reject: 'Reject',
    manage: 'Manage settings',
    save: 'Save settings',
    necessaryTitle: 'Necessary',
    necessaryBody: 'The view counter and your theme preference. Needed for the site to work, always on.',
    analyticsTitle: 'Analytics',
    analyticsBody: 'One record per visit: page, language, referring site and campaign tags (utm). No IP address, no browser details, no cookie. Kept for 13 months.',
    footer: 'Cookie settings'
  };

  root.ChicConsentText = {
    get: function (lang) { return /^en/i.test(lang || '') ? en : zh; }
  };
})(window);
