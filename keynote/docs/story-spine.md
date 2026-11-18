# Story spine: Inside the AI Frontier

The 60-minute beat sheet and its energy curve. Source of truth: [`src/data/beats.json`](../src/data/beats.json), the copy deck with exact on-screen text, steps, visual direction and an owner per moment. Regenerate this page when beats.json changes (`python3 -I spine.py <worktree>`).

**The promise.** Latin American leaders leave having seen how fast the AI frontier is moving and what it means for their 2027 decisions, and they think twice.

**The shape.** Film (speed) → one question → I. what San Francisco is building → II. what the frontier labs show (the peak) → III. where they hit their limits (hard cut to silence) → IV. what the world is saying (loud) → V. what you do next (calm, decisive) → close.

**Act starts:** Open 00:00 · I 03:45 · II 13:30 · III 27:00 · IV 38:15 · V 46:00 · Close 56:30

## Energy curve

1 = silence, 10 = peak; one column per minute.

```
10 │                 ██                                         
 9 │█     ██         ██             ██    █    █                
 8 │█   █ ██      ██ █████          ██ ████    █  ██            
 7 │█   █ ██     █████████ █  █     ██ ████  ███  ██    ███ █   
 6 │██  █ ███ ████████████ █  █    ███ █████████  ██    ██████  
 5 │██  █ █████████████████████   ████ ██████████ ██  ████████  
 4 │██  ███████████████████████ █████████████████ ████████████  
 3 │███████████████████████████ ████████████████████████████████
 2 │████████████████████████████████████████████████████████████
 1 │████████████████████████████████████████████████████████████
   └────────────────────────────────────────────────────────────
    0    5    10   15   20   25   30   35   40   45   50   55   60 min
```

Rhythm rules: never two bursts in a row without a calm beat, except at the Act II peak; every act opens with a change of ground (paper ↔ void); three silences (`question`, `and-yet`, `so-what`); the loudest moment is `swarm` (about minute 19); the quietest is the hard cut to `and-yet`, right after the labs' show of power.

## Beats

| # | Starts | Act | Moment | Ground | Energy | Cue | What it does |
|---|---|---|---|---|---|---|---|
| 1 | 00:00 | Open | `opener` | void | 9 | Speed | A 60–90 s film about speed opens the night. It ends on white type on black: Inside the AI Frontier. |
| 2 | 01:30 | Open | `title` | void | 6 | — | Seamless from the film's last frame: the title holds, the byline arrives, then black opens to white. |
| 3 | 02:15 | Open | `question` | paper | 3 | — | One question frames the night, then the five stops of the route. |
| 4 | 03:45 | I | `sf-arrival` | void | 8 | Speed | We land in San Francisco, three days of the AI Engineer Code Summit, where builders ship AI-written code at volume. |
| 5 | 04:45 | I | `sf-topics` | paper | 4 | — | What 80 talks were about: shipping AI-written code at volume dominates. |
| 6 | 06:00 | I | `factory` | void | 9 | Speed | The software factory: agents write, test and ship; people set direction and check. Real numbers from the stage. |
| 7 | 08:00 | I | `slop` | void | 6 | Trade-offs | The most-watched talk of the summit: volume up 13×, and quality went up too. Speed without losing control. |
| 8 | 09:00 | I | `lean-harness` | paper | 5 | Trade-offs | Better models need less scaffolding: a Google DeepMind engineer deleted 90% of his harness and the agent got better. |
| 9 | 10:00 | I | `org` | paper | 6 | Value | Not just code: companies are reorganizing around the agent. Amp passed $100M ARR with 21 people. |
| 10 | 11:15 | I | `verification` | paper | 6 | Constraints | When agents write the work, the bottleneck becomes checking it, and the AI judges hallucinate too. |
| 11 | 12:45 | I | `last-job` | paper | 3 | Value | The line that closes San Francisco: judgment is the last job. |
| 12 | 13:30 | II | `three-labs` | void | 7 | — | Three labs share the frontier; each shipped its flagship in the last six weeks. |
| 13 | 14:30 | II | `release-pace` | void | 8 | Speed | Frontier releases now come in weeks: 14 in 11 weeks across three labs. |
| 14 | 15:45 | II | `year-in-weeks` | paper | 7 | Speed | Independent indices moved almost a year of trend in 11 weeks, with an honest caveat. |
| 15 | 17:00 | II | `swarm` | void | 10 | Speed | The peak of the night: more than a thousand agents, eight days, an operating system from an empty folder. |
| 16 | 18:45 | II | `self-build` | paper | 8 | Speed | AI is now building AI: inside one lab, Claude writes most of the code and leads a quarter of R&D. |
| 17 | 20:00 | II | `science` | void | 8 | Value | The strongest results are now artifacts anyone can check: proofs, verified code, a new enzyme system. |
| 18 | 21:45 | II | `price` | paper | 5 | Trade-offs | The same capability gets much cheaper every quarter: buy now or wait is a real trade-off. |
| 19 | 22:45 | II | `ruler` | void | 7 | Uncertainty | Who leads depends on the ruler. Never pick a vendor from a leaderboard. |
| 20 | 24:30 | II | `open-weights` | paper | 5 | Trade-offs | The best open-weight models are Chinese and a few months behind: an option for cost and control. |
| 21 | 25:45 | II | `twins` | void | 7 | Constraints | The labs now say their own models are too capable to ship as-is, so each ships twins. |
| 22 | 27:00 | III | `and-yet` | paper | 2 | — | Hard cut to silence. And yet. Four limits. |
| 23 | 28:00 | III | `employee-bar` | paper | 4 | Constraints | The clearest independent test of real work: no model met the bar Epoch sets for its own employees. |
| 24 | 30:00 | III | `economics` | paper | 5 | Trade-offs | Smarter isn't always cheaper: on one task, the bigger model cost more than the human contractor. |
| 25 | 31:00 | III | `rulers-break` | paper | 6 | Uncertainty | The instruments that measure AI are saturating, being gamed and losing sight of reasoning. |
| 26 | 32:30 | III | `breach` | void | 9 | Constraints | Agents under test escaped and reached the real world. The motive: finishing the task. |
| 27 | 34:15 | III | `recipe` | paper | 4 | Constraints | Every documented incident shares one recipe. The lesson is operational. |
| 28 | 35:15 | III | `power` | void | 8 | Constraints | Power is now a measured limit: the largest US grid cannot promise the electricity new data centres need. |
| 29 | 36:45 | III | `brazil` | void | 8 | Constraints | Compute now needs a licence, and the rule reaches Latin America: Brazil is on the list, effective around today. |
| 30 | 38:15 | IV | `news-tunnel` | void | 9 | Uncertainty | We fly through what the world is saying: real posts and headlines from the last 30 days. |
| 31 | 39:00 | IV | `money` | paper | 6 | Value | The money: run-rates, an IPO, and capex at a scale no industry has seen. |
| 32 | 40:45 | IV | `x-voices` | paper | 7 | Speed | On X this month: the posts that moved the conversation, with their real reach. |
| 33 | 42:45 | IV | `tabloids` | paper | 9 | Uncertainty | Meanwhile, the headlines: rogue agents, superintelligence, the backlash. Fast, loud, real. |
| 34 | 44:00 | IV | `adoption` | paper | 5 | Value | Inside companies: most US businesses now pay for AI, usage is exploding, and usage is not results. |
| 35 | 45:15 | IV | `rules` | paper | 3 | Constraints | The binding rules now land on deployment, not training. |
| 36 | 46:00 | V | `so-what` | paper | 2 | — | Turn to the audience. |
| 37 | 46:30 | V | `motor` | void | 8 | Value | We have seen this before: the electric motor paid off only when factories were redesigned around it. |
| 38 | 48:15 | V | `approach` | paper | 4 | Value | Approach: redesign the work, don't bolt AI onto it. |
| 39 | 49:45 | V | `checkable` | paper | 5 | Trade-offs | The frontier's own lesson: AI leaps where results are cheap to check. Start there, and build the check first. |
| 40 | 51:00 | V | `roles` | paper | 5 | Value | Roles for 2027: an owner, a verifier, an operator. Judgment stays human. |
| 41 | 52:30 | V | `think-twice` | paper | 7 | — | The heart of the close: five decisions to think twice about in 2027, each backed by tonight's evidence. |
| 42 | 54:45 | V | `first-move` | paper | 6 | Value | The first move for Monday: one workflow, redesigned, one number. |
| 43 | 56:30 | Close | `callback` | void | 7 | Speed | Echo of the opening speed, then stillness: the plan has to move with the frontier. |
| 44 | 57:15 | Close | `close-line` | paper | 6 | Uncertainty | Irina's belief, to close: uncertainty is material, not a reason to wait. The best options are built. |
| 45 | 58:30 | Close | `end` | void | 3 | — | Mirror of the title. Name, LinkedIn, questions. |
