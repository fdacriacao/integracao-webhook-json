// Normaliza payloads de webhook de diferentes origens para um formato único.
// Origens suportadas (formatos fictícios, inspirados em padrões comuns de APIs de mensagens):
//   - "whatsapp": objeto aninhado em entry[].changes[].value.messages[]
//   - "formulario": objeto plano enviado por um formulário de site

export class PayloadInvalido extends Error {
  constructor(motivo) {
    super(motivo);
    this.name = "PayloadInvalido";
  }
}

const soDigitos = (v) => String(v ?? "").replace(/\D/g, "");

function telefoneE164(bruto) {
  const d = soDigitos(bruto);
  if (d.length < 10 || d.length > 13) throw new PayloadInvalido(`telefone inválido: "${bruto}"`);
  // Sem código do país (10 ou 11 dígitos): assume Brasil (+55)
  return d.length <= 11 ? `+55${d}` : `+${d}`;
}

function deWhatsapp(corpo) {
  const msgs = corpo?.entry?.[0]?.changes?.[0]?.value?.messages;
  if (!Array.isArray(msgs) || msgs.length === 0) throw new PayloadInvalido("whatsapp: nenhuma mensagem no payload");
  return msgs.map((m) => {
    if (!m.id) throw new PayloadInvalido("whatsapp: mensagem sem id");
    return {
      origem: "whatsapp",
      id_externo: m.id,
      telefone: telefoneE164(m.from),
      texto: (m.text?.body ?? "").trim(),
      recebido_em: new Date(Number(m.timestamp) * 1000).toISOString(),
    };
  });
}

function deFormulario(corpo) {
  if (!corpo?.id || !corpo?.telefone) throw new PayloadInvalido("formulario: campos obrigatórios: id, telefone");
  return [
    {
      origem: "formulario",
      id_externo: String(corpo.id),
      telefone: telefoneE164(corpo.telefone),
      texto: String(corpo.mensagem ?? "").trim(),
      recebido_em: new Date(corpo.enviado_em ?? Date.now()).toISOString(),
    },
  ];
}

const ORIGENS = { whatsapp: deWhatsapp, formulario: deFormulario };

export function normalizar(origem, corpo) {
  const fn = ORIGENS[origem];
  if (!fn) throw new PayloadInvalido(`origem desconhecida: "${origem}"`);
  return fn(corpo);
}

// Idempotência: webhooks costumam ser reenviados. Descarta o que já foi processado.
export function removerDuplicados(eventos, jaVistos = new Set()) {
  const novos = [];
  for (const e of eventos) {
    const chave = `${e.origem}:${e.id_externo}`;
    if (jaVistos.has(chave)) continue;
    jaVistos.add(chave);
    novos.push(e);
  }
  return novos;
}
