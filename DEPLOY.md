# Deploy NEX — PWA para iOS

## Opção 1 — Vercel (recomendado, 3 minutos)

```bash
# 1. Instalar CLI do Vercel
npm install -g vercel

# 2. Build de produção
npm run build

# 3. Deploy
vercel --prod
```

Após o deploy, acesse a URL no Safari do iPhone e siga:
**Compartilhar → Adicionar à Tela de Início**

O app instalado funciona offline, tem ícone na home screen
e abre em tela cheia sem barra do Safari.

---

## Opção 2 — Netlify (drag and drop)

```bash
npm run build
```

Arraste a pasta `dist/` para https://app.netlify.com/drop

---

## Opção 3 — Rodar local na mesma rede WiFi

```bash
npm run dev -- --host
```

Acesse no iPhone: `http://SEU-IP:5173`
(veja o IP no terminal — ex: `http://192.168.1.5:5173`)

⚠️ Service Worker só funciona em HTTPS ou localhost.
Para offline funcionar, use Vercel ou Netlify.

---

## Variáveis de ambiente em produção

No Vercel:
- Acesse Settings → Environment Variables
- Adicione `VITE_ANTHROPIC_KEY` = `sk-ant-...`

No `.env.local` para desenvolvimento:
```
VITE_ANTHROPIC_KEY=sk-ant-sua-chave-aqui
```

---

## Como o offline funciona

O Service Worker (`/public/sw.js`) usa a estratégia:
- **Cache First** para JS, CSS, imagens → abre instantâneo
- **Network bypass** para API Anthropic → IA só online
- **Offline fallback** → página explicativa se sem cache

Após a primeira visita com internet, o app funciona 100%
offline — hábitos, histórico, finanças, tudo via localStorage.
