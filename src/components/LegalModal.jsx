import { useState } from 'react'
import { PiXBold, PiFileTextBold, PiShieldCheckBold, PiListBold } from 'react-icons/pi'
import styles from './LegalModal.module.css'

// ══════════════════════════════════════
// CONTEÚDO LEGAL
// Todos os textos são exibidos dentro do
// próprio app — sem redirecionamento externo.
// ══════════════════════════════════════

const LEGAL_CONTENT = {
  termos: {
    title: 'Termos de Uso',
    lastUpdated: 'Março de 2026',
    sections: [
      {
        heading: '1. Sobre o Rootio',
        text: `O Rootio é um aplicativo de desenvolvimento pessoal que funciona inteiramente no seu dispositivo. Todos os seus dados — hábitos, finanças, projetos, reflexões — são armazenados localmente no seu navegador (localStorage) e nunca são transmitidos a servidores externos sem sua autorização explícita.

Este aplicativo foi desenvolvido como Trabalho de Conclusão de Curso (TCC) e está em fase de desenvolvimento ativo. Funcionalidades podem mudar ao longo do tempo.`,
      },
      {
        heading: '2. Uso do Serviço',
        text: `Ao usar o Rootio, você concorda em utilizá-lo apenas para fins pessoais e lícitos. É proibido usar o aplicativo para armazenar informações ilegais, prejudiciais ou que violem direitos de terceiros.

O Rootio é fornecido "como está", sem garantias expressas ou implícitas de disponibilidade contínua ou ausência de erros.`,
      },
      {
        heading: '3. Inteligência Artificial',
        text: `O Rootio pode opcionalmente integrar com a API da Anthropic (Claude) para fornecer análises personalizadas de hábitos, reflexões e metas. Esta integração:

• Requer que você forneça sua própria chave de API da Anthropic
• Só é ativada com sua ação explícita — nunca automaticamente
• Envia apenas os dados que você selecionar para análise
• Não armazena suas conversas em nossos servidores
• Está sujeita aos Termos de Uso da Anthropic (anthropic.com/legal)

Dados enviados à IA são processados de acordo com a política de privacidade da Anthropic. Recomendamos não enviar informações financeiras sensíveis ou dados pessoais identificáveis às análises de IA.`,
      },
      {
        heading: '4. Limitação de Responsabilidade',
        text: `O Rootio não se responsabiliza por decisões tomadas com base nas análises e sugestões do aplicativo. Conteúdos gerados por Inteligência Artificial têm caráter informativo e não substituem orientação profissional especializada (médica, financeira, jurídica ou psicológica).

Em caso de perda de dados por falha do dispositivo, limpeza do navegador ou outros motivos, o Rootio não pode recuperar informações não exportadas pelo usuário. Use a função de exportação de backup regularmente.`,
      },
      {
        heading: '5. Propriedade Intelectual',
        text: `O código, design e conceito do Rootio são de propriedade do desenvolvedor. O uso pessoal é autorizado. Reprodução, distribuição ou uso comercial sem autorização prévia é proibido.`,
      },
      {
        heading: '6. Alterações',
        text: `Estes termos podem ser atualizados. Mudanças significativas serão comunicadas dentro do aplicativo. O uso continuado após alterações implica aceitação dos novos termos.`,
      },
    ],
  },

  privacidade: {
    title: 'Política de Privacidade',
    lastUpdated: 'Março de 2026',
    sections: [
      {
        heading: 'Compromisso com sua privacidade',
        text: `O Rootio foi projetado com privacidade em primeiro lugar. A filosofia central é simples: seus dados são seus. Não coletamos, vendemos ou compartilhamos suas informações pessoais.`,
      },
      {
        heading: '1. Dados que coletamos',
        text: `O Rootio não coleta dados. Todo o conteúdo que você cria — hábitos, transações financeiras, reflexões do diário, projetos, metas de carreira — é armazenado exclusivamente no armazenamento local do seu dispositivo (localStorage do navegador).

Não temos acesso a esses dados. Não os enviamos a servidores. Não criamos perfis de usuário.`,
      },
      {
        heading: '2. Dados de uso e analytics',
        text: `O Rootio não utiliza ferramentas de analytics, rastreamento de comportamento ou cookies de terceiros. Não sabemos quantas pessoas usam o aplicativo, como navegam ou quais funcionalidades preferem.`,
      },
      {
        heading: '3. Inteligência Artificial e dados',
        text: `Se você optar por usar as funcionalidades de IA (análise de hábitos, reflexões personalizadas), os dados enviados para processamento seguem estas regras:

• Você controla quais dados são enviados — nunca há envio automático
• Os dados são enviados diretamente da sua sessão para a API da Anthropic
• O Rootio não intercepta, armazena ou analisa esses dados
• A Anthropic pode processar esses dados conforme sua política de privacidade
• Recomendamos revisar a política da Anthropic em anthropic.com/privacy

Você pode usar o Rootio completamente offline e sem IA — todas as funcionalidades principais funcionam sem conexão à internet.`,
      },
      {
        heading: '4. Compartilhamento de dados',
        text: `Não compartilhamos seus dados com nenhum terceiro, pois não temos acesso a eles. A única exceção é o uso opcional da API da Anthropic, conforme descrito acima e sempre sob seu controle explícito.`,
      },
      {
        heading: '5. Retenção e exclusão',
        text: `Seus dados existem apenas no seu dispositivo. Para excluí-los, você pode usar a função "Resetar dados" no Perfil, ou limpar os dados do site nas configurações do seu navegador. Após isso, os dados são permanentemente removidos — não há cópia em nossos servidores porque não temos servidores de dados.`,
      },
      {
        heading: '6. Segurança',
        text: `Como os dados ficam no seu dispositivo, a segurança depende principalmente da segurança do seu aparelho. Recomendamos usar o aplicativo em dispositivos pessoais com senha ou biometria ativada, especialmente se você registrar informações financeiras.`,
      },
      {
        heading: '7. Menores de idade',
        text: `O Rootio não é direcionado a menores de 13 anos. Se você tem menos de 18 anos, recomendamos usar o aplicativo com supervisão de um responsável, especialmente as funcionalidades de integração com IA.`,
      },
      {
        heading: '8. Seus direitos',
        text: `Conforme a LGPD (Lei Geral de Proteção de Dados Pessoais, Lei nº 13.709/2018), você tem direito de acessar, corrigir e excluir seus dados. Como todos os dados estão no seu dispositivo, você exerce esses direitos diretamente pelo aplicativo ou pelo seu navegador.`,
      },
    ],
  },

  cookies: {
    title: 'Política de Cookies',
    lastUpdated: 'Março de 2026',
    sections: [
      {
        heading: 'Uso de armazenamento local',
        text: `O Rootio não utiliza cookies tradicionais. Em vez disso, usa o localStorage do navegador — uma tecnologia semelhante que armazena dados exclusivamente no seu dispositivo, sem transmiti-los a servidores.`,
      },
      {
        heading: 'O que armazenamos localmente',
        text: `O Rootio salva as seguintes informações no localStorage do seu navegador:

• nex_habits — seus hábitos e configurações
• nex_history — histórico de conclusão de hábitos
• nex_fin_* — dados financeiros (transações, metas, reserva)
• nex_career_* — leituras, metas e projetos de carreira
• nex_projects — projetos pessoais
• nex_journal — entradas do diário de reflexão
• nex_shop_owned — itens da loja de recompensas
• nex_theme — tema visual selecionado
• nex_sound — preferência de sons
• nex_username, nex_avatar — nome e avatar do perfil
• nex_last_reset — controle de reset diário

Nenhum desses dados é enviado externamente.`,
      },
      {
        heading: 'Cookies de terceiros',
        text: `O Rootio não carrega anúncios, trackers de redes sociais ou qualquer script de terceiros que use cookies. As fontes tipográficas (Google Fonts) são carregadas externamente mas não definem cookies de rastreamento.`,
      },
      {
        heading: 'Como gerenciar',
        text: `Você pode ver e excluir todos os dados armazenados pelo Rootio através das ferramentas de desenvolvedor do seu navegador (F12 → Application → Local Storage). Você também pode usar a função de exportação no Perfil para fazer backup antes de limpar.`,
      },
    ],
  },
}

const DOC_ICONS = {
  termos:      PiFileTextBold,
  privacidade: PiShieldCheckBold,
  cookies:     PiListBold,
}

const DOC_LABELS = {
  termos:      'Termos',
  privacidade: 'Privacidade',
  cookies:     'Cookies',
}

// ── Modal de documento legal ──
export function LegalModal({ doc, onClose }) {
  const content = LEGAL_CONTENT[doc]
  if (!content) return null

  const Icon = DOC_ICONS[doc] || PiFileTextBold

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>

        <div className={styles.handle}/>

        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <Icon size={18} color="var(--gold)"/>
          </div>
          <div className={styles.headerText}>
            <h2 className={styles.headerTitle}>{content.title}</h2>
            <div className={styles.headerMeta}>
              <span className={styles.headerBadge}>{DOC_LABELS[doc]}</span>
              <span className={styles.headerDate}>atualizado em {content.lastUpdated}</span>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <PiXBold size={14}/>
          </button>
        </div>

        <div className={styles.body}>
          {content.sections.map((s, i) => (
            <div key={i} className={styles.section}>
              <div className={styles.sectionLeft}>
                <span className={styles.sectionNum}>{String(i + 1).padStart(2, '0')}</span>
                <div className={styles.sectionLine}/>
              </div>
              <div className={styles.sectionContent}>
                <h3 className={styles.sectionTitle}>{s.heading}</h3>
                <p className={styles.sectionText}>{s.text}</p>
              </div>
            </div>
          ))}

          <div className={styles.footer}>
            <span className={styles.footerBrand}>Rootio</span>
            <span className={styles.footerSep}>·</span>
            <span className={styles.footerVer}>v0.1.0</span>
          </div>
        </div>

      </div>
    </div>
  )
}

// Hook para usar no Profile
export function useLegal() {
  const [openDoc, setOpenDoc] = useState(null)
  return {
    openDoc,
    openTermos:    () => setOpenDoc('termos'),
    openPrivacidade: () => setOpenDoc('privacidade'),
    openCookies:   () => setOpenDoc('cookies'),
    close:         () => setOpenDoc(null),
  }
}
