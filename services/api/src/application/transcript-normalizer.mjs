/**
 * Cleans up a noisy STT transcript using a tiny LLM call. Runs after Whisper
 * + the static post-process dictionary, before the cleaned text gets handed
 * to the DJ-prompt → /generate pipeline.
 *
 * The system prompt is intentionally short (~80 tokens) so this round-trip
 * is cheap (~500-800ms) and uses very few input tokens. The output contract
 * is "ONLY the cleaned text" — never paraphrase, never explain.
 *
 * Falls back to the raw transcript on any error or weird LLM output.
 *
 * @param {{ llmClient: import('./ports.mjs').LlmClient | null }} deps
 */
export function makeTranscriptNormalizer({ llmClient }) {
  if (!llmClient) return null;

  const SYSTEM = [
    'You clean up noisy speech-to-text transcripts of a DJ giving live-coding',
    'music commands. Input is a single short sentence. Fix obvious recognition',
    'errors. Output ONLY the cleaned text — no quotes, no commentary, no',
    'explanation.',
    '',
    'Rules:',
    '- NEVER paraphrase or rewrite. Only fix recognition errors.',
    '- Preserve DJ / techno jargon: Berghain, Bicep, Aphex Twin, lo-fi, dub,',
    '  dubby, four-on-the-floor, sidechain, ducking, BPM, breakbeat, IDM,',
    '  hyperpop, trap, drum and bass, scale names (C minor, A dorian, D phrygian),',
    '  drum machine names (TR-909, TR-808, LinnDrum, MPC60, RolandTR909).',
    '- Keep numbers as digits when used as BPM (e.g. "120 BPM", "174 BPM") or',
    '  scale degrees ("808 sub").',
    '- Strip filler ("uh", "um", "like, you know") ONLY when it makes the',
    '  request clearer. Otherwise keep them.',
    '- If the input already looks clean, return it unchanged.',
    '- When you are unsure between two options, prefer the original transcript.',
    '- Keep the response under 25 words.',
  ].join('\n');

  return {
    async normalize(rawText) {
      const trimmed = (rawText || '').trim();
      if (!trimmed) return trimmed;
      // Cheap safety: very short transcripts (1-2 words) rarely need cleaning
      // and the LLM might hallucinate — pass through.
      if (trimmed.split(/\s+/).length < 2) return trimmed;

      try {
        const result = await llmClient.complete({
          systemPrompt: SYSTEM,
          userMessage: trimmed,
          history: [],
        });
        let cleaned = String(result.text ?? '').trim();
        // Strip wrap quotes the model occasionally adds despite the contract.
        cleaned = cleaned.replace(/^["'`“”‘’]+|["'`“”‘’]+$/g, '').trim();
        // Strip leading "Cleaned: " / "Output: " prefixes some models emit.
        cleaned = cleaned.replace(/^(?:cleaned|output|corrected|result)\s*:\s*/i, '');
        // Sanity: if the LLM returned empty or 3x bloat, fall back.
        if (!cleaned || cleaned.length === 0) return trimmed;
        if (cleaned.length > trimmed.length * 3 + 30) return trimmed;
        return cleaned;
      } catch (err) {
        console.warn(`[normalize] LLM cleanup failed, using raw transcript: ${err.message}`);
        return trimmed;
      }
    },
  };
}
