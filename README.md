# Emergência em 10

App (PWA) de teleconsultoria de emergência — **sala vermelha**. Um médico de campo envia um caso
crítico (foto de ECG, sinais vitais e a pergunta de conduta) e plantonistas respondem em **até 10
minutos**. Inclui referência de **condutas de emergência** (estilo Whitebook, focada em sala
vermelha) com calculadora de doses por peso.

> **Aviso médico:** ferramenta de apoio à decisão profissional-a-profissional (segunda opinião
> entre médicos). Não substitui o julgamento clínico nem realiza diagnóstico ao paciente. Doses são
> de referência e devem ser conferidas. Dados são pseudonimizados (sem nome/CPF do paciente — LGPD).

## Stack
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Turso/libSQL · Web Push (VAPID) ·
Vercel Blob · PWA · Vercel.

## Rodar local
```bash
npm install
npm run dev      # http://localhost:3000
```
Sem `TURSO_DATABASE_URL`, usa um SQLite local (`local.db`). O `.env.local` já vem com valores de dev.

### Papéis
- **Solicitante** — cria casos (entra aprovado).
- **Plantonista** — responde casos (precisa de aprovação do admin).
- **Admin** — `/admin` (senha `ADMIN_PASSWORD`) aprova plantonistas e vê os casos.

## Variáveis de ambiente
Veja `.env.local.example`. Para push: `npx web-push generate-vapid-keys`.

## Deploy (GitHub + Vercel)
1. **GitHub:** crie um repositório e faça `git push` (a pasta já está com git inicializado).
2. **Vercel:** *Add New → Project → importe o repo*. Framework: Next.js (detectado).
3. **Env vars na Vercel:** configure as do `.env.local.example`
   (`TURSO_*`, `JWT_SECRET`, `ADMIN_PASSWORD`, `CRON_SECRET`, `VAPID_*`, `NEXT_PUBLIC_SITE_URL`).
4. **Turso:** crie um banco novo (`turso db create`) e use a URL + token.
5. **Blob (fotos):** *Storage → Create → Blob* (injeta `BLOB_READ_WRITE_TOKEN`).
6. **SLA / expiração:** não há cron na Vercel (`vercel.json` vazio — evita a validação do
   `CRON_SECRET` que quebrava o build no Hobby). A expiração dos casos vencidos **e o push de
   escalonamento** (plantonistas + solicitante) acontecem pela **varredura preguiçosa**
   (`expireOverdueOpenCases` + `escalateExpiredCases`) a cada leitura da fila/feed/admin. Se quiser
   também cobrir casos que ninguém abre, agende `/api/cron/sla` por um agendador externo de 1 min
   (cron-job.org, GitHub Actions) enviando `Authorization: Bearer <CRON_SECRET>` — sem espaços no valor.
7. Cada `git push` na branch principal = deploy automático.

## Instalação no celular (PWA)
- **Android:** banner/botão "Instalar".
- **iPhone:** Compartilhar → "Adicionar à Tela de Início" (necessário para receber push; iOS 16.4+).
