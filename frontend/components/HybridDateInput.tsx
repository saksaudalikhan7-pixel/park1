"use client";

import { useRef } from "react";
import { Calendar } from "lucide-react";

interface HybridDateInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    max?: string;
    min?: string;
    error?: boolean;
}

export const HybridDateInput = ({
    value,
    onChange,
    placeholder = "DD-MM-YYYY",
    className = "",
    max,
    min,
    error = false
}: HybridDateInputProps) => {
    const nativeDateRef = useRef<HTMLInputElement>(null);

    // Convert ISO date (YYYY-MM-DD) to display format (DD-MM-YYYY)
    const isoToDisplay = (isoDate: string): string => {
        if (!isoDate) return "";
        const [year, month, day] = isoDate.split("-");
        return `${day}-${month}-${year}`;
    };

    // Convert display format (DD-MM-YYYY) to ISO (YYYY-MM-DD)
    const displayToIso = (displayDate: string): string => {
        if (!displayDate || displayDate.length < 10) return "";
        const [day, month, year] = displayDate.split("-");
        if (!day || !month || !year) return "";
        return `${year}-${month}-${day}`;
    };

    // Handle manual text input
    const handleTextInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value.replace(/[^\d]/g, ""); // Remove non-digits

        // Auto-format with dashes
        if (input.length >= 2) {
            input = input.slice(0, 2) + "-" + input.slice(2);
        }
        if (input.length >= 5) {
            input = input.slice(0, 5) + "-" + input.slice(5);
        }
        if (input.length > 10) {
            input = input.slice(0, 10);
        }

        // If complete date, validate and convert to ISO
        if (input.length === 10) {
            const isoDate = displayToIso(input);
            const date = new Date(isoDate);

            // Validate date
            if (!isNaN(date.getTime())) {
                // Check min/max constraints
                if (max && isoDate > max) return;
                if (min && isoDate < min) return;

                onChange(isoDate);
            }
        } else {
            // Clear the value if incomplete
            onChange("");
        }
    };

    // Handle native date picker selection
    const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isoDate = e.target.value;
        if (isoDate) {
            onChange(isoDate);
        }
    };

    // Open native date picker
    const openNativePicker = () => {
        if (nativeDateRef.current) {
            nativeDateRef.current.showPicker?.();
        }
    };

    const displayValue = value ? isoToDisplay(value) : "";

    return (
        <div className="relative">
            {/* Text input for manual typing */}
            <input
                type="text"
                value={displayValue}
                onChange={handleTextInput}
                placeholder={placeholder}
                className={className}
                inputMode="numeric"
                pattern="[0-9-]*"
                autoComplete="off"
            />

            {/* Hidden native date input */}
            <input
                ref={nativeDateRef}
                type="date"
                value={value}
                onChange={handleNativeDateChange}
                max={max}
                min={min}
                className="absolute opacity-0 pointer-events-none"
                tabIndex={-1}
            />

            {/* Calendar button to trigger native picker */}
            <button
                type="button"
                onClick={openNativePicker}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
            >
                <Calendar className="w-5 h-5" />
            </button>
        </div>
    );
};
