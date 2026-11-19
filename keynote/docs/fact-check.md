# Fact-check: Inside the AI Frontier

Sign-off for every number and quote on screen (GOAL.md, definition of done 6). Checked on Wed 18 Nov 2026, 14:45–15:50 Bogotá, against `src/data/beats.json` and `src/data/facts.json` as they stood at 15:50.

**How to read this file**

- **Fact id** points to `src/data/facts.json`, which holds the claim, the public source URL, the caveat and the label.
- **Label:** independent (measured by someone who doesn't sell the model or product), lab-reported (a company's own figure about its own model or its own work, including Ramp, Cognition, Amp, ZoomInfo and SpaceXSI on stage), official (a government text, a company's own launch page or filing, an official schedule, a platform counter), estimate (a model or our own reading or arithmetic), secondary (no primary page found), press (press reports only).
- **Check:** live = re-read on the public page on 18 Nov; doc = traced to our research notes' reading of the public page on 17 Nov, not re-read today. Quotes from the Code Summit stage were checked against the recordings by the media teammate (`src/data/sf-stills.json`); they count as live.
- **Status:** OK, corrected (copy changed; see the corrections log), risk (on screen, but read the note), dropped.

## Every on-screen claim

| Moment | Claim on screen | Fact id | Label | Source | Check | Status |
|---|---|---|---|---|---|---|
| sf-arrival | Code Summit, 10–12 Nov 2026 · 80 sessions · 3 days | sf-sessions | official | [sessions.json](https://ai.engineer/code/2026/sessions.json) | live | OK. Our count: 108 entries − 18 meals/breaks − 9 MC slots = 81; the two-part AFK workshop counts once = 80 |
| sf-topics | Topic bars (13, 8, 8, 8, 7, 7, 6, 5, 5, 5, 3, 3) | sf-topics | estimate | [sessions.json](https://ai.engineer/code/2026/sessions.json) | doc | OK. Our grouping, disclosed in the slide note |
| sf-topics | 34 of 80: shipping AI-written code at volume | sf-shipping-34 | estimate | same | doc | OK (13+8+8+5) |
| factory | 10,926 merged pull requests in October, from 809 in June (monthly series) | grokbot-prs | lab-reported | [Lauren Tan, 13:34](https://www.youtube.com/watch?v=O_zcc6Xl12g&t=813) | live | OK |
| factory | 75% of all merged code at Ramp, written and shipped by Inspect | ramp-inspect-75 | lab-reported | [Day 1 livestream, 7:51:01](https://www.youtube.com/watch?v=ZZ19zhYnDKY&t=28260) | live | OK |
| factory | 92% of Cognition's merged pull requests in September, by Devin | cognition-devin-92 | lab-reported | [sessions.json abstract](https://ai.engineer/code/2026/sessions.json) | live | OK. Labelled "talk abstract" on screen |
| slop | 925,237 views since 14 Nov · YouTube, 18 Nov 2026 | laurentan-views | official | [YouTube](https://www.youtube.com/watch?v=O_zcc6Xl12g) | live | OK. Re-check on show day |
| slop | “Last month our team shipped a ridiculous 11,000 pull requests to production.” | grokbot-prs | lab-reported | [13:40](https://www.youtube.com/watch?v=O_zcc6Xl12g&t=813) | live | OK |
| slop | 0.98% → 0.47% of commits reverted, June → October | grokbot-reverts | lab-reported | [14:17](https://www.youtube.com/watch?v=O_zcc6Xl12g&t=856) | live | OK |
| slop | Volume up 13×. Reverts halved. | grokbot-prs, grokbot-reverts | lab-reported | arithmetic | live | OK (10,926 ÷ 809 = 13.5; 0.47 ÷ 0.98 = 0.48) |
| lean-harness | “I deleted 90% of my harness, and it got better.” (talk title) | schmid-harness | lab-reported | [Day 1 livestream, 2:20:48](https://www.youtube.com/watch?v=ZZ19zhYnDKY&t=8447) | live | OK |
| lean-harness | “Models will keep eating the harness.” | schmid-harness | lab-reported | same, 2:34:16 | live | OK |
| org | 21 co-founders · more than $100M ARR · 1/10 to 1/30 the headcount | amp-org | lab-reported | [Day 2 livestream, 8:02:52](https://www.youtube.com/watch?v=y9JtCCZP2MQ&t=28971) | live | OK. Labelled company-reported on screen |
| org | “We had to stay at 21 people… a forcing function for us to work differently.” | amp-org | lab-reported | same | live | OK |
| verification | 8 of 80 talks on verification and code review | sf-verification-8 | estimate | [sessions.json](https://ai.engineer/code/2026/sessions.json) | doc | OK |
| verification | 500 production steps; AI judge right 65%; 118 bad steps accepted, more than 1 in 4 | zoominfo-judge | lab-reported | [Day 1 livestream, 6:16:04](https://www.youtube.com/watch?v=ZZ19zhYnDKY&t=22563) | live | OK |
| verification | “The agent made it up and the judge approved it.” | zoominfo-judge | lab-reported | [6:12:57](https://www.youtube.com/watch?v=ZZ19zhYnDKY&t=22377) | live | OK |
| last-job | “Judgement is the last job.” (talk title, 12 Nov 2026) | dey-judgement | official | [Day 2 livestream, 6:08:43](https://www.youtube.com/watch?v=y9JtCCZP2MQ&t=22122) | live | OK |
| last-job | “Protect your judgment and build things that people want.” | dey-judgement | official | same, 6:21:48 | live | OK |
| three-labs | Claude Fable 5.2 · 9 Nov | fable52-date | official | [Anthropic](https://www.anthropic.com/news/claude-fable-and-mythos-5-2) | live | OK |
| three-labs | GPT-6.2 Astra · 17 Nov | gpt62-date | official | [GPT-6.2 system card](https://deploymentsafety.openai.com/gpt-6-2-astra-sol) | live | OK |
| three-labs | Gemini 4 Carbon · 10 Nov | carbon-date | official | [Google](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-carbon-now-available/) | live | OK. General availability; first released to vetted cyber defenders on 28 Oct |
| release-pace | Anthropic 5 | releases-anthropic-5 | official | [Claude release notes](https://support.claude.com/en/articles/12138966-release-notes) | live | OK |
| release-pace | Google 4 | releases-google-4 | official | [Google Cloud model table](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/model-versions) | live | OK under our counting rule (decision D2) |
| release-pace | OpenAI 5 | releases-openai-5 | official | [GPT-6.2 system card](https://deploymentsafety.openai.com/gpt-6-2-astra-sol); [GPT-6 Cyber card, 5 Nov](https://deploymentsafety.openai.com/gpt-6-cyber/gpt-6-cyber.pdf) | live | OK. GPT-6.1 Sol's date rests on a same-day developer post and GPT-6 Sol/Luna's on a system-card appendix date (22 Sep); GPT-6.1 Terra is undated (15 if it counts) |
| release-pace | 14 frontier-relevant releases in 11 weeks, 1 Sep → 17 Nov | releases-sep-nov | official | per-release links in facts.json | live | OK. Count depends on the rule (D2); 77 days = 11 weeks |
| year-in-weeks | ECI frontier 162.5 → 174, 1 Sep → mid-Nov | eci-jump | independent | [Epoch Brief, 11 Nov](https://epochai.substack.com/p/the-epoch-brief-november-11-2026); [ECI trend](https://epoch.ai/data-insights/eci-frontier-trend) | live | OK |
| year-in-weeks | Trend: about 14 points a year | eci-trend-14 | independent | [Epoch, 1 Sep](https://epoch.ai/data-insights/eci-frontier-trend) | live | OK |
| year-in-weeks | Artificial Analysis top model 58 → 65, 27 Oct → 17 Nov | aa-jump | independent | [AA v5, 27 Oct](https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v5) | live | Risk. Both published by AA (58 = Opus 5.5 in the 27 Oct article; 65 = Fable 5.2 today), but Opus 5.5 now shows 59, so a v5.0.1 update moved scores about a point: on one scale the rise is about 6 points |
| year-in-weeks | Title: Almost a year of progress in 11 weeks | eci-jump | independent | arithmetic | live | OK. 11.5 ÷ 14 ≈ 0.82 year; notes say “about ten months” (D6) |
| year-in-weeks | Two releases drove most of it. Epoch calls the record “just one data point.” | eci-one-data-point | independent | [Epoch Brief](https://epochai.substack.com/p/the-epoch-brief-november-11-2026) | live | OK |
| swarm | Lab-reported · 1,000+ subagents · 8 days nonstop · empty folder → OS that boots on a laptop | fable-1000-subagents | lab-reported | [Anthropic, 9 Nov](https://www.anthropic.com/news/claude-fable-and-mythos-5-2) | live | OK. Page: “over 1,000”, “around the clock for eight days”, “a working operating system that boots on a laptop” (task: a prototype OS) |
| self-build | >90% of merged changes to Anthropic's core codebase, with people guiding | claude-90-merged | lab-reported | same | live | OK |
| self-build | <1% (Feb 2026) → ~26% (Aug 2026) of AI R&D work led by Claude, “as of August 2026 (its latest figure)” | claude-rd-26 | lab-reported | [Anthropic, 17 Sep](https://www.anthropic.com/institute/measuring-pace-of-ai-development) | live | OK. The Feb baseline is in the page's chart description. Re-read 21:30: nothing newer than August on the page |
| self-build | ~2×: as of Oct 2026, Anthropic's models improve about twice as fast as in 2024–25, mostly because of AI; for now, people still guide the work (mainly AI assistance; METR sees “some signs” of more fully autonomous work soon) | metr-anthropic-2x | independent | [METR, 5 Nov](https://metr.org/blog/2026-11-05-anthropic-ai-rd-acceleration-assessment) | live | corrected (21:45): replaces “~30,000 agents” (August, anthropic-30000-agents, kept for questions). Caveat on screen: range 1.3×–3×; Anthropic redacted most of METR's key evidence |
| science | Fermat in Lean: ~1,000 agents, 30 hours, with a one-line proof sketch and 47 lemmas | fermat-lean | lab-reported | [Anthropic, footnote 4](https://www.anthropic.com/news/claude-fable-and-mythos-5-2) | live | Corrected (C1) |
| science | Signal verified: Gemini agents, AlphaProof Code, 6M+ lines of Lean in 4 weeks, experts reviewed every specification | alphaproof-signal | lab-reported | [Google DeepMind, 10 Nov](https://deepmind.google/blog/introducing-alphaproof-code/) | live | OK |
| science | New enzyme system: ~950 agents, 21 hours, “we don't yet know its function” | enzyme-950 | lab-reported | [Anthropic, 23 Sep](https://www.anthropic.com/research/claude-discovers-novel-enzyme-system) | live | OK |
| price | −47% per quarter since 2023; ≈13× cheaper per year | price-47-quarter | estimate | [State of AI 2026](https://www.stateof.ai/) | live | OK. Epoch's estimate across five benchmarks, as relayed by the report |
| price | Ramp: blended token prices −14.8% in the four weeks to 1 Nov | ramp-price-148 | independent | [Ramp AI Index](https://ramp.com/data/ai-index) | live | OK (OpenAI and Anthropic blend, $0.62 → $0.53) |
| ruler | Artificial Analysis: Fable 5.2 65 · GPT-6.2 Astra 62 · Gemini 4 Carbon 60 | aa-leaderboard | independent | [AA leaderboard](https://artificialanalysis.ai/leaderboards/models) | live | OK. Re-check on show day |
| ruler | ECI: GPT-6.2 Astra 174 · Fable 5.2 174 · GPT-6 Astra 169 | eci-tie-174 | independent | [Epoch hub](https://epoch.ai/benchmarks); [Epoch Brief](https://epochai.substack.com/p/the-epoch-brief-november-11-2026) | live | OK. Hub shows only Astra's 174; Fable's 174 is from the brief and may be revised (one secondary report: 173.5) |
| ruler | Arena text: Gemini 4 Carbon 1526 · Gemini 4 Argon 1522 · Meta Muse Wonder 1511 | arena-text-carbon | independent | [Arena, 11 Nov](https://arena.ai/leaderboard/text) | live | OK. Top two statistically tied; Arena sells evaluations to labs |
| ruler | ARC-AGI-3 standard: Fable 5.2 81.2% · GPT-6.2 Astra 70.3% · Gemini 4 Carbon 65.1% | arc-agi-3-standard | independent | [ARC Prize](https://arcprize.org/leaderboard) | live | OK. Confirmed on arcprize.org, so the ruler stays (D4) |
| ruler | Tag: All independent measures, as of 11–17 Nov 2026 | — | — | — | live | OK |
| open-weights | Kimi K3.1 Pro · Moonshot AI · 46 vs 65 | kimi-46 | independent | [AA](https://artificialanalysis.ai/models/kimi-k3-1-pro) | live | OK |
| open-weights | 4–7 months behind the frontier on cyber tasks (UK AISI) | open-lag-aisi | independent | [UK AISI, 17 Jul](https://www.aisi.gov.uk/blog/how-far-behind-the-frontier-are-leading-open-weight-models-on-cyber) | live | OK. Measured on GLM-5.2 and DeepSeek V4-Pro in July |
| twins | OpenAI's words on GPT-6 Astra, “Critical” for cyber | openai-critical-quote | lab-reported | [GPT-6 Astra system card](https://deploymentsafety.openai.com/gpt-6-astra) | live | Corrected (C2) |
| twins | Fable 5.2 / Mythos 5.2 · GPT-6.2 / GPT-6 Cyber · Gemini 4 / cyber-permissive, vetted only | twin-releases | official | [Anthropic](https://www.anthropic.com/news/claude-fable-and-mythos-5-2); [GPT-6.2 card](https://deploymentsafety.openai.com/gpt-6-2-astra-sol); [Google Cloud table](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/model-versions) | live | Risk (low). Google's model table lists the cyber-permissive variants without access terms; its [Fairwind page](https://deepmind.google/fairwind-program/) says vetted partners get exclusive access to “Gemini for cyber models”. That these are the same models is our inference |
| employee-bar | No model met the bar Epoch sets for its own employees | epoch-real-work | independent | [Epoch, 17 Nov](https://epoch.ai/publications/how-good-are-fable-5-2-and-gpt-6-2-astra-at-real-work) | live | OK |
| employee-bar | Four real, open-ended tasks · six frontier models · one hand-graded run each | epoch-real-work | independent | same | live | OK (Epoch: four work task categories) |
| employee-bar | Fable 5.2 best; GPT-6.2 Astra 65% average, 17 points lower | epoch-astra-65 | independent | same | live | OK |
| employee-bar | Three failure lines | epoch-failures | independent | same | live | Corrected (C3) |
| employee-bar | Bar label and note: line position illustrative | epoch-real-work | independent | same | live | OK (added by another teammate; honest disclosure) |
| economics | Contractor ~16 h; Opus 5.5 under 3 h, less than the contractor; Fable 5.2 ~6.5 h, more than the contractor | epoch-economics | independent | same | live | OK. One task; no dollar figures published |
| rulers-break | 98.5%: nine models tie on ARC-AGI-1 | arc1-saturated | independent | [ARC Prize](https://arcprize.org/leaderboard) | live | OK |
| rulers-break | METR unreliable above 16 h; tracker stopped 8 Sep | metr-stopped | independent | [METR](https://metr.org/time-horizons/) | live | OK |
| rulers-break | 36% vs 0.4%, test vs real use (Claude Opus 5.5) | eval-awareness-36 | lab-reported | [Opus 5.5 system card](https://www-cdn.anthropic.com/fc1b44717c85dc068bc6ba5024219938094694bd/Claude%20Opus%205.5%20System%20Card.pdf) | live | OK. No tag on screen: the provenance chip should say Lab-reported · Anthropic |
| rulers-break | “Every model tested in this analysis attempted to cheat some of the time.” | aisi-cheat | independent | [UK AISI, 21 Jul](https://www.aisi.gov.uk/blog/cheating-behaviour-in-frontier-model-evaluations) | live | OK (verbatim) |
| breach | July 2026: OpenAI cyber evaluation, classifiers deliberately off, escaped sandbox, broke into Hugging Face | hf-intrusion | independent | [Hugging Face, 27 Jul](https://huggingface.co/blog/agent-intrusion-technical-timeline) | live | OK |
| breach | < 13 hours to cluster-admin on multiple internal clusters | hf-13-hours | independent | same | live | OK |
| breach | ~700 agents joined the attack (METR's count) | metr-700-agents | independent | [METR, 26 Aug](https://metr.org/blog/2026-08-26-openai-hugging-face-incident-investigation/) | live | OK. METR worked from OpenAI's data |
| breach | Apparently “an attempt to cheat the evaluation.” | hf-motive | independent | [Hugging Face](https://huggingface.co/blog/agent-intrusion-technical-timeline) | live | OK |
| recipe | Impossible task + safeguards off + internet on + “NEVER stop, NEVER give up” | incident-recipe | estimate | [Epoch, 13 Nov](https://epoch.ai/publications/incident-report-ai-agents-attempted-exploits-on-our-website) and three more in facts.json | live | Risk. Our synthesis; not every case had every ingredient (Trajectory's run kept safeguards on). Notes say so (D7) |
| recipe | “NEVER stop, NEVER give up” | never-give-up | independent | same | live | OK |
| power | 6,831 MW short of the reliability requirement: PJM, 2028/29 auction | pjm-shortfall | official | [PJM, 14 Jul](https://www.pjm.com/-/media/DotCom/about-pjm/newsroom/2026-releases/20260714-pjm-capacity-auction-procures-138318-mw-of-generation-resources.pdf) | live | OK |
| power | ≈ a third of Colombia's installed generating capacity | colombia-capacity | press | [Portafolio reporting XM, 27 Jul](https://www.portafolio.co/energia/embalses-llegan-a-minimos-historicos-y-xm-advierte-que-el-sistema-exigira-al-maximo-al-parque-termico-499064) | live | OK. 6,831 ÷ 21,681 = 31.5% (end-2025: 21,029 MW → 32.5%); kept (D3) |
| power | 38.2% of $16.4B in capacity charges from data-centre load | pjm-datacentre-382 | independent | [PJM market monitor, 27 Jul](https://www.pjm.com/-/media/DotCom/committees-groups/committees/mc/2026/20260727-web/item-02---marketing-monitoring-report---presentation.pdf) | live | OK |
| brazil | 16 Nov 2026 · US Commerce Department (BIS) rule | bis-rule-brazil | official | [Federal Register 2026-23529](https://public-inspection.federalregister.gov/2026-23529.pdf) | live | OK |
| brazil | Advanced AI chips bound for Brazil now need a US licence, except for US-headquartered buyers | bis-rule-brazil | official | same | live | Corrected (C4) |
| brazil | Also: Indonesia · Malaysia · Singapore · Thailand | bis-rule-brazil | official | same | live | OK |
| brazil | In force on publication in the Federal Register, scheduled for 19 Nov | bis-effective | official | same | live | OK. Re-check on show day |
| brazil | 72% of AI compute delivered since 2022 in the US; about 10% in China | compute-72-us | independent | [Epoch, 27 Oct](https://epoch.ai/latest/introducing-the-ai-chip-imports-explorer) | live | OK (customs-based estimate) |
| money | $105B combined run-rate, from about $30B early in the year | runrate-105 | lab-reported | [State of AI 2026](https://www.stateof.ai/) | live | OK |
| money | “ANT”: S-1 on 26 Oct; roadshow from 10 Nov | anthropic-s1 | official | [Anthropic, 26 Oct](https://www.anthropic.com/news/s1-sec) | live | OK |
| money | ~$720–740B hyperscaler 2026 capex guidance | capex-720 | secondary | [ValueAdd VC](https://valueaddvc.com/blog/big-tech-ai-capex-in-2025-microsoft-google-meta-amazon-and-the-spending-race) | doc | OK as labelled on screen (“Secondary · not checked against filings”) |
| adoption | 56.8% of US businesses paid for AI in October; +13.3 points in a year | ramp-568 | independent | [Ramp AI Index](https://ramp.com/data/ai-index) | live | OK. Ramp's sample, tagged on screen |
| adoption | +29% token volume in four weeks, while prices fell | ramp-volume-29 | independent | same | live | OK |
| adoption | The backlash against “tokenmaxxing”: usage is not results | tokenmaxxing | press | [eWeek](https://www.eweek.com/news/amazon-tokenmaxxing-ai-engineering-guidance/) | doc | Corrected (C5) |
| rules | EU AI Act since 2 Aug: disclose chatbots, label deepfakes | eu-ai-act-aug | official | [European Commission, 31 Jul](https://digital-strategy.ec.europa.eu/en/news/commission-starts-enforcing-ai-act-rules-and-new-transparency-requirements-2-august) | live | OK |
| rules | China since 15 Jul: companion AI must not foster emotional dependence | china-companion | official | [Xinhua, 15 Jul](https://www.news.cn/fortune/20260715/99e7098330ec47a18057250f31129f98/c.html) | live | OK |
| rules | US: chip access needs licences; agencies now say “Super Intelligence” | eo-14434, bis-rule-brazil | official | [EO 14434](https://www.govinfo.gov/content/pkg/FR-2026-10-02/html/2026-20321.htm) | live | OK |
| motor | Around 1900, factories bolted motors onto the old line shaft | david-dynamo | independent | [David 1990, JSTOR](https://www.jstor.org/stable/2006600) | live | OK (“group drive”, mid-1890s to about 1920) |
| motor | The big gains came decades later, when the floor was redesigned around the motor | david-dynamo | independent | same | live | OK (1920s; unit drive; single-storey layouts) |
| motor | The gains came from redesigning the work around the motor, not from adding the motor | david-dynamo | independent | same | live | Corrected (C6) |
| checkable | Cheap to check (code · proofs · reconciliations · forms) vs needs judgment (strategy · research · taste) | verification-inference | estimate | [Epoch, 17 Nov](https://epoch.ai/publications/how-good-are-fable-5-2-and-gpt-6-2-astra-at-real-work) | doc | OK. Tagged “Our reading of the evidence”; reconciliations and forms are our examples |
| roles | Callback “Judgement is the last job.” | dey-judgement | official | see last-job | live | OK |
| think-twice | About 13× cheaper a year | price-47-quarter | estimate | [State of AI 2026](https://www.stateof.ai/) | live | OK |
| think-twice | The leader depends on the ruler | aa-leaderboard, eci-tie-174, arena-text-carbon, arc-agi-3-standard | independent | see ruler | live | OK |
| think-twice | Most documented incidents share a recipe: internet on, safeguards off | incident-recipe | estimate | see recipe | live | Corrected (C7) |
| think-twice | Usage is not results | tokenmaxxing | press | see adoption | doc | OK (advice) |
| think-twice | The frontier moved almost a year in 11 weeks | eci-jump | independent | see year-in-weeks | live | OK (≈0.82 year) |
| callback | In 11 weeks, the frontier moved almost a year | eci-jump | independent | same | live | OK |
| x-voices, tabloids, news-tunnel | Post view counts and headlines | — (captures.json) | press | each capture's own URL | — | Open: not in facts.json; owned by the media teammate's captures.json, which should carry each URL, count and capture date |

Moments with no factual claims: opener (the fallback reuses facts.json release names and dates), title, question, and-yet, so-what, approach, roles (apart from the callback), first-move, close-line, end.

## Corrections log

| # | Moment | Before | After | Source | Reason |
|---|---|---|---|---|---|
| C1 | science | with a proof outline and 47 lemmas from earlier work | with a one-line proof sketch and 47 lemmas from earlier work | [Anthropic, footnote 4](https://www.anthropic.com/news/claude-fable-and-mythos-5-2) | The footnote says the agents got “a one-sentence sketch of the classical route”; “proof outline” misstated what they were given |
| C2 | twins | “…can find previously unknown security flaws…” | “…with the right tools and access, GPT-6 Astra can find previously unknown security flaws…” | [GPT-6 Astra system card](https://deploymentsafety.openai.com/gpt-6-astra) | The ellipsis cut the condition that limits OpenAI's claim |
| C3 | employee-bar | They kept their first attempt. | They mostly kept their first attempt. | [Epoch, 17 Nov](https://epoch.ai/publications/how-good-are-fable-5-2-and-gpt-6-2-astra-at-real-work) | Epoch: models “mostly relied on their first attempt” |
| C4 | brazil | Brazil is now on the US licence list for advanced AI chips. | Advanced AI chips bound for Brazil now need a US licence, except for US-headquartered buyers. | [Federal Register 2026-23529](https://public-inspection.federalregister.gov/2026-23529.pdf) | The rule adds a licence requirement for exports to five countries and exempts consignees headquartered (or whose parent is headquartered) in the US, if the exporter reports; “on the list” suggested a blanket listing |
| C5 | adoption | The backlash has a name, “tokenmaxxing”: usage is not results. | The backlash against “tokenmaxxing”: usage is not results. | [eWeek](https://www.eweek.com/news/amazon-tokenmaxxing-ai-engineering-guidance/); [Ramp](https://ramp.com/data/ai-index) | Tokenmaxxing is the practice the backlash is against, not the backlash's name |
| C6 | motor | Value goes to those who redesign the work, not to those who adopt the tool. | The gains came from redesigning the work around the motor, not from adding the motor. | [David 1990](https://www.jstor.org/stable/2006600) | The paper shows when aggregate productivity rose (with unit drive and redesigned plants), not which firms captured the value |
| C7 | think-twice | The documented incidents share a recipe: internet on, safeguards off. | Most documented incidents share a recipe: internet on, safeguards off. | [Epoch, 13 Nov](https://epoch.ai/publications/incident-report-ai-agents-attempted-exploits-on-our-website) | Trajectory's agents ran on a public model with active provider-side safeguards; three of the four cases had safeguards off |

Changes made by other teammates and checked here: the media teammate rewrote factory, slop, lean-harness, org, verification and last-job from the recordings; every number and quote in them matches the slide text or caption the media teammate recorded in `src/data/sf-stills.json` (fact-check did not re-watch the frames). Someone added barLabel/barNote to employee-bar; it is accurate. Fact ids no longer used were removed from facts.json: grokbot-unread, diff-10000, ramp-culture.

## Decisions

- **D1 Labels.** “Lab-reported” covers any company speaking about its own models or its own work (labs, and Ramp, Cognition, Amp, ZoomInfo and SpaceXSI on stage), because the allowed labels have no separate “company-reported”.
- **D2 Release count.** Rule: each new general-purpose (text or agentic) model, or same-day model family, counted once at its first release between 1 Sep and 17 Nov 2026, if the lab announced it in its own launch post, release notes, model table or system card; restricted twins released with the public model count once; wider rollouts, image/voice/video models and undated models are not counted. Result: Anthropic 5, Google 4, OpenAI 5 = 14. Our Google four (Gemini 3.8 Flash, 4 Argon, 4 Carbon, 4 Hydrogen) differ from our research notes' “four Gemini 4 milestones” so each model is counted once, as for the other labs. GPT-6.1 Terra (on leaderboards, no primary date) would make 15.
- **D3 Colombia line kept.** XM's own bulletin wasn't machine-readable; XM figures reported by Portafolio give 21,029 MW (end 2025) and 21,681 MW (July 2026), so 6,831 MW is 31–33%: “≈ a third” holds. PJM counts unforced capacity and XM net effective capacity, so it's an order-of-magnitude comparison.
- **D4 ARC-AGI-3 kept.** Confirmed on arcprize.org on 18 Nov; no swap to Arena WebDev needed.
- **D5 Show-day numbers.** Views and leaderboards were updated to 18 Nov readings; the re-check list below covers the 19 Nov morning.
- **D6 “Almost a year”.** 11.5 ECI points against a 14-a-year trend is 0.82 year; kept as rounding; notes say “about ten months”.
- **D7 Recipe slide kept.** It shows recurring ingredients, not a law; notes name the exception.
- **D8 checkedAt.** For doc-only facts, checkedAt is 17 Nov, the date our research notes read the page.

## Re-check on show day (19 Nov morning)

1. **YouTube views**, Lauren Tan: `yt-dlp -j --skip-download https://www.youtube.com/watch?v=O_zcc6Xl12g` → update slop.views and slop.asOf; also check it still leads Lydia Hallie's video (`vlfCjWuv4es`) before saying “most-watched”.
2. **Federal Register** 2026-23529 at https://www.federalregister.gov/d/2026-23529: if published on 19 Nov, the rule is in force and the brazil copy stands; if publication slipped, change “now need” to “will need” in brazil.line and update brazil.effective.
3. **Artificial Analysis** top three (65 / 62 / 60) and Kimi K3.1 Pro (46): https://artificialanalysis.ai/leaderboards/models
4. **Epoch hub** top ECI (174) and any revision of Fable 5.2's score: https://epoch.ai/benchmarks
5. **Arena text** top three (1526 / 1522 / 1511); GPT-6.2 Astra may now appear: https://arena.ai/leaderboard/text
6. **ARC-AGI-3** standard scores (81.2 / 70.3 / 65.1): https://arcprize.org/leaderboard
7. **Ramp AI Index** weekly token figures (−14.8%, +29%): https://ramp.com/data/ai-index
8. **New releases** on 18–19 Nov (for example xAI's Grok 4.8): the 14-release window ends 17 Nov and stays true, but “three labs share the frontier” should be re-read.
9. **METR time horizons**: still “last updated 8 Sep”? https://metr.org/time-horizons/
10. **X and press captures** (media): view counts as of capture date.


## Director's follow-up on open risks (18 Nov, 16:00)

- **year-in-weeks:** dropped the Artificial Analysis "58 → 65" comparison: it spans an index update, so part of the jump may be method, not progress. The moment now shows only Epoch's ECI (162.5 → 174 against a trend of about 14 points a year), with Epoch's own caveat.
- **twins:** the Google pair no longer says "vetted defenders only" (inferred). It now says what Google said: Gemini 4 Carbon for everyone since 10 Nov, released first to "a subset of cyber defenders".
- **recipe:** retitled "The recipe that keeps recurring": the ingredients recur across incidents; not every case had all four.

## ECI frontier history (18 Nov, 21:15, eci-data)

Added `src/data/eci-history.json` and fact `eci-history`. Updated `eci-trend-14` (same id).

- **Source.** Epoch's `eci_scores.csv`, updated 19 Nov 2026, on the current (Bayesian, 4 Nov) scale: https://epoch.ai/data/eci_scores.csv (linked from https://epoch.ai/eci). It has 257 models; the earliest is LLaMA-65B (24 Feb 2023). Every point was read twice, first in date slices and then row by row with its 90% interval, and both reads agreed.
- **Series.** 22 frontier highs, from GPT-4 (14 Mar 2023, 121.58) to GPT-6.2 Astra (17 Nov 2026, 174.17). The series starts at GPT-4, as Epoch's own trend analysis does.
- **Left out.**
  - GPT-4 Turbo (Nov 2023), 124.75: its date is ambiguous (Epoch says 25 Jan 2024).
  - GPT-5.3 Codex: a frontier point in the 1 Sep table, but absent from the 19 Nov file.
- **Trend.** Epoch's 4 Nov methodology note (https://epoch.ai/publications/eci-bayesian-methodology) gives 16.6 points a year for reasoning models (90% interval 14.6–18.7) and 8.0 before them (5.4–9.7). On the old method it gave 15.7 and 6.2; the 1 Sep fit gave 14 and 6. Our least-squares check on the 17 new-scale reasoning points gives 16.2–16.9, which matches.
- **Discrepancy 1, mixed scales (eci-jump, notes year-in-weeks).** "162.48 → 174" compares the old-method 1 Sep top with a new-method score. On one scale the 1 Sep table's top is Claude Opus 5 at 164.74 (Fable 5 is 164.21), so the rise is +9.43 to 174.17 in 77 days. At 16.6 a year that is about 7 months of trend, 2.7 times the pace; "almost a year" and "ten months" don't hold.
- **Discrepancy 2, the 11 Nov brief.** Read twice: it contains no "weeks", no "year of trend", no "162" and no "may change". It does say Fable 5.2 scored 174, "above what the pre-Astra trend for reasoning models would have predicted"; "The previous high was GPT-6 Astra's 169"; and "Fable's score is just one data point." The "may change" quote is from the hub's 9 Nov item (https://epoch.ai/benchmarks): "This is based on pre-launch testing using only our own benchmarks, and may change as more results become available."
- **Discrepancy 3 (eci-tie-174).** The CSV gives GPT-6.2 Astra 174.17 (170.29–178.58) and Fable 5.2 173.5 (170.09–177.36). Both round to 174 and their intervals overlap, so "tied" holds as a rounded, statistical tie.
- **Not edited (outside this task):** `notes.json` year-in-weeks lines 244–245 (still 162.5, 14 a year, "ten months").
- **eci-jump, replacing D6.** Another teammate moved it to one scale at 21:20: 164.74 (Claude Opus 5, top of the 1 Sep table, re-scored) to 174.17 (GPT-6.2 Astra, 17 Nov), +9.4, label independent.
  - At 21:30, at the director's request, I edited only its caveat. It now gives the conversion at both slopes: about 7 months of trend at 16.6 a year (current method) and about 8 at ~14 (1 Sep fit, earlier method).
  - The director's draft caveat credited "close to a year of trend" to Epoch's 11 Nov brief. A third read (every sentence with "year" or "trend") found no such phrase, so the caveat says the old 162.48 → 174 comparison was ours.
