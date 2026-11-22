/*! dsh-agent-flow v0.1.0 | Copyright (c) 2026 RimeLumen | MIT License */
/**
 * 宿主侧文本度量。
 *
 * 该实现的关键设计是「两半必须成对使用」：
 *   - 渲染时把字号收缩到可读下限（客户端 fittedFontSize 已实现）；
 *   - 校验时用 minimumNodeTextWidth 拒绝"收缩也救不了"的输入。
 * 只用前一半会导致超长文本静默溢出/被截，而校验仍报干净——本项目此前正是这个状态。
 *
 * 口径与客户端完全一致：全角字符 2 个单位、其余 1 个单位（emoji 2、变体选择符跳过），
 * 每单位每字号占 0.6px 宽，左右内边距合计 8px。
 *
 * 注意：客户端为单文件、无构建步骤（ADR 0001），无法 import 本模块，
 * 因此同一套常量在两边各有一份实现；改动时**必须两处同步**。
 */

export const TEXT_FIT = Object.freeze({ widthFactor: 0.6, horizontalPadding: 8 })

/** 节点标题的最小可读字号（低于此值不再收缩，应判为必须修复）。 */
export const MIN_TITLE_FONT = 9

/** 节点几何（与客户端 NODE_WIDTH / NODE_HEIGHT 同步）。 */
export const NODE_WIDTH = 220
export const NODE_HEIGHT = 96

/** 标题可用宽度：节点宽减去内边距与左侧状态/图标位。 */
export const TITLE_AVAILABLE_WIDTH = NODE_WIDTH - 44

const FULLWIDTH_RE = /[\u1100-\u115F\u2E80-\u303E\u3041-\u33FF\u3400-\u4DBF\u4E00-\u9FFF\uA000-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE6F\uFF00-\uFF60\uFFE0-\uFFE6]/

export function textUnits(text) {
  let units = 0
  for (const ch of String(text ?? '')) {
    const cp = ch.codePointAt(0)
    if (cp >= 0xfe00 && cp <= 0xfe0f) continue
    units += FULLWIDTH_RE.test(ch) ? 2 : 1
  }
  return units
}

/** 文本收缩到可读下限时仍需的宽度——超过可用宽度就说明收缩也救不了。 */
export function minimumNodeTextWidth(text, minimum = MIN_TITLE_FONT) {
  return textUnits(text) * minimum * TEXT_FIT.widthFactor
}

/** 在可用宽度内能用的最大字号（与客户端 fittedFontSize 同算法）。 */
export function fittedFontSize(text, width, preferred, minimum = MIN_TITLE_FONT) {
  const units = Math.max(1, textUnits(text))
  const available = Math.max(1, width - TEXT_FIT.horizontalPadding)
  const fitted = Math.min(preferred, available / (units * TEXT_FIT.widthFactor))
  return Math.max(minimum, Math.floor(fitted * 10) / 10)
}
