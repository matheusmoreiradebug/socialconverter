# Social Converter

Sistema de gestão de leads vindos de comentários e DMs do Instagram e Facebook.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Supabase (Auth + PostgreSQL)
- TailwindCSS
- Meta Graph API v21.0

## Setup rápido

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
# Preencher com seus dados
```

### 3. Banco de dados (Supabase)

```bash
# No Supabase Dashboard → SQL Editor:
# Cole e execute o conteúdo de: supabase/migrations/001_schema.sql
```

### 4. Rodar localmente

```bash
npm run dev
# http://localhost:3000
```

### 5. Testar webhook localmente

```bash
npx ngrok http 3000
# Configure a URL no Meta Developers:
# Callback URL: https://xxxx.ngrok-free.app/api/webhook/meta
# Verify Token: valor de META_WEBHOOK_VERIFY_TOKEN
```

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (só server) |
| `META_APP_ID` | ID do app no Meta Developers |
| `META_APP_SECRET` | Secret do app |
| `META_REDIRECT_URI` | `https://seudominio.com/api/auth/meta/callback` |
| `META_WEBHOOK_VERIFY_TOKEN` | Token de verificação do webhook |
| `TOKEN_ENCRYPTION_KEY` | 64 hex chars (gerar: `openssl rand -hex 32`) |
| `NEXT_PUBLIC_APP_URL` | URL base da aplicação |

## Deploy na Vercel

1. Conectar repositório GitHub
2. Configurar todas as variáveis de ambiente
3. Deploy automático

## Configurar Meta Developers

1. Criar app em developers.facebook.com → tipo Business
2. Adicionar produtos: Messenger + Instagram Graph API
3. Configurar webhook:
   - URL: `https://seudominio.com/api/webhook/meta`
   - Token: valor de `META_WEBHOOK_VERIFY_TOKEN`
   - Assinar campos: `comments`, `messages`, `feed`
4. Testar endpoint: `GET /api/webhook/meta?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=test`
