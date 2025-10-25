# MCP Est-ce qu'on met en production aujourd'hui ? (Node.js)

Serveur minimal inspiré de https://www.estcequonmetenprodaujourdhui.info/.

Règles appliquées:
- Lundi / Mardi / Mercredi → oui
- Jeudi → faire attention
- Vendredi → il faut être fou
- Samedi / Dimanche → non

Fichiers clés:
- `index.js` : serveur Express
- `package.json` : dépendances et scripts
- `tests/status.test.js` : tests jest + supertest


Installation et exécution (PowerShell sous Windows) :

```powershell
# Installer les dépendances
npm install

# Lancer les tests
npm test

# Lancer le serveur
npm start

# Puis accéder à http://127.0.0.1:8000/status
```

L'API retourne un objet JSON avec les champs `date`, `weekday`, `decision`, `can_deploy`, `reason`, `mcp_version`.


Le serveur expose les endpoints :
- `GET /` : message d'accueil
- `GET /status` : décision pour la date du jour (le serveur n'accepte pas de paramètre `date` en entrée)

Si vous voulez que je supprime aussi les fichiers liés au support Python (venv, .pyc, etc.), dites-le et je les enlèverai.

Comportement des raisons
------------------------

Pour chaque `decision` ("oui", "attention", "fou", "non"), l'API renvoie désormais une raison drôle choisie aléatoirement parmi 5 options possibles. Le champ `reason` contient cette phrase humoristique.

Si vous souhaitez que les raisons soient retournées également dans un champ séparé (par ex. `reason_key` + `reason_text`) ou que la sélection soit déterministe (pour les tests), dites-le et j'adapte le code.