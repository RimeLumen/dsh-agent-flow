// 临时补丁：usePlan 单例轮询改造（双份轮询/交替 setState 闪烁修复）。验证后删除。
import { readFileSync, writeFileSync } from 'node:fs'

const p = 'src/client/05-engine.js'
const s = readFileSync(p, 'utf8')
const start = s.indexOf('    function usePlan(sessionId) {')
const endMark = '      return plan\n    }'
const end = s.indexOf(endMark, start) + endMark.length
if (start < 0 || end <= start) throw new Error('usePlan 边界未找到')

const now = `    // R6 渲染稳定性：usePlan 单例轮询——此前注入面板与画布各挂一条轮询（同屏双份流量、
    // 两份 setState 交替触发重渲染，多节点全屏时表现为闪烁）。改为模块级共享轮询 +
    // 订阅者广播：同 sessionId 只跑一条定时器，数据变更时通知全部订阅者。
    const planHub = { sessions: new Map() } // sessionId -> { plan, version, subscribers, timer, failures }
    function usePlan(sessionId) {
      const [plan, setPlan] = useState({ status: 'idle' })
      useEffect(() => {
        if (!sessionId) {
          setPlan({ status: 'idle' })
          return undefined
        }
        let entry = planHub.sessions.get(sessionId)
        const subscriber = (next) => setPlan((prev) => (samePlan(prev, next) ? prev : next))
        if (!entry) {
          entry = { plan: { status: 'idle' }, version: '', subscribers: new Set([subscriber]), timer: null, failures: 0 }
          planHub.sessions.set(sessionId, entry)
          const schedule = (ms) => { if (entry.timer) clearTimeout(entry.timer); entry.timer = setTimeout(tick, ms) }
          const tick = async () => {
            let base = 4000
            if (typeof document !== 'undefined' && document.hidden) { schedule(POLL_MAX); return }
            try {
              const sinceParam = entry.version !== '' ? \`&since=\${encodeURIComponent(entry.version)}\` : ''
              const result = await request('GET', \`/plan?sessionId=\${encodeURIComponent(sessionId)}\${sinceParam}\`)
              if (result?.same === true) { entry.failures = 0; schedule(4000); return }
              entry.version = result?.plan?.updatedAt ?? ''
              entry.plan = result?.plan ?? { status: 'idle' }
              base = entry.plan.status === 'awaiting' ? 1500 : 4000
              entry.failures = 0
              for (const notify of entry.subscribers) notify(entry.plan)
            } catch {
              entry.failures += 1
            }
            schedule(pollDelay(base, entry.failures))
          }
          void tick()
        } else {
          entry.subscribers.add(subscriber)
          subscriber(entry.plan) // 新订阅者立即对齐当前快照
        }
        return () => {
          entry.subscribers.delete(subscriber)
          if (entry.subscribers.size === 0) {
            planHub.sessions.delete(sessionId)
            if (entry.timer) clearTimeout(entry.timer)
          }
        }
      }, [sessionId])
      return plan
    }`

// 注：planHub 声明在 usePlan 内部会导致每次调用新建 Hub——需提升到 usePlan 之外（模块/分片作用域）。
// 修正：把 planHub 移到函数外。
const fixed = now.replace('    const planHub = { sessions: new Map() } // sessionId -> { plan, version, subscribers, timer, failures }\n    function usePlan', '    function usePlan')
const hubDecl = '    // R6 渲染稳定性：usePlan 单例轮询\n    const planHub = { sessions: new Map() }\n'
writeFileSync(p, s.slice(0, start) + hubDecl + fixed + s.slice(end), 'utf8')
console.log('usePlan singleton patched; removed', end - start, 'chars block')
