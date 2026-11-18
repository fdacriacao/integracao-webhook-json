# Integração por webhook: receber, validar e normalizar JSON

Exemplo didático de um padrão comum em integrações de sistemas: **várias origens enviam mensagens em formatos diferentes, e o sistema precisa de um formato único**.

O serviço recebe webhooks, valida o JSON, normaliza os campos (telefone, data, texto), descarta reenvios duplicados e responde com o código HTTP correto para cada situação.

> Os formatos de payload deste repositório são **fictícios**, inspirados em padrões comuns de APIs de mensagens. Não há dados reais.

## Contexto

Integrações com canais de mensagem aparecem em projetos reais do meu portfólio, como um sistema de atendimento por WhatsApp que usa a API oficial da Meta. Este repositório isola, em poucas linhas e sem dependências, as regras que sustentam esse tipo de integração.

## O que está resolvido

| Problema | Solução |
|----------|---------|
| Duas origens, dois formatos de JSON | Um normalizador por origem, um formato de saída único |
| Telefones em formatos diversos | Normalização para o padrão E.164 (`+5522999990000`), assumindo Brasil quando falta o código do país |
| Webhooks costumam ser reenviados | **Idempotência**: o mesmo evento (`origem:id_externo`) é processado uma única vez |
| Entrada malformada | `400` para JSON inválido, `422` para payload com dados inválidos, `404` para rota inexistente |

## Formato de saída

```json
{
  "origem": "whatsapp",
  "id_externo": "wamid.EXEMPLO1",
  "telefone": "+5522999990000",
  "texto": "Olá, quero agendar uma revisão",
  "recebido_em": "2025-10-09T08:53:20.000Z"
}
```

## Como rodar

Requer Node.js 20 ou superior. Sem dependências externas.

```bash
npm test        # 9 testes automatizados
npm run demo    # sobe o servidor em http://localhost:3000

# em outro terminal:
curl -X POST localhost:3000/webhook/formulario -d @exemplos/formulario.json
curl -X POST localhost:3000/webhook/whatsapp   -d @exemplos/whatsapp.json
curl localhost:3000/eventos
```

Enviar o mesmo arquivo duas vezes retorna `{"recebidos":0}` na segunda: é a idempotência funcionando.

## Estrutura

```
src/normalizar.js   regras de validação e normalização (uma função por origem)
src/servidor.js     servidor HTTP mínimo com POST /webhook/:origem
test/               testes das regras e do servidor (node:test)
exemplos/           payloads de exemplo
```

## Limitações (de propósito)

- Os eventos ficam em memória. Em produção iriam para um banco, e a chave de idempotência seria uma restrição `UNIQUE`.
- Não há verificação de assinatura do webhook. Em produção, validar a assinatura enviada pelo provedor é obrigatório.
- Para adicionar uma nova origem, basta escrever uma função de normalização e registrá-la em `ORIGENS`.

## Transparência

Projeto montado com apoio de IA (Claude) e revisado por mim. Os 9 testes passam em Node.js 22.

## Autor

Filippe Daruis · Itaperuna/RJ · [LinkedIn](https://www.linkedin.com/in/filippe-daruis-1b227294/)
