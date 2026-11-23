// 碰撞箱行为验证（持久）：24 障碍大图被挡边必须产出不穿模路径（折线或外推曲线）。
// 从 client.js 提取路由引擎（edgePath 嵌套在工厂内，闭包内 return）并跑大图场景。
// 由 selfcheck 的 collision 段 spawnSync 调用；退出码 0 = 通过。
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../src/client/05-engine.js', import.meta.url), 'utf8').split('\n')
const start = src.findIndex((l) => l.includes('const keyOf = (p) =>'))
const epStart = src.findIndex((l) => l.includes('function edgePath'))
if (start < 0 || epStart < 0) { console.error('路由引擎提取失败'); process.exit(1) }
let depth = 0
let end = -1
for (let i = epStart; i < src.length; i += 1) {
  for (const ch of src[i]) {
    if (ch === '{') depth += 1
    else if (ch === '}') { depth -= 1; if (depth === 0 && i > epStart) { end = i; break } }
  }
  if (end >= 0) break
}
const code = src.slice(start, end + 1).join('\n')
const fn = new Function('EDGE_SIDES', code + '\nreturn edgePath')
const edgePath = fn(['top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left', 'top-left'])
if (typeof edgePath !== 'function') { console.error('edgePath 提取失败（嵌套作用域）'); process.exit(1) }

// 24 障碍大图：两排交错障碍，a→b 水平线穿过第一排
const obstacles = []
for (let i = 0; i < 12; i += 1) obstacles.push({ x: 100 + i * 60, y: 200, w: 50, h: 50 })
for (let i = 0; i < 12; i += 1) obstacles.push({ x: 130 + i * 60, y: 420, w: 50, h: 50 })
const fromRect = { x: 0, y: 210, w: 80, h: 60 }
const toRect = { x: 900, y: 210, w: 80, h: 60 }
// 重建调用侧空间网格（与 edgePath 真实入参一致）
const gridFactory = new Function(code + '\nreturn createSpatialGrid')
const createSpatialGrid = gridFactory()
const grid = createSpatialGrid(320)
for (const r of obstacles) grid.insert({ x: r.x, y: r.y, w: r.w, h: r.h }, { id: 'ob', rect: r })
const d = edgePath(fromRect, toRect, { id: 'eBig', fromSide: 'right', toSide: 'left' }, grid, 0, 0)

let hit = false
if (d.includes('C ')) {
  // 外推曲线：60 点采样不得落进任何障碍矩形
  const nums = d.match(/-?[\d.]+/g).map(Number)
  const p0 = { x: nums[0], y: nums[1] }
  const c1 = { x: nums[2], y: nums[3] }
  const c2 = { x: nums[4], y: nums[5] }
  const p1 = { x: nums[6], y: nums[7] }
  for (let t = 0; t <= 1.001; t += 1 / 60) {
    const x = (1 - t) ** 3 * p0.x + 3 * (1 - t) ** 2 * t * c1.x + 3 * (1 - t) * t ** 2 * c2.x + t ** 3 * p1.x
    const y = (1 - t) ** 3 * p0.y + 3 * (1 - t) ** 2 * t * c1.y + 3 * (1 - t) * t ** 2 * c2.y + t ** 3 * p1.y
    for (const r of obstacles) if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) hit = true
  }
  console.log(`路径类型: 外推曲线 | 穿模采样: ${hit ? 'FAIL 有穿模点' : '无穿模 ✓'}`)
} else if (d.includes('L ')) {
  // 折线：逐段与障碍矩形相交检查
  const coords = d.replace(/^M\s*/, '').split('L').map((seg) => seg.trim().split(/[\s,]+/).map(Number))
  const pts = [{ x: coords[0][0], y: coords[0][1] }, ...coords.slice(1).map((c) => ({ x: c[0], y: c[1] }))]
  for (let i = 1; i < pts.length; i += 1) {
    const A = pts[i - 1]
    const B = pts[i]
    for (const r of obstacles) {
      const steps = 24
      for (let s = 0; s <= steps; s += 1) {
        const x = A.x + ((B.x - A.x) * s) / steps
        const y = A.y + ((B.y - A.y) * s) / steps
        if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) hit = true
      }
    }
  }
  console.log(`路径类型: 折线 | 穿模采样: ${hit ? 'FAIL 有穿模点' : '无穿模 ✓'}`)
} else {
  console.log('路径类型: 直线（穿模——修复失败）')
  hit = true
}
process.exit(hit ? 1 : 0)
