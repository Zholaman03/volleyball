import { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerToGame } from '../api';
import { normalizePhone } from '../phone';
import { useLang } from '../i18n.jsx';
import { copyText } from '../share';
import { PHONE_PREFIX, deadlineText, formatPhoneInput } from '../utils';
import { formatPrice } from './GameCard.jsx';

const PHONE_ERROR = 'WhatsApp нөмірін дұрыс енгізіңіз, мысалы: +7 701 123 45 67.'; // t() арқылы көрсетіледі

// Бұл жыныс форматқа мүлде кірмейді (мысалы, қыздар форматында ұлдар): таңдауға болмайды
export function isGenderBlocked(game, gender) {
  return game[gender].limit === 0;
}

// Орын жоқ: жалпы толған немесе осы жыныс лимиті бітті. Мұндайда күту тізіміне жазылуға болады
export function isGenderFull(game, gender) {
  const slot = game[gender];
  return game.is_full || (slot.limit !== null && slot.registered >= slot.limit);
}

export default function RegisterModal({ game, onClose, onDone }) {
  const { t, tx } = useLang();
  const genders = ['male', 'female'];
  const defaultGender =
    genders.find((g) => !isGenderBlocked(game, g) && !isGenderFull(game, g)) ??
    genders.find((g) => !isGenderBlocked(game, g)) ??
    '';

  const [form, setForm] = useState({ name: '', phone: PHONE_PREFIX, gender: defaultGender });
  const [phoneError, setPhoneError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState(null); // сервердің жауабы: status, cancel_token, төлем мәліметі…
  const [copied, setCopied] = useState(''); // 'pay' | 'link' | ''

  const onWaitlist = result?.status === 'waitlist';
  const payment = result?.payment_info ?? ''; // ұйымдастырушының төлем мәліметі (тіркелгеннен кейін келеді)
  const deadline = result?.payment_deadline ?? ''; // "2026-11-05 20:00": төлем мерзімі (мерзімсіз/тегін болса бос)
  const cancelPath = result ? `/cancel/${result.cancel_token}` : '';

  // Таңдалған жынысқа орын жоқ болса, форма күту тізіміне жазуға ауысады
  const waitlistMode = form.gender !== '' && isGenderFull(game, form.gender);

  async function copy(kind, text) {
    if (await copyText(text)) {
      setCopied(kind);
      setTimeout(() => setCopied(''), 2000);
    }
  }

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function onPhoneChange(e) {
    setForm((f) => ({ ...f, phone: formatPhoneInput(e.target.value) }));
    setPhoneError('');
  }

  // Өрістен шыққанда қате болса дереу көрсетеміз (әлі ештеңе жазылмаған болса — үндемейміз)
  function onPhoneBlur() {
    const typed = form.phone.trim() !== PHONE_PREFIX.trim();
    if (typed && normalizePhone(form.phone) === null) setPhoneError(t(PHONE_ERROR));
  }

  async function submit(e) {
    e.preventDefault();

    const phone = normalizePhone(form.phone);
    if (phone === null) {
      setPhoneError(t(PHONE_ERROR));
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await registerToGame(game.id, { ...form, phone, waitlist: waitlistMode });
      setResult(res);
      setSuccess(true);
      onDone();
    } catch (err) {
      setError(err.message);
      if (err.status === 409) onDone(); // орын санын жаңарту (толып қалса, батырма күту тізіміне ауысады)
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal__close" onClick={onClose} aria-label={t('Жабу')}>
          ×
        </button>

        {success ? (
          <div className="success">
            <div className="success__icon">✓</div>
            <h2>{onWaitlist ? t('Күту тізіміндесіз') : t('Тіркелдіңіз!')}</h2>
            <p>
              {game.start_time}–{game.end_time}, {game.venue_name}.
              {!onWaitlist &&
                ` ${game.is_free ? t('Ойын тегін.') : t('Төлем: {price}.', { price: formatPrice(game.price) })}`}
            </p>

            {onWaitlist ? (
              <p>
                {tx('Сіздің орныңыз: {pos}. Орын босаса, ұйымдастырушы {name} сізбен WhatsApp арқылы байланысады.', {
                  pos: <b>№{result.waitlist_position}</b>,
                  name: <b>{game.organizer_name}</b>,
                })}
              </p>
            ) : game.is_free ? (
              <p>
                {tx('Ұйымдастырушы {name} қажет болса сізбен WhatsApp арқылы байланысады.', {
                  name: <b>{game.organizer_name}</b>,
                })}
              </p>
            ) : (
              <>
                {payment && (
                  <div className="pay">
                    <span>{t('Төлем мәліметі')}</span>
                    <strong>{payment}</strong>
                    <button type="button" className="btn btn--ghost" onClick={() => copy('pay', payment)}>
                      {copied === 'pay' ? t('Көшірілді ✓') : t('Көшіру')}
                    </button>
                  </div>
                )}
                {deadline && (
                  <p>
                    {tx('Төлемді {time}-ге дейін жасаңыз.', {
                      time: <b>{deadlineText(game.play_date, deadline)}</b>,
                    })}
                  </p>
                )}
                {payment ? (
                  <p>
                    {tx('Төлегеннен кейін чекті ұйымдастырушыға ({name}) WhatsApp арқылы жіберіңіз.', {
                      name: <b>{game.organizer_name}</b>,
                    })}
                  </p>
                ) : (
                  <p>
                    {tx('Ұйымдастырушы {name} төлем туралы сізбен WhatsApp арқылы байланысады.', {
                      name: <b>{game.organizer_name}</b>,
                    })}
                  </p>
                )}
              </>
            )}

            <div className="pay">
              <span>{t('Бас тарту сілтемесі')}</span>
              <Link to={cancelPath} className="link" onClick={onClose}>
                {window.location.origin}
                {cancelPath}
              </Link>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => copy('link', `${window.location.origin}${cancelPath}`)}
              >
                {copied === 'link' ? t('Көшірілді ✓') : t('Сілтемені көшіру')}
              </button>
            </div>
            <p className="hint">
              {t('Келе алмасаңыз, осы сілтеме арқылы бас тартыңыз. Сақтап қойыңыз, қайта көрсетілмейді.')}
              {!onWaitlist &&
                ` ${t('Бас тартуға болады: {time}-ге дейін.', { time: deadlineText(game.play_date, result.cancel_deadline) })}`}
            </p>

            <button className="btn" onClick={onClose}>
              {t('Жақсы')}
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h2>{waitlistMode ? t('Күту тізіміне жазылу') : t('Ойынға тіркелу')}</h2>
            <p className="modal__sub">
              {game.format_label} · {game.start_time}–{game.end_time} · {game.venue_name}
            </p>

            {waitlistMode && (
              <p className="hint hint--block">
                {t('Орын қалмады. Күту тізіміне жазылсаңыз, орын босағанда ұйымдастырушы сізбен WhatsApp-та байланысады.')}
              </p>
            )}

            <label className="field">
              <span>{t('Аты-жөні')}</span>
              <input value={form.name} onChange={set('name')} placeholder={t('Мысалы, Айдос')} required maxLength={100} />
            </label>

            <label className={`field ${phoneError ? 'field--error' : ''}`}>
              <span>{t('WhatsApp нөмірі')}</span>
              <input
                type="tel"
                value={form.phone}
                onChange={onPhoneChange}
                onBlur={onPhoneBlur}
                placeholder="+7 701 123 45 67"
                inputMode="tel"
                autoComplete="tel"
                required
                aria-invalid={Boolean(phoneError)}
              />
              {phoneError ? (
                <small className="field__error">{phoneError}</small>
              ) : (
                <small className="hint">{t('Ұйымдастырушы сізбен осы нөмір арқылы WhatsApp-та байланысады')}</small>
              )}
            </label>

            <fieldset className="field">
              <span>{t('Жынысы')}</span>
              <div className="seg">
                {[
                  ['male', t('Ұл')],
                  ['female', t('Қыз')],
                ].map(([value, label]) => {
                  const blocked = isGenderBlocked(game, value);
                  const full = isGenderFull(game, value);
                  return (
                    <label key={value} className={`seg__item ${blocked ? 'seg__item--off' : ''}`}>
                      <input
                        type="radio"
                        name="gender"
                        value={value}
                        checked={form.gender === value}
                        disabled={blocked}
                        onChange={set('gender')}
                      />
                      <span>{blocked ? `${label} (${t('толды')})` : full ? `${label} (${t('күту тізімі')})` : label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {error && <p className="form-error">{error}</p>}

            <button className="btn btn--wide" disabled={submitting || !form.gender}>
              {submitting
                ? t('Жіберілуде…')
                : waitlistMode
                  ? t('Күту тізіміне жазылу')
                  : game.is_free
                    ? t('Тіркелу')
                    : `${t('Тіркелу')} · ${formatPrice(game.price)}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
