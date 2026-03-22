import { useState } from 'react'
import { PiSparkle, PiLockBold, PiShieldBold, PiXBold, PiCaretRightBold, PiWarningBold } from 'react-icons/pi'
import styles from './AITeaser.module.css'

// ══════════════════════════════════════
// AI TEASER — card informativo sobre IA
// Exibe o que a IA fará quando integrada,
// ressaltando privacidade e controle do
// usuário. Prepara a estrutura para quando
// a API Claude for ativada.
// ══════════════════════════════════════

const AI_FEATURES = [
  {
    icon: '🎯',
    title: 'Análise de Hábitos',
    desc: 'Identifica padrões, dias mais produtivos e sugere ajustes personalizados com base no seu histórico real.',
    pillar: 'Hábitos',
    ready: false,
  },
  {
    icon: '💰',
    title: 'Insight Financeiro',
    desc: 'Analisa seus gastos, sugere metas de economia e identifica padrões de despesas mensais.',
    pillar: 'Finanças',
    ready: false,
  },
  {
    icon: '🚀',
    title: 'Mentor de Projetos',
    desc: 'Sugere prioridades entre seus projetos e metas com base no progresso e prazos definidos.',
    pillar: 'Projetos',
    ready: false,
  },
  {
    icon: '📚',
    title: 'Curador de Carreira',
    desc: 'Cruza suas leituras, habilidades e metas de carreira para sugerir os próximos passos profissionais.',
    pillar: 'Carreira',
    ready: false,
  },
  {
    icon: '🧠',
    title: 'Reflexão Guiada',
    desc: 'Analisa suas entradas do diário e oferece perguntas provocadoras para aprofundar o autoconhecimento.',
    pillar: 'Bem-estar',
    ready: false,
  },
]

const PRIVACY_POINTS = [
  'Você controla quais dados são enviados — nunca envio automático',
  'Sua chave de API fica apenas no seu dispositivo',
  'Você pode pausar ou desativar a IA a qualquer momento',
  'Dados sensíveis (senhas, documentos) nunca são enviados',
  'Conformidade com LGPD — nenhum dado pessoal em servidores externos',
]

export function AITeaser() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={styles.card}>
      <div className={styles.header} onClick={() => setExpanded(e => !e)}>
        <div className={styles.headerLeft}>
          <div className={styles.aiOrb}>
            <PiSparkle size={18} color="#f0c020"/>
          </div>
          <div>
            <div className={styles.title}>Inteligência Artificial</div>
            <div className={styles.subtitle}>Em desenvolvimento · 5 funcionalidades planejadas</div>
          </div>
        </div>
        <span className={`${styles.caret} ${expanded ? styles.caretOpen : ''}`}>
          <PiCaretRightBold size={13} color="var(--ink3)"/>
        </span>
      </div>

      {expanded && (
        <div className={styles.body}>
          {/* Aviso de desenvolvimento */}
          <div className={styles.devBanner}>
            <PiWarningBold size={14} color="#e67e22"/>
            <p>
              A integração com IA está em desenvolvimento. Quando disponível, usará a API Claude da Anthropic e
              exigirá sua chave própria e consentimento explícito antes de qualquer envio de dados.
            </p>
          </div>

          {/* Features planejadas */}
          <div className={styles.featuresList}>
            {AI_FEATURES.map(f => (
              <div key={f.title} className={styles.feature}>
                <span className={styles.featureIcon}>{f.icon}</span>
                <div className={styles.featureInfo}>
                  <div className={styles.featureTitle}>
                    {f.title}
                    <span className={styles.featurePillar}>{f.pillar}</span>
                  </div>
                  <div className={styles.featureDesc}>{f.desc}</div>
                </div>
                <span className={styles.featureStatus}>Em breve</span>
              </div>
            ))}
          </div>

          {/* Compromisso de privacidade */}
          <div className={styles.privacyCard}>
            <div className={styles.privacyHeader}>
              <PiShieldBold size={14} color="#27ae60"/>
              <span>Compromisso de privacidade com IA</span>
            </div>
            <ul className={styles.privacyList}>
              {PRIVACY_POINTS.map((p, i) => (
                <li key={i} className={styles.privacyItem}>
                  <span className={styles.privacyCheck}>✓</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <p className={styles.legalNote}>
            A IA usará a API Claude da Anthropic. Ao ativar, você estará sujeito também aos{' '}
            <strong>Termos de Uso da Anthropic</strong> disponíveis em anthropic.com/legal.
            Seus dados de hábitos, projetos e reflexões poderão ser processados pela API para gerar análises.
          </p>
        </div>
      )}
    </div>
  )
}
