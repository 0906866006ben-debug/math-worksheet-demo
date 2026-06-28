/**
 * geometry-lib.js
 * 零依賴、純函式的 SVG 圖形產生器
 * 供國小數學考卷（A4黑白列印）使用
 * 每個函式回傳 <svg ...>...</svg> 字串
 */

// ─── 共用常數與工具 ────────────────────────────────────────────────────────────

const SVG_W = 140;   // 畫布寬 px
const SVG_H = 120;   // 畫布高 px
const MAX_DIM = 110; // 圖形最大邊長 px

/**
 * 把「實際數值」映射到畫素長度
 * values: 所有要考慮的實際數值陣列（取最大值做分母）
 * target: 最大邊對應的畫素長度
 */
function scale(values, target) {
  const max = Math.max(...values.map(Math.abs));
  if (max === 0) return () => 0;
  return (v) => (v / max) * target;
}

/** SVG wrapper */
function svgWrap(content, viewBox) {
  const vb = viewBox || `0 0 ${SVG_W} ${SVG_H}`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `width="${SVG_W}" height="${SVG_H}" viewBox="${vb}" ` +
    `style="font-family:sans-serif;overflow:visible;">` +
    content +
    `</svg>`
  );
}

/** 文字標籤（置中） */
function label(x, y, text, opts) {
  const anchor = (opts && opts.anchor) || 'middle';
  const dy = (opts && opts.dy) || '0';
  const fontSize = (opts && opts.fontSize) || 11;
  return (
    `<text x="${r(x)}" y="${r(y)}" text-anchor="${anchor}" ` +
    `dominant-baseline="middle" dy="${dy}" ` +
    `font-size="${fontSize}" fill="currentColor">${text}</text>`
  );
}

/** 四捨五入到小數1位，避免 JS 浮點雜訊 */
function r(n) {
  return Math.round(n * 10) / 10;
}

/** 實線 */
function line(x1, y1, x2, y2, extra) {
  return `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="#000" stroke-width="1.5" ${extra || ''}/>`;
}

/** 虛線 */
function dline(x1, y1, x2, y2) {
  return `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="#000" stroke-width="1.2" stroke-dasharray="4,3"/>`;
}

/** 小圓點（圓心） */
function dot(cx, cy, radius) {
  return `<circle cx="${r(cx)}" cy="${r(cy)}" r="${radius || 2.5}" fill="#000"/>`;
}

/** polygon helper */
function polygon(pts) {
  const d = pts.map(([x, y]) => `${r(x)},${r(y)}`).join(' ');
  return `<polygon points="${d}" fill="none" stroke="#000" stroke-width="1.5"/>`;
}

/** path helper */
function path(d) {
  return `<path d="${d}" fill="none" stroke="#000" stroke-width="1.5"/>`;
}

// ─── 1. 三角形 ────────────────────────────────────────────────────────────────

function svgTriangle({ base, height, unit = 'cm' }) {
  const sc = scale([base, height], MAX_DIM);
  const bPx = sc(base);
  const hPx = sc(height);

  // 三角形：底邊置中
  const margin = 10;
  const bottomY = SVG_H - 20;        // 底邊 Y
  const topY = bottomY - hPx;        // 頂點 Y
  const x0 = (SVG_W - bPx) / 2;     // 底邊左端 X
  const x1 = x0 + bPx;              // 底邊右端 X
  const xApex = SVG_W / 2;          // 頂點 X（等腰）

  // 高的垂足在底邊上
  const footX = xApex;
  const footY = bottomY;

  const tri = polygon([[x0, bottomY], [x1, bottomY], [xApex, topY]]);
  const heightLine = dline(footX, bottomY, footX, topY);

  // 直角符號（高與底交點）
  const sq = 5;
  const rightAngle =
    `<polyline points="${r(footX)},${r(footY - sq)} ${r(footX + sq)},${r(footY - sq)} ${r(footX + sq)},${r(footY)}" ` +
    `fill="none" stroke="#000" stroke-width="1.2"/>`;

  // 標示：底邊下方中央
  const lblBase = label(SVG_W / 2, bottomY + 13, `底 ${base} ${unit}`);
  // 標示：高的右側中央，避開三角形
  const lblH = label(footX + 14, (topY + bottomY) / 2, `高 ${height} ${unit}`, { anchor: 'start' });

  return svgWrap(tri + heightLine + rightAngle + lblBase + lblH);
}

// ─── 2. 平行四邊形 ────────────────────────────────────────────────────────────

function svgParallelogram({ base, height, unit = 'cm' }) {
  const sc = scale([base, height * 2], MAX_DIM);
  const bPx = sc(base);
  const hPx = sc(height);
  const slant = Math.min(hPx * 0.6, bPx * 0.35); // 傾斜偏移量

  // 四個頂點（左下→右下→右上→左上）
  const marginX = (SVG_W - bPx - slant) / 2;
  const bottomY = SVG_H - 20;
  const topY = bottomY - hPx;

  const A = [marginX + slant, topY];
  const B = [marginX + slant + bPx, topY];
  const C = [marginX + bPx, bottomY];
  const D = [marginX, bottomY];

  const para = polygon([A, B, C, D]);

  // 高：從 A 點垂直到底邊
  const footX = A[0];
  const footY = bottomY;
  const heightLine = dline(footX, topY, footX, footY);

  const sq = 5;
  const rightAngle =
    `<polyline points="${r(footX)},${r(footY - sq)} ${r(footX + sq)},${r(footY - sq)} ${r(footX + sq)},${r(footY)}" ` +
    `fill="none" stroke="#000" stroke-width="1.2"/>`;

  const lblBase = label(marginX + slant / 2 + bPx / 2, bottomY + 13, `底 ${base} ${unit}`);
  const lblH = label(footX + 13, (topY + bottomY) / 2, `高 ${height} ${unit}`, { anchor: 'start' });

  return svgWrap(para + heightLine + rightAngle + lblBase + lblH);
}

// ─── 3. 梯形 ──────────────────────────────────────────────────────────────────

function svgTrapezoid({ top, bottom, height, unit = 'cm' }) {
  const sc = scale([bottom, height * 2], MAX_DIM);
  const topPx = sc(top);
  const btmPx = sc(bottom);
  const hPx = sc(height);

  const bottomY = SVG_H - 20;
  const topY = bottomY - hPx;

  // 下底置中
  const btmX0 = (SVG_W - btmPx) / 2;
  const btmX1 = btmX0 + btmPx;
  // 上底置中
  const topX0 = (SVG_W - topPx) / 2;
  const topX1 = topX0 + topPx;

  const trap = polygon([[btmX0, bottomY], [btmX1, bottomY], [topX1, topY], [topX0, topY]]);

  // 高：從上底左端垂直到下底
  const footX = topX0;
  const heightLine = dline(footX, topY, footX, bottomY);

  const sq = 5;
  const rightAngle =
    `<polyline points="${r(footX)},${r(bottomY - sq)} ${r(footX + sq)},${r(bottomY - sq)} ${r(footX + sq)},${r(bottomY)}" ` +
    `fill="none" stroke="#000" stroke-width="1.2"/>`;

  const lblTop = label(SVG_W / 2, topY - 11, `上底 ${top} ${unit}`);
  const lblBtm = label(SVG_W / 2, bottomY + 13, `下底 ${bottom} ${unit}`);
  // 高標在虛線左側
  const lblH = label(footX - 4, (topY + bottomY) / 2, `高 ${height} ${unit}`, { anchor: 'end' });

  return svgWrap(trap + heightLine + rightAngle + lblTop + lblBtm + lblH);
}

// ─── 4. 長方形 ────────────────────────────────────────────────────────────────

function svgRectangle({ width, height, unit = 'cm' }) {
  const sc = scale([width, height], MAX_DIM);
  const wPx = sc(width);
  const hPx = sc(height);

  const x0 = (SVG_W - wPx) / 2;
  const y0 = (SVG_H - hPx) / 2;

  const rect =
    `<rect x="${r(x0)}" y="${r(y0)}" width="${r(wPx)}" height="${r(hPx)}" ` +
    `fill="none" stroke="#000" stroke-width="1.5"/>`;

  // 長（底邊下方）
  const lblW = label(SVG_W / 2, y0 + hPx + 13, `長 ${width} ${unit}`);
  // 寬（右側中央）
  const lblH = label(x0 + wPx + 13, SVG_H / 2, `寬 ${height} ${unit}`, { anchor: 'start' });

  return svgWrap(rect + lblW + lblH);
}

// ─── 5. 長方體（立體斜視圖） ─────────────────────────────────────────────────

function svgCuboid({ l, w, h, unit = 'cm' }) {
  const sc = scale([l, w, h], 70);
  const lPx = sc(l);   // 長（前面寬度）
  const wPx = sc(w);   // 寬（斜向深度）
  const hPx = sc(h);   // 高（垂直）

  // 斜視方向
  const ox = wPx * 0.55;  // 斜向 X 偏移
  const oy = wPx * 0.35;  // 斜向 Y 偏移（往上）

  // 前面左下角基準點
  const bx = (SVG_W - lPx - ox) / 2;
  const by = (SVG_H + hPx - oy) / 2;

  // 8個頂點
  // 前面：A(左下) B(右下) C(右上) D(左上)
  const A = [bx,       by];
  const B = [bx + lPx, by];
  const C = [bx + lPx, by - hPx];
  const D = [bx,       by - hPx];
  // 後面：E(左下) F(右下) G(右上) H(左上)
  const E = [A[0] + ox, A[1] - oy];
  const F = [B[0] + ox, B[1] - oy];
  const G = [C[0] + ox, C[1] - oy];
  const H = [D[0] + ox, D[1] - oy];

  const pt = ([x, y]) => `${r(x)},${r(y)}`;

  // 可見面
  const front =
    `<polygon points="${pt(A)} ${pt(B)} ${pt(C)} ${pt(D)}" fill="none" stroke="#000" stroke-width="1.5"/>`;
  const top =
    `<polygon points="${pt(D)} ${pt(C)} ${pt(G)} ${pt(H)}" fill="none" stroke="#000" stroke-width="1.5"/>`;
  const right =
    `<polygon points="${pt(B)} ${pt(F)} ${pt(G)} ${pt(C)}" fill="none" stroke="#000" stroke-width="1.5"/>`;

  // 隱藏線（後面左側+底部）虛線
  const hidden =
    dline(A[0], A[1], E[0], E[1]) +
    dline(E[0], E[1], F[0], F[1]) +
    dline(E[0], E[1], H[0], H[1]);

  // 標示：長在前底邊下方
  const midBot = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  const lblL = label(midBot[0], midBot[1] + 13, `長 ${l} ${unit}`);

  // 標示：寬在右底邊斜向右上
  const midRight = [(B[0] + F[0]) / 2, (B[1] + F[1]) / 2];
  const lblW = label(midRight[0] + 12, midRight[1] + 4, `寬 ${w} ${unit}`, { anchor: 'start' });

  // 標示：高在右側垂直線旁
  const midRightV = [(C[0] + B[0]) / 2, (C[1] + B[1]) / 2];
  const lblH = label(midRightV[0] + 11, midRightV[1], `高 ${h} ${unit}`, { anchor: 'start' });

  return svgWrap(front + top + right + hidden + lblL + lblW + lblH);
}

// ─── 6. 圓（標半徑） ─────────────────────────────────────────────────────────

function svgCircleR({ radius, unit = 'cm' }) {
  const r_px = Math.min(MAX_DIM / 2, 52);
  const cx = SVG_W / 2;
  const cy = SVG_H / 2 + 4;

  const circle =
    `<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(r_px)}" fill="none" stroke="#000" stroke-width="1.5"/>`;

  // 半徑線：圓心 → 右端（45度方向避開標字）
  const angle = -Math.PI / 5;  // 往右上
  const ex = cx + r_px * Math.cos(angle);
  const ey = cy + r_px * Math.sin(angle);

  const radiusLine = line(cx, cy, ex, ey);
  const centerDot = dot(cx, cy);

  // 標示在半徑線中段上方
  const mx = cx + (r_px / 2) * Math.cos(angle);
  const my = cy + (r_px / 2) * Math.sin(angle);
  const lblR = label(mx - 4, my - 10, `r = ${radius} ${unit}`);

  return svgWrap(circle + radiusLine + centerDot + lblR);
}

// ─── 7. 圓（標直徑） ─────────────────────────────────────────────────────────

function svgCircleD({ diameter, unit = 'cm' }) {
  const r_px = Math.min(MAX_DIM / 2, 52);
  const cx = SVG_W / 2;
  const cy = SVG_H / 2 + 4;

  const circle =
    `<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(r_px)}" fill="none" stroke="#000" stroke-width="1.5"/>`;

  // 直徑線（水平）
  const diamLine = line(cx - r_px, cy, cx + r_px, cy);

  // 兩端點
  const dotL = dot(cx - r_px, cy, 2);
  const dotR = dot(cx + r_px, cy, 2);
  const centerDot = dot(cx, cy, 2);

  // 標示在直徑線上方
  const lblD = label(cx, cy - 10, `d = ${diameter} ${unit}`);

  return svgWrap(circle + diamLine + dotL + dotR + centerDot + lblD);
}

// ─── 8. 圓柱 ─────────────────────────────────────────────────────────────────

function svgCylinder({ radius, height, unit = 'cm' }) {
  const sc = scale([radius * 2, height], MAX_DIM);
  const rPx = sc(radius);          // 橢圓 x 半軸
  const ePx = Math.max(rPx * 0.35, 8); // 橢圓 y 半軸
  const hPx = sc(height);

  const cx = SVG_W / 2;
  const topY = (SVG_H - hPx) / 2;
  const botY = topY + hPx;

  // 底部橢圓（完整）
  const ellipseBot =
    `<ellipse cx="${r(cx)}" cy="${r(botY)}" rx="${r(rPx)}" ry="${r(ePx)}" ` +
    `fill="none" stroke="#000" stroke-width="1.5"/>`;

  // 頂部橢圓（只畫上半弧，下半虛線）
  const ellipseTopSolid =
    `<path d="M ${r(cx - rPx)} ${r(topY)} A ${r(rPx)} ${r(ePx)} 0 0 1 ${r(cx + rPx)} ${r(topY)}" ` +
    `fill="none" stroke="#000" stroke-width="1.5"/>`;
  const ellipseTopDash =
    `<path d="M ${r(cx - rPx)} ${r(topY)} A ${r(rPx)} ${r(ePx)} 0 0 0 ${r(cx + rPx)} ${r(topY)}" ` +
    `fill="none" stroke="#000" stroke-width="1.2" stroke-dasharray="4,3"/>`;

  // 兩側垂直線
  const leftLine  = line(cx - rPx, topY, cx - rPx, botY);
  const rightLine = line(cx + rPx, topY, cx + rPx, botY);

  // 高虛線（右側外）
  const hLineX = cx + rPx + 16;
  const heightDline =
    dline(hLineX, topY, hLineX, botY) +
    line(cx + rPx, topY, hLineX, topY, 'stroke-dasharray="2,2"') +
    line(cx + rPx, botY, hLineX, botY, 'stroke-dasharray="2,2"');
  const lblH = label(hLineX + 10, (topY + botY) / 2, `高 ${height} ${unit}`, { anchor: 'start' });

  // 半徑線（頂部橢圓中心 → 右端）
  const radiusLine = line(cx, topY, cx + rPx, topY);
  const centerDot = dot(cx, topY, 2);
  const lblR = label(cx + rPx / 2, topY - 10, `r = ${radius} ${unit}`);

  return svgWrap(
    ellipseBot + ellipseTopSolid + ellipseTopDash +
    leftLine + rightLine +
    heightDline + lblH +
    radiusLine + centerDot + lblR
  );
}

// ─── 9. 線對稱圖形 ───────────────────────────────────────────────────────────

function svgSymmetry() {
  const W = SVG_W;
  const H = SVG_H;

  // 淡格線（5px 間距）
  let grid = '';
  const gridStep = 10;
  const gridColor = '#ddd';
  for (let x = 0; x <= W; x += gridStep) {
    grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${gridColor}" stroke-width="0.5"/>`;
  }
  for (let y = 0; y <= H; y += gridStep) {
    grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${gridColor}" stroke-width="0.5"/>`;
  }

  // 對稱軸：垂直置中虛線
  const axisX = W / 2;
  const axis =
    `<line x1="${axisX}" y1="8" x2="${axisX}" y2="${H - 8}" ` +
    `stroke="#000" stroke-width="1.5" stroke-dasharray="6,4"/>`;

  // 不對稱圖形（L 型 / 旗形），左半部
  // 設計：一個「旗子」形狀，左右不對稱
  const shape =
    // 左半邊：從軸往左的 L 型
    `<polyline points="` +
    `${axisX - 10},30 ` +   // 頂端靠軸
    `${axisX - 50},30 ` +   // 頂端左延伸
    `${axisX - 50},55 ` +   // 往下
    `${axisX - 30},55 ` +   // 右折
    `${axisX - 30},75 ` +   // 往下
    `${axisX - 10},75 ` +   // 右折
    `${axisX - 10},30` +    // 回到頂端
    `" fill="#f5f5f5" stroke="#000" stroke-width="1.5"/>` +
    // 右半邊（鏡像）
    `<polyline points="` +
    `${axisX + 10},30 ` +
    `${axisX + 50},30 ` +
    `${axisX + 50},55 ` +
    `${axisX + 30},55 ` +
    `${axisX + 30},75 ` +
    `${axisX + 10},75 ` +
    `${axisX + 10},30` +
    `" fill="#f5f5f5" stroke="#000" stroke-width="1.5"/>`;

  // 對稱軸標示
  const lblAxis = label(axisX, H - 4, '對稱軸', { fontSize: 10 });

  return svgWrap(grid + shape + axis + lblAxis);
}

// ─── 匯出 ─────────────────────────────────────────────────────────────────────

const GEO = {
  svgTriangle,
  svgParallelogram,
  svgTrapezoid,
  svgRectangle,
  svgCuboid,
  svgCircleR,
  svgCircleD,
  svgCylinder,
  svgSymmetry,
};

if (typeof window !== 'undefined') {
  window.GEO = GEO;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GEO;
}

/*
 * ═══════════════════════════════════════════════════════════════════
 * 呼叫範例與預期輸出尺寸（每個 SVG 皆為 width=140 height=120）
 * ═══════════════════════════════════════════════════════════════════
 *
 * 1. 三角形
 *    GEO.svgTriangle({ base: 6, height: 4, unit: 'cm' })
 *    → <svg width="140" height="120" ...>
 *        三角形底邊標「底 6 cm」，高度虛線標「高 4 cm」
 *      </svg>
 *
 * 2. 平行四邊形
 *    GEO.svgParallelogram({ base: 8, height: 5, unit: 'cm' })
 *    → 底邊標「底 8 cm」，垂直虛線標「高 5 cm」
 *
 * 3. 梯形
 *    GEO.svgTrapezoid({ top: 4, bottom: 8, height: 5, unit: 'cm' })
 *    → 上底「上底 4 cm」，下底「下底 8 cm」，高「高 5 cm」
 *
 * 4. 長方形
 *    GEO.svgRectangle({ width: 10, height: 6, unit: 'cm' })
 *    → 底邊「長 10 cm」，右側「寬 6 cm」
 *
 * 5. 長方體
 *    GEO.svgCuboid({ l: 8, w: 4, h: 5, unit: 'cm' })
 *    → 斜視立體圖，標「長 8 cm」「寬 4 cm」「高 5 cm」
 *
 * 6. 圓（半徑）
 *    GEO.svgCircleR({ radius: 5, unit: 'cm' })
 *    → 圓 + 半徑線，標「r = 5 cm」，圓心點
 *
 * 7. 圓（直徑）
 *    GEO.svgCircleD({ diameter: 10, unit: 'cm' })
 *    → 圓 + 水平直徑線，標「d = 10 cm」
 *
 * 8. 圓柱
 *    GEO.svgCylinder({ radius: 3, height: 8, unit: 'cm' })
 *    → 圓柱側視圖，頂面橢圓標「r = 3 cm」，右側標「高 8 cm」
 *
 * 9. 線對稱
 *    GEO.svgSymmetry()
 *    → 淡格線底 + 對稱圖形 + 中央垂直對稱軸（虛線）+ 標「對稱軸」
 *
 * ═══════════════════════════════════════════════════════════════════
 */
