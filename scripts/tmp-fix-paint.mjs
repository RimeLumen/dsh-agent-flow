// 临时修复：paint() 双份注入清理 + 单份重写（bounds 先于使用，surfaceEl 命名）。验证后删除。
import { readFileSync, writeFileSync } from 'node:fs'

const p = 'src/client/08-canvas.js'
const lines = readFileSync(p, 'utf8').split('\n')
const paintIdx = lines.findIndex((l) => l.includes('const paint = () => {'))
if (paintIdx < 0) throw new Error('paint 未找到')

// 定位 paint 体内：
// - 两份注入块的起止（第一份：R6 注释行起；第二份：同款注释行止）
// - 原有 `const bounds = contentBounds()` 行
const commentIdxs = []
for (let i = paintIdx; i < paintIdx + 30; i += 1) {
  if (lines[i].includes('R6 渲染稳定性：surface 尺寸随内容动态扩展')) commentIdxs.push(i)
}
if (commentIdxs.length !== 2) throw new Error('期望两份注入注释，实际 ' + commentIdxs.length)
const firstBlockStart = commentIdxs[0] - 0 // 第一份从注释行起
const secondBlockEnd = commentIdxs[1]
// 第二份块结束 = secondBlockEnd 后第 8 行（注释2+声明1+if1+4行操作+}）→ 精确定位：从 commentIdxs[1] 找到配平的 '          }' 行
let block2End = -1
for (let i = commentIdxs[1]; i < commentIdxs[1] + 12; i += 1) {
  if (lines[i].trim() === '}') { block2End = i; break }
}
if (block2End < 0) throw new Error('第二份块闭合未找到')
const boundsIdx = lines.findIndex((l, i) => i > paintIdx && l.includes('const bounds = contentBounds()'))
if (boundsIdx < 0) throw new Error('原 bounds 声明未找到')
// 清理区间：第一份注释行起，到第二份块闭合行止（含）——全部删掉
const del = block2End - firstBlockStart + 1
lines.splice(firstBlockStart, del)
// 重新定位 bounds 声明（删除后位移）
const bIdx = lines.findIndex((l, i) => i > paintIdx && l.includes('const bounds = contentBounds()'))
// 单份重写：插在 bounds 声明之后
lines.splice(bIdx + 1, 0,
  '          // R6 渲染稳定性：surface 尺寸随内容动态扩展（默认 2400×1600 起，节点超出时跟随',
  '          // contentBounds——此前固定尺寸导致全屏/大图时连线被裁剪丢失）',
  '          const surfaceEl = surfaceInnerRef.current',
  '          if (surfaceEl) {',
  '            const w = Math.max(2400, Math.ceil((bounds.x + bounds.w + 200) * zoom))',
  '            const h = Math.max(1600, Math.ceil((bounds.y + bounds.h + 200) * zoom))',
  "            if (surfaceEl.style.width !== w + 'px') surfaceEl.style.width = w + 'px'",
  "            if (surfaceEl.style.height !== h + 'px') surfaceEl.style.height = h + 'px'",
  '          }')
writeFileSync(p, lines.join('\n'), 'utf8')
console.log('paint 清理并重写完成（删除', del, '行）')
