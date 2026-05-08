# Elo — Plataforma de Gestão Escolar

Plataforma SPA (Single Page Application) completa para gestão escolar brasileira, com suporte a múltiplos perfis de usuário, gamificação, chat em tempo real e integração com Supabase e IA generativa.

---

## Funcionalidades

| Módulo | Descrição |
|---|---|
| **Dashboard** | Visão geral por perfil (aluno, pai, professor, coordenador, diretor) |
| **Notas** | Lançamento e acompanhamento de avaliações por trimestre |
| **Frequência** | Registro e visualização de presenças |
| **Tarefas** | Criação, entrega e correção de tarefas |
| **Feed** | Publicações e avisos da escola em tempo real |
| **Chat** | Mensagens diretas e em grupo com realtime |
| **Notificações** | Central de notificações com envio por turma ou usuário |
| **Calendário** | Eventos escolares com criação e visualização |
| **Simulados** | Quiz com geração de questões via Gemini AI |
| **Materiais / Vídeos** | Repositório de conteúdo didático |
| **Gamificação** | XP, níveis, ligas (Bronze → Diamante) e conquistas |
| **Analytics** | Relatórios de desempenho e risco por turma |
| **Gestão** | Cadastro de alunos, turmas, disciplinas e usuários |
| **Boletim PDF** | Geração automática de boletim em PDF |

---

## Stack Tecnológica

- **Frontend**: React 18 + TypeScript + Vite
- **Estilização**: Tailwind CSS v3 (dark mode)
- **Roteamento**: React Router v6
- **Animações**: Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **IA**: Google Gemini 1.5 Flash
- **PDF**: jsPDF
- **Deploy**: Vercel

---

## Pré-requisitos

- Node.js 18+
- npm 9+
- Conta Supabase (opcional para modo demo)
- Conta Vercel (para deploy)

---

## Configuração Local

### 1. Clone e instale dependências

```bash
git clone <seu-repositório>
cd elo-school
npm install
```

### 2. Configure as variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
VITE_GEMINI_API_KEY=sua-gemini-key
```

> **Modo demo**: Se deixar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em branco, o app funciona 100% com localStorage — ideal para testes locais.

### 3. Configure o banco de dados Supabase

No painel do Supabase, acesse **SQL Editor** e execute o arquivo:

```
supabase/migrations/001_initial_schema.sql
```

Isso cria todas as tabelas, índices, triggers e políticas RLS.

### 4. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:5173`

### Credenciais de demo (modo localStorage)

| Perfil | E-mail | Senha |
|---|---|---|
| Diretor | diretor@escola.com | 123456 |
| Coordenador | coordenador@escola.com | 123456 |
| Professor | prof.silva@escola.com | 123456 |
| Aluno | joao@aluno.com | 123456 |
| Pai/Mãe | pai.joao@email.com | 123456 |

---

## Scripts Disponíveis

```bash
npm run dev       # Servidor de desenvolvimento (localhost:5173)
npm run build     # Build de produção (TypeScript check + Vite bundle)
npm run lint      # Lint com ESLint
npm run preview   # Servir o build de produção localmente
```

---

## Deploy no Vercel

### Passo 1 — Crie uma conta e instale o CLI

```bash
npm install -g vercel
vercel login
```

### Passo 2 — Faça o deploy

Na pasta do projeto:

```bash
vercel
```

Responda as perguntas:
- *Set up and deploy?* → **Y**
- *Which scope?* → selecione sua conta
- *Link to existing project?* → **N**
- *Project name?* → `elo-school` (ou o nome que quiser)
- *In which directory is your code?* → `.` (enter)
- *Want to modify settings?* → **N**

### Passo 3 — Configure as variáveis de ambiente

No painel do Vercel (`vercel.com/seu-usuario/elo-school/settings/environment-variables`), adicione:

| Variável | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://seu-projeto.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sua-anon-key` |
| `VITE_GEMINI_API_KEY` | `sua-gemini-key` |

### Passo 4 — Redeploy com as variáveis

```bash
vercel --prod
```

Ou pelo painel: **Deployments → Redeploy**.

> O arquivo `vercel.json` já está configurado para SPA routing — todas as rotas redirecionam para `index.html`.

---

## Conectar Domínio Personalizado

### No painel do Vercel

1. Acesse `vercel.com/seu-usuario/elo-school/settings/domains`
2. Clique em **Add Domain**
3. Digite seu domínio (ex: `escola.com.br`)
4. Copie os registros DNS exibidos

### No seu provedor de domínio (Registro.br, GoDaddy, Cloudflare, etc.)

Adicione os registros DNS:

**Se usar subdomínio** (ex: `app.escola.com.br`):
```
Tipo: CNAME
Nome: app
Valor: cname.vercel-dns.com
```

**Se usar domínio raiz** (ex: `escola.com.br`):
```
Tipo: A
Nome: @
Valor: 76.76.21.21
```

A propagação leva de 1 minuto a 48 horas. O Vercel provisiona SSL automaticamente via Let's Encrypt.

---

## Transformar em APK com Capacitor

### Pré-requisitos

- Java 17+ e Android Studio instalados
- Android SDK configurado

### Passo 1 — Instale o Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Elo Escola" "com.seudominio.elo" --web-dir=dist
```

### Passo 2 — Gere o build de produção

```bash
npm run build
```

### Passo 3 — Adicione a plataforma Android

```bash
npx cap add android
npx cap sync android
```

### Passo 4 — Abra no Android Studio

```bash
npx cap open android
```

No Android Studio:
1. Aguarde o Gradle sincronizar
2. **Build → Generate Signed Bundle / APK**
3. Selecione **APK**
4. Crie ou selecione um keystore
5. Clique em **Finish**

O APK gerado estará em `android/app/release/app-release.apk`.

### Publicar na Play Store

Siga a [documentação oficial do Capacitor](https://capacitorjs.com/docs/android) para assinar e publicar na Google Play Store.

---

## Arquitetura de Dados

### Modo offline-first

```
Escrita: localStorage (imediato) → Supabase (background, async)
Leitura: sempre localStorage (síncrono, sem await)
Realtime: Supabase postgres_changes → localStorage → React subscribers
```

### Papéis e permissões

| Role | Permissões |
|---|---|
| `aluno` | Leitura própria (notas, frequência, tarefas) |
| `pai` | Leitura do filho vinculado |
| `professor` | Lançar notas/frequência, criar tarefas e posts |
| `coordenador` | Todas do professor + gestão de turmas |
| `diretor` | Acesso total, incluindo exclusão |

### Multi-tenant

Cada registro possui `school_id`. O isolamento é garantido por RLS no PostgreSQL — um usuário de uma escola nunca acessa dados de outra.

---

## Variáveis de Ambiente

| Variável | Obrigatório | Descrição |
|---|---|---|
| `VITE_SUPABASE_URL` | Não* | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Não* | Chave anônima pública do Supabase |
| `VITE_GEMINI_API_KEY` | Não* | Chave da API Google Gemini |

*Sem Supabase, o app funciona em modo demo com localStorage. Sem Gemini, o botão "Gerar com IA" nos simulados é desabilitado.

---

## Licença

MIT
