/*!
 * @license MPL-2.0-no-copyleft-exception
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * This Source Code Form is "Incompatible With Secondary Licenses", as
 * defined by the Mozilla Public License, v. 2.0.
 */

import config from './data/config.js';
import i18n from './i18n/i18n.js';
import Router from './page/router.js';
import ListPage from './page/list/listpage.js';
import ReadPage from './page/read/readpage.js';
import ConfigPage from './page/config/configpage.js';
import './page/common.js';

const router = (async function () {
  const locale = await config.get('locale', 'auto');
  if (locale !== 'auto') i18n.setLocale(locale);
  Array.from(document.querySelectorAll('[data-i18n]')).forEach(element => {
    element.textContent = i18n.getMessage(element.dataset.i18n, ...element.children);
  });
  document.documentElement.lang = i18n.getMessage('locale');
}()).then(() => {
  const router = new Router({
    list: new ListPage(),
    read: new ReadPage(),
    config: new ConfigPage(),
  }, '/');
  return router;
});
function getWordAt(text, offset) {
    const left = text.slice(0, offset).search(/\b\w+$/);
    const right = text.slice(offset).search(/\W/);
    if (left === -1) return '';
    return text.slice(left, offset + (right === -1 ? text.length : right)).trim();
  }
window.addEventListener('load', () => {
  ; (async function () {
    if (navigator.onLine === false) return;
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.register('./sw.js');
      reg.update();
    }
  }()).catch(() => {
    // Service Worker may be rejected due to not supported, privacy setting, ect.
  });
  // 在页面加载后添加获取鼠标位置单词并复制到剪贴板的逻辑
  const midDiv = document.querySelector('article div');

  if (midDiv) {
    midDiv.addEventListener('mousedown', event => {
      event.preventDefault();  // 阻止默认行为
      event.stopPropagation(); // 阻止冒泡

      // 获取鼠标点击位置的文字
      const range = document.caretRangeFromPoint(event.clientX, event.clientY);
      if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
        const text = range.startContainer.textContent;
        const offset = range.startOffset;
        const word = getWordAt(text, offset);
        
        // 输出获取到的单词
        console.log("点击到的单词：", word);

        // 如果有获取到单词，复制到剪贴板
        if (word) {
          // 使用浏览器的剪贴板API复制单词
          navigator.clipboard.writeText(word).then(() => {
            console.log('已复制到剪贴板:', word);
          }).catch(err => {
            console.error('复制失败:', err);
          });
        }
      }
    });
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', async event => {
    if (event.data.action === 'import') {
      /** @type {ListPage} */
      const page = await (await router).go('list');
      await page.importFile(event.data.file);
    }
  });
}

