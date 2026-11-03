import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import ru from './locales/ru';

/**
 * Екі тіл: kk (бастапқы, кодтағы мәтін) және ru.
 * t('Қазақша мәтін', { name }) — ru таңдалса, locales/ru.js ішіндегі аудармасын береді,
 * аудармасы жоқ болса, қазақша мәтіннің өзін қайтарады. Айнымалылар: {name}.
 */
export const LANGS = ['kk', 'ru'];
const LANG_KEY = 'vb_lang';

function detect() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (LANGS.includes(saved)) return saved;
  } catch {
    /* localStorage қолжетімсіз болуы мүмкін */
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'kk';
}

// React-тан тыс модульдер (api.js, utils.js, share.js) да ағымдағы тілді біледі
let current = detect();
export const getLang = () => current;

function fill(text, vars) {
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : text;
}

export function tr(text, vars) {
  const dict = current === 'ru' ? ru : null;
  return fill(dict?.[text] ?? text, vars);
}

/** Айнымалылардың орнына JSX (мысалы <b>…</b>) қою керек болса */
export function trx(text, nodes) {
  const dict = current === 'ru' ? ru : null;
  const src = dict?.[text] ?? text;
  return src.split(/(\{\w+\})/g).map((part, i) => {
    const m = part.match(/^\{(\w+)\}$/);
    return m && m[1] in nodes ? <span key={i}>{nodes[m[1]]}</span> : part;
  });
}

/** Күн/ай атаулары үшін локаль */
export const dateLocale = () => (current === 'ru' ? 'ru-RU' : 'kk-KZ');

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(current);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next) => {
    current = next;
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ештеңе етпейді */
    }
    setLangState(next);
  }, []);

  const value = useMemo(() => ({ lang, setLang, t: tr, tx: trx }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

/** Компонент тіл ауысқанда қайта сызылуы үшін осы hook-ты қолданады */
export const useLang = () => useContext(LangContext);
