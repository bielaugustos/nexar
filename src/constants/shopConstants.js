// ══════════════════════════════════════
// LOJA DE RECOMPENSAS - CONSTANTES
// ══════════════════════════════════════

export const SHOP_ITEMS = [
  { id:'util_progress',   cat:'utilidade', name:'Experiência',   icon:'📊', desc:'Disponível gratuitamente — adiciona a tela de Conquistas e Estatísticas à navegação.', cost:0, pillar:'Rotina', pillarColor:'#27ae60' },
  { id:'util_mentor',     cat:'utilidade', name:'Mentor IA',     icon:'🤖', desc:'Disponível gratuitamente — adiciona a tela do Mentor e Diário de Reflexão à navegação.', cost:0, pillar:'Bem-estar', pillarColor:'#8e44ad' },
  { id:'util_calculator', cat:'utilidade', name:'Calculadora',   icon:'🧮', desc:'Disponível gratuitamente — adiciona a Calculadora à navegação.', cost:0, pillar:'Rotina', pillarColor:'#27ae60' },
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
  { id:'theme_glass_dark',cat:'tema',     name:'Vidro Dark',    icon:'🌑', desc:'Versão escura do tema Vidro com glassmorphism. Desbloqueado com 2200 io.', cost:2200, pillar:'Bem-estar', pillarColor:'#8e44ad' },
  { id:'theme_high_contrast', cat:'tema', name:'Alto Contraste', icon:'⬛', desc:'Tema de acessibilidade com alto contraste para melhor legibilidade. Desbloqueado com 1500 io.', cost:1500, pillar:'Acessibilidade', pillarColor:'#000000' },
  { id:'theme_macintosh',     cat:'tema', name:'Macintosh',    icon:'🍎', desc:'Tema retro inspirado no Apple System 7. Desbloqueado com 1800 io.', cost:1800, pillar:'Retro', pillarColor:'#c0c0c0' },
  { id:'theme_windows98',     cat:'tema', name:'Windows 98',   icon:'🪟', desc:'Tema retro inspirado no Windows 98. Desbloqueado com 1800 io.', cost:1800, pillar:'Retro', pillarColor:'#c0c0c0' },
  { id:'theme_linux',         cat:'tema', name:'Linux',        icon:'🐧', desc:'Tema estilo terminal com cores verde neon. Desbloqueado com 2200 io.', cost:2200, pillar:'Tech', pillarColor:'#00ff00' },
]

export const CAT_LABELS = { all:'Todos', tema:'Temas', avatar:'Avatares', utilidade:'Utilitários' }

export const CAT_DESC = {
  all:       'Todos os itens disponíveis na loja',
  tema:      'Temas visuais que alteram as cores do app',
  avatar:    'Avatares exclusivos para o seu perfil',
  utilidade: 'Ferramentas e bônus para sua rotina',
}
