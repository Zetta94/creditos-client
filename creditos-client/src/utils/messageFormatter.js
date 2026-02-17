export function formatPayrollMessage(content) {
    if (typeof content !== "string") return "";

    const trimmed = content.trim();
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
