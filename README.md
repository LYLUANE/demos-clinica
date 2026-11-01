# Demos de portfólio: soluções para clínicas

Três demonstrações de uma **clínica fictícia** (Clínica Aurora) que funcionam juntas:

| Demo | Pasta | O que mostra |
|---|---|---|
| Site | `site/` | Página da clínica com agendamento online e horários livres em tempo real |
| Chatbot | `chatbot/` | Atendente de WhatsApp: dúvidas, preços, agendamento, lembrete de 24h, follow-up de orçamento, transferência para humano, com o painel "bastidores" |
| Gestão | `gestao/` | Painel da recepção: agenda do dia, agenda por profissional, funil de orçamentos, pacientes, indicadores |
| IA no CRM | `crm/` | Prioridades do dia e perguntas em português sobre os dados da clínica, com mensagem sugerida |
| Estoque | `estoque/` | Baixa de materiais por atendimento, alerta de mínimo, pedido de compra, entradas × saídas |
| Automação | `automacao/` | Formulário → planilha → e-mail → WhatsApp, com fluxo animado e relatório semanal |
| Documentos | `documentos/` | Respostas tiradas só dos documentos da clínica, com o trecho de origem; diz "não sei" quando não há fonte |
| n8n | `n8n/` | Três workflows importáveis: atendente de WhatsApp com IA, lembretes e follow-up, leads e relatório |

A página `index.html` na raiz apresenta todas. Elas compartilham os mesmos dados de exemplo.

Os workflows do n8n foram importados com sucesso no n8n 2.45.7, e todos os tipos e versões de nós existem nessa versão. Eles não foram executados de ponta a ponta, porque isso exige contas reais (WhatsApp Business, Anthropic, Supabase e Google).

## Como funciona
- É só HTML, CSS e JavaScript, sem servidor nem instalação.
- Os dados ficam no `localStorage` do navegador (`assets/store.js`). Um agendamento feito no site ou no chatbot aparece no painel.
- Os dados de exemplo são gerados em torno da data de hoje, então a demo sempre parece atual. Para recomeçar, use "Restaurar dados de exemplo" no painel.
- Nada sai do navegador: não há chave de API nem envio de dados.

## Rodar no computador
```bash
python -m http.server 8765
```
Depois, abrir http://localhost:8765

## Publicar (link para mandar nas propostas)
- **Netlify Drop:** arrastar a pasta inteira em https://app.netlify.com/drop
- **GitHub Pages:** criar um repositório, enviar a pasta e ativar Pages na branch `main`.
- **Vercel:** `vercel` na pasta.

## Versão real (o que se vende ao cliente)
- Site: WordPress ou Next.js, com o agendamento ligado ao banco de dados.
- Chatbot: API oficial do WhatsApp Business + n8n + IA (Claude), com as regras da clínica.
- Gestão: Next.js + Supabase (login, permissões, backup), com cuidados de LGPD para dados de saúde.

Todos os nomes, pacientes, profissionais, endereços e depoimentos são fictícios.
