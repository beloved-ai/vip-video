// ==================== VIP追剧神器 - 前端逻辑 ====================

// 解析源
let currentSource = 'https://jx.xmflv.com/?url=';
let currentUrl = '';

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
  // 恢复上次选择的解析源
  const saved = localStorage.getItem('vip_source');
  if (saved) currentSource = saved;

  // 设置解析源按钮状态
  document.querySelectorAll('.source-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.src === currentSource);
    btn.addEventListener('click', () => switchSource(btn));
  });

  // 回车播放
  document.getElementById('urlInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') playVideo();
  });

  // 收藏按钮
  document.getElementById('addFavBtn').addEventListener('click', addFavorite);

  // 清空历史
  document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);

  // 渲染列表
  renderFavorites();
  renderHistory();
});

// ==================== 播放 ====================
function playVideo() {
  let url = document.getElementById('urlInput').value.trim();
  if (!url) {
    shakeInput();
    return;
  }

  // 自动补全 https
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }

  currentUrl = url;
  const parseUrl = currentSource + encodeURIComponent(url);

  // 显示播放器，隐藏占位
  document.getElementById('playerPlaceholder').style.display = 'none';
  const frame = document.getElementById('playerFrame');
  frame.style.display = 'block';
  frame.src = parseUrl;

  // 显示当前播放信息
  document.getElementById('nowPlaying').style.display = 'flex';
  document.getElementById('nowUrl').textContent = url;

  // 添加到历史
  addHistory(url);
}

// 切换解析源时重新加载
function reloadCurrentVideo() {
  if (!currentUrl) return;
  const parseUrl = currentSource + encodeURIComponent(currentUrl);
  document.getElementById('playerFrame').src = parseUrl;
}

// 输入框抖动动画
function shakeInput() {
  const input = document.getElementById('urlInput');
  input.style.animation = 'none';
  input.offsetHeight;
  input.style.animation = 'shake 0.3s ease';
  input.focus();
}

// 添加抖动动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-8px); }
    75% { transform: translateX(8px); }
  }
`;
document.head.appendChild(style);

// ==================== 解析源切换 ====================
function switchSource(btn) {
  document.querySelectorAll('.source-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentSource = btn.dataset.src;
  localStorage.setItem('vip_source', currentSource);

  // 如果当前有视频在播放，用新源重新加载
  if (currentUrl) {
    reloadCurrentVideo();
  }
}

// ==================== 收藏夹 ====================
function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem('vip_favorites') || '[]');
  } catch { return []; }
}

function saveFavorites(list) {
  localStorage.setItem('vip_favorites', JSON.stringify(list));
}

function addFavorite() {
  if (!currentUrl) return;
  const name = prompt('输入收藏名称（可留空使用网址）：') || extractName(currentUrl);
  const favs = getFavorites();

  // 去重
  if (favs.some(f => f.url === currentUrl)) {
    alert('已收藏过了');
    return;
  }

  favs.unshift({ url: currentUrl, name, time: Date.now() });
  saveFavorites(favs);
  renderFavorites();
}

function removeFavorite(index) {
  const favs = getFavorites();
  favs.splice(index, 1);
  saveFavorites(favs);
  renderFavorites();
}

function playFavorite(url) {
  document.getElementById('urlInput').value = url;
  playVideo();
}

function renderFavorites() {
  const list = document.getElementById('favList');
  const favs = getFavorites();

  if (favs.length === 0) {
    list.innerHTML = '<div class="empty-hint">暂无收藏，播放视频后点击"+ 添加"</div>';
    return;
  }

  list.innerHTML = favs.map((f, i) => `
    <div class="list-item" onclick="playFavorite('${escapeHtml(f.url)}')">
      <span class="item-name" title="${escapeHtml(f.url)}">${escapeHtml(f.name)}</span>
      <span class="item-delete" onclick="event.stopPropagation(); removeFavorite(${i})" title="删除">✕</span>
    </div>
  `).join('');
}

// ==================== 播放历史 ====================
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem('vip_history') || '[]');
  } catch { return []; }
}

function saveHistory(list) {
  localStorage.setItem('vip_history', JSON.stringify(list));
}

function addHistory(url) {
  const history = getHistory();
  // 去重：如果已存在则移到最前面
  const filtered = history.filter(h => h.url !== url);
  filtered.unshift({ url, name: extractName(url), time: Date.now() });
  // 最多保留 50 条
  saveHistory(filtered.slice(0, 50));
  renderHistory();
}

function clearHistory() {
  if (confirm('确定清空播放历史？')) {
    saveHistory([]);
    renderHistory();
  }
}

function removeHistory(index) {
  const history = getHistory();
  history.splice(index, 1);
  saveHistory(history);
  renderHistory();
}

function playHistory(url) {
  document.getElementById('urlInput').value = url;
  playVideo();
}

function renderHistory() {
  const list = document.getElementById('historyList');
  const history = getHistory();

  if (history.length === 0) {
    list.innerHTML = '<div class="empty-hint">暂无播放历史</div>';
    return;
  }

  list.innerHTML = history.slice(0, 20).map((h, i) => `
    <div class="list-item" onclick="playHistory('${escapeHtml(h.url)}')">
      <span class="item-name" title="${escapeHtml(h.url)}">${escapeHtml(h.name)}</span>
      <span class="item-time">${formatTime(h.time)}</span>
      <span class="item-delete" onclick="event.stopPropagation(); removeHistory(${i})" title="删除">✕</span>
    </div>
  `).join('');
}

// ==================== 工具函数 ====================
function extractName(url) {
  try {
    const u = new URL(url);
    // 从 URL 中提取有意义的部分
    const parts = u.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || '';
    return last.replace(/\.html?$/, '') || u.hostname;
  } catch {
    return url.substring(0, 30);
  }
}

function formatTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  return Math.floor(diff / 86400000) + '天前';
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function copyCurrentUrl() {
  if (!currentUrl) return;
  navigator.clipboard.writeText(currentUrl).then(() => {
    const btn = event.target;
    const orig = btn.textContent;
    btn.textContent = '已复制!';
    setTimeout(() => btn.textContent = orig, 1200);
  });
}

function openInNewTab() {
  if (!currentUrl) return;
  window.open(currentSource + encodeURIComponent(currentUrl), '_blank');
}
