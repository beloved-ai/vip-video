// ==================== VIP追剧神器 ====================

const API_BASE = 'https://api.guangsuapi.com/api.php/provide/vod/?ac=videolist&wd=';
let currentSrc = 'https://jx.xmflv.com/?url=';
let currentPlayUrl = '';

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('vip_src');
  if (saved) currentSrc = saved;
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
  const keyword = document.getElementById('searchInput').value.trim();
  if (!keyword) { shake('searchInput'); return; }

  const results = document.getElementById('searchResults');
  results.innerHTML = '<div class="loading">正在搜索...</div>';

  // 关闭播放器
  closePlayer();

  try {
    const resp = await fetch(API_BASE + encodeURIComponent(keyword));
    const data = await resp.json();

    if (!data.list || data.list.length === 0) {
      results.innerHTML = '<div class="empty">未找到相关视频，换个关键词试试</div>';
      return;
    }

    results.innerHTML = data.list.map(item => {
      const episodes = item.vod_play_url ? item.vod_play_url.split('$$$') : [];
      // 取第一个播放源的集数
      const epList = episodes.length > 0 ? episodes[0].split('#') : [];
      const desc = (item.vod_content || '').replace(/<[^>]+>/g, '').trim();

      return `
        <div class="result-card">
          <div class="result-top">
            <img class="result-cover" src="${item.vod_pic}" alt="${item.vod_name}"
                 onerror="this.style.display='none'" loading="lazy">
            <div class="result-info">
              <div class="result-title">${item.vod_name}</div>
              <div class="result-meta">${item.type_name || ''} | ${item.vod_year || ''} | ${item.vod_remarks || ''}</div>
              <div class="result-desc">${desc.substring(0, 120)}</div>
            </div>
          </div>
          <div class="result-episodes">
            ${epList.slice(0, 30).map(ep => {
              const parts = ep.split('$');
              const name = parts[0] || '播放';
              const url = parts[1] || '';
              return url ? `<button class="ep-btn" onclick="playEpisode('${escapeHtml(item.vod_name)} - ${escapeHtml(name)}', '${escapeAttr(url)}')">${escapeHtml(name)}</button>` : '';
            }).join('')}
            ${epList.length > 30 ? '<span style="color:#999;font-size:12px;padding:6px;">共' + epList.length + '集</span>' : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    results.innerHTML = '<div class="empty">搜索失败，请稍后重试</div>';
    console.error(err);
  }
}

// ==================== 播放 ====================
function playEpisode(title, url) {
  currentPlayUrl = url;
  document.getElementById('playerTitle').textContent = title;
  document.getElementById('searchResults').style.display = 'none';
  document.getElementById('playerArea').style.display = 'flex';
  document.getElementById('playFrame').src = url;
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
  const frame = document.getElementById('urlFrame');
  frame.style.display = 'block';
  frame.src = currentSrc + encodeURIComponent(url);
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

function escapeHtml(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function escapeAttr(s) {
  return (s||'').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
