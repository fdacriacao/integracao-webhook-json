// Servidor HTTP mínimo (sem dependências) com um endpoint POST /webhook/:origem
import http from "node:http";
import { normalizar, removerDuplicados, PayloadInvalido } from "./normalizar.js";

export function criarServidor() {
  const jaVistos = new Set();
  const armazenados = [];

  const servidor = http.createServer((req, res) => {
    const responder = (status, obj) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(obj));
    };

    const m = req.url.match(/^\/webhook\/([a-z]+)$/);
    if (req.method === "GET" && req.url === "/eventos") return responder(200, armazenados);
    if (req.method !== "POST" || !m) return responder(404, { erro: "rota não encontrada" });

    let corpo = "";
    req.on("data", (c) => (corpo += c));
    req.on("end", () => {
      let json;
      try {
        json = JSON.parse(corpo);
      } catch {
        return responder(400, { erro: "JSON inválido" });
      }
      try {
        const novos = removerDuplicados(normalizar(m[1], json), jaVistos);
        armazenados.push(...novos);
        responder(200, { recebidos: novos.length });
      } catch (e) {
        if (e instanceof PayloadInvalido) return responder(422, { erro: e.message });
        responder(500, { erro: "erro interno" });
      }
    });
  });
  return servidor;
}
