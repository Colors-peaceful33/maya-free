// KIN ORACLE Lite — app.js
import { calcKin, getKinData, SEAL_NAMES } from './maya-calc.js';
import { SEAL_READINGS, WAVESPELL_READINGS, TONE_READINGS } from './reading-texts.js';

// ── 紋章スラッグ対応表 ──────────────────────────────────
const SEAL_SLUGS = {
  '赤い龍':        'akai-ryu',
  '白い風':        'shiroi-kaze',
  '青い夜':        'aoi-yoru',
  '黄色い種':      'kiiroi-tane',
  '赤い蛇':        'akai-hebi',
  '白い世界の橋渡し': 'shiroi-hashi',
  '青い手':        'aoi-te',
  '黄色い星':      'kiiroi-hoshi',
  '赤い月':        'akai-tsuki',
  '白い犬':        'shiroi-inu',
  '青い猿':        'aoi-saru',
  '黄色い人':      'kiiroi-hito',
  '赤い空歩く人':  'akai-sorayuku',
  '白い魔法使い':  'shiroi-mahoutsukai',
  '青い鷲':        'aoi-washi',
  '黄色い戦士':    'kiiroi-senshi',
  '赤い地球':      'akai-chikyuu',
  '白い鏡':        'shiroi-kagami',
  '青い嵐':        'aoi-arashi',
  '黄色い太陽':    'kiiroi-taiyou',
};

// 紋章カラークラス
const SEAL_COLOR_CLASS = {
  '赤': 'red', '白': 'white', '青': 'blue', '黄': 'yellow'
};

function getSealColor(sealName) {
  const first = sealName[0];
  return SEAL_COLOR_CLASS[first] || 'red';
}

// 紋章番号 → 関係紋章算出
function antipodeSeal(n) {
  // 反対 = (n + 10 - 1) % 20 + 1  but wrapped to 1-20
  const r = ((n - 1 + 10) % 20) + 1;
  return r;
}
function analogSeal(n) {
  // 類似 = (38 - n) % 20, with wraparound to 1-20
  let r = (38 - n) % 20;
  if (r <= 0) r += 20;
  return r;
}
function occultSeal(n) {
  // 神秘 = 21 - n
  return 21 - n;
}

// 紋章番号を返す（TZOLKIN の s フィールドから逆引き）
function sealNameToNum(name) {
  for (const [k, v] of Object.entries(SEAL_NAMES)) {
    if (v === name) return parseInt(k);
  }
  return null;
}

// ── セレクト初期化 ────────────────────────────────────────
function initYearSelect() {
  const sel = document.getElementById('f-year');
  const curYear = new Date().getFullYear();
  for (let y = curYear; y >= 1910; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = `${y}年`;
    sel.appendChild(opt);
  }
}

function initDaySelect() {
  const sel = document.getElementById('f-day');
  for (let d = 1; d <= 31; d++) {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = `${d}日`;
    sel.appendChild(opt);
  }
}

// ── テキスト省略 ─────────────────────────────────────────
function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '……' : str;
}

// ── 結果描画 ─────────────────────────────────────────────
function renderResult(year, month, day) {
  let kin;
  try {
    kin = calcKin(year, month, day);
  } catch (e) {
    alert('生年月日の計算でエラーが発生しました。日付をご確認ください。');
    return;
  }

  const data = getKinData(kin);
  if (!data) { alert('KINデータを取得できませんでした。'); return; }

  const sealName = data.solar_seal;
  const tone = data.tone;
  const wavespell = data.wavespell;
  const guideName = data.guide;

  // 紋章番号
  const sealNum = sealNameToNum(sealName);
  const color = getSealColor(sealName);

  // KIN バッジ
  document.getElementById('result-kin-num').textContent = kin;
  document.getElementById('result-date').textContent =
    `${year}年${month}月${day}日生まれ`;

  // 紋章画像・名前
  const img = document.getElementById('result-seal-img');
  img.src = `assets/images/seals/${sealName}.png`;
  img.alt = sealName;

  document.getElementById('result-seal-name').textContent = sealName;

  // カードカラー
  const card = document.getElementById('result-seal-card');
  card.className = `result-seal-card result-seal-card--${color}`;

  // タグ情報
  const toneEl = document.getElementById('result-tone');
  toneEl.innerHTML = `<img src="assets/images/tones/${tone}.png" alt="音${tone}" class="result-tone-img"> 音${tone}`;
  document.getElementById('result-wavespell').textContent = wavespell;
  document.getElementById('result-guide').textContent = guideName;

  // 関係紋章（紋章名で表示）
  if (sealNum) {
    document.getElementById('result-antipode').textContent =
      SEAL_NAMES[antipodeSeal(sealNum)] || '-';
    document.getElementById('result-analog').textContent =
      SEAL_NAMES[analogSeal(sealNum)] || '-';
    document.getElementById('result-occult').textContent =
      SEAL_NAMES[occultSeal(sealNum)] || '-';
  }

  // 絶対反対KIN（KIN ± 130）
  const blackKin = kin > 130 ? kin - 130 : kin + 130;
  document.getElementById('result-black').textContent = `KIN${blackKin}`;

  // 解説テキスト
  const sealReading = SEAL_READINGS[sealName] || '';
  const waveReading = WAVESPELL_READINGS[wavespell] || '';
  const toneReading = TONE_READINGS[tone] || '';

  const PREVIEW_LEN = 180;
  setReading('seal-reading', sealReading, PREVIEW_LEN, `seal/${SEAL_SLUGS[sealName]}.html`);
  setReading('wave-reading', waveReading, PREVIEW_LEN, null);
  setReading('tone-reading', toneReading, PREVIEW_LEN, null);

  // 5つの城
  setCastle(kin);

  // 表示切替
  document.getElementById('result-area').hidden = false;
  document.getElementById('result-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('diagnosis').style.display = 'none';
}

function setReading(prefix, fullText, previewLen, moreHref) {
  const preview = document.getElementById(`${prefix}-preview`);
  const full = document.getElementById(`${prefix}-full`);
  if (!preview || !full) return;

  preview.textContent = truncate(fullText, previewLen);

  full.innerHTML = '';
  // パラグラフ分割（2文字以上の改行や句点区切りは段落に）
  const paras = fullText.split(/\n\n+|(?<=。)\s*(?=[^\s])/g).filter(p => p.trim());
  paras.forEach(p => {
    const el = document.createElement('p');
    el.textContent = p.trim();
    full.appendChild(el);
  });

  if (moreHref) {
    const link = document.createElement('a');
    link.href = moreHref;
    link.className = 'reading-more-link';
    link.textContent = `「${prefix.includes('seal') ? '太陽の紋章' : ''}」の詳細ページを見る →`;
    full.appendChild(link);
  }
}

// ── 5つの城 ────────────────────────────────────────────────
const CASTLES = [
  { name: '赤い東の城', range: '1〜52',   theme: '誕生と出発', color: 'red' },
  { name: '白い北の城', range: '53〜104', theme: '精錬と浄化', color: 'white' },
  { name: '青い西の城', range: '105〜156',theme: '変容と魔法', color: 'blue' },
  { name: '黄色い南の城',range: '157〜208',theme: '成熟と開花', color: 'yellow' },
  { name: '緑の中心の城',range: '209〜260',theme: '統合と悟り', color: 'green' },
];

function getCastle(kin) {
  if (kin <= 52)  return CASTLES[0];
  if (kin <= 104) return CASTLES[1];
  if (kin <= 156) return CASTLES[2];
  if (kin <= 208) return CASTLES[3];
  return CASTLES[4];
}

function setCastle(kin) {
  const el = document.getElementById('result-castle');
  if (!el) return;
  const c = getCastle(kin);
  el.innerHTML = `
    <span class="result-castle__name">${c.name}</span>
    <span class="result-castle__theme">${c.theme}</span>
    <span class="result-castle__range">KIN ${c.range}</span>`;
  el.className = `result-castle result-castle--${c.color}`;
}

// ── アコーディオン制御 ────────────────────────────────────
function initAccordion() {
  document.querySelectorAll('.reading-card__toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.reading-card');
      const body = card.querySelector('.reading-card__full');
      const icon = btn.querySelector('.reading-card__toggle-icon');
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      btn.setAttribute('aria-expanded', !isOpen);
      body.hidden = isOpen;
      icon.textContent = isOpen ? '+' : '−';
    });
  });
}

// ── FAQ アコーディオン ─────────────────────────────────────
function initFaqAccordion() {
  document.querySelectorAll('.faq-item__q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const answer = item.querySelector('.faq-item__a');
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      // 他のFAQを閉じる
      document.querySelectorAll('.faq-item').forEach(it => {
        if (it !== item) {
          it.querySelector('.faq-item__q').setAttribute('aria-expanded', 'false');
          it.querySelector('.faq-item__a').hidden = true;
          it.classList.remove('faq-item--open');
        }
      });

      btn.setAttribute('aria-expanded', !isOpen);
      answer.hidden = isOpen;
      item.classList.toggle('faq-item--open', !isOpen);
    });
  });
}

// ── メイン処理 ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initYearSelect();
  initDaySelect();
  initAccordion();
  initFaqAccordion();

  // 診断フォーム送信
  const form = document.getElementById('diagnosis-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const year  = parseInt(document.getElementById('f-year').value);
    const month = parseInt(document.getElementById('f-month').value);
    const day   = parseInt(document.getElementById('f-day').value);

    const errEl = document.getElementById('form-error');
    if (!year || !month || !day) {
      errEl.hidden = false;
      return;
    }
    errEl.hidden = true;
    renderResult(year, month, day);
  });

  // 再診断ボタン
  const retryBtn = document.getElementById('retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      document.getElementById('result-area').hidden = true;
      document.getElementById('diagnosis').style.display = '';
      document.getElementById('diagnosis').scrollIntoView({ behavior: 'smooth' });
      form.reset();
      initYearSelect(); // リセット後に再生成が必要な場合
    });
  }
});
