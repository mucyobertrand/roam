import { useState } from "react";

type Values = Record<string, string>;
type Validators<T extends Values> = { [K in keyof T]?: (value: T[K], values: T) => string | undefined };
type Errors<T extends Values> = Partial<Record<keyof T, string>>;

/**
 * Minimal form state: values, per-field errors, validate-on-submit, then live
 * re-validation of any field that has been checked once (so errors clear as you fix them).
 */
export function useForm<T extends Values>(initial: T, validators: Validators<T>) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Errors<T>>({});
  const [submitted, setSubmitted] = useState(false);

  const check = (key: keyof T, vals: T) => validators[key]?.(vals[key], vals);

  const setValue = (key: keyof T, value: string) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (submitted || errors[key]) setErrors((e) => ({ ...e, [key]: check(key, next) }));
  };

  /** Validates every field, shows the errors, and returns whether the form is valid. */
  const validate = () => {
    setSubmitted(true);
    const next: Errors<T> = {};
    for (const key of Object.keys(values) as (keyof T)[]) next[key] = check(key, values);
    setErrors(next);
    return Object.values(next).every((e) => !e);
  };

  const setError = (key: keyof T, message: string) => setErrors((e) => ({ ...e, [key]: message }));

  return { values, errors, setValue, setError, validate };
}
