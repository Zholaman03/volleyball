import { useState } from 'react';
import { registerToGame } from '../api';
import { normalizePhone } from '../phone';
import { copyText } from '../share';
import { PHONE_PREFIX, formatPhoneInput } from '../utils';
import { formatPrice } from './GameCard.jsx';

const PHONE_ERROR = 'WhatsApp нөмірін дұрыс енгізіңіз, мысалы: +7 701 123 45 67.';

function isGenderFull(game, gender) {
  const slot = game[gender];
  return slot.limit !== null && slot.registered >= slot.limit;
}

export default function RegisterModal({ game, onClose, onDone }) {
  const defaultGender = ['male', 'female'].find((g) => !isGenderFull(game, g)) ?? '';

  const [form, setForm] = useState({ name: '', phone: PHONE_PREFIX, gender: defaultGender });
  const [phoneError, setPhoneError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [payment, setPayment] = useState(''); // ұйымдастырушының төлем мәліметі (тіркелгеннен кейін келеді)
  const [copied, setCopied] = useState(false);

  async function copyPayment() {
    if (await copyText(payment)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
      const res = await registerToGame(game.id, { ...form, phone });
      setPayment(res.payment_info ?? '');
      setSuccess(true);
      onDone();
    } catch (err) {
      setError(err.message);
      if (err.status === 409) onDone(); // орын санын жаңарту
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
            <h2>Тіркелдіңіз!</h2>
            <p>
              {game.start_time}–{game.end_time}, {game.venue_name}. Төлем: {formatPrice(game.price)}.
            </p>
            {payment ? (
              <>
                <div className="pay">
                  <span>Төлем мәліметі</span>
                  <strong>{payment}</strong>
                  <button type="button" className="btn btn--ghost" onClick={copyPayment}>
                    {copied ? 'Көшірілді ✓' : 'Көшіру'}
                  </button>
                </div>
                <p>
                  Төлегеннен кейін чекті ұйымдастырушыға (<b>{game.organizer_name}</b>) WhatsApp арқылы жіберіңіз.
                </p>
              </>
            ) : (
              <p>
                Ұйымдастырушы <b>{game.organizer_name}</b> төлем туралы сізбен WhatsApp арқылы байланысады.
              </p>
            )}
            <button className="btn" onClick={onClose}>
              Жақсы
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h2>Ойынға тіркелу</h2>
            <p className="modal__sub">
              {game.format_label} · {game.start_time}–{game.end_time} · {game.venue_name}
            </p>

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
                  const full = isGenderFull(game, value);
                  return (
                    <label key={value} className={`seg__item ${full ? 'seg__item--off' : ''}`}>
                      <input
                        type="radio"
                        name="gender"
                        value={value}
                        checked={form.gender === value}
                        disabled={full}
                        onChange={set('gender')}
                      />
                      <span>{full ? `${label} (толды)` : label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {error && <p className="form-error">{error}</p>}

            <button className="btn btn--wide" disabled={submitting || !form.gender}>
              {submitting ? 'Жіберілуде…' : `Тіркелу · ${formatPrice(game.price)}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
