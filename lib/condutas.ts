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

export type Dose = {
  farmaco: string;
  dose: string;
  via?: string;
  obs?: string;
  // Coeficiente por kg (na unidade indicada). Habilita a calculadora por peso.
  mgPorKg?: { min: number; max?: number };
  unidade?: DoseUnidade; // default mg/kg
  concentracaoPadraoMgMl?: number; // so para mg/kg -> converte em mL
};

export type CondutaCard = {
  id: string;
  titulo: string;
  categoria: CondutaCategoria;
  resumo?: string;
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
      { farmaco: "Dopamina", dose: "5–20 mcg/kg/min", via: "IV (BIC)", obs: "Infusão titulável", mgPorKg: { min: 5, max: 20 }, unidade: "mcg/kg/min" },
      { farmaco: "Adrenalina", dose: "2–10 mcg/min", via: "IV (BIC)", obs: "Infusão titulável" },
    ],
    alertas: [
      "BAV 2º Mobitz II e BAVT: prepare marca-passo precocemente.",
      "Confirme CAPTURA mecânica (pulso) no MPTC, não só a espícula.",
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
      { farmaco: "Amiodarona", dose: "150 mg em 10 min, depois 1 mg/min", via: "IV", obs: "TV monomórfica estável" },
      { farmaco: "Sulfato de magnésio", dose: "1–2 g em 10–15 min", via: "IV", obs: "Torsades de pointes" },
      { farmaco: "Diltiazem", dose: "0,25 mg/kg em 2 min", via: "IV", obs: "Controle de FC na FA estável (cautela na IC/hipotensão)", mgPorKg: { min: 0.25 } },
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
    indicacoes: ["Suspeita de infecção + disfunção orgânica / hipotensão / lactato elevado"],
    passos: [
      "1. Coletar lactato e hemoculturas (2 pares) ANTES do ATB, sem atrasar.",
      "2. Antibiótico de amplo espectro na 1ª hora.",
      "3. Cristaloide 30 mL/kg em 1–3 h se hipotensão/lactato ≥ 4.",
      "4. Vasopressor se PAM < 65 após volume: noradrenalina 1ª escolha.",
      "5. Reavaliar perfusão; lactato seriado; considerar foco (controle cirúrgico/drenagem).",
    ],
    doses: [
      { farmaco: "Cristaloide (RL/SF)", dose: "30 mL/kg", via: "IV", obs: "Reavaliar responsividade a volume", mgPorKg: { min: 30 }, unidade: "mL/kg" },
      { farmaco: "Noradrenalina", dose: "0,05–0,5 mcg/kg/min", via: "IV (BIC)", obs: "1ª escolha; alvo PAM ≥ 65" },
      { farmaco: "Vasopressina", dose: "0,03 U/min", via: "IV", obs: "Adjuvante se NA insuficiente" },
      { farmaco: "Hidrocortisona", dose: "200 mg/dia", via: "IV", obs: "Choque refratário a vasopressor" },
    ],
    alertas: [
      "Não atrasar o ATB para coletar exames.",
      "Cuidado com sobrecarga de volume na disfunção cardíaca/renal — reavaliar.",
    ],
    referencia: "Surviving Sepsis Campaign. Verificar protocolo institucional de ATB.",
    tags: ["sepse", "choque", "noradrenalina", "lactato", "antibiotico", "pam"],
  },
  {
    id: "iam-supra",
    titulo: "IAM com Supra de ST (SCACSST)",
    categoria: "CARDIOLOGIA",
    resumo: "AAS + 2º antiagregante + anticoagulação + reperfusão (tempo!).",
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
      { farmaco: "Alteplase (rtPA)", dose: "0,9 mg/kg (máx 90 mg); 10% bolus, resto em 60 min", via: "IV", obs: "Dentro da janela; checar contraindicações", mgPorKg: { min: 0.9 } },
      { farmaco: "Tenecteplase", dose: "0,25 mg/kg (máx 25 mg)", via: "IV bolus", obs: "Alternativa conforme serviço", mgPorKg: { min: 0.25 } },
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
      { farmaco: "Fenitoína", dose: "20 mg/kg", via: "IV (≤ 50 mg/min)", obs: "Monitorizar; risco de hipotensão/arritmia", mgPorKg: { min: 20 } },
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
      { farmaco: "N-acetilcisteína (paracetamol)", dose: "Protocolo 21 h IV", via: "IV", obs: "Guiar por nomograma/tempo" },
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
