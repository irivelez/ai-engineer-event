# Is AI about to go vertical? The evidence behind the "inflection point" chart

Checked on 18 Nov 2026. The data lives in `src/data/trend-evidence.json`. Every quote below was re-read on the public page that day unless it is marked otherwise.

## Verdict (for a business audience)

Measured: AI is improving faster since 2024. Epoch's index climbs about 14 points a year, up from 6, and METR estimates Anthropic now improves at about twice its 2024–25 pace, with wide error bars. Not measured: a vertical takeoff; that curve is a scenario. Plan for big steps every few months, not for a date when everything changes.

## Which chart people mean

| Rank | Chart | Kind | What it shows | What its authors say about uncertainty |
|---|---|---|---|---|
| 1 | [METR time horizons](https://metr.org/time-horizons/) (first published [19 Mar 2025](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/)) | Measurement | The length of software task, timed by human experts, that agents finish 50% of the time, "doubling time of around 7 months" over six years. On a linear axis it shoots up, which is why it gets called a "Moore's law for AI agents". | "this plot does not account for future changes in the trend or external validity concerns". The page is "no longer actively updated" (8 Sep 2026), and "Measurements above 16 hrs are unreliable". |
| 2 | [AI 2027](https://ai-2027.com/) (Kokotajlo, Alexander, Larsen, Lifland, Dean; 3 Apr 2025) | Scenario | Once AI automates AI research, the "AI R&D progress multiplier" goes from 1.5x (early 2026) to 10x (Jun 2027) and about 50x (Sep 2027), reaching superintelligence in Dec 2027. This is the "skyrocket" curve. | "roughly our median guess, but we think it's plausible that this happens up to ~5x slower or faster". Later notes: "our medians were somewhat longer"; one author's median is 2030. |
| 3 | [Situational Awareness: Counting the OOMs](https://situational-awareness.ai/from-gpt-4-to-agi/) (Leopold Aschenbrenner, Jun 2024) | Scenario (one author's extrapolation) | "AGI by 2027 is strikingly plausible"; compute scale-ups run "close to 5x the speed of Moore's law". | "To be clear—the error bars are large." |

Why rank 1: Bloomberg's Odd Lots titled its 25 Apr 2026 episode with METR "[Understanding the Most Viral Chart in Artificial Intelligence](https://www.bloomberg.com/news/articles/2026-04-25/understanding-the-most-viral-chart-in-artificial-intelligence)", and MIT Technology Review called it "[the most misunderstood graph in AI](https://www.technologyreview.com/2026/02/05/1132254/this-is-the-most-misunderstood-graph-in-ai/)" (5 Feb 2026). Note the mix: rank 1 is a measurement, but the "about to skyrocket" reading comes from ranks 2 and 3, which are scenarios.

Two common misreadings, per MIT Technology Review: a time horizon is not how long a model works unattended ("They represent how long it takes humans to complete tasks that a model can successfully perform"), and "the plot is based almost entirely on coding tasks."

## What the measurers say

| Source | Quote | Label |
|---|---|---|
| [Epoch AI, 1 Sep 2026](https://epoch.ai/data-insights/eci-frontier-trend) | "the Epoch Capabilities Index (ECI) frontier has advanced linearly by 14 points per year … compared with 6 points per year for non-reasoning models." Both are straight lines: a steeper slope, not a curve bending upward. | Independent |
| [Epoch AI, 11 Nov 2026](https://epochai.substack.com/p/the-epoch-brief-november-11-2026) | "These contributions could accelerate progress, but Fable’s score is just one data point." | Independent |
| [METR, 5 Nov 2026](https://metr.org/blog/2026-11-05-anthropic-ai-rd-acceleration-assessment) | "As of October 2026, Anthropic is likely improving the capabilities of their models on well-specified tasks at around twice the rate they did between March 2024 and October 2025." Also: "closer to 1.3x or 3x" would not surprise them; "Anthropic redacted a majority of the evidence we found most informative"; "may fail to track acceleration in real-world impact". | Independent (one lab, mostly redacted) |
| [METR, 22 Sep 2026](https://metr.org/blog/2026-09-22-claude-opus-5-5/) | "the data we have is insufficient for distinguishing consistent, accelerating, or decelerating rates of improvement." | Independent (superseded by 5 Nov) |
| [OpenAI GPT-6.2 card, 17 Nov 2026](https://deploymentsafety.openai.com/gpt-6-2-astra-sol) | "slightly above the trend since GPT-5, but within the range we would expect if capabilities continued to improve at roughly the same pace." Astra is "our first externally released model to meet the High threshold for AI Self-Improvement"; Critical is "the future" threshold. | Lab-reported |
| Same card, Epoch's evaluation | "They did not observe any meaningful improvements between GPT-6.2 Astra and GPT-6 Astra." | Lab-published third-party result |
| [Epoch AI, 11 Nov 2026](https://epochai.substack.com/p/the-epoch-brief-november-11-2026) | Quarterly compute additions "have grown about 2.5× per year since 2024 … down from the roughly 6× annual surge in 2023"; further slowing is "not statistically significant". | Independent |
| [PJM, 14 Jul 2026](https://www.pjm.com/-/media/DotCom/about-pjm/newsroom/2026-releases/20260714-pjm-capacity-auction-procures-138318-mw-of-generation-resources.pdf) | Capacity "is short of PJM’s reliability requirement by 6,831 MW". | Official |

## Scenario against measurement, on one axis

AI 2027's multiplier (1.5x early 2026, 3x Jan 2027, 10x Jun 2027, 50x Sep 2027) and METR's measured ≈2x (Oct 2026, range 1.3–3x, Anthropic only) are comparable but not identical quantities: the scenario counts algorithmic progress, METR counts capability progress on a benchmark index. So far the measured value sits in the scenario's early stage. Nobody has measured anything like its 10x–50x stage. Neither belongs on the ECI axis.

## Corrections and what remains unverified

- METR's September "~1.5X" figure came from "a separate METR assessment of AI R&D acceleration inside Anthropic", not from Anthropic, and its authors did not see the evidence.
- METR's own page states no doubling time today. The "~7 months" is from the March 2025 post, which now says "some claims in the text (e.g. the doubling time) reflect the state of the data at the time of original publication". The faster recent doubling (about 4 months) is known only from podcast summaries.
- Anthropic's Fable 5 card sentence ("internal measures do not show a sustained AI-attributable 2× acceleration"): second-hand only, not re-read. METR (5 Nov) says recent models make that card's "one-time jump" reading "look less likely than a permanent trend change".
- The Odd Lots episode's title and date were confirmed from search results; the episode itself was not heard.
- Not checked: Wait But Why's 2015 "AI Revolution" illustration and Kurzweil's accelerating-returns chart, both opinion-type candidates for the "you are here at the knee of the curve" image; the AI Futures Project's current model (aifuturesmodel.com) did not render.
