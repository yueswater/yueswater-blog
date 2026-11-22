// Banner copy, zh-TW and en. English only when the page language starts with "en".
(function (root) {
  var zh = {
    title: 'Cookie 同意',
    body: '本站預設只使用必要的儲存（瀏覽數計數、主題偏好）。若你同意，本站會收集匿名的流量來源資訊，僅用於分析訪客的來訪管道。',
    accept: '接受',
    reject: '拒絕',
    manage: '管理設定',
    save: '儲存設定',
    necessaryTitle: '必要',
    necessaryBody: '瀏覽數計數器與主題偏好，網站運作所需，一律開啟。透過聯絡我頁面送出留言時，會記錄您填寫的內容與圖片、送出時間、頁面語言、來源頁面與網際網路協定位址（IP 位址），僅用於回覆與防止濫用，不提供給第三方；IP 位址 180 天後刪除。尚未送出的留言草稿，每 10 秒暫存在您瀏覽器的本機儲存空間，不會傳到伺服器，送出後即清除。',
    analyticsTitle: '分析',
    analyticsBody: '每次造訪只記錄一筆：頁面、語言、來源網站與活動標籤。不記錄 IP 與瀏覽器資訊，不設定 cookie，保留 13 個月。',
    footer: 'Cookie 設定'
  };
  var en = {
    title: 'Cookie consent',
    body: 'By default this site only uses necessary storage (view counter, theme preference). If you agree, the site collects anonymous traffic-source information, used only to analyze how visitors reach it.',
    accept: 'Accept',
    reject: 'Reject',
    manage: 'Manage settings',
    save: 'Save settings',
    necessaryTitle: 'Necessary',
    necessaryBody: 'The view counter and your theme preference. Needed for the site to work, always on. When you send a message through the contact page, the site records what you enter (including images), the time of sending, page language, source page and your Internet Protocol address (IP address), used only to reply and to prevent abuse and never shared with third parties; IP addresses are deleted after 180 days. An unsent draft is saved every 10 seconds in your browser’s local storage only, never sent to the server, and removed once you send.',
    analyticsTitle: 'Analytics',
    analyticsBody: 'One record per visit: page, language, referring site and campaign tags. No IP address, no browser details, no cookie. Kept for 13 months.',
    footer: 'Cookie settings'
  };

  root.ChicConsentText = {
    get: function (lang) { return /^en/i.test(lang || '') ? en : zh; }
  };
})(window);
