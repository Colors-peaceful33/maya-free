#!/usr/bin/env python3
"""20枚の紋章個別ページを生成するスクリプト"""
import os, re

BASE = os.path.dirname(os.path.abspath(__file__))
SEAL_DIR = os.path.join(BASE, "seal")
JS_PATH  = os.path.join(BASE, "assets/js/reading-texts.js")

# ── 紋章データ定義 ──────────────────────────────────────
SEALS = [
  {"num": 1,  "name": "赤い龍",          "slug": "akai-ryu",           "color": "red",    "key": "始まり・生命・責任",
   "antipode": "白い鏡",   "analog": "赤い龍",    "occult": "黄色い太陽",  "guide_base": "赤"},
  {"num": 2,  "name": "白い風",          "slug": "shiroi-kaze",        "color": "white",  "key": "伝達・感性・言葉",
   "antipode": "青い嵐",   "analog": "白い風",    "occult": "黄色い戦士",  "guide_base": "白"},
  {"num": 3,  "name": "青い夜",          "slug": "aoi-yoru",           "color": "blue",   "key": "夢・豊かさ・神秘",
   "antipode": "黄色い太陽","analog": "青い夜",   "occult": "黄色い種",    "guide_base": "青"},
  {"num": 4,  "name": "黄色い種",        "slug": "kiiroi-tane",        "color": "yellow", "key": "知識・開花・集中",
   "antipode": "赤い地球", "analog": "黄色い種",  "occult": "青い夜",      "guide_base": "黄"},
  {"num": 5,  "name": "赤い蛇",          "slug": "akai-hebi",          "color": "red",    "key": "本能・情熱・生命力",
   "antipode": "白い魔法使い","analog": "赤い龍", "occult": "黄色い星",    "guide_base": "赤"},
  {"num": 6,  "name": "白い世界の橋渡し","slug": "shiroi-hashi",       "color": "white",  "key": "死と再生・橋渡し",
   "antipode": "青い鷲",   "analog": "白い風",    "occult": "黄色い戦士",  "guide_base": "白"},
  {"num": 7,  "name": "青い手",          "slug": "aoi-te",             "color": "blue",   "key": "癒し・達成・行動",
   "antipode": "黄色い人", "analog": "青い夜",    "occult": "赤い月",      "guide_base": "青"},
  {"num": 8,  "name": "黄色い星",        "slug": "kiiroi-hoshi",       "color": "yellow", "key": "美・芸術・調和",
   "antipode": "赤い蛇",   "analog": "黄色い種",  "occult": "白い鏡",      "guide_base": "黄"},
  {"num": 9,  "name": "赤い月",          "slug": "akai-tsuki",         "color": "red",    "key": "浄化・流れ・感受性",
   "antipode": "白い犬",   "analog": "赤い龍",    "occult": "青い手",      "guide_base": "赤"},
  {"num": 10, "name": "白い犬",          "slug": "shiroi-inu",         "color": "white",  "key": "愛・誠実・忠実",
   "antipode": "赤い月",   "analog": "白い風",    "occult": "青い猿",      "guide_base": "白"},
  {"num": 11, "name": "青い猿",          "slug": "aoi-saru",           "color": "blue",   "key": "遊び・魔法・創造",
   "antipode": "黄色い戦士","analog": "青い夜",   "occult": "白い犬",      "guide_base": "青"},
  {"num": 12, "name": "黄色い人",        "slug": "kiiroi-hito",        "color": "yellow", "key": "自由意志・知恵・影響",
   "antipode": "青い手",   "analog": "黄色い種",  "occult": "赤い龍",      "guide_base": "黄"},
  {"num": 13, "name": "赤い空歩く人",    "slug": "akai-sorayuku",      "color": "red",    "key": "探求・奉仕・空間",
   "antipode": "白い世界の橋渡し","analog": "赤い龍","occult": "白い魔法使い","guide_base": "赤"},
  {"num": 14, "name": "白い魔法使い",    "slug": "shiroi-mahoutsukai", "color": "white",  "key": "魔法・受容・永遠",
   "antipode": "赤い蛇",   "analog": "白い風",    "occult": "赤い空歩く人","guide_base": "白"},
  {"num": 15, "name": "青い鷲",          "slug": "aoi-washi",          "color": "blue",   "key": "ビジョン・創造性・先見",
   "antipode": "白い世界の橋渡し","analog": "青い夜","occult": "赤い地球", "guide_base": "青"},
  {"num": 16, "name": "黄色い戦士",      "slug": "kiiroi-senshi",      "color": "yellow", "key": "勇気・探求・知性",
   "antipode": "青い猿",   "analog": "黄色い種",  "occult": "白い風",      "guide_base": "黄"},
  {"num": 17, "name": "赤い地球",        "slug": "akai-chikyuu",       "color": "red",    "key": "進化・同調・ナビゲーション",
   "antipode": "黄色い種", "analog": "赤い龍",    "occult": "青い鷲",      "guide_base": "赤"},
  {"num": 18, "name": "白い鏡",          "slug": "shiroi-kagami",      "color": "white",  "key": "反映・真実・終わりなし",
   "antipode": "赤い龍",   "analog": "白い風",    "occult": "黄色い星",    "guide_base": "白"},
  {"num": 19, "name": "青い嵐",          "slug": "aoi-arashi",         "color": "blue",   "key": "変容・エネルギー・自己生成",
   "antipode": "白い風",   "analog": "青い夜",    "occult": "赤い蛇",      "guide_base": "青"},
  {"num": 20, "name": "黄色い太陽",      "slug": "kiiroi-taiyou",      "color": "yellow", "key": "悟り・生命・普遍的な火",
   "antipode": "青い夜",   "analog": "黄色い種",  "occult": "赤い龍",      "guide_base": "黄"},
]

SLUG_MAP = {s["name"]: s["slug"] for s in SEALS}

# 紋章の代表KIN（num, num+20, ..., num+240）
def rep_kins(num):
    return list(range(num, 261, 20))

# reading-texts.js から SEAL_READINGS を Python dict として読み込む
def parse_seal_readings(js_path):
    with open(js_path, encoding="utf-8") as f:
        content = f.read()
    # export const SEAL_READINGS = { ... }; を抜き出す
    m = re.search(r'export const SEAL_READINGS = \{(.+?)\};\s*\nexport', content, re.DOTALL)
    if not m:
        print("SEAL_READINGS parse error")
        return {}
    body = m.group(1)
    # キーと値を取り出す
    readings = {}
    # パターン: "紋章名": `テキスト`,
    for match in re.finditer(r'"([^"]+)":\s*`(.*?)`', body, re.DOTALL):
        readings[match.group(1)] = match.group(2).strip()
    return readings

def generate_page(seal, seal_reading):
    n    = seal["num"]
    name = seal["name"]
    slug = seal["slug"]
    col  = seal["color"]
    key  = seal["key"]
    kins = rep_kins(n)
    kin_chips = "\n          ".join(f'<span>KIN {k}</span>' for k in kins)

    # 反対・類似・神秘のスラッグ
    ap_slug  = SLUG_MAP.get(seal["antipode"], "#")
    an_slug  = SLUG_MAP.get(seal["analog"],   "#")
    oc_slug  = SLUG_MAP.get(seal["occult"],   "#")

    reading_html = ""
    if seal_reading:
        paras = [p.strip() for p in seal_reading.split("\n") if p.strip()]
        if not paras:
            paras = [seal_reading.strip()]
        reading_html = "\n".join(f"<p>{p}</p>" for p in paras)

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>マヤ暦「{name}」とは｜性格・才能・代表KIN番号一覧</title>
  <meta name="description" content="マヤ暦の{name}の性格・才能・恋愛・仕事の特徴を詳しく解説。代表KIN番号一覧や反対・類似・神秘の紋章との関係性も掲載。あなたの紋章は？">
  <link rel="canonical" href="https://maya-free.pages.dev/seal/{slug}.html">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Noto+Serif+JP:wght@300;400;600&family=Noto+Sans+JP:wght@300;400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>

<!-- ヘッダー -->
<header class="site-header">
  <div class="container site-header__inner">
    <a href="/" class="site-header__logo">
      <span class="site-header__logo-mark">✦</span>
      無料マヤ暦診断
    </a>
    <nav class="site-header__nav">
      <a href="/#diagnosis">診断する</a>
      <a href="/#seals">20の紋章</a>
      <a href="/#faq">FAQ</a>
      <a href="https://kin-oracle.pages.dev/oracle.html" class="site-header__nav-cta" target="_blank" rel="noopener">KIN ORACLE ↗</a>
    </nav>
  </div>
</header>

<!-- ヒーロー -->
<section class="seal-page-hero seal-page-hero--{col}">
  <div class="container">
    <div class="seal-page-hero__inner">
      <div class="seal-page-img-col">
        <img src="../assets/images/seals/{name}.png" alt="{name}のイラスト" class="seal-page-img" width="240" height="240">
      </div>
      <div class="seal-page-text-col">
        <span class="seal-page-eyebrow">Solar Seal {n:02d}</span>
        <h1 class="seal-page-title">{name}</h1>
        <p class="seal-page-key">{key}</p>
        <p class="seal-page-desc">マヤ暦20の紋章の{n}番目。{name}はその人の本質・才能・テーマとして顕れるエネルギーを象徴します。</p>
        <div class="seal-page-kin-list">
          {kin_chips}
        </div>
        <a href="/#diagnosis" class="cta-btn cta-btn--oracle" style="margin-top:1.5rem;display:inline-flex;text-decoration:none;">
          自分のKINを診断する →
        </a>
      </div>
    </div>
  </div>
</section>

<!-- 解説本文 -->
<section class="seal-detail-wrap">
  <div class="container">
    <div class="seal-detail-section">
      <h2>「{name}」の性格・才能</h2>
      {reading_html}
    </div>

    <!-- 関係紋章 -->
    <div class="seal-detail-section">
      <h2>つながりのある紋章</h2>
      <div class="relation-nav">
        <a href="{ap_slug}.html" class="relation-nav__link seal-bg--{SLUG_MAP.get(seal["antipode"], "")[:2]}">
          <span class="relation-nav__role">反対キン（Antipode）</span>
          <span class="relation-nav__name">{seal["antipode"]}</span>
        </a>
        <a href="{an_slug}.html" class="relation-nav__link">
          <span class="relation-nav__role">類似キン（Analog）</span>
          <span class="relation-nav__name">{seal["analog"]}</span>
        </a>
        <a href="{oc_slug}.html" class="relation-nav__link">
          <span class="relation-nav__role">神秘キン（Occult）</span>
          <span class="relation-nav__name">{seal["occult"]}</span>
        </a>
      </div>
    </div>

    <!-- CTA -->
    <div class="result-cta" style="margin: 3rem 0;">
      <p class="result-cta__lead">あなたの紋章を調べてみましょう</p>
      <div class="result-cta__btns">
        <a href="/#diagnosis" class="cta-btn cta-btn--oracle">
          無料でKIN番号を診断する →
        </a>
        <a href="https://lin.ee/PLACEHOLDER" class="cta-btn cta-btn--line" target="_blank" rel="noopener">
          公式LINEで無料特典を受け取る →
        </a>
      </div>
    </div>

    <!-- 紋章一覧に戻る -->
    <div style="text-align:center;margin:2rem 0 4rem;">
      <a href="/#seals" style="color:var(--gold);text-decoration:none;font-size:0.88rem;">
        ← 20種の紋章一覧へ戻る
      </a>
    </div>
  </div>
</section>

<!-- フッター -->
<footer class="site-footer">
  <div class="container site-footer__inner">
    <a href="/" class="site-footer__logo"><span>✦</span> 無料マヤ暦診断</a>
    <nav class="site-footer__nav">
      <a href="/#diagnosis">診断する</a>
      <a href="/#seals">20の紋章</a>
      <a href="/#faq">FAQ</a>
      <a href="https://kin-oracle.pages.dev/oracle.html" target="_blank" rel="noopener">KIN ORACLE</a>
    </nav>
    <p class="site-footer__copy">&copy; 2025 KIN ORACLE Lite. All rights reserved.</p>
  </div>
</footer>

</body>
</html>
"""

def main():
    os.makedirs(SEAL_DIR, exist_ok=True)
    print(f"Reading JS: {JS_PATH}")
    readings = parse_seal_readings(JS_PATH)
    print(f"Found {len(readings)} readings: {list(readings.keys())[:3]}...")

    for seal in SEALS:
        reading = readings.get(seal["name"], "")
        html = generate_page(seal, reading)
        out_path = os.path.join(SEAL_DIR, f"{seal['slug']}.html")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  Generated: seal/{seal['slug']}.html")

    print(f"\nDone! {len(SEALS)} pages generated.")

if __name__ == "__main__":
    main()
