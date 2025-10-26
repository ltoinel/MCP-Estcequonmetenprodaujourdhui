import fs from 'fs';
import path from 'path';

interface I18nTranslation {
  weekdays: string[];
  labels: Record<string, string>;
  message_template?: string;
}

interface DecisionResult {
  date: string;
  weekday: string;
  decision: string;
  can_deploy: boolean;
  reason: string;
  emoji: string;
  message: string;
}

const i18n = require('../../config/i18n.json');

function pickRandom<T>(arr: T[]): T | undefined {
  return arr[Math.floor(Math.random() * arr.length)];
}

function loadReasonsForLocale(locale?: string): Record<string, string[]> {
  const code = locale ? locale.toLowerCase().slice(0, 2) : null;
  if (code) {
    const filePath = path.join(process.cwd(), 'config', 'reasons', `${code}.json`);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  }

  const frPath = path.join(process.cwd(), 'config', 'reasons', 'fr.json');
  if (fs.existsSync(frPath)) {
    return JSON.parse(fs.readFileSync(frPath, 'utf8'));
  }

  return {};
}

function getI18nForLocale(locale?: string): I18nTranslation {
  const code = locale ? locale.toLowerCase().slice(0, 2) : i18n.defaultLocale || 'fr';
  return i18n.translations[code] || i18n.translations[i18n.defaultLocale] || i18n.translations['fr'];
}

export function canDeployToday(locale?: string): DecisionResult {
  return getDeploymentDecision(new Date(), locale);
}

export function getDeploymentDecision(d: Date, locale?: string): DecisionResult {
  const weekdayIdx = d.getUTCDay(); // Sunday=0 .. Saturday=6
  const pythonWeekdayIdx = (weekdayIdx + 6) % 7; // Monday=0 .. Sunday=6

  let decisionKey: string;
  let can = false;
  let emoji = '🛑';

  if ([0, 1, 2].includes(pythonWeekdayIdx)) {
    decisionKey = 'yes';
    can = true;
    emoji = '✅';
  } else if (pythonWeekdayIdx === 3) {
    decisionKey = 'caution';
    can = false;
    emoji = '⚠️';
  } else if (pythonWeekdayIdx === 4) {
    decisionKey = 'blocked';
    can = false;
    emoji = '🚫';
  } else {
    decisionKey = 'no';
    can = false;
    emoji = '🛑';
  }

  const reasons = loadReasonsForLocale(locale);
  const reasonArr = reasons[decisionKey] || [];
  const reason = pickRandom(reasonArr) || '';

  const i18nForLocale: I18nTranslation = getI18nForLocale(locale);
  const weekdayName = i18nForLocale.weekdays ? i18nForLocale.weekdays[pythonWeekdayIdx] : ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'][pythonWeekdayIdx];
  const label = (i18nForLocale.labels && i18nForLocale.labels[decisionKey]) ? i18nForLocale.labels[decisionKey] : decisionKey.toUpperCase();
  const template = i18nForLocale.message_template || '{emoji} {label} - {reason}';

  const message = template.replace('{emoji}', emoji).replace('{label}', label).replace('{reason}', reason);

  return {
    date: d.toISOString().slice(0, 10),
    weekday: weekdayName,
    decision: decisionKey,
    can_deploy: can,
    reason,
    emoji,
    message
  };
}

export function getDeploymentReasons(locale?: string): Record<string, string[]> {
  return loadReasonsForLocale(locale);
}
