import { readFileSync, writeFileSync } from "fs";

const OUT = "C:/Users/Arthu/AppData/Local/Temp/claude/C--Users-Arthu/abe5241c-f6c9-481a-a48f-65725f86894b/tasks/w6ey5d2oq.output";
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
const record = {};
for (const s of specs) {
  record[s.id] = {
    condutaId: s.id,
    papel: s.papel,
    evidencias: s.evidencias,
    oQueLer: s.oQueLer,
    redFlags: s.redFlags,
    acaoPrioritaria: s.acaoPrioritaria,
    fontes: s.fontes,
  };
}

const literal = "export const SPECIALISTS: Record<string, SpecialistConfig> = " + JSON.stringify(record, null, 2) + ";";
let src = readFileSync(FILE, "utf8");
src = src.replace(/export const SPECIALISTS: Record<string, SpecialistConfig> = \{\};/, literal);
writeFileSync(FILE, src, "utf8");
console.log("Especialistas escritos:", Object.keys(record).length);
console.log(Object.keys(record).join(", "));
