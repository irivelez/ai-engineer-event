# gl-1 report: 18 Nov 2026, 17:25

**Done (7/7):** swarm, sf-arrival, factory, three-labs, release-pace, science, callback. Shared 3D code: `src/scenes/_worlds/gl1-kit.js`, `city.js`, `labs.js`.

**fps** (`fps.mjs`, M2, 1920×1080): p95 16.67 ms on every step of every moment; CPU work p95 ≤ 2.1 ms. zoomsim: SSIM ≥ 0.99 on all 22 steps; the DOM check found no text below 26 px and no contrast failures.

**Director's notes, applied**
- swarm glows: 3,072 agents with HDR heads and a luminous core.
- The layers are built from the agents themselves; the wireframe planes are gone.
- Style frame B is now swarm step 0.

**Decisions**
- swarm: 8 layers = 8 days, on the counter's timeline. `copy.kicker` is hidden (it repeats the footer source).
- factory: 1 cube = 100 merged PRs, so the towers are to scale. Accent marks the agent's share.
- release-pace: 13 beads. GPT-6 Sol and Luna has no verified launch day, so it gets no bead; OpenAI still shows 5.

**Cut**
- sf-arrival's 80-title wall: the repo holds no titles.
- The optional stage still: it clashed with the act title.

**Notes**
- `ai-engineer-event-5b` was unreachable, so my messages went to frontier-keynote-16.
- `smoke.mjs` on partial builds fails only `?m=3`; the walk was clean.
