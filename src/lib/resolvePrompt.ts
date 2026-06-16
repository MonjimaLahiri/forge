export interface ResolveResult {
  resolved: string;
  warnings: string[];
}

/**
 * Replaces {{widgetId.value}} tokens in a template string with live runtime values.
 *
 * - Unknown IDs → replaced with [missing: id] and a warning
 * - Known but empty IDs → replaced with "" and a warning
 * - Matched and non-empty → replaced with the value
 *
 * Pass `titles` to get human-readable widget names in warnings instead of raw IDs.
 * The regex covers both short IDs and UUIDs (which contain hyphens).
 */
export function resolvePrompt(
  template: string,
  values: Record<string, string>,
  titles?: Record<string, string>
): ResolveResult {
  const warnings: string[] = [];

  const resolved = template.replace(/\{\{([\w-]+)\.value\}\}/g, (match, id: string) => {
    if (!(id in values)) {
      warnings.push(`No input widget with id "${id}" found on the canvas.`);
      return `[missing: ${id}]`;
    }
    if (!values[id].trim()) {
      const name = titles?.[id] ?? id;
      warnings.push(`Enter a value in "${name}" before generating.`);
      return '';
    }
    return values[id];
  });

  return { resolved, warnings };
}
