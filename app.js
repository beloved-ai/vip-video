// ==================== VIP追剧神器 ====================

const PARSER = 'https://jx.xmflv.com/?url=';
const API_PROXY = 'https://api.allorigins.win/raw?url=';
const TENCENT_API = 'https://node.video.qq.com/x/api/float_vinfo2?cmd=33&otype=json&cid=';

let currentSource = PARSER;
let currentUrl = '';
let episodeData = { title: '', cid: '', episodes: [] };

// 平台搜索地址
const PLATFORMS = {
  tencent:  'https://v.qq.com/x/search/?q=',
  iqiyi:    'https://so.iqiyi.com/so/q_',
  youku:    'https://so.youku.com/search_video/q_',
  mgtv:     'https://so.mgtv.com/so/k-',
  bilibili: 'https://search.bilibili.com/all?keyword='
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
  const s = localStorage.getItem('vip_source');
  if (s) currentSource = s;
  document.querySelectorAll('[data-src]').forEach(b => {
    b.classList.toggle('active', b.dataset.src === currentSource);
  });
  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') searchPlatform('tencent');
  });
  document.getElementById('urlInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') playVideo();
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

// ==================== 搜索模式 ====================
function searchPlatform(platform) {
  const kw = document.getElementById('searchInput').value.trim();
  if (!kw) { shake('searchInput'); return; }
  window.open(PLATFORMS[platform] + encodeURIComponent(kw), '_blank');
}

// ==================== 网址模式 ====================
function playVideo() {
  let url = document.getElementById('urlInput').value.trim();
  if (!url) { shake('urlInput'); return; }
  if (!url.startsWith('http')) url = 'https://' + url;
  currentUrl = url;
  playUrl(url);
  // 尝试获取集数列表
  fetchEpisodes(url);
}

function playUrl(url) {
  document.getElementById('urlPlaceholder').style.display = 'none';
  const frame = document.getElementById('urlFrame');
  frame.style.display = 'block';
  frame.src = currentSource + encodeURIComponent(url);
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
  if (currentUrl) window.open(currentSource + encodeURIComponent(currentUrl), '_blank');
}

// ==================== 集数获取 ====================
function extractCid(url) {
  // 腾讯视频: https://v.qq.com/x/cover/{cid}/{vid}.html
  let m = url.match(/v\.qq\.com\/x\/cover\/([a-zA-Z0-9_]+)/);
  if (m) return { platform: 'tencent', cid: m[1] };
  // 腾讯视频: https://v.qq.com/x/page/{vid}.html (需要进一步查找 cid)
  m = url.match(/v\.qq\.com\/x\/page\/([a-zA-Z0-9_]+)/);
  if (m) return { platform: 'tencent', vid: m[1] };
  return null;
}

async function fetchEpisodes(url) {
  const info = extractCid(url);
  if (!info || info.platform !== 'tencent') {
    document.getElementById('episodeBar').style.display = 'none';
    return;
  }

  const bar = document.getElementById('episodeBar');
  const list = document.getElementById('episodeList');
  bar.style.display = 'block';
  list.innerHTML = '<span style="color:#999;font-size:12px;">正在获取集数列表...</span>';

  try {
    const apiUrl = TENCENT_API + (info.cid || info.vid);
    const resp = await fetch(API_PROXY + encodeURIComponent(apiUrl), { signal: AbortSignal.timeout(10000) });
    const text = await resp.text();
    const data = JSON.parse(text);

    if (data.c && data.c.video_ids && data.c.video_ids.length > 0) {
      const title = data.c.title || '未知剧名';
      const videoIds = data.c.video_ids;
      const cid = info.cid || data.c.cid || info.vid;

      episodeData = { title, cid, episodes: videoIds };

      document.getElementById('episodeTitle').textContent = title;
      document.getElementById('episodeCount').textContent = `共 ${videoIds.length} 集`;

      list.innerHTML = videoIds.map((vid, i) => {
        const epUrl = `https://v.qq.com/x/cover/${cid}/${vid}.html`;
        const isActive = (info.vid === vid || url.includes(vid));
        return `<button class="ep-btn${isActive ? ' active' : ''}" onclick="playEpisode('${epUrl}', ${i})">第${i + 1}集</button>`;
      }).join('');
    } else {
      list.innerHTML = '<span style="color:#999;font-size:12px;">未找到集数信息</span>';
    }
  } catch (e) {
    console.error('获取集数失败:', e);
    list.innerHTML = '<span style="color:#999;font-size:12px;">获取集数失败</span>';
  }
}

function playEpisode(url, index) {
  currentUrl = url;
  playUrl(url);
  // 更新选中状态
  document.querySelectorAll('.ep-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === index);
  });
  // 滚动到选中的按钮
  const activeBtn = document.querySelector('.ep-btn.active');
  if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center' });
}

// ==================== 工具 ====================
function shake(id) {
  const el = document.getElementById(id);
  el.style.animation = 'none'; el.offsetHeight;
  el.style.animation = 'shake 0.3s ease'; el.focus();
}
