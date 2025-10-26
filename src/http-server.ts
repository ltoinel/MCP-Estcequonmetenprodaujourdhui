import express from 'express';
import { getDeploymentDecision, getDeploymentReasons } from './lib/deployment-logic';

const app = express();
const port = process.env.PORT || 3000;

app.get('/status', (req, res) => {
  const lang = (req.query.lang as string) || req.headers['accept-language']?.toString().split(',')[0];
  const dateStr = req.query.date as string | undefined;
  const d = dateStr ? new Date(dateStr + 'T00:00:00Z') : new Date();
  const result = getDeploymentDecision(d, lang);
  res.json(result);
});

app.get('/reasons', (req, res) => {
  const lang = (req.query.lang as string) || req.headers['accept-language']?.toString().split(',')[0];
  const reasons = getDeploymentReasons(lang);
  res.json(reasons);
});

app.listen(port, () => {
  console.log(`HTTP wrapper listening on http://localhost:${port}`);
});
