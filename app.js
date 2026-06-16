// ==================== VIP追剧神器 ====================

let currentMode = 'search';
let currentSource = 'https://jx.xmflv.com/?url=';
let currentSite = 'https://www.360zy.com/vodsearch/-------------.html?wd=';
let currentUrl = '';

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
  const savedSource = localStorage.getItem('vip_source');
  if (savedSource) currentSource = savedSource;
  const savedSite = localStorage.getItem('vip_site');
  if (savedSite) currentSite = savedSite;
  const savedMode = localStorage.getItem('vip_mode');
  if (savedMode) switchMode(savedMode);

  document.querySelectorAll('[data-src]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.src === currentSource);
  });
  document.querySelectorAll('[data-site]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.site === currentSite);
  });

  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') searchAndOpen();
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
function selectSite(btn) {
  document.querySelectorAll('.site-card').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentSite = btn.dataset.site;
  localStorage.setItem('vip_site', currentSite);
}

function searchAndOpen() {
  const keyword = document.getElementById('searchInput').value.trim();
  if (!keyword) {
    shake('searchInput');
    return;
  }
  const searchUrl = currentSite + encodeURIComponent(keyword);
  window.open(searchUrl, '_blank');
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
  el.style.animation = 'none'; el.offsetHeight;
  el.style.animation = 'shake 0.3s ease'; el.focus();
}
