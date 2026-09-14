import type { ComponentType, ReactNode } from 'react';

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
}

/** Radio cards — Figma nodes 3435:322, 3442:365. */
export const ChoiceGroup = ({ label, name, value, options, onChange }: ChoiceGroupProps) => (
  <fieldset className="form-block" style={{ border: 'none' }}>
    <legend className="scale__label" style={{ marginBottom: 12 }}>
      {label}
    </legend>
    <div className="choice-grid">
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
