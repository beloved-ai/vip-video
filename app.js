// ==================== VIP追剧神器 ====================

const PARSER = 'https://jx.xmflv.com/?url=';
const PROXY = 'https://api.allorigins.win/raw?url=';

let currentSource = PARSER;
let currentUrl = '';

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

function switchMode(mode) {
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.textContent.includes(mode === 'search' ? '搜索' : '网址'));
  });
  document.querySelectorAll('.mode-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(mode + 'Mode').classList.add('active');
}

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
    const btn = event.target; const orig = btn.textContent;
    btn.textContent = '已复制!'; setTimeout(() => btn.textContent = orig, 1200);
  });
}

function openInNewTab() {
  if (currentUrl) window.open(currentSource + encodeURIComponent(currentUrl), '_blank');
}

// ==================== 集数获取（三平台） ====================

function detectPlatform(url) {
  if (/v\.qq\.com/.test(url)) return 'tencent';
  if (/iqiyi\.com/.test(url)) return 'iqiyi';
  if (/youku\.com/.test(url)) return 'youku';
  return null;
}

async function fetchEpisodes(url) {
  const platform = detectPlatform(url);
  const bar = document.getElementById('episodeBar');
  const list = document.getElementById('episodeList');

  if (!platform) {
    bar.style.display = 'none';
    return;
  }

  bar.style.display = 'block';
  list.innerHTML = '<span style="color:#999;font-size:12px;">正在获取集数列表...</span>';

  try {
    let episodes = [];
    let title = '';

    if (platform === 'tencent') {
      const result = await fetchTencentEpisodes(url);
      episodes = result.episodes;
      title = result.title;
    } else if (platform === 'iqiyi') {
      const result = await fetchIqiyiEpisodes(url);
      episodes = result.episodes;
      title = result.title;
    } else if (platform === 'youku') {
      const result = await fetchYoukuEpisodes(url);
      episodes = result.episodes;
      title = result.title;
    }

    if (episodes.length > 0) {
      document.getElementById('episodeTitle').textContent = title;
      document.getElementById('episodeCount').textContent = `共 ${episodes.length} 集`;
      list.innerHTML = episodes.map((ep, i) => {
        const isActive = (currentUrl === ep.url);
        return `<button class="ep-btn${isActive ? ' active' : ''}" onclick="playEpisode('${escAttr(ep.url)}', ${i})">${esc(ep.name)}</button>`;
      }).join('');
    } else {
      list.innerHTML = '<span style="color:#999;font-size:12px;">未找到集数信息</span>';
    }
  } catch (e) {
    console.error('获取集数失败:', e);
    list.innerHTML = '<span style="color:#999;font-size:12px;">获取集数失败</span>';
  }
}

// === 腾讯视频 ===
async function fetchTencentEpisodes(url) {
  const m = url.match(/v\.qq\.com\/x\/cover\/([a-zA-Z0-9_]+)/);
  const cid = m ? m[1] : null;
  if (!cid) return { title: '', episodes: [] };

  const apiUrl = `https://node.video.qq.com/x/api/float_vinfo2?cmd=33&otype=json&cid=${cid}`;
  const resp = await fetch(PROXY + encodeURIComponent(apiUrl), { signal: AbortSignal.timeout(10000) });
  const data = await resp.json();

  if (data.c && data.c.video_ids) {
    return {
      title: data.c.title || '未知',
      episodes: data.c.video_ids.map((vid, i) => ({
        name: `第${i + 1}集`,
        url: `https://v.qq.com/x/cover/${cid}/${vid}.html`
      }))
    };
  }
  return { title: '', episodes: [] };
}

// === 爱奇艺 ===
async function fetchIqiyiEpisodes(url) {
  // 从 URL 提取 vid，然后搜索获取专辑信息
  let searchKey = '';

  // 尝试从页面获取标题（用 vid 搜索）
  const vidMatch = url.match(/iqiyi\.com\/v_([a-zA-Z0-9]+)\.html/);
  const aidMatch = url.match(/iqiyi\.com\/a_([a-zA-Z0-9]+)\.html/);

  if (aidMatch) {
    // 专辑页面，直接用专辑ID
    searchKey = aidMatch[1];
  } else if (vidMatch) {
    searchKey = vidMatch[1];
  }

  // 用搜索 API 获取集数（用关键词搜索更可靠）
  // 先尝试从页面获取标题
  const titleFromUrl = await getTitleFromIqiyiUrl(url);
  if (titleFromUrl) searchKey = titleFromUrl;

  if (!searchKey) return { title: '', episodes: [] };

  const apiUrl = `https://search.video.iqiyi.com/o?if=html5&key=${encodeURIComponent(searchKey)}&pageNum=1&pageSize=3`;
  const resp = await fetch(PROXY + encodeURIComponent(apiUrl), { signal: AbortSignal.timeout(10000) });
  const data = await resp.json();

  if (data.data && data.data.docinfos && data.data.docinfos.length > 0) {
    const album = data.data.docinfos[0].albumDocInfo;
    const title = album.albumTitle || '';
    const episodes = [];

    if (album.videoinfos) {
      for (const ep of album.videoinfos) {
        // 从图片URL提取vid
        const vidExtract = ep.itemHImage ? ep.itemHImage.match(/\/([a-z0-9]+)_/) : null;
        const vid = vidExtract ? vidExtract[1] : '';
        if (vid) {
          episodes.push({
            name: ep.itemTitle || `第${ep.itemNumber}集`,
            url: `https://www.iqiyi.com/v_${vid}.html`
          });
        }
      }
    }
    return { title, episodes };
  }
  return { title: '', episodes: [] };
}

// 从爱奇艺 URL 获取标题
async function getTitleFromIqiyiUrl(url) {
  try {
    // 尝试用 pcw-api 获取视频信息
    const vidMatch = url.match(/iqiyi\.com\/v_([a-zA-Z0-9]+)\.html/);
    if (vidMatch) {
      const apiUrl = `https://pcw-api.iqiyi.com/video/video/baseinfo/${vidMatch[1]}`;
      const resp = await fetch(PROXY + encodeURIComponent(apiUrl), { signal: AbortSignal.timeout(8000) });
      const data = await resp.json();
      if (data.data && data.data.name) {
        // 去掉集数后缀，如"繁花 第01集" → "繁花"
        return data.data.name.replace(/\s*第?\d+集?$/, '').trim();
      }
    }
  } catch (e) { /* 静默 */ }
  return null;
}

// === 优酷 ===
async function fetchYoukuEpisodes(url) {
  const vidMatch = url.match(/youku\.com\/v_show\/id_([a-zA-Z0-9=]+)\.html/);
  if (!vidMatch) return { title: '', episodes: [] };

  // 用搜索 API 获取集数
  // 先获取标题
  const title = await getTitleFromYoukuUrl(url);
  if (!title) return { title: '', episodes: [] };

  const apiUrl = `https://search.youku.com/api/search?keyword=${encodeURIComponent(title)}&pg=1&stype=1`;
  const resp = await fetch(PROXY + encodeURIComponent(apiUrl), { signal: AbortSignal.timeout(10000) });
  const data = await resp.json();

  if (data.pageComponentList) {
    for (const comp of data.pageComponentList) {
      if (comp.body && comp.body.result) {
        const show = comp.body.result[0];
        if (show && show.show_name) {
          const episodes = [];
          // 优酷的集数信息
          if (show.skit_list) {
            for (const skit of show.skit_list) {
              episodes.push({
                name: skit.title || `第${skit.stage || episodes.length + 1}集`,
                url: `https://v.youku.com/v_show/id_${skit.vidEncoded}.html`
              });
            }
          }
          return { title: show.show_name, episodes };
        }
      }
    }
  }
  return { title: '', episodes: [] };
}

// 从优酷 URL 获取标题
async function getTitleFromYoukuUrl(url) {
  // 优酷页面标题通常在 meta 标签中，需要解析 HTML
  // 简化处理：返回 null，让调用方用其他方式
  return null;
}

function playEpisode(url, index) {
  currentUrl = url;
  playUrl(url);
  document.querySelectorAll('.ep-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === index);
  });
  const activeBtn = document.querySelector('.ep-btn.active');
  if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center' });
  document.getElementById('urlInput').value = url;
}

// ==================== 工具 ====================
function shake(id) {
  const el = document.getElementById(id);
  el.style.animation = 'none'; el.offsetHeight;
  el.style.animation = 'shake 0.3s ease'; el.focus();
}
function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escAttr(s) { return (s||'').replace(/'/g,"\\'").replace(/"/g,'&quot;'); }
