import "./App.css";
import { useEffect, useMemo, useState } from "react";
import {
  Circle,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

const HAZARDS = [
  { id: "flood", name: "Flood", icon: "🌊", color: "#2563eb", center: [13.0827, 80.2707], radius: 22000 },
  { id: "landslide", name: "Landslide", icon: "⛰️", color: "#a16207", center: [11.4102, 76.695], radius: 18000 },
  { id: "cyclone", name: "Cyclone", icon: "🌀", color: "#7c3aed", center: [16.5062, 80.648], radius: 45000 },
  { id: "earthquake", name: "Earthquake", icon: "🌍", color: "#dc2626", center: [28.6139, 77.209], radius: 30000 },
  { id: "tsunami", name: "Tsunami", icon: "🌊", color: "#0891b2", center: [9.9312, 76.2673], radius: 26000 },
];

const HABITATIONS = [
  { id: 1, name: "North Chennai", hazard: "Flood", risk: "High", people: 8200, vulnerability: "High", condition: "Water level rising", lat: 13.12, lng: 80.29 },
  { id: 2, name: "Kodaikanal Hills", hazard: "Landslide", risk: "High", people: 3100, vulnerability: "High", condition: "Heavy rainfall", lat: 10.24, lng: 77.49 },
  { id: 3, name: "Coastal Nagapattinam", hazard: "Tsunami", risk: "High", people: 5400, vulnerability: "Medium", condition: "Coastal exposure", lat: 10.77, lng: 79.84 },
  { id: 4, name: "Machilipatnam Coast", hazard: "Cyclone", risk: "Medium", people: 4700, vulnerability: "High", condition: "Cyclone watch", lat: 16.18, lng: 81.13 },
  { id: 5, name: "Delhi Seismic Zone", hazard: "Earthquake", risk: "Medium", people: 6800, vulnerability: "Medium", condition: "Seismic risk", lat: 28.62, lng: 77.21 },
];

const SHELTERS = [
  { id: "S1", name: "Government Higher Secondary School", distance: 3.2, capacity: 1200, occupied: 420, water: true, toilets: true, healthcare: true, access: "Good", risk: "Low" },
  { id: "S2", name: "Community Relief Centre", distance: 5.1, capacity: 900, occupied: 250, water: true, toilets: true, healthcare: false, access: "Good", risk: "Low" },
  { id: "S3", name: "Municipal Convention Hall", distance: 7.4, capacity: 1800, occupied: 1050, water: true, toilets: true, healthcare: true, access: "Excellent", risk: "Low" },
  { id: "S4", name: "District Sports Complex", distance: 11.2, capacity: 2400, occupied: 300, water: true, toilets: true, healthcare: true, access: "Excellent", risk: "Low" },
];

const TRANSLATIONS = {
  en: {
    title: "SafeZone AI",
    subtitle: "Multi-Hazard Disaster Preparedness, Temporary Relocation & Recovery",
    active: "System Active",
    overview: "Disaster Risk Overview",
    overviewText: "Identify vulnerable habitations, plan temporary relocation, respond to changing risk and support safe recovery.",
    prepare: "BEFORE — PREPARE",
    respond: "DURING — RESPOND",
    recover: "AFTER — RECOVER",
  },
  ta: {
    title: "SafeZone AI",
    subtitle: "பல பேரிடர் தயார்நிலை, தற்காலிக இடமாற்றம் மற்றும் மீட்பு",
    active: "அமைப்பு செயல்பாட்டில்",
    overview: "பேரிடர் அபாய மேலோட்டம்",
    overviewText: "பாதிக்கப்படக்கூடிய குடியிருப்புகளை கண்டறிந்து, தற்காலிக இடமாற்றத்தை திட்டமிட்டு, மீட்பை நிர்வகிக்க உதவும்.",
    prepare: "பேரிடருக்கு முன் — தயாரிப்பு",
    respond: "பேரிடர் போது — பதில் நடவடிக்கை",
    recover: "பேரிடருக்கு பின் — மீட்பு",
  },
  hi: {
    title: "SafeZone AI",
    subtitle: "बहु-आपदा तैयारी, अस्थायी पुनर्वास और पुनर्प्राप्ति",
    active: "सिस्टम सक्रिय",
    overview: "आपदा जोखिम अवलोकन",
    overviewText: "कमजोर बस्तियों की पहचान, अस्थायी स्थानांतरण, बदलते जोखिम और सुरक्षित वापसी में सहायता।",
    prepare: "पहले — तैयारी",
    respond: "दौरान — प्रतिक्रिया",
    recover: "बाद में — पुनर्प्राप्ति",
  },
};

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 5);
  }, [center, map]);
  return null;
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function App() {
  const [language, setLanguage] = useState("en");
  const [selectedHazard, setSelectedHazard] = useState("all");
  const [selectedHabitation, setSelectedHabitation] = useState(HABITATIONS[0]);
  const [selectedShelter, setSelectedShelter] = useState(SHELTERS[0]);
  const [modal, setModal] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(() => Number(localStorage.getItem("safezonePendingSync") || 0));
  const [relocations, setRelocations] = useState(() => {
    try { return JSON.parse(localStorage.getItem("safezoneRelocations") || "[]"); } catch { return []; }
  });
  const [reports, setReports] = useState(() => {
    try { return JSON.parse(localStorage.getItem("safezoneReports") || "[]"); } catch { return []; }
  });
  const [feedback, setFeedback] = useState(() => {
    try { return JSON.parse(localStorage.getItem("safezoneFeedback") || "[]"); } catch { return []; }
  });
  const [alerts, setAlerts] = useState([]);
  const [riskSeverity, setRiskSeverity] = useState(65);
  const [whatIfRain, setWhatIfRain] = useState(70);
  const [whatIfPopulation, setWhatIfPopulation] = useState(5000);
  const [returnInputs, setReturnInputs] = useState({ water: "Clear", road: "Open", structural: "Verified" });
  const [reportForm, setReportForm] = useState({ category: "House damage", description: "", urgency: "High" });
  const [feedbackForm, setFeedbackForm] = useState({ shelter: 5, relocation: 5, message: "" });

  const t = TRANSLATIONS[language];

  useEffect(() => {
    const onlineHandler = () => setOnline(true);
    const offlineHandler = () => setOnline(false);
    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);
    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
    };
  }, []);

  useEffect(() => localStorage.setItem("safezoneRelocations", JSON.stringify(relocations)), [relocations]);
  useEffect(() => localStorage.setItem("safezoneReports", JSON.stringify(reports)), [reports]);
  useEffect(() => localStorage.setItem("safezoneFeedback", JSON.stringify(feedback)), [feedback]);
  useEffect(() => localStorage.setItem("safezonePendingSync", String(pendingSync)), [pendingSync]);

  const visibleHazards = selectedHazard === "all"
    ? HAZARDS
    : HAZARDS.filter((h) => h.id === selectedHazard);

  const filteredHabitation = selectedHazard === "all"
    ? HABITATIONS
    : HABITATIONS.filter((h) => h.hazard.toLowerCase() === HAZARDS.find((x) => x.id === selectedHazard)?.name.toLowerCase());

  const dynamicRisk = riskSeverity >= 75 ? "High" : riskSeverity >= 45 ? "Medium" : "Low";
  const whatIfPeople = Math.round(whatIfPopulation * (0.35 + whatIfRain / 180));
  const availableCapacity = selectedShelter.capacity - selectedShelter.occupied;

  const returnStatus = useMemo(() => {
    const safe = returnInputs.water === "Clear" && returnInputs.road === "Open" && returnInputs.structural === "Verified";
    return safe ? "Safe to Return Home" : "Continue Temporary Relocation";
  }, [returnInputs]);

  const createAlert = (type) => {
    const message = type === "SMS"
      ? "SMS fallback queued for high-risk habitations."
      : "Emergency alert sent to affected citizens.";
    setAlerts((prev) => [{ id: Date.now(), type, message, time: new Date().toLocaleTimeString() }, ...prev]);
    if (type === "SMS") setPendingSync((n) => n + 1);
  };

  const matchShelter = () => {
    const ranked = [...SHELTERS]
      .filter((s) => s.capacity - s.occupied > selectedHabitation.people * 0.15)
      .sort((a, b) => (a.distance + (a.capacity - a.occupied) / 1000) - (b.distance + (b.capacity - b.occupied) / 1000));
    const target = ranked[0] || SHELTERS[0];
    setSelectedShelter(target);
    setModal("relocation");
  };

  const saveReport = (e) => {
    e.preventDefault();
    const report = {
      id: `R-${Date.now()}`,
      habitation: selectedHabitation.name,
      location: `${selectedHabitation.lat.toFixed(3)}, ${selectedHabitation.lng.toFixed(3)}`,
      ...reportForm,
      status: online ? "Submitted" : "Saved Offline",
      createdAt: new Date().toLocaleString(),
    };
    setReports((prev) => [report, ...prev]);
    if (!online) setPendingSync((n) => n + 1);
    setReportForm({ category: "House damage", description: "", urgency: "High" });
    setModal(null);
  };

  const saveFeedback = (e) => {
    e.preventDefault();
    setFeedback((prev) => [{ id: Date.now(), ...feedbackForm, createdAt: new Date().toLocaleString() }, ...prev]);
    setFeedbackForm({ shelter: 5, relocation: 5, message: "" });
    setModal(null);
  };

  const assignRelocation = () => {
    const item = {
      id: `REL-${Date.now()}`,
      habitation: selectedHabitation.name,
      people: selectedHabitation.people,
      shelter: selectedShelter.name,
      status: "Assigned",
      updated: new Date().toLocaleString(),
    };
    setRelocations((prev) => [item, ...prev]);
    setModal(null);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="header-actions">
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="language">
            <option value="en">English</option>
            <option value="ta">தமிழ்</option>
            <option value="hi">हिन्दी</option>
          </select>
          <div className="status">
            <span className={`status-dot ${online ? "" : "offline"}`}></span>
            {online ? t.active : "Offline Mode"}
          </div>
        </div>
      </header>

      <main className="dashboard">
        <section className="welcome">
          <div>
            <div className="eyebrow">AI + GIS DISASTER MANAGEMENT</div>
            <h2>{t.overview}</h2>
            <p>{t.overviewText}</p>
          </div>
          <div className="welcome-actions">
            <button className="primary" onClick={() => document.getElementById("risk-map")?.scrollIntoView({ behavior: "smooth" })}>
              View Hazard Map
            </button>
            <button className="secondary" onClick={() => setModal("whatif")}>Run What-If</button>
          </div>
        </section>

        <section className="stats">
          <div className="card"><span className="card-title">High-Risk Zones</span><strong>{dynamicRisk === "High" ? 24 : dynamicRisk === "Medium" ? 16 : 8}</strong><small>Dynamic demo risk output</small></div>
          <div className="card"><span className="card-title">Vulnerable Habitations</span><strong>{HABITATIONS.length}</strong><small>Multi-hazard assessment list</small></div>
          <div className="card"><span className="card-title">Immediate Priority</span><strong>{HABITATIONS.filter((h) => h.risk === "High").length}</strong><small>Require urgent review</small></div>
          <div className="card"><span className="card-title">Available Shelter Capacity</span><strong>{SHELTERS.reduce((sum, s) => sum + s.capacity - s.occupied, 0).toLocaleString()}</strong><small>Demo capacity remaining</small></div>
        </section>

        <section className="phase-strip">
          <button className="phase before" onClick={() => document.getElementById("before")?.scrollIntoView({ behavior: "smooth" })}>{t.prepare}</button>
          <button className="phase during" onClick={() => document.getElementById("during")?.scrollIntoView({ behavior: "smooth" })}>{t.respond}</button>
          <button className="phase after" onClick={() => document.getElementById("after")?.scrollIntoView({ behavior: "smooth" })}>{t.recover}</button>
        </section>

        <section className="content-grid" id="risk-map">
          <div className="map-card">
            <div className="section-header">
              <div><h3>1. Multi-Hazard Dynamic Risk Map</h3><p>Interactive GIS view for five disaster types</p></div>
              <span className="map-label">GIS</span>
            </div>

            <div className="hazard-tabs">
              <button className={selectedHazard === "all" ? "active" : ""} onClick={() => setSelectedHazard("all")}>All Hazards</button>
              {HAZARDS.map((h) => <button key={h.id} className={selectedHazard === h.id ? "active" : ""} onClick={() => setSelectedHazard(h.id)}>{h.icon} {h.name}</button>)}
            </div>

            <MapContainer center={[20.5937, 78.9629]} zoom={5} scrollWheelZoom style={{ height: "390px", width: "100%" }}>
              <MapRecenter center={selectedHazard === "all" ? [20.5937, 78.9629] : visibleHazards[0].center} />
              <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {visibleHazards.map((h) => (
                <Circle key={h.id} center={h.center} radius={h.radius} pathOptions={{ color: h.color, fillColor: h.color, fillOpacity: 0.2 }}>
                  <Popup><b>{h.name} Risk Zone</b><br />Risk level: {h.id === "flood" || h.id === "landslide" ? "High" : "Medium"}<br />Demo GIS layer</Popup>
                </Circle>
              ))}
            </MapContainer>
            <div className="map-note">Prototype map uses demonstration GIS layers. Connect official live feeds in Phase 3.</div>
          </div>

          <div className="priority-card">
            <div className="section-header"><div><h3>3. Relocation Priority Assessment</h3><p>Temporary relocation priority</p></div></div>
            <div className="priority-item immediate"><div><b>Immediate</b><span>High risk + high exposure</span></div><strong>{HABITATIONS.filter((h) => h.risk === "High").length}</strong></div>
            <div className="priority-item short"><div><b>High Priority</b><span>Medium risk / vulnerable</span></div><strong>{HABITATIONS.filter((h) => h.risk === "Medium").length}</strong></div>
            <div className="priority-item medium"><div><b>Moderate</b><span>Monitor and prepare</span></div><strong>2</strong></div>

            <div className="risk-control">
              <label>8. Dynamic Risk Reassessment: <b>{riskSeverity}/100</b></label>
              <input type="range" min="0" max="100" value={riskSeverity} onChange={(e) => setRiskSeverity(Number(e.target.value))} />
              <div className={`risk-pill ${dynamicRisk.toLowerCase()}`}>{dynamicRisk} Risk</div>
            </div>
            <button className="primary full" onClick={() => setModal("habitations")}>View Vulnerable Habitations</button>
          </div>
        </section>

        <section className="section-block" id="before">
          <div className="phase-heading before-heading"><span>🔵</span><div><h2>{t.prepare}</h2><p>Plan safe temporary relocation before impact.</p></div></div>
          <div className="feature-grid">
            <Feature title="2. Vulnerable Habitation Identification" text="Identify exposed communities using hazard, population, vulnerability and current-condition indicators." button="View Habitations" onClick={() => setModal("habitations")} />
            <Feature title="4. Temporary Safe-Site Identification" text="Find suitable temporary sites using distance, access, shelter risk and available capacity." button="Find Safe Sites" onClick={() => setModal("shelters")} />
            <Feature title="5. Nearest Shelter Location" text="Show the nearest available shelter and compare distance, capacity and accessibility." button="Locate Nearest Shelter" onClick={() => { setSelectedShelter(SHELTERS[0]); setModal("nearest"); }} />
            <Feature title="6. Shelter Carrying-Capacity Assessment" text="Check capacity, occupancy, water, toilets, healthcare and accessibility before assignment." button="Assess Capacity" onClick={() => setModal("capacity")} />
            <Feature title="7. What-If Disaster Simulation" text="Model changing rainfall and exposed population to estimate additional relocation demand." button="Run Simulation" onClick={() => setModal("whatif")} />
          </div>
        </section>

        <section className="section-block" id="during">
          <div className="phase-heading during-heading"><span>🟠</span><div><h2>{t.respond}</h2><p>Coordinate changing risk, alerts and temporary relocation.</p></div></div>
          <div className="feature-grid">
            <Feature title="8. Dynamic Risk Reassessment & Prioritization" text="Adjust current severity and immediately update the prototype risk-priority indicator." button="Reassess Risk" onClick={() => setModal("reassessment")} />
            <Feature title="9. Temporary Relocation Matching" text="Match a habitation with a suitable shelter using people count, remaining capacity, distance and access." button="Match Shelter" onClick={matchShelter} />
            <Feature title="10. Emergency Alert System" text="Create a citizen emergency alert event and display it in the authority alert log." button="Send Alert" onClick={() => createAlert("APP")} />
            <Feature title="11. SMS Alert Fallback" text="Queue an SMS fallback event when app communication is unavailable." button="Queue SMS" onClick={() => createAlert("SMS")} />
            <Feature title="12. Offline Mode" text="Reports and fallback events are stored locally when the browser is offline and marked for sync." button={online ? "Test Offline Save" : "Offline Active"} onClick={() => setModal("offline")} />
            <Feature title="13. Multi-Language Toggle" text="Switch the dashboard interface between English, Tamil and Hindi." button="Change Language" onClick={() => setLanguage(language === "en" ? "ta" : language === "ta" ? "hi" : "en")} />
            <Feature title="14. Temporary Relocation Tracking" text="Track assigned habitation, shelter, people and current relocation status." button="Track Relocations" onClick={() => setModal("tracking")} />
          </div>
        </section>

        <section className="section-block" id="after">
          <div className="phase-heading after-heading"><span>🟢</span><div><h2>{t.recover}</h2><p>Record impact, collect feedback and support safe return.</p></div></div>
          <div className="feature-grid">
            <Feature title="15. Citizen Damage Reporting" text="Submit damage category, description, urgency and location; save offline if needed." button="Report Damage" onClick={() => setModal("report")} />
            <Feature title="16. AI-Assisted Impact Assessment" text="Prototype rule engine summarizes reported damage and priority. Replace with an AI model in Phase 3." button="Assess Impact" onClick={() => setModal("impact")} />
            <Feature title="17. Return-to-Home Assessment" text="Check water status, road accessibility and structural verification before recommending return." button="Assess Return" onClick={() => setModal("return")} />
            <Feature title="18. Post-Disaster Feedback" text="Collect shelter and relocation ratings plus citizen suggestions for recovery review." button="Give Feedback" onClick={() => setModal("feedback")} />
          </div>
        </section>

        <section className="tracking-panel">
          <div className="section-header"><div><h3>Live Prototype Activity</h3><p>Current alerts, reports and relocation records</p></div><span className="sync-badge">{pendingSync} pending sync</span></div>
          <div className="activity-grid">
            <div><b>{alerts.length}</b><span>Alerts</span></div>
            <div><b>{reports.length}</b><span>Damage Reports</span></div>
            <div><b>{relocations.length}</b><span>Relocations</span></div>
            <div><b>{feedback.length}</b><span>Feedback</span></div>
          </div>
          {alerts.length > 0 && <div className="activity-list">{alerts.slice(0, 4).map((a) => <div key={a.id}><span>{a.type}</span>{a.message}<small>{a.time}</small></div>)}</div>}
        </section>

        <section className="coverage">
          <h3>🌍 Disaster Coverage</h3>
          <div className="coverage-grid">{HAZARDS.map((h) => <div key={h.id}><span>{h.icon}</span><b>{h.name}</b></div>)}</div>
        </section>

        <section className="evidence">
          <div><h3>Evidence-Based Decision Support</h3><p>Evidence → Risk → Red Zone → Priority → Temporary Relocation → Damage Assessment → Safe Return</p></div>
          <div className="evidence-flow"><span>Evidence</span><b>→</b><span>Risk</span><b>→</b><span>Priority</span><b>→</b><span>Relocation</span><b>→</b><span>Recovery</span></div>
        </section>
      </main>

      {modal === "habitations" && <Modal title="2. Vulnerable Habitations" onClose={() => setModal(null)}>
        <div className="table-wrap"><table><thead><tr><th>Habitation</th><th>Hazard</th><th>Risk</th><th>People</th><th>Condition</th></tr></thead><tbody>{filteredHabitation.map((h) => <tr key={h.id} onClick={() => setSelectedHabitation(h)} className={selectedHabitation.id === h.id ? "selected-row" : ""}><td>{h.name}</td><td>{h.hazard}</td><td><span className={`risk-pill ${h.risk.toLowerCase()}`}>{h.risk}</span></td><td>{h.people.toLocaleString()}</td><td>{h.condition}</td></tr>)}</tbody></table></div>
      </Modal>}

      {modal === "shelters" && <Modal title="4. Temporary Safe-Site Identification" onClose={() => setModal(null)}>
        <div className="shelter-grid">{SHELTERS.map((s) => <button className="shelter-card" key={s.id} onClick={() => { setSelectedShelter(s); setModal("capacity"); }}><b>{s.name}</b><span>{s.distance} km • {s.capacity - s.occupied} spaces available</span><span>Access: {s.access} • Risk: {s.risk}</span></button>)}</div>
      </Modal>}

      {modal === "nearest" && <Modal title="5. Nearest Shelter Location" onClose={() => setModal(null)}>
        <div className="detail-box"><h3>{selectedShelter.name}</h3><p><b>Distance:</b> {selectedShelter.distance} km</p><p><b>Available capacity:</b> {availableCapacity.toLocaleString()}</p><p><b>Accessibility:</b> {selectedShelter.access}</p><p><b>Safety status:</b> {selectedShelter.risk}</p><button className="primary" onClick={assignRelocation}>Assign Temporary Relocation</button></div>
      </Modal>}

      {modal === "capacity" && <Modal title="6. Shelter Carrying-Capacity Assessment" onClose={() => setModal(null)}>
        <div className="capacity-box"><h3>{selectedShelter.name}</h3><div className="capacity-bar"><span style={{ width: `${Math.min(100, (selectedShelter.occupied / selectedShelter.capacity) * 100)}%` }} /></div><p>{selectedShelter.occupied.toLocaleString()} occupied / {selectedShelter.capacity.toLocaleString()} total</p><div className="check-grid"><span>💧 Water {selectedShelter.water ? "✓" : "✕"}</span><span>🚻 Toilets {selectedShelter.toilets ? "✓" : "✕"}</span><span>🏥 Healthcare {selectedShelter.healthcare ? "✓" : "✕"}</span><span>🛣️ Access {selectedShelter.access}</span></div><button className="primary" onClick={assignRelocation}>Use This Shelter</button></div>
      </Modal>}

      {modal === "relocation" && <Modal title="9. Temporary Relocation Matching" onClose={() => setModal(null)}>
        <div className="detail-box"><p><b>Habitation:</b> {selectedHabitation.name}</p><p><b>People to relocate:</b> {selectedHabitation.people.toLocaleString()}</p><p><b>Matched shelter:</b> {selectedShelter.name}</p><p><b>Remaining capacity:</b> {availableCapacity.toLocaleString()}</p><p><b>Match factors:</b> capacity + distance + access + shelter risk</p><button className="primary" onClick={assignRelocation}>Confirm Assignment</button></div>
      </Modal>}

      {modal === "tracking" && <Modal title="14. Temporary Relocation Tracking" onClose={() => setModal(null)}>
        {relocations.length === 0 ? <div className="empty">No relocation assignments yet. Use “Match Shelter” to create one.</div> : <div className="activity-list">{relocations.map((r) => <div key={r.id}><b>{r.habitation}</b> → {r.shelter} • {r.people.toLocaleString()} people <span className="status-tag">{r.status}</span><small>{r.updated}</small></div>)}</div>}
      </Modal>}

      {modal === "whatif" && <Modal title="7. What-If Disaster Simulation" onClose={() => setModal(null)}>
        <label className="form-label">Rainfall / hazard intensity: <b>{whatIfRain}%</b></label>
        <input type="range" min="0" max="100" value={whatIfRain} onChange={(e) => setWhatIfRain(Number(e.target.value))} />
        <label className="form-label">Base exposed population</label>
        <input type="number" value={whatIfPopulation} onChange={(e) => setWhatIfPopulation(Number(e.target.value) || 0)} />
        <div className="simulation-result"><b>Estimated people requiring temporary relocation</b><strong>{whatIfPeople.toLocaleString()}</strong><span>{whatIfRain >= 75 ? "Severe scenario — review additional shelter capacity." : "Scenario indicates manageable relocation demand."}</span></div>
      </Modal>}

      {modal === "reassessment" && <Modal title="8. Dynamic Risk Reassessment & Prioritization" onClose={() => setModal(null)}>
        <div className="simulation-result"><b>Current dynamic risk</b><strong>{dynamicRisk}</strong><span>Risk score: {riskSeverity}/100. Adjust the slider to model changing conditions.</span></div><input type="range" min="0" max="100" value={riskSeverity} onChange={(e) => setRiskSeverity(Number(e.target.value))} />
      </Modal>}

      {modal === "offline" && <Modal title="12. Offline Mode" onClose={() => setModal(null)}>
        <div className="detail-box"><p><b>Network:</b> {online ? "Online" : "Offline"}</p><p><b>Pending local sync:</b> {pendingSync}</p><p>Damage reports and SMS fallback events are stored in browser local storage and marked for synchronization when connectivity returns.</p>{online && pendingSync > 0 && <button className="primary" onClick={() => setPendingSync(0)}>Sync Pending Data</button>}</div>
      </Modal>}

      {modal === "report" && <Modal title="15. Citizen Damage Reporting" onClose={() => setModal(null)}>
        <form onSubmit={saveReport} className="form">
          <label>Habitation<input value={selectedHabitation.name} readOnly /></label>
          <label>Damage category<select value={reportForm.category} onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}><option>House damage</option><option>Road blocked</option><option>Infrastructure damage</option><option>People affected</option></select></label>
          <label>Urgency<select value={reportForm.urgency} onChange={(e) => setReportForm({ ...reportForm, urgency: e.target.value })}><option>High</option><option>Medium</option><option>Low</option></select></label>
          <label>Description<textarea required value={reportForm.description} onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })} placeholder="Describe the damage..." /></label>
          <button className="primary" type="submit">{online ? "Submit Report" : "Save Offline"}</button>
        </form>
      </Modal>}

      {modal === "impact" && <Modal title="16. AI-Assisted Impact Assessment" onClose={() => setModal(null)}>
        <div className="simulation-result"><b>Prototype impact summary</b><strong>{reports.length ? `${reports.filter((r) => r.urgency === "High").length} high-urgency report(s)` : "No reports yet"}</strong><span>This demo uses transparent rules over submitted reports. Connect an actual AI/image-analysis service in Phase 3.</span></div>
        <div className="activity-list">{reports.slice(0, 5).map((r) => <div key={r.id}><b>{r.category}</b> — {r.habitation}<small>{r.description}</small></div>)}</div>
      </Modal>}

      {modal === "return" && <Modal title="17. Return-to-Home Assessment" onClose={() => setModal(null)}>
        <div className="form">
          <label>Floodwater / remaining hazard<select value={returnInputs.water} onChange={(e) => setReturnInputs({ ...returnInputs, water: e.target.value })}><option>Clear</option><option>Present</option></select></label>
          <label>Road accessibility<select value={returnInputs.road} onChange={(e) => setReturnInputs({ ...returnInputs, road: e.target.value })}><option>Open</option><option>Blocked</option></select></label>
          <label>Structural verification<select value={returnInputs.structural} onChange={(e) => setReturnInputs({ ...returnInputs, structural: e.target.value })}><option>Verified</option><option>Not Verified</option></select></label>
          <div className={`return-result ${returnStatus.startsWith("Safe") ? "safe" : "unsafe"}`}>{returnStatus}</div>
        </div>
      </Modal>}

      {modal === "feedback" && <Modal title="18. Post-Disaster Feedback" onClose={() => setModal(null)}>
        <form onSubmit={saveFeedback} className="form">
          <label>Shelter rating: {feedbackForm.shelter}/5<input type="range" min="1" max="5" value={feedbackForm.shelter} onChange={(e) => setFeedbackForm({ ...feedbackForm, shelter: Number(e.target.value) })} /></label>
          <label>Relocation experience: {feedbackForm.relocation}/5<input type="range" min="1" max="5" value={feedbackForm.relocation} onChange={(e) => setFeedbackForm({ ...feedbackForm, relocation: Number(e.target.value) })} /></label>
          <label>Comments<textarea value={feedbackForm.message} onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })} placeholder="Suggestions or problems..." /></label>
          <button className="primary" type="submit">Submit Feedback</button>
        </form>
      </Modal>}
    </div>
  );
}

function Feature({ title, text, button, onClick }) {
  return (
    <article className="feature-card">
      <h3>{title}</h3>
      <p>{text}</p>
      <button className="secondary" onClick={onClick}>{button} →</button>
    </article>
  );
}

export default App;
