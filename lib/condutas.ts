// ===== Condutas de emergencia (sala vermelha) — referencia rapida estilo Whitebook =====
// Conteudo de APOIO A DECISAO para profissionais habilitados. Conferir doses e protocolo local.

export type CondutaCategoria =
  | "VIA_AEREA"
  | "ARRITMIA"
  | "PCR"
  | "CHOQUE"
  | "CARDIOLOGIA"
  | "NEURO"
  | "INTOXICACAO"
  | "METABOLICO";

export const CATEGORIAS: { key: CondutaCategoria; label: string }[] = [
  { key: "VIA_AEREA", label: "Via aérea" },
  { key: "ARRITMIA", label: "Arritmias" },
  { key: "PCR", label: "PCR / ACLS" },
  { key: "CHOQUE", label: "Choque / Sepse" },
  { key: "CARDIOLOGIA", label: "Cardiologia" },
  { key: "NEURO", label: "Neuro" },
  { key: "INTOXICACAO", label: "Intoxicações" },
  { key: "METABOLICO", label: "Metabólico" },
];

export type DoseUnidade = "mg/kg" | "mL/kg" | "mcg/kg/min" | "mEq/kg";

// Unidade da dose de uma droga em INFUSÃO contínua (bomba).
export type InfusaoUnidade = "mcg/kg/min" | "mcg/min" | "UI/min" | "mg/min" | "mg/h" | "mg/kg/h";

// Diluição padrão + dados para calcular mL/h na bomba (BIC) por peso.
export type Infusao = {
  diluicao: string; // "16 mg (4 amp de 4 mg/4 mL) + 234 mL SG 5% = 250 mL"
  concentracao: string; // rótulo legível, ex.: "64 mcg/mL"
  concMcgMl?: number; // mcg/mL — drogas dosadas em mcg
  concUiMl?: number; // UI/mL — vasopressina
  concMgMl?: number; // mg/mL — amiodarona, diltiazem, magnésio, fenitoína...
  unidade: InfusaoUnidade;
  faixa?: { min: number; max?: number }; // faixa de referência na unidade
  inicio?: string; // "0,05–0,1 mcg/kg/min"
  titulacao?: string; // "subir 0,05 a cada 5 min até PAM ≥ 65"
  gatilho?: string; // quando começar / adicionar
};

export type Dose = {
  farmaco: string;
  dose: string;
  via?: string;
  obs?: string;
  // Coeficiente por kg (na unidade indicada). Habilita a calculadora por peso.
  mgPorKg?: { min: number; max?: number };
  maxAbs?: number; // teto absoluto em mg (ex.: alteplase 90, tenecteplase 25, fenitoina 1500) — trava sobredose por peso
  unidade?: DoseUnidade; // default mg/kg
  concentracaoPadraoMgMl?: number; // so para mg/kg -> converte em mL
  infusao?: Infusao; // se a droga corre em bomba: diluição + cálculo de mL/h
};

// Passo de acao imediata (modo panico): o que fazer AGORA, com dose em ampolas.
export type AcaoPasso = {
  acao: string; // "Atropina 1 mg IV em bolus"
  ampola?: string; // "4 ampolas (0,25 mg/mL · 1 mL)"
  repetir?: string; // "Repetir 3-5 min · max 3 mg"
};

export type AcaoRapida = {
  gatilho: string; // quando disparar ("Bradicardia COM instabilidade")
  passos: AcaoPasso[];
  seRefratario?: string;
  naoFaca?: string;
};

export type CondutaCard = {
  id: string;
  titulo: string;
  categoria: CondutaCategoria;
  resumo?: string;
  acaoRapida?: AcaoRapida;
  indicacoes: string[];
  contraindicacoes?: string[];
  passos: string[];
  doses: Dose[];
  energia?: string[];
  alertas: string[];
  referencia: string;
  tags?: string[];
};

export const CONDUTAS: CondutaCard[] = [
  {
    id: "sri",
    titulo: "Sequência Rápida de Intubação (SRI)",
    categoria: "VIA_AEREA",
    resumo: "7 P's, indução + bloqueio neuromuscular, pós-IOT.",
    acaoRapida: {
      gatilho: "Precisa de via aérea definitiva (Glasgow ≤ 8, falência respiratória, proteção de via aérea).",
      passos: [
        {
          acao: "Pré-oxigenar O2 100% (3 min) + otimizar PA/SatO2 ANTES",
          ampola: "Cabeceira 20–30° + cateter nasal 15 L/min (oxigenação apneica)",
        },
        {
          acao: "Indução: etomidato 0,3 mg/kg (ou cetamina 1–2 mg/kg no choque)",
          ampola: "Use a calculadora por peso (etomidato 2 mg/mL · cetamina 50 mg/mL)",
        },
        {
          acao: "Bloqueio: succinilcolina 1–1,5 mg/kg OU rocurônio 1,2 mg/kg",
          ampola: "Logo após o indutor · aguardar ~45–60 s para intubar",
        },
      ],
      seRefratario: "Plano de resgate: dispositivo supraglótico / cricotireoidostomia. Confirmar com capnografia.",
      naoFaca: "Propofol e cuidado no choque (hipotensão). Rocurônio dura muito: garanta sedação contínua.",
    },
    indicacoes: [
      "Via aérea definitiva com risco de aspiração (estômago cheio)",
      "Rebaixamento do nível de consciência (Glasgow ≤ 8)",
      "Insuficiência respiratória / falência ventilatória refratária",
      "Proteção de via aérea (queimadura, angioedema, sangramento)",
    ],
    contraindicacoes: [
      "Via aérea claramente difícil em que a SRI inviabiliza ventilação de resgate — considerar via aérea acordada / dispositivos supraglóticos",
    ],
    passos: [
      "1. Preparação: material, monitor, acesso venoso, drogas por peso, plano A/B/C, capnografia.",
      "2. Pré-oxigenação: O2 100% por 3 min ou 8 capacidades vitais; cabeceira 20–30°; oxigenação apneica (cateter nasal 15 L/min).",
      "3. Otimização fisiológica: corrigir hipotensão e hipoxemia ANTES ('resuscitate before you intubate').",
      "4. Paralisia com indução: indutor seguido IMEDIATAMENTE do bloqueador neuromuscular.",
      "5. Posicionamento: posição olfativa; 'ramped' no obeso.",
      "6. Laringoscopia: aguardar relaxamento (~45–60 s); intubar; BURP se necessário.",
      "7. Pós-intubação: confirmar com capnografia, fixar tubo, sedação/analgesia contínua, ajustar ventilador, RX de tórax.",
    ],
    doses: [
      { farmaco: "Etomidato", dose: "0,3 mg/kg", via: "IV", obs: "Estável; cautela na sepse (supressão adrenal transitória)", mgPorKg: { min: 0.3 }, concentracaoPadraoMgMl: 2 },
      { farmaco: "Cetamina", dose: "1–2 mg/kg", via: "IV", obs: "Indutor de escolha no choque (preserva PA); broncodilatador", mgPorKg: { min: 1, max: 2 }, concentracaoPadraoMgMl: 50 },
      { farmaco: "Propofol", dose: "1,5–2,5 mg/kg", via: "IV", obs: "EVITAR no choque (vasodilata); reduzir no idoso/instável", mgPorKg: { min: 1.5, max: 2.5 }, concentracaoPadraoMgMl: 10 },
      { farmaco: "Succinilcolina", dose: "1–1,5 mg/kg", via: "IV", obs: "Início ~45 s. CONTRAINDICADA: hipercalemia, queimadura/trauma >48–72 h, lesão medular, rabdomiólise, hipertermia maligna, doença neuromuscular", mgPorKg: { min: 1, max: 1.5 }, concentracaoPadraoMgMl: 50 },
      { farmaco: "Rocurônio", dose: "1,2 mg/kg", via: "IV", obs: "Quando succinilcolina contraindicada; início ~60 s; duração longa — garantir sedação", mgPorKg: { min: 1.2 }, concentracaoPadraoMgMl: 10 },
      { farmaco: "Fentanil (pré-tratamento)", dose: "1–3 mcg/kg", via: "IV", obs: "Opcional; cautela na hipotensão" },
    ],
    alertas: [
      "Otimize hemodinâmica e oxigenação ANTES de induzir.",
      "Succinilcolina: revise contraindicações de hipercalemia.",
      "Rocurônio tem duração longa: NUNCA deixe bloqueado sem sedação.",
      "Tenha plano de resgate (supraglótico, cricotireoidostomia).",
    ],
    referencia: "ACLS / diretrizes de via aérea de emergência. Verificar concentrações e padronização locais.",
    tags: ["sri", "rsi", "intubacao", "via aerea", "etomidato", "cetamina", "succinilcolina", "rocuronio"],
  },
  {
    id: "cardioversao",
    titulo: "Cardioversão Elétrica Sincronizada",
    categoria: "ARRITMIA",
    resumo: "Taquiarritmia com pulso + instabilidade → choque SINCRONIZADO.",
    acaoRapida: {
      gatilho: "Taquiarritmia COM pulso e instável (hipotensão, dor torácica, IC aguda, rebaixamento).",
      passos: [
        {
          acao: "Cardioversão SINCRONIZADA agora (ligar o modo SYNC)",
          ampola: "FA 120–150 J · Flutter/TSV 50–100 J · TV mono 100 J (bifásico)",
          repetir: "Não resolveu? Religar SYNC e escalonar a energia.",
        },
        {
          acao: "Sedação se der tempo: etomidato 0,1–0,15 mg/kg IV",
          ampola: "≈ 10–15 mg (etomidato 2 mg/mL) — ou cetamina 0,5–1 mg/kg",
        },
      ],
      seRefratario: "Reavaliar ritmo e causa; considerar antiarrítmico (amiodarona) e suporte.",
      naoFaca: "Sem pulso = desfibrilar (NÃO sincronizado). TV polimórfica instável: trate como FV.",
    },
    indicacoes: [
      "Taquiarritmia COM pulso e instabilidade: hipotensão/choque, dor torácica isquêmica, IC aguda, rebaixamento",
      "FA/flutter atrial instável",
      "TSV instável refratária a vagal/adenosina",
      "TV monomórfica com pulso, instável",
    ],
    contraindicacoes: [
      "FV / TV sem pulso → NÃO é cardioversão: desfibrilação (choque NÃO sincronizado) + RCP",
      "Taquicardia sinusal (tratar a causa)",
    ],
    passos: [
      "1. Confirmar pulso e instabilidade; O2, monitor, acesso venoso.",
      "2. Sedação/analgesia se consciente e o tempo permitir.",
      "3. Ligar o modo SINCRONIZADO ('SYNC') — confirmar marcadores sobre as ondas R.",
      "4. Selecionar energia conforme o ritmo.",
      "5. Carregar, afastar todos, aplicar o choque.",
      "6. Reavaliar; o aparelho costuma sair do SYNC — RELIGAR antes de novo choque.",
      "7. Persistindo instável: escalonar energia; reavaliar causa/antiarrítmico.",
    ],
    doses: [
      { farmaco: "Etomidato", dose: "0,1–0,15 mg/kg", via: "IV", obs: "Sedação de procedimento", mgPorKg: { min: 0.1, max: 0.15 }, concentracaoPadraoMgMl: 2 },
      { farmaco: "Cetamina", dose: "0,5–1 mg/kg", via: "IV", obs: "Boa opção no instável", mgPorKg: { min: 0.5, max: 1 }, concentracaoPadraoMgMl: 50 },
      { farmaco: "Fentanil", dose: "1 mcg/kg", via: "IV", obs: "Analgesia; cautela na hipotensão" },
    ],
    energia: [
      "FA: 120–200 J bifásico (iniciar 120–150 J)",
      "Flutter atrial: 50–100 J bifásico",
      "TSV: 50–100 J bifásico",
      "TV monomórfica com pulso: 100 J bifásico (escalonar)",
      "TV polimórfica instável: tratar como FV — desfibrilação NÃO sincronizada",
    ],
    alertas: [
      "SEMPRE conferir o SYNC ligado antes de cada choque em ritmo com pulso.",
      "TV polimórfica: a sincronização pode falhar — se instável, desfibrile.",
      "Cardioversão = SINCRONIZADO (com pulso); desfibrilação = NÃO sincronizado (sem pulso).",
    ],
    referencia: "ACLS (AHA) / SBC. Energias bifásicas; conferir o desfibrilador local.",
    tags: ["cardioversao", "sincronizada", "fa", "flutter", "tsv", "tv", "joules", "energia"],
  },
  {
    id: "acls-pcr",
    titulo: "ACLS / PCR — Parada Cardiorrespiratória",
    categoria: "PCR",
    resumo: "Chocável (FV/TVsp) × não-chocável (AESP/assistolia). RCP de alta qualidade.",
    acaoRapida: {
      gatilho: "Sem pulso / sem responsividade / respiração agônica.",
      passos: [
        {
          acao: "RCP de alta qualidade já: 100–120/min, 5–6 cm, mínimas pausas",
          repetir: "Checar ritmo a cada 2 min e trocar quem comprime.",
        },
        {
          acao: "FV / TV sem pulso → DESFIBRILAR (não sincronizado)",
          ampola: "200 J bifásico (ou máximo do aparelho) · retomar RCP imediatamente",
        },
        {
          acao: "Adrenalina 1 mg IV/IO",
          ampola: "1 ampola (1 mg/mL · 1 mL) · flush 20 mL",
          repetir: "Repetir a cada 3–5 min (precoce no ritmo NÃO chocável).",
        },
        {
          acao: "FV/TV refratária ao choque → Amiodarona 300 mg IV",
          ampola: "2 ampolas (50 mg/mL · 3 mL) · 2ª dose 150 mg",
        },
      ],
      seRefratario: "Buscar e tratar 5H/5T; via aérea avançada + capnografia (EtCO2).",
      naoFaca: "Nunca sincronizar em FV/TVsp. Não atrasar choque/compressões por acesso ou droga.",
    },
    indicacoes: ["Irresponsivo, sem respiração/respiração agônica, sem pulso central em ≤10 s"],
    passos: [
      "1. RCP de alta qualidade: 100–120/min, 5–6 cm, retorno total do tórax, mínimas interrupções (<10 s).",
      "2. 30:2 sem via aérea avançada; com via aérea: compressões contínuas + 1 ventilação a cada 6 s.",
      "3. Checar ritmo a cada 2 min (trocar socorrista).",
      "4. CHOCÁVEL (FV/TVsp): desfibrilar (NÃO sincronizado), RCP 2 min; adrenalina após 2º choque; amiodarona após 3º.",
      "5. NÃO CHOCÁVEL (AESP/assistolia): adrenalina o quanto antes; RCP 2 min.",
      "6. Tratar 5H/5T (hipóxia, hipovolemia, H+, hipo/hipercalemia, hipotermia; pneumotórax hipertensivo, tamponamento, toxinas, trombose coronária, TEP).",
      "7. Considerar via aérea avançada e capnografia.",
    ],
    doses: [
      { farmaco: "Adrenalina", dose: "1 mg a cada 3–5 min", via: "IV/IO", obs: "1:1.000 (1 mg/mL); flush 20 mL e elevar o membro" },
      { farmaco: "Amiodarona", dose: "300 mg (1ª) → 150 mg (2ª)", via: "IV/IO", obs: "Apenas FV/TVsp refratária; alternativa: lidocaína 1–1,5 mg/kg" },
    ],
    energia: ["Bifásico: 120–200 J (fabricante; se desconhecido, máxima)", "Monofásico: 360 J", "Choques seguintes: igual ou maior energia"],
    alertas: [
      "FV/TVsp = desfibrilação NÃO sincronizada — nunca sincronizar.",
      "Prioridade: compressões de alta qualidade e desfibrilação precoce.",
      "Adrenalina precoce no ritmo NÃO chocável.",
      "EtCO2 persistente < 10 mmHg sugere RCP de baixa qualidade.",
    ],
    referencia: "ACLS/AHA 2020 e SBC. Verificar protocolo institucional.",
    tags: ["acls", "pcr", "parada", "fv", "tv", "assistolia", "aesp", "adrenalina", "amiodarona", "5h5t"],
  },
  {
    id: "iot",
    titulo: "IOT — Intubação Orotraqueal (checklist)",
    categoria: "VIA_AEREA",
    resumo: "Preparo, materiais (SOAP-ME), confirmação por capnografia.",
    indicacoes: ["Indicação de via aérea definitiva (ver SRI para a sequência farmacológica)"],
    passos: [
      "SOAP-ME: Sucção testada; Oxigênio/pré-oxigenação; Airway (cânulas, lâminas, tubos, fio-guia, bougie); Posicionamento; Monitor + capnografia; Endotracheal tube/drogas.",
      "Laringoscópio testado; preferir videolaringoscópio se disponível.",
      "Lâmina curva (Macintosh) 3–4 no adulto.",
      "Tubo: mulher 7,0–7,5; homem 7,5–8,0. Pediátrico c/ balonete: (idade/4)+3,5.",
      "Posição olfativa; 'ramped' no obeso.",
      "Laringoscopia + BURP (pressão na cartilagem tireoide) se necessário.",
      "Passar o tubo sob visão; insuflar balonete; ventilar.",
      "CONFIRMAR: capnografia (padrão-ouro), ausculta 5 pontos, expansibilidade; fixar; RX.",
    ],
    doses: [],
    alertas: [
      "Capnografia é o método mais confiável — ausência de onda sugere intubação esofágica.",
      "Profundidade ~21 cm (mulher) / ~23 cm (homem) na rima labial.",
      "Limitar tentativa a ~30 s / dessaturação; reoxigenar entre tentativas.",
    ],
    energia: undefined,
    referencia: "Diretrizes de via aérea de emergência. Conferir videolaringoscopia local.",
    tags: ["iot", "intubacao", "tubo", "lamina", "burp", "capnografia", "soapme"],
  },
  {
    id: "bradi-instavel",
    titulo: "Bradiarritmia Instável",
    categoria: "ARRITMIA",
    resumo: "FC baixa + instabilidade → atropina → marca-passo / infusão.",
    acaoRapida: {
      gatilho: "Bradicardia (FC < 50) COM instabilidade: hipotensão, rebaixamento, dor torácica ou IC aguda.",
      passos: [
        {
          acao: "Atropina 1 mg IV em bolus",
          ampola: "4 ampolas (0,25 mg/mL · 1 mL)",
          repetir: "Repetir a cada 3–5 min · máximo 3 mg (até 3 doses)",
        },
      ],
      seRefratario:
        "Marca-passo transcutâneo (FC 60–80, subir mA até captura com pulso) E/OU infusão: dopamina 5–20 mcg/kg/min ou adrenalina 2–10 mcg/min.",
      naoFaca: "Não atrasar o marca-passo em BAV de alto grau (Mobitz II / BAVT) — atropina costuma falhar.",
    },
    indicacoes: ["FC < 50 com instabilidade: hipotensão, alteração do estado mental, dor torácica, IC aguda/choque"],
    passos: [
      "1. O2, monitor, acesso venoso, ECG 12 derivações.",
      "2. Atropina como 1ª linha.",
      "3. Refratário: marca-passo transcutâneo (MPTC) E/OU infusão de dopamina ou adrenalina.",
      "4. MPTC: ajustar FC ~60–80, aumentar mA até captura elétrica E mecânica (pulso); sedação.",
      "5. Buscar causas: BAV avançado, isquemia, hipercalemia, drogas (BB, BCC, digoxina).",
    ],
    doses: [
      { farmaco: "Atropina", dose: "1 mg a cada 3–5 min (máx 3 mg)", via: "IV", obs: "Pouco eficaz em BAV de alto grau — não retardar o marca-passo" },
      {
        farmaco: "Dopamina", dose: "5–20 mcg/kg/min", via: "IV (BIC)",
        infusao: { diluicao: "250 mg (5 amp de 50 mg/10 mL) + 200 mL SG 5% = 250 mL", concentracao: "1.000 mcg/mL", concMcgMl: 1000, unidade: "mcg/kg/min", faixa: { min: 5, max: 20 }, inicio: "5 mcg/kg/min", titulacao: "subir até FC/PA alvo (máx ~20)", gatilho: "bradicardia instável sem resposta à atropina (ou enquanto prepara o marca-passo)" },
      },
      {
        farmaco: "Adrenalina", dose: "2–10 mcg/min", via: "IV (BIC)",
        infusao: { diluicao: "4 mg (4 amp de 1 mg/mL) + 246 mL SG 5% = 250 mL", concentracao: "16 mcg/mL", concMcgMl: 16, unidade: "mcg/min", faixa: { min: 2, max: 10 }, inicio: "2 mcg/min", titulacao: "subir até FC alvo (2–10 mcg/min)", gatilho: "bradicardia instável (alternativa à dopamina / marca-passo)" },
      },
    ],
    alertas: [
      "BAV 2º Mobitz II e BAVT: prepare marca-passo precocemente.",
      "Confirme CAPTURA mecânica (pulso) no MPTC, não só a espícula.",
      "Dopamina/adrenalina em dose vasopressora: acesso CENTRAL de preferência (em dose alta há risco de extravasamento/necrose); monitor de ECG/PA contínuo. Não infundir na mesma via do bicarbonato.",
      "Considere hipercalemia e intoxicação (BB/BCC/digoxina).",
    ],
    referencia: "ACLS/AHA e SBC. Conferir disponibilidade de marca-passo local.",
    tags: ["bradicardia", "atropina", "marcapasso", "mptc", "dopamina", "bav"],
  },
  {
    id: "taqui-algoritmo",
    titulo: "Taquiarritmias — Estável × Instável",
    categoria: "ARRITMIA",
    resumo: "Instável com pulso → cardioversão. Estável → avaliar QRS/regularidade.",
    indicacoes: ["FC > 150 sintomática; definir instabilidade (hipotensão, dor torácica, IC aguda, rebaixamento)"],
    passos: [
      "1. Tem pulso? Sem pulso → algoritmo de PCR (desfibrilação).",
      "2. Instável (com pulso)? → CARDIOVERSÃO SINCRONIZADA.",
      "3. Estável → ECG 12 derivações; classificar pelo QRS:",
      "   QRS estreito (<0,12 s): regular → vagal → adenosina; irregular → provável FA (controle de FC).",
      "   QRS largo (≥0,12 s): regular → TV (amiodarona) ou TSV com aberrância; irregular → FA com aberrância/pré-excitação ou TV poli — cautela.",
      "4. TV polimórfica com QT longo (Torsades): sulfato de magnésio.",
    ],
    doses: [
      { farmaco: "Adenosina", dose: "6 mg → 12 mg → 12 mg", via: "IV bolus rápido + flush", obs: "TSV regular QRS estreito; CUIDADO em FA pré-excitada (WPW)" },
      {
        farmaco: "Amiodarona", dose: "150 mg em 10 min (bólus), depois manutenção", via: "IV", obs: "TV monomórfica estável / FA",
        infusao: { diluicao: "900 mg (6 amp de 150 mg/3 mL) + 500 mL SG 5% = 1,8 mg/mL", concentracao: "1,8 mg/mL", concMgMl: 1.8, unidade: "mg/min", faixa: { min: 0.5, max: 1 }, inicio: "1 mg/min por 6 h, depois 0,5 mg/min por 18 h", titulacao: "fases fixas (6 h + 18 h) — máx 2,2 g/24 h", gatilho: "manutenção após o bólus" },
      },
      { farmaco: "Sulfato de magnésio", dose: "1–2 g em 10–15 min", via: "IV", obs: "Torsades de pointes" },
      {
        farmaco: "Diltiazem", dose: "0,25 mg/kg em 2 min (bólus)", via: "IV", obs: "Controle de FC na FA estável (cautela na IC/hipotensão)", mgPorKg: { min: 0.25 },
        infusao: { diluicao: "100 mg + 100 mL SF 0,9% = 1 mg/mL", concentracao: "1 mg/mL", concMgMl: 1, unidade: "mg/h", faixa: { min: 5, max: 15 }, inicio: "5 mg/h", titulacao: "titular FC (5–15 mg/h)", gatilho: "manter o controle de FC após o bólus" },
      },
    ],
    alertas: [
      "Instável com pulso = cardioversão; não perder tempo com drogas.",
      "Adenosina é perigosa em FA pré-excitada (WPW).",
      "QRS largo: na dúvida, trate como TV.",
    ],
    referencia: "ACLS/AHA e SBC. Verificar protocolo local.",
    tags: ["taquicardia", "tsv", "tv", "fa", "adenosina", "amiodarona", "magnesio"],
  },
  {
    id: "choque-sepse",
    titulo: "Sepse / Choque Séptico",
    categoria: "CHOQUE",
    resumo: "Pacote 1ª hora: culturas + ATB, cristaloide 30 mL/kg, noradrenalina (PAM ≥ 65).",
    acaoRapida: {
      gatilho: "Infecção suspeita + hipotensão / lactato alto / disfunção orgânica.",
      passos: [
        { acao: "Lactato + 2 pares de hemocultura (sem atrasar o ATB)" },
        { acao: "Antibiótico de amplo espectro na 1ª hora" },
        {
          acao: "Cristaloide 30 mL/kg se hipotenso / lactato ≥ 4",
          ampola: "≈ 2.100 mL num adulto de 70 kg · reavaliar resposta",
        },
        {
          acao: "PAM < 65 após volume → Noradrenalina (1ª escolha)",
          ampola: "Diluir 16 mg (4 amp) + 234 mL SG5% = 64 mcg/mL · iniciar 0,05–0,1 mcg/kg/min em BIC · alvo PAM ≥ 65",
        },
        {
          acao: "Noradrenalina ~0,25–0,5 mcg/kg/min → ADICIONAR Vasopressina",
          ampola: "20 UI + 100 mL SF0,9% = 0,2 UI/mL · 0,03 UI/min = 9 mL/h FIXO (não titula)",
        },
      ],
      seRefratario: "Refratário (após NA + vasopressina): hidrocortisona 50 mg 6/6h (200 mg/dia) + considerar adrenalina; controle o foco (drenagem/cirurgia).",
    },
    indicacoes: ["Suspeita de infecção + disfunção orgânica / hipotensão / lactato elevado"],
    passos: [
      "ALVO o tempo todo: PAM ≥ 65 mmHg (pressão arterial média).",
      "1. Reconheça: infecção suspeita + hipotensão (PAM < 65) ou lactato ≥ 2 mmol/L.",
      "2. Colha lactato + 2 pares de hemocultura ANTES do antibiótico — mas SEM atrasar o ATB.",
      "3. Antibiótico de amplo espectro na 1ª hora.",
      "4. Volume: cristaloide (Ringer/SF) 30 mL/kg em 1–3 h se hipotenso ou lactato ≥ 4 (≈ 2.100 mL num adulto de 70 kg). Reavalie a resposta — não encharque.",
      "5. Ainda PAM < 65 depois do volume? Comece a NORADRENALINA — é a 1ª droga (vasopressor de escolha).",
      "→ Como diluir (padrão): 4 ampolas (16 mg = 16 mL) + 234 mL de SG 5% = 250 mL. Isso fica 64 mcg/mL. Correr em bomba (BIC), de preferência em acesso central (pode iniciar em veia calibrosa).",
      "→ Como começar: 0,05–0,1 mcg/kg/min e SUBA de 0,05 em 0,05 a cada ~5 min até a PAM chegar a 65.",
      "6. Quanto está infundindo (mcg/kg/min ↔ mL/h, com a diluição de 64 mcg/mL): mL/h = mcg/kg/min × peso × 60 ÷ 64.",
      "→ Tabela rápida (70 kg): 0,1 ≈ 6,5 mL/h · 0,3 ≈ 20 mL/h · 0,5 ≈ 33 mL/h. (60 kg: 5,6 / 17 / 28 · 80 kg: 7,5 / 22 / 37 mL/h).",
      "7. Subiu a noradrenalina e a PAM ainda não segura (noradrenalina ~0,25–0,5 mcg/kg/min)? NÃO fique só aumentando a noradrenalina — ADICIONE a vasopressina.",
      "→ Vasopressina: 20 UI (1 ampola) + 100 mL de SF 0,9% = 0,2 UI/mL. Dose FIXA 0,03 UI/min = 9 mL/h na BIC. Não titula (deixa fixa) e ajuda a poupar noradrenalina.",
      "8. Ainda em choque (refratário)? Hidrocortisona 50 mg IV de 6/6 h (200 mg/dia) e considere adrenalina. Reavalie perfusão, lactato seriado e CONTROLE O FOCO (drenagem/cirurgia).",
    ],
    doses: [
      { farmaco: "Cristaloide (RL/SF)", dose: "30 mL/kg", via: "IV", obs: "Reavaliar responsividade a volume", mgPorKg: { min: 30 }, unidade: "mL/kg" },
      {
        farmaco: "Noradrenalina (1ª droga)", dose: "0,05–0,5 mcg/kg/min", via: "IV (BIC)",
        infusao: { diluicao: "16 mg (4 amp de 4 mg/4 mL) + 234 mL SG 5% = 250 mL", concentracao: "64 mcg/mL", concMcgMl: 64, unidade: "mcg/kg/min", faixa: { min: 0.05, max: 0.5 }, inicio: "0,05–0,1 mcg/kg/min", titulacao: "subir 0,05 a cada ~5 min até PAM ≥ 65", gatilho: "PAM < 65 após volume adequado" },
      },
      {
        farmaco: "Vasopressina (2ª droga, fixa)", dose: "0,03 UI/min", via: "IV (BIC)",
        infusao: { diluicao: "20 UI (1 amp) + 100 mL SF 0,9% = 100 mL", concentracao: "0,2 UI/mL", concUiMl: 0.2, unidade: "UI/min", faixa: { min: 0.03 }, inicio: "0,03 UI/min", titulacao: "dose FIXA — não titula", gatilho: "noradrenalina ~0,25–0,5 mcg/kg/min (para poupar a noradrenalina)" },
      },
      {
        farmaco: "Adrenalina (3ª linha)", dose: "0,02–0,5 mcg/kg/min", via: "IV (BIC)",
        infusao: { diluicao: "4 mg (4 amp de 1 mg/mL) + 246 mL SG 5% = 250 mL", concentracao: "16 mcg/mL", concMcgMl: 16, unidade: "mcg/kg/min", faixa: { min: 0.02, max: 0.5 }, inicio: "0,02–0,05 mcg/kg/min", titulacao: "titular ao efeito", gatilho: "choque refratário após NA + vasopressina" },
      },
      {
        farmaco: "Dobutamina (se baixo débito)", dose: "2,5–20 mcg/kg/min", via: "IV (BIC)",
        infusao: { diluicao: "250 mg (1 amp de 250 mg/20 mL) + 230 mL SG 5% = 250 mL", concentracao: "1.000 mcg/mL", concMcgMl: 1000, unidade: "mcg/kg/min", faixa: { min: 2.5, max: 20 }, inicio: "2,5–5 mcg/kg/min", titulacao: "titular à perfusão / débito", gatilho: "hipoperfusão com débito baixo apesar de volume + noradrenalina" },
      },
      { farmaco: "Hidrocortisona", dose: "50 mg 6/6 h (200 mg/dia)", via: "IV", obs: "Choque refratário a vasopressor." },
    ],
    alertas: [
      "Não atrasar o ATB para coletar exames.",
      "Não fique só subindo a noradrenalina: ao chegar em ~0,25–0,5 mcg/kg/min, ADICIONE vasopressina.",
      "Noradrenalina: ideal em acesso central; se periférico, use veia calibrosa e vigie extravasamento (risco de necrose).",
      "Cuidado com sobrecarga de volume na disfunção cardíaca/renal — reavalie a cada etapa.",
    ],
    referencia: "Surviving Sepsis Campaign. Verificar protocolo institucional de ATB.",
    tags: ["sepse", "choque", "noradrenalina", "lactato", "antibiotico", "pam"],
  },
  {
    id: "iam-supra",
    titulo: "IAM com Supra de ST (SCACSST)",
    categoria: "CARDIOLOGIA",
    resumo: "AAS + 2º antiagregante + anticoagulação + reperfusão (tempo!).",
    acaoRapida: {
      gatilho: "Dor torácica isquêmica + supra de ST (ou BRE novo). ECG em ≤ 10 min.",
      passos: [
        {
          acao: "AAS 200–300 mg VO (mastigar) agora",
          ampola: "ex.: 3 comprimidos de 100 mg mastigados",
        },
        { acao: "2º antiagregante (ticagrelor/clopidogrel/prasugrel) + anticoagulação" },
        {
          acao: "Reperfusão: angioplastia primária (porta-balão ≤ 90 min)",
          ampola: "Sem hemodinâmica em tempo → trombólise (porta-agulha ≤ 30 min, < 12 h)",
        },
      ],
      naoFaca: "Nitrato é CONTRAINDICADO em hipotensão, IAM de VD e uso recente de sildenafila/tadalafila.",
    },
    indicacoes: ["Dor torácica isquêmica + supra de ST ou BRE novo; ECG em ≤ 10 min da chegada"],
    passos: [
      "1. MOV: monitor, O2 se SatO2 < 90%, acesso venoso; ECG seriado; troponina (não atrasar reperfusão).",
      "2. AAS 200–300 mg mastigar.",
      "3. Segundo antiagregante (ticagrelor/clopidogrel/prasugrel conforme estratégia).",
      "4. Anticoagulação (HNF/enoxaparina) conforme reperfusão.",
      "5. Reperfusão: angioplastia primária preferencial (porta-balão ≤ 90 min) OU trombólise se sem hemodinâmica em tempo (porta-agulha ≤ 30 min, dentro de 12 h).",
      "6. Analgesia (morfina com cautela), nitrato se sem contraindicação (evitar em IAM de VD / hipotensão / uso de inibidor de PDE5).",
    ],
    doses: [
      { farmaco: "AAS", dose: "200–300 mg", via: "VO (mastigar)", obs: "Dose de ataque" },
      { farmaco: "Ticagrelor", dose: "180 mg ataque", via: "VO", obs: "Conforme estratégia/serviço" },
      { farmaco: "Clopidogrel", dose: "300–600 mg ataque", via: "VO", obs: "Alternativa; ≤75 anos na trombólise: 300 mg" },
      { farmaco: "Enoxaparina", dose: "1 mg/kg 12/12 h", via: "SC", obs: "Ajustar idade/função renal", mgPorKg: { min: 1 } },
    ],
    alertas: [
      "Tempo é músculo — não atrasar a reperfusão por exames.",
      "Nitrato CONTRAINDICADO em hipotensão, IAM de VD e uso recente de sildenafila/tadalafila.",
      "Supra em parede inferior: investigar VD (V3R/V4R) — sensível a volume.",
    ],
    referencia: "Diretriz SBC / AHA de SCACSST. Conferir protocolo de reperfusão local.",
    tags: ["iam", "supra", "infarto", "aas", "reperfusao", "angioplastia", "trombolise"],
  },
  {
    id: "avc-isquemico",
    titulo: "AVC Isquêmico Agudo",
    categoria: "NEURO",
    resumo: "Glicemia → NIHSS → TC → janela de trombólise/trombectomia.",
    indicacoes: ["Déficit neurológico focal agudo; definir horário de início (último momento assintomático)"],
    passos: [
      "1. ABC, glicemia capilar (tratar hipo/hiperglicemia), O2 se < 94%.",
      "2. NIHSS; horário de início; TC de crânio sem contraste (excluir hemorragia).",
      "3. Trombólise (alteplase/tenecteplase) se dentro da janela e sem contraindicações.",
      "4. Trombectomia mecânica se oclusão de grande vaso (janela estendida com imagem).",
      "5. Controle pressórico: alvo < 185/110 se for trombolisar; senão permissivo.",
    ],
    doses: [
      { farmaco: "Alteplase (rtPA)", dose: "0,9 mg/kg (teto 90 mg)", via: "IV", obs: "Reconstituir SÓ com água estéril a 1 mg/mL (NUNCA SF/SG). 10% em bólus em 1 min + 90% em bomba por 60 min. Ex.: 70 kg = 63 mg → 6,3 mg bólus + 56,7 mg (≈ 56,7 mL/h). Janela ≤ 4,5 h; PA < 185/110 antes e < 180/105 durante/24 h. TETO 90 mg (não ultrapassar mesmo se > 100 kg).", mgPorKg: { min: 0.9 }, maxAbs: 90 },
      { farmaco: "Tenecteplase", dose: "0,25 mg/kg (teto 25 mg)", via: "IV bólus único", obs: "Bólus IV único (SEM bomba) — não confundir com a alteplase. AVC: 0,25 mg/kg, teto 25 mg.", mgPorKg: { min: 0.25 }, maxAbs: 25 },
    ],
    alertas: [
      "Excluir hemorragia na TC antes de qualquer trombolítico.",
      "Hipoglicemia mimetiza AVC — sempre cheque a glicemia.",
      "Controlar PA antes da trombólise (< 185/110).",
    ],
    referencia: "Diretriz de AVC (AHA/ASA, SBDCV). Verificar janelas e protocolo local.",
    tags: ["avc", "isquemico", "nihss", "trombolise", "alteplase", "trombectomia"],
  },
  {
    id: "anafilaxia",
    titulo: "Anafilaxia",
    categoria: "CHOQUE",
    resumo: "Adrenalina IM imediata (vasto lateral), repetir 5–15 min; volume.",
    acaoRapida: {
      gatilho: "Reação alérgica grave: via aérea, dispneia/broncoespasmo, hipotensão ou pele + sintomas sistêmicos.",
      passos: [
        {
          acao: "Adrenalina 0,5 mg IM na coxa (vasto lateral) AGORA",
          ampola: "0,5 mL de 1 mg/mL (1:1.000) · criança 0,01 mg/kg (máx 0,5 mg)",
          repetir: "Repetir a cada 5–15 min se não melhorar.",
        },
        {
          acao: "O2 alto fluxo + cristaloide se hipotenso",
          ampola: "Soro 20 mL/kg em bolus, repetir conforme resposta",
        },
      ],
      seRefratario: "Refratário: adrenalina IV em infusão (ambiente monitorizado). Adjuvantes: anti-H1 + corticoide.",
      naoFaca: "NÃO usar via SC nem trocar adrenalina por anti-histamínico/corticoide. Atenção à reação bifásica.",
    },
    indicacoes: ["Reação alérgica grave com acometimento de via aérea, respiração, circulação ou pele+sistêmico"],
    passos: [
      "1. Adrenalina IM IMEDIATA na coxa (vasto lateral) — 1ª linha.",
      "2. Posicionar (decúbito com MMII elevados; sentado se dispneia).",
      "3. O2 alto fluxo; cristaloide se hipotensão.",
      "4. Repetir adrenalina a cada 5–15 min se necessário.",
      "5. Adjuvantes (NÃO substituem adrenalina): anti-H1, corticoide, broncodilatador.",
      "6. Refratário: adrenalina IV em infusão; observar bifásica.",
    ],
    doses: [
      { farmaco: "Adrenalina", dose: "0,5 mg IM (1:1.000)", via: "IM (coxa)", obs: "Criança 0,01 mg/kg (máx 0,5 mg); repetir 5–15 min" },
      { farmaco: "Cristaloide", dose: "20 mL/kg em bolus", via: "IV", obs: "Repetir se hipotensão", mgPorKg: { min: 20 }, unidade: "mL/kg" },
      { farmaco: "Hidrocortisona", dose: "200 mg", via: "IV", obs: "Adjuvante" },
    ],
    alertas: [
      "Adrenalina é a 1ª linha — não atrasar por anti-histamínico/corticoide.",
      "Via IM (coxa), não SC. IV só em ambiente monitorizado/refratário.",
      "Atenção à reação bifásica — observar.",
    ],
    referencia: "WAO / diretrizes de anafilaxia. Conferir protocolo local.",
    tags: ["anafilaxia", "adrenalina", "alergia", "choque", "im"],
  },
  {
    id: "eme",
    titulo: "Estado de Mal Epiléptico",
    categoria: "NEURO",
    resumo: "Benzodiazepínico → antiepiléptico de 2ª linha → anestésico.",
    acaoRapida: {
      gatilho: "Crise > 5 min ou crises repetidas sem recuperar consciência.",
      passos: [
        {
          acao: "Glicemia capilar (tratar se hipoglicemia) + O2 + acesso",
        },
        {
          acao: "Diazepam 10 mg IV lento (0,15–0,2 mg/kg)",
          ampola: "1 ampola (5 mg/mL · 2 mL) · pode repetir 1×",
          repetir: "Sem acesso? Midazolam 10 mg IM.",
        },
        {
          acao: "Persistiu → 2ª linha IV: fenitoína 20 mg/kg OU levetiracetam 60 mg/kg",
        },
      ],
      seRefratario: "Refratário: IOT + anestésico contínuo (midazolam/propofol) em UTI + EEG.",
      naoFaca: "Não subdosar o benzodiazepínico (causa comum de falha). Sempre checar glicemia.",
    },
    indicacoes: ["Crise > 5 min ou crises recorrentes sem recuperação de consciência"],
    passos: [
      "1. ABC, glicemia (tratar hipoglicemia), O2, acesso venoso, tempo da crise.",
      "2. 1ª linha: benzodiazepínico (repetir 1×).",
      "3. 2ª linha: antiepiléptico IV (fenitoína OU levetiracetam OU valproato).",
      "4. Refratário: IOT + anestésico contínuo (midazolam/propofol) em UTI, EEG.",
      "5. Investigar causa (neuroimagem, eletrólitos, tóxicos, infecção/SNC).",
    ],
    doses: [
      { farmaco: "Diazepam", dose: "0,15–0,2 mg/kg (máx 10 mg)", via: "IV", obs: "Repetir 1×", mgPorKg: { min: 0.15, max: 0.2 } },
      { farmaco: "Midazolam", dose: "10 mg (0,2 mg/kg)", via: "IM/IN", obs: "Quando sem acesso IV", mgPorKg: { min: 0.2 } },
      { farmaco: "Fenitoína", dose: "20 mg/kg (ataque, teto ~1.500 mg)", via: "IV (≤ 50 mg/min)", obs: "Diluir em SF 0,9% (NUNCA em SG — precipita); ≤ 50 mg/min (idoso/cardiopata ≤ 20). VESICANTE: veia calibrosa/linha exclusiva, filtro in-line, flush de SF antes/depois. Teto ~1.500 mg. Monitor ECG/PA e PARE se hipotensão/BAV/QRS alargar. Refratário: +10 mg/kg (considerar fosfenitoína).", mgPorKg: { min: 20 }, maxAbs: 1500 },
      { farmaco: "Levetiracetam", dose: "60 mg/kg (máx 4,5 g)", via: "IV", obs: "Alternativa", mgPorKg: { min: 60 } },
    ],
    alertas: [
      "Sempre checar e tratar hipoglicemia.",
      "Não subdosar o benzodiazepínico — causa comum de falha.",
      "Refratário: caminho para IOT + UTI + EEG.",
    ],
    referencia: "Diretrizes de estado de mal epiléptico (NCS/ILAE). Verificar protocolo local.",
    tags: ["convulsao", "estado de mal", "epileptico", "diazepam", "midazolam", "fenitoina"],
  },
  {
    id: "hipercalemia",
    titulo: "Hipercalemia Grave",
    categoria: "METABOLICO",
    resumo: "Cálcio (membrana) → insulina+glicose/beta2 (shift) → remover (diálise).",
    acaoRapida: {
      gatilho: "K+ alto com alteração no ECG (T apiculada, QRS alargado) ou K+ > 6,5.",
      passos: [
        {
          acao: "Gluconato de cálcio 10% 10–20 mL IV em 2–5 min (protege o coração)",
          ampola: "1–2 ampolas (10 mL) · repetir se o ECG persistir",
        },
        {
          acao: "Insulina regular 10 UI IV + glicose 25 g (desloca o K+)",
          ampola: "50 mL de glicose 50% · monitorar glicemia",
          repetir: "Associar beta-2 (salbutamol 10–20 mg nebulização).",
        },
        {
          acao: "Remover: diurético / resina; DIÁLISE se grave ou renal",
        },
      ],
      naoFaca: "Cálcio NÃO baixa o K+ (só protege a membrana) — sempre fazer o shift e a remoção. Insulina sem glicose causa hipoglicemia.",
    },
    indicacoes: ["K+ elevado com alteração de ECG (T apiculada, alargamento de QRS) ou K+ > 6,5"],
    passos: [
      "1. ECG imediato (T apiculada, PR longo, QRS alargado, padrão sinusoidal).",
      "2. ESTABILIZAR membrana: gluconato de cálcio.",
      "3. DESLOCAR para o intracelular: insulina regular + glicose; beta-2 (salbutamol); considerar bicarbonato se acidose.",
      "4. REMOVER: diurético, resina de troca, DIÁLISE se grave/refratário/renal.",
      "5. Suspender fontes de K+ e drogas hipercalemiantes.",
    ],
    doses: [
      { farmaco: "Gluconato de cálcio 10%", dose: "10–20 mL", via: "IV em 2–5 min", obs: "Protege o miocárdio; repetir se ECG persistir" },
      { farmaco: "Insulina regular", dose: "10 UI", via: "IV", obs: "Sempre com glicose (ex.: 25 g) — monitorar glicemia" },
      { farmaco: "Salbutamol", dose: "10–20 mg nebulização", via: "INH", obs: "Shift adicional" },
    ],
    alertas: [
      "Cálcio NÃO reduz o K+ — apenas protege a membrana; faça o shift e a remoção.",
      "Insulina sem glicose causa hipoglicemia — monitorar.",
      "Refratário/renal: acionar diálise precocemente.",
    ],
    referencia: "Diretrizes de hipercalemia. Conferir protocolo/diálise local.",
    tags: ["hipercalemia", "potassio", "calcio", "insulina", "dialise", "ecg"],
  },
  {
    id: "intoxicacoes",
    titulo: "Intoxicações — Antídotos-chave",
    categoria: "INTOXICACAO",
    resumo: "Suporte + antídoto específico conforme o agente.",
    indicacoes: ["Intoxicação/overdose suspeita; rebaixamento, instabilidade ou exposição conhecida"],
    passos: [
      "1. ABCDE, glicemia, ECG; suporte é a base.",
      "2. Identificar agente (história, toxíndrome).",
      "3. Antídoto específico quando indicado (ver doses).",
      "4. Descontaminação selecionada (carvão ativado se < 1–2 h e via aérea protegida).",
      "5. Contato com Centro de Informação Toxicológica (CIT) / 0800-722-6001.",
    ],
    doses: [
      { farmaco: "Naloxona (opioide)", dose: "0,04–0,4 mg, titular", via: "IV/IM/IN", obs: "Reverter depressão respiratória" },
      { farmaco: "N-acetilcisteína (paracetamol)", dose: "Protocolo IV 21 h (3 bolsas)", via: "IV", obs: "3 bolsas SEQUENCIAIS: 150 mg/kg em 200 mL SG5% em 1 h → 50 mg/kg em 500 mL em 4 h → 100 mg/kg em 1.000 mL em 16 h. LIMITE o peso a ~100 kg no cálculo (evita hiponatremia). Nomograma de Rumack-Matthew só vale p/ ingestão ÚNICA com horário conhecido (nível 4–24 h); em ingestão escalonada/crônica/horário incerto/>24 h, iniciar NAC empírico por nível detectável + transaminases. Reação anafilactoide na 1ª bolsa: PAUSAR e tratar, não suspender o antídoto." },
      { farmaco: "Bicarbonato de sódio (tricíclico)", dose: "1–2 mEq/kg em bolus", via: "IV", obs: "QRS alargado/arritmia", mgPorKg: { min: 1, max: 2 }, unidade: "mEq/kg" },
      { farmaco: "Glucagon (betabloqueador)", dose: "3–10 mg", via: "IV", obs: "BB/BCC; considerar Ca, insulina-euglicemia" },
      { farmaco: "Atropina + pralidoxima (organofosforado)", dose: "Atropina titular; pralidoxima conforme protocolo", via: "IV", obs: "Síndrome colinérgica" },
    ],
    alertas: [
      "Flumazenil: uso restrito (risco de convulsão em dependentes/co-ingestão).",
      "Suporte e via aérea vêm antes de antídotos.",
      "Acionar o CIT precocemente.",
    ],
    referencia: "Toxicologia de emergência / CIT. Conferir protocolo local.",
    tags: ["intoxicacao", "antidoto", "naloxona", "nac", "bicarbonato", "glucagon", "organofosforado"],
  },
];

export function condutaById(id: string): CondutaCard | undefined {
  return CONDUTAS.find((c) => c.id === id);
}

// Situacoes do modo Acao Rapida, ordenadas por prioridade na sala vermelha.
const ACAO_ORDER = [
  "acls-pcr",
  "bradi-instavel",
  "cardioversao",
  "anafilaxia",
  "sri",
  "eme",
  "choque-sepse",
  "iam-supra",
  "hipercalemia",
];

export function condutasComAcao(): CondutaCard[] {
  return CONDUTAS.filter((c) => c.acaoRapida).sort((a, b) => {
    const ia = ACAO_ORDER.indexOf(a.id);
    const ib = ACAO_ORDER.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
}

export function searchComAcao(query: string): CondutaCard[] {
  const q = query.trim().toLowerCase();
  const base = condutasComAcao();
  if (!q) return base;
  return base.filter((c) => {
    const hay = [c.titulo, c.resumo ?? "", c.acaoRapida?.gatilho ?? "", ...(c.tags ?? []), ...c.doses.map((d) => d.farmaco)]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

// Busca simples por titulo, tags, resumo e farmacos.
export function searchCondutas(query: string): CondutaCard[] {
  const q = query.trim().toLowerCase();
  if (!q) return CONDUTAS;
  return CONDUTAS.filter((c) => {
    const hay = [
      c.titulo,
      c.resumo ?? "",
      ...(c.tags ?? []),
      ...c.indicacoes,
      ...c.doses.map((d) => d.farmaco),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}
