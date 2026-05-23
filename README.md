# discord-inkie

Bot de Discord para registrar leituras com um fluxo amigável: autocomplete de livros, formulário modal, metadados da [Open Library](https://openlibrary.org) (capa e total de páginas) e publicação em embed no canal.

## Funcionalidades

- **`/journal`** — comando slash para criar um registro de leitura
- **Autocomplete de livros** — ao digitar o nome do livro, o bot sugere títulos e autores via Open Library
- **Modal** — campos para página atual, mood (emoji/texto) e comentário
- **Spoiler** — botões para marcar se o comentário contém spoiler
- **Embed enriquecido** — quando a Open Library tiver dados:
  - Capa do livro (thumbnail)
  - Progresso no formato `Página 42/320 (13%)`
- **Fallbacks** — se capa ou total de páginas não forem encontrados, o registro é publicado normalmente (só `Página 42`, sem imagem)

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior (usa `fetch` nativo)
- Conta no [Discord Developer Portal](https://discord.com/developers/applications)
- Bot criado e convidado para o seu servidor

## Configuração do bot no Discord

1. Acesse [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**
2. Em **Bot**, crie o bot e copie o **Token**
3. Em **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Permissões sugeridas: `Send Messages`, `Embed Links`, `Use Slash Commands`
4. Use a URL gerada para adicionar o bot ao servidor
5. Em **General Information**, copie o **Application ID** (é o `CLIENT_ID`)

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DISCORD_TOKEN=seu_token_do_bot
CLIENT_ID=id_da_aplicacao
```

| Variável        | Descrição                          |
|-----------------|------------------------------------|
| `DISCORD_TOKEN` | Token do bot (aba Bot)             |
| `CLIENT_ID`     | Application ID (aba General)       |

> O arquivo `.env` está no `.gitignore` — não commite o token.

## Instalação e execução

```bash
# Instalar dependências
npm install

# Registrar o comando /journal no Discord (rode após alterar register-commands.ts)
npm run register

# Iniciar o bot
npm run dev
```

Sempre que mudar a definição dos slash commands, execute `npm run register` de novo e reinicie o bot.

## Como usar

1. No canal do servidor, digite `/journal`
2. No campo **livro**, comece a digitar (ex.: `a man`) e escolha uma sugestão **ou** digite o título manualmente
3. Preencha o formulário: página, mood e comentário
4. Aguarde o bot buscar metadados na Open Library (mensagem efêmera)
5. Clique em **Sim, tem spoiler** ou **Não tem spoiler**
6. O registro é publicado no canal com o embed

### Exemplo de embed

```
Novo histórico de leitura!
📖 A Mansão Hollow — Agatha Christie
🔖 Página 42/320 (13%)
☁️ Mood: 🤯

Comentário do usuário...
```

Com capa à direita, quando disponível na Open Library.

## Estrutura do projeto

```
src/
├── index.ts              # Cliente Discord e handlers de interação
├── register-commands.ts  # Registro do slash command /journal
├── journal-ui.ts         # Modal, botões de spoiler e montagem do embed
├── book-search.ts        # Autocomplete (busca na Open Library)
├── book-metadata.ts      # Capa e total de páginas para o embed
└── book-livro.ts         # Parse/encode do valor do livro (id da obra + título)
```

## Integração Open Library

- **Autocomplete:** `https://openlibrary.org/search.json`
- **Metadados:** total de páginas (`number_of_pages_median`) e capa (`cover_i` ou ISBN)
- Sugestões do autocomplete guardam o id da obra (`ol:OL123W|título — autor`) para buscas mais precisas
- Títulos digitados manualmente usam busca por nome; podem vir sem capa ou sem total de páginas

A Open Library é um catálogo aberto e gratuito. Nem todo livro tem capa ou número de páginas cadastrados — o bot trata isso sem quebrar.

## Scripts npm

| Script       | Comando                         | Descrição                    |
|--------------|---------------------------------|------------------------------|
| `npm run dev` | `tsx src/index.ts`             | Sobe o bot em desenvolvimento |
| `npm run register` | `tsx src/register-commands.ts` | Registra `/journal` na API do Discord |

## Stack

- TypeScript
- [discord.js](https://discord.js.org/) v14
- [dotenv](https://github.com/motdotla/dotenv)

## Solução de problemas

| Problema | O que verificar |
|----------|-----------------|
| Comando `/journal` não aparece | Rodou `npm run register`? Bot está no servidor? |
| `Invalid token` | `DISCORD_TOKEN` correto no `.env` |
| Erro ao registrar comandos | `CLIENT_ID` correto; token com permissão |
| Bot online mas não responde | Terminal sem erros? Intents: só `Guilds` é necessário para slash commands |
| Sem capa / sem total de páginas | Normal para alguns livros; escolher sugestão do autocomplete ajuda |
| Não publica no canal | O comando precisa ser usado em um canal de texto onde o bot pode enviar mensagens |

## Licença

ISC
