# MCP Server - Est-ce que l'on met en production aujourd'hui ?

Serveur MCP (Model Context Protocol) compatible GitHub Copilot, inspiré de https://www.estcequonmetenprodaujourdhui.info/.

## 🎯 Description

Un serveur MCP qui vous aide à décider si vous pouvez mettre en production aujourd'hui, avec des raisons drôles adaptées aux développeurs.

**Règles :**
- Lundi / Mardi / Mercredi → ✅ yes
- Jeudi → ⚠️ caution
- Vendredi → 🚫 blocked
- Samedi / Dimanche → 🛑 no

## 🚀 Installation

```powershell
npm install
```

## 💻 Utilisation avec GitHub Copilot

### 1. Démarrer le serveur MCP

```powershell
npm start
```

### 1b. (Optionnel) Démarrer un serveur HTTP (wrapper)

Si vous préférez exposer les mêmes outils via HTTP (par ex. pour requêtes curl ou tests), démarrez le wrapper HTTP :

```powershell
npm run start-http
```

Endpoints utiles :
- `GET /status` — décision pour la date du jour (même logique que MCP)
-- `GET /reasons` — renvoie les raisons pour la langue demandée (`?lang=xx`) ou la locale par défaut (`fr`) ; retourne le fichier `config/reasons/<code>.json` si disponible.

Langues / internationalisation
--------------------------------
Le service supporte maintenant des locales. Vous pouvez demander une langue via :
- le paramètre de requête `?lang=fr` (ex: `/status?lang=en`)
- ou l'en-tête HTTP `Accept-Language: en,fr;q=0.8`

Le serveur MCP accepte aussi un argument `lang` dans l'appel d'outil (ex. via Copilot) :
- `check_deployment_status` accepte `{ "lang": "en" }` en argument.
- `get_deployment_reasons` accepte aussi `{ "lang": "en" }`.

Si une traduction des raisons existe pour la locale demandée (fichiers sous `config/reasons/<code>.json`), elle sera utilisée ; sinon la recherche de secours suit cet ordre :

1. `config/reasons/fr.json` (fallback privilégié — français)

Un fichier `config/reasons/fr.json` a été ajouté pour clarifier que le français est la locale par défaut et pour organiser les fichiers de traductions par langue.

### Serveur MCP stdio (stdin/stdout)

Une version "stdio" du serveur est fournie : elle permet d'exposer les mêmes outils MCP sur l'entrée/sortie standard. C'est utile pour l'intégration avec VS Code (extension MCP/Copilot) ou pour des clients qui communiquent par pipes.

- Script npm : `npm run start-stdio` (génère et exécute `dist/mcp-stdio-server.js` après `npm run build`).
- Protocole : lignes JSON (request/response line-delimited). Exemple de requête :

```json
{"id":1,"method":"check_deployment_status","params":{"date":"2025-10-31","lang":"en"}}
```

Réponse (une ligne JSON) :

```json
{"id":1,"result":{...}}
```

Exemples pratiques (WSL / bash) :

```bash
# demande unique (le processus lira la ligne, répondra puis quittera)
printf '{"id":1,"method":"check_deployment_status","params":{"date":"2025-10-26","lang":"fr"}}\n' | npm run start-stdio

# récupérer les raisons pour une locale
printf '{"id":2,"method":"get_deployment_reasons","params":{"lang":"fr"}}\n' | npm run start-stdio
```

Pour une intégration persistante (VS Code Remote - WSL ou l'extension MCP), définissez dans `.vscode/mcp.json` une entrée `stdio` :

```jsonc
{
  "servers": {
    "estcequelonmetenprodaujourdhui": {
      "type": "stdio",
      "command": "npm",
      "args": ["run", "start-stdio"]
    }
  },
  "inputs": []
}
```

Notes :
- Le mode "pipe" (printf | npm run start-stdio) est pratique pour tests ponctuels. Pour envoyer plusieurs requêtes au même processus, utilisez l'extension MCP de VS Code ou écrivez un petit client qui échange avec stdin/stdout du processus enfant.
- Si `npm run start-stdio` échoue, vérifiez d'abord que vous avez compilé (`npm run build`) et que `dist/mcp-stdio-server.js` existe.

### 2. Configuration dans VSCode

L'intégration MCP pour GitHub Copilot s'appuie sur un serveur stdio (stdin/stdout). Le dépôt contient une configuration dédiée dans `.vscode/mcp.json` — si vous utilisez VS Code Remote‑WSL, ouvrez le dossier dans WSL puis laissez l'extension démarrer le serveur.

Étapes rapides :
1. Ouvrez le dossier du projet dans VS Code (option Remote - WSL si vous travaillez depuis Windows)
2. Installez / activez l'extension MCP / GitHub Copilot Chat qui supporte la découverte via `.vscode/mcp.json`
3. L'extension démarrera automatiquement le serveur stdio défini dans `.vscode/mcp.json` (ou vous proposera de le lancer)

Configuration manuelle (si l'extension ne la détecte pas) : créez ou éditez `.vscode/mcp.json` avec cette entrée :

```jsonc
{
  "servers": {
    "estcequelonmetenprodaujourdhui": {
      "type": "stdio",
      "command": "npm",
      "args": ["run", "start-stdio"]
    }
  },
  "inputs": []
}
```

Note : `npm run start-stdio` démarre le serveur stdio (après compilation). Si vous préférez lancer manuellement le serveur sans l'extension, exécutez `npm run build` puis `npm run start-stdio` dans WSL/terminal.

### 3. Outils MCP disponibles

- **check_deployment_status** - Vérifie si on peut déployer aujourd'hui
- **get_deployment_reasons** - Liste toutes les raisons possibles

## 📝 Exemples de prompts GitHub Copilot

```
@workspace Est-ce que je peux déployer aujourd'hui ?
```

```
@workspace Montre-moi toutes les raisons de déploiement
```

```
Avant de merger ma PR, vérifie si c'est un bon jour pour déployer
```

```
Mon manager veut que je déploie maintenant. Qu'en pense le MCP ?
```

## 🧪 Tests

```powershell
npm test
```

Tests inclus :
- ✅ Décisions pour chaque jour de la semaine (7 tests)
- ✅ Validation que les raisons proviennent du bon fichier de config
- ✅ Vérification du format des messages

## 🗂️ Structure

```
├── src/
│   ├── mcp-server.ts          # Serveur MCP principal (build → dist/mcp-server.js)
│   ├── http-server.ts         # Wrapper HTTP (build → dist/http-server.js)
│   ├── mcp-stdio-server.ts    # Serveur stdio (build → dist/mcp-stdio-server.js)
│   └── lib/
│       └── deployment-logic.ts # Logique métier réutilisée
├── config/
│   ├── reasons/               # raisons par locale (ex: en.json, fr.json)
│   └── i18n.json              # labels et noms de jours pour les locales
├── dist/                      # Artefacts compilés par `npm run build`
├── tests/                     # Tests Jest (unit + CLI)
├── .vscode/
│   └── mcp.json               # configuration MCP pour l'extension (stdio)
└── package.json
```

## 🔧 Personnalisation

Pour modifier les raisons drôles, éditez les fichiers sous `config/reasons/` (ex: `config/reasons/fr.json` ou `config/reasons/en.json`).

Chaque décision (`yes`, `caution`, `blocked`, `no`) contient 10 raisons différentes qui sont choisies aléatoirement.

## 🆘 Dépannage

### Copilot ne voit pas le serveur MCP

1. Vérifiez que `.vscode/settings.json` contient la configuration
2. Redémarrez VSCode complètement
3. Vérifiez les logs : Command Palette → "GitHub Copilot: View Logs"

### Le serveur ne démarre pas

```powershell
# Vérifier que le SDK est installé
npm list @modelcontextprotocol/sdk

# Tester manuellement (après build)
node dist/mcp-server.js
```

Vous devriez voir : `Serveur MCP 'estcequonmetenprod' démarré sur stdio`

## 📚 Ressources

- [Documentation MCP](https://modelcontextprotocol.io)
- [SDK MCP](https://github.com/modelcontextprotocol/typescript-sdk)
- [GitHub Copilot Docs](https://docs.github.com/en/copilot)

## 📄 Licence

MIT
