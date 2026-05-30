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
  return SEAL_COLOR_CLASS[first] || 'white';
}

// ── 紋章番号 → 関係紋章算出 ────────────────────────────
function antipodeSeal(n) {
  return ((n - 1 + 10) % 20) + 1;
}
function analogSeal(n) {
  // 隣り合う色ペア: 赤⇔白(奇数+1/偶数-1)、青⇔黄(奇数+1/偶数-1)
  return n % 2 === 0 ? n - 1 : n + 1;
}
function occultSeal(n) {
  return 21 - n;
}

// 紋章名 → 紋章番号
function sealNameToNum(name) {
  for (const [k, v] of Object.entries(SEAL_NAMES)) {
    if (v === name) return parseInt(k);
  }
  return null;
}

// ── 音の関係 ────────────────────────────────────────────
function toneDouble(t) {
  // 倍音: 5つ前の音（循環）
  return t > 5 ? t - 5 : t + 8;
}
function toneComplement(t) {
  // 補完: 合わせて14になる音
  return 14 - t;
}
function toneHarmony(t) {
  // 協和: 4の倍数離れた同グループの音
  const result = [];
  for (let i = 1; i <= 13; i++) {
    if (i !== t && (i - t) % 4 === 0) result.push(i);
  }
  return result;
}

// ── 魂の親戚（4KINハーモニックグループ） ────────────────
function soulRelatives(kin) {
  const start = Math.floor((kin - 1) / 4) * 4 + 1;
  const result = [];
  for (let i = start; i < start + 4; i++) {
    if (i !== kin) result.push(i);
  }
  return result;
}

// ── 鏡向KINグループ（261-KINのハーモニック） ──────────
function mirrorKinGroup(kin) {
  const mirror = 261 - kin;
  const start  = Math.floor((mirror - 1) / 4) * 4 + 1;
  const result = [];
  for (let i = start; i < start + 4; i++) result.push(i);
  return result;
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

// ── オラクルセル描画 ─────────────────────────────────────
// cellId: セル div の ID
// imgId: 画像 img の ID
// nameId: 名前 span の ID
// sealName: 紋章名
// isSelf: 自分の紋章かどうか（金枠）
function setOracleCell(cellId, imgId, nameId, sealName, isSelf = false) {
  const cell  = document.getElementById(cellId);
  const img   = document.getElementById(imgId);
  const nameEl = document.getElementById(nameId);
  if (!cell || !img || !sealName) return;

  img.src = `assets/images/seals/${sealName}.png`;
  img.alt = sealName;
  if (nameEl) nameEl.textContent = sealName;

  const colorClass = getSealColor(sealName);
  cell.className = `oracle-cell oracle-cell--${colorClass}${isSelf ? ' oracle-cell--self' : ''}`;
}

// ── 解説テキスト設定 ─────────────────────────────────────
function setReading(prefix, fullText, previewLen, moreHref) {
  const preview = document.getElementById(`${prefix}-preview`);
  const full    = document.getElementById(`${prefix}-full`);
  if (!preview || !full) return;

  preview.textContent = truncate(fullText, previewLen);

  full.innerHTML = '';
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
    link.textContent = '「太陽の紋章」の詳細ページを見る →';
    full.appendChild(link);
  }
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

  const sealName  = data.solar_seal;
  const tone      = data.tone;
  const wavespell = data.wavespell;
  const guideName = data.guide;
  const sealNum   = sealNameToNum(sealName);
  const color     = getSealColor(sealName);

  // ── KIN番号・日付 ──
  document.getElementById('result-kin-num').textContent = kin;
  document.getElementById('result-date').textContent = `${year}年${month}月${day}日生まれ`;

  // ── ① 太陽の紋章トリオカード ──
  const sealImg = document.getElementById('result-seal-img');
  sealImg.src = `assets/images/seals/${sealName}.png`;
  sealImg.alt = sealName;
  document.getElementById('result-seal-name').textContent = sealName;
  const sealCard = document.getElementById('result-seal-card');
  sealCard.className = `result-trio__card result-trio__card--${color}`;

  // ── ① ウェイブスペルトリオカード ──
  const waveImg = document.getElementById('result-wave-img');
  waveImg.src = `assets/images/seals/${wavespell}.png`;
  waveImg.alt = wavespell;
  document.getElementById('result-wavespell').textContent = wavespell;
  const waveColor = getSealColor(wavespell);
  document.getElementById('result-wave-card').className =
    `result-trio__card result-trio__card--${waveColor}`;

  // ── ① 銀河の音トリオカード ──
  const toneImg = document.getElementById('result-tone-img');
  toneImg.src = `assets/images/tones/${tone}.png`;
  toneImg.alt = `音${tone}`;
  document.getElementById('result-tone').textContent = `音${tone}`;

  // ── ② 情報ボックス ──
  document.getElementById('result-guide').textContent = guideName;

  // 絶対反対KIN
  const blackKin = kin > 130 ? kin - 130 : kin + 130;
  document.getElementById('result-black').textContent = `KIN${blackKin}`;

  // 音の関係
  const dbl  = toneDouble(tone);
  const comp = toneComplement(tone);
  const harm = toneHarmony(tone);
  document.getElementById('result-tone-relation').textContent =
    `倍音${dbl}／補完${comp}／協和${harm.join('・')}`;

  // 魂の親戚
  const souls = soulRelatives(kin);
  document.getElementById('result-soul-kin').textContent =
    souls.map(k => `KIN${k}`).join('・');

  // 鏡向KINグループ
  const mirrors = mirrorKinGroup(kin);
  document.getElementById('result-mirror-group').textContent =
    mirrors.map(k => `KIN${k}`).join('・');

  // ── ③ オラクルグリッド ──
  if (sealNum) {
    const antipodeName = SEAL_NAMES[antipodeSeal(sealNum)] || '';
    const analogName   = SEAL_NAMES[analogSeal(sealNum)]   || '';
    const occultName   = SEAL_NAMES[occultSeal(sealNum)]   || '';

    // 太陽の紋章グリッド
    setOracleCell('oracle-guide',    'oracle-guide-img',    'oracle-guide-name', guideName);
    setOracleCell('oracle-self',     'oracle-self-img',     'oracle-self-name',  sealName, true);
    setOracleCell('oracle-antipode', 'oracle-antipode-img', 'result-antipode',   antipodeName);
    setOracleCell('oracle-analog',   'oracle-analog-img',   'result-analog',     analogName);
    setOracleCell('oracle-occult',   'oracle-occult-img',   'result-occult',     occultName);

    // ウェイブスペルグリッド
    const wsNum = sealNameToNum(wavespell);
    if (wsNum) {
      const wsAntipodeName = SEAL_NAMES[antipodeSeal(wsNum)] || '';
      const wsAnalogName   = SEAL_NAMES[analogSeal(wsNum)]   || '';
      const wsOccultName   = SEAL_NAMES[occultSeal(wsNum)]   || '';

      setOracleCell('ws-oracle-self',     'ws-self-img',     'ws-self-name',     wavespell, true);
      setOracleCell('ws-oracle-antipode', 'ws-antipode-img', 'ws-antipode-name', wsAntipodeName);
      setOracleCell('ws-oracle-analog',   'ws-analog-img',   'ws-analog-name',   wsAnalogName);
      setOracleCell('ws-oracle-occult',   'ws-occult-img',   'ws-occult-name',   wsOccultName);
    }
  }

  // ── ④ 解説テキスト ──
  const PREVIEW_LEN = 180;
  setReading('seal-reading', SEAL_READINGS[sealName]  || '', PREVIEW_LEN, `seal/${SEAL_SLUGS[sealName]}.html`);
  setReading('wave-reading', WAVESPELL_READINGS[wavespell] || '', PREVIEW_LEN, null);
  setReading('tone-reading', TONE_READINGS[tone]      || '', PREVIEW_LEN, null);

  // ── 表示切替 ──
  document.getElementById('result-area').hidden = false;
  document.getElementById('result-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('diagnosis').style.display = 'none';
}

// ── アコーディオン制御 ────────────────────────────────────
function initAccordion() {
  document.querySelectorAll('.reading-card__toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const card   = btn.closest('.reading-card');
      const body   = card.querySelector('.reading-card__full');
      const icon   = btn.querySelector('.reading-card__toggle-icon');
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      btn.setAttribute('aria-expanded', !isOpen);
      body.hidden  = isOpen;
      icon.textContent = isOpen ? '+' : '−';
    });
  });
}

// ── FAQ アコーディオン ─────────────────────────────────────
function initFaqAccordion() {
  document.querySelectorAll('.faq-item__q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq-item');
      const answer = item.querySelector('.faq-item__a');
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

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
      initYearSelect();
    });
  }
});
