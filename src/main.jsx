import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const seedIncidents = [
  {
    id: 'SG-2481', title: 'Conveyor bearing overheating', site: 'North Quarry', area: 'Primary crushing · Line 2',
    category: 'Mechanical', asset: 'CV-04', date: '2026-10-18', severity: 'High', status: 'Under investigation',
    owner: 'Jamie Carter', symptoms: 'Drive-end bearing running hot, vibration increasing, unusual rumbling noise.',
    description: 'Temperature alarm triggered during afternoon shift. The drive-end bearing was hotter than normal and vibration had increased.',
    immediate: 'Isolated conveyor for inspection; shift supervisor notified.', previous: 'Bearing lubricated and conveyor restarted after temperature reduced.',
    impact: 'Line 2 paused for 35 minutes. No injuries reported.', corrective: 'Lubricated bearing; restarted conveyor after cool-down.',
    outcome: 'Temperature returned to normal for the remainder of that shift. Longer-term bearing condition was not recorded.',
  },
  {
    id: 'SG-2416', title: 'Drive-end bearing temperature elevated', site: 'North Quarry', area: 'Primary crushing · Line 2',
    category: 'Mechanical', asset: 'CV-04', date: '2026-09-29', severity: 'Medium', status: 'Closed',
    owner: 'Morgan Reed', symptoms: 'Bearing temperature elevated; intermittent vibration at drive end.',
    description: 'Operator reported a warm bearing housing and intermittent vibration during a routine walk-round.',
    immediate: 'Load reduced and maintenance team informed.', previous: 'Not known at time of report.',
    impact: 'Briefly reduced throughput. No injuries reported.', corrective: 'Lubricated bearing and restarted after temperature reduced.',
    outcome: 'Normal operation reported at the end of the shift. No follow-up condition check recorded.',
  },
  {
    id: 'SG-2469', title: 'Hydraulic oil leak at boom hose', site: 'Riverside Build Site', area: 'Earthworks · Zone C',
    category: 'Hydraulic', asset: 'EX-12', date: '2026-10-14', severity: 'High', status: 'Under investigation',
    owner: 'Priya Shah', symptoms: 'Hydraulic oil visible near boom hose coupling; pressure loss while slewing.',
    description: 'A leak was observed at the excavator boom hose connection during earthworks.',
    immediate: 'Machine parked and isolated; spill kit used to contain visible oil.', previous: 'Hose coupling resealed and pressure-tested after a reported leak.',
    impact: 'Excavator unavailable for approximately 50 minutes. No injuries reported.',
    corrective: 'Coupling resealed and machine returned to service after pressure test.',
    outcome: 'No leak noted immediately after the test; later operating hours were not recorded.',
  },
  {
    id: 'SG-2398', title: 'Hydraulic hose coupling leak', site: 'Riverside Build Site', area: 'Earthworks · Zone C',
    category: 'Hydraulic', asset: 'EX-12', date: '2026-08-21', severity: 'Medium', status: 'Closed',
    owner: 'Alex Morgan', symptoms: 'Hydraulic oil seepage around boom hose coupling.',
    description: 'Operator identified oil seepage during pre-use checks and reported it to the plant team.',
    immediate: 'Machine taken out of use pending inspection.', previous: 'Not known at time of report.',
    impact: 'Short delay to earthworks. No injuries reported.',
    corrective: 'Coupling resealed; area cleaned and pressure test completed.',
    outcome: 'No leak noted immediately after testing. No later inspection result recorded.',
  },
  {
    id: 'SG-2455', title: 'Pedestrian–plant near miss at access route', site: 'Westmoor Processing Plant', area: 'Vehicle route · Gate 3',
    category: 'Safety', asset: 'SITE-ROUTE-03', date: '2026-10-11', severity: 'High', status: 'Under investigation',
    owner: 'Taylor Evans', symptoms: 'Pedestrian and reversing vehicle came into close proximity at the access route.',
    description: 'A near miss was reported at the Gate 3 vehicle route. No contact or injury was reported.',
    immediate: 'Activity paused; supervisor informed and route users briefed.',
    previous: 'No relevant earlier record identified in the demonstration dataset.',
    impact: 'Near miss only; no injury reported.',
    corrective: 'Initial briefing completed; formal investigation and route review remain outstanding.',
    outcome: 'Follow-up effectiveness has not yet been verified.',
  },
  {
    id: 'SG-2432', title: 'Screen deck guard loosened', site: 'North Quarry', area: 'Screening · Deck 1',
    category: 'Safety', asset: 'SC-01', date: '2026-10-06', severity: 'Medium', status: 'Action required',
    owner: 'Jamie Carter', symptoms: 'Loose guard fastener noticed during a planned inspection.',
    description: 'A screen deck guard fastener was found loose during inspection.',
    immediate: 'Area access restricted and maintenance team contacted.',
    previous: 'Not known at time of report.', impact: 'Inspection delay only. No injuries reported.',
    corrective: 'Fastener replaced and guard checked by maintenance.',
    outcome: 'Guard check recorded on the same shift; longer-term checks not recorded.',
  },
];

const categories = ['Mechanical', 'Hydraulic', 'Safety', 'Electrical', 'Operational'];
const defaultReportDraft = {
  site: 'North Quarry',
  area: 'Primary crushing · Line 2',
  date: '2026-10-22T10:15',
  category: 'Mechanical',
  asset: 'CV-04',
  severity: 'High',
  title: 'Conveyor bearing overheating',
  description: 'Drive-end bearing temperature alarm triggered during the afternoon shift. The bearing was hotter than normal and vibration had increased. Conveyor isolated for inspection; no injuries reported.',
  symptoms: 'Drive-end bearing running hot, vibration increasing, unusual rumbling noise.',
  immediate: 'Conveyor isolated for inspection and shift supervisor notified.',
  previous: 'Previous report recorded lubrication and restart after the temperature reduced. Longer-term bearing condition was not recorded.',
  impact: 'Line 2 paused for inspection. No injuries reported.',
};

function readSessionValue(key, fallback) {
  try {
    const value = window.sessionStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(`Unable to read demo session data for "${key}".`, error);
    return fallback;
  }
}

function persistSessionValue(key, value) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Unable to save demo session data for "${key}".`, error);
  }
}

function readThemePreference() {
  try {
    const preference = window.localStorage.getItem('siteguard.theme');
    if (preference === 'dark' || preference === 'light') return preference === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (error) {
    console.error('Unable to read the saved theme preference.', error);
    return false;
  }
}

function persistThemePreference(dark) {
  try {
    window.localStorage.setItem('siteguard.theme', dark ? 'dark' : 'light');
  } catch (error) {
    console.error('Unable to save the theme preference.', error);
  }
}

function suggestedFollowUpAction(incident) {
  if (incident.asset === 'CV-04') return 'Review the CV-04 drive-end bearing inspection, lubrication, and vibration records; document verified findings and any recommended corrective action.';
  if (incident.asset === 'EX-12') return 'Review the hose coupling inspection and pressure-test records; document verified findings and any required follow-up check.';
  if (incident.asset === 'SITE-ROUTE-03') return 'Review the near-miss account and vehicle-route controls; document verified findings and any agreed follow-up.';
  if (incident.asset === 'SC-01') return 'Review the guard inspection and repair records; document the verified condition and any required follow-up check.';
  return `Review the ${incident.asset} inspection and maintenance records; document verified findings and any recommended action.`;
}

function isUnassignedFollowUp(task) {
  return !task.owner?.trim() || task.owner.trim().toLowerCase() === 'unassigned';
}

function createFollowUpTasks(incidents) {
  return incidents.map((incident) => ({
    id: `follow-up-${incident.id}`,
    incidentId: incident.id,
    action: suggestedFollowUpAction(incident),
    owner: incident.owner,
    dueDate: '',
    status: 'Not scheduled',
    effectiveness: 'Not verified',
  }));
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const navItems = [
  { id: 'dashboard', label: 'Overview', icon: 'grid' },
  { id: 'register', label: 'Incident register', icon: 'list' },
  { id: 'follow-up', label: 'Follow-up tracker', icon: 'check' },
  { id: 'recurrence', label: 'Recurrence intelligence', icon: 'repeat' },
  { id: 'assistant', label: 'AI Assistant', icon: 'assistant' },
];
const pageIds = new Set(['dashboard', 'register', 'follow-up', 'recurrence', 'assistant', 'report', 'analyzing', 'analysis']);

function pageFromLocation() {
  const page = window.location.hash.slice(1).split('/')[0];
  return pageIds.has(page) ? page : 'dashboard';
}

function incidentIdFromLocation() {
  const [, incidentId] = window.location.hash.slice(1).split('/');
  return incidentId ? decodeURIComponent(incidentId) : '';
}

function createSuggestions(incident, matches) {
  const priorIds = matches.map(({ incident: prior }) => prior.id);
  if (incident.asset === 'CV-04') {
    return [
      { id: 'bearing-lubrication', title: 'Check lubrication adequacy and bearing condition', evidence: priorIds.length ? `Earlier reports ${priorIds.join(', ')} record lubrication and temporary temperature recovery, but no long-term condition check.` : 'Reported overheating, increasing vibration and unusual rumbling at the drive-end bearing.', inspection: 'With the conveyor safely isolated, verify lubricant type, quantity and delivery; inspect bearing condition using approved procedures.', action: 'Record findings and agree any repair or monitoring plan with competent maintenance staff.' },
      { id: 'alignment-contamination-load', title: 'Inspect alignment, contamination and loading', evidence: priorIds.length ? `The previous records do not document checks for alignment, ingress or operating load.` : 'The reported heat and vibration can have multiple possible contributors; none is confirmed by this record.', inspection: 'Check alignment, contamination / ingress and operating load following site procedures.', action: 'Correct verified issues and document a follow-up effectiveness check.' },
      { id: 'effectiveness-follow-up', title: 'Verify effectiveness after any maintenance', evidence: 'Historical outcome notes report short-term normal operation; longer-term effectiveness is not recorded.', inspection: 'Review work orders and trend approved temperature / vibration observations after maintenance.', action: 'Set a competent-person follow-up and record results; do not use this suggestion to authorise restart.' },
    ];
  }
  if (incident.asset === 'EX-12') {
    return [
      { id: 'verify-repair', title: 'Verify the previous repair and inspect seals and hoses', evidence: priorIds.length ? `Earlier report ${priorIds.join(', ')} records a coupling reseal and an immediate pressure test; subsequent operating hours are not recorded.` : 'The report describes visible hydraulic oil near the boom hose coupling and pressure loss while slewing.', inspection: 'Safely isolate the machine and have competent maintenance staff inspect the coupling, relevant seals and hose condition.', action: 'Repair or replace only verified defects using approved parts and procedures.' },
      { id: 'leak-follow-up', title: 'Check for recurrence and confirm containment', evidence: 'The earlier record says no leak was seen immediately after testing; longer-term leak recurrence is not established.', inspection: 'Check the current leak condition and spill containment using site procedures; review the repair test record.', action: 'Document the verified test and a follow-up inspection outcome.' },
    ];
  }
  if (incident.category === 'Safety') {
    return [
      { id: 'route-controls', title: 'Review vehicle–pedestrian separation and route controls', evidence: incident.symptoms || incident.description, inspection: 'A competent site lead should review sightlines, reversing controls, segregation, signage and any changes in site activity.', action: 'Agree and record proportionate route controls based on verified findings.' },
      { id: 'accounts-evidence', title: 'Gather accounts and preserve relevant evidence', evidence: 'The report records a near miss; it states no contact or injury was reported. No contributing cause is established.', inspection: 'Speak with involved people, check relevant records and preserve available evidence promptly.', action: 'Document findings and assign any follow-up through site safety procedures.' },
    ];
  }
  return [
    { id: 'verify-observations', title: 'Verify the reported symptoms and immediate controls', evidence: incident.symptoms || incident.description, inspection: 'Confirm observations with the reporter and review applicable isolation, permit and inspection requirements.', action: 'Record verified findings before selecting corrective measures.' },
    { id: 'review-context', title: 'Review operating context and recent changes', evidence: 'No root cause has been confirmed in the submitted report.', inspection: 'A competent person should review operating conditions, recent changes and relevant inspection records.', action: 'Document confirmed contributing factors and proportionate next steps.' },
  ];
}

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
    repeat: <><path d="m17 2 4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11" /><path d="m9 12 2 2 4-4" /></>,
    alert: <><path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 4h.01" /></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    clip: <><path d="m21.4 11.6-8.5 8.5a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7L9.9 17.5a2 2 0 0 1-2.8-2.8l8.5-8.5" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    moon: <><path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    assistant: <><path d="M12 3v3m-5 2h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3Z" /><path d="M9 13h.01M15 13h.01M9 17h6" /><path d="M3 12H2m20 0h-1" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.grid}</svg>;
}

function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function severityTone(severity) {
  return severity === 'High' ? 'red' : severity === 'Medium' ? 'amber' : 'green';
}

function statusTone(status) {
  return status === 'Closed' ? 'green' : status === 'Action required' ? 'amber' : 'blue';
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function findMatches(incident, incidents) {
  const symptomWords = new Set(`${incident.symptoms || ''} ${incident.description || ''}`.toLowerCase().match(/[a-z]{4,}/g) || []);
  return incidents
    .filter((item) => item.id !== incident.id)
    .map((item) => {
      let score = 0;
      const reasons = [];
      if (item.site.toLowerCase() === incident.site.toLowerCase()) { score += 2; reasons.push('Same site'); }
      if (item.asset.toLowerCase() === incident.asset.toLowerCase()) { score += 3; reasons.push('Same asset'); }
      if (item.category === incident.category) { score += 2; reasons.push('Same category'); }
      const earlierWords = new Set(`${item.symptoms} ${item.description}`.toLowerCase().match(/[a-z]{4,}/g) || []);
      const overlap = [...symptomWords].filter((word) => earlierWords.has(word)).length;
      if (overlap >= 2) { score += 1; reasons.push('Overlapping symptom terms'); }
      return { incident: item, score, reasons };
    })
    .filter((match) => match.score >= 5)
    .sort((a, b) => b.score - a.score || b.incident.date.localeCompare(a.incident.date));
}

function answerKnowledgeBase(question, incidents) {
  const text = question.toLowerCase();
  const countsBy = (key) => [...incidents.reduce((counts, incident) => counts.set(incident[key], (counts.get(incident[key]) || 0) + 1), new Map())]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const siteCounts = countsBy('site');
  const categoryCounts = countsBy('category');
  const sourceIds = [];
  let answer;

  if (text.includes('recurr') || text.includes('repeat') || text.includes('again') || text.includes('more than once') || text.includes('happened more')) {
    const groups = new Map();
    incidents.forEach((incident) => {
      const key = `${incident.site}|${incident.asset}|${incident.category}`;
      groups.set(key, [...(groups.get(key) || []), incident]);
    });
    const repeats = [...groups.values()].filter((group) => group.length > 1).sort((a, b) => b.length - a.length);
    if (!repeats.length) {
      answer = 'There are no repeated site–asset–category groups in the current demo knowledge base. A missing match is not proof that an issue has never happened.';
    } else {
      const repeatSummary = repeats.map((group) => {
        const latest = group[0];
        sourceIds.push(...group.map((incident) => incident.id));
        return `${latest.asset} at ${latest.site} (${group.length} reports: ${group.map((incident) => incident.id).join(', ')})`;
      }).join('; ');
      answer = `I found ${repeats.length} repeated asset pattern${repeats.length === 1 ? '' : 's'}: ${repeatSummary}. These are matches by site, asset and category—not proof of a shared cause or failed repair.`;
    }
  } else if (text.includes('site') || text.includes('location') || text.includes('where')) {
    const highest = siteCounts[0];
    const site = incidents.find((incident) => text.includes(incident.site.toLowerCase()));
    if (site && !/which|most|more|highest|problem|issue/.test(text)) {
      const siteIncidents = incidents.filter((incident) => incident.site === site.site);
      sourceIds.push(...siteIncidents.map((incident) => incident.id));
      const siteCategories = [...siteIncidents.reduce((counts, incident) => counts.set(incident.category, (counts.get(incident.category) || 0) + 1), new Map())]
        .sort((a, b) => b[1] - a[1]);
      answer = `${site.site} has ${siteIncidents.length} of ${incidents.length} incident records in this demo knowledge base. Its most reported category is ${siteCategories[0][0]} (${siteCategories[0][1]}). This is a count of sample reports, not a measured site risk rate.`;
    } else {
      const leaders = siteCounts.filter(([, count]) => count === highest[1]).map(([name]) => name);
      incidents.filter((incident) => leaders.includes(incident.site)).forEach((incident) => sourceIds.push(incident.id));
      answer = `${leaders.join(' and ')} ${leaders.length === 1 ? 'has' : 'have'} the highest number of sample reports with ${highest[1]} of ${incidents.length} records. Counts by site: ${siteCounts.map(([name, count]) => `${name}: ${count}`).join('; ')}. This is a small demonstration dataset, not a comparison adjusted for site size or working hours.`;
    }
  } else if (text.includes('high severity') || text.includes('high-severity') || text.includes('serious')) {
    const highIncidents = incidents.filter((incident) => incident.severity === 'High');
    sourceIds.push(...highIncidents.map((incident) => incident.id));
    answer = `There ${highIncidents.length === 1 ? 'is' : 'are'} ${highIncidents.length} high-severity record${highIncidents.length === 1 ? '' : 's'} out of ${incidents.length} in the current demo dataset: ${highIncidents.map((incident) => `${incident.id} (${incident.title}, ${incident.site})`).join('; ')}. Severity labels are reported demo data and need competent review.`;
  } else if (text.includes('problem') || text.includes('issue') || text.includes('category') || text.includes('common') || text.includes('mostly') || text.includes('most faced')) {
    const topCount = categoryCounts[0][1];
    const topCategories = categoryCounts.filter(([, count]) => count === topCount).map(([category]) => category);
    incidents.filter((incident) => topCategories.includes(incident.category)).forEach((incident) => sourceIds.push(incident.id));
    answer = `${topCategories.join(', ')} ${topCategories.length === 1 ? 'is' : 'are'} the most frequently recorded categor${topCategories.length === 1 ? 'y' : 'ies'} in the current demo knowledge base (${topCount} ${topCount === 1 ? 'report' : 'reports'} each). Category counts: ${categoryCounts.map(([category, count]) => `${category}: ${count}`).join('; ')}. These are sample record counts, not evidence of underlying cause or comparative risk.`;
  } else {
    answer = 'I cannot answer that confidently from the incident fields in this demo knowledge base. Try asking which site has the most incident reports, which categories are most common, which equipment patterns repeat, or how many high-severity reports are recorded.';
  }
  return { answer, sourceIds: [...new Set(sourceIds)].slice(0, 6) };
}

function App() {
  const [incidents, setIncidents] = useState(() => readSessionValue('siteguard.incidents', seedIncidents));
  const [followUps, setFollowUps] = useState(() => {
    const saved = readSessionValue('siteguard.followUps', null);
    return Array.isArray(saved)
      ? saved.map((task) => {
        const incident = incidents.find((item) => item.id === task.incidentId);
        return incident && task.action === 'Review incident and document follow-up outcome'
          ? { ...task, action: suggestedFollowUpAction(incident) }
          : task;
      })
      : createFollowUpTasks(incidents);
  });
  const [page, setPage] = useState(pageFromLocation);
  const [analysisIncidentId, setAnalysisIncidentId] = useState(incidentIdFromLocation);
  const [analysisTab, setAnalysisTab] = useState('history');
  const [suggestionReviews, setSuggestionReviews] = useState(() => readSessionValue('siteguard.suggestionReviews', {}));
  const [statusHistory, setStatusHistory] = useState(() => readSessionValue('siteguard.statusHistory', []));
  const [reportDraft, setReportDraft] = useState(() => readSessionValue('siteguard.reportDraft', defaultReportDraft));
  const [reportDirty, setReportDirty] = useState(() => JSON.stringify(readSessionValue('siteguard.reportDraft', defaultReportDraft)) !== JSON.stringify(defaultReportDraft));
  const [reportFormKey, setReportFormKey] = useState(0);
  const [reviewerName, setReviewerName] = useState(() => readSessionValue('siteguard.reviewerName', 'Site Coordinator'));
  const [compactRegister, setCompactRegister] = useState(() => readSessionValue('siteguard.compactRegister', false));
  const [registerPreset, setRegisterPreset] = useState('All incidents');
  const [draftAttachment, setDraftAttachment] = useState('');
  const [attachmentPreview, setAttachmentPreview] = useState('');
  const [reviewDialog, setReviewDialog] = useState(null);
  const [selected, setSelected] = useState(null);
  const [dark, setDark] = useState(readThemePreference);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All categories');
  const [severityFilter, setSeverityFilter] = useState('All severities');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [recurrenceSiteFilter, setRecurrenceSiteFilter] = useState('All sites');
  const [recurrenceSeverityFilter, setRecurrenceSeverityFilter] = useState('All severities');
  const [recurrenceRange, setRecurrenceRange] = useState('Any time');
  const [recurrenceSort, setRecurrenceSort] = useState('Most reports');
  const [selectedRecurrenceKey, setSelectedRecurrenceKey] = useState('');
  const [recurrenceQuery, setRecurrenceQuery] = useState('');
  const [followUpSiteFilter, setFollowUpSiteFilter] = useState('All sites');
  const [followUpOwnerFilter, setFollowUpOwnerFilter] = useState('All owners');
  const [followUpStatusFilter, setFollowUpStatusFilter] = useState('All statuses');
  const [followUpDueFilter, setFollowUpDueFilter] = useState('All due dates');
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [newFollowUpIncidentId, setNewFollowUpIncidentId] = useState(incidents[0]?.id || '');
  const [newFollowUpAction, setNewFollowUpAction] = useState(incidents[0] ? suggestedFollowUpAction(incidents[0]) : '');
  const [analysis, setAnalysis] = useState(null);
  const [assistantMessages, setAssistantMessages] = useState([]);
  const [assistantQuestion, setAssistantQuestion] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const currentPageRef = useRef(page);

  useEffect(() => {
    const initialPage = pageFromLocation();
    if (window.location.hash !== `#${initialPage}`) {
      window.history.replaceState({ page: initialPage }, '', `#${initialPage}`);
    }
    const handlePopState = (event) => {
      const nextPage = pageIds.has(event.state?.page) ? event.state.page : pageFromLocation();
      if (currentPageRef.current === 'report' && reportDirty && nextPage !== 'report' && !window.confirm('You have unsaved report changes. Leave this page? Your draft will be kept in this browser session.')) {
        window.history.go(1);
        return;
      }
      setPage(nextPage);
      currentPageRef.current = nextPage;
      setAnalysisIncidentId(event.state?.incidentId || incidentIdFromLocation());
      setAnalysisTab('history');
      setSelected(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [reportDirty]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!reportDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [reportDirty]);

  useEffect(() => persistSessionValue('siteguard.incidents', incidents), [incidents]);
  useEffect(() => {
    setFollowUps((current) => {
      const existingIds = new Set(current.map((task) => task.incidentId));
      const missing = incidents.filter((incident) => !existingIds.has(incident.id));
      return missing.length ? [...current, ...createFollowUpTasks(missing)] : current;
    });
  }, [incidents]);
  useEffect(() => persistSessionValue('siteguard.followUps', followUps), [followUps]);
  useEffect(() => persistSessionValue('siteguard.suggestionReviews', suggestionReviews), [suggestionReviews]);
  useEffect(() => persistSessionValue('siteguard.statusHistory', statusHistory), [statusHistory]);
  useEffect(() => persistSessionValue('siteguard.reportDraft', reportDraft), [reportDraft]);
  useEffect(() => persistSessionValue('siteguard.reviewerName', reviewerName), [reviewerName]);
  useEffect(() => persistSessionValue('siteguard.compactRegister', compactRegister), [compactRegister]);
  useEffect(() => persistThemePreference(dark), [dark]);
  useEffect(() => () => {
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
  }, [attachmentPreview]);

  useEffect(() => {
    if (!reviewDialog) return undefined;
    const handleDialogKeyDown = (event) => {
      if (event.key === 'Escape') setReviewDialog(null);
      if (event.key !== 'Tab') return;
      const focusable = [...document.querySelectorAll('.review-dialog button:not([disabled]), .review-dialog textarea:not([disabled]), .review-dialog input:not([disabled]), .review-dialog select:not([disabled])')];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener('keydown', handleDialogKeyDown);
    return () => window.removeEventListener('keydown', handleDialogKeyDown);
  }, [reviewDialog]);

  function navigatePage(nextPage, { replace = false, incidentId = '' } = {}) {
    if (!pageIds.has(nextPage)) return;
    if (page === 'report' && reportDirty && nextPage !== 'analyzing' && !window.confirm('You have unsaved report changes. Leave this page? Your draft will be kept in this browser session.')) return;
    const method = replace ? 'replaceState' : 'pushState';
    const hash = ['analysis', 'analyzing'].includes(nextPage) && incidentId ? `#${nextPage}/${encodeURIComponent(incidentId)}` : `#${nextPage}`;
    window.history[method]({ page: nextPage, incidentId }, '', hash);
    setPage(nextPage);
    currentPageRef.current = nextPage;
    setAnalysisIncidentId(incidentId);
    if (nextPage === 'analysis') setAnalysisTab('history');
    setSelected(null);
  }

  function reviewKey(incidentId, suggestionId) {
    return `${incidentId}:${suggestionId}`;
  }

  function approveSuggestion(incidentId, suggestionId) {
    const decision = { status: 'Approved for Follow-up', reviewer: reviewerName || 'Site Coordinator', timestamp: new Date().toISOString(), followUp: { owner: reviewerName || 'Site Coordinator', dueDate: '', status: 'Planned', outcome: '' } };
    setSuggestionReviews((current) => ({ ...current, [reviewKey(incidentId, suggestionId)]: decision }));
    setNotice('Suggestion approved for follow-up. Root cause remains unverified.');
  }

  function approvePendingSuggestions(incidentId, suggestions) {
    const pending = suggestions.filter((suggestion) => !suggestionReviews[reviewKey(incidentId, suggestion.id)]);
    if (!pending.length) return;
    const timestamp = new Date().toISOString();
    setSuggestionReviews((current) => ({
      ...current,
      ...Object.fromEntries(pending.map((suggestion) => [reviewKey(incidentId, suggestion.id), {
        status: 'Approved for Follow-up',
        reviewer: reviewerName || 'Site Coordinator',
        timestamp,
        followUp: { owner: reviewerName || 'Site Coordinator', dueDate: '', status: 'Planned', outcome: '' },
      }])),
    }));
    setNotice(`${pending.length} pending suggestion${pending.length === 1 ? '' : 's'} approved for follow-up. Root causes remain unverified.`);
  }

  function openRejectionDialog(incidentId, suggestionIds) {
    setReviewDialog({ incidentId, suggestionIds: Array.isArray(suggestionIds) ? suggestionIds : [suggestionIds], issue: '', rectification: '', observations: '', error: '' });
  }

  function submitSuggestionRejection(event) {
    event.preventDefault();
    if (!reviewDialog) return;
    if (!reviewDialog.issue.trim() || !reviewDialog.rectification.trim()) {
      setReviewDialog((current) => ({ ...current, error: 'Enter both the issue found and how it was rectified.' }));
      return;
    }
    const timestamp = new Date().toISOString();
    const decisions = Object.fromEntries(reviewDialog.suggestionIds.map((suggestionId) => [reviewKey(reviewDialog.incidentId, suggestionId), {
      status: 'Rejected — Reviewer Feedback Recorded',
      reviewer: reviewerName || 'Site Coordinator',
      timestamp,
      issue: reviewDialog.issue.trim(),
      rectification: reviewDialog.rectification.trim(),
      observations: reviewDialog.observations.trim(),
    }]));
    setSuggestionReviews((current) => ({ ...current, ...decisions }));
    setReviewDialog(null);
    setNotice(reviewDialog.suggestionIds.length > 1
      ? `Reviewer feedback recorded for ${reviewDialog.suggestionIds.length} suggestions. They remain available for reference.`
      : 'Reviewer feedback recorded. The suggested investigation remains available for reference.');
  }

  function updateFollowUp(incidentId, suggestionId, field, value) {
    setSuggestionReviews((current) => {
      const key = reviewKey(incidentId, suggestionId);
      const review = current[key];
      if (!review?.followUp) return current;
      return { ...current, [key]: { ...review, followUp: { ...review.followUp, [field]: value, updatedAt: new Date().toISOString() } } };
    });
  }

  const recurringMatches = useMemo(() => {
    const groups = new Map();
    incidents.forEach((incident) => {
      const key = `${incident.site}|${incident.asset}|${incident.category}`;
      groups.set(key, [...(groups.get(key) || []), incident]);
    });
    return [...groups.values()].filter((group) => group.length > 1)
      .map((group) => group.sort((a, b) => b.date.localeCompare(a.date)));
  }, [incidents]);

  const recurrenceSites = useMemo(
    () => [...new Set(recurringMatches.map((group) => group[0].site))].sort(),
    [recurringMatches],
  );
  const recurrenceWorklist = useMemo(() => {
    const rangeDays = { 'Any time': Infinity, 'Last 30 days': 30, 'Last 90 days': 90, 'Last year': 365 }[recurrenceRange];
    const cutoff = new Date();
    cutoff.setHours(12, 0, 0, 0);
    if (rangeDays !== Infinity) cutoff.setDate(cutoff.getDate() - rangeDays);
    return recurringMatches
      .map((group) => {
        const ordered = [...group].sort((a, b) => a.date.localeCompare(b.date));
        const first = ordered[0];
        const latest = ordered.at(-1);
        return {
          key: `${first.site}|${first.asset}|${first.category}`,
          group,
          ordered,
          first,
          latest,
          highSeverity: group.some((incident) => incident.severity === 'High'),
          days: Math.max(0, Math.round((new Date(`${latest.date}T12:00:00`) - new Date(`${first.date}T12:00:00`)) / 86400000)),
        };
      })
      .filter(({ group, latest, highSeverity }) => {
        const matchesQuery = `${group[0].site} ${group[0].area} ${group[0].asset} ${group[0].category} ${group[0].title}`.toLowerCase().includes(recurrenceQuery.trim().toLowerCase());
        const matchesRange = rangeDays === Infinity || new Date(`${latest.date}T12:00:00`) >= cutoff;
        return matchesQuery
          && matchesRange
          && (recurrenceSiteFilter === 'All sites' || group[0].site === recurrenceSiteFilter)
          && (recurrenceSeverityFilter === 'All severities' || (recurrenceSeverityFilter === 'High' ? highSeverity : !highSeverity));
      })
      .sort((a, b) => recurrenceSort === 'Latest report'
        ? b.latest.date.localeCompare(a.latest.date)
        : b.group.length - a.group.length || b.latest.date.localeCompare(a.latest.date));
  }, [recurringMatches, incidents, recurrenceRange, recurrenceQuery, recurrenceSiteFilter, recurrenceSeverityFilter, recurrenceSort]);
  const selectedRecurrence = recurrenceWorklist.find(({ key }) => key === selectedRecurrenceKey) || recurrenceWorklist[0] || null;

  const followUpSites = useMemo(() => [...new Set(incidents.map((incident) => incident.site))].sort(), [incidents]);
  const followUpOwners = useMemo(() => [...new Set(followUps.map((task) => isUnassignedFollowUp(task) ? 'Unassigned' : task.owner.trim()))].sort(), [followUps]);
  const filteredFollowUps = useMemo(() => {
    const today = localDateKey();
    const dueSoon = new Date();
    dueSoon.setDate(dueSoon.getDate() + 7);
    const dueSoonKey = localDateKey(dueSoon);
    return followUps
      .map((task) => ({ task, incident: incidents.find((item) => item.id === task.incidentId) }))
      .filter(({ task, incident }) => {
        if (!incident) return false;
        const overdue = task.status !== 'Complete' && task.dueDate && task.dueDate < today;
        const dueSoonTask = task.status !== 'Complete' && task.dueDate && task.dueDate >= today && task.dueDate <= dueSoonKey;
        return (followUpSiteFilter === 'All sites' || incident.site === followUpSiteFilter)
          && (followUpOwnerFilter === 'All owners' || (followUpOwnerFilter === 'Unassigned' ? isUnassignedFollowUp(task) : task.owner === followUpOwnerFilter))
          && (followUpStatusFilter === 'All statuses' || task.status === followUpStatusFilter)
          && (followUpDueFilter === 'All due dates'
            || (followUpDueFilter === 'Overdue' && overdue)
            || (followUpDueFilter === 'Due in 7 days' && dueSoonTask)
            || (followUpDueFilter === 'No due date' && !task.dueDate)
            || (followUpDueFilter === 'Complete' && task.status === 'Complete'));
      })
      .sort((a, b) => {
        if (!a.task.dueDate && b.task.dueDate) return 1;
        if (a.task.dueDate && !b.task.dueDate) return -1;
        return (a.task.dueDate || '').localeCompare(b.task.dueDate || '') || a.incident.date.localeCompare(b.incident.date);
      });
  }, [followUps, incidents, followUpSiteFilter, followUpOwnerFilter, followUpStatusFilter, followUpDueFilter]);
  const overdueFollowUpCount = followUps.filter((task) => task.status !== 'Complete' && task.dueDate && task.dueDate < localDateKey()).length;

  const filteredIncidents = useMemo(() => incidents.filter((incident) => {
    const text = `${incident.id} ${incident.title} ${incident.site} ${incident.area} ${incident.asset} ${incident.owner}`.toLowerCase();
    return text.includes(query.toLowerCase())
      && (categoryFilter === 'All categories' || incident.category === categoryFilter)
      && (severityFilter === 'All severities' || incident.severity === severityFilter)
      && (statusFilter === 'All statuses' || incident.status === statusFilter)
      && (registerPreset === 'All incidents'
        || (registerPreset === 'Open' && incident.status !== 'Closed')
        || (registerPreset === 'High severity' && incident.severity === 'High')
        || (registerPreset === 'Recurring' && findMatches(incident, incidents).length > 0));
  }), [incidents, query, categoryFilter, severityFilter, statusFilter, registerPreset]);

  const openIncident = (incident) => setSelected(incident);
  function showRegister({ preset = 'All incidents', category = 'All categories', severity = 'All severities' } = {}) {
    setQuery('');
    setCategoryFilter(category);
    setSeverityFilter(severity);
    setStatusFilter('All statuses');
    setRegisterPreset(preset);
    navigatePage('register');
  }

  const updateIncident = (id, changes) => {
    const existing = incidents.find((incident) => incident.id === id);
    if (changes.status && existing && existing.status !== changes.status) {
      setStatusHistory((current) => [...current, { incidentId: id, status: changes.status, reviewer: reviewerName || 'Site Coordinator', timestamp: new Date().toISOString() }]);
    }
    setIncidents((current) => current.map((incident) => incident.id === id ? { ...incident, ...changes } : incident));
    setSelected((current) => current?.id === id ? { ...current, ...changes } : current);
  };

  function submitIncident(event) {
    event.preventDefault();
    setFormError('');
    const form = new FormData(event.currentTarget);
    const required = ['site', 'area', 'date', 'category', 'asset', 'title', 'description', 'symptoms', 'severity', 'immediate'];
    const missing = required.filter((field) => !String(form.get(field) || '').trim());
    if (missing.length) {
      setFormError('Please complete all required fields marked with an asterisk.');
      return;
    }
    const incident = {
      id: `SG-${String(2482 + incidents.length - seedIncidents.length).padStart(4, '0')}`,
      site: String(form.get('site')).trim(), area: String(form.get('area')).trim(),
      date: String(form.get('date')).slice(0, 10), category: String(form.get('category')),
      asset: String(form.get('asset')).trim(), title: String(form.get('title')).trim(),
      description: String(form.get('description')).trim(), symptoms: String(form.get('symptoms')).trim(),
      severity: String(form.get('severity')), immediate: String(form.get('immediate')).trim(),
      previous: String(form.get('previous') || '').trim() || 'Not known at time of report.',
      impact: String(form.get('impact') || '').trim() || 'Impact not recorded.',
      owner: 'Unassigned', status: 'Under investigation', demo: true,
      attachment: form.get('attachment')?.name || '',
      corrective: 'No corrective action recorded yet.',
      outcome: 'Outcome not yet verified.',
    };
    const matches = findMatches(incident, incidents).filter(({ incident: prior }) => prior.date < incident.date);
    setIncidents((current) => [incident, ...current]);
    setAnalysis({ incident, matches, reviewed: false });
    setReportDraft(defaultReportDraft);
    setReportDirty(false);
    setDraftAttachment('');
    setAttachmentPreview('');
    navigatePage('analyzing', { incidentId: incident.id });
    window.setTimeout(() => {
      setPage((currentPage) => {
        if (currentPage !== 'analyzing') return currentPage;
        window.history.replaceState({ page: 'analysis', incidentId: incident.id }, '', `#analysis/${encodeURIComponent(incident.id)}`);
        setAnalysisIncidentId(incident.id);
        return 'analysis';
      });
    }, 1800);
    event.currentTarget.reset();
  }

  function approveAction() {
    if (!analysis) return;
    updateIncident(analysis.incident.id, { status: 'Action required' });
    setAnalysis((current) => ({ ...current, reviewed: true, decision: 'Proposed actions reviewed and approved for follow-up by a competent person.' }));
  }

  function rejectAction() {
    if (!analysis) return;
    setAnalysis((current) => ({ ...current, reviewed: true, decision: 'Proposed actions rejected; further human review is required before any action is taken.' }));
  }

  function askAssistant(question) {
    const cleanedQuestion = question.trim();
    if (!cleanedQuestion) return;
    const result = answerKnowledgeBase(cleanedQuestion, incidents);
    setAssistantMessages((current) => [
      ...current,
      { role: 'user', text: cleanedQuestion },
      { role: 'assistant', ...result },
    ]);
    setAssistantQuestion('');
  }

  function renderDashboard() {
    const openCount = incidents.filter((item) => item.status !== 'Closed').length;
    const highCount = incidents.filter((item) => item.severity === 'High').length;
    const recurringCount = recurringMatches.reduce((total, group) => total + group.length, 0);
    const categoryCounts = categories.map((category) => ({ category, count: incidents.filter((item) => item.category === category).length }));
    const maxCategory = Math.max(1, ...categoryCounts.map((item) => item.count));
    const recent = [...incidents].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    return <div className="page-content">
      <div className="page-heading">
        <div><div className="eyebrow">THURSDAY, 22 OCTOBER 2026 <span className="live-dot" /></div><h1>Good morning, team</h1><p>Here’s your operational incident overview across all sites.</p></div>
        <button className="button button-primary" onClick={() => { setFormError(''); navigatePage('report'); }}><Icon name="plus" size={17} /> Report incident</button>
      </div>
      <div className="demo-banner"><span className="demo-mark">D</span><span><strong>Demonstration environment</strong><span>All incidents, insights and recommendations on this screen use sample data.</span></span><Icon name="arrow" size={16} /></div>
      <section className="metric-grid" aria-label="Incident summary">
        <Metric label="Recorded incidents" value={incidents.length} foot="Across 3 operational sites" icon="list" accent="mint" ariaLabel="View all recorded incidents" onClick={() => showRegister()} />
        <Metric label="Open incidents" value={openCount} foot="Require review or follow-up" icon="clock" accent="blue" ariaLabel="View open incidents" onClick={() => showRegister({ preset: 'Open' })} />
        <Metric label="High severity" value={highCount} foot="Competent review required" icon="alert" accent="peach" ariaLabel="View high-severity incidents" onClick={() => showRegister({ severity: 'High' })} />
        <Metric label="Recurring incidents" value={recurringCount} foot={`${recurringMatches.length} repeated asset patterns`} icon="repeat" accent="lilac" ariaLabel="View recurring incidents" onClick={() => showRegister({ preset: 'Recurring' })} />
      </section>
      <section className="dashboard-grid">
        <div className="card trend-card">
          <div className="card-head"><div><h2>Incident activity</h2><p>Reported incidents · last 6 months</p></div><Badge tone="neutral">Demo data</Badge></div>
          <div className="trend-chart" aria-label="Monthly incident trend chart">
            <div className="chart-y"><span>8</span><span>6</span><span>4</span><span>2</span><span>0</span></div>
            <div className="chart-main"><div className="chart-grid-lines"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 600 170" preserveAspectRatio="none" role="img" aria-label="Incidents rise to a peak in October">
              <defs><linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#5ba990" stopOpacity=".2" /><stop offset="100%" stopColor="#5ba990" stopOpacity="0" /></linearGradient></defs>
              <path d="M0 127 C45 122 55 94 120 103 S200 80 240 96 S318 126 360 90 S430 45 480 70 S540 29 600 26 L600 170 L0 170Z" fill="url(#areaFill)" />
              <path d="M0 127 C45 122 55 94 120 103 S200 80 240 96 S318 126 360 90 S430 45 480 70 S540 29 600 26" fill="none" stroke="#39866e" strokeWidth="3" vectorEffect="non-scaling-stroke" />
              <circle cx="600" cy="26" r="5" fill="#39866e" vectorEffect="non-scaling-stroke" />
            </svg><div className="chart-x">{['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map((month) => <span key={month}>{month}</span>)}</div></div>
          </div>
        </div>
        <div className="card category-card">
          <div className="card-head"><div><h2>Incidents by category</h2><p>Current reporting period</p></div><span className="mini-icon"><Icon name="grid" /></span></div>
          <div className="category-list">{categoryCounts.filter((item) => item.count).map(({ category, count }) => <button className="category-item category-item-button" key={category} aria-label={`View ${count} ${category} incidents`} onClick={() => showRegister({ category })}><span className="category-label"><span>{category}</span><strong>{count}</strong></span><span className="progress-track"><span style={{ width: `${Math.max(10, (count / maxCategory) * 100)}%` }} /></span></button>)}</div>
          <button className="text-link" onClick={() => navigatePage('register')}>View incident register <Icon name="chevron" size={15} /></button>
        </div>
      </section>
      <section className="dashboard-grid lower-grid">
        <div className="card recent-card">
          <div className="card-head"><div><h2>Recent incidents</h2><p>Latest activity across your sites</p></div><button className="text-link" onClick={() => navigatePage('register')}>View all <Icon name="chevron" size={15} /></button></div>
          <IncidentTable incidents={recent} onSelect={openIncident} compact />
        </div>
        <div className="card recurring-card">
          <div className="card-head"><div><h2>Repeat patterns</h2><p>Equipment needing a closer look</p></div><span className="recurring-icon"><Icon name="repeat" /></span></div>
          {recurringMatches.slice(0, 3).map((group) => <button className="repeat-row" key={`${group[0].site}-${group[0].asset}`} onClick={() => openIncident(group[0])}>
            <span className="repeat-symbol"><Icon name="alert" size={17} /></span><span className="repeat-copy"><strong>{group[0].asset} · {group[0].title.replace(/ at .*/, '')}</strong><small>{group[0].site} · {group.length} reports</small></span><Icon name="chevron" size={17} />
          </button>)}
          <button className="text-link" onClick={() => navigatePage('recurrence')}>Explore recurrence insights <Icon name="chevron" size={15} /></button>
        </div>
      </section>
      <div className="safety-note"><Icon name="shield" size={17} /><span><strong>Safety first.</strong> AI-generated recommendations are hypotheses for competent human review; they do not authorise equipment restart or confirm a site is safe.</span></div>
    </div>;
  }

  function renderRegister() {
    const filtersActive = query || categoryFilter !== 'All categories' || severityFilter !== 'All severities' || statusFilter !== 'All statuses' || registerPreset !== 'All incidents';
    return <div className="page-content">
      <div className="page-heading"><div><div className="eyebrow">INCIDENT MANAGEMENT</div><h1>Incident register</h1><p>Search, review and follow up on reported site incidents.</p></div><button className="button button-primary" onClick={() => { setFormError(''); navigatePage('report'); }}><Icon name="plus" size={17} /> Report incident</button></div>
      <div className="register-toolbar"><div className="register-summary"><strong>{filteredIncidents.length} incidents</strong><span>·</span><span>Demonstration records only</span>{filtersActive && <button className="text-link" onClick={() => { setQuery(''); setCategoryFilter('All categories'); setSeverityFilter('All severities'); setStatusFilter('All statuses'); setRegisterPreset('All incidents'); }}>Clear filters</button>}</div><button className="button button-secondary density-toggle" aria-pressed={compactRegister} onClick={() => setCompactRegister((value) => !value)}>{compactRegister ? 'Comfortable density' : 'Compact density'}</button></div>
      <div className="register-presets" role="group" aria-label="Incident quick filters">{['All incidents', 'Open', 'High severity', 'Recurring'].map((preset) => <button key={preset} className={`preset-chip ${registerPreset === preset ? 'preset-active' : ''}`} aria-pressed={registerPreset === preset} onClick={() => setRegisterPreset(preset)}>{preset}</button>)}</div>
      <div className={`card register-card ${compactRegister ? 'register-compact' : ''}`}>
        <div className="filter-row">
          <label className="search-field"><Icon name="search" size={17} /><input aria-label="Search incidents" placeholder="Search incidents, sites, assets…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <select aria-label="Filter by category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option>All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select>
          <select aria-label="Filter by severity" value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}><option>All severities</option>{['High', 'Medium', 'Low'].map((severity) => <option key={severity}>{severity}</option>)}</select>
          <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option>{['Under investigation', 'Action required', 'Closed'].map((status) => <option key={status}>{status}</option>)}</select>
        </div>
        <IncidentTable incidents={filteredIncidents} onSelect={(incident) => {
          setAnalysis({ incident, matches: findMatches(incident, incidents), reviewed: false });
          navigatePage('analysis', { incidentId: incident.id });
        }} />
        <div className="incident-mobile-list">{filteredIncidents.map((incident) => <button className="incident-mobile-card" key={incident.id} onClick={() => { setAnalysis({ incident, matches: findMatches(incident, incidents), reviewed: false }); navigatePage('analysis', { incidentId: incident.id }); }}>
          <span className="mobile-card-title"><strong>{incident.title}</strong><span>{incident.id}</span></span><span className="mobile-card-location">{incident.site} · {incident.area}</span><span className="mobile-card-meta"><span>{incident.asset}</span><Badge tone={severityTone(incident.severity)}>{incident.severity}</Badge><Badge tone={statusTone(incident.status)}>{incident.status}</Badge>{findMatches(incident, incidents).length > 0 && <Badge tone="amber">Repeat</Badge>}</span>
        </button>)}</div>
        {!filteredIncidents.length && <div className="empty-state"><span className="empty-icon"><Icon name="search" /></span><strong>No incidents match these filters</strong><span>Try a different search term or clear a filter.</span><button className="text-link" onClick={() => { setQuery(''); setCategoryFilter('All categories'); setSeverityFilter('All severities'); setStatusFilter('All statuses'); setRegisterPreset('All incidents'); }}>Clear filters</button></div>}
      </div>
      <div className="table-footnote"><Icon name="alert" size={15} /> Sample data for presentation purposes only. Newly reported records are saved to this browser session.</div>
    </div>;
  }

  function updateTrackerTask(taskId, field, value) {
    setFollowUps((current) => current.map((task) => {
      if (task.id !== taskId) return task;
      const updated = { ...task, [field]: value, updatedAt: new Date().toISOString() };
      if (field === 'status' && value !== 'Complete') updated.effectiveness = 'Not verified';
      return updated;
    }));
  }

  function addFollowUpTask(event) {
    event.preventDefault();
    const incident = incidents.find((item) => item.id === newFollowUpIncidentId);
    if (!incident || !newFollowUpAction.trim()) return;
    setFollowUps((current) => [...current, {
      id: `follow-up-${incident.id}-${Date.now()}`,
      incidentId: incident.id,
      action: newFollowUpAction.trim(),
      owner: 'Unassigned',
      dueDate: '',
      status: 'Not scheduled',
      effectiveness: 'Not verified',
      updatedAt: new Date().toISOString(),
    }]);
    setFollowUpSiteFilter('All sites');
    setFollowUpOwnerFilter('All owners');
    setFollowUpStatusFilter('All statuses');
    setFollowUpDueFilter('All due dates');
    setShowFollowUpForm(false);
  }

  function renderFollowUp() {
    const openCount = followUps.filter((task) => task.status !== 'Complete').length;
    const unscheduledCount = followUps.filter((task) => task.status !== 'Complete' && !task.dueDate).length;
    const verificationCount = followUps.filter((task) => task.status === 'Complete' && task.effectiveness !== 'Verified').length;
    const dueLabel = (task) => {
      if (task.status === 'Complete') return 'Action complete';
      if (!task.dueDate) return 'No due date';
      const today = localDateKey();
      if (task.dueDate < today) return 'Overdue';
      if (task.dueDate === today) return 'Due today';
      const days = Math.round((new Date(`${task.dueDate}T12:00:00`) - new Date(`${today}T12:00:00`)) / 86400000);
      return days <= 7 ? `Due in ${days} days` : formatDate(task.dueDate);
    };
    const today = localDateKey();
    const urgencyGroups = [
      { title: 'Overdue', rows: filteredFollowUps.filter(({ task }) => task.status !== 'Complete' && task.dueDate && task.dueDate < today) },
      { title: 'Due soon', rows: filteredFollowUps.filter(({ task }) => task.status !== 'Complete' && task.dueDate && task.dueDate >= today && dueLabel(task).startsWith('Due')) },
      { title: 'Unscheduled', rows: filteredFollowUps.filter(({ task }) => task.status !== 'Complete' && !task.dueDate) },
      { title: 'Scheduled', rows: filteredFollowUps.filter(({ task }) => task.status !== 'Complete' && task.dueDate && task.dueDate >= today && !dueLabel(task).startsWith('Due')) },
      { title: 'Complete', rows: filteredFollowUps.filter(({ task }) => task.status === 'Complete') },
    ].filter((group) => group.rows.length);
    return <div className="page-content">
      <div className="page-heading"><div><div className="eyebrow">INCIDENT MANAGEMENT</div><h1>Follow-up tracker</h1><p>Assign, schedule and review follow-up actions linked to incident records.</p></div><Badge tone="neutral">Browser session</Badge></div>
      <div className="follow-up-demo-note"><Icon name="alert" size={16} /><span><strong>Illustrative tracker data.</strong> Actions are editable examples saved only in this browser session; they are not real assignments or verified work.</span></div>
      <div className="follow-up-status-note"><strong>How completion works:</strong> Complete means the assigned action is done. Effectiveness is a separate review to confirm the change worked; it should only be marked verified when there is supporting evidence.</div>
      <section className="follow-up-summary" aria-label="Follow-up summary">
        <div className="follow-up-summary-card"><span>OPEN ACTIONS</span><strong>{openCount}</strong><small>Not marked complete</small></div>
        <div className="follow-up-summary-card follow-up-summary-warning"><span>OVERDUE</span><strong>{overdueFollowUpCount}</strong><small>Open actions past their due date</small></div>
        <div className="follow-up-summary-card"><span>NEED EFFECTIVENESS REVIEW</span><strong>{verificationCount}</strong><small>Complete does not mean verified</small></div>
        <div className="follow-up-summary-card"><span>UNSCHEDULED</span><strong>{unscheduledCount}</strong><small>Assign an owner and due date</small></div>
      </section>
      <section className="follow-up-filters" aria-label="Filter follow-up actions">
        <label><span>Site</span><select aria-label="Filter follow-ups by site" value={followUpSiteFilter} onChange={(event) => setFollowUpSiteFilter(event.target.value)}><option>All sites</option>{followUpSites.map((site) => <option key={site}>{site}</option>)}</select></label>
        <label><span>Owner</span><select aria-label="Filter follow-ups by owner" value={followUpOwnerFilter} onChange={(event) => setFollowUpOwnerFilter(event.target.value)}><option>All owners</option>{followUpOwners.map((owner) => <option key={owner}>{owner}</option>)}</select></label>
        <label><span>Action status</span><select aria-label="Filter follow-ups by status" value={followUpStatusFilter} onChange={(event) => setFollowUpStatusFilter(event.target.value)}><option>All statuses</option>{['Not scheduled', 'Planned', 'In progress', 'Awaiting verification', 'Complete'].map((status) => <option key={status}>{status}</option>)}</select></label>
        <label><span>Due date</span><select aria-label="Filter follow-ups by due date" value={followUpDueFilter} onChange={(event) => setFollowUpDueFilter(event.target.value)}><option>All due dates</option><option>Overdue</option><option>Due in 7 days</option><option>No due date</option><option>Complete</option></select></label>
      </section>
      <div className="follow-up-list-toolbar"><div className="follow-up-list-heading"><strong>{filteredFollowUps.length} follow-up {filteredFollowUps.length === 1 ? 'action' : 'actions'}</strong><span>Grouped by urgency</span></div><div className="follow-up-quick-filters"><button type="button" className="button button-secondary" onClick={() => { setFollowUpOwnerFilter('Unassigned'); setFollowUpDueFilter('All due dates'); }}>Show unassigned</button><button type="button" className="button button-secondary" onClick={() => { setFollowUpDueFilter('No due date'); setFollowUpOwnerFilter('All owners'); }}>Show no due date</button><button type="button" className="button button-primary" onClick={() => setShowFollowUpForm((shown) => !shown)}>{showFollowUpForm ? 'Cancel' : 'Add follow-up action'}</button></div></div>
      {showFollowUpForm && <form className="follow-up-create-form" onSubmit={addFollowUpTask}>
        <div className="follow-up-create-heading"><strong>Add an action linked to an incident</strong><span>New actions start unassigned and unscheduled so an owner and target date can be confirmed.</span></div>
        <label><span>Incident</span><select required value={newFollowUpIncidentId} onChange={(event) => { const incidentId = event.target.value; setNewFollowUpIncidentId(incidentId); const incident = incidents.find((item) => item.id === incidentId); if (incident) setNewFollowUpAction(suggestedFollowUpAction(incident)); }}>{incidents.map((incident) => <option key={incident.id} value={incident.id}>{incident.id} · {incident.title}</option>)}</select></label>
        <label className="follow-up-create-action"><span>Follow-up action</span><textarea required rows="2" value={newFollowUpAction} onChange={(event) => setNewFollowUpAction(event.target.value)} /></label>
        <button type="submit" className="button button-primary">Add action</button>
      </form>}
      <section className="follow-up-list" aria-label="Follow-up actions">
        {urgencyGroups.map(({ title, rows }) => <div className={`follow-up-urgency-group follow-up-urgency-${title.toLowerCase().replace(' ', '-')}`} key={title}>
          <h2><span>{title}</span><span>{rows.length}</span></h2>
          {rows.map(({ task, incident }) => <article className="follow-up-card card" key={task.id}>
          <div className="follow-up-card-heading">
            <div className="follow-up-incident"><span className="follow-up-incident-id">{incident.id}</span><button className="record-link" onClick={() => openIncident(incident)}>{incident.title}<Icon name="arrow" size={13} /></button><span className="follow-up-site">{incident.site} · {incident.area}</span></div>
            <div className="follow-up-badges"><Badge tone={severityTone(incident.severity)}>{incident.severity}</Badge><Badge tone={statusTone(incident.status)}>Incident · {incident.status}</Badge></div>
          </div>
          <div className="follow-up-fields">
            <label className="follow-up-action-field"><span>Follow-up action</span><input aria-label={`Follow-up action for ${incident.id}`} value={task.action} onChange={(event) => updateTrackerTask(task.id, 'action', event.target.value)} /></label>
            <label><span>Owner</span><input aria-label={`Follow-up owner for ${incident.id}`} value={task.owner} placeholder="Assign an owner" onChange={(event) => updateTrackerTask(task.id, 'owner', event.target.value)} /></label>
            <label><span>Target date</span><input aria-label={`Follow-up target date for ${incident.id}`} type="date" value={task.dueDate} onChange={(event) => updateTrackerTask(task.id, 'dueDate', event.target.value)} /></label>
            <label><span>Action status</span><select aria-label={`Follow-up status for ${incident.id}`} value={task.status} onChange={(event) => updateTrackerTask(task.id, 'status', event.target.value)}>{['Not scheduled', 'Planned', 'In progress', 'Awaiting verification', 'Complete'].map((status) => <option key={status}>{status}</option>)}</select></label>
            <label><span>Effectiveness</span><select aria-label={`Effectiveness verification for ${incident.id}`} value={task.effectiveness} disabled={task.status !== 'Complete'} onChange={(event) => updateTrackerTask(task.id, 'effectiveness', event.target.value)}><option>Not verified</option><option>Verified</option></select><small className="follow-up-field-hint">{task.status === 'Complete' ? 'Separate evidence-based review' : 'Available after action completion'}</small></label>
          </div>
          <div className="follow-up-card-footer"><span className={`follow-up-due ${dueLabel(task) === 'Overdue' ? 'follow-up-due-overdue' : ''}`}><Icon name="clock" size={14} />{dueLabel(task)}</span><div className="follow-up-attention-flags">{isUnassignedFollowUp(task) && <span>Owner needed</span>}{!task.dueDate && <span>Target date needed</span>}</div><span className="follow-up-effectiveness-note">{task.status === 'Complete' && task.effectiveness !== 'Verified' ? 'Effectiveness still needs verification' : task.effectiveness === 'Verified' ? 'Effectiveness verified' : 'Verification follows action completion'}</span><button className="button button-secondary follow-up-view" onClick={() => openIncident(incident)}>View incident</button></div>
        </article>)}
        </div>)}
        {filteredFollowUps.length === 0 && <div className="card empty-state"><span className="empty-icon"><Icon name="check" /></span><strong>No follow-up actions match these filters</strong><span>Try adjusting a filter to see other actions.</span><button className="text-link" onClick={() => { setFollowUpSiteFilter('All sites'); setFollowUpOwnerFilter('All owners'); setFollowUpStatusFilter('All statuses'); setFollowUpDueFilter('All due dates'); }}>Clear filters</button></div>}
      </section>
    </div>;
  }

  function renderReport() {
    return <div className="page-content">
      <div className="page-heading"><div><div className="eyebrow">INCIDENT MANAGEMENT / NEW REPORT</div><h1>Report an incident</h1><p>Capture what was observed. Potential causes are analysed separately as unverified hypotheses.</p></div><button className="button button-secondary" onClick={() => navigatePage('register')}>Cancel</button></div>
      <div className="demo-banner"><span className="demo-mark">D</span><span><strong>{reportDirty ? 'Draft saved in this browser session' : 'Sample report prefilled for your demo'}</strong><span>Review or edit the example details before saving. Draft changes remain in this browser session.</span></span><button type="button" className="text-link" onClick={() => { setReportDraft(defaultReportDraft); setReportDirty(false); setDraftAttachment(''); setReportFormKey((key) => key + 1); }}>Reset sample</button></div>
      <div className="workflow-steps" aria-label="Incident reporting workflow"><span className="workflow-step workflow-step-current"><i>1</i> Report</span><b /><span className="workflow-step"><i>2</i> Analysis</span><b /><span className="workflow-step"><i>3</i> Human review</span><b /><span className="workflow-step"><i>4</i> Follow-up</span></div>
      <form key={reportFormKey} className="report-layout" onSubmit={submitIncident} onChange={(event) => {
        const values = Object.fromEntries(new FormData(event.currentTarget).entries());
        delete values.attachment;
        setReportDraft((current) => ({ ...current, ...values }));
        setReportDirty(true);
      }}>
        <div className="report-main card">
          <div className="form-section"><div className="form-section-heading"><span>01</span><div><h2>Incident details</h2><p>Record the location, timing and type of event.</p></div></div>
            <div className="form-grid">
              <Field label="Site" required><input name="site" defaultValue={reportDraft.site} placeholder="e.g. North Quarry" required /></Field>
              <Field label="Operational area" required><input name="area" defaultValue={reportDraft.area} placeholder="e.g. Primary crushing · Line 2" required /></Field>
              <Field label="Date and time" required><input type="datetime-local" name="date" defaultValue={reportDraft.date} required /></Field>
              <Field label="Incident category" required><select name="category" defaultValue={reportDraft.category} required><option value="" disabled>Select category</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></Field>
              <Field label="Equipment or asset ID" required><input name="asset" defaultValue={reportDraft.asset} placeholder="e.g. CV-04 or SITE-ROUTE-03" required /></Field>
              <Field label="Severity" required><select name="severity" defaultValue={reportDraft.severity} required><option value="" disabled>Select severity</option>{['High', 'Medium', 'Low'].map((severity) => <option key={severity}>{severity}</option>)}</select></Field>
              <Field label="Incident title" required wide><input name="title" defaultValue={reportDraft.title} placeholder="A short, clear description of the incident" required /></Field>
              <Field label="Incident description" required wide><textarea name="description" rows="3" defaultValue={reportDraft.description} placeholder="What happened? Include only details observed or reported." required /></Field>
              <Field label="Observed symptoms" required wide><textarea name="symptoms" rows="2" defaultValue={reportDraft.symptoms} placeholder="Describe visible, audible or reported signs." required /></Field>
            </div>
          </div>
          <div className="form-section"><div className="form-section-heading"><span>02</span><div><h2>Response and impact</h2><p>Document actions taken and any known impact.</p></div></div>
            <div className="form-grid">
              <Field label="Immediate action taken" required wide><textarea name="immediate" rows="2" defaultValue={reportDraft.immediate} placeholder="e.g. Equipment isolated; supervisor informed." required /></Field>
              <Field label="Previous maintenance or corrective action" wide><textarea name="previous" rows="2" defaultValue={reportDraft.previous} placeholder="If known, what was tried previously?" /></Field>
              <Field label="Production impact or injury / near-miss information" wide><textarea name="impact" rows="2" defaultValue={reportDraft.impact} placeholder="Record verified impact. Do not include assumptions." /></Field>
            </div>
          </div>
          <div className="form-section attachment-section"><div className="form-section-heading"><span>03</span><div><h2>Attachments</h2><p>Optional supporting photo or document for this demonstration.</p></div></div>
            <label className="upload-box"><Icon name="clip" size={20} /><span><strong>{draftAttachment || 'Choose a file'}</strong>{draftAttachment ? ' selected' : ' or drag it here'}</span><small>Attachment remains local to this browser session.</small><input type="file" name="attachment" accept="image/*,.pdf" onChange={(event) => { const file = event.target.files?.[0]; setDraftAttachment(file?.name || ''); setAttachmentPreview(file && file.type.startsWith('image/') ? URL.createObjectURL(file) : ''); }} />{attachmentPreview && <img className="attachment-preview" src={attachmentPreview} alt="Selected incident attachment preview" />}</label>
          </div>
          {formError && <div className="form-error" role="alert"><Icon name="alert" size={17} />{formError}</div>}
          <div className="form-actions"><span><Icon name="shield" size={16} /> Human review required before action is approved.</span><button className="button button-primary" type="submit">Analyse &amp; save incident <Icon name="arrow" size={16} /></button></div>
        </div>
        <aside className="report-aside">
          <div className="aside-note"><span className="aside-note-icon"><Icon name="alert" /></span><strong>Safety-critical reminder</strong><p>Follow site isolation procedures and notify the competent person. This demo does not authorise a restart or declare the site safe.</p></div>
          <div className="aside-note ai-note"><span className="aside-note-icon"><Icon name="shield" /></span><strong>What happens next?</strong><p>A transparent, rules-based comparison checks this report against the demonstration dataset. Suggested causes remain hypotheses until verified.</p></div>
        </aside>
      </form>
    </div>;
  }

  function renderAnalysis() {
    const incident = incidents.find((item) => item.id === analysisIncidentId) || (analysis?.incident.id === analysisIncidentId ? analysis.incident : null);
    if (!incident) return <div className="page-content"><div className="empty-state"><strong>No incident selected</strong><button className="text-link" onClick={() => navigatePage('register')}>Back to incident register</button></div></div>;
    const matches = findMatches(incident, incidents).filter(({ incident: prior }) => prior.date < incident.date);
    const suggestions = createSuggestions(incident, matches);
    const pendingSuggestions = suggestions.filter((suggestion) => !suggestionReviews[reviewKey(incident.id, suggestion.id)]);
    const reviewedSuggestions = suggestions.length - pendingSuggestions.length;
    const reviewTimeline = Object.entries(suggestionReviews)
      .filter(([key]) => key.startsWith(`${incident.id}:`))
      .map(([key, review]) => ({ suggestionId: key.slice(incident.id.length + 1), ...review }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const statusTimeline = statusHistory.filter((entry) => entry.incidentId === incident.id);
    const timelineEvents = [
      { type: 'reported', timestamp: `${incident.date}T00:00:00`, title: 'Incident reported', detail: `${incident.id} · ${formatDate(incident.date)}` },
      ...reviewTimeline.map((entry) => ({ type: 'review', timestamp: entry.timestamp, title: entry.status, detail: `${suggestions.find((suggestion) => suggestion.id === entry.suggestionId)?.title || entry.suggestionId} · ${entry.reviewer}` })),
      ...statusTimeline.map((entry) => ({ type: 'status', timestamp: entry.timestamp, title: `Incident status changed to ${entry.status}`, detail: `Reviewed by ${entry.reviewer}` })),
      ...reviewTimeline.filter((entry) => entry.followUp?.updatedAt).map((entry) => ({ type: 'follow-up', timestamp: entry.followUp.updatedAt, title: `Follow-up ${entry.followUp.status.toLowerCase()}`, detail: `${suggestions.find((suggestion) => suggestion.id === entry.suggestionId)?.title || entry.suggestionId} · ${entry.followUp.owner}${entry.followUp.outcome ? ` · ${entry.followUp.outcome}` : ''}` })),
    ].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const recurringCount = matches.length + 1;
    const handleAnalysisTabKeyDown = (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const nextTab = analysisTab === 'history' ? 'suggestions' : 'history';
      setAnalysisTab(nextTab);
      window.requestAnimationFrame(() => document.getElementById(`${nextTab}-tab`)?.focus());
    };
    return <div className="page-content">
      <div className="page-heading"><div><div className="eyebrow">INCIDENT ANALYSIS · {incident.id}</div><h1>{incident.title}</h1><p>Review reported facts, historical records and proposed investigation steps.</p></div><button className="button button-secondary" onClick={() => navigatePage('register')}>Back to Incident Register</button></div>
      <div className="workflow-steps" aria-label="Incident reporting workflow"><span className="workflow-step workflow-step-complete"><i>1</i> Report</span><b /><span className="workflow-step workflow-step-current"><i>2</i> Analysis</span><b /><span className={reviewedSuggestions === suggestions.length ? 'workflow-step workflow-step-complete' : 'workflow-step'}><i>3</i> Human review</span><b /><span className={reviewTimeline.some((review) => review.followUp?.status === 'Completed') ? 'workflow-step workflow-step-complete' : 'workflow-step'}><i>4</i> Follow-up</span></div>
      <section className="card incident-overview">
        <div className="overview-heading"><div><span className="eyebrow">INCIDENT OVERVIEW</span><h2>{incident.id} <span>·</span> {incident.title}</h2><p>{incident.site} · {incident.area}</p></div><div className="overview-badges"><Badge tone={severityTone(incident.severity)}>{incident.severity} severity</Badge><Badge tone={statusTone(incident.status)}>{incident.status}</Badge></div></div>
        <div className="overview-meta"><Fact label="CATEGORY" value={incident.category} /><Fact label="EQUIPMENT / ASSET" value={incident.asset} /><Fact label="REPORTED DATE" value={formatDate(incident.date)} /><Fact label="RECURRENCE" value={matches.length ? `${recurringCount} reports in matched pattern` : 'No match found'} /></div>
        <div className="overview-reported"><Fact label="ORIGINAL DESCRIPTION" value={incident.description} /><Fact label="OBSERVED SYMPTOMS" value={incident.symptoms} /><Fact label="IMMEDIATE ACTION TAKEN" value={incident.immediate} /><Fact label="PREVIOUS CORRECTIVE ACTION" value={incident.previous} /></div>
        {incident.attachment && <div className="attachment-chip"><Icon name="clip" size={15} /> {incident.attachment}</div>}
      </section>
      <div className="analysis-status"><span className="status-orb"><Icon name={matches.length ? 'repeat' : 'check'} size={19} /></span><span><strong>{matches.length ? 'Similar historical incident detected.' : 'No matching historical incidents found.'}</strong><small>Transparent rules-based demo matching. Similarity is a review prompt, not confirmation of a shared cause.</small></span><Badge tone="neutral">Demo analysis</Badge></div>
      <section className="card incident-timeline"><div className="timeline-heading"><div><h2>Incident timeline</h2><p>Report, status changes, human reviews and follow-up updates from this browser session.</p></div><Badge tone="neutral">{reviewedSuggestions}/{suggestions.length} reviewed</Badge></div><div className="incident-timeline-list">{timelineEvents.map((entry, index) => <div className="incident-timeline-event" key={`${entry.type}-${entry.timestamp}-${index}`}><span className={`timeline-dot ${entry.type === 'review' && entry.title.startsWith('Rejected') ? 'timeline-dot-current' : ''}`} /><strong>{entry.title}</strong><span>{entry.detail}{entry.type === 'reported' ? '' : ` · ${new Date(entry.timestamp).toLocaleString('en-GB')}`}</span></div>)}</div></section>
      <div className="analysis-tabs" role="tablist" aria-label="Incident analysis sections">
        <button id="history-tab" role="tab" tabIndex={analysisTab === 'history' ? 0 : -1} aria-selected={analysisTab === 'history'} aria-controls="history-panel" className={analysisTab === 'history' ? 'analysis-tab active-analysis-tab' : 'analysis-tab'} onKeyDown={handleAnalysisTabKeyDown} onClick={() => setAnalysisTab('history')}><Icon name="repeat" size={16} /> Historical Matches <span>{matches.length}</span></button>
        <button id="suggestions-tab" role="tab" tabIndex={analysisTab === 'suggestions' ? 0 : -1} aria-selected={analysisTab === 'suggestions'} aria-controls="suggestions-panel" className={analysisTab === 'suggestions' ? 'analysis-tab active-analysis-tab' : 'analysis-tab'} onKeyDown={handleAnalysisTabKeyDown} onClick={() => setAnalysisTab('suggestions')}><Icon name="assistant" size={16} /> Suggested Investigation <span>{suggestions.length}</span></button>
      </div>
      {analysisTab === 'history' ? <section id="history-panel" role="tabpanel" aria-labelledby="history-tab" className="history-panel">
        {matches.length ? matches.map(({ incident: prior, reasons }) => <article className="card historical-detail-card" key={prior.id}>
          <div className="historical-detail-head"><span className="match-icon"><Icon name="repeat" /></span><div><button className="record-link" onClick={() => openIncident(prior)}>{prior.id} <Icon name="arrow" size={14} /></button><h2>{prior.title}</h2><p>{prior.site} · {prior.asset} · {formatDate(prior.date)}</p></div><Badge tone="amber">Similar record</Badge></div>
          <div className="match-reasons">{reasons.map((reason) => <Badge tone="neutral" key={reason}>{reason}</Badge>)}</div>
          <div className="historical-facts"><Fact label="PREVIOUSLY REPORTED SYMPTOMS" value={prior.symptoms} /><Fact label="PREVIOUS CORRECTIVE MEASURES" value={prior.corrective} /><Fact label="RECORDED OUTCOME" value={prior.outcome} /><Fact label="DID THE ISSUE OCCUR AGAIN?" value={`A later similar report is present: ${incident.id} (${formatDate(incident.date)}). This match does not prove the same cause.`} /></div>
        </article>) : <div className="card analysis-empty-state"><span className="empty-icon"><Icon name="search" /></span><strong>No matching historical incidents found.</strong><span>No records met the transparent demo matching threshold. This does not prove that the issue has never occurred.</span></div>}
      </section> : <section id="suggestions-panel" role="tabpanel" aria-labelledby="suggestions-tab" className="suggestion-panel">
        <div className="suggestion-intro"><Icon name="shield" size={17} /><span>Potential causes and checks are unverified hypotheses. Competent human review is required; suggestions do not authorise equipment restart or confirm site safety.</span></div>
        <div className="bulk-review-bar">
          <div><strong>Review all suggestions</strong><span>{pendingSuggestions.length ? `${pendingSuggestions.length} pending review` : 'All suggestions have been reviewed'}</span></div>
          <div>
            <label className="reviewer-name-field">Reviewer <input aria-label="Reviewer name" value={reviewerName} onChange={(event) => setReviewerName(event.target.value)} /></label>
            <button className="button button-primary" disabled={!pendingSuggestions.length} onClick={() => approvePendingSuggestions(incident.id, suggestions)}><Icon name="check" size={15} /> Approve All Pending</button>
            <button className="button button-secondary bulk-reject-button" disabled={!pendingSuggestions.length} onClick={() => openRejectionDialog(incident.id, pendingSuggestions.map((suggestion) => suggestion.id))}>Reject All Pending</button>
          </div>
        </div>
        {suggestions.map((suggestion, index) => {
          const review = suggestionReviews[reviewKey(incident.id, suggestion.id)];
          const tone = review?.status.startsWith('Approved') ? 'green' : review ? 'red' : 'neutral';
          return <article className={`card suggestion-card ${review ? (tone === 'green' ? 'suggestion-approved' : 'suggestion-rejected') : ''}`} key={suggestion.id}>
            <div className="suggestion-card-head"><span className="recommendation-number">{String(index + 1).padStart(2, '0')}</span><div><span className="eyebrow">POTENTIAL CAUSE / INVESTIGATION</span><h2>{suggestion.title}</h2></div><Badge tone="amber">Unverified</Badge></div>
            <div className="suggestion-details"><Fact label="SUPPORTING OBSERVATIONS / EVIDENCE" value={suggestion.evidence} /><Fact label="RECOMMENDED INSPECTION / VERIFICATION" value={suggestion.inspection} /><Fact label="SUGGESTED FOLLOW-UP ACTION" value={suggestion.action} /></div>
            <div className="suggestion-evidence"><Badge tone={matches.length ? 'blue' : 'neutral'}>{matches.length ? 'Historical + reported evidence' : 'Reported information only'}</Badge><span>Evidence level: {matches.length ? 'Related record(s) available; cause remains unverified' : 'Initial report only; cause remains unverified'}</span></div>
            {review ? <div className={`suggestion-review-record review-${tone}`} role="status">
              <div className="review-record-heading"><Badge tone={tone}>{review.status}</Badge><span>Reviewed by {review.reviewer} · {new Date(review.timestamp).toLocaleString('en-GB')}</span></div>
              {review.issue && <div className="review-feedback"><Fact label="ISSUE ACTUALLY FOUND" value={review.issue} /><Fact label="HOW IT WAS RECTIFIED" value={review.rectification} />{review.observations && <Fact label="ADDITIONAL OBSERVATIONS" value={review.observations} />}</div>}
              {review.followUp && <div className="followup-fields"><strong>Follow-up tracking · demo only</strong><div className="followup-grid"><label>Owner<input value={review.followUp.owner} onChange={(event) => updateFollowUp(incident.id, suggestion.id, 'owner', event.target.value)} /></label><label>Due date<input type="date" value={review.followUp.dueDate} onChange={(event) => updateFollowUp(incident.id, suggestion.id, 'dueDate', event.target.value)} /></label><label>Status<select value={review.followUp.status} onChange={(event) => { if (event.target.value === 'Completed' && !review.followUp.outcome.trim()) { setNotice('Add a verified follow-up outcome before marking this item completed.'); return; } updateFollowUp(incident.id, suggestion.id, 'status', event.target.value); }}><option>Planned</option><option>In progress</option><option>Completed</option></select></label></div><label className="followup-outcome">Follow-up outcome{review.followUp.status === 'Completed' && <b> *</b>}<input value={review.followUp.outcome} onChange={(event) => updateFollowUp(incident.id, suggestion.id, 'outcome', event.target.value)} placeholder="Record verified findings; required before marking completed" /></label></div>}
              {!review.issue && <p className="review-meaning">Accepted for further investigation only. This does not confirm root cause or completion of corrective work.</p>}
              <small className="rereview-note">Review decisions are retained for this session. Re-review is not enabled in this prototype.</small>
            </div> : <div className="suggestion-actions"><Badge tone="neutral">Pending Review</Badge><div><button className="button button-primary" onClick={() => approveSuggestion(incident.id, suggestion.id)}><Icon name="check" size={15} /> Approve for Follow-up</button><button className="button button-secondary" onClick={() => openRejectionDialog(incident.id, suggestion.id)}>Reject Suggestion</button></div></div>}
          </article>;
        })}
      </section>}
    </div>;
  }

  function renderAnalyzing() {
    return <div className="page-content analyzing-page">
      <div className="analyzing-card card" role="status" aria-live="polite">
        <span className="analyzing-orb"><span className="analyzing-spinner" /><Icon name="shield" size={24} /></span>
        <div className="eyebrow">SIMULATED DEMONSTRATION ANALYSIS</div>
        <h1>AI analysing your request</h1>
        <p>Reviewing the incident details and checking for similar reports in the demo dataset.</p>
        <div className="analysis-progress"><span /></div>
        <div className="analysis-steps">
          <span><Icon name="check" size={15} /> Incident report saved to this browser session</span>
          <span><Icon name="repeat" size={15} /> Comparing site, asset, category and symptoms</span>
          <span><Icon name="shield" size={15} /> Preparing suggestions for competent human review</span>
        </div>
        <div className="analysis-demo-note">This is a simulated analysis. No live AI service is connected; possible causes will be shown as unverified hypotheses.</div>
      </div>
    </div>;
  }

  function renderAssistant() {
    const suggestions = [
      'Which site has the most incidents?',
      'What is the most commonly reported problem?',
      'Which equipment issues have happened more than once?',
      'How many high-severity incidents are recorded?',
    ];
    return <div className="page-content assistant-page">
      <div className="page-heading"><div><div className="eyebrow">DEMO KNOWLEDGE BASE · {incidents.length} INCIDENT RECORDS</div><h1>AI Assistant</h1><p>Ask questions about the incidents recorded in this demo workspace.</p></div><Badge tone="neutral">Session data</Badge></div>
      <div className="demo-banner"><span className="demo-mark">D</span><span><strong>Knowledge-base answers · demonstration only</strong><span>Answers are calculated from the incident records visible in this prototype. No live AI or external service is connected.</span></span><Icon name="assistant" size={16} /></div>
      <div className="assistant-layout">
        <section className="assistant-chat card">
          <div className="assistant-chat-header"><span className="assistant-avatar"><Icon name="assistant" size={20} /></span><span><strong>SiteGuard Assistant</strong><small><i /> Ready · local demo knowledge base</small></span><Badge tone="green">Demo</Badge></div>
          <div className="assistant-conversation" aria-live="polite">
            <div className="chat-message assistant-message"><span className="message-avatar"><Icon name="assistant" size={16} /></span><div className="message-content"><strong>SiteGuard Assistant</strong><p>Hi! I can help explore patterns in the current incident records. Try asking which site has the most reports, which problem appears most often, or what equipment issues have recurred.</p><small>Based on {incidents.length} incident records in this browser session.</small></div></div>
            {assistantMessages.map((message, index) => {
              if (message.role === 'user') return <div className="chat-message user-message" key={`user-${index}`}><div className="message-content"><strong>You</strong><p>{message.text}</p></div><span className="user-message-avatar">SC</span></div>;
              const citedIncidents = message.sourceIds.map((id) => incidents.find((incident) => incident.id === id)).filter(Boolean);
              const dates = citedIncidents.map((source) => source.date).sort();
              const period = dates.length ? `${formatDate(dates[0])}–${formatDate(dates.at(-1))}` : '';
              return <div className="chat-message assistant-message" key={`assistant-${index}`}><span className="message-avatar"><Icon name="assistant" size={16} /></span><div className="message-content"><strong>SiteGuard Assistant</strong><p>{message.answer}</p>{message.sourceIds.length > 0 && <div className="assistant-sources"><span>Sources · {citedIncidents.length} records · {period}</span>{message.sourceIds.map((id) => {
                const source = incidents.find((incident) => incident.id === id);
                return source && <button key={id} onClick={() => openIncident(source)}>{id}</button>;
              })}</div>}<small>Calculated from current session records · demo response</small></div></div>;
            })}
          </div>
          {assistantMessages.length === 0 && <div className="suggestion-area"><span>TRY ASKING</span><div className="suggestion-list">{suggestions.map((question) => <button key={question} onClick={() => askAssistant(question)}>{question}<Icon name="arrow" size={14} /></button>)}</div></div>}
          <form className="assistant-input-row" onSubmit={(event) => { event.preventDefault(); askAssistant(assistantQuestion); }}>
            <label className="assistant-input"><Icon name="search" size={17} /><input aria-label="Ask the SiteGuard Assistant" placeholder="Ask about sites, incidents, categories or recurrence…" value={assistantQuestion} onChange={(event) => setAssistantQuestion(event.target.value)} /></label>
            <button className="button button-primary" type="submit" disabled={!assistantQuestion.trim()}>Ask <Icon name="arrow" size={15} /></button>
          </form>
        </section>
        <aside className="assistant-aside">
          <div className="card assistant-info"><span className="assistant-info-icon"><Icon name="list" /></span><h2>What it can answer</h2><p>Quick summaries from the incidents currently in this browser session.</p><ul><li>Reports by site</li><li>Most-reported categories</li><li>Repeated site and asset patterns</li><li>High-severity record counts</li></ul></div>
          <div className="card assistant-info governance-info"><span className="assistant-info-icon"><Icon name="shield" /></span><h2>Keep in context</h2><p>Counts reflect the small demonstration dataset and may change as you add reports. They are not adjusted for site size, working hours or exposure, and do not establish root cause or comparative risk.</p></div>
        </aside>
      </div>
    </div>;
  }

  function renderRecurrence() {
    return <div className="page-content">
      <div className="page-heading"><div><div className="eyebrow">PATTERNS &amp; FOLLOW-UP</div><h1>Recurrence workbench</h1><p>Prioritize repeated incident patterns and review their history.</p></div><Badge tone="neutral">Rules-based demo</Badge></div>
      <div className="recurrence-caveat"><Icon name="alert" size={17} /><span><strong>Recurrence is a review prompt, not proof of a shared cause.</strong> Verify conditions and corrective actions with competent staff.</span></div>
      <section className="recurrence-controls" aria-label="Filter recurrence patterns">
        <label className="recurrence-search"><Icon name="search" size={16} /><input aria-label="Search patterns" placeholder="Search site, asset or category" value={recurrenceQuery} onChange={(event) => setRecurrenceQuery(event.target.value)} /></label>
        <label><span>Site</span><select aria-label="Filter by site" value={recurrenceSiteFilter} onChange={(event) => setRecurrenceSiteFilter(event.target.value)}><option>All sites</option>{recurrenceSites.map((site) => <option key={site}>{site}</option>)}</select></label>
        <label><span>Severity</span><select aria-label="Filter by severity" value={recurrenceSeverityFilter} onChange={(event) => setRecurrenceSeverityFilter(event.target.value)}><option>All severities</option><option>High</option><option>Not high</option></select></label>
        <label><span>Reported</span><select aria-label="Filter by reporting period" value={recurrenceRange} onChange={(event) => setRecurrenceRange(event.target.value)}><option>Any time</option><option>Last 30 days</option><option>Last 90 days</option><option>Last year</option></select></label>
        <label><span>Sort by</span><select aria-label="Sort patterns" value={recurrenceSort} onChange={(event) => setRecurrenceSort(event.target.value)}><option>Most reports</option><option>Latest report</option></select></label>
      </section>
      <div className="recurrence-results-summary"><strong>{recurrenceWorklist.length}</strong> {recurrenceWorklist.length === 1 ? 'pattern' : 'patterns'} shown of {recurringMatches.length} <span>·</span> {recurrenceWorklist.reduce((sum, pattern) => sum + pattern.group.length, 0)} linked reports</div>
      {recurringMatches.length === 0
        ? <div className="card empty-state"><span className="empty-icon"><Icon name="repeat" /></span><strong>No repeated patterns in this session yet</strong><span>As similar incidents are reported, patterns will appear here.</span></div>
        : <div className="recurrence-workbench">
          <section className="recurrence-patterns card" aria-label="Repeated incident patterns">
            <div className="recurrence-panel-heading"><h2>Patterns to review</h2><span>Ranked by {recurrenceSort === 'Most reports' ? 'report count' : 'latest report'}</span></div>
            {recurrenceWorklist.map((pattern, index) => <button key={pattern.key} className={`recurrence-pattern ${selectedRecurrence?.key === pattern.key ? 'recurrence-pattern-selected' : ''}`} aria-pressed={selectedRecurrence?.key === pattern.key} onClick={() => setSelectedRecurrenceKey(pattern.key)}>
              <span className="recurrence-rank">{String(index + 1).padStart(2, '0')}</span>
              <span className="recurrence-pattern-copy"><strong>{pattern.first.asset} · {pattern.first.title.replace(/ at .*/, '')}</strong><span>{pattern.first.site} · {pattern.first.area}</span><small>{pattern.first.category} · Latest {formatDate(pattern.latest.date)}</small></span>
              <span className="recurrence-pattern-meta"><b>{pattern.group.length}×</b>{pattern.highSeverity && <Badge tone="red">High</Badge>}</span>
            </button>)}
            {recurrenceWorklist.length === 0 && <div className="recurrence-filter-empty"><strong>No patterns match these filters.</strong><span>Try widening the date range or changing your filters.</span></div>}
          </section>
          {selectedRecurrence && <section className="recurrence-detail card" aria-label="Selected recurrence pattern">
            <div className="recurrence-detail-head"><div><div className="eyebrow">{selectedRecurrence.first.site} · {selectedRecurrence.first.area}</div><h2>{selectedRecurrence.first.asset} · {selectedRecurrence.first.title.replace(/ at .*/, '')}</h2><p>{selectedRecurrence.first.category} pattern · {selectedRecurrence.group.length} linked incidents</p></div><div className="recurrence-detail-badges"><Badge tone="blue">Review recommended</Badge><Badge tone={statusTone(selectedRecurrence.latest.status)}>Latest record · {selectedRecurrence.latest.status}</Badge></div></div>
            <div className="recurrence-detail-stats"><div><span>REPORTS</span><strong>{selectedRecurrence.group.length}</strong></div><div><span>FIRST REPORTED</span><strong>{formatDate(selectedRecurrence.first.date)}</strong></div><div><span>MOST RECENT</span><strong>{formatDate(selectedRecurrence.latest.date)}</strong></div><div><span>TIME SPAN</span><strong>{selectedRecurrence.days} days</strong></div></div>
            <div className="recurrence-history-heading"><div><h3>Incident history</h3><p>Select a report to review its full record.</p></div><span>{selectedRecurrence.group.length} reports</span></div>
            <div className="timeline">{selectedRecurrence.ordered.map((incident, index) => <button className={`timeline-item ${index === selectedRecurrence.ordered.length - 1 ? 'timeline-item-current' : ''}`} key={incident.id} onClick={() => openIncident(incident)}>
              <span className={`timeline-dot ${index === selectedRecurrence.ordered.length - 1 ? 'timeline-dot-current' : ''}`} /><span className="timeline-date">{formatDate(incident.date)}</span><span className="record-link">{incident.id} <Icon name="arrow" size={13} /></span><span className="timeline-desc">{incident.title}</span><Badge tone={severityTone(incident.severity)}>{incident.severity}</Badge>
            </button>)}</div>
            <div className="recurrence-followup"><span className="recurrence-followup-icon"><Icon name="shield" size={17} /></span><div><strong>Follow-up: review recommended</strong><p>Compare the prior measures with current inspection and work-order records. The pattern alone does not verify cause or lasting resolution.</p></div><button className="button button-primary" onClick={() => openIncident(selectedRecurrence.latest)}>Review latest report <Icon name="arrow" size={14} /></button></div>
            <div className="recurrence-insight-grid"><div><strong>Previously recorded measures</strong><p>{[...new Set(selectedRecurrence.group.map((item) => item.corrective))].join(' / ')}</p></div><div><strong>Possible causes · hypotheses only</strong><p>{selectedRecurrence.first.asset === 'CV-04' ? 'Check lubrication, bearing condition, alignment, contamination and operating load.' : 'Check repair effectiveness, coupling / seal condition and hose integrity.'}</p></div><div><strong>Recommended next step</strong><p>Verify the current condition safely, compare records and document the outcome and effectiveness check.</p></div></div>
          </section>}
        </div>}
    </div>;
  }

  const title = navItems.find((item) => item.id === page)?.label || (page === 'report' ? 'New incident report' : page === 'analysis' ? 'Incident analysis' : page === 'analyzing' ? 'AI analysing request' : 'SiteGuard Intelligence');
  const effectivenessReviewCount = followUps.filter((task) => task.status === 'Complete' && task.effectiveness !== 'Verified').length;
  return <div className={`app-shell ${dark ? 'theme-dark' : ''}`}>
    <aside className="sidebar">
      <button className="brand" onClick={() => navigatePage('dashboard')} aria-label="SiteGuard Intelligence home"><span className="brand-mark"><Icon name="shield" size={21} /></span><span className="brand-copy"><strong>SiteGuard</strong><small>INTELLIGENCE</small></span></button>
      <div className="workspace-label">WORKSPACE</div><div className="site-switcher"><span className="site-switcher-icon"><Icon name="grid" size={16} /></span><span><strong>All operations</strong><small>UK · 3 active sites</small></span><Icon name="chevron" size={15} /></div>
      <div className="nav-label">OPERATIONS</div><nav className="main-nav" aria-label="Main navigation">{navItems.map((item) => <button key={item.id} aria-label={item.label} title={item.label} className={`nav-item ${page === item.id ? 'nav-active' : ''}`} onClick={() => navigatePage(item.id)}><Icon name={item.icon} size={18} /><span>{item.label}</span>{item.id === 'recurrence' && recurringMatches.length > 0 && <span className="nav-count">{recurringMatches.length}</span>}{item.id === 'follow-up' && overdueFollowUpCount > 0 && <span className="nav-count">{overdueFollowUpCount}</span>}</button>)}</nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-safety"><span><Icon name="shield" size={17} /></span><div><strong>Safety guidance</strong><p>AI suggestions need competent human review.</p></div></div>
      <div className="profile"><span className="profile-avatar">SC</span><span><strong>Site Coordinator</strong><small>Demo workspace</small></span><button className="icon-button profile-menu" onClick={() => setNotice('Signed in as Site Coordinator · Demo workspace.')} aria-label="Show profile details"><span>···</span></button></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="breadcrumbs"><span>SiteGuard</span><Icon name="chevron" size={14} /><strong>{title}</strong></div><div className="topbar-actions"><span className="environment-chip"><i /> Demo environment</span><button className="icon-button theme-button" onClick={() => setDark((value) => !value)} aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`} title={`Switch to ${dark ? 'light' : 'dark'} theme`}><Icon name={dark ? 'sun' : 'moon'} size={18} /></button><button className="icon-button notification-button" onClick={() => setNotice('No new notifications in this demo session.')} aria-label="Notifications"><Icon name="bell" size={18} /><i /></button><span className="top-avatar">SC</span></div></header>
      {page === 'dashboard' && renderDashboard()}
      {page === 'register' && renderRegister()}
      {page === 'follow-up' && renderFollowUp()}
      {page === 'report' && renderReport()}
      {page === 'analyzing' && renderAnalyzing()}
      {page === 'analysis' && renderAnalysis()}
      {page === 'recurrence' && renderRecurrence()}
      {page === 'assistant' && renderAssistant()}
    </main>
    {selected && <IncidentDrawer incident={incidents.find((item) => item.id === selected.id) || selected} onClose={() => setSelected(null)} onStatusChange={(status) => updateIncident(selected.id, { status })} matches={findMatches(selected, incidents)} onOpenIncident={(incident) => setSelected(incident)} onRunAnalysis={(incident) => { setSelected(null); setAnalysis({ incident, matches: findMatches(incident, incidents), reviewed: false }); navigatePage('analysis', { incidentId: incident.id }); }} />}
    {reviewDialog && <div className="review-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setReviewDialog(null); }}>
      <section className="review-dialog card" role="dialog" aria-modal="true" aria-labelledby="reject-dialog-title">
        <div className="review-dialog-head"><div><span className="eyebrow">HUMAN REVIEW · {reviewDialog.incidentId}</span><h2 id="reject-dialog-title">Reject Investigation Suggestion</h2><p>{reviewDialog.suggestionIds.length > 1 ? `Record shared reviewer feedback for all ${reviewDialog.suggestionIds.length} pending suggestions. Each suggestion will retain this decision and feedback.` : 'Keep the suggestion for reference and record what was found instead.'}</p></div><button className="icon-button" aria-label="Close rejection review" onClick={() => setReviewDialog(null)}><Icon name="close" /></button></div>
        <form onSubmit={submitSuggestionRejection}>
          <label className="review-dialog-field"><span>1. What issue did you actually find? <b>*</b></span><textarea autoFocus rows="3" placeholder="Describe the actual issue identified during inspection." value={reviewDialog.issue} onChange={(event) => setReviewDialog((current) => ({ ...current, issue: event.target.value, error: '' }))} /></label>
          <label className="review-dialog-field"><span>2. How was the issue rectified? <b>*</b></span><textarea rows="3" placeholder="Describe the repair, adjustment, replacement, or other corrective action performed." value={reviewDialog.rectification} onChange={(event) => setReviewDialog((current) => ({ ...current, rectification: event.target.value, error: '' }))} /></label>
          <label className="review-dialog-field"><span>3. Optional additional observations</span><textarea rows="2" placeholder="Add inspection findings or other relevant information." value={reviewDialog.observations} onChange={(event) => setReviewDialog((current) => ({ ...current, observations: event.target.value }))} /></label>
          {reviewDialog.error && <div className="form-error" role="alert"><Icon name="alert" size={16} />{reviewDialog.error}</div>}
          <div className="review-dialog-actions"><button type="button" className="button button-secondary" onClick={() => setReviewDialog(null)}>Cancel</button><button type="submit" className="button button-primary">Submit Review</button></div>
        </form>
      </section>
    </div>}
    {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notification"><Icon name="close" size={15} /></button></div>}
  </div>;
}

function Metric({ label, value, foot, icon, accent, ariaLabel, onClick }) {
  const content = <><span className={`metric-icon ${accent}`}><Icon name={icon} size={18} /></span><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className="metric-foot">{foot}</span></>;
  return onClick
    ? <button className="metric-card metric-card-action" aria-label={ariaLabel} onClick={onClick}>{content}</button>
    : <div className="metric-card">{content}</div>;
}

function IncidentTable({ incidents, onSelect, compact = false }) {
  return <div className={`table-scroll ${compact ? 'compact-table' : ''}`}><table className="incident-table"><thead><tr><th>INCIDENT</th><th>SITE / AREA</th><th>CATEGORY</th><th>ASSET</th><th>DATE REPORTED</th><th>SEVERITY</th><th>RECURRENCE</th><th>STATUS</th><th>OWNER</th><th /></tr></thead>
    <tbody>{incidents.map((incident) => <tr key={incident.id} onClick={() => onSelect(incident)} tabIndex="0" onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(incident); } }}>
      <td><span className="table-title">{incident.title}</span><span className="table-id">{incident.id}{incident.demo && <span className="new-demo-pill">NEW · SESSION</span>}</span></td>
      <td><span className="table-title">{incident.site}</span><span className="table-sub">{incident.area}</span></td><td><span className="category-dot">{incident.category}</span></td><td><span className="asset-code">{incident.asset}</span></td><td className="date-cell">{formatDate(incident.date)}</td>
      <td><Badge tone={severityTone(incident.severity)}><i className="badge-dot" />{incident.severity}</Badge></td>
      <td>{findMatches(incident, incidents).length ? <Badge tone="amber">Repeat</Badge> : <Badge tone="neutral">—</Badge>}</td>
      <td><Badge tone={statusTone(incident.status)}>{incident.status}</Badge></td><td><span className="owner-cell"><span className="owner-avatar">{incident.owner.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span>{incident.owner}</span></td><td><Icon name="chevron" size={16} /></td>
    </tr>)}</tbody></table></div>;
}

function Field({ label, required = false, wide = false, children }) {
  return <label className={`field ${wide ? 'field-wide' : ''}`}><span>{label}{required && <b> *</b>}</span>{children}</label>;
}

function Fact({ label, value }) {
  return <div className="fact"><span>{label}</span><strong>{value || 'Not recorded'}</strong></div>;
}

function IncidentDrawer({ incident, onClose, onStatusChange, matches, onOpenIncident, onRunAnalysis }) {
  return <div className="drawer-backdrop" onClick={onClose}>
    <aside className="incident-drawer" onClick={(event) => event.stopPropagation()} aria-label={`Incident details ${incident.id}`}>
      <div className="drawer-header"><div><span className="eyebrow">INCIDENT RECORD</span><div className="drawer-id">{incident.id}</div></div><button className="icon-button" onClick={onClose} aria-label="Close incident details"><Icon name="close" /></button></div>
      <div className="drawer-body"><div className="drawer-tags"><Badge tone={severityTone(incident.severity)}>{incident.severity} severity</Badge><Badge tone={statusTone(incident.status)}>{incident.status}</Badge></div><h1>{incident.title}</h1><p className="drawer-site">{incident.site} · {incident.area}</p>
        <div className="drawer-section"><h3>Incident details</h3><Fact label="DATE REPORTED" value={formatDate(incident.date)} /><Fact label="CATEGORY" value={incident.category} /><Fact label="ASSET ID" value={incident.asset} /><Fact label="ASSIGNED TO" value={incident.owner} /></div>
        <div className="drawer-section"><h3>Reported information</h3><Fact label="DESCRIPTION" value={incident.description} /><Fact label="OBSERVED SYMPTOMS" value={incident.symptoms} /><Fact label="IMMEDIATE ACTION" value={incident.immediate} /><Fact label="PREVIOUS ACTION (REPORTED)" value={incident.previous} /><Fact label="PRODUCTION / SAFETY IMPACT" value={incident.impact} /></div>
        <div className="drawer-section"><h3>Update status</h3><select className="drawer-status-select" aria-label="Update incident status" value={incident.status} onChange={(event) => onStatusChange(event.target.value)}>{['Under investigation', 'Action required', 'Closed'].map((status) => <option key={status}>{status}</option>)}</select></div>
        {matches.length > 0 && <div className="drawer-section"><h3><Icon name="repeat" size={16} /> Related historical records</h3>{matches.map(({ incident: prior }) => <button className="related-record" key={prior.id} onClick={() => onOpenIncident(prior)}><span><strong>{prior.id} · {formatDate(prior.date)}</strong><small>{prior.title}</small></span><Icon name="chevron" size={16} /></button>)}</div>}
        <div className="drawer-governance"><Icon name="shield" size={17} /><span>Causes and recommendations are unverified until a competent person reviews them. Never use this record alone to authorise restart or declare a site safe.</span></div>
      </div>
      <div className="drawer-footer"><button className="button button-secondary" onClick={onClose}>Close</button><button className="button button-primary" onClick={() => onRunAnalysis(incident)}>Run simulated analysis</button></div>
    </aside>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
