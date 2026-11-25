// 临时脚本：撤销数组内错误插入 + 在 flowDockView 段后正确定义 drawerViews。验证后删除。
import { readFileSync, writeFileSync } from 'node:fs'

const p = 'src/client/08-canvas.js'
const lines = readFileSync(p, 'utf8').split('\n')

// 1) 定位并删除数组内的错误插入（从 "// R6 图层修复（用户指令）：抽屉移出" 行到其后的 "]" 行）
const badStart = lines.findIndex((l) => l.includes('R6 图层修复（用户指令）：抽屉移出'))
if (badStart < 0) throw new Error('未找到错误插入块')
let badEnd = -1
for (let i = badStart; i < badStart + 40; i += 1) {
  if (lines[i].trim() === ']') { badEnd = i; break }
}
if (badEnd < 0) throw new Error('插入块闭合未找到')
const removed = lines.splice(badStart, badEnd - badStart + 1)
console.log('错误插入块已移除（', removed.length, '行）')

// 2) 在 flowDockView 定义段（const flowDockView = flowDock ... })  之后正确定义
const fdStart = lines.findIndex((l) => l.includes('const flowDockView = flowDock'))
if (fdStart < 0) throw new Error('flowDockView 定义未找到')
let fdEnd = -1
let depth = 0
for (let i = fdStart; i < lines.length; i += 1) {
  for (const ch of lines[i]) {
    if (ch === '(') depth += 1
    else if (ch === ')') depth -= 1
  }
  // flowDockView = flowDock ? h(RightDrawer, {...}, h(FlowManager, {...})) : null——以行尾 ': null' 或括号归零判定
  if (depth === 0 && lines[i].trim().endsWith(': null')) { fdEnd = i; break }
}
if (fdEnd < 0) throw new Error('flowDockView 闭合未找到')

// 3) 从临时块文件恢复 JSX 内容并定义为数组
const block = readFileSync('scripts/tmp-drawer-block.txt', 'utf8').split('\n')
const insert = [
  '',
  '            // R6 图层修复（用户指令）：Mermaid 导入 / 组合提示词抽屉从 daf-toolbar（absolute z-20 层叠上下文）',
  '            // 移到 canvas-root 直下渲染——fixed 全屏抽屉不再被 toolbar 劫持（真机：抽屉被画布盖住且高度塌陷）',
  '            const drawerViews = [',
  ...block.map((l) => (l.trim() ? '            ' + l.trim() : l)),
  '            ]',
]
lines.splice(fdEnd + 1, 0, ...insert)
writeFileSync(p, lines.join('\n'), 'utf8')
console.log('drawerViews 正确定义 @ 行', fdEnd + 2)
