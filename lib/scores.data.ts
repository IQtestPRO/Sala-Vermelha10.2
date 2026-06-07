import type { ScoreDef } from "./scores";

// GERADO pelo workflow de escores (autor + verificacao adversarial, confianca alta).
// Pontuacoes/faixas conferidas contra a referencia canonica. Nao editar a mao.
export const SCORES: ScoreDef[] = [
  {
    "id": "nihss",
    "nome": "NIHSS (AVC)",
    "categoria": "Neurologia / AVC",
    "descricao": "A National Institutes of Health Stroke Scale (NIHSS) quantifica o déficit neurológico no acidente vascular cerebral agudo por meio de 11 itens pontuados (1a, 1b, 1c, 2-11), com total de 0 a 42 pontos. Pontuações mais altas indicam maior gravidade. É usada para avaliação inicial, monitoramento da evolução, decisão terapêutica (ex.: trombólise/trombectomia) e prognóstico. Itens não testáveis (amputação, imobilização articular, intubação, barreira de idioma) têm regras específicas; alguns recebem pontuação 0 ou são registrados como \"UN\" (untestable) sem somar ao total. Aplicar a escala na ordem indicada, registrar a primeira resposta e não treinar o paciente.",
    "itens": [
      {
        "label": "1a. Nível de consciência (vigília)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Alerta; responde vivamente",
            "pontos": 0
          },
          {
            "label": "Sonolento; desperta com estímulo mínimo (verbal) e obedece/responde",
            "pontos": 1
          },
          {
            "label": "Torporoso; requer estímulo repetido ou doloroso para resposta não estereotipada",
            "pontos": 2
          },
          {
            "label": "Coma; responde apenas com reflexos motores/autonômicos ou totalmente arreativo, flácido, arreflexo",
            "pontos": 3
          }
        ]
      },
      {
        "label": "1b. NC - Perguntas (mês atual e idade)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Responde ambas corretamente",
            "pontos": 0
          },
          {
            "label": "Responde uma corretamente",
            "pontos": 1
          },
          {
            "label": "Nenhuma resposta correta",
            "pontos": 2
          }
        ]
      },
      {
        "label": "1c. NC - Comandos (abrir/fechar olhos e abrir/fechar a mão não parética)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Executa ambas as tarefas corretamente",
            "pontos": 0
          },
          {
            "label": "Executa uma tarefa corretamente",
            "pontos": 1
          },
          {
            "label": "Não executa nenhuma tarefa corretamente",
            "pontos": 2
          }
        ]
      },
      {
        "label": "2. Melhor olhar conjugado (horizontal)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Normal",
            "pontos": 0
          },
          {
            "label": "Paralisia parcial do olhar (desvio vencível por estímulo/oculocefálico)",
            "pontos": 1
          },
          {
            "label": "Desvio forçado ou paresia total do olhar não vencível pela manobra oculocefálica",
            "pontos": 2
          }
        ]
      },
      {
        "label": "3. Campos visuais (por confrontação)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Sem perda visual",
            "pontos": 0
          },
          {
            "label": "Hemianopsia parcial (quadrantanopsia)",
            "pontos": 1
          },
          {
            "label": "Hemianopsia completa",
            "pontos": 2
          },
          {
            "label": "Hemianopsia bilateral (cegueira, incluindo cegueira cortical)",
            "pontos": 3
          }
        ]
      },
      {
        "label": "4. Paralisia facial",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Movimentos normais simétricos",
            "pontos": 0
          },
          {
            "label": "Paralisia menor (apagamento do sulco nasolabial, assimetria ao sorrir)",
            "pontos": 1
          },
          {
            "label": "Paralisia parcial (paralisia total ou quase total da face inferior)",
            "pontos": 2
          },
          {
            "label": "Paralisia completa de um ou ambos os lados (ausência de movimento facial superior e inferior)",
            "pontos": 3
          }
        ]
      },
      {
        "label": "5a. Motor - membro superior ESQUERDO (90 graus sentado / 45 graus deitado por 10 s)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Sem queda; mantém por 10 s",
            "pontos": 0
          },
          {
            "label": "Queda parcial antes de 10 s, sem tocar o leito",
            "pontos": 1
          },
          {
            "label": "Algum esforço contra a gravidade; não mantém e cai ao leito",
            "pontos": 2
          },
          {
            "label": "Sem esforço contra a gravidade; o membro cai",
            "pontos": 3
          },
          {
            "label": "Sem movimento",
            "pontos": 4
          },
          {
            "label": "Amputação ou fusão articular (não somar - UN)",
            "pontos": 0
          }
        ]
      },
      {
        "label": "5b. Motor - membro superior DIREITO (90 graus sentado / 45 graus deitado por 10 s)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Sem queda; mantém por 10 s",
            "pontos": 0
          },
          {
            "label": "Queda parcial antes de 10 s, sem tocar o leito",
            "pontos": 1
          },
          {
            "label": "Algum esforço contra a gravidade; não mantém e cai ao leito",
            "pontos": 2
          },
          {
            "label": "Sem esforço contra a gravidade; o membro cai",
            "pontos": 3
          },
          {
            "label": "Sem movimento",
            "pontos": 4
          },
          {
            "label": "Amputação ou fusão articular (não somar - UN)",
            "pontos": 0
          }
        ]
      },
      {
        "label": "6a. Motor - membro inferior ESQUERDO (30 graus deitado por 5 s)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Sem queda; mantém 30 graus por 5 s",
            "pontos": 0
          },
          {
            "label": "Queda parcial antes de 5 s, sem tocar o leito",
            "pontos": 1
          },
          {
            "label": "Algum esforço contra a gravidade; cai ao leito antes de 5 s",
            "pontos": 2
          },
          {
            "label": "Sem esforço contra a gravidade; cai imediatamente",
            "pontos": 3
          },
          {
            "label": "Sem movimento",
            "pontos": 4
          },
          {
            "label": "Amputação ou fusão articular (não somar - UN)",
            "pontos": 0
          }
        ]
      },
      {
        "label": "6b. Motor - membro inferior DIREITO (30 graus deitado por 5 s)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Sem queda; mantém 30 graus por 5 s",
            "pontos": 0
          },
          {
            "label": "Queda parcial antes de 5 s, sem tocar o leito",
            "pontos": 1
          },
          {
            "label": "Algum esforço contra a gravidade; cai ao leito antes de 5 s",
            "pontos": 2
          },
          {
            "label": "Sem esforço contra a gravidade; cai imediatamente",
            "pontos": 3
          },
          {
            "label": "Sem movimento",
            "pontos": 4
          },
          {
            "label": "Amputação ou fusão articular (não somar - UN)",
            "pontos": 0
          }
        ]
      },
      {
        "label": "7. Ataxia de membros (índice-nariz e calcanhar-joelho)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Ausente",
            "pontos": 0
          },
          {
            "label": "Presente em um membro",
            "pontos": 1
          },
          {
            "label": "Presente em dois membros",
            "pontos": 2
          }
        ]
      },
      {
        "label": "8. Sensibilidade (picada/retirada ao estímulo doloroso)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Normal; sem perda sensitiva",
            "pontos": 0
          },
          {
            "label": "Perda sensitiva leve a moderada (sente menos a picada ou apenas toque)",
            "pontos": 1
          },
          {
            "label": "Perda sensitiva grave a total (não percebe toque na face, braço e perna)",
            "pontos": 2
          }
        ]
      },
      {
        "label": "9. Melhor linguagem (afasia)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Sem afasia; normal",
            "pontos": 0
          },
          {
            "label": "Afasia leve a moderada (perda de fluência/compreensão, sem limitação significativa)",
            "pontos": 1
          },
          {
            "label": "Afasia grave (comunicação muito fragmentada; examinador infere com grande esforço)",
            "pontos": 2
          },
          {
            "label": "Mudo, afasia global; sem fala ou compreensão auditiva úteis",
            "pontos": 3
          }
        ]
      },
      {
        "label": "10. Disartria",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Normal",
            "pontos": 0
          },
          {
            "label": "Leve a moderada; arrasta algumas palavras, mas é compreendido com dificuldade",
            "pontos": 1
          },
          {
            "label": "Grave; fala tão distorcida que é ininteligível (ou mudo/anártrico)",
            "pontos": 2
          },
          {
            "label": "Intubado ou outra barreira física (não somar - UN)",
            "pontos": 0
          }
        ]
      },
      {
        "label": "11. Extinção e desatenção (negligência)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Sem anormalidade",
            "pontos": 0
          },
          {
            "label": "Desatenção/extinção em uma modalidade (visual, tátil, auditiva ou espacial)",
            "pontos": 1
          },
          {
            "label": "Hemi-desatenção profunda ou extinção em mais de uma modalidade; não reconhece a própria mão ou orienta-se a um só lado do espaço",
            "pontos": 2
          }
        ]
      }
    ],
    "faixas": [
      {
        "min": 0,
        "max": 0,
        "rotulo": "Sem sintomas de AVC",
        "cor": "green"
      },
      {
        "min": 1,
        "max": 4,
        "rotulo": "AVC leve (menor)",
        "cor": "amber"
      },
      {
        "min": 5,
        "max": 15,
        "rotulo": "AVC moderado",
        "cor": "amber"
      },
      {
        "min": 16,
        "max": 20,
        "rotulo": "Moderado a grave",
        "cor": "red"
      },
      {
        "min": 21,
        "rotulo": "AVC grave",
        "cor": "red"
      }
    ],
    "fonte": "NIH Stroke Scale (NINDS / AHA-ASA); Brott T et al., Stroke 1989;20:864-870"
  },
  {
    "id": "glasgow",
    "nome": "Escala de Coma de Glasgow",
    "categoria": "Neurologia",
    "descricao": "Avaliação padronizada do nível de consciência por meio de três componentes — abertura ocular, resposta verbal e resposta motora. O escore total varia de 3 (coma profundo) a 15 (totalmente alerta) e orienta a gravidade do comprometimento neurológico e a conduta (ex.: indicação de via aérea avançada com GCS ≤ 8).",
    "itens": [
      {
        "label": "Abertura ocular (O)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Espontânea",
            "pontos": 4
          },
          {
            "label": "Ao estímulo sonoro / à voz",
            "pontos": 3
          },
          {
            "label": "À pressão / ao estímulo doloroso",
            "pontos": 2
          },
          {
            "label": "Ausente",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Resposta verbal (V)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Orientada",
            "pontos": 5
          },
          {
            "label": "Confusa",
            "pontos": 4
          },
          {
            "label": "Palavras inapropriadas / soltas",
            "pontos": 3
          },
          {
            "label": "Sons incompreensíveis",
            "pontos": 2
          },
          {
            "label": "Ausente",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Resposta motora (M)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Obedece a comandos",
            "pontos": 6
          },
          {
            "label": "Localiza o estímulo doloroso",
            "pontos": 5
          },
          {
            "label": "Flexão normal / retirada à dor",
            "pontos": 4
          },
          {
            "label": "Flexão anormal (decorticação)",
            "pontos": 3
          },
          {
            "label": "Extensão (descerebração)",
            "pontos": 2
          },
          {
            "label": "Ausente",
            "pontos": 1
          }
        ]
      }
    ],
    "faixas": [
      {
        "min": 13,
        "max": 15,
        "rotulo": "Leve",
        "cor": "green"
      },
      {
        "min": 9,
        "max": 12,
        "rotulo": "Moderado",
        "cor": "amber"
      },
      {
        "min": 3,
        "rotulo": "Grave (coma)",
        "cor": "red"
      }
    ],
    "fonte": "Teasdale & Jennett, Lancet 1974 (escala original com motora de 5 pontos); componente motor de 6 pontos conforme refinamento de 1976. Classificação de gravidade e valores confirmados em StatPearls (NCBI Bookshelf, NBK513298)."
  },
  {
    "id": "qsofa",
    "nome": "qSOFA (quick SOFA)",
    "categoria": "Sepse",
    "descricao": "Escore rápido à beira do leito para identificar, entre pacientes com infecção suspeita ou confirmada, aqueles sob maior risco de desfecho desfavorável (mortalidade hospitalar e/ou internação prolongada em UTI). Avalia 3 critérios clínicos, cada um valendo 1 ponto. Pontuação total de 0 a 3; valor maior ou igual a 2 indica alto risco e deve motivar investigação de disfunção orgânica (SOFA completo) e intensificação da monitorização. O qSOFA não define sepse isoladamente, mas funciona como ferramenta de triagem rápida, preferencialmente fora da UTI.",
    "itens": [
      {
        "label": "Frequência respiratória maior ou igual a 22 irpm",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não (< 22 irpm)",
            "pontos": 0
          },
          {
            "label": "Sim (>= 22 irpm)",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Alteração do nível de consciência (Glasgow < 15)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não (Glasgow = 15, sem alteração)",
            "pontos": 0
          },
          {
            "label": "Sim (Glasgow < 15 / estado mental alterado)",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Pressão arterial sistólica menor ou igual a 100 mmHg",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não (PAS > 100 mmHg)",
            "pontos": 0
          },
          {
            "label": "Sim (PAS <= 100 mmHg)",
            "pontos": 1
          }
        ]
      }
    ],
    "faixas": [
      {
        "min": 0,
        "max": 1,
        "rotulo": "Baixo risco",
        "cor": "green"
      },
      {
        "min": 2,
        "rotulo": "Alto risco",
        "cor": "red"
      }
    ],
    "fonte": "Sepsis-3 (Singer et al., JAMA 2016; Seymour et al., JAMA 2016) / Surviving Sepsis Campaign"
  },
  {
    "id": "sofa",
    "nome": "SOFA (Sequential Organ Failure Assessment)",
    "categoria": "Terapia intensiva",
    "descricao": "Escore de avaliação sequencial de falência orgânica. Quantifica a gravidade da disfunção de seis sistemas orgânicos (respiratório, coagulação, hepático, cardiovascular, neurológico e renal) em pacientes críticos. Cada sistema é pontuado de 0 a 4; o total varia de 0 a 24. Usado para monitorar evolução na UTI e, no contexto Sepsis-3, um aumento agudo >=2 pontos define disfunção orgânica associada à sepse.",
    "itens": [
      {
        "label": "Respiratório - PaO2/FiO2 (mmHg)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "PaO2/FiO2 >= 400",
            "pontos": 0
          },
          {
            "label": "PaO2/FiO2 300-399 (< 400)",
            "pontos": 1
          },
          {
            "label": "PaO2/FiO2 200-299 (< 300)",
            "pontos": 2
          },
          {
            "label": "PaO2/FiO2 100-199 (< 200) com suporte ventilatório",
            "pontos": 3
          },
          {
            "label": "PaO2/FiO2 < 100 com suporte ventilatório",
            "pontos": 4
          }
        ]
      },
      {
        "label": "Coagulação - Plaquetas (x10^3/uL)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Plaquetas >= 150",
            "pontos": 0
          },
          {
            "label": "Plaquetas < 150",
            "pontos": 1
          },
          {
            "label": "Plaquetas < 100",
            "pontos": 2
          },
          {
            "label": "Plaquetas < 50",
            "pontos": 3
          },
          {
            "label": "Plaquetas < 20",
            "pontos": 4
          }
        ]
      },
      {
        "label": "Hepático - Bilirrubina (mg/dL)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Bilirrubina < 1,2",
            "pontos": 0
          },
          {
            "label": "Bilirrubina 1,2-1,9",
            "pontos": 1
          },
          {
            "label": "Bilirrubina 2,0-5,9",
            "pontos": 2
          },
          {
            "label": "Bilirrubina 6,0-11,9",
            "pontos": 3
          },
          {
            "label": "Bilirrubina >= 12,0",
            "pontos": 4
          }
        ]
      },
      {
        "label": "Cardiovascular - PAM / vasopressores (doses em ug/kg/min)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "PAM >= 70 mmHg",
            "pontos": 0
          },
          {
            "label": "PAM < 70 mmHg, sem vasopressor",
            "pontos": 1
          },
          {
            "label": "Dopamina <= 5 ou dobutamina (qualquer dose)",
            "pontos": 2
          },
          {
            "label": "Dopamina > 5, OU adrenalina <= 0,1, OU noradrenalina <= 0,1",
            "pontos": 3
          },
          {
            "label": "Dopamina > 15, OU adrenalina > 0,1, OU noradrenalina > 0,1",
            "pontos": 4
          }
        ]
      },
      {
        "label": "Neurológico - Escala de Coma de Glasgow",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Glasgow 15",
            "pontos": 0
          },
          {
            "label": "Glasgow 13-14",
            "pontos": 1
          },
          {
            "label": "Glasgow 10-12",
            "pontos": 2
          },
          {
            "label": "Glasgow 6-9",
            "pontos": 3
          },
          {
            "label": "Glasgow < 6",
            "pontos": 4
          }
        ]
      },
      {
        "label": "Renal - Creatinina (mg/dL) ou débito urinário",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Creatinina < 1,2",
            "pontos": 0
          },
          {
            "label": "Creatinina 1,2-1,9",
            "pontos": 1
          },
          {
            "label": "Creatinina 2,0-3,4",
            "pontos": 2
          },
          {
            "label": "Creatinina 3,5-4,9 OU débito urinário < 500 mL/dia",
            "pontos": 3
          },
          {
            "label": "Creatinina >= 5,0 OU débito urinário < 200 mL/dia",
            "pontos": 4
          }
        ]
      }
    ],
    "faixas": [
      {
        "min": 0,
        "max": 6,
        "rotulo": "Disfunção leve (mortalidade < 10%)",
        "cor": "green"
      },
      {
        "min": 7,
        "max": 9,
        "rotulo": "Disfunção moderada (mortalidade ~15-20%)",
        "cor": "amber"
      },
      {
        "min": 10,
        "max": 12,
        "rotulo": "Disfunção grave (mortalidade ~40-50%)",
        "cor": "red"
      },
      {
        "min": 13,
        "rotulo": "Disfunção muito grave (mortalidade > 50-80%)",
        "cor": "red"
      }
    ],
    "fonte": "Vincent JL et al., Intensive Care Med 1996;22:707-710 (SOFA score); Singer M et al., Sepsis-3, JAMA 2016;315:801-810"
  },
  {
    "id": "news2",
    "nome": "NEWS 2 (National Early Warning Score 2)",
    "categoria": "Deterioração clínica",
    "descricao": "Escore de alerta precoce para detecção de deterioração clínica em adultos (>=16 anos), padronizado pelo Royal College of Physicians do Reino Unido. Agrega 6 parâmetros fisiológicos (a suplementação de oxigênio adiciona 2 pontos, totalizando 7 itens nesta calculadora). Possui duas escalas de SpO2: a Escala 1 para a maioria dos pacientes e a Escala 2 para pacientes com risco de insuficiência respiratória hipercápnica (ex.: DPOC) com alvo de saturação de 88-92%. Esta calculadora utiliza a Escala 1 de SpO2 (pontuação máxima agregada = 19).",
    "itens": [
      {
        "label": "Frequência respiratória (irpm)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "<=8",
            "pontos": 3
          },
          {
            "label": "9-11",
            "pontos": 1
          },
          {
            "label": "12-20",
            "pontos": 0
          },
          {
            "label": "21-24",
            "pontos": 2
          },
          {
            "label": ">=25",
            "pontos": 3
          }
        ]
      },
      {
        "label": "Saturação de O2 - Escala 1 (%)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "<=91",
            "pontos": 3
          },
          {
            "label": "92-93",
            "pontos": 2
          },
          {
            "label": "94-95",
            "pontos": 1
          },
          {
            "label": ">=96",
            "pontos": 0
          }
        ]
      },
      {
        "label": "Suplementação de oxigênio",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Ar ambiente",
            "pontos": 0
          },
          {
            "label": "Em uso de oxigênio suplementar",
            "pontos": 2
          }
        ]
      },
      {
        "label": "Pressão arterial sistólica (mmHg)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "<=90",
            "pontos": 3
          },
          {
            "label": "91-100",
            "pontos": 2
          },
          {
            "label": "101-110",
            "pontos": 1
          },
          {
            "label": "111-219",
            "pontos": 0
          },
          {
            "label": ">=220",
            "pontos": 3
          }
        ]
      },
      {
        "label": "Frequência cardíaca (bpm)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "<=40",
            "pontos": 3
          },
          {
            "label": "41-50",
            "pontos": 1
          },
          {
            "label": "51-90",
            "pontos": 0
          },
          {
            "label": "91-110",
            "pontos": 1
          },
          {
            "label": "111-130",
            "pontos": 2
          },
          {
            "label": ">=131",
            "pontos": 3
          }
        ]
      },
      {
        "label": "Nível de consciência (ACVPU)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Alerta (A)",
            "pontos": 0
          },
          {
            "label": "Nova confusão, Resposta a Voz, Dor ou Inconsciente (C/V/P/U)",
            "pontos": 3
          }
        ]
      },
      {
        "label": "Temperatura (graus C)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "<=35.0",
            "pontos": 3
          },
          {
            "label": "35.1-36.0",
            "pontos": 1
          },
          {
            "label": "36.1-38.0",
            "pontos": 0
          },
          {
            "label": "38.1-39.0",
            "pontos": 1
          },
          {
            "label": ">=39.1",
            "pontos": 2
          }
        ]
      }
    ],
    "faixas": [
      {
        "min": 0,
        "max": 0,
        "rotulo": "Risco baixo",
        "cor": "green"
      },
      {
        "min": 1,
        "max": 4,
        "rotulo": "Risco baixo",
        "cor": "amber"
      },
      {
        "min": 5,
        "max": 6,
        "rotulo": "Risco médio",
        "cor": "amber"
      },
      {
        "min": 7,
        "rotulo": "Risco alto",
        "cor": "red"
      }
    ],
    "fonte": "Royal College of Physicians. National Early Warning Score (NEWS) 2, 2017"
  },
  {
    "id": "news",
    "nome": "NEWS - National Early Warning Score",
    "categoria": "Deterioração clínica",
    "descricao": "Escore de alerta precoce do Royal College of Physicians para detecção e resposta a deterioração clínica aguda em pacientes adultos. Baseado em 7 itens pontuáveis (6 parâmetros fisiológicos mais o uso de oxigênio suplementar). Esta versão reproduz o NEWS original (2012), usando a Escala 1 de SpO2. No NEWS2 (2017) a diferença relevante é a adição de uma 2a escala de SpO2 (Scale 2) para pacientes com risco de insuficiência respiratória hipercápnica e a substituição do AVPU por ACVPU, que pontua 3 também para nova confusão (\"new confusion\"). O uso de O2 suplementar já pontuava 2 no NEWS 2012 (mantido no NEWS2), e os limiares de temperatura são os mesmos nas duas versões.",
    "itens": [
      {
        "label": "Frequência respiratória (irpm)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "<=8",
            "pontos": 3
          },
          {
            "label": "9-11",
            "pontos": 1
          },
          {
            "label": "12-20",
            "pontos": 0
          },
          {
            "label": "21-24",
            "pontos": 2
          },
          {
            "label": ">=25",
            "pontos": 3
          }
        ]
      },
      {
        "label": "Saturação de O2 - SpO2 (%) - Escala 1",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "<=91",
            "pontos": 3
          },
          {
            "label": "92-93",
            "pontos": 2
          },
          {
            "label": "94-95",
            "pontos": 1
          },
          {
            "label": ">=96",
            "pontos": 0
          }
        ]
      },
      {
        "label": "Oxigênio suplementar",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Sim (O2 suplementar)",
            "pontos": 2
          },
          {
            "label": "Não (ar ambiente)",
            "pontos": 0
          }
        ]
      },
      {
        "label": "Temperatura (C)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "<=35.0",
            "pontos": 3
          },
          {
            "label": "35.1-36.0",
            "pontos": 1
          },
          {
            "label": "36.1-38.0",
            "pontos": 0
          },
          {
            "label": "38.1-39.0",
            "pontos": 1
          },
          {
            "label": ">=39.1",
            "pontos": 2
          }
        ]
      },
      {
        "label": "Pressão arterial sistólica (mmHg)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "<=90",
            "pontos": 3
          },
          {
            "label": "91-100",
            "pontos": 2
          },
          {
            "label": "101-110",
            "pontos": 1
          },
          {
            "label": "111-219",
            "pontos": 0
          },
          {
            "label": ">=220",
            "pontos": 3
          }
        ]
      },
      {
        "label": "Frequência cardíaca (bpm)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "<=40",
            "pontos": 3
          },
          {
            "label": "41-50",
            "pontos": 1
          },
          {
            "label": "51-90",
            "pontos": 0
          },
          {
            "label": "91-110",
            "pontos": 1
          },
          {
            "label": "111-130",
            "pontos": 2
          },
          {
            "label": ">=131",
            "pontos": 3
          }
        ]
      },
      {
        "label": "Nível de consciência (AVPU)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Alerta (A)",
            "pontos": 0
          },
          {
            "label": "Resposta a voz/dor ou inconsciente (V/P/U)",
            "pontos": 3
          }
        ]
      }
    ],
    "faixas": [
      {
        "min": 0,
        "max": 0,
        "rotulo": "Risco baixo - monitoramento mínimo",
        "cor": "green"
      },
      {
        "min": 1,
        "max": 4,
        "rotulo": "Risco baixo - resposta de equipe de enfermagem",
        "cor": "green"
      },
      {
        "min": 5,
        "max": 6,
        "rotulo": "Risco médio - resposta urgente",
        "cor": "amber"
      },
      {
        "min": 7,
        "rotulo": "Risco alto - resposta emergencial",
        "cor": "red"
      }
    ],
    "fonte": "Royal College of Physicians. National Early Warning Score (NEWS): Standardising the assessment of acute-illness severity in the NHS. London: RCP, 2012."
  },
  {
    "id": "timi",
    "nome": "Escore de Risco TIMI (AI/IAMSSST)",
    "categoria": "Cardiologia",
    "descricao": "Escore de risco TIMI para Angina Instável / Infarto Agudo do Miocárdio Sem Supradesnivelamento do segmento ST (AI/IAMSSST). Estima o risco de desfecho composto em 14 dias (morte por todas as causas, novo IAM ou IAM recorrente, e isquemia recorrente grave com necessidade de revascularização urgente). Composto por 7 preditores independentes, cada um valendo 1 ponto (total 0 a 7). Útil para estratificação de risco e decisão sobre estratégia invasiva precoce.",
    "itens": [
      {
        "label": "Idade >= 65 anos",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não (< 65 anos)",
            "pontos": 0
          },
          {
            "label": "Sim (>= 65 anos)",
            "pontos": 1
          }
        ]
      },
      {
        "label": ">= 3 fatores de risco para doença arterial coronariana (história familiar de DAC, hipertensão, hipercolesterolemia, diabetes, tabagismo ativo)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não (< 3 fatores)",
            "pontos": 0
          },
          {
            "label": "Sim (>= 3 fatores)",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Doença arterial coronariana conhecida (estenose coronariana >= 50%)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não / desconhecida",
            "pontos": 0
          },
          {
            "label": "Sim (estenose >= 50%)",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Uso de ácido acetilsalicílico (AAS) nos últimos 7 dias",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Angina grave recente (>= 2 episódios de angina nas últimas 24 horas)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim (>= 2 episódios em 24h)",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Desvio do segmento ST >= 0,5 mm (infra ou supra transitório) ao ECG de admissão",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não (< 0,5 mm)",
            "pontos": 0
          },
          {
            "label": "Sim (>= 0,5 mm)",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Marcadores de necrose miocárdica elevados (troponina ou CK-MB)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não / negativos",
            "pontos": 0
          },
          {
            "label": "Sim / positivos",
            "pontos": 1
          }
        ]
      }
    ],
    "faixas": [
      {
        "min": 0,
        "max": 2,
        "rotulo": "Baixo risco (4,7-8,3% em 14 dias)",
        "cor": "green"
      },
      {
        "min": 3,
        "max": 4,
        "rotulo": "Risco intermediário (13,2-19,9% em 14 dias)",
        "cor": "amber"
      },
      {
        "min": 5,
        "rotulo": "Alto risco (26,2-40,9% em 14 dias)",
        "cor": "red"
      }
    ],
    "fonte": "Antman EM, Cohen M, Bernink PJLM, et al. The TIMI Risk Score for Unstable Angina/Non-ST Elevation MI. JAMA. 2000;284(7):835-842."
  },
  {
    "id": "pesi",
    "nome": "PESI (severidade do TEP)",
    "categoria": "Pneumologia / TEP",
    "descricao": "Pulmonary Embolism Severity Index (PESI) — estratifica o risco de mortalidade em 30 dias em pacientes com tromboembolismo pulmonar (TEP) agudo confirmado, a partir de 11 variáveis clínicas. Classifica em 5 classes (I a V); classes I-II identificam pacientes de baixo risco, potencialmente candidatos a tratamento ambulatorial.",
    "itens": [
      {
        "label": "Idade (anos)",
        "tipo": "numero",
        "min": 18,
        "max": 120,
        "coef": 1
      },
      {
        "label": "Sexo",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Feminino",
            "pontos": 0
          },
          {
            "label": "Masculino",
            "pontos": 10
          }
        ]
      },
      {
        "label": "Câncer (histórico de neoplasia)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 30
          }
        ]
      },
      {
        "label": "Insuficiência cardíaca crônica",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 10
          }
        ]
      },
      {
        "label": "Doença pulmonar crônica",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 10
          }
        ]
      },
      {
        "label": "Frequência cardíaca ≥ 110 bpm",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não (< 110 bpm)",
            "pontos": 0
          },
          {
            "label": "Sim (≥ 110 bpm)",
            "pontos": 20
          }
        ]
      },
      {
        "label": "Pressão arterial sistólica < 100 mmHg",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não (≥ 100 mmHg)",
            "pontos": 0
          },
          {
            "label": "Sim (< 100 mmHg)",
            "pontos": 30
          }
        ]
      },
      {
        "label": "Frequência respiratória ≥ 30 irpm",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não (< 30 irpm)",
            "pontos": 0
          },
          {
            "label": "Sim (≥ 30 irpm)",
            "pontos": 20
          }
        ]
      },
      {
        "label": "Temperatura < 36 °C",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não (≥ 36 °C)",
            "pontos": 0
          },
          {
            "label": "Sim (< 36 °C)",
            "pontos": 20
          }
        ]
      },
      {
        "label": "Estado mental alterado (desorientação, letargia, estupor ou coma)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 60
          }
        ]
      },
      {
        "label": "Saturação arterial de O₂ < 90%",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não (≥ 90%)",
            "pontos": 0
          },
          {
            "label": "Sim (< 90%)",
            "pontos": 20
          }
        ]
      }
    ],
    "faixas": [
      {
        "min": 0,
        "max": 65,
        "rotulo": "Classe I — risco muito baixo (mort. 30d 0–1,6%)",
        "cor": "green"
      },
      {
        "min": 66,
        "max": 85,
        "rotulo": "Classe II — risco baixo (mort. 30d 1,7–3,5%)",
        "cor": "green"
      },
      {
        "min": 86,
        "max": 105,
        "rotulo": "Classe III — risco moderado (mort. 30d 3,2–7,1%)",
        "cor": "amber"
      },
      {
        "min": 106,
        "max": 125,
        "rotulo": "Classe IV — risco alto (mort. 30d 4,0–11,4%)",
        "cor": "red"
      },
      {
        "min": 126,
        "rotulo": "Classe V — risco muito alto (mort. 30d 10,0–24,5%)",
        "cor": "red"
      }
    ],
    "fonte": "Aujesky D et al. Am J Respir Crit Care Med 2005;172(8):1041-6 (PESI original); endossado pela ESC 2019 Guidelines on Acute Pulmonary Embolism."
  },
  {
    "id": "wells-tep",
    "nome": "Escore de Wells para TEP",
    "categoria": "Pneumologia / TEP",
    "descricao": "Estima a probabilidade clínica pré-teste de tromboembolismo pulmonar (TEP/EP) em pacientes com suspeita. Soma os pontos atribuídos a sete critérios clínicos. Permite estratificação em três níveis (baixa/intermediária/alta probabilidade) ou no modelo dicotômico (TEP improvável vs. provável, corte em 4 pontos: >4 = provável). A probabilidade pré-teste orienta a sequência diagnóstica (D-dímero vs. angio-TC de tórax).",
    "itens": [
      {
        "label": "Sinais e sintomas clínicos de TVP (edema/dor à palpação de membro inferior)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 3
          }
        ]
      },
      {
        "label": "Diagnóstico alternativo menos provável que TEP",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 3
          }
        ]
      },
      {
        "label": "Frequência cardíaca > 100 bpm",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1.5
          }
        ]
      },
      {
        "label": "Imobilização (≥ 3 dias) ou cirurgia nas últimas 4 semanas",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1.5
          }
        ]
      },
      {
        "label": "TVP ou TEP prévios (objetivamente diagnosticados)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1.5
          }
        ]
      },
      {
        "label": "Hemoptise",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Câncer (em tratamento, tratado nos últimos 6 meses ou paliativo)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      }
    ],
    "faixas": [
      {
        "min": 0,
        "max": 1.5,
        "rotulo": "Baixa probabilidade",
        "cor": "green"
      },
      {
        "min": 2,
        "max": 6,
        "rotulo": "Probabilidade intermediária",
        "cor": "amber"
      },
      {
        "min": 6.5,
        "rotulo": "Alta probabilidade",
        "cor": "red"
      }
    ],
    "fonte": "Wells PS et al. Thromb Haemost 2000 (escore original de 7 itens, estratificação em três níveis); modelo dicotômico (≤4 improvável / >4 provável) Wells PS et al. Ann Intern Med 2001; endossado pela ESC 2019 (Diagnosis and Management of Acute Pulmonary Embolism)."
  },
  {
    "id": "wells-tvp",
    "nome": "Escore de Wells para TVP (Trombose Venosa Profunda)",
    "categoria": "Vascular / TVP",
    "descricao": "Estratificação da probabilidade pré-teste de trombose venosa profunda (TVP) de membros inferiores. Cada critério clínico soma pontos; o total orienta a conduta (uso de D-dímero e/ou ultrassom com Doppler). O item \"diagnóstico alternativo tão ou mais provável que TVP\" subtrai 2 pontos. Aplicável a pacientes ambulatoriais com suspeita de primeiro episódio de TVP.",
    "itens": [
      {
        "label": "Câncer ativo (em tratamento ou nos últimos 6 meses, ou paliativo)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Paralisia, paresia ou imobilização recente (gesso) de membro inferior",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Acamado por mais de 3 dias ou cirurgia de grande porte nas últimas 12 semanas (com anestesia geral ou regional)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Dor localizada ao longo da distribuição do sistema venoso profundo",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Edema de todo o membro inferior",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Panturrilha com aumento > 3 cm em relação ao membro contralateral (medido 10 cm abaixo da tuberosidade tibial)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Edema depressível (cacifo) restrito ao membro sintomático",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Veias superficiais colaterais (não varicosas)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      },
      {
        "label": "TVP prévia documentada",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Diagnóstico alternativo tão ou mais provável que TVP",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": -2
          }
        ]
      }
    ],
    "faixas": [
      {
        "min": -2,
        "max": 0,
        "rotulo": "Baixa probabilidade",
        "cor": "green"
      },
      {
        "min": 1,
        "max": 2,
        "rotulo": "Probabilidade moderada",
        "cor": "amber"
      },
      {
        "min": 3,
        "rotulo": "Alta probabilidade",
        "cor": "red"
      }
    ],
    "fonte": "Wells PS et al. Evaluation of D-dimer in the diagnosis of suspected deep-vein thrombosis. N Engl J Med 2003;349:1227-1235 (Wells DVT score)."
  },
  {
    "id": "cha2ds2vasc",
    "nome": "CHA2DS2-VASc",
    "categoria": "Cardiologia / FA",
    "descricao": "Estima o risco anual de AVC/tromboembolismo em pacientes com fibrilação atrial não valvar, orientando a indicação de anticoagulação oral. Pontuação de 0 a 9. O acrônimo reflete: Congestive heart failure, Hypertension, Age >=75 (2 pontos), Diabetes, Stroke/TIA prévio (2 pontos), Vascular disease, Age 65-74, Sex category (feminino).",
    "itens": [
      {
        "label": "Insuficiência cardíaca congestiva / disfunção ventricular esquerda (C)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim (IC clínica ou FEVE reduzida moderada/grave)",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Hipertensão arterial (H)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim (HAS ou em tratamento anti-hipertensivo)",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Idade (A2 / A)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "< 65 anos",
            "pontos": 0
          },
          {
            "label": "65-74 anos",
            "pontos": 1
          },
          {
            "label": ">= 75 anos",
            "pontos": 2
          }
        ]
      },
      {
        "label": "Diabetes mellitus (D)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      },
      {
        "label": "AVC / AIT / tromboembolismo prévio (S2)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim (AVC, AIT ou tromboembolismo prévio)",
            "pontos": 2
          }
        ]
      },
      {
        "label": "Doença vascular (V) - IAM prévio, doença arterial periférica ou placa aórtica",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Sexo (Sc)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Masculino",
            "pontos": 0
          },
          {
            "label": "Feminino",
            "pontos": 1
          }
        ]
      }
    ],
    "faixas": [
      {
        "min": 0,
        "max": 0,
        "rotulo": "Baixo risco",
        "cor": "green"
      },
      {
        "min": 1,
        "max": 1,
        "rotulo": "Risco intermediário",
        "cor": "amber"
      },
      {
        "min": 2,
        "rotulo": "Alto risco - anticoagular",
        "cor": "red"
      }
    ],
    "fonte": "ESC 2020 Guidelines for atrial fibrillation (Hindricks/Lip et al., baseado no CHA2DS2-VASc original, Lip et al., Chest 2010)"
  },
  {
    "id": "hasbled",
    "nome": "HAS-BLED",
    "categoria": "Cardiologia / FA",
    "descricao": "Estima o risco de sangramento maior em 1 ano em pacientes com fibrilação atrial (FA) em uso ou candidatos a anticoagulação oral. Acrônimo: Hypertension, Abnormal renal/liver function, Stroke, Bleeding, Labile INR, Elderly, Drugs/alcohol. Pontuação máxima de 9. Um escore alto não contraindica a anticoagulação, mas sinaliza fatores de risco modificáveis e a necessidade de acompanhamento mais frequente.",
    "itens": [
      {
        "label": "Hipertensão (PAS > 160 mmHg não controlada)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Função renal anormal (diálise, transplante renal ou creatinina >= 2,26 mg/dL / 200 umol/L)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Função hepática anormal (cirrose, bilirrubina > 2x LSN, ou TGO/TGP/FA > 3x LSN)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      },
      {
        "label": "AVC prévio",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Sangramento prévio ou predisposição a sangramento (anemia, diátese hemorrágica)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      },
      {
        "label": "INR lábil (TTR < 60% no uso de varfarina)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Idoso (idade > 65 anos)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Medicamentos que predispõem a sangramento (antiplaquetários, AINEs)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Uso abusivo de álcool (>= 8 doses/semana)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      }
    ],
    "faixas": [
      {
        "min": 0,
        "max": 0,
        "rotulo": "Risco baixo",
        "cor": "green"
      },
      {
        "min": 1,
        "max": 2,
        "rotulo": "Risco intermediário",
        "cor": "amber"
      },
      {
        "min": 3,
        "rotulo": "Risco alto",
        "cor": "red"
      }
    ],
    "fonte": "Pisters et al., Chest 2010; ESC 2020 AF Guidelines"
  },
  {
    "id": "curb65",
    "nome": "CURB-65",
    "categoria": "Pneumologia / PAC",
    "descricao": "Escore de gravidade da pneumonia adquirida na comunidade (PAC) que estratifica o risco de mortalidade em 30 dias e orienta a decisão de tratamento ambulatorial, internação ou cuidado intensivo. Cada um dos 5 critérios (acrônimo CURB-65: Confusion, Urea, Respiratory rate, Blood pressure, 65 anos) vale 1 ponto, total 0 a 5. Confusão = confusão mental de início recente (AMTS menor ou igual a 8 ou desorientação em pessoa, lugar ou tempo).",
    "itens": [
      {
        "label": "Confusão mental (de início recente; AMTS menor ou igual a 8 ou desorientação)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Ausente",
            "pontos": 0
          },
          {
            "label": "Presente",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Ureia (Urea) sérica > 7 mmol/L (BUN > 19 mg/dL; ureia > ~42-50 mg/dL)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não (ureia menor ou igual ao limiar)",
            "pontos": 0
          },
          {
            "label": "Sim (ureia acima do limiar)",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Frequência respiratória maior ou igual a 30 irpm",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não (< 30 irpm)",
            "pontos": 0
          },
          {
            "label": "Sim (maior ou igual a 30 irpm)",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Pressão arterial baixa (PAS < 90 mmHg ou PAD menor ou igual a 60 mmHg)",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não",
            "pontos": 0
          },
          {
            "label": "Sim",
            "pontos": 1
          }
        ]
      },
      {
        "label": "Idade maior ou igual a 65 anos",
        "tipo": "opcoes",
        "opcoes": [
          {
            "label": "Não (< 65 anos)",
            "pontos": 0
          },
          {
            "label": "Sim (maior ou igual a 65 anos)",
            "pontos": 1
          }
        ]
      }
    ],
    "faixas": [
      {
        "min": 0,
        "max": 1,
        "rotulo": "Baixo risco (mortalidade ~1.5%; 0=~0.7%, 1=~3.2%) - tratamento ambulatorial",
        "cor": "green"
      },
      {
        "min": 2,
        "max": 2,
        "rotulo": "Risco intermediário (mortalidade ~9.2%) - internação breve ou supervisão",
        "cor": "amber"
      },
      {
        "min": 3,
        "rotulo": "Alto risco (mortalidade ~22%; 3=~14.5%, 4-5=até ~40%) - internação, avaliar UTI (sobretudo 4-5)",
        "cor": "red"
      }
    ],
    "fonte": "Lim WS, van der Eerden MM, Laing R, et al. Defining community acquired pneumonia severity on presentation to hospital: an international derivation and validation study. Thorax 2003;58:377-382."
  }
];
