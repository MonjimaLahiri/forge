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
 * The regex covers both short IDs and UUIDs (which contain hyphens).
 */
export function resolvePrompt(
  template: string,
  values: Record<string, string>
): ResolveResult {
  const warnings: string[] = [];

  const resolved = template.replace(/\{\{([\w-]+)\.value\}\}/g, (match, id: string) => {
    if (!(id in values)) {
      warnings.push(`No input widget with id "${id}" found on the canvas.`);
      return `[missing: ${id}]`;
    }
    if (!values[id].trim()) {
      warnings.push(`Input widget "${id}" is empty — fill it in before generating.`);
      return '';
    }
    return values[id];
  });

  return { resolved, warnings };
}
