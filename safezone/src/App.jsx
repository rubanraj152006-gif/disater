import "./App.css";
import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";

function App() {
  return (
    <div className="app">

      <header className="topbar">
        <div>
          <h1>SafeZone</h1>
          <p>Disaster Risk & Relocation Decision Support</p>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          System Active
        </div>
      </header>

      <main className="dashboard">

        {/* Welcome Section */}
        <section className="welcome">
          <div>
            <h2>Disaster Risk Overview</h2>
            <p>
              Identify hazardous zones, vulnerable habitations and
              relocation priorities using evidence-based analysis.
            </p>
          </div>

          <button>View Hazard Map</button>
        </section>


        {/* Statistics */}
        <section className="stats">

          <div className="card">
            <span className="card-title">Red Zones</span>
            <strong>24</strong>
            <small>High-risk areas identified</small>
          </div>

          <div className="card">
            <span className="card-title">Vulnerable Habitations</span>
            <strong>138</strong>
            <small>Habitations requiring assessment</small>
          </div>

          <div className="card">
            <span className="card-title">Immediate Priority</span>
            <strong>32</strong>
            <small>Require urgent relocation</small>
          </div>

          <div className="card">
            <span className="card-title">Safe Sites</span>
            <strong>18</strong>
            <small>Potential relocation sites</small>
          </div>

        </section>


        {/* Main Content */}
        <section className="content-grid">

          {/* Multi-Hazard Map */}
          <div className="map-card">

            <div className="section-header">
              <div>
                <h3>Multi-Hazard Map</h3>
                <p>Hazard and Red Zone overview</p>
              </div>

              <span className="map-label">GIS</span>
            </div>

            <div className="map-container">

              <MapContainer
                center={[20.5937, 78.9629]}
                zoom={5}
                scrollWheelZoom={true}
                style={{ height: "330px", width: "100%" }}
              >

                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Example Red Zone */}
                <Circle
                  center={[13.0827, 80.2707]}
                  radius={25000}
                  pathOptions={{
                    color: "red",
                    fillColor: "red",
                    fillOpacity: 0.25,
                  }}
                >
                  <Popup>
                    <b>High Risk Zone</b>
                    <br />
                    Chennai Region
                    <br />
                    Risk Level: High
                  </Popup>
                </Circle>

              </MapContainer>

            </div>

          </div>


          {/* Relocation Priority */}
          <div className="priority-card">

            <div className="section-header">
              <div>
                <h3>Relocation Priority</h3>
                <p>Current assessment</p>
              </div>
            </div>

            <div className="priority-item immediate">
              <div>
                <b>Immediate</b>
                <span>0–3 months</span>
              </div>

              <strong>32</strong>
            </div>

            <div className="priority-item short">
              <div>
                <b>Short-term</b>
                <span>3–12 months</span>
              </div>

              <strong>57</strong>
            </div>

            <div className="priority-item medium">
              <div>
                <b>Medium-term</b>
                <span>1–5 years</span>
              </div>

              <strong>49</strong>
            </div>

          </div>

        </section>


        {/* Modules */}
        <section className="bottom-grid">

          <div className="module-card">
            <div className="icon">⚠️</div>

            <h3>Hazard Analysis</h3>

            <p>
              Flood, landslide, cyclone, earthquake and tsunami
              risk assessment.
            </p>

            <button>Open Analysis →</button>
          </div>


          <div className="module-card">
            <div className="icon">🏠</div>

            <h3>Vulnerable Habitations</h3>

            <p>
              Identify exposed communities using population,
              vulnerability and disaster history.
            </p>

            <button>View Habitations →</button>
          </div>


          <div className="module-card">
            <div className="icon">🏘️</div>

            <h3>Relocation Sites</h3>

            <p>
              Compare safer locations using land, water,
              services and accessibility.
            </p>

            <button>Find Safe Sites →</button>
          </div>


          <div className="module-card">
            <div className="icon">📊</div>

            <h3>Carrying Capacity</h3>

            <p>
              Assess whether a safer location can support
              relocated communities.
            </p>

            <button>Assess Capacity →</button>
          </div>

        </section>


        {/* Evidence Section */}
        <section className="evidence">

          <div>
            <h3>Evidence-Based Decision Support</h3>

            <p>
              SafeZone combines hazard, population, vulnerability,
              terrain and disaster-history information to support
              transparent relocation decisions.
            </p>
          </div>


          <div className="evidence-flow">

            <span>Evidence</span>
            <b>→</b>

            <span>Risk</span>
            <b>→</b>

            <span>Red Zone</span>
            <b>→</b>

            <span>Priority</span>
            <b>→</b>

            <span>Relocation</span>

          </div>

        </section>

      </main>

    </div>
  );
}

export default App;