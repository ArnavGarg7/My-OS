/**
 * @myos/ai/gateway — the single entry point. Everything AI flows through `AiGateway.run`:
 * route → budget → provider (retry + failover) → structured validation → telemetry
 * (06_AI_Architecture §3). No feature may bypass it.
 */
export {
  AiGateway,
  BudgetExceededError,
  type GatewayConfig,
  type GatewayRunOptions,
  type StructuredValidator,
} from "./ai-gateway";
export { routeRequest, failover, type RouteResult } from "./provider-router";
export { normalizeRequest, buildProviderInput } from "./request";
export { normalizeResponse } from "./response";
export { decideRetry, classifyError, type RetryDecision, type ErrorClass } from "./retry";
