/**
 * Deterministic placeholder gradient for the Image Generator widget's mock state.
 * Used client-side whenever a real Gemini image isn't available (no key configured,
 * or the request fell back), so the mock visual stays identical to before real
 * image generation existed.
 */
export function promptToGradient(prompt: string): string {
  const hash = prompt.split('').reduce((a, c) => (a + c.charCodeAt(0)) | 0, 0);
  const gradients = [
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 55%, #0f3460 100%)',
    'linear-gradient(135deg, #0d1b2a 0%, #1b2838 55%, #1a3a5c 100%)',
    'linear-gradient(135deg, #1a2e1a 0%, #1e3a1e 55%, #0a4a1a 100%)',
    'linear-gradient(135deg, #2e1a0a 0%, #3d2810 55%, #5c3a1a 100%)',
    'linear-gradient(135deg, #2a0a2e 0%, #3d1040 55%, #5c0a6a 100%)',
  ];
  return gradients[Math.abs(hash) % gradients.length];
}
