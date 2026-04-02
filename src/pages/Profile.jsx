import { useState, useRef, useEffect, useMemo } from 'react'
import { signOut, updateProfile, updateEmail, updatePassword } from '../services/supabase'
import { MigrationModal } from '../components/MigrationModal'
import { hasLocalData, clearLocalData, deleteAllData } from '../services/syncService'
import {
  PiDownloadSimpleBold, PiUploadSimpleBold,
  PiArrowCounterClockwiseBold, PiCodeBold,
  PiSpeakerHighBold, PiSpeakerSlashBold,
  PiPencilSimpleBold, PiCheckBold,
  PiStorefrontBold, PiInfoBold, PiPaletteBold,
  PiChartBarBold, PiMedalBold, PiBriefcaseBold, PiCaretDownBold, PiRocketLaunchBold,
  PiStarBold, PiCheckCircleBold,
  PiCalendarBold, PiLockSimpleBold,
  PiKeyBold, PiEyeBold, PiEyeSlashBold,
  PiCrownBold, PiSparkleBold,
  PiTrashBold, PiEnvelopeBold,
  PiInstagramLogoFill, PiLinkedinLogoFill, PiYoutubeLogoFill, PiWhatsappLogoFill,
  PiUserCircleBold,
  PiCalculatorBold,
} from 'react-icons/pi'
import { useAuth }     from '../context/AuthContext'
import { useApp }      from '../context/AppContext'
import { useHabits }   from '../hooks/useHabits'
import { useStats }    from '../hooks/useStats'
import { calcLevel }   from '../services/levels'
import { loadStorage, saveStorage } from '../services/storage'
import { THEMES, applyTheme } from '../services/themes'
import { LegalModal, useLegal } from '../components/LegalModal'
import { ThemeSelector } from '../components/ThemeSelector'
import { ThemePersonalizer } from '../components/ThemePersonalizer'
import { toast }     from '../components/Toast'
import { playPurchaseDirect, playClickDirect } from '../hooks/useSound'
import { usePlan }   from '../hooks/usePlan'
import styles        from './Profile.module.css'

// Constantes importadas
import { SHOP_ITEMS, CAT_LABELS, CAT_DESC } from '../constants/shopConstants'
import { THEME_LIST } from '../constants/themeConstants'
import { BASE_AVATARS, SHOP_AVATAR_MAP, getAvailableAvatars } from '../constants/avatarConstants'
import { FREE_FEATURES, PRO_EXTRAS } from '../constants/planConstants'


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
// HERO CARD
// ══════════════════════════════════════
function HeroCard({ allPoints, streak, daysActive }) {
  const level = calcLevel(allPoints)
  const { user, profile, reloadProfile } = useAuth()
  const [userName,   setUserName]   = useState(() => loadStorage('nex_username', 'Usuário ../root'))
  const [userAvatar, setUserAvatar] = useState(() => loadStorage('nex_avatar', '🧑'))
  const [editing,    setEditing]    = useState(false)
  const [tempName,   setTempName]   = useState(userName)
  const [showPicker, setShowPicker] = useState(false)
  const [avatarList, setAvatarList] = useState(getAvailableAvatars)

  // Sincroniza nome e avatar do Supabase ao carregar o perfil
  useEffect(() => {
    if (profile?.username) {
      setUserName(profile.username)
      setTempName(profile.username)
      saveStorage('nex_username', profile.username)
    }
    if (profile?.avatar_emoji) {
      setUserAvatar(profile.avatar_emoji)
      saveStorage('nex_avatar', profile.avatar_emoji)
    }
  }, [profile?.username, profile?.avatar_emoji]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const refresh = () => setAvatarList(getAvailableAvatars())
    window.addEventListener('nex_shop_changed', refresh)
    return () => window.removeEventListener('nex_shop_changed', refresh)
  }, [])

  async function handleSave() {
    const name = tempName.trim() || 'Usuário Ioversoroot'
    setUserName(name); saveStorage('nex_username', name)
    setEditing(false); setShowPicker(false)
    if (user?.id) {
      await updateProfile(user.id, { username: name })
      reloadProfile()
    }
    toast('Perfil atualizado!')
  }

  async function pickAvatar(emoji) {
    setUserAvatar(emoji); saveStorage('nex_avatar', emoji)
    setShowPicker(false)
    if (user?.id) {
      await updateProfile(user.id, { avatar_emoji: emoji })
      reloadProfile()
    }
    toast('Avatar atualizado!')
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
// LOJA — dropdown animado que expande
// ao clicar no botão da seção de configs.
// Fica escondida por padrão para não
// poluir o layout do Profile.
// ══════════════════════════════════════
function RewardsShop({ allPoints, onItemBought, isOpen, onToggle, theme, setTheme }) {
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

          {/* Theme Personalizer */}
          <div style={{ padding:'11px 0', borderBottom:'1px solid var(--border)' }}>
            <ThemePersonalizer currentTheme={theme} onThemeChange={setTheme} />
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
// CONFIGURAÇÕES DE CONTA
// ══════════════════════════════════════
function AccountSettingsCard() {
  const { user, profile, reloadProfile, isLoggedIn } = useAuth()
  const [open, setOpen] = useState(false)
  const legal = useLegal()

  // Estados para trocar email
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)

  // Estados para trocar senha
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)

  // Estados para editar data de nascimento
  const [birthdate, setBirthdate] = useState('')
  const [birthdateLoading, setBirthdateLoading] = useState(false)
  const [showBirthdateForm, setShowBirthdateForm] = useState(false)

  const currentEmail = user?.email || ''
  const currentBirthdate = profile?.birthdate || null

  // Formatar data para exibição (DD/MM/AAAA)
  const formatBirthdate = (dateStr) => {
    if (!dateStr) return 'Não informada'
    try {
      const date = new Date(dateStr + 'T00:00:00')
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return 'Não informada'
    }
  }

  // Calcular idade a partir da data de nascimento
  const calculateAge = (dateStr) => {
    if (!dateStr) return null
    try {
      const today = new Date()
      const birth = new Date(dateStr + 'T00:00:00')
      const age = today.getFullYear() - birth.getFullYear() -
        (today.getMonth() < birth.getMonth() ? 1 : 0) -
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate() ? 1 : 0)
      return age
    } catch {
      return null
    }
  }

  // Sincronizar birthdate do profile ao carregar
  useEffect(() => {
    if (profile?.birthdate) {
      setBirthdate(profile.birthdate)
    }
  }, [profile?.birthdate])

  // Recarregar perfil quando os pontos são atualizados
  useEffect(() => {
    const handlePointsUpdated = (e) => {
      if (reloadProfile) {
        reloadProfile()
      }
    }

    window.addEventListener('profile-points-updated', handlePointsUpdated)
    return () => window.removeEventListener('profile-points-updated', handlePointsUpdated)
  }, [reloadProfile])

  async function handleEmailChange(e) {
    e.preventDefault()
    if (!newEmail.trim()) {
      toast('Digite o novo e-mail.')
      return
    }
    if (newEmail === currentEmail) {
      toast('O novo e-mail é igual ao atual.')
      return
    }

    setEmailLoading(true)
    try {
      const { error } = await updateEmail(newEmail)
      if (error) {
        toast('Erro ao atualizar e-mail: ' + error.message)
        return
      }
      toast('E-mail atualizado! Verifique sua caixa de entrada para confirmar.')
      setShowEmailForm(false)
      setNewEmail('')
    } catch (err) {
      toast('Erro ao atualizar e-mail. Tente novamente.')
    } finally {
      setEmailLoading(false)
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    if (!currentPassword) {
      toast('Digite a senha atual.')
      return
    }
    if (newPassword.length < 6) {
      toast('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast('As senhas não coincidem.')
      return
    }

    setPasswordLoading(true)
    try {
      const { error } = await updatePassword(newPassword)
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast('Senha atual incorreta.')
        } else {
          toast('Erro ao atualizar senha: ' + error.message)
        }
        return
      }
      toast('Senha atualizada com sucesso!')
      setShowPasswordForm(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast('Erro ao atualizar senha. Tente novamente.')
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handleBirthdateChange(e) {
    e.preventDefault()
    if (!birthdate) {
      toast('Selecione uma data de nascimento.')
      return
    }

    // Validar idade - usuário deve ter pelo menos 13 anos (COPPA)
    const today = new Date()
    const birth = new Date(birthdate)
    const age = today.getFullYear() - birth.getFullYear() -
      (today.getMonth() < birth.getMonth() ? 1 : 0) -
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate() ? 1 : 0)

    if (age < 13) {
      toast('Você deve ter pelo menos 13 anos para usar o app.')
      return
    }

    if (age > 150) {
      toast('Data de nascimento inválida.')
      return
    }

    setBirthdateLoading(true)
    try {
      const { error } = await updateProfile(user.id, { birthdate })
      if (error) {
        toast('Erro ao atualizar data de nascimento: ' + error.message)
        return
      }
      toast('Data de nascimento atualizada com sucesso!')
      setShowBirthdateForm(false)
      reloadProfile()
    } catch (err) {
      toast('Erro ao atualizar data de nascimento. Tente novamente.')
    } finally {
      setBirthdateLoading(false)
    }
  }

  return (
    <div className={styles.shopWrapper}>
      <div className={styles.shopTrigger} onClick={() => setOpen(o => !o)} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}>
        <span className={styles.settingIcon}><PiLockSimpleBold size={16}/></span>
        <div style={{ flex:1 }}>
          <span className={styles.settingLabel}>Configurações de conta</span>
          <p className={styles.settingDesc}>
            Alterar e-mail, senha e data de nascimento
          </p>
        </div>
        <span className={`${styles.shopArrow} ${open ? styles.shopArrowOpen : ''}`}>
          <PiCaretDownBold size={14}/>
        </span>
      </div>

      <div className={`${styles.shopDrawer} ${open ? styles.shopDrawerOpen : ''}`}>
        <div className={styles.shopDrawerInner} style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* E-mail atual */}
          <div style={{ background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:4, padding:'10px 12px' }}>
            <p style={{ fontSize:10, fontWeight:700, color:'var(--ink2)', margin:'0 0 4px 0', textTransform:'uppercase', letterSpacing:'0.8px' }}>
              E-mail atual
            </p>
            <p style={{ fontSize:13, color:'var(--ink)', margin:0, wordBreak:'break-all' }}>
              {currentEmail}
            </p>
          </div>

          {/* Trocar e-mail */}
          {!showEmailForm ? (
            <button
              type="button"
              className="btn"
              style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center', fontSize:12 }}
              onClick={() => setShowEmailForm(true)}>
              <PiEnvelopeBold size={14}/> Trocar e-mail
            </button>
          ) : (
            <form onSubmit={handleEmailChange} style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'var(--ink2)', display:'block', marginBottom:4 }}>
                  Novo e-mail
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="novo@email.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  autoComplete="email"
                  style={{ fontSize:12 }}
                />
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={emailLoading}
                  style={{ flex:1, fontSize:12 }}>
                  {emailLoading ? 'Atualizando...' : 'Salvar'}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => { setShowEmailForm(false); setNewEmail('') }}
                  style={{ fontSize:12 }}>
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Data de nascimento */}
          <div style={{ background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:4, padding:'10px 12px' }}>
            <p style={{ fontSize:10, fontWeight:700, color:'var(--ink2)', margin:'0 0 4px 0', textTransform:'uppercase', letterSpacing:'0.8px' }}>
              Data de nascimento
            </p>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
              <div>
                <p style={{ fontSize:13, color:'var(--ink)', margin:0 }}>
                  {formatBirthdate(currentBirthdate)}
                </p>
                {calculateAge(currentBirthdate) && (
                  <p style={{ fontSize:11, color:'var(--ink2)', margin:'2px 0 0 0' }}>
                    {calculateAge(currentBirthdate)} anos
                  </p>
                )}
              </div>
              {!showBirthdateForm ? (
                <button
                  type="button"
                  className="btn"
                  style={{ padding:'6px 10px', fontSize:11 }}
                  onClick={() => { setBirthdate(currentBirthdate || ''); setShowBirthdateForm(true) }}>
                  <PiPencilSimpleBold size={13}/> Editar
                </button>
              ) : (
                <button
                  type="button"
                  className="btn"
                  style={{ padding:'6px 10px', fontSize:11 }}
                  onClick={() => { setShowBirthdateForm(false); setBirthdate(currentBirthdate || '') }}>
                  Cancelar
                </button>
              )}
            </div>
          </div>

          {showBirthdateForm && (
            <form onSubmit={handleBirthdateChange} style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'var(--ink2)', display:'block', marginBottom:4 }}>
                  Nova data de nascimento
                </label>
                <input
                  className="input"
                  type="date"
                  value={birthdate}
                  onChange={e => setBirthdate(e.target.value)}
                  autoComplete="bday"
                  max={new Date().toISOString().split('T')[0]}
                  style={{ fontSize:12 }}
                />
                <p style={{ fontSize:10, color:'var(--ink3)', margin:'4px 0 0 0', lineHeight:1.4 }}>
                  Você deve ter pelo menos 13 anos para usar o app.
                </p>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={birthdateLoading}
                  style={{ flex:1, fontSize:12 }}>
                  {birthdateLoading ? 'Atualizando...' : 'Salvar'}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => { setShowBirthdateForm(false); setBirthdate(currentBirthdate || '') }}
                  style={{ fontSize:12 }}>
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Pontos (io) - apenas para usuários logados */}
          {isLoggedIn && (
            <div style={{ background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:4, padding:'10px 12px' }}>
              <p style={{ fontSize:10, fontWeight:700, color:'var(--ink2)', margin:'0 0 4px 0', textTransform:'uppercase', letterSpacing:'0.8px' }}>
                Pontos totais (io)
              </p>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                <div>
                  <p style={{ fontSize:13, color:'var(--ink)', margin:0 }}>
                    {profile?.points ?? 0} io
                  </p>
                  <p style={{ fontSize:11, color:'var(--ink2)', margin:'2px 0 0 0' }}>
                    Armazenados na nuvem
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Divider */}
          <div style={{ height:1, background:'var(--border)', margin:'4px 0' }} />

          {/* Trocar senha */}
          {!showPasswordForm ? (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <button
                type="button"
                className="btn"
                style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center', fontSize:12 }}
                onClick={() => setShowPasswordForm(true)}>
                <PiLockSimpleBold size={14}/> Trocar senha
              </button>
              <p style={{ fontSize:10, color:'var(--ink3)', margin:0, textAlign:'center', lineHeight:1.4 }}>
                Você precisa digitar sua senha atual para trocá-la.
              </p>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ background:'#fffbf0', border:'1px solid var(--gold-dk)', borderRadius:4, padding:'8px 10px' }}>
                <p style={{ fontSize:11, color:'var(--ink)', margin:0, lineHeight:1.5 }}>
                  💡 <strong>Esqueceu sua senha?</strong> Saia da conta e use a opção "Esqueceu a senha?" na tela de login para redefinir sem precisar da senha atual.
                </p>
              </div>

              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'var(--ink2)', display:'block', marginBottom:4 }}>
                  Senha atual
                </label>
                <input
                  className="input"
                  type={showPasswords ? 'text' : 'password'}
                  placeholder="Digite sua senha atual"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ fontSize:12 }}
                />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'var(--ink2)', display:'block', marginBottom:4 }}>
                  Nova senha
                </label>
                <input
                  className="input"
                  type={showPasswords ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  style={{ fontSize:12 }}
                />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'var(--ink2)', display:'block', marginBottom:4 }}>
                  Confirmar nova senha
                </label>
                <input
                  className="input"
                  type={showPasswords ? 'text' : 'password'}
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  style={{ fontSize:12 }}
                />
              </div>
              <button
                type="button"
                className="btn"
                style={{ fontSize:11, color:'var(--ink2)', display:'flex', alignItems:'center', gap:6 }}
                onClick={() => setShowPasswords(v => !v)}>
                {showPasswords ? <PiEyeSlashBold size={12}/> : <PiEyeBold size={12}/>}
                {showPasswords ? 'Ocultar senhas' : 'Mostrar senhas'}
              </button>
              <div style={{ display:'flex', gap:8 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={passwordLoading}
                  style={{ flex:1, fontSize:12 }}>
                  {passwordLoading ? 'Atualizando...' : 'Salvar'}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => { setShowPasswordForm(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') }}
                  style={{ fontSize:12 }}>
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Termos e Privacidade */}
          <div style={{ height:1, background:'var(--border)', margin:'4px 0' }} />
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <p style={{ fontSize:10, fontWeight:700, color:'var(--ink2)', margin:0, textTransform:'uppercase', letterSpacing:'0.8px' }}>
              Legal
            </p>
            <div style={{ display:'flex', gap:8 }}>
              <button type="button" className="btn" style={{ flex:1, fontSize:11, justifyContent:'center' }} onClick={legal.openTermos}>
                Termos de Uso
              </button>
              <button type="button" className="btn" style={{ flex:1, fontSize:11, justifyContent:'center' }} onClick={legal.openPrivacidade}>
                Privacidade
              </button>
              <button type="button" className="btn" style={{ flex:1, fontSize:11, justifyContent:'center' }} onClick={legal.openCookies}>
                Cookies
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// SELETOR DE TEMAS — lista horizontal compacta
// Aparência integrada diretamente nas configs,
// sem card separado visualmente pesado.
// ══════════════════════════════════════

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
// PLANOS — cartão de upgrade
// ══════════════════════════════════════
function PlansCard() {
  const { isPro, cancelPro } = usePlan()

  return (
    <div className={styles.shopWrapper}>
      <div className={styles.shopTrigger} role="button" tabIndex={0}>
        <span className={styles.settingIcon}><PiCrownBold size={16}/></span>
        <div style={{ flex:1 }}>
          <span className={styles.settingLabel}>Plano Pro</span>
          <p className={styles.settingDesc}>
            {isPro ? 'Plano ativo — obrigado pelo suporte!' : 'Desbloqueie recursos avançados'}
          </p>
        </div>
      </div>

      <div className={styles.shopDrawerOpen}>
        <div className={styles.shopDrawerInner}>
          {/* Grade de planos */}
          <div className={styles.plansGrid}>
            {/* Gratuito */}
            <div className={styles.planCard}>
              <div className={styles.planTop}>
                <div className={isPro ? styles.planBadge : `${styles.planBadge} ${styles.planBadgeActive}`}>
                  {!isPro && <PiCheckBold size={8}/>} {isPro ? 'GRATUITO' : 'ATUAL'}
                </div>
                <div className={styles.planName}>Gratuito</div>
                <div>
                  <span className={styles.planPrice}>R$ 0</span>
                  <span className={styles.planPriceUnit}>/mês</span>
                </div>
              </div>
              <div className={styles.planFeatures}>
                {FREE_FEATURES.map(f => (
                  <div key={f} className={styles.planFeature}>
                    <PiCheckBold size={10} color="#27ae60" style={{ marginTop: 2, flexShrink: 0 }}/>
                    <span className={styles.planFeatureText}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro */}
            <div className={`${styles.planCard} ${styles.planCardPro}`}>
              <div className={styles.planTop}>
                <div className={isPro ? `${styles.planBadge} ${styles.planBadgeActive}` : `${styles.planBadge} ${styles.planBadgePro}`}>
                  {isPro ? <><PiCheckBold size={8}/> ATUAL</> : <><PiCrownBold size={8}/> PRO</>}
                </div>
                <div className={`${styles.planName} ${styles.planNamePro}`}>
                  <PiCrownBold size={13}/> Pro
                </div>
                <div>
                  <span className={styles.planPrice} style={{ color: '#f39c12' }}>R$ 9,90</span>
                  <span className={styles.planPriceUnit}>/mês</span>
                </div>
              </div>
              <div className={styles.planFeatures}>
                <div className={styles.planSectionLabel}>Tudo do Gratuito, mais:</div>
                {PRO_EXTRAS.map(f => (
                  <div key={f} className={styles.planFeature}>
                    <PiCheckBold size={10} color="#f39c12" style={{ marginTop: 2, flexShrink: 0 }}/>
                    <span className={styles.planFeatureHighlight}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          {isPro ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className={styles.planProActive}>
                Plano Pro ativo — obrigado pelo suporte!
              </div>
              <button type="button" className="btn"
                style={{ fontSize: 11, justifyContent: 'center', color: 'var(--ink3)' }}
                onClick={cancelPro}>
                Cancelar plano
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <stripe-buy-button
                buy-button-id="buy_btn_1THf7tAh9kVNzJGC4tx1K4fy"
                publishable-key="pk_live_51RIA2CAh9kVNzJGCuXxsjXs2oYkHoW9hKiXed7CMYuqxofzyZtSCBL4ya5J4ZLnkUbHWWOHY2qTgB19AH2bvrquQ00pXFWSvyl"
              />
            </div>
          )}

          <p className={styles.plansNote}>
            Pagamento seguro via Stripe. Ativação instantânea do plano Pro.
          </p>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// PROFILE — PÁGINA PRINCIPAL
// ══════════════════════════════════════
export default function Profile({ onNavigate }) {
  const { habits, history, theme, setTheme, soundOn, setSoundOn, resetDay } = useApp()
  const { allPoints } = useHabits()
  const { streak, daysActive } = useStats(history)
  const { can }                = usePlan()

  const { isLoggedIn, user, profile } = useAuth()
  const [shopOpen,          setShopOpen]          = useState(false)
  const [showLogoutModal,      setShowLogoutModal]      = useState(false)
  const [showGuestExitModal,   setShowGuestExitModal]   = useState(false)
  const [showMigrationModal,setShowMigrationModal] = useState(false)
  const [showDeleteModal,   setShowDeleteModal]    = useState(false)
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

      {/* Configurações — inclui aparência e loja inline */}
      <div className="card">
        <div className="card-title"><PiCodeBold size={15}/> Configurações</div>

        {/* Aparência — tema como linha compacta */}
        <div style={{ padding:'11px 0', borderBottom:'1px solid var(--border)' }}>
          <ThemeSelector
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
          theme={theme}
          setTheme={setTheme}
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
          <span className={styles.settingIcon}><PiCalculatorBold size={16}/></span>
          <div style={{ flex:1 }}>
            <span className={styles.settingLabel}>Calculadora na navegação</span>
            <p className={styles.settingDesc}>Exibe a Calculadora na barra inferior.</p>
          </div>
          <Toggle on={ownedItems.has('util_calculator')} onToggle={() => toggleNavItem('util_calculator')} label="Calculator nav"/>
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
        const canExport = can('export_json')
        return (
          <div className="card">
            <div className="card-title">
              <PiDownloadSimpleBold size={15}/> Seus Dados
              {!canExport && (
                <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, color:'var(--ink3)', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:4, padding:'2px 8px' }}>
                  Plano Pro
                </span>
              )}
            </div>
            {!canExport ? (
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

      {/* Configurações de conta */}
      <div className="card">
        <div className="card-title"><PiLockSimpleBold size={15}/> Configurações de conta</div>
        <AccountSettingsCard/>
      </div>
 
      {/* Footer */}
      <div className={styles.footer}>

        {/* Marca */}
        <img src="/icons/icon.svg" alt="Rootio" width={90} height={90} className={styles.brandLogo} />
        <p className={styles.footerTagline}>Evolua com consistência, um dia de cada vez.</p>


        {/* Redes sociais */}
        <div className={styles.footerSocial}>
          <a href="https://instagram.com/rootioverso" target="_blank" rel="noopener noreferrer" className={styles.footerSocialBtn} aria-label="Instagram">
            <PiInstagramLogoFill size={18}/>
          </a>
          <a href="https://linkedin.com/company/rootioverso" target="_blank" rel="noopener noreferrer" className={styles.footerSocialBtn} aria-label="LinkedIn">
            <PiLinkedinLogoFill size={18}/>
          </a>
        </div>



        <p className={styles.footerCopy}>© 2026 Rootio · Todos os direitos reservados</p>
        <p className={styles.footerVersion}>v2.0.0</p>
      </div>

      {/* Botão de migração - visível para todos, desabilitado para Free */}
      {hasLocalData() && (
        <button type="button"
          className={`${styles.logoutBtn} ${styles.migrateDataBtn} ${!can('data_migration') ? styles.disabledBtn : ''}`}
          disabled={!can('data_migration')}
          onClick={() => can('data_migration') && setShowMigrationModal(true)}
          title={can('data_migration') ? 'Migrar dados para a nuvem' : 'Disponível apenas no plano Pro'}>
          <PiUploadSimpleBold size={14}/> Migrar dados locais
          {!can('data_migration') && <span className={styles.proBadge}>PRO</span>}
        </button>
      )}

      {/* Login / Logout */}
      {isLoggedIn ? (
        <>
          <button type="button" className={styles.logoutBtn} onClick={() => setShowLogoutModal(true)}>
            Sair da conta
          </button>
          <button type="button" className={`${styles.logoutBtn} ${styles.deleteDataBtn}`}
            onClick={() => setShowDeleteModal(true)}>
            <PiTrashBold size={14}/> Apagar meus dados
          </button>
        </>
      ) : (
        <>
          <button type="button" className={`${styles.logoutBtn} ${styles.loginBtn}`}
            onClick={() => {
              localStorage.removeItem('ior_auth_skipped')
              window.location.reload()
            }}>
            <PiUserCircleBold size={15}/> Entrar na conta
          </button>
          <button type="button" className={styles.logoutBtn}
            onClick={() => setShowGuestExitModal(true)}>
            Sair da conta
          </button>
        </>
      )}

      {showMigrationModal && (
        <MigrationModal
          userId={user?.id}
          onDone={() => setShowMigrationModal(false)}
        />
      )}

        {showLogoutModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1200,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}>
            <div className="card" style={{ width: '100%', maxWidth: 320, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--ink)', margin: 0 }}>Tem certeza que deseja sair?</p>
              <p style={{ fontSize: 13, color: 'var(--ink2)', margin: 0, lineHeight: 1.6 }}>
                Você será desconectado desta conta. Seus dados continuam salvos na nuvem e estarão disponíveis ao entrar novamente.
              </p>
              <button type="button" className="btn btn-primary" style={{ justifyContent: 'center', fontSize: 13, background: '#e74c3c', borderColor: '#c0392b' }}
                onClick={async () => {
                  setShowLogoutModal(false)
                  await signOut()
                }}>
                Sair da conta
              </button>
              <button type="button" className="btn" style={{ justifyContent: 'center', fontSize: 13, border: '1.5px solid var(--border)', color: 'var(--ink3)' }}
                onClick={() => setShowLogoutModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
        
       

      {showGuestExitModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1200,
          background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 340, padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--ink)', margin: 0 }}>Sair do modo local?</p>
            <p style={{ fontSize: 13, color: 'var(--ink2)', margin: 0, lineHeight: 1.5 }}>
              Você está usando o app sem uma conta. Escolha o que fazer com seus dados:
            </p>
            <button type="button" className="btn btn-primary"
              style={{ justifyContent: 'center', fontSize: 13 }}
              onClick={() => {
                setShowGuestExitModal(false)
                localStorage.removeItem('ior_auth_skipped')
                window.location.reload()
              }}>
              Manter dados localmente
            </button>
            <button type="button" className="btn"
              style={{ justifyContent: 'center', fontSize: 13, background: '#fdf2f2', color: '#c0392b', borderColor: '#e74c3c' }}
              onClick={() => {
                setShowGuestExitModal(false)
                clearLocalData()
                localStorage.removeItem('ior_auth_skipped')
                window.location.reload()
              }}>
              <PiTrashBold size={14}/> Apagar tudo e sair
            </button>
            <button type="button" className="btn"
              style={{ justifyContent: 'center', fontSize: 13, border: '1.5px solid var(--border)', color: 'var(--ink3)' }}
              onClick={() => setShowGuestExitModal(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal de apagar dados (LGPD) */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1200,
          background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 340, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--ink)', margin: 0 }}>Apagar todos os dados?</p>
            <p style={{ fontSize: 13, color: 'var(--ink2)', margin: 0, lineHeight: 1.5 }}>
              Esta ação irá apagar <strong>todos os seus dados</strong> do dispositivo e da nuvem permanentemente. Esta ação não pode ser desfeita.
            </p>
            <p style={{ fontSize: 12, color: 'var(--ink3)', margin: 0, lineHeight: 1.5 }}>
              Inclui: hábitos, transações, metas, projetos, diário e configurações.
            </p>
            <button type="button" className="btn btn-primary"
              style={{ justifyContent: 'center', fontSize: 13, background: '#e74c3c', borderColor: '#c0392b' }}
              onClick={async () => {
                setShowDeleteModal(false)
                const result = await deleteAllData(user?.id)
                if (result.success) {
                  toast('Todos os dados foram apagados com sucesso.')
                  await signOut()
                } else {
                  toast('Erro ao apagar dados: ' + result.errors.join(', '))
                }
              }}>
              <PiTrashBold size={14}/> Sim, apagar tudo
            </button>
            <button type="button" className="btn"
              style={{ justifyContent: 'center', fontSize: 13, border: '1.5px solid var(--border)', color: 'var(--ink3)' }}
              onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {legal.openDoc && <LegalModal doc={legal.openDoc} onClose={legal.close}/>}
    </div>
  )
}
