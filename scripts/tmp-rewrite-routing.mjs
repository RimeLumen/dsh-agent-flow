// 临时重构：routing 段改从 src/client/05-engine.js 源文件提取（client.js 拼接提取的锚点漂移已致两次提取失败）。验证后删除。
import { readFileSync, writeFileSync } from 'node:fs'

const p = 'scripts/selfcheck.mjs'
const lines = readFileSync(p, 'utf8').split('\n')
const secStart = lines.findIndex((l) => l.includes("── 5. 正交路由引擎"))
const secEnd = lines.findIndex((l) => l.includes('── 5b. 锚点吸附'))
if (secStart < 0 || secEnd < 0) throw new Error('段边界未找到: ' + secStart + ',' + secEnd)

const replacement = `// ── 5. 正交路由引擎（从 src/client/05-engine.js 源文件提取真实实现）──
{
  const section = 'routing'
  const engineLines = readFileSync(join(root, 'src', 'client', '05-engine.js'), 'utf8').split('\\n')
  const keyStart = engineLines.findIndex((l) => l.includes('const keyOf = (p) =>'))
  const epStart = engineLines.findIndex((l) => l.includes('function edgePath'))
  let epEnd = -1
  let depth = 0
  for (let i = epStart; i < engineLines.length; i += 1) {
    for (const ch of engineLines[i]) {
      if (ch === '{') depth += 1
      else if (ch === '}') { depth -= 1; if (depth === 0) { epEnd = i; break } }
    }
    if (epEnd >= 0) break
  }
  if (keyStart < 0 || epStart < 0 || epEnd < 0) {
    check(section, '路由引擎可从 05-engine 提取', false)
  } else {
    const code = engineLines.slice(keyStart, epEnd + 1).join('\\n')
    const EDGE_SIDES = ['top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left', 'top-left']
    const fn = new Function('EDGE_SIDES', code + '\\nreturn { edgePath, orthogonalRoute, segmentHitsRect, createSpatialGrid }')
    const { edgePath, orthogonalRoute, segmentHitsRect, createSpatialGrid } = fn(EDGE_SIDES)

    const fromRect = { x: 0, y: 0, w: 220, h: 96 }
    const toRect = { x: 500, y: 0, w: 220, h: 96 }
    const blocker = { x: 250, y: -20, w: 160, h: 140 }
    const a = { x: 110, y: 48 }, b = { x: 610, y: 48 }
    const bbox = { minX: 110, maxX: 610, minY: 48, maxY: 48 }

    const g1 = createSpatialGrid(160)
    g1.insert(fromRect, { id: 'A', rect: fromRect })
    g1.insert(toRect, { id: 'B', rect: toRect })
    check(section, '空旷图判无阻挡（走快路径）', g1.query(bbox).length === 0)

    const g2 = createSpatialGrid(160)
    g2.insert(fromRect, { id: 'A', rect: fromRect })
    g2.insert(toRect, { id: 'B', rect: toRect })
    g2.insert(blocker, { id: 'C', rect: blocker })
    check(section, '被挡边精确前筛找到阻挡者', g2.query(bbox).some((it) => it.id !== 'A' && it.id !== 'B' && segmentHitsRect(a, b, it.rect, 0)) === true)
    check(section, '网格 all() 条目数正确', g2.all().length === 3)

    const full = g2.all().filter((it) => it.id !== 'A' && it.id !== 'B').map((it) => it.rect)
    const route = orthogonalRoute(fromRect, toRect, 'right', 'left', full, { clearance: 10 })
    check(section, '被挡边产出绕行折线', Array.isArray(route) && route.length >= 3)
    let crosses = false
    if (route) for (let i = 1; i < route.length; i += 1) if (segmentHitsRect(route[i - 1], route[i], blocker, 0)) crosses = true
    check(section, '绕行不穿障碍', crosses === false)
    check(section, '垂直方向路由可用', Array.isArray(orthogonalRoute({ x: 0, y: 0, w: 220, h: 96 }, { x: 40, y: 400, w: 220, h: 96 }, 'bottom', 'top', [], { clear: 10, clearance: 10 })))
    // R6 碰撞箱（用户指令）：24 障碍大图被挡边必须产出不穿模路径（走廊折线或外推曲线，绝不回退直穿）
    {
      const bigObstacles = []
      for (let i = 0; i < 12; i += 1) bigObstacles.push({ x: 100 + i * 60, y: 200, w: 50, h: 50 })
      for (let i = 0; i < 12; i += 1) bigObstacles.push({ x: 130 + i * 60, y: 420, w: 50, h: 50 })
      const bigGrid = createSpatialGrid(320)
      for (const r of bigObstacles) bigGrid.insert(r, { id: 'ob', rect: r })
      const bigPath = edgePath({ x: 0, y: 210, w: 80, h: 60 }, { x: 900, y: 210, w: 80, h: 60 }, { id: 'eBig', fromSide: 'right', toSide: 'left' }, bigGrid, 0, 0)
      check(section, '24 障碍被挡边不产穿模直线', !(bigPath.includes('L ') && !bigPath.includes('C ')))
      let bigHit = false
      if (bigPath.includes('C ')) {
        const nums = bigPath.match(/-?[\\d.]+/g).map(Number)
        const p0 = { x: nums[0], y: nums[1] }
        const c1 = { x: nums[2], y: nums[3] }
        const c2 = { x: nums[4], y: nums[5] }
        const p1 = { x: nums[6], y: nums[7] }
        for (let t = 0; t <= 1.001; t += 1 / 40) {
          const x = (1 - t) ** 3 * p0.x + 3 * (1 - t) ** 2 * t * c1.x + 3 * (1 - t) * t ** 2 * c2.x + t ** 3 * p1.x
          const y = (1 - t) ** 3 * p0.y + 3 * (1 - t) ** 2 * t * c1.y + 3 * (1 - t) * t ** 2 * c2.y + t ** 3 * p1.y
          for (const r of bigObstacles) if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) bigHit = true
        }
      }
      check(section, '外推曲线采样无穿模', bigHit === false)
    }
    // routeCache 断言（client.js 拼接产物，R2.3 结构签名）
    const clientText = readFileSync(join(root, 'src', 'client.js'), 'utf8')
    check(section, '路由缓存声明存在', clientText.includes('const routeCacheRef = useRef'))
    check(section, '路由缓存声明在使用之前（同作用域）', clientText.indexOf('const routeCacheRef') < clientText.indexOf('routeCache.get(key)'))
    check(section, '路由缓存按结构签名失效（R2.3）', clientText.includes('const routeKey = (edge, fromRect, toRect, oA, oB)') && !clientText.includes('routeCacheRef.current?.for'))
  }
}
`
lines.splice(secStart, secEnd - secStart, replacement.split('\n'))
writeFileSync(p, lines.join('\n'), 'utf8')
console.log('routing 段重写完成')
