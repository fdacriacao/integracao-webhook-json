import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizar, removerDuplicados, PayloadInvalido } from "../src/normalizar.js";

const ler = (f) => JSON.parse(readFileSync(new URL(`../exemplos/${f}`, import.meta.url), "utf8"));

test("whatsapp: extrai mensagem, normaliza telefone e remove espaços do texto", () => {
  const [e] = normalizar("whatsapp", ler("whatsapp.json"));
  assert.equal(e.origem, "whatsapp");
  assert.equal(e.telefone, "+5522999990000");
  assert.equal(e.texto, "Olá, quero agendar uma revisão");
  assert.equal(e.recebido_em, "2025-10-09T08:53:20.000Z");
});

test("formulario: adiciona +55 quando o telefone vem sem código do país", () => {
  const [e] = normalizar("formulario", ler("formulario.json"));
  assert.equal(e.telefone, "+5522999990000");
  assert.equal(e.id_externo, "1001");
});

test("rejeita origem desconhecida", () => {
  assert.throws(() => normalizar("telegram", {}), PayloadInvalido);
});

test("rejeita telefone inválido", () => {
  assert.throws(() => normalizar("formulario", { id: 1, telefone: "123" }), /telefone inválido/);
});

test("rejeita whatsapp sem mensagens", () => {
  assert.throws(() => normalizar("whatsapp", { entry: [] }), /nenhuma mensagem/);
});

test("idempotência: o mesmo evento reenviado é descartado", () => {
  const vistos = new Set();
  const evs = normalizar("formulario", ler("formulario.json"));
  assert.equal(removerDuplicados(evs, vistos).length, 1);
  assert.equal(removerDuplicados(evs, vistos).length, 0);
});
