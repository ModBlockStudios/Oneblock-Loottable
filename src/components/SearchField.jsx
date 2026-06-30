import { useEffect, useMemo, useRef, useState } from 'react';
import { TAG_ORDER, tagLabel } from '../lib/tags.js';
import { CATEGORY_ORDER, categoryLabel } from '../lib/categories.js';

const norm = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/*
 * Champ de recherche avec aide à l'écriture : dès qu'on tape « # » (tag) ou
 * « ! » (catégorie), une liste de suggestions filtrées apparaît (clic ou
 * clavier ↑/↓ + Entrée). Réutilisé par la Table et le picker de la Lootable.
 */
export default function SearchField({ value, onChange, placeholder, items }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const closeTimer = useRef(null);

  // Comptes globaux par tag / catégorie (informatif dans les suggestions).
  const counts = useMemo(() => {
    const tags = {};
    const cats = {};
    for (const it of items) {
      tags[it.tag] = (tags[it.tag] || 0) + 1;
      cats[it.category] = (cats[it.category] || 0) + 1;
    }
    return { tags, cats };
  }, [items]);

  const raw = value.replace(/^\s+/, '');
  const prefix = raw[0] === '#' || raw[0] === '!' ? raw[0] : null;

  const suggestions = useMemo(() => {
    if (!prefix) return [];
    const typed = norm(raw.slice(1).trim());
    const base =
      prefix === '#'
        ? TAG_ORDER.map((k) => ({ key: k, label: tagLabel(k), count: counts.tags[k] || 0 }))
        : CATEGORY_ORDER.map((k) => ({ key: k, label: categoryLabel(k), count: counts.cats[k] || 0 }));
    return base
      .filter((s) => s.count > 0)
      .filter((s) => !typed || norm(s.label).includes(typed) || s.key.includes(typed))
      .map((s) => ({ ...s, value: prefix + norm(s.label) }));
  }, [prefix, raw, counts]);

  useEffect(() => {
    setActive(0);
  }, [raw]);

  const showList = open && prefix && suggestions.length > 0;
  const act = Math.min(active, suggestions.length - 1);

  const pick = (s) => {
    onChange(s.value);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!showList) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(suggestions[act]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="search-field">
      <input
        type="search"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // léger délai pour laisser le clic sur une suggestion se produire
          closeTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={onKeyDown}
        autoComplete="off"
        spellCheck="false"
      />

      {showList && (
        <ul className="suggest" role="listbox">
          {suggestions.map((s, i) => (
            <li key={s.key}>
              <button
                type="button"
                role="option"
                aria-selected={i === act}
                className={'suggest__item' + (i === act ? ' suggest__item--active' : '')}
                onMouseDown={(e) => e.preventDefault()} // évite le blur avant le clic
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(s)}
              >
                <span className="suggest__prefix">{prefix}</span>
                <span className="suggest__label">{s.label}</span>
                <span className="suggest__count">{s.count}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
