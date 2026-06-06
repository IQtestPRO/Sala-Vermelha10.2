import { condutaById, CondutaCard } from "@/lib/condutas";

// Base de conhecimento por condicao: um "agente especialista" fundamentado em
// evidencia (diretrizes), pesquisado/curado no build e embutido no prompt do /api/analyze.

export type SpecialistEvidence = {
  fato: string; // 1 linha decisiva (limiar/criterio/dose/energia)
  fonte: string; // nome da diretriz/fonte (ex.: "AHA/ACLS 2020")
};

export type SpecialistConfig = {
  condutaId: string;
  papel: string; // injetado verbatim ("cardiologista emergencista, especialista em ...")
  evidencias: SpecialistEvidence[];
  oQueLer: string[]; // o que olhar NA IMAGEM para esta condicao
  redFlags: string[];
  acaoPrioritaria: string; // a acao imediata mais decisiva (semeia condutaImediata)
  fontes: string[]; // nomes das diretrizes (dedup) — semeia o campo "fontes" da resposta
};

// Preenchido pela pesquisa (workflow). Enquanto vazio, todas as condicoes usam o
// fallback abaixo (a partir do proprio card em lib/condutas.ts) — o app ja funciona.
export const SPECIALISTS: Record<string, SpecialistConfig> = {
  "acls-pcr": {
    "condutaId": "acls-pcr",
    "papel": "Médico emergencista/intensivista sênior em ACLS, especialista em leitura rápida de ECG/monitor na sala vermelha e manejo da PCR e periarresto (ritmos chocáveis/não-chocáveis, bradi/taquiarritmias instáveis e causas reversíveis).",
    "evidencias": [
      {
        "fato": "Ritmos chocáveis (FV/TV sem pulso): desfibrilar IMEDIATAMENTE com choque ÚNICO, bifásico 120–200 J (conforme fabricante; se desconhecido, usar máximo) e RCP 2 min entre choques. Monofásico = 360 J.",
        "fonte": "AHA/ACLS 2020"
      },
      {
        "fato": "Adrenalina 1 mg IV/IO a cada 3–5 min em TODA PCR. Em ritmo NÃO-chocável (AESP/assistolia): o mais precoce possível. Em chocável: após o 2º choque.",
        "fonte": "AHA/ACLS 2020 (atualização 2023/2025)"
      },
      {
        "fato": "FV/TVsp REFRATÁRIA (após 3º choque): Amiodarona 300 mg IV/IO em bolus, 2ª dose 150 mg; OU Lidocaína 1–1,5 mg/kg, repetir 0,5–0,75 mg/kg. Sulfato de magnésio 1–2 g APENAS para Torsades/QT longo, não de rotina.",
        "fonte": "AHA/ACLS Atualização Antiarrítmicos 2018 / ACLS 2020"
      },
      {
        "fato": "Bradicardia INSTÁVEL (hipotensão, alteração de consciência, choque, dor torácica isquêmica, IC aguda): Atropina 1 mg IV, repetir a cada 3–5 min até máx 3 mg; se refratária → marca-passo transcutâneo E/OU dopamina 5–20 mcg/kg/min ou adrenalina 2–10 mcg/min.",
        "fonte": "AHA/ACLS 2020"
      },
      {
        "fato": "Taquicardia INSTÁVEL com pulso: cardioversão SINCRONIZADA imediata. QRS estreito regular 50–100 J; FA 120–200 J (bifásico); flutter/TV monomórfica regular ~100 J; TV polimórfica instável = desfibrilar (não sincronizado).",
        "fonte": "AHA/ACLS 2020"
      },
      {
        "fato": "Taquicardia ESTÁVEL QRS estreito regular: manobra vagal, depois Adenosina 6 mg IV push rápido + flush 20 mL; se falhar 12 mg. Não usar adenosina em ritmo irregular (FA/flutter) nem em TV de QRS largo irregular.",
        "fonte": "AHA/ACLS 2020"
      },
      {
        "fato": "STEMI no ECG: supra de ST em ≥2 derivações contíguas — ≥1 mm na maioria; em V2–V3 ≥2 mm (homem ≥40a), ≥2,5 mm (homem <40a), ≥1,5 mm (mulher). BRE novo/presumido novo ou critérios de Sgarbossa = equivalente. Ativar hemodinâmica/reperfusão.",
        "fonte": "ESC 2023 STEMI / SBC / Definição Universal de IAM"
      },
      {
        "fato": "Hipercalemia (causa reversível de AESP/TV): T apiculada → PR alargado/perda de P → QRS alargado → onda sinusoidal. Gluconato de cálcio 10% 10–30 mL IV (ou cloreto de cálcio 10% 10 mL) estabiliza miocárdio em minutos (dura ~30–60 min); cálcio indicado se QRS largo/perda de P, não T apiculada isolada.",
        "fonte": "AHA/ACLS 2020 (causas reversíveis) / Surviving Sepsis e literatura de eletrólitos"
      },
      {
        "fato": "Anafilaxia: Adrenalina IM 0,5 mg (1:1000) na coxa anterolateral, repetir a cada 5–15 min; se choque refratário → infusão IV. Não atrasar por anti-histamínico/corticoide.",
        "fonte": "WAO Anaphylaxis Guidance 2020"
      }
    ],
    "oQueLer": [
      "Ritmo de base: FV (ondulações caóticas, sem QRS), TV (QRS largo regular monomórfico ou polimórfico/Torsades), assistolia (linha quase reta — confirmar ganho e checar 2 derivações), AESP (ritmo organizado SEM pulso — correlacionar clínica).",
      "Largura do QRS (estreito <120 ms vs largo ≥120 ms) e regularidade do RR — definem taquiarritmia e via terapêutica.",
      "Frequência cardíaca real no monitor e relação P–QRS (BAV 1º/2º Mobitz I-II/3º grau/dissociação AV) para bradicardia.",
      "Segmento ST e onda T: supra (STEMI/contíguas), infra (isquemia/recíproca), T apiculada ou onda sinusoidal (hiperkalemia), QT longo (risco de Torsades).",
      "Captura do marca-passo: espícula seguida de QRS amplo (captura elétrica) vs espícula sem captura; correlacionar com pulso (captura mecânica).",
      "EtCO2 na capnografia: <10 mmHg após 20 min de RCP = mau prognóstico; SUBIDA abrupta (>35–40) sugere ROSC; qualidade da RCP.",
      "SpO2 (pletismografia confiável só com pulso/perfusão), PA invasiva/NIBP e tendência — definem instabilidade.",
      "Artefatos: tremor/má aderência de eletrodo podem simular FV/TV — sempre cruzar ritmo do monitor com pulso central e clínica antes de chocar."
    ],
    "redFlags": [
      "FV/TV sem pulso → choque NÃO pode atrasar; cada minuto sem desfibrilação reduz sobrevida ~7–10%.",
      "TV polimórfica/Torsades ou onda sinusoidal (hiperkalemia) → manejo específico (Mg, cálcio) além do choque.",
      "Bradi/taqui COM sinais de instabilidade (hipotensão, rebaixamento, choque, dor isquêmica, congestão) → intervenção elétrica imediata, não esperar droga.",
      "Supra de ST / BRE novo / Sgarbossa+ → reperfusão urgente (cateterismo/trombólise), tempo-dependente.",
      "EtCO2 que NÃO sobe apesar de RCP de qualidade prolongada → reavaliar causas reversíveis (Hs/Ts) e prognóstico; queda súbita do EtCO2 → reposicionar/checar tubo.",
      "BAV total / pausas longas / QRS largo bradicárdico → risco de assistolia iminente, preparar marca-passo.",
      "QRS alargando progressivamente sem isquemia óbvia → suspeitar hiperkalemia/intoxicação por bloqueador de canal de sódio."
    ],
    "acaoPrioritaria": "Confirme pulso/responsividade e leia o ritmo: se FV/TV sem pulso, desfibrile AGORA (bifásico 120–200 J) e retome RCP de alta qualidade; se há pulso mas o paciente está instável, vá direto à terapia elétrica (cardioversão sincronizada na taqui, marca-passo/atropina na bradi) enquanto busca a causa reversível (Hs e Ts).",
    "fontes": [
      "AHA/ACLS 2020 (Guidelines for CPR and ECC)",
      "AHA/ACLS Atualização Focada em Antiarrítmicos 2018",
      "AHA/ACLS Atualizações Focadas 2023/2025",
      "ESC 2023 (manejo do IAM com supra de ST / STEMI)",
      "SBC — Sociedade Brasileira de Cardiologia (diretrizes IAM e arritmias)",
      "Definição Universal de Infarto do Miocárdio",
      "WAO — World Allergy Organization Anaphylaxis Guidance 2020",
      "Surviving Sepsis Campaign 2021 e literatura de distúrbios eletrolíticos (hiperkalemia)"
    ]
  },
  "bradi-instavel": {
    "condutaId": "bradi-instavel",
    "papel": "Cardiologista emergencista/intensivista, especialista em bradiarritmias instáveis em sala vermelha.",
    "evidencias": [
      {
        "fato": "Bradicardia = FC < 50-60 bpm; tratar como INSTÁVEL quando a FC baixa causa hipotensão, alteração do nível de consciência aguda, sinais de choque/má perfusão, dor torácica isquêmica ou insuficiência cardíaca aguda. É a clínica (perfusão), não o número, que define a urgência.",
        "fonte": "AHA/ACLS 2020"
      },
      {
        "fato": "1ª linha medicamentosa: Atropina 1 mg IV/IO em bolus, repetir a cada 3-5 min, dose máxima total de 3 mg.",
        "fonte": "AHA/ACLS 2020"
      },
      {
        "fato": "Se atropina falhar ou for improvável funcionar: iniciar marca-passo transcutâneo (MPT) E/OU infusão cronotrópica — Dopamina 5-20 mcg/kg/min OU Adrenalina 2-10 mcg/min (titular ao efeito). Isoproterenol é alternativa beta-agonista.",
        "fonte": "AHA/ACLS 2020"
      },
      {
        "fato": "Em BAV 2º grau Mobitz II e BAVT (3º grau), sobretudo com QRS largo (escape infranodal/ventricular), a atropina é geralmente INEFICAZ e pode piorar — MPT é Classe I e deve ser a 1ª medida; preparar marca-passo transvenoso.",
        "fonte": "Diretriz ACC/AHA/HRS 2018 de Bradicardia; AHA/ACLS 2020"
      },
      {
        "fato": "Técnica do MPT: FC alvo ~60-80 bpm; aumentar a corrente até captura elétrica (espícula seguida de QRS alargado + onda T); captura típica em ~40-80 mA (mais em obesidade/DPOC); manter 10-20 mA ACIMA do limiar de captura; sedação/analgesia para a dor do estímulo.",
        "fonte": "ACC/AHA/HRS 2018; StatPearls Transcutaneous Pacing"
      },
      {
        "fato": "SEMPRE confirmar captura MECÂNICA (não só elétrica): pulso central/femoral palpável, onda de pulso na oximetria ou POCUS. Sem pulso correspondente = pseudocaptura (artefato), paciente segue sem débito.",
        "fonte": "EMCrit IBCC Bradycardia; StatPearls"
      },
      {
        "fato": "Causas reversíveis a tratar em paralelo: hipercalemia (gluconato de cálcio + insulina/glicose), hipóxia, IAM de parede inferior/isquemia, hipotermia, hipertonia vagal, hipertensão intracraniana, e fármacos (betabloqueador, bloqueador de cálcio, digoxina).",
        "fonte": "ACC/AHA/HRS 2018; AHA/ACLS 2020"
      },
      {
        "fato": "Bradicardia tóxica: betabloqueador → Glucagon 3-10 mg IV; bloqueador de canal de cálcio → Cloreto/Gluconato de cálcio IV; ambos refratários → terapia com altas doses de insulina (HIET); intoxicação digitálica → anticorpo antidigoxina (Fab).",
        "fonte": "Toxicologia/AMIB; UpToDate-equivalente"
      },
      {
        "fato": "NÃO administrar atropina em paciente transplantado cardíaco (coração desnervado — risco de bloqueio AV paradoxal/parada); usar isoproterenol ou pacing direto.",
        "fonte": "ACC/AHA/HRS 2018"
      }
    ],
    "oQueLer": [
      "Frequência ventricular real (contar QRS) e regularidade — bradicardia sinusal vs bloqueio.",
      "Largura do QRS: estreito (origem nodal/alta, costuma responder a atropina) vs largo (escape infranodal/ventricular, pacing).",
      "Relação P-QRS: PR fixo longo (BAV 1º), PR progressivo+pausa (Mobitz I/Wenckebach), P bloqueadas com PR fixo (Mobitz II), dissociação AV total com mais P que QRS (BAVT).",
      "Espícula de marca-passo: presente sem QRS após = falha de captura/pseudocaptura; presente com QRS largo+T = captura elétrica OK.",
      "Sinais de hipercalemia no ECG: T apiculada, QRS alargado, P achatada/ausente, padrão senoidal.",
      "Sinais de isquemia: supra/infra de ST (especialmente parede inferior - II, III, aVF, com bradicardia/BAV).",
      "Monitor: PA (hipotensão), SpO2 com onda de pulso pletismográfica (perfusão real), EtCO2 se intubado, e correspondência entre FC do monitor e pulso palpável."
    ],
    "redFlags": [
      "Hipotensão (PAS < 90), choque, alteração aguda da consciência, dor torácica isquêmica ou edema agudo de pulmão = bradicardia INSTÁVEL, agir já.",
      "QRS largo com escape lento/ventricular ou BAVT/Mobitz II = atropina ineficaz, ir direto a pacing + cronotrópico.",
      "Espícula de MP sem QRS correspondente, ou FC do monitor sem pulso palpável = pseudocaptura — aumentar mA / reposicionar pás.",
      "Pausas longas, escape < 30-40 bpm ou ritmo agônico = risco iminente de assistolia/PCR.",
      "ECG de hipercalemia (T apiculada, QRS senoidal) = dar cálcio IMEDIATO antes de pacing prolongado.",
      "Bradicardia + IAM inferior, ou pós-transplante cardíaco, ou suspeita de intoxicação (BB/BCC/digital) — muda fármaco e antídoto."
    ],
    "acaoPrioritaria": "Se houver sinal de instabilidade, dar Atropina 1 mg IV imediatamente e, se QRS largo/Mobitz II/BAVT ou sem resposta, iniciar JÁ o marca-passo transcutâneo (com sedação) confirmando captura mecânica pelo pulso, enquanto se trata a causa reversível.",
    "fontes": [
      "AHA/ACLS 2020",
      "Diretriz ACC/AHA/HRS 2018 de Bradicardia e Distúrbios de Condução",
      "ESC (manejo de bradiarritmias/condução)",
      "AMIB / Toxicologia (antídotos)",
      "EMCrit IBCC Bradycardia",
      "StatPearls - Transcutaneous Pacing"
    ]
  },
  "cardioversao": {
    "condutaId": "cardioversao",
    "papel": "Médico emergencista/intensivista sênior, especialista em taquiarritmias instáveis e cardioversão elétrica sincronizada na sala vermelha.",
    "evidencias": [
      {
        "fato": "Cardioversão sincronizada é indicada na taquiarritmia COM PULSO + ao menos 1 sinal de instabilidade (os '4/5 D'): hipotensão/choque (PAS < 90 mmHg ou má perfusão), dor torácica isquêmica, dispneia com congestão/edema pulmonar, rebaixamento do nível de consciência. A instabilidade deve ser atribuível à arritmia.",
        "fonte": "AHA/ACLS 2020 (Tachycardia with a Pulse); SBC"
      },
      {
        "fato": "Taquiarritmias costumam causar instabilidade em FC > 150 bpm; abaixo disso (FC 120-150) a instabilidade geralmente tem outra causa (sepse, hipovolemia, dor) — trate a causa, NÃO cardioverta automaticamente.",
        "fonte": "AHA/ACLS 2020; Ta de Clínica/Guia clínico BR"
      },
      {
        "fato": "Energia de REFERÊNCIA (bifásico): FA = 120-200 J (iniciar 200 J); flutter atrial / TPSV (QRS estreito regular) = 50-100 J (iniciar 100 J); TV monomórfica com pulso = 100 J. Se falha, escalonar progressivamente (dobrar) até o máximo do aparelho.",
        "fonte": "AHA/ACLS 2020-2025; StatPearls"
      },
      {
        "fato": "SEMPRE ativar o modo SINCRONIZADO (choque cai na onda R) para evitar o fenômeno R-sobre-T, que pode degenerar em FV. Confirmar marcadores de sincronismo sobre cada QRS antes de descarregar.",
        "fonte": "AHA/ACLS 2020; SBC"
      },
      {
        "fato": "EXCEÇÃO crítica: TV polimórfica (ex.: Torsades) e FV/QRS irregular largo NÃO se sincronizam — trate como parada/desfibrilação NÃO sincronizada com alta energia (200 J bifásico / 360 J monofásico). Em paciente instável onde o aparelho não consegue sincronizar, dar choque não sincronizado imediatamente.",
        "fonte": "AHA/ACLS 2020; SBC"
      },
      {
        "fato": "Sedação/analgesia ANTES do choque se o paciente estiver consciente e o tempo permitir, sem atrasar a cardioversão no paciente muito instável. Opções de referência: etomidato 0,15-0,3 mg/kg IV; cetamina 1-2 mg/kg IV; propofol 0,5-1 mg/kg IV; midazolam 0,02-0,05 mg/kg ± fentanil 1 mcg/kg (cuidado com depressão respiratória/hipotensão).",
        "fonte": "AHA/ACLS 2020; BJA Education (Anaesthesia for cardioversion)"
      },
      {
        "fato": "TV monomórfica estável e regular pode ser tratada com cardioversão sincronizada eletiva; refratário/escalonamento e antiarrítmico adjuvante (amiodarona 150 mg IV em 10 min) podem ser usados, mas NUNCA atrasar choque no instável.",
        "fonte": "AHA/ACLS 2020"
      },
      {
        "fato": "Pás/eletrodos em posição ântero-lateral ou ântero-posterior; após cada choque malsucedido, reavaliar ritmo, reativar SYNC (muitos aparelhos saem do modo sync após o disparo) e aumentar a energia.",
        "fonte": "StatPearls; AHA/ACLS 2020"
      }
    ],
    "oQueLer": [
      "FC e regularidade do RR: taquicardia (>150 bpm sugere arritmia como causa da instabilidade); regular vs irregular.",
      "Largura do QRS: estreito (<120 ms = supraventricular) vs largo (≥120 ms = TV até prova em contrário).",
      "Morfologia do QRS largo: monomórfico (uniforme → sincronizar) vs polimórfico/QRS variável tipo 'fuso' Torsades (NÃO sincronizar → desfibrilar).",
      "Linha de base/ondas P: ausência de P com ondas 'f' grosseiras e RR irregular (FA), ondas de flutter em 'dente de serra' (flutter), P retrógrada/regular estreito (TPSV).",
      "Presença de marcadores de SINCRONISMO do aparelho sobre cada onda R antes do disparo (se não marca QRS, não descarrega).",
      "Sinais de instabilidade no monitor: PA (PAS <90), SpO2 baixa/curva ruim, EtCO2 (perfusão), sinais de congestão.",
      "Segmento ST/onda T: supra/infra isquêmico que possa indicar SCA como gatilho ou consequência.",
      "Artefato/qualidade do traçado: confirmar que é ritmo real e não artefato antes de chocar."
    ],
    "redFlags": [
      "TV polimórfica / Torsades de pointes ou QRS largo irregular → NÃO sincronizar; desfibrilar com alta energia + corrigir Mg/QT.",
      "Ausência de pulso / perda de pulso a qualquer momento → protocolo de PCR (RCP + desfibrilação não sincronizada).",
      "Aparelho não consegue sincronizar em paciente muito instável → dar choque NÃO sincronizado imediatamente, não atrasar.",
      "Hipotensão grave/choque, edema agudo de pulmão, dor torácica isquêmica ou rebaixamento → cardioversão IMEDIATA, sem esperar sedação plena.",
      "FC <150 com instabilidade desproporcional → suspeitar de causa não-arrítmica (sepse, hipovolemia, TEP); cardioverter pode não resolver.",
      "Suspeita de intoxicação digitálica ou FA crônica >48h sem anticoagulação → ponderar risco (arritmia pós-choque / embolia), mas instabilidade prevalece."
    ],
    "acaoPrioritaria": "Se taquiarritmia com pulso + sinal de instabilidade: ativar modo SINCRONIZADO, sedar se possível sem atrasar, e aplicar cardioversão imediata na energia de referência do ritmo (FA 200 J; flutter/TPSV 100 J; TV monomórfica 100 J) — exceto TV polimórfica/FV, que exige desfibrilação NÃO sincronizada.",
    "fontes": [
      "AHA/ACLS 2020 (e atualização 2025) — Tachycardia With a Pulse Algorithm",
      "Sociedade Brasileira de Cardiologia (SBC)",
      "StatPearls — Synchronized Electrical Cardioversion",
      "BJA Education — Anaesthesia for cardioversion (sedação)",
      "Ta de Clínica / guias clínicos brasileiros de taquiarritmias"
    ]
  },
  "anafilaxia": {
    "condutaId": "anafilaxia",
    "papel": "Emergencista/intensivista sênior, especialista em anafilaxia e choque anafilático na sala vermelha — leitura de ECG/monitor para guiar adrenalina e manejo de via aérea/choque.",
    "evidencias": [
      {
        "fato": "Diagnóstico de anafilaxia (qualquer 1 dos 2 critérios): (1) início agudo (min-horas) com pele/mucosa + comprometimento respiratório OU PA baixa/sintomas de disfunção de órgão; OU (2) após exposição a alérgeno provável: hipotensão isolada, broncoespasmo ou envolvimento laríngeo, mesmo SEM lesão cutânea (urticária ausente em ~10-20%).",
        "fonte": "WAO / 2023 Practice Parameter Update (AAAAI/ACAAI); GA2LEN 2024"
      },
      {
        "fato": "1ª linha e tratamento que salva vida: ADRENALINA IM 1:1000, 0,01 mg/kg, dose adulto de REFERÊNCIA 0,3-0,5 mg (máx 0,5 mg adulto / 0,3 mg criança) na face anterolateral da coxa; repetir a cada 5-15 min se persistência. Não há contraindicação absoluta na anafilaxia.",
        "fonte": "WAO; ASBAI; AHA/ACLS"
      },
      {
        "fato": "Hipotensão/choque: bolus de cristaloide 1-2 L (20 mL/kg) rápido EV, repetir conforme resposta; posição supina com elevação de MMII (evitar sentar/levantar abruptamente — risco de 'empty ventricle' e morte súbita).",
        "fonte": "WAO; AHA/ACLS"
      },
      {
        "fato": "Anafilaxia refratária (sem resposta após ≥2 doses de adrenalina IM ≥0,3 mg + fluidos): iniciar INFUSÃO EV de adrenalina 1:10000 titulada, REFERÊNCIA 0,05-0,1 mcg/kg/min (~1-10 mcg/min), com monitor contínuo; bolus EV lento 50-100 mcg só em ambiente monitorizado/risco de PCR.",
        "fonte": "WAO; AHA Part 10.6 Anaphylaxis; Refractory Anaphylaxis guidelines 2024"
      },
      {
        "fato": "Paciente em uso de BETABLOQUEADOR e refratário: GLUCAGON 1-5 mg EV em 5 min (criança 20-30 mcg/kg, máx 1 mg), seguido de infusão 5-15 mcg/min; ação inotrópica/cronotrópica independe de receptor beta.",
        "fonte": "WAO; ASBAI; AHA"
      },
      {
        "fato": "PCR por anafilaxia: ACLS padrão — adrenalina 1 mg EV/IO a cada 3-5 min, RCP de alta qualidade, fluidos agressivos; considerar via aérea avançada precoce e RCP prolongada/ECLS (causa reversível).",
        "fonte": "AHA/ACLS 2020"
      },
      {
        "fato": "2ª linha (NUNCA substituem adrenalina, não tratam choque/obstrução): anti-H1 (difenidramina 25-50 mg ou prometazina) para urticária/prurido; corticoide (metilprednisolona 1-2 mg/kg ou hidrocortisona 200 mg) sem benefício comprovado em prevenir reação bifásica; broncoespasmo refratário: salbutamol inalatório.",
        "fonte": "WAO; 2023 Practice Parameter Update"
      },
      {
        "fato": "Reação BIFÁSICA em ~5-20%: observação mínima 4-6 h após resolução; estender (≥6-12 h ou internar) se reação grave, >1 dose de adrenalina, hipotensão, obstrução de via aérea ou acesso difícil a emergência.",
        "fonte": "ASBAI; 2023 Practice Parameter Update"
      },
      {
        "fato": "Síndrome de Kounis (SCA alérgica por vasoespasmo coronário/degranulação mastocitária): supra/infra de ST + dor torácica DURANTE a anafilaxia; tratar a anafilaxia (adrenalina mantida) — distinguir de isquemia pós-adrenalina; manter cardioproteção e avaliar coronária se persistir.",
        "fonte": "Literatura cardiológica (Kounis); ESC"
      }
    ],
    "oQueLer": [
      "Ritmo e FC: taquicardia sinusal é o padrão esperado do choque distributivo/adrenalina; BRADICARDIA com hipotensão é red flag (reflexo de Bezold-Jarisch / pré-PCR / betabloqueio).",
      "Segmento ST/onda T: supra ou infra de ST e inversão de T = suspeitar Kounis (vasoespasmo) vs isquemia induzida por adrenalina — ver se surgiu antes ou depois da adrenalina.",
      "Supra de ST em aVR + infra difuso = isquemia de tronco/global, sinal de instabilidade grave.",
      "SpO2 (hipoxemia por broncoespasmo/edema laríngeo) e curva pletismográfica — queda + estridor = via aérea ameaçada.",
      "EtCO2 (capnografia): EtCO2 alto/em ascensão no broncoespasmo grave; queda abrupta = baixo débito/PCR iminente; útil para confirmar IOT e qualidade de RCP.",
      "PA/PAM no monitor: PAS <90 ou queda >30% do basal = choque; PAM <65 indica vasopressor/infusão de adrenalina.",
      "Captura de marca-passo e largura do QRS (QRS alargado pode indicar hipóxia/hipercalemia/efeito de doses altas de adrenalina).",
      "Tendência temporal do monitor: deterioração rápida de FC/PA/SpO2 ao longo de minutos pesa mais que um valor isolado."
    ],
    "redFlags": [
      "Estridor, rouquidão, sialorreia ou edema de língua/lábios — via aérea fechando: IOT precoce por mais experiente, preparar via aérea cirúrgica.",
      "Bradicardia + hipotensão (não a taquicardia esperada) — pré-parada / Bezold-Jarisch / betabloqueio: adrenalina imediata, atropina/glucagon, preparar RCP.",
      "Hipotensão refratária após ≥2 doses IM de adrenalina + fluidos — escalonar para infusão EV de adrenalina e 2º vasopressor (noradrenalina); chamar UTI.",
      "SpO2 em queda apesar de O2 / EtCO2 despencando — falência respiratória iminente ou baixo débito/PCR.",
      "Supra de ST / dor torácica (Kounis ou isquemia por adrenalina) — manter tratamento da anafilaxia, monitor contínuo, avaliar coronária; não suspender adrenalina por medo na anafilaxia ativa.",
      "Paciente em betabloqueador/IECA sem resposta — adicionar glucagon precocemente.",
      "Recorrência de sintomas após melhora (reação bifásica) — nova dose de adrenalina e reobservação prolongada."
    ],
    "acaoPrioritaria": "AGORA: ADRENALINA IM 0,3-0,5 mg (1:1000) na coxa imediatamente, deitar o paciente com pernas elevadas, O2 alto fluxo e cristaloide 1-2 L rápido — repetir a adrenalina IM a cada 5-15 min; se refratário, iniciar infusão EV de adrenalina.",
    "fontes": [
      "WAO (World Allergy Organization) - Anaphylaxis Guidance",
      "2023 Practice Parameter Update on Anaphylaxis (AAAAI/ACAAI/JTFPP)",
      "GA2LEN 2024 Consensus / Clinical Support Tool",
      "ASBAI (Associação Brasileira de Alergia e Imunologia)",
      "AHA/ACLS 2020 (Part 10.6 Anaphylaxis)",
      "ESC (síndrome coronariana aguda / Kounis)",
      "Refractory Anaphylaxis Guidelines (Pouessel et al., 2024)"
    ]
  },
  "sri": {
    "condutaId": "sri",
    "papel": "Médico emergencista/intensivista sênior, especialista em leitura rápida de ECG/monitor na sala vermelha e nas arritmias e síndromes que decidem conduta em Sequência Rápida de Intubação (SRI).",
    "evidencias": [
      {
        "fato": "Bradicardia instável (FC < 50 com hipotensão/má perfusão/alteração de consciência/dor torácica isquêmica): atropina 1 mg IV em bolus, repetir a cada 3-5 min até máx 3 mg; se refratária, marca-passo transcutâneo OU dopamina 5-20 mcg/kg/min OU adrenalina 2-10 mcg/min em infusão.",
        "fonte": "AHA/ACLS 2020"
      },
      {
        "fato": "Taquicardia INSTÁVEL com pulso (hipotensão, alteração de consciência, choque, dor torácica, IC aguda): cardioversão SINCRONIZADA imediata — QRS estreito regular ~50-100 J, FA/estreito irregular ~120-200 J, QRS largo regular (TV monomórfica c/ pulso) ~100 J; TV polimórfica instável = desfibrilação NÃO sincronizada.",
        "fonte": "AHA/ACLS 2020"
      },
      {
        "fato": "Taquicardia ESTÁVEL de QRS estreito regular (TPSV): manobra vagal, depois adenosina 6 mg IV em bolus rápido + flush; se falhar, 12 mg. QRS largo regular estável e monomórfico: amiodarona 150 mg IV em 10 min (alternativa procainamida).",
        "fonte": "AHA/ACLS 2020"
      },
      {
        "fato": "PCR ritmo chocável (FV/TV sem pulso): desfibrilação imediata (bifásico conforme fabricante, tipicamente 120-200 J; monofásico 360 J), RCP 2 min; adrenalina 1 mg IV a cada 3-5 min; amiodarona 300 mg IV após 3º choque, 2ª dose 150 mg (ou lidocaína 1-1,5 mg/kg). PEA/assistolia: NÃO chocar — RCP + adrenalina 1 mg + tratar causas (5H/5T).",
        "fonte": "AHA/ACLS 2020"
      },
      {
        "fato": "STEMI ao ECG: novo supra de ST no ponto J em ≥2 derivações contíguas — ≥1 mm em qualquer derivação exceto V2-V3; em V2-V3 ≥2 mm (homens ≥40a), ≥2,5 mm (homens <40a) ou ≥1,5 mm (mulheres). ECG nos primeiros 10 min; reperfusão urgente: ICP primária preferencial, ou fibrinólise (tenecteplase em bólus) se ICP indisponível em tempo (estratégia fármaco-invasiva).",
        "fonte": "4ª Definição Universal de IAM (ESC/AHA 2018); Diretriz SBC IAMCSST"
      },
      {
        "fato": "Anafilaxia (1ª linha absoluta): adrenalina IM 0,01 mg/kg de solução 1:1000 (1 mg/mL), máx 0,5 mg no adulto, na face anterolateral da coxa (vasto lateral); repetir a cada 5-15 min se necessário. Reação bifásica pode ocorrer até 72 h. NÃO usar anti-histamínico/corticoide como tratamento de 1ª linha.",
        "fonte": "WAO Anaphylaxis Guidance 2020"
      },
      {
        "fato": "Sepse/choque séptico: lactato sérico (>2 mmol/L sinaliza hipoperfusão); cristaloide 30 mL/kg nas primeiras 3 h; antibiótico de amplo espectro idealmente em até 1 h (imediato no choque), colhendo hemoculturas antes se não atrasar; vasopressor de 1ª linha = noradrenalina com alvo de PAM ≥65 mmHg.",
        "fonte": "Surviving Sepsis Campaign 2021"
      },
      {
        "fato": "Estado de mal epiléptico (crise ≥5 min ou crises sem recuperação): 1ª linha BENZODIAZEPÍNICO em dose plena — midazolam 10 mg IM (sem acesso) OU lorazepam 4 mg IV OU diazepam 6-10 mg IV; 2ª linha (urgente) fenitoína/fosfenitoína, valproato OU levetiracetam (equivalentes pelo ESETT). Refratário após benzo + 2º fármaco.",
        "fonte": "Neurocritical Care Society 2012; ESETT"
      },
      {
        "fato": "Hipercalemia com alterações no ECG (T apiculada/estreita V2-V3, PR longo, perda de onda P, QRS alargado → onda sinusoide): gluconato de cálcio 10% 10-30 mL IV em 5-10 min para estabilizar a membrana (NÃO baixa o K); depois insulina regular 10 U + glicose (25 g/D50 50 mL) e beta-2 inalatório para desviar K intracelular.",
        "fonte": "Whitebook/UpToDate-equivalente; protocolos de hipercalemia"
      }
    ],
    "oQueLer": [
      "Ritmo de base: regular vs irregular; presença/ausência e relação das ondas P com QRS (dissociação AV, bloqueio); largura do QRS (estreito <120 ms vs largo ≥120 ms).",
      "Frequência cardíaca exibida no monitor (bradi <50 vs taqui >150) e correlação com a PA não invasiva/invasiva (instabilidade = hipotensão).",
      "Segmento ST: supra (medir mm no ponto J, contar derivações contíguas, território) vs infra/imagem em espelho (recíproca); T apiculada e estreita (hipercalemia) vs T invertida.",
      "Intervalos: PR (alargado/bloqueio), QT/QTc (longo → risco de Torsades), QRS progressivamente alargado (hipercalemia/intoxicação por bloqueador de canal de Na).",
      "Captura/espícula de marca-passo: presença de espícula, captura efetiva (espícula seguida de QRS) vs falha de captura.",
      "Morfologia em TV/FV: monomórfica regular vs polimórfica (Torsades) vs FV grosseira/fina vs linha isoelétrica (assistolia — confirmar em 2 derivações).",
      "Oximetria (SpO2) e onda pletismográfica (perfusão), EtCO2/capnografia (confirmação de via aérea, qualidade da RCP, ROSC com subida abrupta) e PA/PAM no monitor."
    ],
    "redFlags": [
      "Sinais de INSTABILIDADE com a arritmia (hipotensão/PAM baixa, rebaixamento, dor torácica isquêmica, sinais de choque ou IC aguda) → cardioversão/desfibrilação imediata, não esperar fármaco.",
      "QRS largo + irregular ou TV polimórfica/Torsades → risco de degeneração para FV; QT longo associado.",
      "FV/TV sem pulso ou assistolia/PEA no traçado → iniciar RCP e protocolo de PCR sem demora.",
      "Supra de ST novo com recíproca, BRE novo/presumivelmente novo ou padrão de oclusão → ativar reperfusão (ICP/fibrinólise) urgente.",
      "ECG evoluindo para QRS sinusoide/perda de onda P → hipercalemia grave iminente de parada; dar cálcio JÁ.",
      "Lactato elevado/PAM <65 refratária a volume (choque), SpO2 em queda, EtCO2 anormal ou ausente após intubação → escalonar (vasopressor, reavaliar via aérea/tubo).",
      "Bradicardia refratária à atropina, estridor/edema de via aérea (anafilaxia) ou crise convulsiva persistente → preparar marca-passo, via aérea avançada/SRI e benzodiazepínico imediato."
    ],
    "acaoPrioritaria": "Decidir em segundos se o paciente está INSTÁVEL: se sim, tratar o ritmo na hora (desfibrilação se FV/TV sem pulso; cardioversão sincronizada se taqui instável com pulso; atropina/marca-passo se bradi instável) e, em paralelo, garantir via aérea/SRI, oxigenação e acesso, tratando a causa reversível identificada no traçado.",
    "fontes": [
      "AHA/ACLS 2020 (American Heart Association)",
      "4ª Definição Universal de Infarto do Miocárdio (ESC/ACC/AHA/WHF 2018)",
      "Diretriz da Sociedade Brasileira de Cardiologia sobre IAM com Supradesnível do Segmento ST",
      "WAO Anaphylaxis Guidance 2020 (World Allergy Organization)",
      "Surviving Sepsis Campaign 2021 (SCCM/ESICM)",
      "Neurocritical Care Society 2012 — Estado de Mal Epiléptico; ensaio ESETT",
      "Protocolos de hipercalemia (Whitebook/UpToDate-equivalente)"
    ]
  },
  "eme": {
    "condutaId": "eme",
    "papel": "Neurointensivista/emergencista sênior, especialista em estado de mal epiléptico (EME) convulsivo e refratário em sala vermelha.",
    "evidencias": [
      {
        "fato": "EME convulsivo = crise tônico-clônica >5 min OU >=2 crises sem recuperação da consciência entre elas (T1=5 min: tratar; T2=30 min: risco de lesão neuronal permanente). É emergência tempo-dependente.",
        "fonte": "ILAE 2015 / NCS"
      },
      {
        "fato": "1a linha = benzodiazepínico em dose plena (subdosagem é o erro mais comum): Lorazepam 0,1 mg/kg IV (máx ~4 mg/dose, repetir 1x); ou Diazepam 0,15-0,2 mg/kg IV (10 mg, máx cumulativo 30 mg); ou SEM acesso IV: Midazolam 10 mg IM (>40 kg). Pode repetir após 5 min.",
        "fonte": "AES 2016 / RAMPART / ILAE"
      },
      {
        "fato": "2a linha (20-40 min, após BZD): Levetiracetam 60 mg/kg IV (máx 4,5 g) OU Fenitoína/Fosfenitoína 20 mg(PE)/kg IV (máx ~1500) OU Valproato 40 mg/kg IV (máx 3000). Equivalência entre as três (ESETT) — escolher pela menor toxicidade no caso.",
        "fonte": "AES 2016 / ESETT 2019"
      },
      {
        "fato": "Fenitoína/fosfenitoína exige MONITOR ECG + PA contínuos: infundir fenitoína <=50 mg/min (<=1 mg/kg/min); risco de hipotensão, bradicardia, BAV, prolongamento de QT, TV/FV e assistolia se rápida. Em idoso/cardiopata, infundir mais devagar.",
        "fonte": "Bula/ANMF; protocolos NHS de fenitoína IV"
      },
      {
        "fato": "EME REFRATÁRIO = falha de BZD + 1 anticonvulsivante de 2a linha em dose adequada (~25% dos casos). Conduta: IOT + infusão anestésica contínua com EEG. Midazolam infusão, Propofol 50-80 mcg/kg/min, ou Pentobarbital/Tiopental.",
        "fonte": "NCS 2012 / AES 2016"
      },
      {
        "fato": "EME SUPER-REFRATÁRIO = persiste ou recorre apesar de >=24 h de anestesia geral; considerar cetamina, dose alta de anestésico, e busca agressiva de causa (autoimune/encefalite, etc.).",
        "fonte": "NCS / EMCrit IBCC"
      },
      {
        "fato": "Tempo zero: garantir VIA AÉREA/O2, monitor, 2 acessos, glicemia capilar IMEDIATA — corrigir hipoglicemia (Tiamina 100 mg IV antes de glicose no etilista/desnutrido) e distúrbios reversíveis (Na, Ca, Mg, uremia, intoxicação/eclâmpsia → MgSO4).",
        "fonte": "AES 2016 / NCS / ATLS-ABCDE"
      },
      {
        "fato": "Crise prolongada gera hipoxemia, acidose, hipertermia e rabdomiólise; a 'parada' da convulsão motora SEM despertar pode ser EME NÃO-CONVULSIVO (sutil) — só o EEG confirma. Hipoxia/hipotensão por si só causam atividade epileptiforme.",
        "fonte": "NCS 2012 / ILAE"
      }
    ],
    "oQueLer": [
      "Frequência cardíaca e ritmo: taquicardia sinusal é esperada na crise; bradicardia/BAV/assistolia DURANTE infusão sugere toxicidade de fenitoína — parar/desacelerar.",
      "Intervalo QT/QTc e morfologia QRS: alargamento de QRS ou QT longo pós-fenitoína; QT longo de base pode ser causa de síncope convulsiva (não-EME).",
      "SpO2 e curva pletismográfica: hipoxemia por aspiração/hipoventilação pós-BZD — gatilho para IOT.",
      "EtCO2 (se disponível): hipoventilação/apneia após benzodiazepínico ou anestésico; queda abrupta = via aérea comprometida.",
      "PA (não-invasiva ou linha arterial): hipotensão induzida por BZD, fenitoína, propofol ou pentobarbital — limita escalonamento.",
      "Artefato de movimento no traçado: oscilação rítmica de alta frequência no ECG/monitor que acompanha o abalo motor sugere atividade convulsiva ativa (não é arritmia).",
      "Temperatura: hipertermia por atividade motora sustentada.",
      "Glicemia capilar no monitor/registro: hipo ou hiperglicemia como causa reversível."
    ],
    "redFlags": [
      "Crise persistente >5 min ou recorrente sem recuperar consciência: iniciar BZD em dose plena JÁ.",
      "Falha de 2 medicações (BZD + 2a linha): declarar refratário → IOT + anestésico em infusão + EEG urgente.",
      "SpO2 em queda, apneia ou rebaixamento pós-BZD: assegurar via aérea / preparar IOT.",
      "Bradicardia, BAV, QT longo, hipotensão grave durante fenitoína/fosfenitoína: PARAR ou reduzir infusão; trocar para levetiracetam/valproato.",
      "Movimento motor cessou mas paciente não desperta: suspeitar EME não-convulsivo → EEG; não assumir resolução.",
      "Gestante/puérpera com crise + hipertensão: eclâmpsia → Sulfato de Magnésio, não somente BZD.",
      "Febre + rigidez de nuca / imunossupressão: encefalite/meningite como causa → antibiótico/aciclovir empíricos e neuroimagem/LCR.",
      "Hipoglicemia, hiponatremia grave ou intoxicação: tratar a causa em paralelo — sem isso a crise não cede."
    ],
    "acaoPrioritaria": "AGORA: proteger via aérea/O2 + monitor + glicemia capilar e, se crise >5 min, aplicar benzodiazepínico em DOSE PLENA imediatamente (Lorazepam 0,1 mg/kg IV ou, sem acesso, Midazolam 10 mg IM), preparando levetiracetam/fenitoína como 2a linha.",
    "fontes": [
      "AES 2016 (American Epilepsy Society — Guideline for Convulsive Status Epilepticus)",
      "NCS 2012 (Neurocritical Care Society — Status Epilepticus Guideline)",
      "ILAE 2015 (definição operacional T1/T2)",
      "ESETT 2019 (levetiracetam x fosfenitoína x valproato)",
      "RAMPART (midazolam IM pré-hospitalar)",
      "EMCrit IBCC (Status Epilepticus)",
      "Protocolos de fenitoína IV (NHS) e bula/ANMF (segurança cardíaca/infusão)",
      "ABCDE/ATLS (estabilização inicial)"
    ]
  },
  "choque-sepse": {
    "condutaId": "choque-sepse",
    "papel": "Médico emergencista/intensivista sênior, especialista em sepse e choque séptico, leitura de ECG/monitor à beira-leito na sala vermelha.",
    "evidencias": [
      {
        "fato": "Choque séptico = sepse + necessidade de vasopressor para manter PAM >=65 mmHg + lactato >2 mmol/L (18 mg/dL) APÓS reposição volêmica adequada; mortalidade >40%.",
        "fonte": "Sepsis-3 (JAMA 2016)"
      },
      {
        "fato": "Sepse = disfunção orgânica (aumento >=2 pontos no SOFA) por resposta desregulada à infecção. qSOFA (triagem rápida, >=2 dos 3): FR>=22, PAS<=100, alteração do nível de consciência (Glasgow<15).",
        "fonte": "Sepsis-3 (JAMA 2016)"
      },
      {
        "fato": "Bundle da 1a hora: medir lactato; coletar hemoculturas ANTES dos antibióticos; iniciar antibiótico de amplo espectro idealmente <=1h; cristaloide 30 mL/kg para hipotensão ou lactato >=4 mmol/L; vasopressor se hipotenso durante/após volume para PAM>=65.",
        "fonte": "Surviving Sepsis Campaign 2021 / Hour-1 Bundle"
      },
      {
        "fato": "Reposição inicial: pelo menos 30 mL/kg de cristaloide IV nas primeiras 3h; guiar pela queda do lactato e por tempo de enchimento capilar como alvo de perfusão; remensurar lactato se inicial >2 mmol/L.",
        "fonte": "Surviving Sepsis Campaign 2021"
      },
      {
        "fato": "Vasopressor de 1a linha: noradrenalina (referência ~0,05-0,5 mcg/kg/min, titular). Alvo PAM>=65 mmHg.",
        "fonte": "Surviving Sepsis Campaign 2021"
      },
      {
        "fato": "2a linha: adicionar vasopressina (referência 0,03 U/min) quando noradrenalina atinge ~0,25-0,5 mcg/kg/min; se débito cardíaco baixo persistente, adicionar adrenalina.",
        "fonte": "Surviving Sepsis Campaign 2021"
      },
      {
        "fato": "Choque refratário com necessidade contínua de vasopressor: hidrocortisona IV 200 mg/dia (50 mg 6/6h ou infusão contínua).",
        "fonte": "Surviving Sepsis Campaign 2021"
      },
      {
        "fato": "Cardiomiopatia séptica e arritmias (especialmente FA nova e taquicardia sinusal) são comuns; podem cursar com alterações tipo SCA (supra/infra de ST, BRE novo, QTc prolongado, onda J) — ECG NÃO é diagnóstico; ecocardiograma à beira-leito é o método de escolha.",
        "fonte": "Literatura de cardiomiopatia séptica (Front Cardiovasc Med 2023; ECCM 2022)"
      }
    ],
    "oQueLer": [
      "Ritmo e FC: taquicardia sinusal (resposta esperada à hipoperfusão/febre) vs FA com resposta ventricular alta de início recente.",
      "PA/PAM no monitor: PAM <65 mmHg sob volume = gatilho para vasopressor; hipotensão refratária a volume = choque.",
      "SpO2 e curva de pleti: hipoxemia, má perfusão periférica/onda fraca; necessidade de O2/suporte ventilatório.",
      "FR no monitor: taquipneia (>22) — componente do qSOFA e sinal de gravidade/acidose.",
      "Segmento ST/onda T/QTc: mudanças tipo isquêmica (supra/infra ST, BRE novo, QTc longo, onda J) que podem ser cardiomiopatia séptica e exigir descartar SCA real.",
      "EtCO2 (se capnografia): EtCO2 baixo sugere baixo débito/má perfusão; queda abrupta alerta para deterioração.",
      "Sinais indiretos de perfusão na cena/foto: livedo/moteamento, tempo de enchimento capilar lentificado, extremidades frias.",
      "Tendência do lactato (se houver no painel/registro): >2 define gravidade, >=4 dispara reposição agressiva."
    ],
    "redFlags": [
      "PAM <65 mmHg que NÃO sobe com 30 mL/kg de cristaloide -> iniciar noradrenalina JÁ (choque estabelecido).",
      "Lactato >=4 mmol/L ou em ascensão -> hipoperfusão grave, ressuscitação agressiva imediata.",
      "FA nova com instabilidade hemodinâmica -> considerar cardioversão; corrigir o choque em paralelo.",
      "Alteração aguda do nível de consciência + taquipneia + hipotensão (qSOFA>=2) -> alto risco de morte.",
      "Necessidade de noradrenalina crescente (>0,25-0,5 mcg/kg/min) -> adicionar vasopressina e hidrocortisona; reavaliar foco/echo.",
      "Supra de ST/BRE novo: não assumir cardiomiopatia séptica sem descartar SCA real (troponina/ECG seriado/equipe).",
      "Bradicardia/hipoxemia/EtCO2 despencando -> deterioração pré-parada: preparar via aérea e PCR.",
      "Atraso na 1a dose de antibiótico além de 1h em choque -> aumenta mortalidade."
    ],
    "acaoPrioritaria": "Reconhecer choque séptico e disparar o bundle da 1a hora AGORA: hemoculturas, antibiótico de amplo espectro <=1h, cristaloide 30 mL/kg e noradrenalina para PAM>=65 mmHg se hipotensão persistir.",
    "fontes": [
      "Surviving Sepsis Campaign 2021 (SCCM/ESICM)",
      "Surviving Sepsis Campaign Hour-1 Bundle",
      "Sepsis-3 (Third International Consensus, JAMA 2016)",
      "Literatura de cardiomiopatia séptica e arritmias (Front Cardiovasc Med 2023; Emergency and Critical Care Medicine 2022)"
    ]
  },
  "iam-supra": {
    "condutaId": "iam-supra",
    "papel": "Cardiologista emergencista/intensivista, especialista em IAM com supradesnivelamento de ST (SCACSST): leitura rápida de ECG e decisão de reperfusão na sala vermelha.",
    "evidencias": [
      {
        "fato": "Critério diagnóstico de SUPRA: nova elevação de ST no ponto J >=1 mm em >=2 derivações contíguas. Exceção V2-V3: >=2 mm (homens >=40a), >=2,5 mm (homens <40a), >=1,5 mm (mulheres).",
        "fonte": "ESC 2023 / IV Definição Universal de IAM / Diretrizes ECG SBC"
      },
      {
        "fato": "ECG nos primeiros 10 min do primeiro contato; em supra/equivalente, acionar reperfusão IMEDIATA. Não esperar troponina para reperfundir.",
        "fonte": "ESC 2023 / AHA-ACC 2025 / SBC"
      },
      {
        "fato": "Angioplastia primária (ICP) é preferida: meta porta-balão <=90 min (hospital com hemodinâmica) ou <=120 min do 1º contato se transferência. Se ICP não viável em <=120 min E sintomas <12 h: FIBRINÓLISE com porta-agulha <=30 min.",
        "fonte": "AHA-ACC 2025 / ESC 2023 / SBC"
      },
      {
        "fato": "Tenecteplase (TNK) bolus IV único por peso: <60kg=30mg; 60-69=35; 70-79=40; 80-89=45; >=90kg=50mg. Idoso >=75 anos: usar METADE da dose (reduz hemorragia intracraniana).",
        "fonte": "Bula TNK / STREAM e STREAM-2"
      },
      {
        "fato": "Adjuvantes à reperfusão: AAS 150-300 mg VO (mastigar) + clopidogrel ataque 300 mg (sem ataque, só 75 mg, se >75 anos na fibrinólise) + enoxaparina/heparina. Pós-ICP, prasugrel ou ticagrelor preferidos. AAS sempre, salvo alergia.",
        "fonte": "ESC 2023 / AHA-ACC 2025 / SBC"
      },
      {
        "fato": "Equivalentes de supra (tratar como STEMI): infra de ST de V1-V3 com IAM posterior (confirmar com V7-V9: supra >=0,5 mm); BRE/marca-passo novos com clínica + critérios de Sgarbossa; de Winter (infra ascendente + T apiculada em precordiais).",
        "fonte": "ESC 2023 / AHA-ACC 2025 / Sgarbossa"
      },
      {
        "fato": "IAM de VD: supra em II-III-aVF (parede inferior) + supra em V4R (precordiais direitas). VD é PRÉ-CARGA-dependente: nitrato, morfina e diurético podem causar hipotensão grave — evitar e fazer volume.",
        "fonte": "AHA-ACC 2025 / SBC"
      },
      {
        "fato": "Oxigênio só se SpO2 <90% (alvo >=90%). Hiperóxia rotineira é deletéria. Morfina com parcimônia (atrasa antiagregante e mascara dor). Nitrato é alívio sintomático, não reduz mortalidade.",
        "fonte": "AHA-ACC 2025 / ESC 2023"
      },
      {
        "fato": "Sinal de reperfusão eficaz pós-fibrinólise (~60-90 min): queda de ST >=50% na derivação de maior supra + alívio da dor + estabilidade. Falha => ICP de resgate imediata.",
        "fonte": "ESC 2023 / SBC"
      }
    ],
    "oQueLer": [
      "Ritmo de base e FC; identificar ritmo de PCR (FV/TV) ou bradiarritmia/BAV (comum no IAM inferior).",
      "Segmento ST: localizar e medir supra no ponto J (mm) por derivação; mapear PAREDE (anterior V1-V6, inferior II/III/aVF, lateral I/aVL/V5-V6, septal V1-V2).",
      "Infra de ST recíproco (ex.: infra V1-V3 sugere IAM posterior; infra II/III com supra I/aVL sugere anterolateral) — pista de oclusão.",
      "Derivações extras quando indicado: V7-V9 (posterior, supra >=0,5 mm) e V4R (VD) em todo IAM inferior.",
      "Onda T hiperaguda (apiculada/alargada) e de Winter — oclusão precoce sem supra clássico ainda.",
      "Morfologia QRS: BRE/BRD novo, ritmo de marca-passo (avaliar Sgarbossa); presença de onda Q (necrose estabelecida).",
      "No monitor: SpO2 (O2 só se <90%), PA (hipotensão = choque/IAM de VD), EtCO2/perfusão; espícula e CAPTURA do marca-passo se houver."
    ],
    "redFlags": [
      "Choque cardiogênico: PAS <90, hipoperfusão, congestão — ICP imediata + suporte; Killip III-IV.",
      "IAM de VD/inferior hipotenso: NÃO dar nitrato/morfina/diurético; volume e reperfusão urgente.",
      "BAV avançado/total ou bradicardia instável (típico do inferior): atropina/marca-passo transcutâneo.",
      "FV/TV sem pulso ou TV instável: desfibrilação/cardioversão imediata (ACLS).",
      "Supra anterior extenso (V1-V6 + aVL) = oclusão proximal de DA, alto risco — agilizar reperfusão.",
      "Dor persistente + supra mantido pós-fibrinólise (queda <50%) = falha => ICP de resgate.",
      "Suspeita de dissecção de aorta/AVC recente/sangramento ativo: contraindica fibrinólise — priorizar ICP e imagem."
    ],
    "acaoPrioritaria": "Confirmado supra de ST (ou equivalente), ACIONAR REPERFUSÃO JÁ: ICP primária em <=90-120 min ou, se indisponível e sintomas <12 h, fibrinólise com porta-agulha <=30 min, somando AAS + 2º antiagregante + anticoagulante.",
    "fontes": [
      "AHA/ACC 2025 (Síndromes Coronarianas Agudas)",
      "ESC 2023 (Acute Coronary Syndromes)",
      "SBC (Diretriz IAMCSST e III Diretriz de ECG)",
      "IV Definição Universal de Infarto do Miocárdio",
      "Critérios de Sgarbossa (BRE/marca-passo)",
      "STREAM e STREAM-2 (tenecteplase meia-dose em idosos)",
      "ACLS/AHA 2020 (arritmias e PCR)"
    ]
  },
  "hipercalemia": {
    "condutaId": "hipercalemia",
    "papel": "Emergencista/intensivista sênior, especialista em hipercalemia grave com instabilidade elétrica (cardiotoxicidade do potássio) na sala vermelha.",
    "evidencias": [
      {
        "fato": "Classificação: K+ leve 5,0-5,5 / moderada 5,5-6,0 / grave >6,0 mmol/L. Emergência (tratar JÁ) = K+ >=6,5 mmol/L OU qualquer K+ alto com alteração de ECG. ECG normal NÃO exclui hipercalemia grave (sensibilidade ~34-43%); velocidade de subida do K+ importa mais que o valor absoluto.",
        "fonte": "UK Kidney Association 2023; Turkish J Emerg Med 2023"
      },
      {
        "fato": "1a linha = estabilizar a membrana com CÁLCIO em TODO paciente com alteração de ECG ou instabilidade: gluconato de cálcio 10% 10-30 mL IV (1-3 g) em 2-5 min OU cloreto de cálcio 10% 10 mL IV (preferir em PCR/choque, acesso central/calibroso). Início 1-3 min, dura 30-60 min; repetir em 5-10 min se ECG não melhorar. Cálcio NÃO baixa o K+.",
        "fonte": "AHA/ACLS 2020; European Resuscitation Council (ERC) 2021"
      },
      {
        "fato": "2a linha (deslocar K+ para dentro da célula) = INSULINA regular 10 U IV + glicose 25 g (50 mL de glicose 50%). Início <15 min, queda 0,5-1,2 mmol/L. Risco de hipoglicemia ~9-21% (maior em DRC, sem DM, baixo peso): se glicemia <250 mg/dL dar glicose junto, monitorar glicemia por >=6 h; dose reduzida 0,1 U/kg (máx 10 U) em alto risco.",
        "fonte": "AHA/ACLS 2020; UK Kidney Association 2023"
      },
      {
        "fato": "2a linha adjuvante = SALBUTAMOL nebulizado 10-20 mg (dose ~4-8x a broncodilatadora) em 15 min. Início ~15-30 min, queda 0,5-1,0 mmol/L, dura ~2 h. Sinérgico com insulina; cautela com taquiarritmia/isquemia. Bicarbonato NÃO baixa K+ com pH normal — reservar para acidose metabólica significativa (HCO3- baixo) ou PCR por hipercalemia.",
        "fonte": "UK Kidney Association 2023; ILCOR/ERC 2021"
      },
      {
        "fato": "REMOVER o potássio do corpo (medidas de shift são temporárias, rebote em 2-3 h): diuréticos de alça se euvolêmico/hipervolêmico e diurese preservada; ligante intestinal (ciclossilicato de zircônio e sódio ou patirômero — preferir ao poliestireno sulfonato pelo risco de necrose intestinal). DIÁLISE = tratamento definitivo: indicar se refratário, DRC/IRA oligúrica, hipervolemia ou K+ >=6,5 persistente.",
        "fonte": "UK Kidney Association 2023; Nephrol Dial Transplant 2024"
      },
      {
        "fato": "PCR por hipercalemia (suspeita por história: DRC/diálise, IRA, rabdomiólise, IECA/ARA/espironolactona): manter RCP de alta qualidade, dar cálcio (cloreto 10% 10 mL) + insulina/glicose EMPÍRICOS sem esperar laboratório; considerar bicarbonato; RCP prolongada e diálise emergencial são razoáveis pois é causa reversível (Hs e Ts).",
        "fonte": "AHA/ACLS 2020; ILCOR 2022"
      },
      {
        "fato": "BRASH (Bradicardia, Renal/IRA, AV-bloqueador, Shock, Hipercalemia): bradicardia desproporcional à hipercalemia em uso de betabloqueador/bloqueador de canal de Ca. Tratar PRIMEIRO com cálcio + medidas de K+ + volume; bradicardia refratária pode exigir adrenalina (1 mcg/min) ou isoproterenol. ECG clássico de hipercalemia frequentemente AUSENTE.",
        "fonte": "EMCrit/IBCC; J Emerg Med 2021"
      }
    ],
    "oQueLer": [
      "Onda T: apiculada, estreita, simétrica e em tenda (precordiais V2-V4), QT curto — sinal mais precoce.",
      "Onda P: achatamento, alargamento e desaparecimento (parada atrial/ritmo sinoventricular).",
      "PR: prolongado; graus de bloqueio AV.",
      "QRS: alargamento progressivo / BRD ou BRE atípicos — sinal de gravidade.",
      "Padrão sinusoidal (fusão QRS-T larga lenta): pré-parada, ALERTA MÁXIMO.",
      "Ritmo/FC: bradicardia, ritmo juncional/sinoventricular, bradi-FA com resposta lenta, assistolia/AESP iminente.",
      "Captura de marca-passo: limiar de captura sobe na hipercalemia — checar falha de captura/'failure to capture'.",
      "Monitor: FC, PA (hipotensão/choque), SpO2; EtCO2 se em RCP (queda = baixo débito/PCR)."
    ],
    "redFlags": [
      "QRS alargado, ritmo sinoventricular ou padrão sinusoidal = dar cálcio IMEDIATAMENTE, repetir.",
      "Bradicardia <40, bloqueio AV avançado ou assistolia/AESP — risco de PCR iminente.",
      "Hipotensão/choque ou síncope com K+ alto.",
      "Falha de captura de marca-passo (apesar de espículas).",
      "Contexto BRASH (bradicardia + IRA + betabloq/BCC) — não esperar K+ confirmado.",
      "ECG 'normal' com K+ >=6,5 ou subindo rápido — não relaxar: tratar mesmo assim.",
      "Rabdomiólise, lise tumoral, IRA oligúrica ou diálise perdida — fonte massiva de K+ → diálise precoce."
    ],
    "acaoPrioritaria": "Se há qualquer alteração de ECG (T em tenda, QRS largo, sinusoidal) ou instabilidade, administrar JÁ gluconato de cálcio 10% 10-30 mL IV (ou cloreto de cálcio 10% 10 mL se PCR/choque) para estabilizar a membrana e repetir em 5-10 min se o ECG não normalizar, seguido de insulina 10 U + glicose 25 g.",
    "fontes": [
      "AHA/ACLS 2020",
      "European Resuscitation Council (ERC) 2021",
      "ILCOR 2021/2022",
      "UK Kidney Association (Treatment of Acute Hyperkalaemia in Adults) 2022/2023",
      "Turkish Journal of Emergency Medicine 2023",
      "Nephrology Dialysis Transplantation (Hyperkalemia Treatment Standard) 2024",
      "EMCrit/IBCC e J Emerg Med 2021 (BRASH)"
    ]
  },
  "iot": {
    "condutaId": "iot",
    "papel": "Emergencista/intensivista sênior, especialista em via aérea avançada e intubação orotraqueal (IOT) em sala vermelha — checklist, otimização hemodinâmica peri-intubação e confirmação do tubo.",
    "evidencias": [
      {
        "fato": "Sequência rápida de intubação (SRI/RSI): pré-oxigenar >=3 min, cabeceira elevada (semi-Fowler/posição rampa); usar HFNO/cânula nasal de alto fluxo quando laringoscopia for difícil e VNI (CPAP/BiPAP) na hipoxemia grave (PaO2/FiO2 <150). Manter O2 nasal 15 L/min durante a apneia (oxigenação apneica).",
        "fonte": "SCCM 2023 (Guidelines for RSI in the Critically Ill Adult)"
      },
      {
        "fato": "Indução: cetamina 1-2 mg/kg IV (preferir 0,5-1 mg/kg se choque/instável) OU etomidato 0,2-0,3 mg/kg IV; em RSI sempre associar hipnótico ao bloqueador. Etomidato e cetamina equivalentes em mortalidade/hipotensão; NÃO repor corticoide de rotina pós-etomidato.",
        "fonte": "SCCM 2023 RSI"
      },
      {
        "fato": "Bloqueador neuromuscular obrigatório com hipnótico (recomendação forte): rocurônio 1,2-1,6 mg/kg IV (apneia segura mais longa, sem contraindicações) OU succinilcolina 1,5 mg/kg IV. Evitar succinilcolina em hipercalemia, queimadura/trauma >48-72h, doença neuromuscular.",
        "fonte": "SCCM 2023 RSI"
      },
      {
        "fato": "RESSUSCITAR ANTES DE INTUBAR: hipotensão peri-intubação ocorre em >=40% e aumenta mortalidade. Índice de choque (FC/PAS) >0,8-0,9 prevê colapso. Otimizar volume e/ou iniciar vasopressor ANTES da indução; ter pressor em bolus à beira-leito.",
        "fonte": "SCCM 2023 RSI / literatura de peri-intubation collapse (REBEL EM, Springer)"
      },
      {
        "fato": "Vasopressor em bolus (push-dose): epinefrina 10 mcg/mL — 0,5-2 mL (5-20 mcg) IV a cada 2-5 min, início <1 min, dura 5-10 min (alfa+beta, preferida se baixo débito); fenilefrina 100 mcg/mL — 50-200 mcg IV a cada 1-5 min (alfa puro, se FC alta/taquiarritmia).",
        "fonte": "EMCrit / ACEP Now (push-dose pressors)"
      },
      {
        "fato": "Confirmação do tubo: capnografia em onda (waveform EtCO2) é o padrão-ouro (sens./espec. ~100%). Onda quadrada presente = traqueal; linha reta/EtCO2 ausente = intubação esofágica até prova contrária — retirar e reventilar.",
        "fonte": "AHA/ACLS 2020"
      },
      {
        "fato": "Bradicardia instável peri-intubação: atropina 1 mg IV a cada 3-5 min (máx 3 mg). Se refratária OU BAV 2o grau Mobitz II / BAVT (QRS largo, atropina ineficaz): marca-passo transcutâneo (60-80 bpm, mA 2 acima da captura) e/ou epinefrina 2-10 mcg/min ou dopamina 5-20 mcg/kg/min.",
        "fonte": "AHA/ACLS 2020 (algoritmo de bradicardia)"
      },
      {
        "fato": "Plano de falha definido antes da 1a tentativa: limitar a apneia/dessaturação — interromper a tentativa e ventilar com BVM (com PEEP) se SpO2 cair a ~92-93%; após falha de laringoscopia, escalonar (videolaringoscópio, dispositivo supraglótico, via aérea cirúrgica). Meta = sucesso na 1a passagem.",
        "fonte": "DAS / Vortex / SCCM 2023"
      }
    ],
    "oQueLer": [
      "Ritmo e FC: bradicardia (BAV, ritmo juncional/idioventricular, QRS largo) ou taquicardia compensatória de choque que pode colapsar pós-indução",
      "SpO2 e curva pletismográfica: valor atual, tendência (queda) e qualidade do sinal antes/durante a apneia; reserva de oxigenação",
      "Capnografia/EtCO2 em onda: presença e morfologia da onda quadrada APÓS o tubo = confirmação traqueal; ausência = esofágica; valor numérico (perfusão/ventilação)",
      "PA e índice de choque (FC/PAS >0,8-0,9): risco de hipotensão peri-intubação — checar antes da indução",
      "ST/isquemia e arritmias no traçado: IAM, hipercalemia (T apiculada/QRS largo — contraindica succinilcolina), QT longo",
      "Captura do marca-passo (se TCP): espícula seguida de QRS alargado + onda T, com pulso/PA correspondente (captura elétrica E mecânica)",
      "Frequência respiratória/ventilador pós-IOT e sinais de auto-PEEP, queda de EtCO2 (deslocamento, obstrução, pneumotórax)"
    ],
    "redFlags": [
      "Hipotensão / índice de choque elevado (FC/PAS >0,9) ANTES de intubar — risco alto de parada peri-intubação: ressuscitar e ter pressor pronto antes da indução",
      "SpO2 em queda apesar de pré-oxigenação ou <90% — abortar tentativa, ventilar com BVM/PEEP, escalonar",
      "EtCO2 ausente / sem onda após intubar = intubação esofágica — retirar tubo imediatamente",
      "Queda súbita de EtCO2 ou SpO2 após IOT — deslocamento/obstrução do tubo, pneumotórax hipertensivo ou parada (DOPE)",
      "Bradicardia + QRS largo / BAV avançado refratário à atropina — partir direto para marca-passo transcutâneo + epinefrina/dopamina",
      "Hipercalemia no ECG (T apiculada, QRS largo) — NÃO usar succinilcolina",
      "Sinais de via aérea difícil prevista (não consigo ventilar/intubar) — preparar dispositivo supraglótico e via cirúrgica antes de paralisar"
    ],
    "acaoPrioritaria": "Otimizar a hemodinâmica e a oxigenação ANTES de paralisar — pré-oxigenar com cabeceira elevada + O2 nasal de apneia, corrigir hipotensão/índice de choque com volume e/ou vasopressor em bolus, e só então fazer indução + bloqueador; logo após o tubo, CONFIRMAR posição com capnografia em onda.",
    "fontes": [
      "SCCM 2023 — Guidelines for Rapid Sequence Intubation in the Critically Ill Adult",
      "AHA/ACLS 2020",
      "DAS (Difficult Airway Society) / Vortex Approach",
      "EMCrit / ACEP Now (push-dose vasopressors)",
      "Literatura de colapso cardiovascular peri-intubação (REBEL EM; Springer Pulmonary Therapy)"
    ]
  },
  "taqui-algoritmo": {
    "condutaId": "taqui-algoritmo",
    "papel": "Cardiologista emergencista/intensivista, especialista em taquiarritmias e no algoritmo estável x instável na sala vermelha.",
    "evidencias": [
      {
        "fato": "A decisão-chave é estável x instável: presença de QUALQUER um dos 5 sinais de instabilidade (hipotensão/choque, alteração aguda do estado mental, sinais de má perfusão/choque, desconforto torácico isquêmico, insuficiência cardíaca aguda) atribuível à arritmia indica cardioversão imediata.",
        "fonte": "AHA/ACLS 2020"
      },
      {
        "fato": "FC geralmente <150 bpm raramente é causa primária dos sintomas instáveis em adulto sem disfunção cardíaca — procure outra causa; instabilidade real costuma ocorrer com FC >150 bpm.",
        "fonte": "AHA/ACLS 2020"
      },
      {
        "fato": "Energias de REFERÊNCIA da cardioversão sincronizada: estreita regular (TSV/flutter) 50–100 J; estreita irregular (FA) 120–200 J bifásico; larga regular (TV monomórfica) 100 J; larga IRREGULAR = trate como desfibrilação NÃO sincronizada em dose de FV. Aumente progressivamente se falhar; sede/analgese se possível.",
        "fonte": "AHA/ACLS 2020"
      },
      {
        "fato": "QRS estreito (<0,12 s) e regular: manobra vagal primeiro; depois adenosina 6 mg IV em bolus rápido com flush salino, repetir 12 mg se necessário (alguns protocolos admitem 3ª dose de 12 mg). Adenosina só em ritmo REGULAR.",
        "fonte": "AHA/ACLS 2020"
      },
      {
        "fato": "QRS estreito IRREGULAR (provável FA/flutter de condução variável): controle de frequência com betabloqueador ou bloqueador de canal de cálcio não diidropiridínico (ex.: diltiazem); NÃO usar adenosina.",
        "fonte": "AHA/ACLS 2020"
      },
      {
        "fato": "QRS largo (≥0,12 s) ESTÁVEL: se monomórfico/regular, antiarrítmico de REFERÊNCIA — Procainamida 20–50 mg/min até suprimir, hipotensão, QRS alargar >50% ou máx 17 mg/kg (manutenção 1–4 mg/min; evitar se QT longo ou IC); OU Amiodarona 150 mg em 10 min, repetível, depois 1 mg/min; OU Sotalol 100 mg (1,5 mg/kg) em 5 min (evitar se QT longo). Se houver dúvida ou instabilidade, cardioverter.",
        "fonte": "AHA/ACLS 2020"
      },
      {
        "fato": "FA pré-excitada (WPW): NÃO usar adenosina, betabloqueador, bloqueador de cálcio, digoxina nem amiodarona IV (risco de acelerar via acessória → FV). Conduta de escolha = cardioversão elétrica sincronizada; se estável, procainamida ou ibutilida.",
        "fonte": "Manuais MSD (profissional); SBC/ACC/AHA WPW"
      },
      {
        "fato": "TV polimórfica/Torsades com pulso: sulfato de magnésio 1–2 g IV em 10 mL D5W em 5–20 min (carga), corrigir K+ (>4,5 mmol/L), suspender drogas que prolongam QT; se instável/sem pulso → desfibrilação NÃO sincronizada. Evitar amiodarona se QT longo. Marca-passo/overdrive a ≥90 bpm em casos refratários bradi-dependentes.",
        "fonte": "AHA/ACLS 2020"
      }
    ],
    "oQueLer": [
      "Frequência cardíaca real e regularidade do RR (regular x irregularmente irregular = FA)",
      "Largura do QRS: estreito (<0,12 s = 3 quadradinhos) x largo (≥0,12 s)",
      "Morfologia do QRS largo: monomórfico (TV) x polimórfico/torcido em torno da linha de base (Torsades); medir QT/QTc no ritmo de base",
      "Onda P / atividade atrial: presente e relacionada? Ondas F de flutter (serrilhado ~300/min, padrão 2:1≈150 bpm); ausência de P com RR irregular = FA",
      "Sinais de pré-excitação (delta, PR curto) em ECG prévio/atual — muda a conduta da FA",
      "Sinais de isquemia: supra/infra de ST, desconforto torácico — desencadeante ou consequência",
      "No monitor: PA (hipotensão), SpO2 (perfusão), traçado pletismográfico, EtCO2 se intubado",
      "Verificar se o aparelho está em modo SINCRONIZADO (marcadores sobre o R) antes de cardioverter; em FA/TV irregular confirmar que NÃO há sincronização travando o choque"
    ],
    "redFlags": [
      "Qualquer dos 5 sinais de instabilidade (hipotensão/choque, alteração do nível de consciência, má perfusão, dor torácica isquêmica, IC aguda) → cardioversão sincronizada JÁ",
      "QRS largo irregular ou FA com QRS muito rápido/variável e delta → suspeitar FA pré-excitada (WPW): proibido bloqueador nodal/adenosina/amiodarona; cardioverter",
      "TV polimórfica com QT longo (Torsades): magnésio + correção eletrolítica, NÃO amiodarona; desfibrilar se instável",
      "Deterioração para ausência de pulso → algoritmo de PCR/desfibrilação imediata",
      "FC >150 bpm com sintomas graves; ou rápida queda de PA / piora do sensório durante a observação",
      "Falha de captura no modo sincronizado (não dispara) com paciente instável → mudar para desfibrilação NÃO sincronizada"
    ],
    "acaoPrioritaria": "Defina estável x instável em segundos: se houver instabilidade atribuível à taquiarritmia, faça cardioversão elétrica sincronizada imediata (sedando se possível) na energia de referência conforme largura/regularidade do QRS; se estável, trate pelo ramo do QRS (vagal/adenosina x controle de FC x antiarrítmico).",
    "fontes": [
      "AHA/ACLS 2020 (algoritmo de taquicardia com pulso, atualização 2025)",
      "Manuais MSD edição para profissionais (WPW / FA pré-excitada)",
      "SBC — diretrizes de FA e arritmias supraventriculares",
      "ESC/ACC/AHA — manejo de TSV e síndromes de pré-excitação"
    ]
  },
  "avc-isquemico": {
    "condutaId": "avc-isquemico",
    "papel": "Neurologista vascular/emergencista de sala vermelha, especialista em AVC isquêmico agudo e nas alterações cérebro-cardíacas (ECG/monitor) que mudam a conduta de reperfusão e o controle pressórico.",
    "evidencias": [
      {
        "fato": "Janela de reperfusão IV: trombolítico até 4,5h do início (ou último horário visto bem); alteplase 0,9 mg/kg (máx 90 mg), 10% em bolus em 1 min e o restante em 60 min; tenecteplase 0,25 mg/kg (máx 25 mg) em bolus único é alternativa classe I dentro de 4,5h. Trombectomia mecânica até 24h em oclusão de grande vaso da circulação anterior, se imagem favorável (DAWN/DEFUSE-3).",
        "fonte": "AHA/ASA Acute Ischemic Stroke Guideline (2019 update + 2026); SBDCV/Brasil"
      },
      {
        "fato": "Antes de trombolisar, a PA deve estar <185/110 mmHg; após o trombolítico, manter <180/105 mmHg nas primeiras 24h para reduzir transformação hemorrágica. Reduzir com labetalol 10-20 mg IV ou nicardipina 5 mg/h IV titulável (valores de referência).",
        "fonte": "AHA/ASA 2019; SBDCV"
      },
      {
        "fato": "Hipertensão permissiva no AVCi SEM reperfusão: NÃO baixar PA salvo se >220/120 mmHg (ou lesão de órgão-alvo concomitante); redução agressiva piora a penumbra (CATIS, SCAST).",
        "fonte": "AHA/ASA 2019 (CATIS, SCAST)"
      },
      {
        "fato": "Fibrilação atrial é a arritmia mais associada ao AVCi (fonte cardioembólica); FA de novo no ECG do paciente com déficit focal sugere mecanismo cardioembólico e orienta anticoagulação na prevenção secundária — mas NÃO anticoagular na fase hiperaguda (risco de transformação hemorrágica).",
        "fonte": "AHA/ASA 2019; ESC/SBC Fibrilação Atrial"
      },
      {
        "fato": "Alterações cérebro-cardíacas (catecolaminérgicas) são frequentes e geralmente transitórias: ondas T cerebrais (T invertidas profundas ≥5 mm em ≥4 derivações precordiais contíguas), prolongamento do QT, alterações de ST e ondas U proeminentes; podem mimetizar isquemia miocárdica.",
        "fonte": "Literatura cardio-neurológica (AHA Stroke)"
      },
      {
        "fato": "AVC e SCA/STEMI podem coexistir (até dissecção de aorta cursando com AVC). STEMI verdadeiro concomitante ou Takotsubo/miocárdio atordoado neurogênico (troponina elevada, geralmente menor que no STEMI) mudam a estratégia: priorizar discussão com hemodinâmica/cardiologia antes de trombolisar o cérebro.",
        "fonte": "ESC SCA / European HJ Takotsubo Consensus; AHA"
      },
      {
        "fato": "QT corrigido prolongado (especialmente >500 ms) no monitor aumenta risco de Torsades; evitar/cuidado com fármacos que prolongam QT e corrigir K+/Mg2+ — sulfato de magnésio 1-2 g IV se Torsades (valor de referência).",
        "fonte": "AHA/ACLS 2020"
      },
      {
        "fato": "Glicemia alvo na fase aguda 140-180 mg/dL; tratar hipoglicemia <60 mg/dL (mimetiza AVC) e hiperglicemia, ambas pioram desfecho. Tratar febre/hipoxemia (manter SpO2 >94%).",
        "fonte": "AHA/ASA 2019"
      },
      {
        "fato": "NIHSS guia elegibilidade e gravidade; NIHSS ≥6 com suspeita de oclusão de grande vaso aciona ativação de trombectomia. Critérios DAWN (6-24h): NIHSS ≥10 com core <31 mL, ou NIHSS ≥20 com core 31-51 mL.",
        "fonte": "DAWN/DEFUSE-3; AHA/ASA 2018-2019"
      }
    ],
    "oQueLer": [
      "Ritmo de base: procurar fibrilação atrial (RR irregular, ausência de onda P, ondulação de linha de base) — pista de mecanismo cardioembólico.",
      "Intervalo QT/QTc: prolongamento (alerta para Torsades, especialmente QTc >500 ms); ondas U proeminentes.",
      "Onda T: T invertidas profundas e largas ('ondas T cerebrais') em precordiais; diferenciar de isquemia coronariana.",
      "Segmento ST: supra/infra de ST — distinguir STEMI verdadeiro/SCA concomitante de alteração cérebro-cardíaca/Takotsubo.",
      "Captura de marca-passo: espículas com/sem captura, se houver MP.",
      "Monitor: PA (limiar 185/110 pré-trombólise, 180/105 pós, 220/120 sem reperfusão), FC, SpO2 (manter >94%), EtCO2 e padrão respiratório (rebaixamento/risco de via aérea), temperatura.",
      "Sinais de instabilidade hemodinâmica que contraindiquem ou adiem reperfusão (hipotensão, arritmia maligna)."
    ],
    "redFlags": [
      "PA persistentemente >185/110 mmHg refratária — impede trombólise até controle; PA >220/120 mmHg sem reperfusão exige redução cautelosa.",
      "Supra de ST/SCA concomitante ou suspeita de dissecção de aorta — reavaliar segurança da trombólise cerebral e acionar cardiologia/hemodinâmica.",
      "QTc muito prolongado / Torsades de Pointes ou arritmia ventricular — emergência elétrica/metabólica que precede o cuidado neurológico.",
      "FA de novo com resposta ventricular instável (hipotensão, choque) — instabilidade hemodinâmica antes de reperfundir.",
      "Rebaixamento do nível de consciência / queda de SpO2 / hipoventilação — proteger via aérea; suspeitar de AVC extenso ou transformação hemorrágica.",
      "Glicemia <60 mg/dL — corrigir imediatamente (mimic de AVC) antes de assumir AVCi.",
      "Deterioração neurológica súbita pós-trombólise com pico hipertensivo/cefaleia/vômito — suspeitar transformação hemorrágica: parar infusão, TC urgente."
    ],
    "acaoPrioritaria": "Confirmar a janela e elegibilidade (glicemia e PA <185/110), descartar mimic/contraindicação no ECG (STEMI, FA instável, QTc/arritmia) e acionar IMEDIATAMENTE o protocolo de reperfusão: trombólise IV em até 4,5h e/ou trombectomia em oclusão de grande vaso — tempo é cérebro.",
    "fontes": [
      "AHA/ASA Guidelines for the Early Management of Acute Ischemic Stroke (2019 update; 2018; atualização 2026)",
      "Sociedade Brasileira de Doenças Cerebrovasculares (SBDCV) / PCDT AVCi agudo - Brasil",
      "Ensaios DAWN e DEFUSE-3 (trombectomia em janela estendida)",
      "AHA/ACLS 2020",
      "ESC Síndrome Coronariana Aguda e International Expert Consensus on Takotsubo Syndrome (European Heart Journal)",
      "ESC / SBC - Diretrizes de Fibrilação Atrial",
      "Ensaios CATIS e SCAST (controle pressórico no AVCi)"
    ]
  },
  "intoxicacoes": {
    "condutaId": "intoxicacoes",
    "papel": "Médico emergencista/intensivista toxicologista, especialista em cardiotoxicidade e antídotos-chave na sala vermelha (leitura rápida de ECG/monitor no paciente intoxicado).",
    "evidencias": [
      {
        "fato": "Bloqueador de canal de sódio (ADT/tricíclicos, cocaína, antiarrítmicos Ia/Ic): QRS > 100 ms prediz convulsão e QRS > 160 ms prediz arritmia ventricular; onda R em aVR > 3 mm ou R/S em aVR > 0,7 é marcador de toxicidade. Antídoto: bicarbonato de sódio 8,4% 1-2 mEq/kg IV em bolus, repetir a cada 3-5 min até estreitar QRS, alvo de pH 7,45-7,55.",
        "fonte": "LITFL ECG Library / consenso toxicologia (sodium channel blocker)"
      },
      {
        "fato": "Intoxicação digitálica: ECG quase patognomônico = taquicardia ventricular bidirecional; também TJ não-paroxística, taquicardia atrial com BAV, FA com resposta ventricular regularizada, ESV frequentes. Antídoto: Fab antidigoxina (DigiFab) — empírico 6 frascos (40 mg) na instabilidade aguda; 1 frasco neutraliza ~0,5 mg de digoxina.",
        "fonte": "Whitebook/toxicologia + bula DigiFab (digoxin immune Fab)"
      },
      {
        "fato": "Hipercalemia (chave diferencial no monitor): T apiculada/'em tenda' (K+ 5,5-6,5) → P achatada/ausente + PR longo + QRS alargado (6,5-7,5) → onda sinusoidal/pré-PCR. Cálcio IV está indicado para QRS alargado ou perda de P (NÃO para T apiculada isolada): gluconato de cálcio 10% 15-30 mL OU cloreto de cálcio 10% 5-10 mL IV em 2-5 min; efeito dura ~30-60 min.",
        "fonte": "AHA/ACLS 2020 (hipercalemia)"
      },
      {
        "fato": "Bloqueador de canal de cálcio / betabloqueador (choque cardiogênico por intoxicação): bradicardia, BAV, hipotensão. 1ª linha: atropina 0,5-1 mg IV (até 0,04 mg/kg) + cálcio IV; glucagon 5-10 mg IV em bolus, repetir 3-5 min, depois infusão 1-15 mg/h. Refratário: insulina em alta dose euglicêmica (HIET).",
        "fonte": "AHA/ACLS 2020 + toxicologia (PICS/BB-BCC)"
      },
      {
        "fato": "HIET (insulina euglicêmica em alta dose) para choque por BCC/BB refratário: insulina regular bolus 1 U/kg + infusão 0,5-1 U/kg/h (titulável até ~10 U/kg/h), com glicose 0,5 g/kg bolus se glicemia <400 mg/dL e infusão de glicose ~0,5 g/kg/h; monitorar glicemia e potássio.",
        "fonte": "Toxicologia (HIET/PICS) + EMCrit IBCC"
      },
      {
        "fato": "Toxicidade sistêmica por anestésico local (LAST) — colapso súbito (bradicardia, BAV, TV/FV, assistolia, sobretudo bupivacaína): emulsão lipídica 20% bolus 1,5 mL/kg em 1 min + infusão 0,25 mL/kg/min (15 mL/kg/h); repetir bolus 1-2x a cada 5 min e dobrar infusão se persistir; máximo ~12 mL/kg. Na PCR reduzir adrenalina (≤1 mcg/kg) e evitar vasopressina/BCC/BB/lidocaína.",
        "fonte": "ASRA 2020 (LAST checklist)"
      },
      {
        "fato": "Toxidromo colinérgico (organofosforado/carbamato): bradicardia, QT longo, broncorreia/broncoespasmo → SpO2 baixa, miose, sialorreia. Antídoto: atropina 1-3 mg IV em bolus, DOBRAR a cada 3-5 min até atropinização (secreções secas/ausculta limpa, FC >80, PAS adequada); pralidoxima 30 mg/kg IV em 30 min + infusão ≥8 mg/kg/h. O endpoint da atropina é pulmonar, não a FC.",
        "fonte": "Toxicologia (organofosforado) + Whitebook"
      },
      {
        "fato": "Bradiarritmia instável (qualquer etiologia, inclui tóxica): se sinais de instabilidade (hipotensão, alteração de consciência, dor torácica isquêmica, choque) → atropina 1 mg IV a cada 3-5 min, máx 3 mg; se refratária, marca-passo transcutâneo e/ou dopamina 5-20 mcg/kg/min ou adrenalina 2-10 mcg/min.",
        "fonte": "AHA/ACLS 2020 (bradicardia)"
      },
      {
        "fato": "Prolongamento de QTc com risco de Torsades (antipsicóticos, metadona, antiarrítmicos, antieméticos): QTc >500 ms é alto risco. Torsades: sulfato de magnésio 1-2 g IV em 5-15 min (mesmo com Mg normal); corrigir K+ e Mg; se instável/recorrente, overdrive pacing ou isoproterenol; cardioversão/desfibrilação se evoluir para FV.",
        "fonte": "AHA/ACLS 2020 + SBC (QT longo/Torsades)"
      }
    ],
    "oQueLer": [
      "Ritmo de base e FC: bradicardia (BB/BCC, digital, organofosforado, hipercalemia) vs taquicardia (tricíclicos, simpaticomiméticos).",
      "Largura do QRS: >100 ms aponta bloqueio de canal de sódio (tricíclico/cocaína); >160 ms = alto risco de arritmia ventricular.",
      "Morfologia de aVR: onda R terminal >3 mm ou relação R/S >0,7 (sinal de tricíclico/bloqueador de Na+).",
      "Onda T: apiculada/'em tenda' simétrica de base estreita = hipercalemia precoce; QT/QTc: prolongamento (>500 ms) = risco de Torsades.",
      "Onda P e intervalo PR: P achatada/ausente + PR longo + QRS largo evoluindo p/ sinusoidal = hipercalemia avançada; PR longo/BAV = digital, BB/BCC.",
      "Padrão ventricular específico: TV bidirecional (eixo alterna a cada batimento) = quase patognomônico de digital; QRS polimórfico em 'torção de pontas' = Torsades.",
      "Captura/espículas de marca-passo (se MPTC instalado): confirmar captura elétrica E mecânica (pulso/PA), não só espícula.",
      "Oximetria/EtCO2: SpO2 baixa com broncorreia = colinérgico; EtCO2 confirma via aérea e perfusão na PCR/RCP.",
      "PA invasiva ou não-invasiva e perfusão: definir 'instável' e diferenciar choque cardiogênico tóxico (BB/BCC) de vasoplégico."
    ],
    "redFlags": [
      "QRS alargando progressivamente (>160 ms) ou onda R em aVR crescente — risco iminente de TV/FV em bloqueio de canal de sódio: bicarbonato JÁ.",
      "Onda sinusoidal / QRS muito alargado com bradicardia e P ausente — hipercalemia pré-parada: cálcio IV imediato sem esperar laboratório.",
      "TV bidirecional ou hipercalemia em paciente em uso de digital — indicar Fab antidigoxina; evitar cálcio IV exógeno empírico na suspeita digitálica.",
      "Colapso cardiovascular súbito após bloqueio regional/infiltração (bupivacaína) — acionar protocolo de emulsão lipídica e reduzir adrenalina.",
      "Bradicardia/BAV refratários à atropina + hipotensão (BB/BCC) — escalonar para glucagon, cálcio e HIET; preparar marca-passo/ECMO.",
      "Secreções abundantes + SpO2 caindo + bradicardia (colinérgico) — risco de parada respiratória; atropina em doses dobradas e via aérea.",
      "QTc >500 ms ou ESV em R-sobre-T — risco de Torsades: magnésio e correção eletrolítica antes da degeneração para FV.",
      "Sinais de instabilidade (hipotensão, rebaixamento, isquemia, choque) em qualquer bradiarritmia — não aguardar; tratar como bradicardia instável do ACLS."
    ],
    "acaoPrioritaria": "Identificar o padrão tóxico no traçado e disparar IMEDIATAMENTE o antídoto/medida específica correspondente — bicarbonato se QRS largo (tricíclico), cálcio se onda sinusoidal (hipercalemia), Fab se TV bidirecional (digital), emulsão lipídica se colapso por anestésico local, atropina dobrada se colinérgico — enquanto trata a instabilidade (via aérea, acesso, fluidos/vasopressor e ACLS).",
    "fontes": [
      "AHA/ACLS 2020 (bradicardia, hipercalemia, taquiarritmias/Torsades, parada cardíaca por toxicidade)",
      "ASRA 2020 (Local Anesthetic Systemic Toxicity / emulsão lipídica)",
      "SBC — Sociedade Brasileira de Cardiologia (QT longo/Torsades, arritmias)",
      "Whitebook / referências de toxicologia clínica e bulas (DigiFab/Fab antidigoxina, atropina, pralidoxima, glucagon)",
      "LITFL ECG Library (bloqueio de canal de sódio / intoxicação por tricíclicos)",
      "EMCrit IBCC (HIET / choque por BCC-BB)"
    ]
  }
};

export function specialistByCondutaId(id: string): SpecialistConfig | undefined {
  return SPECIALISTS[id];
}

// Fallback: sintetiza um especialista a partir do proprio card (acaoRapida/doses/alertas/referencia).
export function fallbackSpecialist(card: CondutaCard): SpecialistConfig {
  const evid: SpecialistEvidence[] = [];
  if (card.acaoRapida) {
    card.acaoRapida.passos.forEach((p) =>
      evid.push({
        fato: `${p.acao}${p.ampola ? " — " + p.ampola : ""}${p.repetir ? " (" + p.repetir + ")" : ""}`,
        fonte: card.referencia,
      })
    );
    if (card.acaoRapida.seRefratario) {
      evid.push({ fato: `Refratário: ${card.acaoRapida.seRefratario}`, fonte: card.referencia });
    }
  }
  card.doses.slice(0, 6).forEach((d) =>
    evid.push({
      fato: `${d.farmaco}: ${d.dose}${d.via ? " " + d.via : ""}${d.obs ? " — " + d.obs : ""}`,
      fonte: card.referencia,
    })
  );
  (card.energia ?? []).forEach((e) => evid.push({ fato: `Energia: ${e}`, fonte: card.referencia }));

  return {
    condutaId: card.id,
    papel: `médico emergencista sênior, especialista em ${card.titulo}`,
    evidencias: evid,
    oQueLer: ["FC", "ritmo/traçado", "SpO2", "PA/PNI", "FR", "Tax", "glicemia", "alarmes visíveis"],
    redFlags: card.alertas.slice(0, 5),
    acaoPrioritaria: card.acaoRapida?.gatilho
      ? `${card.acaoRapida.gatilho} → ${card.acaoRapida.passos[0]?.acao ?? "agir conforme conduta"}`
      : card.resumo ?? `Conduzir conforme o protocolo de ${card.titulo}`,
    fontes: [card.referencia],
  };
}

// Sempre devolve um especialista usavel (curado > fallback do card). null = id desconhecido.
export function resolveSpecialist(condutaId: string): SpecialistConfig | null {
  const curated = specialistByCondutaId(condutaId);
  if (curated) return curated;
  const card = condutaById(condutaId);
  if (card) return fallbackSpecialist(card);
  return null;
}
