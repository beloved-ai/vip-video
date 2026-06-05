// ==================== VIP追剧神器 ====================

const API_URL = 'https://api.guangsuapi.com/api.php/provide/vod/?ac=videolist&wd=';
const PROXY = 'https://api.allorigins.win/raw?url=';
let currentSrc = 'https://jx.xmflv.com/?url=';
let currentPlayUrl = '';

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
  const s = localStorage.getItem('vip_src');
  if (s) currentSrc = s;
  document.querySelectorAll('[data-src]').forEach(b => {
    b.classList.toggle('active', b.dataset.src === currentSrc);
  });
  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
  });
  document.getElementById('urlInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') playUrl();
  });
});

// ==================== 模式切换 ====================
function switchMode(mode) {
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.textContent.includes(mode === 'search' ? '搜索' : '网址'));
  });
  document.querySelectorAll('.mode-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(mode + 'Mode').classList.add('active');
}

// ==================== 搜索 ====================
async function doSearch() {
  const kw = document.getElementById('searchInput').value.trim();
  if (!kw) { shake('searchInput'); return; }

  const el = document.getElementById('searchResults');
  el.innerHTML = '<div class="loading">正在搜索...</div>';
  closePlayer();

  // 方式1: 尝试 API 搜索
  try {
    const apiUrl = API_URL + encodeURIComponent(kw);
    const resp = await fetch(PROXY + encodeURIComponent(apiUrl), { signal: AbortSignal.timeout(8000) });
    const data = await resp.json();
    if (data.list && data.list.length > 0) {
      renderResults(data.list);
      return;
    }
  } catch (e) {
    console.log('API搜索失败，尝试备用方案:', e.message);
  }

  // 方式2: 备用 - 跳转搜索引擎
  el.innerHTML = `
    <div class="empty">
      <p>API 搜索暂时不可用</p>
      <br>
      <a href="https://www.baidu.com/s?wd=${encodeURIComponent(kw + ' 免费在线观看')}" target="_blank"
         style="color:#6366f1;font-size:14px;font-weight:600;">
        → 点击用百度搜索"${kw}"
      </a>
      <br><br>
      <a href="https://cn.bing.com/search?q=${encodeURIComponent(kw + ' 免费在线观看')}" target="_blank"
         style="color:#6366f1;font-size:14px;font-weight:600;">
        → 点击用必应搜索"${kw}"
      </a>
    </div>
  `;
}

function renderResults(list) {
  const el = document.getElementById('searchResults');
  el.innerHTML = list.map(item => {
    const sources = item.vod_play_url ? item.vod_play_url.split('$$$') : [];
    const eps = sources.length > 0 ? sources[0].split('#') : [];
    const desc = (item.vod_content || '').replace(/<[^>]+>/g, '').trim();

    return `
      <div class="result-card">
        <div class="result-top">
          <img class="result-cover" src="${item.vod_pic}" alt=""
               onerror="this.style.display='none'" loading="lazy">
          <div class="result-info">
            <div class="result-title">${esc(item.vod_name)}</div>
            <div class="result-meta">${esc(item.type_name||'')} · ${esc(item.vod_year||'')} · ${esc(item.vod_remarks||'')}</div>
            <div class="result-desc">${esc(desc.substring(0, 100))}</div>
          </div>
        </div>
        <div class="result-episodes">
          ${eps.slice(0, 40).map(ep => {
            const p = ep.split('$');
            return p[1] ? `<button class="ep-btn" onclick="playEp('${esc(item.vod_name)} - ${esc(p[0])}','${escAttr(p[1])}')">${esc(p[0])}</button>` : '';
          }).join('')}
          ${eps.length > 40 ? `<span style="font-size:11px;color:#aaa;padding:5px;">共${eps.length}集</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// ==================== 播放 ====================
function playEp(title, url) {
  currentPlayUrl = url;
  document.getElementById('playerTitle').textContent = title;
  document.getElementById('searchResults').style.display = 'none';
  const area = document.getElementById('playerArea');
  area.style.display = 'flex';
  document.getElementById('playFrame').src = url;

  // 3秒后检测是否被封（iframe 加载失败的信号）
  setTimeout(() => {
    try {
      // 尝试访问 iframe 内容，如果被跨域阻止说明加载成功
      document.getElementById('playFrame').contentWindow.location;
    } catch (e) {
      // 跨域错误 = 正常加载了外部页面
    }
  }, 3000);
}

function closePlayer() {
  document.getElementById('playerArea').style.display = 'none';
  document.getElementById('searchResults').style.display = 'block';
  document.getElementById('playFrame').src = 'about:blank';
  currentPlayUrl = '';
}

function openPlayerNewTab() {
  if (currentPlayUrl) window.open(currentPlayUrl, '_blank');
}

// ==================== 网址模式 ====================
function playUrl() {
  let url = document.getElementById('urlInput').value.trim();
  if (!url) { shake('urlInput'); return; }
  if (!url.startsWith('http')) url = 'https://' + url;
  document.getElementById('urlPlaceholder').style.display = 'none';
  const f = document.getElementById('urlFrame');
  f.style.display = 'block';
  f.src = currentSrc + encodeURIComponent(url);
}

function switchSrc(btn) {
  document.querySelectorAll('[data-src]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentSrc = btn.dataset.src;
  localStorage.setItem('vip_src', currentSrc);
}

// ==================== 工具 ====================
function shake(id) {
  const el = document.getElementById(id);
  el.style.animation = 'none'; el.offsetHeight;
  el.style.animation = 'shake 0.3s ease'; el.focus();
}
function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escAttr(s) { return (s||'').replace(/'/g,"\\'").replace(/"/g,'&quot;'); }
