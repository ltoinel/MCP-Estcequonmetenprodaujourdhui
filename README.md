# MCP Server - Est-ce que l'on met en production aujourd'hui ?

Serveur MCP (Model Context Protocol) compatible GitHub Copilot, inspiré de https://www.estcequelonmetenprodaujourdhuiaujourdhui.info/.

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

## 💻 Utilisation

Le projet fournit **trois façons** d'exposer les mêmes fonctionnalités :

### 1. Serveur MCP officiel (recommandé pour VS Code)

Utilise le SDK officiel `@modelcontextprotocol/sdk` pour une conformité totale au protocole MCP.

```powershell
npm start
```

**✅ Utilisez ce serveur pour :**
- Intégration VS Code MCP (`.vscode/mcp.json`)
- GitHub Copilot et clients MCP officiels
- Déploiements production nécessitant le protocole MCP standard

### 2. Serveur stdio léger (pour scripts et tests)

Version simplifiée sans dépendance au SDK, protocole JSON-RPC line-delimited.

```powershell
npm run start-stdio
```

**✅ Utilisez ce serveur pour :**
- Scripts shell/pipes (`printf | npm run start-stdio`)
- Tests simples sans overhead du SDK
- Environnements avec contraintes de dépendances

**Protocole** (line-delimited JSON) :
```json
{"id":1,"method":"check_deployment_status","params":{"date":"2025-10-31","lang":"en"}}
```

### 3. Serveur HTTP (wrapper REST)

Expose les mêmes outils via API REST pour tests HTTP ou intégrations web.

```powershell
npm run start-http
```

**Endpoints** :
- `POST /mcp` — Format MCP : `{ id, method, params }` → `{ id, result }`
- `GET /status?lang=fr&date=2025-10-31` — Décision directe
- `GET /reasons?lang=fr` — Liste des raisons

---

## 🌍 Langues / Internationalisation

Tous les serveurs supportent la localisation via le paramètre `lang` :

**Serveur MCP/stdio** : `{ "lang": "en" }` dans params
**Serveur HTTP** : `?lang=fr` ou en-tête `Accept-Language: en,fr;q=0.8`

Fichiers de traductions : `config/reasons/<code>.json`  
Fallback par défaut : `config/reasons/fr.json`

---

## 🔧 Exemples d'utilisation

### Serveur MCP stdio - Tests rapides (WSL/bash)
### Serveur MCP stdio - Tests rapides (WSL/bash)

```bash
# Demande unique
printf '{"id":1,"method":"check_deployment_status","params":{"date":"2025-10-26","lang":"fr"}}\n' | npm run start-stdio

# Récupérer les raisons
printf '{"id":2,"method":"get_deployment_reasons","params":{"lang":"fr"}}\n' | npm run start-stdio
```

### Intégration VS Code (`.vscode/mcp.json`)

**Pour le serveur MCP officiel (recommandé)** :
```jsonc
{
  "servers": {
    "estcequelonmetenprodaujourdhui": {
      "type": "stdio",
      "command": "npm",
      "args": ["start"]  // Utilise mcp-server.ts (SDK officiel)
    }
  }
}
```

**Pour le serveur stdio léger** :
```jsonc
{
  "servers": {
    "estcequelonmetenprodaujourdhui": {
      "type": "stdio",
      "command": "npm",
      "args": ["run", "start-stdio"]  // Utilise mcp-stdio-server.ts
    }
  }
}
```

**Note** : Les deux fonctionnent, mais `npm start` (serveur MCP officiel) est recommandé pour VS Code.
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
│   ├── mcp-http-server.ts         # Wrapper HTTP (build → dist/http-server.js)
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

Vous devriez voir : `Serveur MCP 'estcequelonmetenprodaujourdhui' démarré sur stdio`

## 📚 Ressources

- [Documentation MCP](https://modelcontextprotocol.io)
- [SDK MCP](https://github.com/modelcontextprotocol/typescript-sdk)
- [GitHub Copilot Docs](https://docs.github.com/en/copilot)

## 📄 Licence

MIT
