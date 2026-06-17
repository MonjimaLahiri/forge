/**
 * Generates a polished placeholder response for the Text Generator widget.
 * Used by the /api/generate-text route whenever no ANTHROPIC_API_KEY is configured,
 * so behavior in environments without a key matches what shipped before real AI calls existed.
 */
export function generateMockText(resolvedPrompt: string): string {
  if (!resolvedPrompt.trim()) return 'Add a prompt in the editor before generating.';

  // Extract the subject from common prompt patterns
  const match =
    resolvedPrompt.match(/(?:description|copy|content|text|post|summary|email)\s+for\s+(.{3,}?)(?:\.|$)/i) ??
    resolvedPrompt.match(/(?:about|for|of|on)\s+(.{3,}?)(?:\.|$)/i);

  const raw = match?.[1]?.trim() ?? resolvedPrompt.trim();
  const subject = raw.length > 80 ? raw.slice(0, 80) + '…' : raw;
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const outputs = [
    `Meet the ${subject}. Designed with modern spaces in mind, it combines clean aesthetics with reliable performance. Its thoughtful details and lasting quality make it a natural choice for anyone who values both form and function.`,
    `${cap(subject)} delivers exactly what it promises: a refined experience built around simplicity and purpose. Lightweight, intuitive, and crafted to last — it fits seamlessly into everyday life without missing a beat.`,
    `Introducing ${subject} — crafted for those who value substance and style in equal measure. From first use, it feels considered and complete, with every detail earning its place.`,
    `${cap(subject)} stands out for all the right reasons. Precision-crafted and thoughtfully designed, it performs beautifully whether at home, in the office, or anywhere in between.`,
  ];

  return outputs[resolvedPrompt.length % outputs.length];
}
