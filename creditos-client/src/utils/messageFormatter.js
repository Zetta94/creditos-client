function normalizeMojibake(value) {
    if (typeof value !== "string") return "";
    const raw = value.trim();
    if (!raw) return "";
    if (!/[ÃÂâ]/.test(raw)) return raw;
    try {
        const bytes = Uint8Array.from(raw, (char) => char.charCodeAt(0) & 0xff);
        return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    } catch {
        return raw;
    }
}

export function formatPayrollMessage(content) {
    if (typeof content !== "string") return "";

    const trimmed = normalizeMojibake(content);
    if (!trimmed) return "";

    const lines = trimmed
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length === 0) return "";

    if (lines[0].startsWith("[PAYROLL:")) {
        lines.shift();
    }

    return lines.join("\n");
}

export function formatMessageContent(content) {
    return formatPayrollMessage(content);
}
