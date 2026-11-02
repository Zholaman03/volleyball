import { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerToGame } from '../api';
import { normalizePhone } from '../phone';
import { copyText } from '../share';
import { PHONE_PREFIX, deadlineText, formatPhoneInput } from '../utils';
import { formatPrice } from './GameCard.jsx';

const PHONE_ERROR = 'WhatsApp нөмірін дұрыс енгізіңіз, мысалы: +7 701 123 45 67.';

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
    if (typed && normalizePhone(form.phone) === null) setPhoneError(PHONE_ERROR);
  }

  async function submit(e) {
    e.preventDefault();

    const phone = normalizePhone(form.phone);
    if (phone === null) {
      setPhoneError(PHONE_ERROR);
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
        <button className="modal__close" onClick={onClose} aria-label="Жабу">
          ×
        </button>

        {success ? (
          <div className="success">
            <div className="success__icon">✓</div>
            <h2>{onWaitlist ? 'Күту тізіміндесіз' : 'Тіркелдіңіз!'}</h2>
            <p>
              {game.start_time}–{game.end_time}, {game.venue_name}.
              {!onWaitlist && ` ${game.is_free ? 'Ойын тегін.' : `Төлем: ${formatPrice(game.price)}.`}`}
            </p>

            {onWaitlist ? (
              <p>
                Сіздің орныңыз: <b>№{result.waitlist_position}</b>. Орын босаса, ұйымдастырушы{' '}
                <b>{game.organizer_name}</b> сізбен WhatsApp арқылы байланысады.
              </p>
            ) : game.is_free ? (
              <p>
                Ұйымдастырушы <b>{game.organizer_name}</b> қажет болса сізбен WhatsApp арқылы байланысады.
              </p>
            ) : (
              <>
                {payment && (
                  <div className="pay">
                    <span>Төлем мәліметі</span>
                    <strong>{payment}</strong>
                    <button type="button" className="btn btn--ghost" onClick={() => copy('pay', payment)}>
                      {copied === 'pay' ? 'Көшірілді ✓' : 'Көшіру'}
                    </button>
                  </div>
                )}
                {deadline && (
                  <p>
                    Төлемді <b>{deadlineText(game.play_date, deadline)}</b>-ге дейін жасаңыз.
                  </p>
                )}
                {payment ? (
                  <p>
                    Төлегеннен кейін чекті ұйымдастырушыға (<b>{game.organizer_name}</b>) WhatsApp арқылы жіберіңіз.
                  </p>
                ) : (
                  <p>
                    Ұйымдастырушы <b>{game.organizer_name}</b> төлем туралы сізбен WhatsApp арқылы байланысады.
                  </p>
                )}
              </>
            )}

            <div className="pay">
              <span>Бас тарту сілтемесі</span>
              <Link to={cancelPath} className="link" onClick={onClose}>
                {window.location.origin}
                {cancelPath}
              </Link>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => copy('link', `${window.location.origin}${cancelPath}`)}
              >
                {copied === 'link' ? 'Көшірілді ✓' : 'Сілтемені көшіру'}
              </button>
            </div>
            <p className="hint">
              Келе алмасаңыз, осы сілтеме арқылы бас тартыңыз. Сақтап қойыңыз, қайта көрсетілмейді.
              {!onWaitlist &&
                ` Бас тартуға болады: ${deadlineText(game.play_date, result.cancel_deadline)}-ге дейін.`}
            </p>

            <button className="btn" onClick={onClose}>
              Жақсы
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h2>{waitlistMode ? 'Күту тізіміне жазылу' : 'Ойынға тіркелу'}</h2>
            <p className="modal__sub">
              {game.format_label} · {game.start_time}–{game.end_time} · {game.venue_name}
            </p>

            {waitlistMode && (
              <p className="hint hint--block">
                Орын қалмады. Күту тізіміне жазылсаңыз, орын босағанда ұйымдастырушы сізбен WhatsApp-та байланысады.
              </p>
            )}

            <label className="field">
              <span>Аты-жөні</span>
              <input value={form.name} onChange={set('name')} placeholder="Мысалы, Айдос" required maxLength={100} />
            </label>

            <label className={`field ${phoneError ? 'field--error' : ''}`}>
              <span>WhatsApp нөмірі</span>
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
                <small className="hint">Ұйымдастырушы сізбен осы нөмір арқылы WhatsApp-та байланысады</small>
              )}
            </label>

            <fieldset className="field">
              <span>Жынысы</span>
              <div className="seg">
                {[
                  ['male', 'Ұл'],
                  ['female', 'Қыз'],
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
                      <span>{blocked ? `${label} (толды)` : full ? `${label} (күту тізімі)` : label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {error && <p className="form-error">{error}</p>}

            <button className="btn btn--wide" disabled={submitting || !form.gender}>
              {submitting
                ? 'Жіберілуде…'
                : waitlistMode
                  ? 'Күту тізіміне жазылу'
                  : game.is_free
                    ? 'Тіркелу'
                    : `Тіркелу · ${formatPrice(game.price)}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
