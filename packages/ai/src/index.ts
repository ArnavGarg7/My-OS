/**
 * @myos/ai — the single seam behind which all AI lives (06_AI_Architecture.md §1).
 * Everything AI-powered goes through `AiService`; `local_only` mode / missing keys
 * resolve to `disabledAiService`, so the app is fully usable with AI off (NFR-9).
 *
 * Sprint 1.1 ships the interface + disabled stub only. The Anthropic/Voyage
 * clients, context engine, assistant loop, planner and prompts land in Stage 10.
 */
export interface AiService {
  readonly enabled: boolean;
}

export const disabledAiService: AiService = {
  enabled: false,
};
