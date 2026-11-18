import { criarServidor } from "./servidor.js";
const porta = 3000;
criarServidor().listen(porta, () => {
  console.log(`Servidor em http://localhost:${porta}`);
  console.log("Teste:  curl -X POST localhost:3000/webhook/formulario -d @exemplos/formulario.json");
});
