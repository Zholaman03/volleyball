import { LANGS, useLang } from '../i18n.jsx';

const LABEL = { kk: 'ҚАЗ', ru: 'РУС' };

/** Тіл ауыстырғыш: ҚАЗ | РУС */
export default function LangSwitch() {
  const { lang, setLang } = useLang();

  return (
    <div className="langs" role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          className={`langs__item ${l === lang ? 'langs__item--active' : ''}`}
          aria-pressed={l === lang}
          onClick={() => setLang(l)}
        >
          {LABEL[l]}
        </button>
      ))}
    </div>
  );
}
