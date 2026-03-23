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
  PiKeyBold, PiEyeBold, PiEyeSlashBold,
  PiCrownBold, PiCreditCardBold, PiXBold, PiSparkleBold,
} from 'react-icons/pi'
import { useApp }      from '../context/AppContext'
import { useHabits }   from '../hooks/useHabits'
import { useStats }    from '../hooks/useStats'
import { calcLevel }   from '../services/levels'
import { loadStorage, saveStorage } from '../services/storage'
import { THEMES, applyTheme } from '../services/themes'
import { LegalModal, useLegal } from '../components/LegalModal'
import { toast }     from '../components/Toast'
import { playPurchaseDirect, playClickDirect } from '../hooks/useSound'
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
  { id:'glass',    name:'Vidro',    emoji:'🪟',  free:false, shopId:'theme_glass'    },
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
  { id:'util_mentor',     cat:'utilidade', name:'Mentor IA',     icon:'🤖', desc:'Disponível gratuitamente — adiciona a tela do Mentor e Diário de Reflexão à navegação.', cost:0, pillar:'Bem-estar', pillarColor:'#8e44ad' },
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
  { id:'theme_glass',     cat:'tema',     name:'Vidro',         icon:'🪟', desc:'O tema mais exclusivo — glassmorphism inspirado no design Apple. Desbloqueado com 2000 io.', cost:2000, pillar:'Bem-estar', pillarColor:'#8e44ad' },
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
    playPurchaseDirect()
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
    playClickDirect()
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
// CHAVE API — configuração pelo usuário
// ══════════════════════════════════════
function ApiKeyCard() {
  const [key,     setKey]     = useState(() => localStorage.getItem('nex_apikey') || '')
  const [input,   setInput]   = useState(() => localStorage.getItem('nex_apikey') || '')
  const [show,    setShow]    = useState(false)
  const [open,    setOpen]    = useState(false)
  const [editing, setEditing] = useState(false)

  const hasSaved = key && key.startsWith('sk-ant-')

  function save() {
    const trimmed = input.trim()
    if (!trimmed) { toast('Cole sua chave API antes de salvar.'); return }
    if (!trimmed.startsWith('sk-ant-')) { toast('Chave inválida — deve começar com sk-ant-'); return }
    localStorage.setItem('nex_apikey', trimmed)
    setKey(trimmed)
    setEditing(false)
    toast('Chave API salva!')
  }

  function remove() {
    if (!window.confirm('Remover a chave API? O Mentor IA ficará desativado.')) return
    localStorage.removeItem('nex_apikey')
    setKey(''); setInput(''); setEditing(false)
    toast('Chave removida.')
  }

  const masked = key ? key.slice(0, 10) + '••••••••••••' + key.slice(-4) : ''

  return (
    <div className={styles.shopWrapper}>
      <div className={styles.shopTrigger} onClick={() => setOpen(o => !o)} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}>
        <span className={styles.settingIcon}><PiKeyBold size={16}/></span>
        <div style={{ flex:1 }}>
          <span className={styles.settingLabel}>Chave API Claude</span>
          <p className={styles.settingDesc}>
            {hasSaved ? 'Chave configurada — Mentor IA ativo' : 'Necessária para usar o Mentor IA'}
          </p>
        </div>
        {hasSaved && <span style={{ fontSize:10, fontWeight:700, color:'#27ae60', marginRight:6, background:'#27ae6022', border:'1px solid #27ae6044', borderRadius:4, padding:'2px 6px' }}>Ativa</span>}
        <span className={`${styles.shopArrow} ${open ? styles.shopArrowOpen : ''}`}><PiCaretDownBold size={14}/></span>
      </div>

      <div className={`${styles.shopDrawer} ${open ? styles.shopDrawerOpen : ''}`}>
        <div className={styles.shopDrawerInner} style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Passo a passo */}
          <div style={{ background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:4, padding:'10px 12px', display:'flex', flexDirection:'column', gap:8 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--ink2)', margin:0 }}>Como obter sua chave:</p>
            {[
              { n:1, text:'Acesse', link:'console.anthropic.com', href:'https://console.anthropic.com' },
              { n:2, text:'Vá em API Keys → Create Key', link:null },
              { n:3, text:'Copie e cole abaixo', link:null },
            ].map(s => (
              <div key={s.n} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ minWidth:18, height:18, borderRadius:'50%', background:'var(--gold)', color:'var(--ink)', fontSize:10, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>{s.n}</span>
                <span style={{ fontSize:11, color:'var(--ink2)' }}>
                  {s.text}{' '}
                  {s.link && <a href={s.href} target="_blank" rel="noopener noreferrer" style={{ color:'var(--gold-dk)', fontWeight:700 }}>{s.link}</a>}
                </span>
              </div>
            ))}
          </div>

          {/* Input ou display da chave */}
          {hasSaved && !editing ? (
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <div style={{ flex:1, background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:4, padding:'8px 10px', fontSize:12, fontFamily:'monospace', color:'var(--ink2)' }}>
                {show ? key : masked}
              </div>
              <button type="button" className="btn" style={{ padding:'6px 8px' }} onClick={() => setShow(s => !s)}>
                {show ? <PiEyeSlashBold size={14}/> : <PiEyeBold size={14}/>}
              </button>
              <button type="button" className="btn" style={{ padding:'6px 10px', fontSize:11 }} onClick={() => { setInput(key); setEditing(true) }}>
                Trocar
              </button>
              <button type="button" className="btn btn-danger" style={{ padding:'6px 10px', fontSize:11 }} onClick={remove}>
                Remover
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', gap:6 }}>
              <input
                className="input"
                type={show ? 'text' : 'password'}
                placeholder="sk-ant-api03-..."
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{ flex:1, fontFamily:'monospace', fontSize:12 }}
              />
              <button type="button" className="btn" style={{ padding:'6px 8px' }} onClick={() => setShow(s => !s)}>
                {show ? <PiEyeSlashBold size={14}/> : <PiEyeBold size={14}/>}
              </button>
              <button type="button" className="btn btn-primary" style={{ padding:'6px 12px', fontSize:12 }} onClick={save}>
                <PiCheckBold size={13}/> Salvar
              </button>
            </div>
          )}

          <div style={{ background:'#fffbf0', border:'1.5px solid var(--gold-dk)', borderRadius:4, padding:'8px 10px', display:'flex', flexDirection:'column', gap:4 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--ink)', margin:0 }}>💡 Chave API é independente do plano Pro</p>
            <p style={{ fontSize:10, color:'var(--ink2)', margin:0, lineHeight:1.5 }}>
              Ter sua própria chave API da Anthropic é suficiente para usar o Mentor IA — <strong>sem precisar do plano Pro do Rootio</strong>. A chave é cobrada diretamente pela Anthropic conforme o uso (pay-as-you-go), e fica salva apenas no seu dispositivo.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// PLANOS — Free vs Pro + checkout fictício
// ══════════════════════════════════════
const FREE_FEATURES = [
  'Hábitos ilimitados',
  'Histórico e gráficos',
  'Diário de reflexão',
  'Finanças pessoais',
  'Projetos e carreira',
  'Temas Light e Dark',
  'Backup local (JSON)',
]
const PRO_FEATURES = [
  ...FREE_FEATURES,
  'Mentor IA sem precisar de chave própria',
  'Resumo diário personalizado',
  'Badge gerado por IA',
  'Sugestão de hábitos por IA',
  'Temas exclusivos desbloqueados',
  'Backup e exportação em JSON',
]

function PlansCard() {
  const [plan,        setPlan]        = useState(() => localStorage.getItem('nex_plan') || 'free')
  const [showCheckout,setShowCheckout]= useState(false)
  const [cardNum,     setCardNum]     = useState('')
  const [cardExp,     setCardExp]     = useState('')
  const [cardCvc,     setCardCvc]     = useState('')
  const [processing,  setProcessing]  = useState(false)
  const [open,        setOpen]        = useState(false)

  const isPro = plan === 'pro'

  function fmtCard(v) {
    return v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim()
  }
  function fmtExp(v) {
    const d = v.replace(/\D/g,'').slice(0,4)
    return d.length > 2 ? d.slice(0,2) + '/' + d.slice(2) : d
  }

  function handleCheckout(e) {
    e.preventDefault()
    setProcessing(true)
    // Simulação de processamento (fictício)
    setTimeout(() => {
      localStorage.setItem('nex_plan', 'pro')
      setPlan('pro')
      setProcessing(false)
      setShowCheckout(false)
      toast('Plano Pro ativado! Bem-vindo.')
    }, 2000)
  }

  function cancelPro() {
    if (!window.confirm('Cancelar o plano Pro? Você voltará ao plano gratuito.')) return
    localStorage.setItem('nex_plan', 'free')
    setPlan('free')
    toast('Plano cancelado. Você está no plano gratuito.')
  }

  return (
    <div className={styles.shopWrapper}>
      <div className={styles.shopTrigger} onClick={() => setOpen(o => !o)} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}>
        <span className={styles.settingIcon}><PiCrownBold size={16} color={isPro ? '#f39c12' : undefined}/></span>
        <div style={{ flex:1 }}>
          <span className={styles.settingLabel}>Plano atual</span>
          <p className={styles.settingDesc}>
            {isPro ? 'Pro — todos os recursos desbloqueados' : 'Gratuito — upgrade para Pro'}
          </p>
        </div>
        <span style={{ fontSize:10, fontWeight:700, color: isPro ? '#f39c12' : 'var(--ink3)', background: isPro ? '#f39c1222' : 'var(--surface)', border:`1px solid ${isPro ? '#f39c1244' : 'var(--border)'}`, borderRadius:4, padding:'2px 6px', marginRight:6 }}>
          {isPro ? 'PRO' : 'FREE'}
        </span>
        <span className={`${styles.shopArrow} ${open ? styles.shopArrowOpen : ''}`}><PiCaretDownBold size={14}/></span>
      </div>

      <div className={`${styles.shopDrawer} ${open ? styles.shopDrawerOpen : ''}`}>
        <div className={styles.shopDrawerInner} style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Tabela de comparação */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {/* Free */}
            <div style={{ border:'2px solid var(--border)', borderRadius:6, padding:'10px 10px', background:'var(--surface)' }}>
              <div style={{ fontSize:12, fontWeight:900, color:'var(--ink)', marginBottom:8, display:'flex', alignItems:'center', gap:5 }}>
                Gratuito
              </div>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--ink3)', marginBottom:6 }}>R$ 0/mês</div>
              {FREE_FEATURES.map(f => (
                <div key={f} style={{ display:'flex', gap:5, alignItems:'flex-start', marginBottom:4 }}>
                  <PiCheckBold size={11} color="#27ae60" style={{ marginTop:2, flexShrink:0 }}/>
                  <span style={{ fontSize:10, color:'var(--ink2)', lineHeight:1.4 }}>{f}</span>
                </div>
              ))}
            </div>

            {/* Pro */}
            <div style={{ border:`2px solid #f39c12`, borderRadius:6, padding:'10px 10px', background:'#f39c1208' }}>
              <div style={{ fontSize:12, fontWeight:900, color:'#f39c12', marginBottom:8, display:'flex', alignItems:'center', gap:5 }}>
                <PiCrownBold size={13}/> Pro
              </div>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--ink3)', marginBottom:6 }}>R$ 9,90/mês</div>
              {PRO_FEATURES.map((f, i) => (
                <div key={f} style={{ display:'flex', gap:5, alignItems:'flex-start', marginBottom:4 }}>
                  <PiCheckBold size={11} color={i >= FREE_FEATURES.length ? '#f39c12' : '#27ae60'} style={{ marginTop:2, flexShrink:0 }}/>
                  <span style={{ fontSize:10, color: i >= FREE_FEATURES.length ? '#f39c12' : 'var(--ink2)', fontWeight: i >= FREE_FEATURES.length ? 700 : 400, lineHeight:1.4 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          {isPro ? (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <div style={{ background:'#27ae6011', border:'1.5px solid #27ae6044', borderRadius:4, padding:'8px 12px', fontSize:11, color:'#27ae60', fontWeight:700, textAlign:'center' }}>
                Plano Pro ativo — obrigado pelo suporte!
              </div>
              <button type="button" className="btn" style={{ fontSize:11, justifyContent:'center', color:'var(--ink3)' }} onClick={cancelPro}>
                Cancelar plano
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-primary" style={{ justifyContent:'center', gap:6, fontSize:13 }}
              onClick={() => setShowCheckout(true)}>
              <PiCrownBold size={15}/> Ativar Pro — R$ 9,90/mês
            </button>
          )}

          <p style={{ fontSize:10, color:'var(--ink3)', margin:0, textAlign:'center' }}>
            Pagamento fictício — ambiente de testes. Nenhum valor real é cobrado.
          </p>
        </div>
      </div>

      {/* Modal de checkout */}
      {showCheckout && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card" style={{ width:'100%', maxWidth:340, padding:20, position:'relative' }}>
            <button type="button" style={{ position:'absolute', top:12, right:12, background:'none', border:'none', cursor:'pointer', color:'var(--ink3)' }} onClick={() => setShowCheckout(false)}>
              <PiXBold size={16}/>
            </button>

            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <PiCreditCardBold size={18} color="var(--gold-dk)"/>
              <span style={{ fontSize:14, fontWeight:900, color:'var(--ink)' }}>Checkout Pro</span>
            </div>

            <div style={{ background:'#f39c1211', border:'1px solid #f39c1233', borderRadius:4, padding:'8px 10px', marginBottom:14, fontSize:11, color:'#f39c12', fontWeight:700 }}>
              Ambiente de testes — use o cartão 4242 4242 4242 4242
            </div>

            <form onSubmit={handleCheckout} style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'var(--ink3)', display:'block', marginBottom:3 }}>Número do cartão</label>
                <input className="input" placeholder="4242 4242 4242 4242" value={cardNum}
                  onChange={e => setCardNum(fmtCard(e.target.value))} maxLength={19} required style={{ fontFamily:'monospace' }}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'var(--ink3)', display:'block', marginBottom:3 }}>Validade</label>
                  <input className="input" placeholder="MM/AA" value={cardExp}
                    onChange={e => setCardExp(fmtExp(e.target.value))} maxLength={5} required/>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'var(--ink3)', display:'block', marginBottom:3 }}>CVC</label>
                  <input className="input" placeholder="123" value={cardCvc}
                    onChange={e => setCardCvc(e.target.value.replace(/\D/g,'').slice(0,3))} maxLength={3} required/>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={processing}
                style={{ justifyContent:'center', marginTop:4, fontSize:13 }}>
                {processing ? 'Processando...' : <><PiCrownBold size={14}/> Assinar Pro — R$ 9,90/mês</>}
              </button>
            </form>
          </div>
        </div>
      )}
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

      // Todos os hábitos começam como não feitos — o AppContext sempre reseta
      // done:false no primeiro load, então não adianta marcar done:true aqui
      const habitsForStorage = DEMO_HABITS.map(h => ({ ...h, done: false }))

      // ──────────────────────────────────────
      // HISTÓRICO — 90 dias
      //
      // Padrão para testar os gráficos:
      //   i=1..22   → streak garantido (done > 0)   → nível "Núcleo" (22d)
      //   i=23..70  → ~75% conclusão (ativo, bom)
      //   i=71..90  → ~50% conclusão (começo do uso)
      //
      // NÃO inclui hoje: o AppContext escreve o entry de hoje sozinho
      // conforme o usuário faz hábitos. O cálculo de streak já trata o caso
      // em que hoje tem done=0 (começa a contar a partir de ontem).
      // ──────────────────────────────────────
      const HABIT_DEFS = DEMO_HABITS.map(h => ({ id: h.id, days: h.days }))

      // Semente determinística para resultados consistentes entre recargas
      let seed = 42
      function rng() { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff }

      const history = {}

      // Dias passados
      for (let i = 1; i <= 90; i++) {
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
      // JSON.stringify obrigatório: AppContext lê via loadStorage (JSON.parse)
      localStorage.setItem('nex_last_reset', JSON.stringify(today))

      // ──────────────────────────────────────
      // PLANO PRO + LOJA
      // ──────────────────────────────────────
      localStorage.setItem('nex_plan', 'pro')
      localStorage.setItem('nex_shop_owned', JSON.stringify([
        'util_calendar', 'util_mentor', 'util_progress',
        'theme_sakura', 'theme_desert', 'theme_dracula', 'theme_nord',
        'theme_midnight', 'theme_forest', 'theme_glass',
      ]))
      localStorage.setItem('nex_cal_visible', 'true')
      localStorage.setItem('nex_sound', 'true')

      // ──────────────────────────────────────
      // FINANÇAS demo — 3 meses de dados
      // ──────────────────────────────────────
      function isoFin(daysAgo = 0) {
        const d = new Date(); d.setDate(d.getDate() - daysAgo)
        return d.toISOString().slice(0, 10)
      }
      function isoMonth(monthsAgo, day) {
        const d = new Date(); d.setDate(day); d.setMonth(d.getMonth() - monthsAgo)
        return d.toISOString().slice(0, 10)
      }

      const FIN_TXS = []
      let txId = 3001

      // Salário mensal (3 meses)
      for (let m = 0; m < 3; m++) {
        FIN_TXS.push({ id: txId++, type: 'income',  desc: 'Salário',  category: 'Salário',    amount: 6800, date: isoMonth(m, 5) })
      }
      // Freelance
      FIN_TXS.push({ id: txId++, type: 'income',  desc: 'Freelance — landing page', category: 'Freelance', amount: 1200, date: isoFin(45) })
      FIN_TXS.push({ id: txId++, type: 'income',  desc: 'Freelance — consultoria',  category: 'Freelance', amount:  800, date: isoFin(12) })

      // Despesas recorrentes (3 meses)
      const REC = [
        { desc: 'Aluguel',           cat: 'Moradia',      amt: 1800 },
        { desc: 'Supermercado',      cat: 'Alimentação',  amt:  620 },
        { desc: 'Academia',          cat: 'Saúde',        amt:  110 },
        { desc: 'Plano de saúde',    cat: 'Saúde',        amt:  290 },
        { desc: 'Internet',          cat: 'Moradia',      amt:  120 },
        { desc: 'Spotify + Netflix', cat: 'Lazer',        amt:   65 },
      ]
      for (let m = 0; m < 3; m++) {
        REC.forEach((r, i) => {
          FIN_TXS.push({ id: txId++, type: 'expense', desc: r.desc, category: r.cat, amount: r.amt, date: isoMonth(m, 8 + i) })
        })
      }
      // Despesas avulsas
      const AVULSAS = [
        { desc: 'Restaurante',          cat: 'Alimentação', amt:  87, d:  3 },
        { desc: 'Uber',                 cat: 'Transporte',  amt:  23, d:  5 },
        { desc: 'Livros — Amazon',      cat: 'Educação',    amt: 134, d:  8 },
        { desc: 'Farmácia',             cat: 'Saúde',       amt:  58, d: 10 },
        { desc: 'Presente aniversário', cat: 'Outros',      amt: 150, d: 15 },
        { desc: 'Curso online',         cat: 'Educação',    amt: 297, d: 20 },
        { desc: 'Gasolina',             cat: 'Transporte',  amt: 180, d: 22 },
        { desc: 'Jantar fora',          cat: 'Alimentação', amt: 145, d: 28 },
        { desc: 'Roupas',               cat: 'Outros',      amt: 320, d: 35 },
        { desc: 'Suplemento',           cat: 'Saúde',       amt: 189, d: 40 },
        { desc: 'Cinema',               cat: 'Lazer',       amt:  60, d: 50 },
        { desc: 'Dentista',             cat: 'Saúde',       amt: 250, d: 55 },
      ]
      AVULSAS.forEach(a => {
        FIN_TXS.push({ id: txId++, type: 'expense', desc: a.desc, category: a.cat, amount: a.amt, date: isoFin(a.d) })
      })
      FIN_TXS.sort((a, b) => b.date.localeCompare(a.date))

      localStorage.setItem('nex_fin_transactions', JSON.stringify(FIN_TXS))
      localStorage.setItem('nex_fin_income',    JSON.stringify(6800))
      localStorage.setItem('nex_fin_monthgoal', JSON.stringify({ target: 1500, enabled: true }))
      localStorage.setItem('nex_fin_emergency', JSON.stringify({ current: 8400, target: 18030 }))
      localStorage.setItem('nex_fin_goals', JSON.stringify([
        { id: 4001, name: 'Viagem para Portugal', icon: '✈️', target: 12000, saved: 4200, deadline: isoFin(-180), color: '#3498db', createdAt: isoFin(60), aportes: [] },
        { id: 4002, name: 'Notebook novo',         icon: '💻', target:  5500, saved: 3800, deadline: isoFin(-60),  color: '#8e44ad', createdAt: isoFin(45), aportes: [] },
        { id: 4003, name: 'Reserva para MBA',      icon: '🎓', target: 30000, saved: 8500, deadline: isoFin(-365), color: '#27ae60', createdAt: isoFin(30), aportes: [] },
      ]))
      localStorage.setItem('nex_cats_income',  JSON.stringify(['Salário', 'Freelance', 'Investimentos', 'Outros']))
      localStorage.setItem('nex_cats_expense', JSON.stringify(['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Outros']))

      // ──────────────────────────────────────
      // DIÁRIO demo
      // ──────────────────────────────────────
      localStorage.setItem('nex_journal', JSON.stringify([
        { id: 5001, prompt: 'O que aconteceu hoje que vale guardar?', text: 'Terminei o primeiro módulo do curso de product design. Finalmente clicou o conceito de hierarquia visual.', mood: '😊', tags: ['aprendizado','design'], date: isoFin(2),  createdAt: new Date(Date.now()-2*864e5).toISOString() },
        { id: 5002, prompt: 'Qual obstáculo você superou hoje?',      text: 'Não queria ir malhar. Coloquei o tênis assim mesmo e fui. Às vezes aparecer já é o suficiente.',          mood: '💪', tags: ['exercício','disciplina'], date: isoFin(5),  createdAt: new Date(Date.now()-5*864e5).toISOString() },
        { id: 5003, prompt: 'Que escolha de hoje seu eu de amanhã vai agradecer?', text: 'Dormi cedo. Acordei com energia de verdade pela primeira vez em semanas.',                     mood: '😴', tags: ['sono','autocuidado'],    date: isoFin(8),  createdAt: new Date(Date.now()-8*864e5).toISOString() },
        { id: 5004, prompt: 'Quem fez você sorrir genuinamente hoje?', text: 'Ligação com minha mãe. Ela contou uma história ridícula do meu sobrinho e ri de verdade por uns 5 min.', mood: '😄', tags: ['família','gratidão'],     date: isoFin(12), createdAt: new Date(Date.now()-12*864e5).toISOString() },
      ]))

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

      setTimeout(() => window.location.reload(), 300)
    } else {
      [
        'nex_habits','nex_history','nex_last_reset',
        'nex_plan','nex_shop_owned','nex_cal_visible',
        'nex_fin_transactions','nex_fin_income','nex_fin_monthgoal',
        'nex_fin_emergency','nex_fin_goals','nex_cats_income','nex_cats_expense',
        'nex_journal',
        'nex_career_readings','nex_career_goals','nex_career_projects','nex_projects',
      ].forEach(k => localStorage.removeItem(k))
      setTimeout(() => window.location.reload(), 300)
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
            Preenche 90 dias de histórico com 7 hábitos completos (prioridades, reason, notas, tags, subtarefas)
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
          <span className={styles.settingIcon}><PiSparkleBold size={16}/></span>
          <div style={{ flex:1 }}>
            <span className={styles.settingLabel}>Mentor na navegação</span>
            <p className={styles.settingDesc}>Exibe o Mentor IA e Diário na barra inferior.</p>
          </div>
          <Toggle on={ownedItems.has('util_mentor')} onToggle={() => toggleNavItem('util_mentor')} label="Mentor nav"/>
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
      {(() => {
        const isPro = (localStorage.getItem('nex_plan') || 'free') === 'pro'
        return (
          <div className="card">
            <div className="card-title">
              <PiDownloadSimpleBold size={15}/> Seus Dados
              {!isPro && (
                <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, color:'var(--ink3)', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:4, padding:'2px 8px' }}>
                  Plano Pro
                </span>
              )}
            </div>
            {!isPro ? (
              <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'8px 0' }}>
                <p style={{ fontSize:12, color:'var(--ink3)', margin:0, lineHeight:1.5 }}>
                  Exportação e restauração de backup estão disponíveis no plano Pro.
                </p>
                <p style={{ fontSize:11, color:'var(--ink3)', margin:0 }}>
                  O resetar dia está disponível para todos os planos.
                </p>
              </div>
            ) : (
              <>
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
              </>
            )}
            <button className="btn btn-danger"
              style={{ width:'100%', justifyContent:'center', marginTop:6, fontSize:11 }}
              onClick={() => { if (window.confirm('Resetar todos os hábitos do dia?')) { resetDay(); toast('Dia resetado!') } }}>
              <PiArrowCounterClockwiseBold size={13}/> Resetar dia atual
            </button>
          </div>
        )
      })()}

      {/* Plano + Chave API inline nas configs */}
      <div className="card">
        <div className="card-title"><PiCrownBold size={15}/> Plano &amp; IA</div>
        <PlansCard/>
        <ApiKeyCard/>
      </div>

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
