import { useState, useRef, useEffect, useMemo } from 'react'
import {
  PiDownloadSimpleBold, PiUploadSimpleBold,
  PiArrowCounterClockwiseBold, PiCodeBold,
  PiSpeakerHighBold, PiSpeakerSlashBold,
  PiPencilSimpleBold, PiCheckBold,
  PiChartLineUpBold, PiTrendUpBold, PiTrendDownBold, PiMinusBold,
  PiStorefrontBold, PiInfoBold, PiPaletteBold,
  PiChartBarBold, PiMedalBold, PiBriefcaseBold, PiCaretDownBold, PiRocketLaunchBold,
  PiStarBold, PiCheckCircleBold,
  PiCalendarBold, PiLockSimpleBold,
} from 'react-icons/pi'
import { useApp }      from '../context/AppContext'
import { useHabits }   from '../hooks/useHabits'
import { useStats }    from '../hooks/useStats'
import { calcLevel }   from '../services/levels'
import { loadStorage, saveStorage } from '../services/storage'
import { THEMES, applyTheme } from '../services/themes'
import { LegalModal, useLegal } from '../components/LegalModal'
import { AITeaser }       from '../components/AITeaser'
import { toast }     from '../components/Toast'
import styles        from './Profile.module.css'

// ══════════════════════════════════════
// HELPERS
// ══════════════════════════════════════

// ══════════════════════════════════════
// TOGGLE
// ══════════════════════════════════════
function Toggle({ on, onToggle, label }) {
  return (
    <div
      className={`${styles.toggleTrack} ${on ? styles.toggleOn : ''}`}
      onClick={onToggle}
      role="switch" aria-checked={on} aria-label={label}
      tabIndex={0} onKeyDown={e => e.key === 'Enter' && onToggle()}
    >
      <div className={`${styles.toggleThumb} ${on ? styles.thumbOn : ''}`} />
    </div>
  )
}

// ══════════════════════════════════════
// AVATAR helpers
// ══════════════════════════════════════
const BASE_AVATARS    = ['🧑','👩','👨','🧒','👴','👵','🦸','🧙','🚀','🌟','🔥','⚡']
const SHOP_AVATAR_MAP = { avatar_eagle:'🦅', avatar_monk:'🧘', avatar_lightning:'⚡', avatar_cosmos:'🪐' }

function getAvailableAvatars() {
  try {
    const owned = new Set(JSON.parse(localStorage.getItem('nex_shop_owned') || '[]'))
    const extra = Object.entries(SHOP_AVATAR_MAP).filter(([id]) => owned.has(id)).map(([,e]) => e)
    return [...new Set([...BASE_AVATARS, ...extra])]
  } catch { return BASE_AVATARS }
}

// ══════════════════════════════════════
// HERO CARD
// ══════════════════════════════════════
function HeroCard({ allPoints, streak, daysActive }) {
  const level = calcLevel(allPoints)
  const [userName,   setUserName]   = useState(() => loadStorage('nex_username', 'Usuário ../root'))
  const [userAvatar, setUserAvatar] = useState(() => loadStorage('nex_avatar', '🧑'))
  const [editing,    setEditing]    = useState(false)
  const [tempName,   setTempName]   = useState(userName)
  const [showPicker, setShowPicker] = useState(false)
  const [avatarList, setAvatarList] = useState(getAvailableAvatars)

  useEffect(() => {
    const refresh = () => setAvatarList(getAvailableAvatars())
    window.addEventListener('nex_shop_changed', refresh)
    return () => window.removeEventListener('nex_shop_changed', refresh)
  }, [])

  function handleSave() {
    const name = tempName.trim() || 'Usuário Ioversoroot'
    setUserName(name); saveStorage('nex_username', name)
    setEditing(false); setShowPicker(false)
    toast('Perfil atualizado!')
  }

  function pickAvatar(emoji) {
    setUserAvatar(emoji); saveStorage('nex_avatar', emoji)
    setShowPicker(false); toast('Avatar atualizado!')
  }

  return (
    <div className="card">
      <div className={styles.hero}>
        <div className={styles.avatarWrap}>
          <button type="button" className={styles.avatarBtn}
            onClick={() => setShowPicker(p => !p)} aria-label="Trocar avatar">
            <span className={styles.avatarEmoji}>{userAvatar}</span>
          </button>
          {showPicker && (
            <div className={styles.avatarPicker}>
              {avatarList.map(e => (
                <button key={e} type="button"
                  className={`${styles.emojiOpt} ${userAvatar === e ? styles.emojiSel : ''}`}
                  onClick={() => pickAvatar(e)}>{e}
                </button>
              ))}
            </div>
          )}
        </div>

        {editing ? (
          <div className={styles.nameEdit}>
            <input autoFocus className={`input ${styles.nameInput}`}
              value={tempName} maxLength={24} placeholder="Seu nome"
              onChange={e => setTempName(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter') handleSave(); if (e.key==='Escape') setEditing(false) }} />
            <button type="button" className={`btn btn-primary ${styles.saveNameBtn}`} onClick={handleSave}>
              <PiCheckBold size={13}/>
            </button>
          </div>
        ) : (
          <div className={styles.nameRow}>
            <span className={styles.heroName}>{userName}</span>
            <button type="button" className={styles.editNameBtn}
              onClick={() => { setTempName(userName); setEditing(true) }}>
              <PiPencilSimpleBold size={13}/>
            </button>
          </div>
        )}

        <div className={styles.heroLevel} style={{ color: level.color }}>
          <level.Icon size={14} /> {level.name}
        </div>
      </div>

      <div className={styles.statsGrid}>
        {[
          { val: allPoints,    lbl: 'Pontos'      },
          { val: `${streak}d`, lbl: 'Sequência'   },
          { val: daysActive,   lbl: 'Dias ativos' },
        ].map(({ val, lbl }) => (
          <div key={lbl} className={styles.pstat}>
            <div className={styles.pstatVal}>{val}</div>
            <div className={styles.pstatLbl}>{lbl}</div>
          </div>
        ))}
      </div>

      {level.next && (
        <div className={styles.xpSection}>
          <div className={styles.xpLabel}>
            <span>Próximo nível</span>
            <span className={styles.xpVal}>{allPoints}/{level.next} io</span>
          </div>
          <div className="pbar-wrap" style={{ height: 10 }}>
            <div className="pbar-fill" style={{ width:`${level.prog}%`, background:level.color, height:'100%' }} />
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// GRÁFICO MENSAL
// ══════════════════════════════════════
function MonthlyChart({ history }) {
  const data = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - 29 + i)
      const k = d.toISOString().slice(0, 10)
      const rec = history[k]
      return {
        date:    k,
        rate:    rec?.total > 0 ? Math.round(rec.done / rec.total * 100) : null,
        isToday: i === 29,
        label:   d.toLocaleDateString('pt-BR', { day:'numeric', month:'short' }),
        x:       i,
      }
    })
  , [history])

  const pts = data.filter(d => d.rate !== null)

  const { trendLabel, trendColor, TrendIcon } = useMemo(() => {
    if (pts.length < 4) return { trendLabel:'Poucos dados', trendColor:'var(--ink3)', TrendIcon:PiMinusBold }
    const half   = Math.floor(pts.length / 2)
    const first  = pts.slice(0, half).reduce((a,d) => a+d.rate, 0) / half
    const second = pts.slice(half).reduce((a,d) => a+d.rate, 0) / (pts.length - half)
    const diff   = Math.round(second - first)
    if (diff >  8) return { trendLabel:`+${diff}% vs início`, trendColor:'#27ae60',     TrendIcon:PiTrendUpBold   }
    if (diff < -8) return { trendLabel:`${diff}% vs início`,  trendColor:'#e74c3c',     TrendIcon:PiTrendDownBold }
    return               { trendLabel:'Estável',              trendColor:'var(--ink3)', TrendIcon:PiMinusBold     }
  }, [pts])

  const W=320, H=80, P=8
  const toX = i => P + (i/29)*(W-P*2)
  const toY = r => H - P - (r/100)*(H-P*2)
  const path = pts.length > 1
    ? pts.map((p,i) => `${i===0?'M':'L'} ${toX(p.x).toFixed(1)} ${toY(p.rate).toFixed(1)}`).join(' ')
    : null

  const weekLabels = data.filter((_,i) => i % 7 === 0)
  const avg = pts.length > 0 ? Math.round(pts.reduce((a,d)=>a+d.rate,0)/pts.length) : 0

  return (
    <div className="card">
      <div className="card-title">
        <PiChartLineUpBold size={15}/> Evolução — 30 Dias
        <span className={styles.trendBadge} style={{ color: trendColor }}>
          <TrendIcon size={11}/> {trendLabel}
        </span>
      </div>

      {pts.length < 2 ? (
        <div className="empty-state" style={{ padding:'16px 0' }}>
          <PiChartLineUpBold size={26} color="var(--ink3)"/>
          <p>Complete hábitos por alguns dias para ver o gráfico.</p>
        </div>
      ) : (
        <>
          <div className={styles.chartWrap}>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none">
              {[0,50,100].map(v => (
                <line key={v} x1={P} y1={toY(v)} x2={W-P} y2={toY(v)}
                  stroke="var(--border)" strokeOpacity=".15" strokeWidth="1"/>
              ))}
              {path && (
                <path
                  d={`${path} L ${toX(pts[pts.length-1].x).toFixed(1)} ${H-P} L ${toX(pts[0].x).toFixed(1)} ${H-P} Z`}
                  fill="var(--gold)" fillOpacity=".15"
                />
              )}
              {path && (
                <path d={path} fill="none" stroke="var(--gold-dk)"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              )}
              {pts.map(p => (
                <circle key={p.date} cx={toX(p.x)} cy={toY(p.rate)}
                  r={p.isToday?4:2.5}
                  fill={p.isToday?'var(--ink)':'var(--gold-dk)'}
                  stroke="var(--bg)" strokeWidth="1.5"/>
              ))}
            </svg>
          </div>

          <div className={styles.weekLabels}>
            {weekLabels.map(d => <span key={d.date} className={styles.weekLbl}>{d.label}</span>)}
          </div>

          <div className={styles.chartLegend}>
            {[
              { label:'Média 30d', val:`${avg}%` },
              { label:'Hoje',      val: data[29].rate !== null ? `${data[29].rate}%` : '—' },
              { label:'Melhor',    val:`${Math.max(...pts.map(d=>d.rate))}%` },
            ].map(({ label, val }) => (
              <div key={label} className={styles.legendItem}>
                <span className={styles.legendLbl}>{label}</span>
                <span className={styles.legendVal}>{val}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// SELETOR DE TEMAS — lista horizontal compacta
// Aparência integrada diretamente nas configs,
// sem card separado visualmente pesado.
// ══════════════════════════════════════
const THEME_LIST = [
  { id:'light',    name:'Padrão',   emoji:'☀️',  free:true  },
  { id:'dark',     name:'Escuro',   emoji:'🌙',  free:true  },
  { id:'midnight', name:'Midnight', emoji:'🌌',  free:false, shopId:'theme_midnight' },
  { id:'forest',   name:'Forest',   emoji:'🌿',  free:false, shopId:'theme_forest'   },
  { id:'sakura',   name:'Sakura',   emoji:'🌸',  free:false, shopId:'theme_sakura'   },
  { id:'desert',   name:'Desert',   emoji:'🏜️', free:false, shopId:'theme_desert'   },
  { id:'dracula',  name:'Dracula',  emoji:'🧛',  free:false, shopId:'theme_dracula'  },
  { id:'nord',     name:'Nord',     emoji:'🏔️', free:false, shopId:'theme_nord'     },
]

function ThemePicker({ currentTheme, onChangeTheme, ownedItems }) {
  const [open, setOpen] = useState(false)
  const current = THEME_LIST.find(t => t.id === currentTheme) || THEME_LIST[0]

  return (
    <div className={styles.themeDropdown}>
      {/* Trigger */}
      <button type="button" className={styles.themeDropTrigger} onClick={() => setOpen(o => !o)}>
        <PiPaletteBold size={15} color="var(--ink2)" style={{ flexShrink:0 }}/>
        <span className={styles.themeDropEmoji}>{current.emoji}</span>
        <span className={styles.themeDropName}>{current.name}</span>
        <PiCheckCircleBold size={12} color="var(--gold-dk)" style={{marginLeft:'auto', marginRight:4}}/>
        <PiCaretDownBold size={12} className={open ? styles.themeDropArrowOpen : ''} style={{transition:'transform .2s', transform: open ? 'rotate(180deg)' : 'none'}}/>
      </button>

      {/* Lista */}
      {open && (
        <div className={styles.themeDropList}>
          {THEME_LIST.map(t => {
            const unlocked = t.free || ownedItems.has(t.shopId)
            const active   = currentTheme === t.id
            return (
              <button key={t.id} type="button"
                className={[styles.themeDropItem, active && styles.themeDropItemActive, !unlocked && styles.themeDropItemLocked].filter(Boolean).join(' ')}
                onClick={() => { if (unlocked) { onChangeTheme(t.id); setOpen(false) } }}
                title={!unlocked ? 'Desbloquear na loja' : t.name}>
                <span className={styles.themeDropEmoji}>{t.emoji}</span>
                <span className={styles.themeDropItemName}>{t.name}</span>
                {active    && <PiCheckCircleBold size={13} color="var(--gold-dk)" style={{marginLeft:'auto'}}/>}
                {!unlocked && <span className={styles.themeDropLock}><PiLockSimpleBold size={11}/></span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// LOJA DE RECOMPENSAS
// ══════════════════════════════════════
const SHOP_ITEMS = [
  { id:'util_progress',   cat:'utilidade', name:'Experiência',   icon:'📊', desc:'Disponível gratuitamente — adiciona a tela de Conquistas e Estatísticas à navegação.', cost:0, pillar:'Rotina', pillarColor:'#27ae60' },
  { id:'util_calendar',   cat:'utilidade', name:'Calendário',    icon:'📅', desc:'Desbloqueado com 500 io — exibe o calendário mensal na tela de hábitos. Pode ser ocultado a qualquer momento.', cost:500, toggle:true, pillar:'Rotina', pillarColor:'#27ae60' },
  { id:'avatar_eagle',    cat:'avatar',   name:'Águia',         icon:'🦅', desc:'Disponível gratuitamente — adicione ao seu perfil agora.',           cost:0,    pillar:'Rotina',    pillarColor:'#27ae60' },
  { id:'avatar_monk',     cat:'avatar',   name:'Monge',         icon:'🧘', desc:'Disponível gratuitamente — adicione ao seu perfil agora.',           cost:0,    pillar:'Bem-estar', pillarColor:'#8e44ad' },
  { id:'avatar_lightning',cat:'avatar',   name:'Relâmpago',     icon:'⚡', desc:'Disponível gratuitamente — adicione ao seu perfil agora.',           cost:0,    pillar:'Rotina',    pillarColor:'#27ae60' },
  { id:'avatar_cosmos',   cat:'avatar',   name:'Cosmos',        icon:'🪐', desc:'Disponível gratuitamente — adicione ao seu perfil agora.',           cost:0,    pillar:'Bem-estar', pillarColor:'#8e44ad' },
  { id:'theme_sakura',    cat:'tema',     name:'Sakura',        icon:'🌸', desc:'Desbloqueado com 800 io acumulados.',  cost:800,  pillar:'Bem-estar', pillarColor:'#8e44ad' },
  { id:'theme_desert',    cat:'tema',     name:'Desert',        icon:'🏜️',desc:'Desbloqueado com 800 io acumulados.',  cost:800,  pillar:'Bem-estar', pillarColor:'#8e44ad' },
  { id:'theme_dracula',   cat:'tema',     name:'Dracula',       icon:'🧛', desc:'Desbloqueado com 1000 io acumulados.', cost:1000, pillar:'Bem-estar', pillarColor:'#8e44ad' },
  { id:'theme_nord',      cat:'tema',     name:'Nord',          icon:'🏔️',desc:'Desbloqueado com 1000 io acumulados.', cost:1000, pillar:'Bem-estar', pillarColor:'#8e44ad' },
  { id:'theme_midnight',  cat:'tema',     name:'Midnight',      icon:'🌌', desc:'Desbloqueado com 1200 io acumulados.', cost:1200, pillar:'Bem-estar', pillarColor:'#8e44ad' },
  { id:'theme_forest',    cat:'tema',     name:'Forest',        icon:'🌿', desc:'Desbloqueado com 1200 io acumulados.', cost:1200, pillar:'Bem-estar', pillarColor:'#8e44ad' },
]

const CAT_LABELS = { all:'Todos', tema:'Temas', avatar:'Avatares', utilidade:'Utilitários' }
const CAT_DESC   = {
  all:       'Todos os itens disponíveis na loja',
  tema:      'Temas visuais que alteram as cores do app',
  avatar:    'Avatares exclusivos para o seu perfil',
  utilidade: 'Ferramentas e bônus para sua rotina',
}

// ══════════════════════════════════════
// LOJA — dropdown animado que expande
// ao clicar no botão da seção de configs.
// Fica escondida por padrão para não
// poluir o layout do Profile.
// ══════════════════════════════════════
function RewardsShop({ allPoints, onItemBought, isOpen, onToggle }) {
  const [cat,        setCat]        = useState('all')
  const [owned,      setOwned]      = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('nex_shop_owned') || '[]')) }
    catch { return new Set() }
  })
  const [calVisible, setCalVisible] = useState(() =>
    loadStorage('nex_cal_visible', true)
  )

  function buy(item) {
    if (owned.has(item.id)) return
    if (item.cost > 0 && allPoints < item.cost) return
    const next = new Set(owned)
    next.add(item.id)
    setOwned(next)
    localStorage.setItem('nex_shop_owned', JSON.stringify([...next]))
    if (item.cat === 'avatar') localStorage.setItem('nex_avatar', item.icon)
    if (onItemBought) onItemBought(item.id)
    window.dispatchEvent(new Event('nex_shop_changed'))
    const msg = {
      util_calendar:  'Calendário desbloqueado! Visível na tela de hábitos.',
      util_freeze:    'Streak Freeze ativado!',
      util_challenge: 'Desafio extra adicionado em Rewards.',
      util_insight:   'Insight Financeiro ativado.',
    }
    toast(msg[item.id] || `"${item.name}" desbloqueado!`)
  }

  function toggleCal() {
    const next = !calVisible
    setCalVisible(next)
    saveStorage('nex_cal_visible', next)
    window.dispatchEvent(new Event('nex_shop_changed'))
  }

  const ownedCount = SHOP_ITEMS.filter(i => owned.has(i.id)).length
  const list = (cat === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter(i => i.cat === cat))
    .slice().sort((a, b) => a.cost - b.cost)

  return (
    <div className={styles.shopWrapper}>
      {/* Trigger — aparece como linha de configuração */}
      <div className={styles.shopTrigger} onClick={onToggle} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onToggle()}>
        <span className={styles.settingIcon}><PiStorefrontBold size={16}/></span>
        <div style={{ flex:1 }}>
          <span className={styles.settingLabel}>Loja de recompensas</span>
          <p className={styles.settingDesc}>
            {ownedCount} / {SHOP_ITEMS.length} itens obtidos · {allPoints} io disponíveis
          </p>
        </div>
        <span className={`${styles.shopArrow} ${isOpen ? styles.shopArrowOpen : ''}`}>
          <PiCaretDownBold size={14}/>
        </span>
      </div>

      {/* Conteúdo animado */}
      <div className={`${styles.shopDrawer} ${isOpen ? styles.shopDrawerOpen : ''}`}>
        <div className={styles.shopDrawerInner}>

          {/* Categorias */}
          <div className={styles.shopCats}>
            {Object.entries(CAT_LABELS).map(([id, lbl]) => (
              <button key={id} type="button"
                className={`${styles.shopCat} ${cat===id ? styles.shopCatActive : ''}`}
                onClick={() => setCat(id)} title={CAT_DESC[id]}>{lbl}
              </button>
            ))}
          </div>

          <p className={styles.shopCatDesc}>{CAT_DESC[cat]}</p>

          {/* Lista de itens */}
          <div className={styles.shopList}>
            {list.map(item => {
              const isOwned   = owned.has(item.id)
              const canAfford = allPoints >= item.cost
              return (
                <div key={item.id} className={`${styles.shopRow} ${isOwned ? styles.shopRowOwned : ''} ${isOwned && item.toggle ? styles.shopRowToggleable : ''}`}>
                  <span className={styles.shopRowEmoji}>{item.icon}</span>
                  <div className={styles.shopRowInfo}>
                    <span className={styles.shopRowName}>{item.name}</span>
                    <span className={styles.shopRowDesc}>{item.desc}</span>
                  </div>
                  <div className={`${styles.shopRowAction} ${isOwned && item.toggle ? styles.shopRowActionToggle : ''}`}>
                    {isOwned && item.toggle ? (
                      <Toggle
                        on={item.id === 'util_calendar' ? calVisible : true}
                        onToggle={item.id === 'util_calendar' ? toggleCal : undefined}
                        label={item.name}
                      />
                    ) : isOwned ? (
                      <span className={styles.shopRowDone}>✓</span>
                    ) : item.cost === 0 ? (
                      <button type="button" className={`btn ${styles.shopRowBtn}`} onClick={() => buy(item)}>
                        Grátis
                      </button>
                    ) : (
                      <button type="button"
                        className={`btn btn-primary ${styles.shopRowBtn} ${!canAfford ? styles.shopRowCant : ''}`}
                        onClick={() => buy(item)} disabled={!canAfford}
                        title={!canAfford ? `Faltam ${item.cost - allPoints} io` : ''}>
                        {item.cost} io
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// MODO DESENVOLVEDOR
// ══════════════════════════════════════
function DevCard() {
  const [on, setOn] = useState(() => localStorage.getItem('nex_devmode') === 'true')

  function toggle() {
    const next = !on; setOn(next)
    localStorage.setItem('nex_devmode', String(next))

    if (next) {
      const today    = new Date().toISOString().slice(0, 10)
      const todayDow = new Date().getDay()

      // ──────────────────────────────────────
      // HÁBITOS DEMO — 7 hábitos com todos os
      // campos preenchidos para testar Home e
      // Habits (QuickPanel, prioridades, etc.)
      // ──────────────────────────────────────
      const DEMO_HABITS = [
        {
          id:1, name:'Meditação', done:true, pts:20, icon:'PiBrainBold',
          priority:'alta', freq:'diario', days:[0,1,2,3,4,5,6],
          subtasks:[],
          notes:'Usar app Headspace. Foco na respiração e no corpo.',
          reason:'Reduz estresse e melhora minha clareza mental ao longo do dia.',
          tags:['mente','manhã'], estMins:15, deadline:null, createdAt:'2024-10-01',
        },
        {
          id:2, name:'Exercício', done:false, pts:30, icon:'PiBarbell',
          priority:'alta', freq:'personalizado', days:[1,3,5],
          subtasks:[
            {id:21,text:'Aquecimento 5 min',  done:false},
            {id:22,text:'Treino principal',    done:false},
            {id:23,text:'Alongamento final',   done:false},
          ],
          notes:'Seg: pernas · Qua: costas · Sex: peito e ombro.',
          reason:'Saúde é a base de tudo. Energia, disposição e longevidade.',
          tags:['corpo','saúde'], estMins:60, deadline:null, createdAt:'2024-10-01',
        },
        {
          id:3, name:'Leitura', done:true, pts:20, icon:'PiBookOpenText',
          priority:'media', freq:'diario', days:[0,1,2,3,4,5,6],
          subtasks:[],
          notes:'Mínimo 20 páginas. Atualmente: Atomic Habits — James Clear.',
          reason:'Cada livro é um mentor disponível 24h. Conhecimento composto.',
          tags:['mente','aprendizado'], estMins:30, deadline:null, createdAt:'2024-10-01',
        },
        {
          id:4, name:'Código', done:false, pts:30, icon:'PiCodeBold',
          priority:'media', freq:'personalizado', days:[1,2,3,4,5],
          subtasks:[],
          notes:'Foco: React + TypeScript. Side projects e contribuições open source.',
          reason:'Construir fluência técnica que abre portas para projetos maiores.',
          tags:['carreira','tech'], estMins:90, deadline:null, createdAt:'2024-10-15',
        },
        {
          id:5, name:'Água', done:false, pts:10, icon:'PiDropBold',
          priority:'baixa', freq:'diario', days:[0,1,2,3,4,5,6],
          subtasks:[
            {id:51,text:'500 ml pela manhã', done:false},
            {id:52,text:'500 ml à tarde',    done:false},
            {id:53,text:'500 ml à noite',    done:false},
          ],
          notes:'Meta: 1,5 L mínimo. Usar garrafa de 500 ml como referência.',
          reason:'Hidratação afeta diretamente foco, humor e energia.',
          tags:['saúde'], estMins:null, deadline:null, createdAt:'2024-10-01',
        },
        {
          id:6, name:'Diário', done:false, pts:15, icon:'PiPencilBold',
          priority:'baixa', freq:'diario', days:[0,1,2,3,4,5,6],
          subtasks:[],
          notes:'3 gratidões + 1 aprendizado do dia. Máximo 10 min.',
          reason:'Registro de progresso e clareza mental. Quem escreve, processa.',
          tags:['reflexão','mente'], estMins:10, deadline:null, createdAt:'2024-10-20',
        },
        {
          id:7, name:'Sono', done:false, pts:15, icon:'PiMoonBold',
          priority:'baixa', freq:'diario', days:[0,1,2,3,4,5,6],
          subtasks:[],
          notes:'Dormir antes das 23h. Meta: 8h por noite. Celular fora do quarto.',
          reason:'Sem sono de qualidade, nenhum dos outros hábitos funciona direito.',
          tags:['saúde','noite'], estMins:null, deadline:null, createdAt:'2024-11-01',
        },
      ]

      // Corrige done: apenas hábitos ativos hoje podem estar done
      const habitsForStorage = DEMO_HABITS.map(h => ({
        ...h,
        done: h.done && h.days.includes(todayDow),
      }))

      // ──────────────────────────────────────
      // HISTÓRICO — 120 dias
      //
      // Padrão para testar os gráficos:
      //   i=0       → hoje (calculado a partir dos hábitos)
      //   i=1..22   → streak garantido (done > 0)   → nível "Núcleo" (22d)
      //   i=23..70  → ~75% conclusão (ativo, bom)
      //   i=71..119 → ~50% conclusão (começo do uso)
      // ──────────────────────────────────────
      const HABIT_DEFS = DEMO_HABITS.map(h => ({ id: h.id, days: h.days }))

      // Semente determinística para resultados consistentes entre recargas
      let seed = 42
      function rng() { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff }

      const history = {}

      // Hoje — reflete os hábitos marcados acima
      const todayDoneMap = {}
      habitsForStorage.filter(h => h.done).forEach(h => { todayDoneMap[h.id] = true })
      const todayTotal = HABIT_DEFS.filter(h => h.days.includes(todayDow)).length
      history[today] = {
        done:   Object.keys(todayDoneMap).length,
        total:  todayTotal,
        habits: todayDoneMap,
      }

      // Dias passados
      for (let i = 1; i <= 120; i++) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const k   = d.toISOString().slice(0, 10)
        const dow = d.getDay()
        const dayHabits = HABIT_DEFS.filter(h => h.days.includes(dow))
        if (!dayHabits.length) continue

        const hm = {}

        if (i <= 22) {
          // Streak zone — alta conclusão para garantir streak e nível Núcleo
          dayHabits.forEach(h => { if (rng() > 0.12) hm[h.id] = true })
          if (!Object.keys(hm).length) hm[dayHabits[0].id] = true // mínimo 1
        } else if (i <= 70) {
          // Zona ativa — padrão realista, ~75%
          dayHabits.forEach(h => { if (rng() > 0.28) hm[h.id] = true })
        } else {
          // Início — começo do uso, ~50%
          dayHabits.forEach(h => { if (rng() > 0.50) hm[h.id] = true })
        }

        history[k] = {
          done:   Object.keys(hm).length,
          total:  dayHabits.length,
          habits: hm,
        }
      }

      localStorage.setItem('nex_habits',     JSON.stringify(habitsForStorage))
      localStorage.setItem('nex_history',    JSON.stringify(history))
      localStorage.setItem('nex_last_reset', today)

      // ──────────────────────────────────────
      // CARREIRA demo
      // ──────────────────────────────────────
      localStorage.setItem('nex_career_readings', JSON.stringify([
        {id:1,title:'Atomic Habits',author:'James Clear',type:'Livro',status:'concluido',notes:'Melhor livro sobre hábitos que já li.',rating:5,createdAt:'2024-10-10'},
        {id:2,title:'Deep Work',author:'Cal Newport',type:'Livro',status:'lendo',notes:'Foco no trabalho profundo e sessões sem distração.',rating:4,createdAt:'2024-11-01'},
        {id:3,title:'React Avançado',author:'Kent C. Dodds',type:'Curso',status:'lendo',notes:'Patterns de performance e composição.',createdAt:'2024-11-15'},
        {id:4,title:'The Pragmatic Programmer',author:'Hunt & Thomas',type:'Livro',status:'lista',createdAt:'2024-12-01'},
      ]))
      localStorage.setItem('nex_career_goals', JSON.stringify([
        {id:1,title:'Dominar React + TypeScript',area:'Tecnologia',milestones:[
          {id:1,text:'Completar curso avançado',done:true},
          {id:2,text:'Construir 3 projetos próprios',done:true},
          {id:3,text:'Contribuir para open source',done:false},
          {id:4,text:'Deploy de SaaS pessoal',done:false},
        ],createdAt:'2024-10-01'},
        {id:2,title:'Comunicação e liderança',area:'Soft Skills',milestones:[
          {id:1,text:'Fazer 10 apresentações técnicas',done:false},
          {id:2,text:'Mentorar 2 pessoas',done:false},
        ],createdAt:'2024-11-01'},
      ]))
      localStorage.setItem('nex_career_projects', JSON.stringify([
        {id:1,name:'Portfolio Pessoal',status:'andamento',notes:'Site profissional com case studies.',
         tasks:[{id:1,text:'Design',done:true},{id:2,text:'Desenvolvimento',done:true},{id:3,text:'Deploy',done:false}],createdAt:'2024-10-15'},
        {id:2,name:'Ioversoroot App',status:'andamento',notes:'PWA de hábitos e produtividade.',
         tasks:[{id:1,text:'MVP',done:true},{id:2,text:'Design system',done:true},{id:3,text:'Loja',done:false}],createdAt:'2024-11-01'},
      ]))

      // ──────────────────────────────────────
      // PROJETOS DE VIDA demo
      // ──────────────────────────────────────
      localStorage.setItem('nex_projects', JSON.stringify([
        {id:1,title:'Aprender Espanhol',category:'Aprendizado',priority:'media',status:'andamento',
         milestones:[
           {id:1,text:'Completar nível A1',done:true},
           {id:2,text:'Assistir série sem legenda',done:false},
           {id:3,text:'Conversação básica fluente',done:false},
         ],desc:'Meta de longo prazo. 20 min/dia consistentes.',createdAt:'2024-10-01'},
        {id:2,title:'Correr 10km',category:'Saúde',priority:'alta',status:'andamento',
         milestones:[
           {id:1,text:'Correr 1km sem parar',done:true},
           {id:2,text:'Correr 5km',done:true},
           {id:3,text:'Correr 10km',done:false},
         ],createdAt:'2024-11-01'},
        {id:3,title:'Economizar R$ 10k',category:'Finanças',priority:'alta',status:'andamento',
         milestones:[
           {id:1,text:'Reserva de emergência (3 meses)',done:true},
           {id:2,text:'Investir mensalmente',done:false},
           {id:3,text:'Atingir meta dos 10k',done:false},
         ],desc:'Fundo de liberdade para projetos próprios.',createdAt:'2024-10-20'},
      ]))

      toast('120 dias carregados — recarregue a página!')
    } else {
      ['nex_habits','nex_history','nex_last_reset',
       'nex_career_readings','nex_career_goals','nex_career_projects','nex_projects']
        .forEach(k => localStorage.removeItem(k))
      toast('Modo dev desativado — recarregue.')
    }
  }

  return (
    <div className="card">
      <div className="card-title"><PiCodeBold size={15}/> Desenvolvedor</div>
      <div className={styles.settingRow}>
        <span className={styles.settingIcon}><PiCodeBold size={16}/></span>
        <div style={{ flex:1 }}>
          <span className={styles.settingLabel}>Dados de demonstração</span>
          <p className={styles.settingDesc}>
            Preenche 120 dias de histórico com 7 hábitos completos (prioridades, reason, notas, tags, subtarefas)
            e carreira, projetos para testar todos os gráficos, níveis e o calendário.
          </p>
        </div>
        <Toggle on={on} onToggle={toggle} label="Demo"/>
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// PROFILE — PÁGINA PRINCIPAL
// ══════════════════════════════════════
export default function Profile({ onNavigate }) {
  const { habits, history, theme, setTheme, soundOn, setSoundOn, resetDay } = useApp()
  const { allPoints }          = useHabits()
  const { streak, daysActive } = useStats(history)

  const [shopOpen, setShopOpen] = useState(false)
  const legal = useLegal()

  const [ownedItems, setOwnedItems] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('nex_shop_owned') || '[]')) }
    catch { return new Set() }
  })

  function exportData() {
    const userName   = loadStorage('nex_username', 'Usuário Ioversoroot')
    const userAvatar = loadStorage('nex_avatar', '🧑')
    const blob = new Blob(
      [JSON.stringify({ habits, history, userName, userAvatar }, null, 2)],
      { type: 'application/json' }
    )
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `nex-backup-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    toast('Backup exportado!')
  }

  function importData(e) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target.result)
        if (!data.habits) { toast('Arquivo inválido'); return }
        localStorage.setItem('nex_habits',  JSON.stringify(data.habits))
        localStorage.setItem('nex_history', JSON.stringify(data.history || {}))
        if (data.userName)   saveStorage('nex_username', data.userName)
        if (data.userAvatar) saveStorage('nex_avatar',   data.userAvatar)
        toast('Backup restaurado! Recarregue a página.')
      } catch { toast('Arquivo inválido') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function toggleNavItem(id) {
    const next = new Set(ownedItems)
    ownedItems.has(id) ? next.delete(id) : next.add(id)
    setOwnedItems(next)
    localStorage.setItem('nex_shop_owned', JSON.stringify([...next]))
    window.dispatchEvent(new Event('nex_shop_changed'))
  }

  return (
    <div className={styles.page}>

      <HeroCard allPoints={allPoints} streak={streak} daysActive={daysActive}/>

      <MonthlyChart history={history}/>

      {/* Configurações — inclui aparência e loja inline */}
      <div className="card">
        <div className="card-title"><PiCodeBold size={15}/> Configurações</div>

        {/* Aparência — tema como linha compacta */}
        <div style={{ padding:'11px 0', borderBottom:'1px solid var(--border)' }}>
          <ThemePicker
            currentTheme={theme}
            onChangeTheme={setTheme}
            ownedItems={ownedItems}
          />
        </div>

        {/* Loja — dropdown animado dentro das configs */}
        <RewardsShop
          allPoints={allPoints}
          isOpen={shopOpen}
          onToggle={() => setShopOpen(s => !s)}
          onItemBought={id => {
            setOwnedItems(prev => new Set([...prev, id]))
          }}
        />

        <div className={styles.settingRow}>
          <span className={styles.settingIcon}>
            {soundOn ? <PiSpeakerHighBold size={16}/> : <PiSpeakerSlashBold size={16}/>}
          </span>
          <div style={{ flex:1 }}>
            <span className={styles.settingLabel}>Sons de feedback</span>
          </div>
          <Toggle on={soundOn} onToggle={() => setSoundOn(s => !s)} label="Sons"/>
        </div>

        <div className={styles.settingRow}>
          <span className={styles.settingIcon}><PiChartBarBold size={16}/></span>
          <div style={{ flex:1 }}>
            <span className={styles.settingLabel}>Experiência na navegação</span>
            <p className={styles.settingDesc}>Exibe conquistas e estatísticas na barra inferior.</p>
          </div>
          <Toggle on={ownedItems.has('util_progress')} onToggle={() => toggleNavItem('util_progress')} label="Experiência nav"/>
        </div>

        <div className={styles.settingRow}>
          <span className={styles.settingIcon}><PiBriefcaseBold size={16}/></span>
          <div style={{ flex:1 }}>
            <span className={styles.settingLabel}>Carreira na navegação</span>
            <p className={styles.settingDesc}>Exibe o ícone de Carreira na barra inferior.</p>
          </div>
          <Toggle on={ownedItems.has('util_career')} onToggle={() => toggleNavItem('util_career')} label="Career nav"/>
        </div>

        <div className={styles.settingRow}>
          <span className={styles.settingIcon}><PiRocketLaunchBold size={16}/></span>
          <div style={{ flex:1 }}>
            <span className={styles.settingLabel}>Projetos na navegação</span>
            <p className={styles.settingDesc}>Exibe o ícone de Projetos na barra inferior.</p>
          </div>
          <Toggle on={ownedItems.has('util_projects')} onToggle={() => toggleNavItem('util_projects')} label="Projects nav"/>
        </div>

      </div>

      {/* Dados — compacto com explicações */}
      <div className="card">
        <div className="card-title"><PiDownloadSimpleBold size={15}/> Seus Dados</div>
        <p className={styles.dadosDesc}>
          Exporte um backup completo (hábitos, histórico, perfil) em JSON ou restaure um backup anterior.
        </p>
        <div className={styles.dataRow}>
          <button className="btn" onClick={exportData} style={{ flex:1, justifyContent:'center', fontSize:12 }}>
            <PiDownloadSimpleBold size={13}/> Exportar backup
          </button>
          <label className={`btn ${styles.importLabel}`} style={{ fontSize:12 }}>
            <PiUploadSimpleBold size={13}/> Restaurar backup
            <input type="file" accept=".json" style={{ display:'none' }} onChange={importData}/>
          </label>
        </div>
        <button className="btn btn-danger"
          style={{ width:'100%', justifyContent:'center', marginTop:6, fontSize:11 }}
          onClick={() => { if (window.confirm('Resetar todos os hábitos do dia?')) { resetDay(); toast('Dia resetado!') } }}>
          <PiArrowCounterClockwiseBold size={13}/> Resetar dia atual
        </button>
      </div>

      <AITeaser/>

      <DevCard/>

      {/* Footer */}
      <div className={styles.footer}>
        <p className={styles.footerVersion}>Ioversoroot v0.1.0</p>
        

        <div className={styles.footerLinks}>
          <button type="button" className={styles.footerLink} onClick={legal.openTermos}>Termos de Uso</button>
          <span className={styles.footerDot}>·</span>
          <button type="button" className={styles.footerLink} onClick={legal.openPrivacidade}>Privacidade</button>
          <span className={styles.footerDot}>·</span>
          <button type="button" className={styles.footerLink} onClick={legal.openCookies}>Cookies</button>
        </div>
           <p className={styles.footerCopy}>© 2026 Ioversodevlab · Todos os direitos reservados</p>
      </div>
      
        <button type="button" className={styles.logoutBtn}
          onClick={() => { if (window.confirm('Sair da conta? (função completa disponível com autenticação)')) toast('Logout em breve com autenticação.') }}>
          Sair da conta
        </button>
        
       

      {legal.openDoc && <LegalModal doc={legal.openDoc} onClose={legal.close}/>}
    </div>
  )
}
