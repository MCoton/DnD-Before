import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';

const LIST_MAX_HEIGHT = 280;
const MIN_SPACE_TO_OPEN_DOWN = 240;

/**
 * Dropdown that opens upward when there isn't enough space below the trigger,
 * so the list stays on screen (e.g. on phones).
 *
 * @param {string} value - Current selected value
 * @param {function} onChange - (value: string) => void
 * @param {Array<{ value: string, label: string, disabled?: boolean }>} options
 * @param {string} placeholder - Placeholder when empty
 * @param {string} className - Applied to trigger and list container
 * @param {boolean} disabled
 * @param {string} [id] - For aria
 */
export default function SpellDropdown({
    value,
    onChange,
    options,
    placeholder = '-- Select --',
    className = '',
    disabled = false,
    id
}) {
    const [open, setOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const triggerRef = useRef(null);
    const listRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);
    const displayLabel = selectedOption ? selectedOption.label : placeholder;

    useLayoutEffect(() => {
        if (!open) return;
        const rect = triggerRef.current?.getBoundingClientRect();
        if (rect) {
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            setOpenUpward(spaceBelow < MIN_SPACE_TO_OPEN_DOWN && spaceAbove > spaceBelow);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onOutside = (e) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target) &&
                listRef.current && !listRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        const onEscape = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onOutside);
        document.addEventListener('keydown', onEscape);
        return () => {
            document.removeEventListener('mousedown', onOutside);
            document.removeEventListener('keydown', onEscape);
        };
    }, [open]);

    const handleSelect = (opt) => {
        if (opt.disabled) return;
        onChange(opt.value);
        setOpen(false);
    };

    const listStyle = () => {
        if (!triggerRef.current || !open) return {};
        const rect = triggerRef.current.getBoundingClientRect();
        const left = rect.left;
        const width = Math.max(rect.width, 200);
        const padding = 8;
        if (openUpward) {
            const maxH = Math.min(LIST_MAX_HEIGHT, rect.top - padding);
            return {
                position: 'fixed',
                bottom: window.innerHeight - rect.top,
                left,
                width,
                maxHeight: maxH,
            };
        }
        const maxH = Math.min(LIST_MAX_HEIGHT, window.innerHeight - rect.bottom - padding);
        return {
            position: 'fixed',
            top: rect.bottom,
            left,
            width,
            maxHeight: maxH,
        };
    };

    return (
        <div className="spell-dropdown-wrap">
            <button
                ref={triggerRef}
                type="button"
                id={id}
                className={`spell-dropdown-trigger ${className}`}
                disabled={disabled}
                onClick={() => !disabled && setOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={placeholder}
            >
                <span className="spell-dropdown-value">{displayLabel}</span>
                <span className="spell-dropdown-arrow" aria-hidden>▾</span>
            </button>
            {open && (
                <div
                    ref={listRef}
                    className={`spell-dropdown-list ${openUpward ? 'spell-dropdown-list-up' : ''}`}
                    style={listStyle()}
                    role="listbox"
                >
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            role="option"
                            aria-selected={opt.value === value}
                            disabled={opt.disabled}
                            className="spell-dropdown-option"
                            onClick={() => handleSelect(opt)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
