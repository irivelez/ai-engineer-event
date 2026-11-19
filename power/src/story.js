// All stage evidence was checked through the morning of 19 November 2026, Bogotá.
export const scenes = [
  {
    id: 'cover', name: 'Opening', section: 'Electricity and the AI buildout', seconds: 18, dark: true,
    title: 'When does the <em>power arrive?</em>',
    intro: 'A field guide to the electricity behind AI, and the people committing to deliver it.',
    sourceLabel: 'IEA · World Energy Outlook 2026',
    sources: ['weo','integration'],
    script: 'Imagine the chips are on site, the racks are installed, and the grid connection is still years away. That is the question behind the AI power race. We can follow the electricity, then look at what three very different builders have actually secured.',
    finding: 'A data center needs electric power at its site when it operates. A national energy total, a purchase agreement and a working connection answer different questions.',
    method: 'The evidence cutoff is 19 November 2026 in Bogotá. The opening switch is a generated illustration. All equipment models in this companion are illustrative. The project facts and comparisons have separate sources.'
  },
  {
    id: 'flow', name: 'Grid to chip', section: 'How electricity reaches AI', seconds: 34, dark: true,
    title: 'The chips can be <em>ready first.</em>',
    intro: 'Power plants generate electricity. Lines carry it to a substation. At the data center, it runs the servers and removes their heat.',
    signal: [['1–3 years', 'to build a data center'], ['5–15 years', 'for new grid infrastructure']],
    sourceLabel: 'IEA · Electricity 2026', sources: ['delivery','grids','integration'],
    script: 'Follow the route from the power plant to the chip. A transmission line carries electricity. A substation changes the voltage so the site can use it. The chips use some electricity and cooling draws more. Here the calendars separate. The IEA puts a data-center build at one to three years. Planning, permitting and completing new grid infrastructure can take five to fifteen. An existing connection changes that equation.',
    finding: 'The IEA gives indicative build times of 1–3 years for data centers and 5–15 years for planning, permitting and completing new grid infrastructure.',
    method: 'These are comparative planning ranges. An individual project may use an existing connection, buy electricity through a regional grid, or secure direct supply. MW measure the rate of draw at a moment. A TWh measures electricity used over a period.'
  },
  {
    id: 'scale', name: 'Annual demand', section: 'The world · Annual electricity', seconds: 41, dark: false,
    title: 'Picture Brazil <em>and Mexico.</em>',
    intro: 'By 2030, the IEA projects that the world’s data centers will use about as much electricity in one year as Brazil and Mexico used together in 2025.',
    after: 'AI-optimized facilities drive about three-quarters of the projected increase.',
    sourceLabel: 'IEA · Brazil EPE · Proyectos México', sources: ['weo','weofull','brazil','mexico','cfe','ieasummary','alternative'],
    script: 'Picture everything that used electricity in Brazil and Mexico in 2025. Together, the two countries used 974 terawatt-hours. Now look at what the International Energy Agency projects for data centers worldwide in 2030 under stated policies. One thousand terawatt-hours. The bars almost match. That total includes ordinary cloud computing. The AI-specific signal is in the growth. The IEA attributes about three-quarters of the increase to facilities optimized for AI. The countries tell us the scale, and the scenario tells us what could happen.',
    finding: 'The IEA’s 19 November World Energy Outlook puts global data-center electricity use at just under 500 TWh in 2025 (rounded in the chart) and 1,000 TWh in 2030 in its Stated Policies Scenario. AI-optimized capacity drives around three-quarters of the increase. Its April report put the 2030 figure at 950 TWh. Gartner’s June forecast exceeded 1,200 TWh. The stage uses the November IEA outlook.',
    method: 'Brazil’s reported final electricity consumption was 667.8 TWh in 2025. Mexico reported 306.5 TWh. The sum is 974.3 TWh. Dividing 1,000 by 974.3 gives 102.6%. Each value covers a full year of electricity use. The 2030 number is a scenario for all data centers, including conventional uses such as storage. The AI share of growth describes additional demand between 2025 and 2030.'
  },
  {
    id: 'capacity', name: 'The grid gap', section: 'Eastern United States · Peak capacity', seconds: 38, dark: false,
    title: 'One grid came up <em>6,831 MW short.</em>',
    intro: 'PJM bought capacity for 2028–29. Even counting supply secured outside the auction, it fell short of its target for meeting peak demand with a safety margin.',
    quote: '“These auction results show that demand for electricity continues to grow faster than electricity supply.”',
    by: 'David Mills · PJM president and CEO',
    sourceLabel: 'PJM · Monitoring Analytics · Colombia XM', sources: ['pjm','pjmreport','marketmonitor','colombia'],
    script: 'Now switch units. We have been adding up electricity over a year. Here we are asking how much power a grid can count on at the busiest hour. PJM’s July auction and other commitments left it 6,831 megawatts below its reliability target for 2028–29. For scale, that gap is 57 percent of the peak that Colombia’s interconnected grid actually served in 2025. PJM cites growing data-center loads among the pressures. This is a gap against a future reserve target. It does not predict an outage.',
    finding: 'PJM reported 149,182 MW of accredited capacity from the auction and self-supply against a 156,013 MW reliability requirement. Its independent market monitor reports a 6,831.3 MW gap. PJM identifies new data-center load as one driver of the forecast.',
    method: 'Colombia’s XM recorded a 12,056.8 MW peak on its interconnected system on 26 November 2025. The ratio 6,831 ÷ 12,056.8 is 56.7%, rounded to 57%. This compares magnitudes in MW. The U.S. value measures a procurement gap against a peak-plus-reserves requirement. The Colombian value is measured demand. It gives scale and does not imply an outage, a Colombian shortage, or a gap caused entirely by AI.'
  },
  {
    id: 'solar', name: 'Power flowing', section: 'Zhongwei, China · Operating', seconds: 32, dark: true,
    title: 'Move the work <em>to the power.</em>',
    intro: 'In May 2026, a China Mobile facility began drawing power directly from a nearby solar farm. In a September pilot, operators shifted computing jobs inland to Zhongwei to use the midday sun.',
    stat: ['500 MW', 'solar farm capacity at rated output'],
    sourceLabel: 'Zhang Xu, China Mobile · State Grid', sources: ['chinaoperator','zhang','dispatch'],
    script: 'In Zhongwei, there is evidence of power already flowing. One China Mobile facility serving AI training, inference and other work began receiving electricity directly from a solar farm in May. The 500 megawatts describe the farm at rated output. In a separate September pilot, China Mobile and State Grid shifted computing jobs from the coast to Zhongwei at midday. They moved demand to where generation was available.',
    finding: 'China Datang reported that its 500 MW solar plant entered service on 2 May 2026. China Mobile engineer Zhang Xu described one Zhongwei facility receiving direct supply. State Grid later reported a pilot that shifted computing jobs from Fuzhou and Xiamen to Zhongwei on 16 September.',
    method: '500 MW is the solar plant’s rated capacity. Its output varies with sunlight, and the facility’s metered draw was not disclosed. The early operating report covers a mix of computing work. The September pilot did not specify the size of the shifted load or classify those particular jobs as AI.'
  },
  {
    id: 'contract', name: 'Power contracted', section: 'Pennsylvania, United States · Contract signed', seconds: 39, dark: false,
    title: 'Microsoft signed <em>for 20 years.</em>',
    intro: 'The deal backs the restart of Three Mile Island Unit 1. Constellation aims to return 835 MW to the regional grid in 2027, subject to approvals.',
    after: 'Some grid upgrades initially carried dates as late as 2030. Transferring existing connection rights gave the plant another route.',
    sourceLabel: 'Constellation · SEC filings · U.S. NRC', sources: ['cranesign','cranefiling','cranestatus','nrc','geothermal'],
    script: 'Microsoft made a different bet. Its twenty-year purchase agreement supports restarting a reactor in Pennsylvania. The details tell us more than the announcement. Some grid upgrades initially had delivery dates as late as December 2030. In June 2026, the regulator approved moving existing connection rights from another plant, and Constellation transferred them. Its target is now 2027. The contract is signed, the grid rights have moved, and the restart still needs approvals.',
    finding: 'Microsoft agreed to buy the output to match its data centers’ consumption in the PJM region. Constellation’s SEC filing records the transferred interconnection rights. Microsoft energy VP Bobby Hollis described the agreement as part of its regional grid strategy. Constellation identifies 835 MW and a 2027 restart target. The NRC issued its environmental finding in September 2026.',
    method: 'The electricity would enter the regional grid. The earlier December 2030 dates applied to some contingent upgrades, rather than a fixed opening date for the reactor. The sponsor’s 2027 target remains conditional. Another signed commitment is Google’s Utah geothermal agreement with Fervo, for 396 MW in four increments beginning in Q3 2028 under the agreement.'
  },
  {
    id: 'orbit', name: 'Power in orbit', section: 'SpaceX · Equipment ordered', seconds: 33, dark: true,
    title: 'Musk wants the <em>chips in orbit.</em>',
    intro: 'SpaceX proposes running AI on solar-powered satellites and sending the data back to Earth. Its supplier expects to deliver the first solar-cell manufacturing line in Texas in the first half of 2027.',
    stat: ['€60M+', 'value of the first manufacturing line'],
    sourceLabel: 'SpaceX · SINGULUS · November 2026', sources: ['orbitdesign','order','singulus','fcc'],
    script: 'Elon Musk’s space proposal is often misunderstood. The solar panels and the processors would travel together. The electricity would power computing in orbit, and the results would come back as data. We can already point to a purchase. In November, supplier SINGULUS disclosed an order worth over sixty million euros for the first solar-cell production line. Equipment delivery is scheduled for the first half of 2027. That date belongs to the machinery on Earth. Orbital computing at scale remains a proposal.',
    finding: 'SpaceX describes solar-powered AI processors in orbit linked to terrestrial ground stations for data. SINGULUS disclosed more than €60 million for the first line and planned equipment delivery in the first half of 2027. SpaceX executive Mike Nicolls identifies the Texas line as a manufacturing path for Starmind solar cells.',
    method: 'The order is evidence of a manufacturing commitment. The planned delivery date is for the terrestrial equipment. No orbital generating capacity, grid electricity beamed to Earth, or operational constellation is counted here. The FCC filing describes the scale SpaceX requested.'
  },
  {
    id: 'close', name: 'The decision', section: 'Reading the commitment', seconds: 20, dark: true,
    title: 'Ask for the <em>connection date.</em>',
    intro: 'In the U.S., the IEA expects most planned on-site gas power for data centers to come online in the 2030s. The limiting factor is the backlog for turbines.',
    after: 'For each AI project, ask who has signed, where it will connect, and when it can run.',
    sourceLabel: 'IEA · World Energy Outlook 2026', sources: ['weofull','integration','zhang','cranefiling','order'],
    script: 'The commitments are real. So are the delays. In the United States, turbine backlogs push most planned on-site gas generation for data centers into the 2030s. For the next AI expansion, ask who has signed, where the power will arrive, and when the site can run.',
    finding: 'The IEA counted around 180 GW of planned U.S. on-site gas-fired capacity for data centers as of August 2026 and expects most of it in the 2030s because turbine suppliers have backlogs. The selected cases document different milestones. Zhongwei has operating evidence. Microsoft’s regional purchase has a conditional restart target. SpaceX has ordered factory equipment for a planned orbital system.',
    method: 'These cases illustrate delivery mechanisms and their timing. They cannot be added into one capacity total or used to settle whether worldwide supply will meet a global forecast. The closing switch is an illustration of a circuit closing.'
  }
];

export const routeSteps = [
  ['Generate', 'A power plant produces electricity.'],
  ['Connect', 'Lines carry power. A substation adjusts the voltage.'],
  ['Compute', 'Server racks use electricity. Cooling carries heat away.']
];

// Publisher, document, date or location within document, direct primary link.
export const sources = {
  delivery: ['U.S. Energy Information Administration', 'How electricity is delivered to consumers', 'Electricity explained · Transmission and distribution', 'https://www.eia.gov/energyexplained/electricity/delivery-to-consumers.php'],
  grids: ['International Energy Agency', 'Electricity 2026 · Grids', '2026 · Compare grid and data-center development times', 'https://www.iea.org/reports/electricity-2026/grids'],
  integration: ['International Energy Agency', 'Powering Artificial Intelligence', 'October 2026 · Executive summary on local grid connections and flexibility', 'https://www.iea.org/reports/powering-artificial-intelligence/executive-summary'],
  ieasummary: ['International Energy Agency', 'Key Questions on Energy and AI', 'April 2026 · Central estimate for worldwide data centers', 'https://www.iea.org/reports/key-questions-on-energy-and-ai/executive-summary'],
  weo: ['International Energy Agency', 'World Energy Outlook 2026 · Overview and key findings', '19 November 2026 · Global electricity consumption by data centers in the Stated Policies Scenario', 'https://www.iea.org/reports/world-energy-outlook-2026/overview-and-key-findings'],
  weofull: ['International Energy Agency', 'World Energy Outlook 2026 · Full report', '19 November 2026 · Section 1.10, figures 1.36–1.37, and box 3.5. Growth attributable to AI, on-site gas plans, equipment backlogs and estimated baseline.', 'https://www.iea.org/files/9bd739f6-e4c8-4d09-902b-4e1eb7eb083f/WorldEnergyOutlook2026.pdf#page=82'],
  brazil: ['Empresa de Pesquisa Energética, Brazil', 'Brazilian Energy Balance 2026', '2025 final electricity consumption · Summary report, p. 38', 'https://www.epe.gov.br/sites-pt/publicacoes-dados-abertos/publicacoes/PublicacoesArquivos/publicacao-975/topico-847/BEN_S%C3%ADntese_2026_EN.pdf#page=38'],
  mexico: ['Proyectos México / Banobras', 'Electricity · Consumption', '2025 final electricity consumption, including remote self-supply', 'https://www.proyectosmexico.gob.mx/en/how-mexican-infrastructure/investment-cycle/electricity/'],
  cfe: ['Comisión Federal de Electricidad, Mexico', 'Consumo final de energía eléctrica', 'Official series and definition · 2016–2025', 'https://www.datos.gob.mx/es/dataset/consumo_final_energia_electrica'],
  alternative: ['Gartner', 'Data center electricity demand forecast', '10 June 2026 · Independent commercial forecast and methodology', 'https://www.gartner.com/en/newsroom/press-releases/2026-06-10-gartner-says-data-center-electricity-demand-to-grow-26-percent-in-2026'],
  pjm: ['PJM Interconnection', '2028/29 capacity auction results', '14 July 2026 · Procurement, reliability requirement and David Mills’s remarks', 'https://insidelines.pjm.com/pjm-capacity-auction-procures-138318-mw-of-generation-resources-as-work-continues-to-address-growing-electricity-demand/'],
  pjmreport: ['PJM Interconnection', '2028/2029 Base Residual Auction Report', '14 July 2026 · Results and reliability requirement', 'https://www.pjm.com/-/media/DotCom/markets-ops/rpm/rpm-auction-info/2028-2029/2028-2029-bra-results-report.pdf'],
  marketmonitor: ['Monitoring Analytics', '2026 Quarterly State of the Market Report for PJM', '12 November 2026 · Independent market monitor, January–September report', 'https://www.monitoringanalytics.com/reports/PJM_State_of_the_Market/2026/2026q3-som-pjm.pdf'],
  colombia: ['XM, Colombia’s grid operator', 'Electricity demand in 2025', 'December 2025 report · 26 November national interconnected-system peak', 'https://www.xm.com.co/noticias/8664-en-diciembre-la-demanda-de-energia-en-colombia-aumento-403-en-comparacion-con-el'],
  chinaoperator: ['China Datang / National Energy Administration', 'Zhongwei solar plant enters service', '6 May 2026 · Operator account, Northwest Energy Regulatory Bureau', 'https://xbj.nea.gov.cn/dtyw/hyxx/202605/t20260506_300641.html'],
  zhang: ['China Mobile / Xinhua', 'Powering China’s computing hubs with green electricity', '19 August 2026 · Zhang Xu interview, published by the National Energy Administration', 'https://obor.nea.gov.cn/detail2/23115.html'],
  dispatch: ['State Grid Corporation of China', 'Cross-region computing and electricity pilot', '22 September 2026 · Operating report on the 16 September dispatch', 'https://wap.sasac.gov.cn/n2588025/n2588124/c35963691/content.html'],
  cranesign: ['Constellation Energy / Microsoft', 'Agreement to restart Three Mile Island Unit 1', '20 September 2024 · Announcement filed with the U.S. SEC', 'https://www.sec.gov/Archives/edgar/data/1168165/000186827524000058/ceg-202409208kexh991.htm'],
  cranefiling: ['Constellation Energy', 'Quarterly report to the U.S. SEC', '9 November 2026 · Note 3, Capacity Interconnection Rights', 'https://www.sec.gov/Archives/edgar/data/1168165/000186827526000119/ceg-20260930.htm'],
  cranestatus: ['Constellation Energy', 'Crane Clean Energy Center', 'Operator’s 835 MW estimate and 2027 target · Path to Restart', 'https://www.constellationenergy.com/about/locations/crane-clean-energy-center.html'],
  nrc: ['U.S. Nuclear Regulatory Commission', 'Crane Clean Energy Center environmental assessment', '25 September 2026 · Final environmental assessment and finding', 'https://www.govinfo.gov/content/pkg/FR-2026-09-25/html/2026-19603.htm'],
  geothermal: ['Fervo Energy / Google', 'Utah geothermal purchase agreement', '1 September 2026 · U.S. SEC Form 8-K, Item 8.01', 'https://www.sec.gov/Archives/edgar/data/1853868/000162828026059707/frvo-20260826.htm'],
  orbitdesign: ['SpaceX', 'AI compute satellite design', 'June 2026 · Investor presentation, pp. 108–110, filed with the U.S. SEC', 'https://www.sec.gov/Archives/edgar/data/1181412/000162828026041013/japanfwp_06042026.htm'],
  order: ['SINGULUS Technologies', 'Interim report Q3 2026', 'November 2026 · First-line contract value and expected delivery, p. 3', 'https://www.singulus.com/wp-content/uploads/2026/11/Singulus-Technologies_Q3-Report-26_EN.pdf#page=3'],
  singulus: ['SINGULUS Technologies / SpaceX', 'Solar-cell manufacturing equipment contract', '10 November 2026 · Details of the line and Mike Nicolls’s remarks', 'https://www.singulus.com/2026/11/10/spacex-heterojunction-solar-cells-singulus/'],
  fcc: ['U.S. Federal Communications Commission', 'SpaceX Orbital Data Center system application', 'Public Notice DA 26-113 · Application accepted for filing and comment', 'https://docs.fcc.gov/public/attachments/DA-26-113A1.pdf']
};
