'use strict';

const MEMBERS = [
  { gen: 2, name: '遠藤 光莉', surname: '遠藤', initial: '光' },
  { gen: 2, name: '大園 玲', surname: '大園', initial: '玲' },
  { gen: 2, name: '大沼 晶保', surname: '大沼', initial: '晶' },
  { gen: 2, name: '幸阪 茉里乃', surname: '幸阪', initial: '茉' },
  { gen: 2, name: '田村 保乃', surname: '田村', initial: '保' },
  { gen: 2, name: '藤吉 夏鈴', surname: '藤吉', initial: '夏' },
  { gen: 2, name: '増本 綺良', surname: '増本', initial: '綺' },
  { gen: 2, name: '松田 里奈', surname: '松田', initial: '里' },
  { gen: 2, name: '森田 ひかる', surname: '森田', initial: 'ひ' },
  { gen: 2, name: '守屋 麗奈', surname: '守屋', initial: '麗' },
  { gen: 2, name: '山﨑 天', surname: '山﨑', initial: '天' },

  { gen: 3, name: '石森 璃花', surname: '石森', initial: '璃' },
  { gen: 3, name: '遠藤 理子', surname: '遠藤', initial: '理' },
  { gen: 3, name: '小田倉 麗奈', surname: '小田倉', initial: '麗' },
  { gen: 3, name: '小島 凪紗', surname: '小島', initial: '凪' },
  { gen: 3, name: '谷口 愛季', surname: '谷口', initial: '愛' },
  { gen: 3, name: '中嶋 優月', surname: '中嶋', initial: '優' },
  { gen: 3, name: '的野 美青', surname: '的野', initial: '美' },
  { gen: 3, name: '向井 純葉', surname: '向井', initial: '純' },
  { gen: 3, name: '村井 優', surname: '村井', initial: '優' },
  { gen: 3, name: '村山 美羽', surname: '村山', initial: '美' },
  { gen: 3, name: '山下 瞳月', surname: '山下', initial: '瞳' },

  { gen: 4, name: '浅井 恋乃未', surname: '浅井', initial: '恋' },
  { gen: 4, name: '稲熊 ひな', surname: '稲熊', initial: 'ひ' },
  { gen: 4, name: '勝又 春', surname: '勝又', initial: '春' },
  { gen: 4, name: '佐藤 愛桜', surname: '佐藤', initial: '愛' },
  { gen: 4, name: '中川 智尋', surname: '中川', initial: '智' },
  { gen: 4, name: '松本 和子', surname: '松本', initial: '和' },
  { gen: 4, name: '目黒 陽色', surname: '目黒', initial: '陽' },
  { gen: 4, name: '山川 宇衣', surname: '山川', initial: '宇' },
  { gen: 4, name: '山田 桃実', surname: '山田', initial: '桃' },
];

const MEMBERS_BY_GEN = [2, 3, 4].map(gen => ({
  gen,
  members: MEMBERS.filter(member => member.gen === gen),
}));

const duplicateSurnames = new Set(
  Object.entries(MEMBERS.reduce((acc, member) => {
    acc[member.surname] = (acc[member.surname] || 0) + 1;
    return acc;
  }, {})).filter(([, count]) => count > 1).map(([surname]) => surname)
);

const state = {
  seek: [],
  offer: [],
  lastBlob: null,
  lastUrl: '',
};

const el = {
  seekSelect: document.getElementById('seekSelect'),
  offerSelect: document.getElementById('offerSelect'),
  seekManual: document.getElementById('seekManual'),
  offerManual: document.getElementById('offerManual'),
  seekChips: document.getElementById('seekChips'),
  offerChips: document.getElementById('offerChips'),
  canvas: document.getElementById('plateCanvas'),
  createButton: document.getElementById('createButton'),
  saveButton: document.getElementById('saveButton'),
  shareButton: document.getElementById('shareButton'),
  clearButton: document.getElementById('clearButton'),
};

function init() {
  fillSelect(el.seekSelect);
  fillSelect(el.offerSelect);

  document.querySelectorAll('[data-add]').forEach(button => {
    button.addEventListener('click', () => addSelected(button.dataset.add));
  });

  el.createButton.addEventListener('click', createPlate);
  el.saveButton.addEventListener('click', saveJpeg);
  el.shareButton.addEventListener('click', shareImage);
  el.clearButton.addEventListener('click', clearAll);

  ['seekManual', 'offerManual'].forEach(id => {
    el[id].addEventListener('keydown', event => {
      if (event.key === 'Enter') createPlate();
    });
  });

  renderChips('seek');
  renderChips('offer');
  drawPlate({ text: '求メンバー', count: 0 }, { text: '譲メンバー', count: 0 }, false);
}

function fillSelect(select) {
  MEMBERS_BY_GEN.forEach(group => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = `${group.gen}期生`;
    group.members.forEach(member => {
      const option = document.createElement('option');
      option.value = member.name;
      option.textContent = member.name;
      optgroup.appendChild(option);
    });
    select.appendChild(optgroup);
  });
}

function addSelected(kind) {
  const select = kind === 'seek' ? el.seekSelect : el.offerSelect;
  const value = select.value;
  if (!value) return;
  if (!state[kind].includes(value)) state[kind].push(value);
  select.value = '';
  renderChips(kind);
}

function renderChips(kind) {
  const wrap = kind === 'seek' ? el.seekChips : el.offerChips;
  wrap.innerHTML = '';
  state[kind].forEach((name, index) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = name;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.setAttribute('aria-label', `${name}を削除`);
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      state[kind].splice(index, 1);
      renderChips(kind);
    });
    chip.appendChild(remove);
    wrap.appendChild(chip);
  });
}

function normalizeName(value) {
  return String(value || '').replace(/[\s　]/g, '').trim();
}

function findMember(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const compact = normalizeName(raw);

  const direct = MEMBERS.find(member => normalizeName(member.name) === compact);
  if (direct) return direct;

  const parenMatch = raw.match(/^(.+)[\(（](.)[\)）]$/);
  if (parenMatch) {
    const surname = parenMatch[1].trim();
    const initial = parenMatch[2].trim();
    const matched = MEMBERS.find(member => member.surname === surname && member.initial === initial);
    if (matched) return matched;
  }

  const bySurname = MEMBERS.filter(member => member.surname === raw || normalizeName(member.surname) === compact);
  return bySurname.length === 1 ? bySurname[0] : null;
}

function parseManual(text) {
  const tokens = String(text || '')
    .replace(/　/g, ' ')
    .split(/\s+/)
    .map(token => token.trim())
    .filter(Boolean);

  const result = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const two = tokens[i + 1] ? `${tokens[i]} ${tokens[i + 1]}` : '';
    const twoCompact = tokens[i + 1] ? `${tokens[i]}${tokens[i + 1]}` : '';
    const memberByTwo = findMember(two) || findMember(twoCompact);
    if (memberByTwo) {
      result.push(memberByTwo.name);
      i += 1;
      continue;
    }
    result.push(tokens[i]);
  }
  return result;
}

function toEntry(value, source) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const member = findMember(raw);
  const key = member ? `member:${member.name}` : `text:${normalizeName(raw)}`;
  return { raw, source, member, key };
}

function collectEntries(kind) {
  const selected = state[kind].map(value => toEntry(value, 'select')).filter(Boolean);
  const manualValues = kind === 'seek' ? parseManual(el.seekManual.value) : parseManual(el.offerManual.value);
  const manual = manualValues.map(value => toEntry(value, 'manual')).filter(Boolean);
  const merged = [...selected, ...manual];

  const unique = [];
  const seen = new Set();
  merged.forEach(entry => {
    if (seen.has(entry.key)) return;
    seen.add(entry.key);
    unique.push(entry);
  });
  return unique;
}

function displayName(entry, totalCount) {
  if (!entry.member) return entry.raw.replace(/\s+/g, ' ').trim();
  if (totalCount >= 2) {
    return duplicateSurnames.has(entry.member.surname)
      ? `${entry.member.surname}(${entry.member.initial})`
      : entry.member.surname;
  }
  if (entry.source === 'select') {
    return duplicateSurnames.has(entry.member.surname)
      ? `${entry.member.surname}(${entry.member.initial})`
      : entry.member.surname;
  }
  return entry.member.name;
}

function buildPlateData(kind) {
  const entries = collectEntries(kind);
  if (entries.length === 0) {
    return {
      text: kind === 'seek' ? '求メンバー' : '譲メンバー',
      count: 0,
    };
  }
  return {
    text: entries.map(entry => displayName(entry, entries.length)).join(' '),
    count: entries.length,
  };
}

function createPlate() {
  const seekData = buildPlateData('seek');
  const offerData = buildPlateData('offer');
  drawPlate(seekData, offerData, true);
  el.saveButton.disabled = false;
  el.shareButton.disabled = false;
}

function clearAll() {
  state.seek = [];
  state.offer = [];
  el.seekManual.value = '';
  el.offerManual.value = '';
  renderChips('seek');
  renderChips('offer');
  drawPlate({ text: '求メンバー', count: 0 }, { text: '譲メンバー', count: 0 }, false);
  el.saveButton.disabled = true;
  el.shareButton.disabled = true;
}

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function drawSparkles(ctx, x, y, w, h, color, seed) {
  const rand = seededRandom(seed);
  ctx.save();
  ctx.globalAlpha = 0.72;
  for (let i = 0; i < 42; i += 1) {
    const px = x + rand() * w;
    const py = y + rand() * h;
    const size = 8 + rand() * 24;
    if (i % 3 === 0) {
      drawStar(ctx, px, py, size, '#ffffff');
    } else {
      ctx.beginPath();
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,.55)' : color;
      ctx.arc(px, py, size * .48, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawStar(ctx, x, y, size, fill) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(size * .16, -size * .16, size, 0);
  ctx.quadraticCurveTo(size * .16, size * .16, 0, size);
  ctx.quadraticCurveTo(-size * .16, size * .16, -size, 0);
  ctx.quadraticCurveTo(-size * .16, -size * .16, 0, -size);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

function drawHeartRow(ctx, y, color) {
  ctx.save();
  ctx.font = '112px "Arial", "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(255,255,255,.95)';
  ctx.shadowBlur = 10;
  const heart = color === 'green' ? '💚' : '🩷';
  [160, 305, 450].forEach(x => ctx.fillText(heart, x, y));
  [1086, 1231, 1376].forEach(x => ctx.fillText(heart, x, y));
  ctx.restore();
}

function drawLabel(ctx, x, y, label, color) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.font = '900 112px "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 20;
  ctx.strokeText(`【 ${label} 】`, x, y);
  ctx.fillStyle = color;
  ctx.fillText(`【 ${label} 】`, x, y);
  ctx.restore();
}

function wrapText(ctx, text, maxWidth, fontSize, fontFamily) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  ctx.font = `950 ${fontSize}px ${fontFamily}`;
  const lines = [];
  let line = words[0];
  for (let i = 1; i < words.length; i += 1) {
    const test = `${line}　${words[i]}`;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
    } else {
      lines.push(line);
      line = words[i];
    }
  }
  lines.push(line);
  return lines;
}

function fitText(ctx, text, maxWidth, maxLines, startSize, minSize, fontFamily) {
  for (let size = startSize; size >= minSize; size -= 4) {
    const lines = wrapText(ctx, text, maxWidth, size, fontFamily);
    const allFit = lines.every(line => ctx.measureText(line).width <= maxWidth);
    if (lines.length <= maxLines && allFit) return { size, lines };
  }
  return { size: minSize, lines: wrapText(ctx, text, maxWidth, minSize, fontFamily).slice(0, maxLines) };
}

function drawName(ctx, text, count, centerX, centerY, maxWidth, color) {
  const fontFamily = '"Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif';
  const maxLines = count >= 4 ? 2 : 1;
  const startSize = count >= 4 ? 132 : 176;
  const minSize = count >= 4 ? 52 : 72;
  const { size, lines } = fitText(ctx, text, maxWidth, maxLines, startSize, minSize, fontFamily);
  const lineHeight = size * 1.08;
  const firstY = centerY - ((lines.length - 1) * lineHeight / 2);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.font = `950 ${size}px ${fontFamily}`;
  lines.forEach((line, index) => {
    const y = firstY + index * lineHeight;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(24, size * .19);
    ctx.strokeText(line, centerX, y);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = Math.max(14, size * .11);
    ctx.strokeText(line, centerX, y);
    ctx.fillStyle = '#050505';
    ctx.fillText(line, centerX, y);
  });
  ctx.restore();
}

function drawSection(ctx, { y, height, border, bg1, bg2, label, labelColor, outline, heartColor, data }) {
  const x = 14;
  const w = 1508;
  const r = 44;
  const grad = ctx.createLinearGradient(0, y, w, y + height);
  grad.addColorStop(0, bg1);
  grad.addColorStop(.58, bg2);
  grad.addColorStop(1, '#ffffff');

  ctx.save();
  roundedRect(ctx, x, y, w, height, r);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = border;
  ctx.stroke();

  drawSparkles(ctx, x, y, w, height, border, label === '求' ? 11 : 29);
  drawHeartRow(ctx, y + 98, heartColor);
  drawLabel(ctx, 768, y + 112, label, labelColor);
  const nameCenterY = y + height * (data.count >= 4 ? .64 : .60);
  drawName(ctx, data.text, data.count, 768, nameCenterY, 1310, outline);

  ctx.restore();
}

function drawCenterArrow(ctx) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.font = '950 96px "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 18;
  ctx.strokeText('⇅', 768, 512);
  ctx.fillStyle = '#111';
  ctx.fillText('⇅', 768, 512);
  ctx.restore();
}

function drawPlate(seekData, offerData, createBlob) {
  const ctx = el.canvas.getContext('2d');
  const w = el.canvas.width;
  const h = el.canvas.height;

  ctx.clearRect(0, 0, w, h);
  const background = ctx.createLinearGradient(0, 0, w, h);
  background.addColorStop(0, '#f7ffd9');
  background.addColorStop(.5, '#ffffff');
  background.addColorStop(1, '#fff1f8');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, w, h);

  drawSection(ctx, {
    y: 16,
    height: 480,
    border: '#56ad00',
    bg1: '#ecff9b',
    bg2: '#fbffd4',
    label: '求',
    labelColor: '#209100',
    outline: '#80cf28',
    heartColor: 'green',
    data: seekData,
  });

  drawSection(ctx, {
    y: 528,
    height: 480,
    border: '#f43b88',
    bg1: '#ffe0ee',
    bg2: '#ffc9df',
    label: '譲',
    labelColor: '#f31576',
    outline: '#ff8cba',
    heartColor: 'pink',
    data: offerData,
  });

  drawCenterArrow(ctx);

  if (createBlob) {
    el.canvas.toBlob(blob => {
      if (!blob) return;
      state.lastBlob = blob;
      if (state.lastUrl) URL.revokeObjectURL(state.lastUrl);
      state.lastUrl = URL.createObjectURL(blob);
    }, 'image/jpeg', .94);
  }
}

function fileName() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  return `sakurazaka_trade_plate_${stamp}.jpg`;
}

function saveJpeg() {
  if (!state.lastBlob) createPlate();
  const url = state.lastUrl || el.canvas.toDataURL('image/jpeg', .94);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName();
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function shareImage() {
  if (!state.lastBlob) createPlate();
  if (!state.lastBlob) return;
  const file = new File([state.lastBlob], fileName(), { type: 'image/jpeg' });
  if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ files: [file], title: '生写真交換プレート' });
      return;
    } catch (error) {
      if (error && error.name === 'AbortError') return;
    }
  }
  saveJpeg();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}

init();
