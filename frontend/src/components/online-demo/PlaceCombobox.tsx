import { useEffect, useId, useState } from "react";
import type { KeyboardEvent } from "react";
import type { PlaceCandidate } from "../../services/routeQueryTypes";
import styles from "./OnlineQueryDemo.module.css";

export type PlaceFieldName = "origin" | "destination";

export interface PlaceFieldState {
  input: string;
  selected: PlaceCandidate | null;
  candidates: PlaceCandidate[];
  loading: boolean;
  touched: boolean;
  error: string | null;
}

export function PlaceCombobox({
  field,
  label,
  state,
  placeholder,
  loadingText,
  emptyText,
  onInput,
  onSelect,
}: {
  field: PlaceFieldName;
  label: string;
  state: PlaceFieldState;
  placeholder: string;
  loadingText: string;
  emptyText: string;
  onInput: (field: PlaceFieldName, value: string) => void;
  onSelect: (field: PlaceFieldName, place: PlaceCandidate) => void;
}) {
  const listboxId = useId();
  const errorId = useId();
  const [activeIndex, setActiveIndex] = useState(-1);
  const expanded = state.input.trim().length > 0 && (!state.selected || state.selected.name !== state.input);

  useEffect(() => setActiveIndex(-1), [state.candidates]);

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!expanded || state.candidates.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % state.candidates.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + state.candidates.length) % state.candidates.length);
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      onSelect(field, state.candidates[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setActiveIndex(-1);
    }
  }

  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        aria-controls={listboxId}
        aria-describedby={state.error ? errorId : undefined}
        aria-expanded={expanded}
        aria-invalid={Boolean(state.error)}
        aria-label={label}
        autoComplete="off"
        onChange={(event) => onInput(field, event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        role="combobox"
        value={state.input}
      />
      {state.error ? <em className={styles.fieldError} id={errorId}>{state.error}</em> : null}
      {expanded ? (
        <div className={styles.dropdown} data-testid={`${field}-place-dropdown`} id={listboxId} role="listbox">
          {state.loading ? <div className={styles.dropdownState}>{loadingText}</div> : null}
          {!state.loading && !state.error && state.candidates.length === 0 ? <div className={styles.dropdownState}>{emptyText}</div> : null}
          {!state.loading && !state.error ? state.candidates.map((place, index) => (
            <button
              aria-selected={index === activeIndex}
              id={`${listboxId}-${index}`}
              key={place.placeToken}
              onClick={() => onSelect(field, place)}
              onMouseEnter={() => setActiveIndex(index)}
              role="option"
              type="button"
            >
              {place.name}
            </button>
          )) : null}
        </div>
      ) : null}
    </label>
  );
}
