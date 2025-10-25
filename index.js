const express = require('express');

const app = express();

const weekdayNames = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

// Raison drôles (5 options) pour chaque décision
const reasons = {
  oui: [
    "Parce que les planètes sont alignées et Jenkins a bu son café.",
    "Les licornes ont validé le pipeline ce matin.",
    "Le chat de l'équipe a appuyé sur le bouton 'merge' avec sa patte chanceuse.",
    "Les tests ont ri, donc on y va.",
    "La météo annonce une bonne vague de commits — go go go !"
  ],
  attention: [
    "Parce que vendredi est l'autre jour — vérifiez votre checklist.",
    "Le build a tremblé mais tient encore debout, prudence !",
    "On peut, mais apportez du café et un plan de rollback.",
    "Les étoiles sont en mode 'peut-être' aujourd'hui.",
    "Attention : un bug facétieux traîne dans les logs."
  ],
  impossible: [
    "Seulement si vous portez un chapeau de fête et que vous appelez votre maman.",
    "Parce que la release est sponsorisée par la créativité extrême.",
    "Il faut un mélange de chance et d'un fichier .env mystique.",
    "On ne peut pas l'expliquer — seulement l'admirer et prier.",
    "Si vous survivez à la mise en prod, vous aurez des cookies. Peut-être."
  ],
  non: [
    "C'est le week-end : charge mentale = 0, pas de deploy.",
    "Les serveurs font la sieste, ne les réveillez pas.",
    "Les astres disent 'non' et on n'argumente pas avec les astres.",
    "Les tests jouent à cache-cache, on les retrouvera lundi.",
    "Profitez du week-end — vos pipelines attendront lundi matin."
  ]
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function decisionForDateObj(d) {
  const weekdayIdx = d.getDay(); // Sunday=0 .. Saturday=6
  // convert to Monday=0 .. Sunday=6 like python's weekday()
  const pythonWeekdayIdx = (weekdayIdx + 6) % 7;
  const name = weekdayNames[pythonWeekdayIdx];

  let decisionKey, can;
  if ([0,1,2].includes(pythonWeekdayIdx)) {
    decisionKey = "oui";
    can = true;
  } else if (pythonWeekdayIdx === 3) {
    decisionKey = "attention";
    can = false;
  } else if (pythonWeekdayIdx === 4) {
    decisionKey = "impossible";
    can = false;
  } else {
    decisionKey = "non";
    can = false;
  }

  const reason = pickRandom(reasons[decisionKey]);

  return {
    date: d.toISOString().slice(0,10),
    weekday: name,
    decision: decisionKey,
    can_deploy: can,
    reason,
    mcp_version: "1.0"
  };
}

app.get('/', (req, res) => {
  res.json({ message: "Bienvenue — utilisez /status?date=YYYY-MM-DD pour vérifier si vous pouvez mettre en prod aujourd'hui."});
});

app.get('/status', (req, res) => {
  // Le serveur n'accepte pas de date en entrée : on utilise uniquement la date du jour.
  const d = new Date();
  const result = decisionForDateObj(d);
  res.json(result);
});

module.exports = { app, decisionForDateObj, reasons };

if (require.main === module) {
  const port = process.env.PORT || 8000;
  app.listen(port, () => console.log(`MCP Node server listening on http://127.0.0.1:${port}`));
}
