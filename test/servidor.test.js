import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { criarServidor } from "../src/servidor.js";

const exemplo = readFileSync(new URL("../exemplos/formulario.json", import.meta.url), "utf8");

async function comServidor(fn) {
  const s = criarServidor();
  await new Promise((r) => s.listen(0, r));
  const base = `http://localhost:${s.address().port}`;
  try { await fn(base); } finally { s.close(); }
}
const post = (url, corpo) => fetch(url, { method: "POST", body: corpo });

test("200 no primeiro envio e 0 recebidos no reenvio", () =>
  comServidor(async (base) => {
    const a = await post(`${base}/webhook/formulario`, exemplo);
    assert.equal(a.status, 200);
    assert.deepEqual(await a.json(), { recebidos: 1 });
    const b = await post(`${base}/webhook/formulario`, exemplo);
    assert.deepEqual(await b.json(), { recebidos: 0 });
  }));

test("400 para JSON inválido e 422 para payload inválido", () =>
  comServidor(async (base) => {
    assert.equal((await post(`${base}/webhook/formulario`, "{quebrado")).status, 400);
    assert.equal((await post(`${base}/webhook/formulario`, "{}")).status, 422);
  }));

test("404 para rota inexistente", () =>
  comServidor(async (base) => {
    assert.equal((await post(`${base}/outra`, "{}")).status, 404);
  }));
