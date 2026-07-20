# Chief & Conversational Pipeline

The Chief composes read models ([ADR-003](../adr/ADR-003.md)); the assistant grounds every answer in tool results and returns proposals for mutations ([ADR-004](../adr/ADR-004.md)).

```mermaid
flowchart TD
  Msg["User message"] --> Mode["classifyMode (8 modes)"]
  Mode --> Plan["planIntent → tools + mutation?"]
  Plan --> Loop["Tool loop (grounding)"]
  Loop --> Reason["composeAnswer (grounded | unknown)"]
  Reason --> Prop{"mutation?"}
  Prop -- yes --> Proposal["Proposal (preview, not applied)"]
  Prop -- no --> Answer["Grounded answer + citations"]
  Compose["composer.ts — reads owning modules' read models"] --> Loop
```

- The Now Engine, Morning Intelligence, Optimize/Rescue/Night all run on the same composed `ChiefContext`.
- Provider is resolved by the Provider Policy; offline → Local.
