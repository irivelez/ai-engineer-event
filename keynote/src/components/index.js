// DOM component kit (owner: DD). The engine passes this module as ctx.components.
// Each component: X.create(opts) → { el, in(tl?, at?), out(tl?, at?), set(state, { animate }), destroy() }.
// API, examples and rules: docs/design-system.md.
import Headline from './Headline.js';
import ActTitle from './ActTitle.js';
import Kicker from './Kicker.js';
import BigNumber from './BigNumber.js';
import ProvenanceChip from './ProvenanceChip.js';
import SourceLine from './SourceLine.js';
import Quote from './Quote.js';
import CaptureCard from './CaptureCard.js';
import BarChart from './BarChart.js';
import BeforeAfter from './BeforeAfter.js';
import StepList from './StepList.js';
import Scrim, { scrim, scrimBackground } from './Scrim.js';
import EvidenceVideo from './EvidenceVideo.js';
import EvidenceDoc from './EvidenceDoc.js';
import SourceQR from './SourceQR.js';

export { setRenderMode, isRender } from './_core.js';
export { chipHTML } from './ProvenanceChip.js';
export { qrSVG, shortUrl } from './SourceQR.js';
export { evidenceSound } from './EvidenceVideo.js';
export { fmtDate } from './_evidence.js';
export {
  Headline, ActTitle, Kicker, BigNumber, ProvenanceChip, SourceLine, Quote, CaptureCard,
  BarChart, BeforeAfter, StepList, Scrim, scrim, scrimBackground,
  EvidenceVideo, EvidenceDoc, SourceQR,
};
