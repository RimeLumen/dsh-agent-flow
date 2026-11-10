#!/usr/bin/env node
/*! dsh-agent-flow | Copyright (c) 2026 RimeLumen | MIT License */
/**
 * client.js 分片切割 / 拼接（零依赖）。
 *
 * 用法：
 *   node scripts/client-shards.mjs split    —— 按 SHARDS 边界把 src/client.js 切成 src/client/ 分片
 *   node scripts/client-shards.mjs build    —— 拼接分片 → src/client.js（剥离标记行）
 *   node scripts/client-shards.mjs check    —— 拼接产物与 git 基准逐字节比对（等价性验证）
 *
 * 等价性设计：切割用**保留换行的行数组**（每行自带完整行尾），分片=行切片直接相连，
 * 拼接=剥首行标记后相连——不补、不剥任何换行，产物与原单文件天然逐字节一致。
 * 换行风格（工作树 CRLF / 仓库 LF）由 git 归一化决定，不属于代码内容。
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const single = join(root, 'src', 'client.js')
const shardDir = join(root, 'src', 'client')

/** 分片边界（1-based 行号，含）。切割模式使用；新增分片在此登记。 */
const SHARDS = [
  ['01-shim', 1, 13],
  ['02-dict', 14, 473],
  ['03-api', 474, 684],
  ['04-css', 685, 1324],
  ['05-engine', 1325, 2089],
  ['06-shell', 2090, 2395],
  ['07-panels', 2396, 3495],
  ['08-canvas', 3496, 5641],
  ['09-entry', 5642, 0],
]

const MARKER_RE = /^\/\* @client-shard: ([a-z0-9-]+) \*\/\r?\n/

function mode() {
  return process.argv[2] ?? 'build'
}

/** 保留换行的行切割：每行自带完整行尾（CRLF 或 LF），join('') 精确还原。 */
const splitKeepEol = (text) => text.split(/(?<=\n)/)

function split() {
  // 归一化行尾与文件尾：工作树存在历史补丁留下的 CR-only 行（8 处）与尾部双换行，
  // 统一为「LF 行尾 + 单换行结尾」后再切分——顺带治愈污染；HEAD 基准本来就是干净 LF。
  const src = readFileSync(single, 'utf8').replace(/\r\n?/g, '\n').replace(/\n+$/, '\n')
  const lines = splitKeepEol(src)
  mkdirSync(shardDir, { recursive: true })
  let ok = true
  for (const [name, from, toRaw] of SHARDS) {
    const to = toRaw === 0 ? lines.length : toRaw
    if (from > lines.length || to > lines.length || from > to) {
      console.error(`  分片 ${name} 边界越界（${from}..${to}，共 ${lines.length} 行）——文件行数变了，先更新 SHARDS 表`)
      ok = false
      continue
    }
    const body = lines.slice(from - 1, to).join('')
    writeFileSync(join(shardDir, `${name}.js`), `/* @client-shard: ${name} */\n${body}`)
    console.log(`  ${name}.js  <- 行 ${from}..${to}（${to - from + 1} 行）`)
  }
  if (!ok) process.exit(1)
  console.log('切割完成（纯切割，未改任何代码行）')
}

function build() {
  if (!existsSync(shardDir)) { console.error('分片目录不存在，先执行 split'); process.exit(1) }
  const parts = []
  const seen = new Set()
  for (const [name] of SHARDS) {
    const file = join(shardDir, `${name}.js`)
    if (!existsSync(file)) { console.error(`缺分片 ${name}.js`); process.exit(1) }
    if (seen.has(name)) { console.error(`分片重名 ${name}`); process.exit(1) }
    seen.add(name)
    parts.push(readFileSync(file, 'utf8').replace(MARKER_RE, ''))
  }
  writeFileSync(single, parts.join(''))
  console.log('拼接完成 -> src/client.js')
}

function baselineHash() {
  try {
    return execFileSync('git', ['-C', root, 'rev-parse', 'HEAD:src/client.js'], { encoding: 'utf8' }).trim()
  } catch {
    return null
  }
}

function check() {
  build()
  const current = readFileSync(single, 'utf8')
  // 换行风格不属于代码内容（工作树 CRLF / 仓库 LF 由 git 归一化决定），
  // 等价性比较双方都归一化到 LF——比较的是逻辑内容。
  const normalize = (text) => text.replace(/\r\n/g, '\n')
  const blob = execFileSync('git', ['-C', root, 'hash-object', '--stdin'], { input: normalize(current), encoding: 'utf8' }).trim()
  const baseline = baselineHash()
  if (!baseline) { console.log('无 git 基准可比对（首次提交前）'); return }
  if (blob === baseline) {
    console.log(`等价性验证通过：拼接产物（LF 归一后）blob ${blob.slice(0, 12)} 与 git 基准一致`)
  } else {
    console.error(`等价性验证失败：产物 ${blob.slice(0, 12)} 与基准 ${baseline.slice(0, 12)} 不一致 —— 分片内容与基准单文件有差异，禁止提交`)
    process.exit(1)
  }
}

const run = mode()
if (run === 'split') split()
else if (run === 'build') build()
else if (run === 'check') check()
else { console.error('用法：split | build | check'); process.exit(1) }
