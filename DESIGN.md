# DESIGN.md — STAT

Sistema visual derivado do logo STAT (navy + branco + linha de ECG vermelha).
Estratégia de cor: **Restrained** — neutros tintos de navy + **um acento (ECG vermelho) ≤10%**.
Cores em **OKLCH**, sem `#000`/`#fff` puro.

## Cores (tokens em app/globals.css)

### Claro (default)
- `--navy` (marca/headers/chrome): `oklch(0.28 0.06 258)` (≈ #15294C do logo)
- `--primary` (ações/links/nav ativo): `oklch(0.38 0.09 258)` (≈ #1d3c6e) — substitui o teal
- `--primary-press`: `oklch(0.32 0.08 258)`
- `--primary-tint`: `oklch(0.95 0.02 258)`
- `--red` (ECG / urgência / SLA — ÚNICO acento): `oklch(0.58 0.22 25)` (≈ #E11D2A)
- `--red-press`: `oklch(0.52 0.21 25)` · `--red-tint`: `oklch(0.95 0.04 25)`
- Neutros (tintos para navy/frio):
  - `--bg`: `oklch(0.95 0.008 255)` · `--surface`: `oklch(0.99 0.004 255)`
  - `--surface-2`: `oklch(0.975 0.006 255)` · `--border`: `oklch(0.91 0.008 255)`
  - `--border-strong`: `oklch(0.86 0.01 255)`
  - `--text`: `oklch(0.27 0.02 258)` · `--text-dim`: `oklch(0.48 0.02 258)` · `--text-faint`: `oklch(0.62 0.015 258)`
- Semânticos mantidos (tintos): `--amber`, `--green`, `--blue` para badges/estados.

### Escuro (`[data-theme="dark"]`) — opcional, toggle
- `--bg`: `oklch(0.20 0.03 258)` · `--surface`: `oklch(0.255 0.035 258)` · `--surface-2`: `oklch(0.30 0.035 258)`
- `--border`: `oklch(0.36 0.03 258)` · `--border-strong`: `oklch(0.42 0.03 258)`
- `--text`: `oklch(0.96 0.006 255)` · `--text-dim`: `oklch(0.74 0.02 255)` · `--text-faint`: `oklch(0.60 0.02 255)`
- `--primary`: `oklch(0.72 0.12 250)` · `--primary-tint`: `oklch(0.32 0.06 255)`
- `--navy`: `oklch(0.30 0.05 258)` (chrome um pouco acima do bg)

## Tipografia
- Corpo/UI: **Mulish** (já no projeto), escala de produto (1.125–1.2), ≥16px no corpo.
- Display **só na wordmark STAT**: fonte condensada (Archivo, peso 800–900, tracking apertado).
  Não usar display em labels/botões/dados (regra de produto).

## Movimento
- Produto: 150–250 ms, transmite estado (hover/active/focus/loading). Sem coreografia de página.
- **Momento-marca (único)**: a linha de ECG "traça/pulsa" no login/splash. ease-out-expo
  `cubic-bezier(0.16,1,0.3,1)`, ~1s loop suave. Respeita `prefers-reduced-motion` (estático).
- Botão `:active` afunda levemente; foco = anel navy.

## Componentes (estados completos)
- Botões: default/hover/active/focus/disabled/loading. Primário navy; emergência vermelho.
- Cards: borda hairline (perímetro), sem side-stripe. Header clínico/IA em navy.
- Nav inferior: item ativo navy; `brand-dot` vermelho pulsando = urgência.
- Badges de estado: cores semânticas consistentes (aberto/assumido/respondido/expirado).

## Marca
- `StatLogo`: wordmark "STAT" condensado + `polyline` de ECG vermelha cruzando. Variantes
  `tone` (onNavy=branco / onLight=navy) e `size`. Usado em login, topo e splash.
- Ícones PWA: marca STAT (fundo navy + ECG vermelho + traço branco). `theme_color` navy.
