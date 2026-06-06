import { readFileSync, appendFileSync } from "fs";

// Lê a saída do workflow (JSON limpo) e mescla os 4 especialistas novos em lib/specialists.ts.
const OUT = "C:/Users/Arthu/AppData/Local/Temp/claude/C--Users-Arthu/abe5241c-f6c9-481a-a48f-65725f86894b/tasks/wiba0reev.output";
const FILE = "C:/Users/Arthu/Projeto Medicina/lib/specialists.ts";

const data = JSON.parse(readFileSync(OUT, "utf8"));

function findSpecialists(d) {
  if (Array.isArray(d?.result?.specialists)) return d.result.specialists;
  if (Array.isArray(d?.specialists)) return d.specialists;
  let found = null;
  JSON.stringify(d, (k, v) => {
    if (Array.isArray(v) && v[0] && v[0].papel && v[0].id) found = v;
    return v;
  });
  return found || [];
}

const specs = findSpecialists(data);
if (!specs.length) { console.error("NAO achei specialists na saida do workflow"); process.exit(1); }

const rec = {};
for (const s of specs) {
  rec[s.id] = {
    condutaId: s.id,
    papel: s.papel,
    evidencias: s.evidencias,
    oQueLer: s.oQueLer,
    redFlags: s.redFlags,
    acaoPrioritaria: s.acaoPrioritaria,
    fontes: s.fontes,
  };
}

const src = readFileSync(FILE, "utf8");
if (src.includes("Object.assign(SPECIALISTS")) {
  console.error("ja existe Object.assign(SPECIALISTS) no arquivo — abortando p/ nao duplicar");
  process.exit(1);
}

const block =
  "\n\n// Especialistas dos tipos de Novo caso — pesquisados + VERIFICADOS (adversarial) com\n" +
  "// literatura/estudos de referencia (Sgarbossa/Smith, de Winter, Wellens, Brugada, CRASH-2/3, PROPPR, ATLS 10th, Surviving Sepsis, AHA/ASA).\n" +
  "Object.assign(SPECIALISTS, " + JSON.stringify(rec, null, 2) + ");\n";

appendFileSync(FILE, block, "utf8");
console.log("especialistas adicionados:", Object.keys(rec).join(", "));
