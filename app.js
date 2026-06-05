// ==================== VIP追剧神器 ====================

// 状态
let currentMode = 'search';
let currentSource = 'https://jx.xmflv.com/?url=';
let currentSearchSource = 'https://www.freeok.vip/search/-------------.html?wd=';
let currentUrl = '';

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
  // 恢复偏好
  const savedSource = localStorage.getItem('vip_source');
  if (savedSource) currentSource = savedSource;
  const savedSearch = localStorage.getItem('vip_search_source');
  if (savedSearch) currentSearchSource = savedSearch;
  const savedMode = localStorage.getItem('vip_mode');
  if (savedMode) switchMode(savedMode);

  // 设置按钮状态
  document.querySelectorAll('[data-src]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.src === currentSource);
  });
  document.querySelectorAll('[data-search]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.search === currentSearchSource);
  });

  // 回车事件
  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') searchVideo();
  });
  document.getElementById('urlInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') playVideo();
  });
});

// ==================== 模式切换 ====================
function switchMode(mode) {
  currentMode = mode;
  localStorage.setItem('vip_mode', mode);

  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.textContent.includes(mode === 'search' ? '搜索' : '网址'));
  });
  document.querySelectorAll('.mode-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(mode + 'Mode').classList.add('active');
}

// ==================== 搜索模式 ====================
function searchVideo() {
  const keyword = document.getElementById('searchInput').value.trim();
  if (!keyword) {
    shake('searchInput');
    return;
  }

  const searchUrl = currentSearchSource + encodeURIComponent(keyword);

  document.getElementById('searchPlaceholder').style.display = 'none';
  const frame = document.getElementById('searchFrame');
  frame.style.display = 'block';
  frame.src = searchUrl;
}

function switchSearchSource(btn) {
  document.querySelectorAll('[data-search]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentSearchSource = btn.dataset.search;
  localStorage.setItem('vip_search_source', currentSearchSource);

  // 如果有搜索词，自动重新搜索
  const keyword = document.getElementById('searchInput').value.trim();
  if (keyword) searchVideo();
}

// ==================== 网址模式 ====================
function playVideo() {
  let url = document.getElementById('urlInput').value.trim();
  if (!url) {
    shake('urlInput');
    return;
  }
  if (!url.startsWith('http')) url = 'https://' + url;

  currentUrl = url;
  const parseUrl = currentSource + encodeURIComponent(url);

  document.getElementById('urlPlaceholder').style.display = 'none';
  const frame = document.getElementById('urlFrame');
  frame.style.display = 'block';
  frame.src = parseUrl;

  document.getElementById('nowPlaying').style.display = 'flex';
  document.getElementById('nowUrl').textContent = url;
}

function switchSource(btn) {
  document.querySelectorAll('[data-src]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentSource = btn.dataset.src;
  localStorage.setItem('vip_source', currentSource);

  if (currentUrl) {
    document.getElementById('urlFrame').src = currentSource + encodeURIComponent(currentUrl);
  }
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

// ==================== 工具 ====================
function shake(id) {
  const el = document.getElementById(id);
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'shake 0.3s ease';
  el.focus();
}
