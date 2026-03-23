import { useState, useMemo, useEffect, useRef } from 'react'
import {
  PiWalletBold, PiPlusBold, PiTrendUpBold, PiTrendDownBold,
  PiTargetBold, PiShieldBold, PiTrashBold,
  PiXBold, PiCheckBold, PiArrowUpRightBold, PiArrowDownLeftBold,
  PiCalendarBold, PiLightbulbBold,
  PiFloppyDiskBold, PiPencilSimpleBold,
  PiLockSimpleBold, PiCaretLeftBold, PiCaretRightBold,
  PiTrophyBold, PiAirplaneBold, PiLaptopBold, PiHouseBold,
  PiCarBold, PiGraduationCapBold, PiDiamondBold, PiBarbellBold,
  PiMusicNotesBold, PiDeviceMobileBold, PiGlobeBold, PiShoppingCartBold,
  PiPlantBold, PiHandFistBold,
} from 'react-icons/pi'
import { toast } from '../components/Toast'
import { playSaveDirect, playErrorDirect } from '../hooks/useSound'
import styles from './Finance.module.css'

// ══════════════════════════════════════
// STORAGE
// ══════════════════════════════════════
const KEYS = {
  transactions: 'nex_fin_transactions',
  goals:        'nex_fin_goals',
  emergency:    'nex_fin_emergency',
  income:       'nex_fin_income',
  monthGoal:    'nex_fin_monthgoal',
}

function load(key, fb) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb } catch { return fb }
}
function save(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)) } catch {}
}

// ══════════════════════════════════════
// CONSTANTES
// ══════════════════════════════════════
const DEFAULT_INCOME_CATS  = ['Salário', 'Freelance', 'Investimentos', 'Aluguel', 'Outros']
const DEFAULT_EXPENSE_CATS = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Assinaturas', 'Outros']

function getCustomCats(type) {
  try {
    const key   = type === 'income' ? 'nex_cats_income' : 'nex_cats_expense'
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : (type === 'income' ? DEFAULT_INCOME_CATS : DEFAULT_EXPENSE_CATS)
  } catch { return type === 'income' ? DEFAULT_INCOME_CATS : DEFAULT_EXPENSE_CATS }
}
function saveCustomCats(type, cats) {
  const key = type === 'income' ? 'nex_cats_income' : 'nex_cats_expense'
  localStorage.setItem(key, JSON.stringify(cats))
}

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
function todayISO() { return new Date().toISOString().slice(0, 10) }
function fmt(n) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)
}
function fmtK(n) {
  const abs = Math.abs(n || 0)
  if (abs >= 1000) return `${(n / 1000).toFixed(1).replace('.', ',')}k`
  return String(Math.round(n || 0))
}
function daysLeft(isoDate) {
  if (!isoDate) return null
  return Math.round((new Date(isoDate + 'T00:00:00') - new Date()) / 86_400_000)
}

// ══════════════════════════════════════
// ÍCONES DE META
// ══════════════════════════════════════
const ICON_OPTS = [
  { key: 'target',  Icon: PiTargetBold },
  { key: 'plane',   Icon: PiAirplaneBold },
  { key: 'laptop',  Icon: PiLaptopBold },
  { key: 'house',   Icon: PiHouseBold },
  { key: 'car',     Icon: PiCarBold },
  { key: 'grad',    Icon: PiGraduationCapBold },
  { key: 'diamond', Icon: PiDiamondBold },
  { key: 'barbell', Icon: PiBarbellBold },
  { key: 'music',   Icon: PiMusicNotesBold },
  { key: 'mobile',  Icon: PiDeviceMobileBold },
  { key: 'globe',   Icon: PiGlobeBold },
  { key: 'cart',    Icon: PiShoppingCartBold },
]
function GoalIcon({ iconKey, size = 18 }) {
  const opt = ICON_OPTS.find(o => o.key === iconKey) || ICON_OPTS[0]
  return <opt.Icon size={size}/>
}

function getInsight(totalIn, totalOut, balance, transactions) {
  if (!transactions.length) return null
  if (totalIn === 0 && totalOut === 0) return null
  if (balance < 0) return `Suas saídas superaram as entradas em ${fmt(Math.abs(balance))}. Considere revisar os gastos.`
  if (totalOut === 0) return 'Ótimo começo! Continue registrando suas movimentações.'
  const pct = totalIn > 0 ? Math.round((1 - totalOut / totalIn) * 100) : 0
  if (pct >= 30) return `Excelente! Você está economizando ${pct}% da renda este mês.`
  if (pct >= 10) return `Bom ritmo. Você está economizando ${pct}% do que entrou.`
  return `Você gastou ${Math.round(totalOut / totalIn * 100)}% do que entrou. Tente guardar um pouco mais.`
}

// ══════════════════════════════════════
// HOOK — estado financeiro global
// ══════════════════════════════════════
function useFinance() {
  const [transactions, setTransactions] = useState(() => load(KEYS.transactions, []))
  const [goals,        setGoals]        = useState(() => load(KEYS.goals,        []))
  const [monthIncome,  setMonthIncome]  = useState(() => load(KEYS.income,       0))
  const [emergency,    setEmergency]    = useState(() => load(KEYS.emergency,    { target: 0, current: 0 }))
  const [monthGoal,    setMonthGoalSt]  = useState(() => load(KEYS.monthGoal,    { target: 0, enabled: false }))

  function addTransaction(tx) {
    const updated = [{ ...tx, id: Date.now() }, ...transactions]
    setTransactions(updated); save(KEYS.transactions, updated)
  }
  function removeTransaction(id) {
    const updated = transactions.filter(t => t.id !== id)
    setTransactions(updated); save(KEYS.transactions, updated)
  }
  function editTransaction(id, changes) {
    const updated = transactions.map(t => t.id === id ? { ...t, ...changes } : t)
    setTransactions(updated); save(KEYS.transactions, updated)
  }
  function addGoal(g) {
    const updated = [...goals, { ...g, id: Date.now(), saved: 0, aportes: [] }]
    setGoals(updated); save(KEYS.goals, updated)
  }
  function updateGoalSaved(id, amount) {
    const updated = goals.map(g => {
      if (g.id !== id) return g
      const aporte = { id: Date.now(), amount, date: new Date().toISOString().slice(0, 10) }
      return { ...g, saved: Math.min((g.saved || 0) + amount, g.target), aportes: [...(g.aportes || []), aporte] }
    })
    setGoals(updated); save(KEYS.goals, updated)
  }
  function undoLastAporte(id) {
    const updated = goals.map(g => {
      if (g.id !== id) return g
      const aportes = g.aportes || []
      if (!aportes.length) return g
      const last = aportes[aportes.length - 1]
      return { ...g, saved: Math.max(0, (g.saved || 0) - last.amount), aportes: aportes.slice(0, -1) }
    })
    setGoals(updated); save(KEYS.goals, updated)
    toast('Último aporte desfeito.')
  }
  function removeGoal(id) {
    const updated = goals.filter(g => g.id !== id)
    setGoals(updated); save(KEYS.goals, updated)
  }
  function saveMonthIncome(v) { setMonthIncome(v); save(KEYS.income, v) }
  function saveEmergency(e)   { setEmergency(e);   save(KEYS.emergency, e) }
  function saveMonthGoal(g)   { setMonthGoalSt(g); save(KEYS.monthGoal, g) }

  const now       = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthTx   = transactions.filter(t => t.date?.startsWith(thisMonth))
  const totalIn   = monthTx.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0)
  const totalOut  = monthTx.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0)
  const balance   = totalIn - totalOut

  const last6 = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d   = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const txs = transactions.filter(t => t.date?.startsWith(key))
      const inc = txs.filter(t => t.type === 'income').reduce((a, t)  => a + t.amount, 0)
      const exp = txs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0)
      return { label: MONTHS[d.getMonth()], inc, exp, balance: inc - exp }
    })
  }, [transactions])

  const avgMonthlyExpense = useMemo(() => {
    const expenseTx = transactions.filter(t => t.type === 'expense')
    const months    = [...new Set(expenseTx.map(t => t.date?.slice(0, 7)).filter(Boolean))]
    if (!months.length) return monthIncome * 0.7
    const total = expenseTx.reduce((a, t) => a + t.amount, 0)
    return total / months.length
  }, [transactions, monthIncome])

  const emergencyIdeal = avgMonthlyExpense * 6

  return {
    transactions, goals, monthIncome, emergency, monthGoal,
    addTransaction, removeTransaction, editTransaction,
    addGoal, updateGoalSaved, removeGoal, undoLastAporte,
    saveMonthIncome, saveEmergency, saveMonthGoal,
    totalIn, totalOut, balance, last6, avgMonthlyExpense, emergencyIdeal,
  }
}

// ══════════════════════════════════════
// BLOCO 1 — AÇÃO PRINCIPAL
// ══════════════════════════════════════
function ActionBlock({ balance, totalIn, totalOut, transactions, onAddIncome, onAddExpense }) {
  const prevBal  = useRef(balance)
  const [pulse, setPulse] = useState(null) // 'up' | 'down' | null

  useEffect(() => {
    if (prevBal.current === balance) return
    setPulse(balance > prevBal.current ? 'up' : 'down')
    prevBal.current = balance
    const t = setTimeout(() => setPulse(null), 900)
    return () => clearTimeout(t)
  }, [balance])

  const insight = getInsight(totalIn, totalOut, balance, transactions)

  return (
    <div className={`card ${styles.actionCard}`}>
      {/* Saldo hero */}
      <div className={`${styles.balanceHero} ${pulse === 'up' ? styles.balancePulseUp : pulse === 'down' ? styles.balancePulseDown : ''}`}>
        <span className={styles.balanceLbl}>Saldo do mês</span>
        <span className={`${styles.balanceVal} ${balance >= 0 ? styles.balanceValPos : styles.balanceValNeg} ${pulse ? styles.balanceValAnim : ''}`}>
          {fmt(balance)}
        </span>
      </div>

      {/* CTAs */}
      <div className={styles.actionBtns}>
        <button type="button" className={`${styles.actionBtn} ${styles.actionBtnIn}`} onClick={onAddIncome}>
          <PiArrowUpRightBold size={16}/> + Entrada
        </button>
        <button type="button" className={`${styles.actionBtn} ${styles.actionBtnOut}`} onClick={onAddExpense}>
          <PiArrowDownLeftBold size={16}/> + Saída
        </button>
      </div>

      {/* Insight */}
      {insight && (
        <div className={styles.insightBox}>
          <PiLightbulbBold size={13} color="var(--gold-dk)"/>
          <span>{insight}</span>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// BLOCO 2 — RESUMO FINANCEIRO
// ══════════════════════════════════════
function SummaryRow({ totalIn, totalOut }) {
  return (
    <div className={`card ${styles.summaryCard}`}>
      <div className={styles.summaryRow}>
        <div className={styles.summaryItem}>
          <PiArrowUpRightBold size={14} color="#27ae60"/>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLbl}>Entradas</span>
            <span className={`${styles.summaryVal} ${styles.summaryValIn}`}>{fmt(totalIn)}</span>
          </div>
        </div>
        <div className={styles.summaryDivider}/>
        <div className={styles.summaryItem}>
          <PiArrowDownLeftBold size={14} color="#e74c3c"/>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLbl}>Saídas</span>
            <span className={`${styles.summaryVal} ${styles.summaryValOut}`}>{fmt(totalOut)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// COMPONENTE: Formulário de transação
// ══════════════════════════════════════
function AddTransactionForm({ onAdd, onClose, defaultType = 'expense' }) {
  const [type,       setType]       = useState(defaultType)
  const [amount,     setAmount]     = useState('')
  const [desc,       setDesc]       = useState('')
  const [category,   setCategory]   = useState('')
  const [date,       setDate]       = useState(todayISO())
  const [editingCat, setEditingCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [cats,       setCats]       = useState(() => getCustomCats(defaultType))

  function switchType(t) {
    setType(t); setCategory('')
    setCats(getCustomCats(t))
  }

  function addCat() {
    const n = newCatName.trim()
    if (!n || cats.includes(n)) { setEditingCat(false); return }
    const next = [...cats, n]
    setCats(next); saveCustomCats(type, next)
    setCategory(n); setNewCatName(''); setEditingCat(false)
  }

  function removeCat(cat) {
    const next = cats.filter(c => c !== cat)
    setCats(next); saveCustomCats(type, next)
    if (category === cat) setCategory('')
  }

  function submit() {
    const v = parseFloat(amount.replace(',', '.'))
    if (isNaN(v) || v <= 0) { playErrorDirect(); toast('Informe um valor válido'); return }
    if (!desc.trim())        { playErrorDirect(); toast('Informe uma descrição');   return }
    if (!category)           { playErrorDirect(); toast('Selecione a categoria');   return }
    navigator.vibrate?.(50)
    playSaveDirect()
    onAdd({ type, amount: v, desc: desc.trim(), category, date })
    toast(type === 'income'
      ? `+ ${fmt(v)} adicionados`
      : `- ${fmt(v)} registrado`)
    onClose()
  }

  return (
    <div className={styles.inlineForm}>
      <div className={styles.formHeader}>
        <span className={styles.formTitle}>
          {type === 'income' ? 'Nova entrada' : 'Nova saída'}
        </span>
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          <PiXBold size={15}/>
        </button>
      </div>

      <div className={styles.typeRow}>
        {[
          { id:'income',  label:'Entrada', Icon:PiTrendUpBold },
          { id:'expense', label:'Saída',   Icon:PiTrendDownBold },
        ].map(t => (
          <button key={t.id} type="button"
            className={`${styles.typeBtn} ${type === t.id ? (t.id === 'income' ? styles.typeBtnIn : styles.typeBtnOut) : ''}`}
            onClick={() => switchType(t.id)}>
            <t.Icon size={14}/> {t.label}
          </button>
        ))}
      </div>

      <input className="input" placeholder="Valor (R$)" value={amount} inputMode="decimal" autoFocus
        onChange={e => setAmount(e.target.value.replace(/[^0-9,.]/,''))}/>

      <input className="input" placeholder="Descrição" value={desc}
        onChange={e => setDesc(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}/>

      <div className={styles.catEditWrap}>
        <div className={styles.catChips}>
          {cats.map(cat => (
            <div key={cat}
              className={`${styles.catChip} ${category === cat ? styles.catChipSel : ''}`}
              onClick={() => setCategory(cat)}>
              {cat}
              <button type="button" className={styles.catChipDel}
                onClick={e => { e.stopPropagation(); removeCat(cat) }}>×</button>
            </div>
          ))}
          {editingCat ? (
            <div className={styles.catNewInline}>
              <input className={styles.catNewInput} value={newCatName} autoFocus placeholder="Nova..."
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCat(); if (e.key === 'Escape') setEditingCat(false) }}/>
              <button type="button" className={styles.catNewOk} onClick={addCat}>✓</button>
            </div>
          ) : (
            <button type="button" className={styles.catAddBtn} onClick={() => setEditingCat(true)}>+ nova</button>
          )}
        </div>
      </div>

      <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)}/>

      <button type="button" className="btn btn-primary" style={{ justifyContent:'center', width:'100%' }} onClick={submit}>
        <PiFloppyDiskBold size={14}/> Registrar
      </button>
    </div>
  )
}

// ══════════════════════════════════════
// COMPONENTE: Edição inline de transação
// ══════════════════════════════════════
function TxEditRow({ tx, onSave, onCancel }) {
  const [desc,   setDesc]   = useState(tx.desc)
  const [amount, setAmount] = useState(String(tx.amount))
  const [date,   setDate]   = useState(tx.date)

  return (
    <div className={styles.txEditRow}>
      <input className={`input ${styles.txEditInput}`} value={desc}
        onChange={e => setDesc(e.target.value)} placeholder="Descrição"/>
      <input className={`input ${styles.txEditInput}`} value={amount} inputMode="decimal"
        onChange={e => setAmount(e.target.value.replace(/[^0-9,.]/,''))} placeholder="Valor"/>
      <input className={`input ${styles.txEditInput}`} type="date" value={date}
        onChange={e => setDate(e.target.value)}/>
      <div style={{ display:'flex', gap:4 }}>
        <button type="button" className="btn btn-primary" style={{ padding:'5px 9px' }}
          onClick={() => {
            const v = parseFloat(amount.replace(',','.'))
            if (isNaN(v) || v <= 0) { toast('Valor inválido'); return }
            onSave({ ...tx, desc: desc.trim() || tx.desc, amount: v, date })
            toast('Transação atualizada!')
          }}>
          <PiFloppyDiskBold size={12}/>
        </button>
        <button type="button" className="btn" style={{ padding:'5px 9px' }} onClick={onCancel}>
          <PiXBold size={12}/>
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// BLOCO 3 — TRANSAÇÕES
// ══════════════════════════════════════
function TransactionList({ transactions, onRemove, onEdit, onAdd }) {
  const [filter,  setFilter]  = useState('todas')
  const [limit,   setLimit]   = useState(10)
  const [editing, setEditing] = useState(null)

  const shown = useMemo(() => {
    let list = [...transactions]
    if (filter === 'entrada') list = list.filter(t => t.type === 'income')
    if (filter === 'saida')   list = list.filter(t => t.type === 'expense')
    return list.slice(0, limit)
  }, [transactions, filter, limit])

  if (!transactions.length) {
    return (
      <div className={styles.txEmpty}>
        <PiWalletBold size={32} color="var(--ink3)"/>
        <p className={styles.txEmptyTitle}>Você ainda não registrou movimentações.</p>
        <p className={styles.txEmptyTip}>
          Registre tudo por 3 dias e veja padrões surgirem.
        </p>
        <button type="button" className={styles.comecarBtn} onClick={onAdd}>
          <PiPlusBold size={13}/> Registrar primeira transação
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className={styles.txFilters}>
        {[['todas','Todas'],['entrada','Entradas'],['saida','Saídas']].map(([id,lbl]) => (
          <button key={id} type="button"
            className={`${styles.txFilter} ${filter === id ? styles.txFilterActive : ''}`}
            onClick={() => setFilter(id)}>{lbl}
          </button>
        ))}
      </div>

      {shown.map(tx => (
        editing === tx.id ? (
          <TxEditRow key={tx.id} tx={tx}
            onSave={updated => { onEdit(tx.id, updated); setEditing(null) }}
            onCancel={() => setEditing(null)}/>
        ) : (
          <div key={tx.id} className={styles.txRow}>
            <div className={`${styles.txIcon} ${tx.type === 'income' ? styles.txIconIn : styles.txIconOut}`}>
              {tx.type === 'income' ? <PiArrowUpRightBold size={14}/> : <PiArrowDownLeftBold size={14}/>}
            </div>
            <div className={styles.txInfo}>
              <div className={styles.txTopLine}>
                <span className={styles.txDesc}>{tx.desc}</span>
                <span className={`${styles.txAmount} ${tx.type === 'income' ? styles.txAmountIn : styles.txAmountOut}`}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                </span>
              </div>
              <div className={styles.txBottomLine}>
                <span className={styles.txMeta}>{tx.category} · {tx.date?.slice(5).replace('-','/')}</span>
                <div className={styles.txActions}>
                  <button type="button" className={styles.txEdit}
                    onClick={() => setEditing(tx.id)} aria-label="Editar">
                    <PiPencilSimpleBold size={12}/>
                  </button>
                  <button type="button" className={styles.txRemove}
                    onClick={() => { if (window.confirm('Remover esta transação?')) { onRemove(tx.id); toast('Removida!') } }}
                    aria-label="Remover">
                    <PiTrashBold size={12}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      ))}

      {transactions.length > limit && (
        <button type="button" className={styles.loadMore} onClick={() => setLimit(l => l + 10)}>
          Ver mais ({transactions.length - limit} restantes)
        </button>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// BLOCO 4 — META DO MÊS
// ══════════════════════════════════════
function MonthGoalCard({ monthGoal, savings, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(String(monthGoal?.target || ''))

  function confirm() {
    const v = parseFloat(draft.replace(',', '.'))
    if (!isNaN(v) && v > 0) {
      onSave({ target: v, enabled: true })
      toast('Meta do mês salva!')
    }
    setEditing(false)
  }

  function remove() {
    onSave({ target: 0, enabled: false })
    setDraft('')
    toast('Meta do mês removida.')
  }

  const target  = monthGoal?.target || 0
  const enabled = monthGoal?.enabled && target > 0
  const pct     = enabled ? Math.min(Math.round(savings / target * 100), 100) : 0
  const done    = pct >= 100

  return (
    <div className="card">
      <div className="card-title">
        <PiTargetBold size={15}/> Meta do Mês
        {enabled && !editing && (
          <div style={{ marginLeft:'auto', display:'flex', gap:4 }}>
            <button type="button" className="btn" style={{ padding:'3px 8px', fontSize:11 }}
              onClick={() => { setDraft(String(target)); setEditing(true) }}>
              <PiPencilSimpleBold size={11}/>
            </button>
            <button type="button" className="btn" style={{ padding:'3px 8px', fontSize:11, color:'#c0392b' }}
              onClick={remove}>
              <PiTrashBold size={11}/>
            </button>
          </div>
        )}
      </div>

      {(!enabled || editing) ? (
        <>
          {!editing && (
            <>
              <p className={styles.goalEmptyDesc}>
                Defina quanto você quer economizar este mês. Isso cria propósito para cada decisão financeira.
              </p>
              <button type="button" className="btn btn-primary"
                style={{ width:'100%', justifyContent:'center' }}
                onClick={() => setEditing(true)}>
                <PiTargetBold size={13}/> Definir meta do mês
              </button>
            </>
          )}
          {editing && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <input className="input" placeholder="Quanto quer economizar? (R$)"
                value={draft} onChange={e => setDraft(e.target.value)}
                inputMode="decimal" autoFocus
                onKeyDown={e => e.key === 'Enter' && confirm()}/>
              <div style={{ display:'flex', gap:8 }}>
                <button type="button" className="btn btn-primary"
                  style={{ flex:1, justifyContent:'center' }} onClick={confirm}>
                  <PiCheckBold size={13}/> Salvar
                </button>
                <button type="button" className="btn" onClick={() => setEditing(false)}>
                  <PiXBold size={13}/>
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className={styles.goalMetaRow}>
            <span className={styles.goalMetaSaved} style={{ color: done ? '#27ae60' : 'var(--ink)' }}>
              {fmt(savings)}
            </span>
            <span className={styles.goalMetaOf}>economizado de</span>
            <span className={styles.goalMetaTarget}>{fmt(target)}</span>
          </div>
          <div className={styles.goalBar} style={{ margin:'8px 0 4px' }}>
            <div className={styles.goalBarFill}
              style={{ width:`${pct}%`, background: done ? '#27ae60' : 'var(--gold)' }}/>
          </div>
          <p style={{ fontSize:11, color: done ? '#27ae60' : 'var(--ink3)', fontWeight:700, marginTop:2 }}>
            {done ? 'Meta atingida!' : `${pct}% · faltam ${fmt(Math.max(target - savings, 0))}`}
          </p>
        </>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// BLOCO 5 — HISTÓRICO 6 MESES
// ══════════════════════════════════════
function SixMonthChart({ last6 }) {
  const [hovered, setHovered] = useState(null)
  const [pinned,  setPinned]  = useState(null)

  const totalInc = last6.reduce((s, m) => s + m.inc, 0)
  const totalExp = last6.reduce((s, m) => s + m.exp, 0)
  const netTotal = totalInc - totalExp
  const savRate  = totalInc > 0 ? Math.round((netTotal / totalInc) * 100) : 0
  const maxVal   = Math.max(...last6.flatMap(m => [m.inc, m.exp]), 1)
  const BAR_H    = 80

  // Pinned tem prioridade; hover só aparece quando nada está fixado
  const activeIdx = pinned !== null ? pinned : hovered
  const tip       = activeIdx !== null ? last6[activeIdx] : null
  const isPinned  = pinned !== null

  return (
    <div className="card">
      {/* ── Cabeçalho ── */}
      <div className={styles.sixHeader}>
        <div className={styles.sixHeaderLeft}>
          <PiTrendUpBold size={14} style={{ color: 'var(--gold-dk)' }}/>
          <span className={styles.sixTitle}>Histórico</span>
          <span className={styles.sixPeriodBadge}>6 meses</span>
        </div>
        <span className={`${styles.sixNetTotal} ${netTotal >= 0 ? styles.sixNetPos : styles.sixNetNeg}`}>
          {netTotal >= 0 ? '+' : ''}{fmt(netTotal)}
        </span>
      </div>

      {/* ── 3 chips resumo ── */}
      <div className={styles.sixChips}>
        <div className={styles.sixChip}>
          <span className={styles.sixChipDot} style={{ background: '#27ae60' }}/>
          <div>
            <span className={styles.sixChipLabel}>Entradas</span>
            <span className={styles.sixChipVal}>{fmtK(totalInc)}</span>
          </div>
        </div>
        <div className={styles.sixChip}>
          <span className={styles.sixChipDot} style={{ background: '#e74c3c' }}/>
          <div>
            <span className={styles.sixChipLabel}>Saídas</span>
            <span className={styles.sixChipVal}>{fmtK(totalExp)}</span>
          </div>
        </div>
        <div className={styles.sixChip}>
          <span className={styles.sixChipDot} style={{ background: savRate >= 20 ? '#27ae60' : savRate >= 5 ? '#e67e22' : '#e74c3c' }}/>
          <div>
            <span className={styles.sixChipLabel}>Economia</span>
            <span className={styles.sixChipVal}>{savRate}%</span>
          </div>
        </div>
      </div>

      {/* ── Gráfico ── */}
      <div className={styles.sixChart}>
        {/* Y-axis labels — posicionados relativos à área de barras */}
        <div className={styles.sixYAxis}>
          {[100, 75, 50, 25].map(p => (
            <span key={p} className={styles.sixYLabel} style={{ bottom: `${p}%` }}>
              {fmtK(maxVal * p / 100)}
            </span>
          ))}
        </div>

        {/* Área de barras com grid */}
        <div className={styles.sixBarsArea}>
          {/* Grid lines — bottom: X% correto pois pai tem height fixo */}
          {[25, 50, 75, 100].map(p => (
            <div key={p} className={styles.sixGridLine} style={{ bottom: `${p}%` }} />
          ))}

          {/* Colunas de barras */}
          {last6.map((m, i) => {
            const incPct   = Math.max((m.inc / maxVal) * 100, 1)
            const expPct   = Math.max((m.exp / maxVal) * 100, 1)
            const isActive = activeIdx === i
            return (
              <div
                key={i}
                className={`${styles.sixBarCol} ${isActive ? styles.sixBarColActive : ''}`}
                onMouseEnter={() => { if (pinned === null) setHovered(i) }}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setPinned(p => p === i ? null : i)}
              >
                <div className={styles.sixBars}>
                  <div className={styles.sixBarInc} style={{ height: `${incPct}%` }} />
                  <div className={styles.sixBarExp} style={{ height: `${expPct}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Linha de labels: saldo + mês — separada das barras */}
        <div className={styles.sixLabelsRow}>
          {last6.map((m, i) => {
            const isPos    = m.balance >= 0
            const isActive = activeIdx === i
            return (
              <div key={i} className={`${styles.sixLabelCol} ${isActive ? styles.sixLabelColActive : ''}`}>
                <span className={`${styles.sixBalance} ${isPos ? styles.sixBalancePos : styles.sixBalanceNeg}`}>
                  {isPos ? '+' : ''}{fmtK(m.balance)}
                </span>
                <span className={styles.sixLabel}>{m.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Detalhe do mês ativo (hover desktop / tap mobile) ── */}
      {tip && (
        <div className={`${styles.sixTooltip} ${isPinned ? styles.sixTooltipPinned : ''}`}>
          <span className={styles.sixTipLabel}>{tip.label}</span>
          <span className={styles.sixTipRow}><span className={styles.sixTipInc}>↑</span> {fmt(tip.inc)}</span>
          <span className={styles.sixTipRow}><span className={styles.sixTipExp}>↓</span> {fmt(tip.exp)}</span>
          <span className={`${styles.sixTipRow} ${styles.sixTipBold} ${tip.balance >= 0 ? styles.sixBalancePos : styles.sixBalanceNeg}`}>
            = {tip.balance >= 0 ? '+' : ''}{fmt(tip.balance)}
          </span>
          {isPinned && (
            <button
              className={styles.sixTipDismiss}
              onClick={() => setPinned(null)}
              aria-label="Fechar"
            >✕</button>
          )}
        </div>
      )}
    </div>
  )
}

function PremiumTeaser() {
  return (
    <div className={styles.premiumCard}>
      <div className={styles.premiumContent}>
        <PiTrendUpBold size={22} color="var(--gold-dk)"/>
        <div className={styles.premiumText}>
          <span className={styles.premiumTitle}>Histórico 6 meses</span>
          <span className={styles.premiumDesc}>Desbloqueie análises completas</span>
        </div>
      </div>
      <div className={styles.premiumBadge}>
        <PiLockSimpleBold size={10}/> Premium
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// COMPONENTE: Reserva de Emergência
// ══════════════════════════════════════
function EmergencyCard({ emergency, emergencyIdeal, avgMonthlyExpense, onSave }) {
  const [editing,      setEditing]      = useState(false)
  const [depositing,   setDepositing]   = useState(false)
  const [cur,          setCur]          = useState(String(emergency.current || ''))
  const [tgt,          setTgt]          = useState(String(emergency.target  || ''))
  const [depositAmt,   setDepositAmt]   = useState('')

  const target  = emergency.target || emergencyIdeal
  const current = emergency.current || 0
  const pct     = target > 0 ? Math.min(Math.round(current / target * 100), 100) : 0
  const status  = pct >= 100 ? 'ok' : pct >= 50 ? 'parcial' : 'baixo'
  const colors  = { ok: '#27ae60', parcial: '#e67e22', baixo: '#e74c3c' }
  const monthsProtected = avgMonthlyExpense > 0
    ? (current / avgMonthlyExpense).toFixed(1) : '0.0'
  const isSetup = current === 0 && !emergency.target

  function confirmEdit() {
    const c = parseFloat(cur.replace(',', '.')) || 0
    const t = parseFloat(tgt.replace(',', '.')) || 0
    onSave({ current: c, target: t || emergencyIdeal })
    toast('Reserva atualizada!')
    setEditing(false)
  }

  function submitDeposit() {
    const v = parseFloat(depositAmt.replace(',', '.'))
    if (isNaN(v) || v <= 0) { toast('Valor inválido'); return }
    navigator.vibrate?.(50)
    playSaveDirect()
    onSave({ current: current + v, target })
    toast(`+ ${fmt(v)} na reserva!`)
    setDepositAmt('')
    setDepositing(false)
  }

  const MILESTONES = [
    { pctReq:   0, Icon: PiPlantBold,      label: 'Começou' },
    { pctReq:  25, Icon: PiHandFistBold,   label: '25% · 1,5 meses' },
    { pctReq:  50, Icon: PiLockSimpleBold, label: '50% · 3 meses' },
    { pctReq: 100, Icon: PiShieldBold,     label: 'Completa · 6 meses' },
  ]

  // ── SETUP STATE ──────────────────────
  if (isSetup && !editing) {
    return (
      <div className="card">
        <div className="card-title">
          <PiShieldBold size={15}/> Reserva de Emergência
        </div>
        <div className={styles.emergencySetup}>
          <PiShieldBold size={40} color="var(--gold-dk)"/>
          <p className={styles.setupTitle}>Crie sua rede de proteção</p>
          <p className={styles.setupDesc}>
            A reserva ideal são {fmt(emergencyIdeal)} - 6 meses de despesas.
            É a base de qualquer vida financeira saudável.
          </p>
          <button type="button" className="btn btn-primary"
            style={{ width:'100%', justifyContent:'center' }}
            onClick={() => { setCur(''); setTgt(''); setEditing(true) }}>
            <PiShieldBold size={13}/> Começar minha reserva
          </button>
        </div>
      </div>
    )
  }

  // ── EDIT FORM OVERLAY ────────────────
  if (editing) {
    return (
      <div className="card">
        <div className="card-title">
          <PiShieldBold size={15}/> Reserva de Emergência
        </div>
        <div className={styles.emergencyForm}>
          <label className={styles.fieldLbl}>Valor atual guardado (R$)</label>
          <input className="input" value={cur} onChange={e => setCur(e.target.value)}
            placeholder="0,00" inputMode="decimal" autoFocus/>
          <label className={styles.fieldLbl}>Meta (vazio = usar 6 meses de despesas)</label>
          <input className="input" value={tgt} onChange={e => setTgt(e.target.value)}
            placeholder={fmt(emergencyIdeal)} inputMode="decimal"/>
          <div style={{ display:'flex', gap:8 }}>
            <button type="button" className="btn btn-primary"
              style={{ flex:1, justifyContent:'center' }} onClick={confirmEdit}>
              <PiCheckBold size={13}/> Salvar
            </button>
            <button type="button" className="btn" onClick={() => setEditing(false)}>
              <PiXBold size={13}/>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── MAIN VIEW ────────────────────────
  return (
    <div className="card">

      {/* HERO: meses protegido */}
      <div className={styles.emergencyHero}>
        <div className={styles.emergencyHeroLeft}>
          <span className={styles.emergencyHeroVal}>{monthsProtected}</span>
          <span className={styles.emergencyHeroLbl}>meses protegido</span>
        </div>
        <div className={styles.emergencyHeroRight}>
          <span className={styles.emergencyBadge}
            style={{ color: colors[status], borderColor: colors[status] }}>
            {status === 'ok' ? '✓ Adequada' : status === 'parcial' ? '~ Parcial' : '⚠ Insuficiente'}
          </span>
          <button type="button" className={styles.emergencyEditBtn}
            onClick={() => { setCur(String(current||'')); setTgt(String(emergency.target||'')); setEditing(true) }}>
            <PiPencilSimpleBold size={11}/> Editar
          </button>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="pbar-wrap" style={{ margin:'4px 0 2px' }}>
        <div className="pbar-fill" style={{ width:`${pct}%`, background: colors[status], height:'100%' }}/>
      </div>
      <div className={styles.emergencyProgress}>
        <span>{fmt(current)} guardado</span>
        <span>{pct}% · meta {fmt(target)}</span>
      </div>

      {/* CTA: depósito rápido */}
      {depositing ? (
        <div className={styles.depositRow} style={{ marginTop:10 }}>
          <input className="input" placeholder="Valor a depositar (R$)"
            value={depositAmt} onChange={e => setDepositAmt(e.target.value)}
            inputMode="decimal" autoFocus style={{ flex:1 }}
            onKeyDown={e => e.key === 'Enter' && submitDeposit()}/>
          <button type="button" className="btn btn-primary" onClick={submitDeposit}>
            <PiCheckBold size={13}/>
          </button>
          <button type="button" className="btn"
            onClick={() => { setDepositing(false); setDepositAmt('') }}>
            <PiXBold size={13}/>
          </button>
        </div>
      ) : (
        <button type="button" className={`btn btn-primary ${styles.emergencyDepositBtn}`}
          onClick={() => setDepositing(true)}>
          <PiPlusBold size={13}/> Depositar na reserva
        </button>
      )}

      {/* Milestones */}
      <div className={styles.milestones}>
        {MILESTONES.map(m => (
          <div key={m.pctReq}
            className={`${styles.milestone} ${pct >= m.pctReq ? styles.milestoneDone : ''}`}>
            <m.Icon size={16}/>
            <span className={styles.milestoneLbl}>{m.label}</span>
          </div>
        ))}
      </div>

      {/* Dica contextual */}
      <div className={styles.emergencyTip}>
        <PiLightbulbBold size={13} color="var(--gold-dk)"/>
        <p>
          {status === 'ok'
            ? 'Reserva completa! Considere investir o excedente em renda fixa.'
            : status === 'parcial'
            ? `Continue guardando. Faltam ${fmt(Math.max(target - current, 0))} para a meta.`
            : `Priorize a reserva. Guarde ao menos ${avgMonthlyExpense > 0 ? fmt(Math.ceil(avgMonthlyExpense * 0.1)) : 'R$ 200'}/mês.`}
        </p>
      </div>

    </div>
  )
}

// ══════════════════════════════════════
// COMPONENTE: Metas financeiras
// ══════════════════════════════════════
function GoalsCard({ goals, onAdd, onAddSaved, onRemove, onUndoAporte }) {
  const [showForm,  setShowForm]  = useState(false)
  const [icon,      setIcon]      = useState(ICON_OPTS[0].key)
  const [name,      setName]      = useState('')
  const [target,    setTarget]    = useState('')
  const [deadline,  setDeadline]  = useState('')
  const [addingTo,  setAddingTo]  = useState(null)
  const [deposit,   setDeposit]   = useState('')

  function submitGoal() {
    const t = parseFloat(target.replace(',', '.'))
    if (!name.trim())        { toast('Nome da meta obrigatório'); return }
    if (isNaN(t) || t <= 0) { toast('Valor da meta inválido');   return }
    playSaveDirect()
    onAdd({ icon, name: name.trim(), target: t, deadline: deadline || null })
    toast(`Meta "${name.trim()}" criada!`)
    setIcon(ICON_OPTS[0].key); setName(''); setTarget(''); setDeadline('')
    setShowForm(false)
  }

  function submitDeposit(id) {
    const v = parseFloat(deposit.replace(',', '.'))
    if (isNaN(v) || v <= 0) { toast('Valor inválido'); return }
    navigator.vibrate?.(50)
    playSaveDirect()
    onAddSaved(id, v)
    toast(`${fmt(v)} adicionados à meta!`)
    setDeposit('')
    setAddingTo(null)
  }

  const active = goals.filter(g => (g.target > 0 ? Math.min(Math.round(g.saved / g.target * 100), 100) : 0) < 100)
  const done   = goals.filter(g => (g.target > 0 ? Math.min(Math.round(g.saved / g.target * 100), 100) : 0) >= 100)

  return (
    <div className="card">
      <div className="card-title">
        <PiTargetBold size={15}/> Metas Financeiras
        <button type="button" className={`btn btn-primary ${styles.miniBtn}`}
          onClick={() => setShowForm(f => !f)}>
          {showForm ? <PiXBold size={11}/> : <><PiPlusBold size={11}/> Nova meta</>}
        </button>
      </div>

      {/* Formulário inline */}
      {showForm && (
        <div className={styles.inlineForm}>
          <div className={styles.formHeader}>
            <span className={styles.formTitle}>Nova meta</span>
            <button type="button" className={styles.closeBtn} onClick={() => setShowForm(false)}>
              <PiXBold size={14}/>
            </button>
          </div>
          <label className={styles.fieldLbl}>Ícone</label>
          <div className={styles.emojiPicker}>
            {ICON_OPTS.map(o => (
              <button key={o.key} type="button"
                className={`${styles.emojiOpt} ${icon === o.key ? styles.emojiOptActive : ''}`}
                onClick={() => setIcon(o.key)}>
                <o.Icon size={18}/>
              </button>
            ))}
          </div>
          <input className="input" placeholder="Nome da meta (ex: Viagem, Notebook…)"
            value={name} onChange={e => setName(e.target.value)} autoFocus/>
          <input className="input" placeholder="Valor alvo (R$)"
            value={target} onChange={e => setTarget(e.target.value)} inputMode="decimal"/>
          <div className={styles.goalDateRow}>
            <PiCalendarBold size={13} color="var(--ink3)"/>
            <input type="date" className="input" value={deadline}
              onChange={e => setDeadline(e.target.value)} min={todayISO()} style={{ flex:1 }}/>
          </div>
          <button type="button" className="btn btn-primary"
            style={{ width:'100%', justifyContent:'center' }} onClick={submitGoal}>
            <PiFloppyDiskBold size={13}/> Criar meta
          </button>
        </div>
      )}

      {/* Empty state */}
      {goals.length === 0 && !showForm && (
        <div className={styles.goalsEmpty}>
          <PiTargetBold size={32} color="var(--ink3)"/>
          <p className={styles.goalsEmptyTitle}>Nenhuma meta ainda</p>
          <p className={styles.goalsEmptyDesc}>
            Defina onde quer chegar: viagem, notebook, reserva… cada meta vira um plano.
          </p>
          <button type="button" className="btn btn-primary"
            style={{ width:'100%', justifyContent:'center' }}
            onClick={() => setShowForm(true)}>
            <PiPlusBold size={13}/> Criar primeira meta
          </button>
          </div>
        )}

        {/* Metas ativas */}
        {active.map(g => {
          const pct  = g.target > 0 ? Math.min(Math.round(g.saved / g.target * 100), 100) : 0
          const dl   = daysLeft(g.deadline)
          const monthlyNeeded = g.deadline && dl > 0
            ? Math.ceil((g.target - g.saved) / Math.max(Math.ceil(dl / 30), 1)) : null

          return (
            <div key={g.id} className={styles.goalCardNew}>
              {/* Cabeçalho */}
              <div className={styles.goalCardHead}>
                <span className={styles.goalCardEmoji}><GoalIcon iconKey={g.icon || g.emoji} size={18}/></span>
                <span className={styles.goalCardName}>{g.name}</span>
                {dl !== null && (
                  <span className={styles.goalDaysChip}
                    style={{ color: dl <= 30 ? '#e74c3c' : 'var(--ink3)',
                             borderColor: dl <= 30 ? '#e74c3c' : 'var(--border)' }}>
                    {dl > 0 ? `${dl}d` : 'Vencida'}
                  </span>
                )}
                <button type="button" className={styles.goalRemove}
                  onClick={() => { if (window.confirm(`Remover meta "${g.name}"?`)) onRemove(g.id) }}
                  aria-label="Remover meta">
                  <PiTrashBold size={12}/>
                </button>
              </div>

              {/* Valores */}
              <div className={styles.goalAmounts}>
                <span className={styles.goalAmtSaved}>{fmt(g.saved)}</span>
                <span className={styles.goalAmtSep}>de</span>
                <span className={styles.goalAmtTarget}>{fmt(g.target)}</span>
              </div>

              {/* Barra */}
              <div className={styles.goalBar}>
                <div className={styles.goalBarFill} style={{ width:`${pct}%` }}/>
              </div>
              <p style={{ fontSize:10, color:'var(--ink3)', marginTop:2 }}>
                {pct}% · faltam {fmt(Math.max(g.target - g.saved, 0))}
              </p>

              {/* Dica de aporte */}
              {monthlyNeeded && (
                <div className={styles.goalTip}>
                  <PiLightbulbBold size={11} color="var(--gold-dk)"/>
                  Aporte sugerido: {fmt(monthlyNeeded)}/mês
                </div>
              )}

              {/* Ação: aporte */}
              {addingTo === g.id ? (
                <div className={styles.depositRow}>
                  <input className="input" placeholder="Valor a adicionar (R$)"
                    value={deposit} onChange={e => setDeposit(e.target.value)}
                    inputMode="decimal" autoFocus style={{ flex:1 }}
                    onKeyDown={e => e.key === 'Enter' && submitDeposit(g.id)}/>
                  <button type="button" className="btn btn-primary"
                    onClick={() => submitDeposit(g.id)}><PiCheckBold size={13}/></button>
                  <button type="button" className="btn"
                    onClick={() => { setAddingTo(null); setDeposit('') }}><PiXBold size={13}/></button>
                </div>
              ) : (
                <div className={styles.depositActions}>
                  <button type="button" className={`btn btn-primary ${styles.depositBtn}`}
                    onClick={() => { setAddingTo(g.id); setDeposit('') }}>
                    <PiPlusBold size={12}/> Adicionar aporte
                  </button>
                  {(g.aportes||[]).length > 0 && (
                    <button type="button" className={styles.undoBtn}
                      onClick={() => { if (window.confirm('Desfazer último aporte?')) onUndoAporte(g.id) }}
                      title={`Desfazer: ${fmt((g.aportes||[]).at(-1)?.amount||0)}`}>
                      ↩
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Metas concluídas */}
        {done.length > 0 && (
          <>
            <p className={styles.goalsDoneLabel}><PiTrophyBold size={12}/> Concluídas</p>
            {done.map(g => (
              <div key={g.id} className={`${styles.goalCardNew} ${styles.goalCardDone}`}>
                <div className={styles.goalCardHead}>
                  <span className={styles.goalCardEmoji}><GoalIcon iconKey={g.icon || g.emoji} size={18}/></span>
                  <span className={styles.goalCardName}>{g.name}</span>
                  <span className={styles.goalDoneChip}>✓ Concluída</span>
                  <button type="button" className={styles.goalRemove}
                    onClick={() => { if (window.confirm(`Remover meta "${g.name}"?`)) onRemove(g.id) }}
                    aria-label="Remover meta">
                    <PiTrashBold size={12}/>
                  </button>
                </div>
                <div className={styles.goalAmounts}>
                  <span className={styles.goalAmtSaved} style={{ color:'#27ae60' }}>{fmt(g.saved)}</span>
                  <span className={styles.goalAmtSep}>de</span>
                  <span className={styles.goalAmtTarget}>{fmt(g.target)}</span>
                </div>
                <div className={styles.goalBar}>
                  <div className={styles.goalBarFill} style={{ width:'100%', background:'#27ae60' }}/>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
  )
}

// ══════════════════════════════════════
// NAVEGAÇÃO DE MESES — custom tab bar
// ══════════════════════════════════════
const TOTAL_MONTHS = 12

function useVisibleMonths() {
  const [n, setN] = useState(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 375
    return w >= 440 ? 6 : w >= 360 ? 5 : 4
  })
  useEffect(() => {
    function upd() {
      setN(window.innerWidth >= 440 ? 6 : window.innerWidth >= 360 ? 5 : 4)
    }
    window.addEventListener('resize', upd)
    return () => window.removeEventListener('resize', upd)
  }, [])
  return n
}

function MonthTabBar({ monthOffset, onChange }) {
  const vis        = useVisibleMonths()
  const activeIdx  = TOTAL_MONTHS - 1 + monthOffset  // 0→oldest, TOTAL-1→current
  const [winStart, setWinStart] = useState(() => Math.max(0, TOTAL_MONTHS - vis))

  // keep active tab inside the visible window
  useEffect(() => {
    if (activeIdx < winStart)           setWinStart(activeIdx)
    else if (activeIdx >= winStart + vis) setWinStart(Math.min(activeIdx - vis + 1, TOTAL_MONTHS - vis))
  }, [activeIdx, vis])

  const canPrev = winStart > 0
  const canNext = winStart + vis < TOTAL_MONTHS

  return (
    <div className={styles.monthTabBar}>
      <button type="button" className={styles.monthTabArrow}
        onClick={() => setWinStart(s => Math.max(0, s - 1))} disabled={!canPrev}>
        <PiCaretLeftBold size={11}/>
      </button>

      <div className={styles.monthTabTrack}>
        <div className={styles.monthTabList}
          style={{ transform: `translateX(calc(-${winStart} * (100% / ${vis})))` }}>
          {Array.from({ length: TOTAL_MONTHS }, (_, i) => {
            const off    = i - (TOTAL_MONTHS - 1)
            const d      = new Date(); d.setDate(1); d.setMonth(d.getMonth() + off)
            const lbl    = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()
            const active = monthOffset === off
            return (
              <button key={i} type="button"
                className={`${styles.monthTab} ${active ? styles.monthTabActive : ''}`}
                style={{ flex: `0 0 calc(100% / ${vis})` }}
                onClick={() => onChange(off)}>
                {lbl}
              </button>
            )
          })}
        </div>
      </div>

      <button type="button" className={styles.monthTabArrow}
        onClick={() => setWinStart(s => Math.min(s + 1, TOTAL_MONTHS - vis))} disabled={!canNext}>
        <PiCaretRightBold size={11}/>
      </button>
    </div>
  )
}

// ══════════════════════════════════════
// FINANCE — PÁGINA PRINCIPAL
// ══════════════════════════════════════
export default function Finance() {
  const fin         = useFinance()
  const [formType,  setFormType]  = useState(null)     // 'income' | 'expense' | null
  const [quickMode, setQuickMode] = useState(null)     // null | 'reserve' | 'meta'
  const [monthOffset, setMonthOffset] = useState(0)

  const viewDate = useMemo(() => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + monthOffset); return d
  }, [monthOffset])
  const viewMonth      = `${viewDate.getFullYear()}-${String(viewDate.getMonth()+1).padStart(2,'0')}`
  const viewLabel      = viewDate.toLocaleDateString('pt-BR', { month:'long', year:'numeric' })
  const isCurrentMonth = monthOffset === 0

  const monthTxView  = useMemo(
    () => fin.transactions.filter(t => t.date?.startsWith(viewMonth)),
    [fin.transactions, viewMonth]
  )
  const totalInView  = monthTxView.filter(t => t.type==='income').reduce((a,t)=>a+t.amount, 0)
  const totalOutView = monthTxView.filter(t => t.type==='expense').reduce((a,t)=>a+t.amount, 0)
  const balanceView  = totalInView - totalOutView
  const savings      = Math.max(balanceView, 0)

  const view = quickMode || 'main'

  const NAV = [
    [null,      PiWalletBold,  'Finanças'],
    ['reserve', PiShieldBold,  'Reserva'],
    ['meta',    PiTargetBold,  'Metas'],
  ]

  return (
    <main className={styles.page}>

      {/* NAVEGAÇÃO */}
      <div className={styles.navTabs}>
        {NAV.map(([id, Icon, lbl]) => (
          <button key={String(id)} type="button"
            className={`${styles.navTab} ${view === (id ?? 'main') ? styles.navTabActive : ''}`}
            onClick={() => setQuickMode(id)}>
            <Icon size={13}/> {lbl}
          </button>
        ))}
      </div>

      {/* ── VISÃO PRINCIPAL ── */}
      {view === 'main' && (
        <>
          {/* Navegação de meses — custom tab bar */}
          <MonthTabBar
            monthOffset={monthOffset}
            onChange={off => setMonthOffset(Math.max(-(TOTAL_MONTHS - 1), Math.min(0, off)))}
          />

          {/* BLOCO 1: Ação principal */}
          <ActionBlock
            balance={balanceView}
            totalIn={totalInView}
            totalOut={totalOutView}
            transactions={monthTxView}
            onAddIncome={() => setFormType('income')}
            onAddExpense={() => setFormType('expense')}
          />

          {/* BLOCO 2: Resumo */}
          <SummaryRow totalIn={totalInView} totalOut={totalOutView}/>

          {/* BLOCO 3: Transações */}
          <div className="card">
            <div className="card-title">
              <PiWalletBold size={15}/> Movimentações
              {!isCurrentMonth && (
                <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, color:'var(--ink3)',
                  background:'var(--surface)', border:'1px solid var(--border)',
                  borderRadius:3, padding:'2px 6px' }}>{viewLabel}</span>
              )}
            </div>
            {formType && (
              <AddTransactionForm
                key={formType}
                defaultType={formType}
                onAdd={fin.addTransaction}
                onClose={() => setFormType(null)}
              />
            )}
            <TransactionList
              transactions={monthTxView}
              onRemove={fin.removeTransaction}
              onEdit={fin.editTransaction}
              onAdd={() => setFormType('expense')}
            />
          </div>

          {/* BLOCO 4: Meta do mês */}
          {isCurrentMonth && (
            <MonthGoalCard
              monthGoal={fin.monthGoal}
              savings={savings}
              onSave={fin.saveMonthGoal}
            />
          )}

          {/* BLOCO 5: Histórico 6 meses (Pro) ou teaser */}
          {(localStorage.getItem('nex_plan') || 'free') === 'pro'
            ? <SixMonthChart last6={fin.last6} />
            : <PremiumTeaser />
          }
        </>
      )}

      {/* ── RESERVA ── */}
      {view === 'reserve' && (
        <EmergencyCard
          emergency={fin.emergency}
          emergencyIdeal={fin.emergencyIdeal}
          avgMonthlyExpense={fin.avgMonthlyExpense}
          onSave={fin.saveEmergency}
        />
      )}

      {/* ── METAS ── */}
      {view === 'meta' && (
        <GoalsCard
          goals={fin.goals}
          onAdd={fin.addGoal}
          onAddSaved={fin.updateGoalSaved}
          onRemove={fin.removeGoal}
          onUndoAporte={fin.undoLastAporte}
        />
      )}


    </main>
  )
}
