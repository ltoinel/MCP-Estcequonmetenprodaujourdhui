# MCP Server — Est‑ce qu'on met en production aujourd'hui ?

Serveur MCP (Model Context Protocol) compatible GitHub Copilot, inspiré de [estcequonmetenprodaujourdhui.info](https://www.estcequonmetenprodaujourdhui.info/) fournissant une décision humoristique et localisée sur le fait de pouvoir déployer ou non en prod aujourd'hui.

Il bloquera votre agent Github Copilot si vous lui demandez de déployer votre application un dimanche.

Il s'agit d'un exemple de MCP server en Node.js avec un wrapper STDIO et HTTP réutilisable pour d'autres cas d'usage.


## Intégration VS Code

Le dépôt fournit une configuration `.vscode/mcp.json` qui décrit 3 types intégrations possibles : Stdio local avec les sources, HTTP ou bien NPM. Choisissez celui que vous souhaitez utiliser.

```jsonc
{
	"servers": {
		"estcequonmetenprodaujourdhui-stdio": {
			"type": "stdio",
			"command": "node",
			"args": [
				"dist/mcp-stdio-server.js"
			]
		},
		"estcequonmetenprodaujourdhui-http": {
			"url": "http://localhost:3000/mcp",
			"type": "http"
		},
		"estcequonmetenprodaujourdhui-npm": {
			"type": "stdio",
			"command": "npx",
			"args": [
				"mcp-estcequonmetenprodaujourdhui@1.0.3"
			],
			"env": {}
		}
	},
	"inputs": []
}
```

Exemple de conversation dans Github Copilot : 
> On peut mettre en prod ? 

Réponse du MCP Server : 
> Non, aujourd'hui c'est dimanche : on ne met pas en production.
> 🛑 Les astres disent "non" et on n'argumente pas avec les astres.

## État actuel

- Serveur stdio (SDK-backed) : `src/mcp-stdio-server.ts` → compilé en `dist/mcp-stdio-server.js` (exécuté avec `npm start`).
- Wrapper HTTP (Express) : `src/mcp-http-server.ts` → compilé en `dist/mcp-http-server.js` (exécuté avec `npm run start-http`).

## Installation / build

```bash
npm install
npm run build
```

## Scripts importants

- `npm start` — démarre le serveur stdio compilé (`dist/mcp-stdio-server.js`).
- `npm run start-stdio` — alias pour le serveur stdio.
- `npm run start-http` — démarre le wrapper HTTP (Express).
- `npm test` — compile puis lance la suite de tests (Jest).

## Points d'entrée

### stdio (SDK MCP)

- Utilisation : `npm start` (après `npm run build`).
- Le serveur suit le protocole MCP via le SDK `@modelcontextprotocol/sdk` et est adapté pour les intégrations (VS Code, clients MCP).

### HTTP (wrapper)

- Utilisation : `npm run start-http` (après `npm run build`).
- Endpoints :
  - `POST /mcp` — accepte `{ id, method, params }` et renvoie `{ id, result }`.

## Internationalisation

Les messages et raisons sont dans `config/reasons/<code>.json`. Le fallback est `fr` si la locale demandée n'existe pas.


## Tests

```bash
npm test
```

Les tests couvrent la logique métier (jours, messages), la localisation et le stdio.
Le test du MCP server est en cours de réalisation..

## Structure (extrait)

```
src/
├─ mcp-stdio-server.ts   # Serveur stdio (SDK-backed)
├─ mcp-http-server.ts    # Wrapper HTTP (Express)
└─ lib/
   └─ deployment-logic.ts

config/reasons/          # fichiers de raisons par locale
dist/                    # artefacts compilés
tests/                   # tests Jest
.vscode/mcp.json         # config pour extension MCP (stdio)
package.json
```


## Linting

Le projet utilise ESLint (configuration flat pour ESLint v9) pour analyser le code TypeScript.

Pour lancer le linter :

```bash
npm run lint      # exécute ESLint sur src/ (script défini dans package.json)
npm run lint:fix  # tente de corriger automatiquement les problèmes
```

Remarques :
- La configuration principale est dans `eslint.config.cjs` (format "flat" recommandé par ESLint v9).
- Prochaine amélioration recommandée : ajouter `lint-staged` + `husky` pour lancer ESLint seulement sur les fichiers modifiés avant commit.

## Contribuer

Les contributions sont bienvenues. Ouvrez une PR, ajoutez des tests si vous modifiez de la logique métier et mettez à jour la documentation si besoin.

## Licence

MIT