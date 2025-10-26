/**
 * Deployment Decision Logic
 * 
 * Core business logic for determining deployment feasibility based on weekday.
 * Supports internationalization through locale-based reason files and translations.
 * 
 * Decision rules:
 * - Monday/Tuesday/Wednesday → yes (✅)
 * - Thursday → caution (⚠️)
 * - Friday → blocked (🚫)
 * - Saturday/Sunday → no (🛑)
 */

import fs from 'fs';
import path from 'path';

/**
 * Localized translation data including weekday names, decision labels, and message templates.
 */
interface I18nTranslation {
  weekdays: string[];
  labels: Record<string, string>;
  message_template?: string;
}

/**
 * Complete deployment decision result with all context.
 */
interface DecisionResult {
  date: string;
  weekday: string;
  decision: string;
  can_deploy: boolean;
  reason: string;
  emoji: string;
  message: string;
}

import i18n from '../../config/i18n.json';

/**
 * Returns a random element from an array.
 * 
 * @param arr - Array to pick from
 * @returns Random element or undefined if array is empty
 */
function pickRandom<T>(arr: T[]): T | undefined {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Loads deployment reasons for the specified locale.
 * Falls back to French (fr.json) if locale file is not found.
 * 
 * @param locale - Language code (e.g., 'en', 'fr', 'de')
 * @returns Map of decision keys to arrays of reason strings
 */
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

/**
 * Retrieves i18n translation data for the specified locale.
 * Falls back to default locale (French) if not found.
 * 
 * @param locale - Language code (e.g., 'en', 'fr', 'de')
 * @returns Translation object with weekdays, labels, and templates
 */
function getI18nForLocale(locale?: string): I18nTranslation {
  const code = locale ? locale.toLowerCase().slice(0, 2) : i18n.defaultLocale || 'fr';
  return i18n.translations[code] || i18n.translations[i18n.defaultLocale] || i18n.translations['fr'];
}

/**
 * Checks if deployment is feasible today based on the current date.
 * 
 * @param locale - Optional language code for localized reasons
 * @returns Complete deployment decision with reason and message
 */
export function canDeployToday(locale?: string): DecisionResult {
  return getDeploymentDecision(new Date(), locale);
}

/**
 * Determines deployment feasibility for a specific date based on weekday rules.
 * 
 * Business rules:
 * - Monday/Tuesday/Wednesday (0-2): yes - safe to deploy ✅
 * - Thursday (3): caution - risky, avoid if possible ⚠️
 * - Friday (4): blocked - deployments highly discouraged 🚫
 * - Saturday/Sunday (5-6): no - weekend, no deployments 🛑
 * 
 * @param d - Date to evaluate (uses UTC weekday)
 * @param locale - Optional language code for localized reasons and labels
 * @returns Complete decision result with reason, emoji, and formatted message
 */
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

/**
 * Retrieves all deployment reasons for a specific locale.
 * 
 * Returns a map of decision keys (yes/caution/blocked/no) to arrays of humorous
 * reason strings that explain why deployment is allowed or discouraged.
 * 
 * @param locale - Optional language code (e.g., 'en', 'fr', 'de')
 * @returns Map of decision keys to reason arrays
 */
export function getDeploymentReasons(locale?: string): Record<string, string[]> {
  return loadReasonsForLocale(locale);
}
