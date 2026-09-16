import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

/* Shared form primitives matching the Figma input specs:
   fill #f3f4f5, border #c2c6d6, radius 8, height 48, 20px leading icon. */

type IconType = ComponentType<{ size?: number | string }>;

interface BaseProps {
  label: string;
  name: string;
  icon?: IconType;
  wide?: boolean;
  required?: boolean;
}

interface TextFieldProps extends BaseProps {
  value: string;
  onChange: (name: string, value: string) => void;
  placeholder?: string;
  type?: string;
  /** Hard cap on characters, enforced while typing as well as by the browser. */
  maxLength?: number;
  /**
   * Minimum length. Set explicitly — deriving it from maxLength made
   * variable-length fields like a phone number demand an exact count and
   * silently refuse to submit.
   */
  minLength?: number;
  /** Digits only: strips anything else as it is typed, and shows a numeric keypad. */
  numeric?: boolean;
  min?: string | number;
  max?: string | number;
  /** Shown under the field once the value is present but invalid. */
  hint?: string;
}

export const TextField = ({
  label,
  name,
  icon: Icon,
  wide,
  required,
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength,
  minLength,
  numeric,
  min,
  max,
  hint,
}: TextFieldProps) => {
  const handle = (raw: string) => {
    // Filter as the user types rather than only rejecting on submit, so a
    // pasted value with spaces or dashes is cleaned instead of refused.
    let next = numeric ? raw.replace(/\D/g, '') : raw;
    if (maxLength !== undefined) next = next.slice(0, maxLength);
    onChange(name, next);
  };

  const tooShort = Boolean(hint && value && minLength && value.length < minLength);

  return (
    <div className={`field${wide ? ' field--wide' : ''}`}>
      <label className="field__label" htmlFor={name}>
        {label}
        {required && <span aria-hidden="true" className="field__req">*</span>}
      </label>
      <div className="field__control">
        {Icon && (
          <span className="field__icon" aria-hidden="true">
            <Icon size={20} />
          </span>
        )}
        <input
          id={name}
          name={name}
          type={type}
          inputMode={numeric ? 'numeric' : undefined}
          className={`form-control${Icon ? ' form-control--with-icon' : ''}`}
          placeholder={placeholder}
          value={value}
          required={required}
          maxLength={maxLength}
          minLength={minLength}
          min={min}
          max={max}
          aria-invalid={tooShort || undefined}
          aria-describedby={hint ? `${name}-hint` : undefined}
          onChange={(e) => handle(e.target.value)}
        />
      </div>
      {hint && (
        <span id={`${name}-hint`} className={`field__hint${tooShort ? ' is-error' : ''}`}>
          {hint}
        </span>
      )}
    </div>
  );
};

interface YearFieldProps extends BaseProps {
  value: string;
  onChange: (name: string, value: string) => void;
  placeholder?: string;
  /** Oldest selectable year. */
  min: number;
  /** Newest selectable year. */
  max: number;
}

const YEARS_PER_PAGE = 12;

/**
 * A year-only date picker.
 *
 * The browser has no `<input type="year">`, and `type="date"` would demand a
 * day and a month the alumnus does not have to hand. So this is a normal text
 * input — typeable, and still covered by native `required` validation — with a
 * calendar popover that pages through years twelve at a time.
 */
export const YearField = ({
  label,
  name,
  icon: Icon = CalendarDays,
  wide,
  required,
  value,
  onChange,
  placeholder,
  min,
  max,
}: YearFieldProps) => {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  // Newest first: a recent graduate should not have to page back to find their
  // year.
  const years = useMemo(() => {
    const out: number[] = [];
    for (let y = max; y >= min; y -= 1) out.push(y);
    return out;
  }, [min, max]);

  const pageCount = Math.max(1, Math.ceil(years.length / YEARS_PER_PAGE));
  const pageOf = (year: number) => {
    const i = years.indexOf(year);
    return i < 0 ? 0 : Math.floor(i / YEARS_PER_PAGE);
  };

  const selected = /^\d{4}$/.test(value) ? Number(value) : undefined;
  const [page, setPage] = useState(() => (selected ? pageOf(selected) : 0));
  const shown = years.slice(page * YEARS_PER_PAGE, page * YEARS_PER_PAGE + YEARS_PER_PAGE);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggle = () => {
    // Reopen on the page holding the current answer, not wherever the user last
    // browsed to.
    if (!open && selected) setPage(pageOf(selected));
    setOpen((v) => !v);
  };

  const outOfRange = selected !== undefined && (selected < min || selected > max);
  const hintId = `${name}-hint`;

  return (
    <div className={`field${wide ? ' field--wide' : ''}`}>
      <label className="field__label" htmlFor={name}>
        {label}
        {required && <span aria-hidden="true" className="field__req">*</span>}
      </label>
      <div className="field__control" ref={wrap}>
        <span className="field__icon" aria-hidden="true">
          <Icon size={20} />
        </span>
        <input
          id={name}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          className="form-control form-control--with-icon form-control--with-trailing"
          placeholder={placeholder}
          value={value}
          required={required}
          pattern="\d{4}"
          aria-invalid={outOfRange || undefined}
          aria-describedby={hintId}
          onChange={(e) => onChange(name, e.target.value.replace(/\D/g, '').slice(0, 4))}
          onFocus={() => setOpen(true)}
        />
        <button
          type="button"
          className="field__trailing"
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={`Pilih ${label.toLowerCase()}`}
        >
          <CalendarDays size={18} />
        </button>

        {open && (
          <div className="yearpicker" role="dialog" aria-label={label}>
            <div className="yearpicker__head">
              <button
                type="button"
                className="yearpicker__nav"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
                aria-label="Tahun lebih lama"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="yearpicker__range">
                {shown.length ? `${shown[shown.length - 1]} – ${shown[0]}` : ''}
              </span>
              <button
                type="button"
                className="yearpicker__nav"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                aria-label="Tahun lebih baru"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="yearpicker__grid">
              {shown.map((y) => (
                <button
                  key={y}
                  type="button"
                  className={`yearpicker__year${selected === y ? ' is-on' : ''}`}
                  aria-pressed={selected === y}
                  onClick={() => {
                    onChange(name, String(y));
                    setOpen(false);
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <span id={hintId} className={`field__hint${outOfRange ? ' is-error' : ''}`}>
        {outOfRange ? `Pilih tahun antara ${min} dan ${max}.` : `Tahun ${min}–${max}.`}
      </span>
    </div>
  );
};

interface SelectFieldProps extends BaseProps {
  value: string;
  onChange: (name: string, value: string) => void;
  placeholder: string;
  options: string[];
}

export const SelectField = ({
  label,
  name,
  icon: Icon,
  wide,
  required,
  value,
  onChange,
  placeholder,
  options,
}: SelectFieldProps) => (
  <div className={`field${wide ? ' field--wide' : ''}`}>
    <label className="field__label" htmlFor={name}>
      {label}
      {required && <span aria-hidden="true" className="field__req">*</span>}
    </label>
    <div className="field__control">
      {Icon && (
        <span className="field__icon" aria-hidden="true">
          <Icon size={20} />
        </span>
      )}
      <select
        id={name}
        name={name}
        className={`form-control${Icon ? ' form-control--with-icon' : ''}`}
        value={value}
        required={required}
        onChange={(e) => onChange(name, e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  </div>
);

interface TextareaFieldProps extends BaseProps {
  value: string;
  onChange: (name: string, value: string) => void;
  placeholder?: string;
  rows?: number;
}

export const TextareaField = ({
  label,
  name,
  icon: Icon,
  required,
  value,
  onChange,
  placeholder,
  rows = 4,
}: TextareaFieldProps) => (
  <div className="field field--wide">
    <label className="field__label" htmlFor={name}>
      {label}
    </label>
    <div className="field__control">
      {Icon && (
        <span className="field__icon" aria-hidden="true">
          <Icon size={18} />
        </span>
      )}
      <textarea
        id={name}
        name={name}
        rows={rows}
        className={`form-control${Icon ? ' form-control--with-icon' : ''}`}
        placeholder={placeholder}
        value={value}
        required={required}
        onChange={(e) => onChange(name, e.target.value)}
      />
    </div>
  </div>
);

interface ChoiceGroupProps {
  label: string;
  name: string;
  value: string;
  options: string[];
  onChange: (name: string, value: string) => void;
  /** Grid columns; the design uses three. */
  columns?: number;
}

/** Radio cards — Figma nodes 3435:322, 3442:365. */
export const ChoiceGroup = ({
  label,
  name,
  value,
  options,
  onChange,
  columns = 2,
}: ChoiceGroupProps) => (
  <fieldset className="form-block" style={{ border: 'none' }}>
    <legend className="scale__label" style={{ marginBottom: 12 }}>
      {label}
    </legend>
    <div
      className="choice-grid"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => (
        <label
          key={opt}
          className={`choice-card${value === opt ? ' choice-card--active' : ''}`}
        >
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            onChange={() => onChange(name, opt)}
          />
          <span className="choice-card__dot" aria-hidden="true" />
          {opt}
        </label>
      ))}
    </div>
  </fieldset>
);

interface ScaleProps {
  label: string;
  name: string;
  value: number | undefined;
  onChange: (name: string, value: number) => void;
  lowLabel?: string;
  highLabel?: string;
  caption?: ReactNode;
}

/** 1–5 circular scale — Figma node 3441:217. */
export const Scale = ({
  label,
  name,
  value,
  onChange,
  lowLabel,
  highLabel,
  caption,
}: ScaleProps) => (
  <div className="scale">
    <span className="scale__label" id={`${name}-label`}>
      {label}
    </span>
    <div className="scale__dots" role="radiogroup" aria-labelledby={`${name}-label`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${label}: ${n} dari 5`}
          className={`scale__dot${value !== undefined && n <= value ? ' scale__dot--on' : ''}`}
          onClick={() => onChange(name, n)}
        >
          {n}
        </button>
      ))}
    </div>
    {(lowLabel || highLabel) && (
      <div className="scale__ends">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    )}
    {caption && <span className="scale__caption">{caption}</span>}
  </div>
);

/** Faces for the satisfaction scales, 1 (worst) to 5 (best). */
const FACES = [
  { face: '\u{1F620}', label: 'Sangat tidak puas' },
  { face: '\u{1F641}', label: 'Kurang puas' },
  { face: '\u{1F610}', label: 'Biasa saja' },
  { face: '\u{1F642}', label: 'Puas' },
  { face: '\u{1F929}', label: 'Sangat puas' },
];

interface EmojiScaleProps {
  label: string;
  name: string;
  value: number | undefined;
  onChange: (name: string, value: number) => void;
  caption?: string;
}

/** Satisfaction, expressed as faces rather than numbers. */
export const EmojiScale = ({ label, name, value, onChange, caption }: EmojiScaleProps) => (
  <div className="emoji-scale">
    <span className="scale__label" id={`${name}-label`}>{label}</span>
    <div className="emoji-scale__row" role="radiogroup" aria-labelledby={`${name}-label`}>
      {FACES.map((f, i) => {
        const n = i + 1;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${label}: ${f.label}`}
            title={f.label}
            className={`emoji-scale__btn${value === n ? ' is-on' : ''}`}
            onClick={() => onChange(name, n)}
          >
            <span aria-hidden="true">{f.face}</span>
          </button>
        );
      })}
    </div>
    {caption && <span className="emoji-scale__caption">{caption}</span>}
  </div>
);

interface RateRowProps {
  label: string;
  name: string;
  value: number | undefined;
  onChange: (name: string, value: number) => void;
}

/** Compact 1–5 evaluation row — Figma node 3442:896. */
export const RateRow = ({ label, name, value, onChange }: RateRowProps) => (
  <div className="rate-row">
    <span className="rate-row__label" id={`${name}-label`}>
      {label}
    </span>
    <div className="rate-row__boxes" role="radiogroup" aria-labelledby={`${name}-label`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${label}: ${n} dari 5`}
          className={`rate-box${value === n ? ' rate-box--on' : ''}`}
          onClick={() => onChange(name, n)}
        >
          {n}
        </button>
      ))}
    </div>
  </div>
);
