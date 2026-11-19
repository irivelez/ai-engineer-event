# When does the power arrive?

Irina Vélez presents this 4 minute 15 second companion to [Inside the AI Frontier](https://inside-the-ai-frontier.vercel.app/) for a Latin American business audience. It follows electricity from a power plant to a chip, puts the scale in terms of Brazil, Mexico and Colombia, and examines what three builders have secured. Reporting is current through 19 November 2026, Bogotá.

## Presentation files

| File | Use |
| --- | --- |
| [Interactive keynote](index.html) | Open locally in a browser. Play starts the timed presentation. The arrow keys advance it live, F enters fullscreen, S opens the sources for the current chapter, and N shows the speaker’s script. The graphics and typefaces are embedded for offline use. |
| [1080p film](when-does-the-power-arrive.mp4) | Insert into the host keynote and speak over the silent film. Its eight chapter changes match the timecodes in the script. |
| [Speaker notes](speaker-notes.pdf) | Two printable pages with timecodes, narration and clickable primary sources. |
| [Three frames from the presentation](preview.jpg) | Opening, the annual electricity comparison and the orbital computing proposal. |

## Production team

| Role | Owner | Work delivered |
| --- | --- | --- |
| Editorial and production lead | Codex coordinator | Read the host keynote, compared the research, verified the calculations, selected the stories and built the interactive stage, controls and source drawers. |
| Electricity research | electricity_scale | Checked the IEA baseline and projections against country electricity balances and identified a comparable Colombian peak. |
| Commitments research | power_commitments | Traced operating evidence, contracts, remaining approvals and proposed delivery dates to company, regulator and grid-operator records. |
| Creative director | creative_director | Directed the copper switch opening, dark machinery scenes, light statistical scenes and narrative pacing. |
| Data visualization and 3D | data_art | Created the charts and animated Three.js illustrations of grid equipment, solar generation, orbital computing and a closing switch. Checked the visual layouts at mobile sizes. |
| Film production | film_export | Rendered the eight chapters as a 1920 × 1080 film and checked chapter timing, motion and full-file playback. |

The two researchers worked independently. The editorial lead checked their source documents before releasing the claims to design. The visual artist and film producer then worked from a common [chapter script and reference list](src/story.js). All three presentation formats use the same eight chapter timings.

## Editorial checks

- **Annual electricity.** The November IEA Stated Policies Scenario puts worldwide data centers at 1,000 TWh in 2030. Brazil consumed 667.8 TWh in 2025 and Mexico consumed 306.5 TWh. The 974.3 TWh comparison uses national final electricity consumption over a full year. The IEA attributes roughly three-quarters of the projected increase to facilities optimized for AI. Its April forecast was lower. The source drawer records both dates and a separate industry forecast. [IEA November report](https://www.iea.org/files/9bd739f6-e4c8-4d09-902b-4e1eb7eb083f/WorldEnergyOutlook2026.pdf#page=82) · [Brazilian Energy Balance](https://www.epe.gov.br/sites-pt/publicacoes-dados-abertos/publicacoes/PublicacoesArquivos/publicacao-975/topico-847/BEN_S%C3%ADntese_2026_EN.pdf#page=38) · [Mexico electricity balance](https://www.proyectosmexico.gob.mx/en/how-mexican-infrastructure/investment-cycle/electricity/)
- **Peak power.** PJM reported a shortfall against its future reliability requirement. Its 6,831 MW is equivalent in size to 56.7% of the 12,056.8 MW peak Colombia’s interconnected system served in 2025. The sources distinguish a procurement gap from an outage forecast. [PJM auction results](https://www.pjm.com/-/media/DotCom/markets-ops/rpm/rpm-auction-info/2028-2029/2028-2029-bra-results-report.pdf) · [XM demand report](https://www.xm.com.co/noticias/8664-en-diciembre-la-demanda-de-energia-en-colombia-aumento-403-en-comparacion-con-el)
- **Delivery evidence.** Zhongwei has evidence of electricity flowing and a separate computing dispatch pilot. Microsoft has a signed purchase, transferred connection rights and a conditional 2027 reactor restart target. The first delivery in SpaceX’s solar-cell manufacturing order is equipment for a factory in Texas. The Zhongwei facility’s metered draw, the reactor’s actual restart date and the date of orbital service remain unverified. [China Mobile operating account](https://obor.nea.gov.cn/detail2/23115.html) · [Constellation SEC filing](https://www.sec.gov/Archives/edgar/data/1168165/000186827526000119/ceg-20260930.htm) · [SINGULUS supplier report](https://www.singulus.com/wp-content/uploads/2026/11/Singulus-Technologies_Q3-Report-26_EN.pdf#page=3)

## Build and verification

Run `npm ci` followed by `npm run build` in this directory to rebuild [the standalone HTML](index.html). The [build script](build.mjs) embeds the JS, styles, fonts, artwork and local fallback stills. The opening image and 3D equipment are illustrations.

The interaction check covered all eight chapters, the three selectable stops on the electricity route, keyboard navigation, links into individual chapters, sources, notes, reduced motion, fallback artwork, replay and a full 255-second run without network assets. The encodes were checked at the eight chapter boundaries and decoded end to end.
