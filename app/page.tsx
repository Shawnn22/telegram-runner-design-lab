"use client";

import { useEffect, useRef, useState } from "react";

type Surface = "home" | "runner" | "admin";
type RunnerStage = "discover" | "joined" | "tracking" | "result" | "claim";

type Point = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp: number;
};

const campaign = {
  name: "TON Global 5K Week",
  sponsor: "Orbit Foundation",
  goal: 5,
  pool: "1,000 TON",
  participants: 1842,
  duration: "7 days",
};

function haversineKm(a: Point, b: Point) {
  const radius = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function Badge({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "green" | "amber" | "neutral" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export default function Home() {
  const [surface, setSurface] = useState<Surface>("home");

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setSurface("home")} aria-label="Telegram Runner home">
          <span className="brand-mark">R</span>
          <span>RUNNER</span>
          <Badge tone="neutral">TON</Badge>
        </button>
        <nav className="topnav" aria-label="Demo areas">
          <button className={surface === "runner" ? "active" : ""} onClick={() => setSurface("runner")}>Runner app</button>
          <button className={surface === "admin" ? "active" : ""} onClick={() => setSurface("admin")}>Project console</button>
        </nav>
        <div className="demo-pill"><span /> Hybrid demo</div>
      </header>

      {surface === "home" && <HomeScreen onOpen={setSurface} />}
      {surface === "runner" && <RunnerApp />}
      {surface === "admin" && <AdminConsole />}
    </main>
  );
}

function HomeScreen({ onOpen }: { onOpen: (surface: Surface) => void }) {
  return (
    <section className="home-screen">
      <div className="hero-copy">
        <Badge tone="green">IRL quests for the TON community</Badge>
        <h1>Move communities.<br /><em>Reward real effort.</em></h1>
        <p className="hero-lede">Turn airdrop campaigns into healthy action. Projects fund transparent reward pools. People run in the Telegram Mini App. Verified finishers claim on TON.</p>
        <div className="hero-actions">
          <button className="button button-primary" onClick={() => onOpen("runner")}>Open runner demo <span>→</span></button>
          <button className="button button-secondary" onClick={() => onOpen("admin")}>Create a campaign</button>
        </div>
        <div className="trust-row">
          <div><strong>No NFT shoes</strong><span>No buy-in to start moving</span></div>
          <div><strong>Funded on TON</strong><span>Pool visible before the run</span></div>
          <div><strong>Foreground GPS</strong><span>Count only after Start Run</span></div>
        </div>
      </div>

      <div className="hero-visual" aria-label="Campaign preview">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="phone-card">
          <div className="phone-head"><span>9:41</span><span>Telegram</span></div>
          <div className="mini-map">
            <span className="map-label map-label-a">START</span>
            <span className="route-line line-one" />
            <span className="route-line line-two" />
            <span className="route-line line-three" />
            <span className="route-dot dot-a" />
            <span className="route-dot dot-b" />
            <span className="map-label map-label-b">5K</span>
          </div>
          <div className="phone-content">
            <Badge tone="green">Pool funded</Badge>
            <h3>{campaign.name}</h3>
            <p>{campaign.sponsor} · {campaign.duration}</p>
            <div className="phone-stats"><div><b>5.00</b><span>KM GOAL</span></div><div><b>1K</b><span>TON POOL</span></div></div>
            <button className="button button-primary button-full" onClick={() => onOpen("runner")}>Join run</button>
          </div>
        </div>
        <div className="floating-card float-top"><span className="status-icon">✓</span><div><b>Escrow verified</b><small>EQC4…9xTon</small></div></div>
        <div className="floating-card float-bottom"><span className="status-icon status-lime">↗</span><div><b>1,842 runners</b><small>67 countries</small></div></div>
      </div>
    </section>
  );
}

function RunnerApp() {
  const [stage, setStage] = useState<RunnerStage>("discover");
  const [wallet, setWallet] = useState(false);
  const [trackingMode, setTrackingMode] = useState<"demo" | "live">("demo");
  const [tracking, setTracking] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [gpsStatus, setGpsStatus] = useState("Ready");
  const lastPoint = useRef<Point | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (!tracking) return;
    const timer = window.setInterval(() => {
      setSeconds((value) => value + 1);
      if (trackingMode === "demo") setDistance((value) => Math.min(campaign.goal, value + 0.085));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [tracking, trackingMode]);

  useEffect(() => () => {
    if (watchId.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  function startRun() {
    setStage("tracking");
    setTracking(true);
    setGpsStatus(trackingMode === "demo" ? "Simulated route active" : "Requesting live GPS…");
    if (trackingMode === "live" && navigator.geolocation) {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const next: Point = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          if (lastPoint.current && (next.accuracy ?? 999) < 60) {
            const delta = haversineKm(lastPoint.current, next);
            if (delta < 0.25) setDistance((value) => value + delta);
          }
          lastPoint.current = next;
          setGpsStatus(`Live GPS · ±${Math.round(position.coords.accuracy)}m`);
        },
        () => setGpsStatus("GPS unavailable — switch to demo route"),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
      );
    }
  }

  function stopRun() {
    setTracking(false);
    if (watchId.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId.current);
    setStage("result");
  }

  const pace = distance > 0 ? Math.max(4, seconds / 60 / distance) : 0;

  if (stage === "tracking") {
    return (
      <section className="runner-surface tracking-surface">
        <div className="runner-topline"><button className="text-button" onClick={stopRun}>End session</button><Badge tone={trackingMode === "live" ? "green" : "amber"}>{trackingMode === "live" ? "LIVE GPS" : "DEMO ROUTE"}</Badge></div>
        <div className="tracking-map">
          <div className="map-grid" />
          <span className="track-line track-one" /><span className="track-line track-two" /><span className="track-line track-three" /><span className="track-line track-four" />
          <span className="runner-pulse"><i /></span>
          <div className="gps-chip">● {gpsStatus}</div>
        </div>
        <div className="tracking-panel">
          <div className="tracking-primary"><strong>{distance.toFixed(2)}</strong><span>KILOMETERS</span></div>
          <div className="tracking-secondary"><div><strong>{formatTime(seconds)}</strong><span>TIME</span></div><div><strong>{pace ? `${Math.floor(pace)}:${Math.round((pace % 1) * 60).toString().padStart(2, "0")}` : "--:--"}</strong><span>AVG PACE /KM</span></div></div>
          <div className="goal-progress"><span style={{ width: `${Math.min(100, (distance / campaign.goal) * 100)}%` }} /><b>{Math.min(100, Math.round((distance / campaign.goal) * 100))}% of campaign goal</b></div>
          <button className="stop-button" onClick={stopRun}><span>■</span> Hold to finish</button>
        </div>
      </section>
    );
  }

  if (stage === "result" || stage === "claim") {
    const complete = distance >= campaign.goal * 0.95 || trackingMode === "demo";
    return (
      <section className="runner-surface centered-flow">
        <div className="success-ring"><span>{stage === "claim" ? "TON" : "✓"}</span></div>
        <Badge tone={stage === "claim" ? "green" : "blue"}>{stage === "claim" ? "REWARD CLAIMED" : "ORACLE REVIEW COMPLETE"}</Badge>
        <h2>{stage === "claim" ? "Reward received." : complete ? "Run accepted." : "Run recorded."}</h2>
        <p>{stage === "claim" ? "Your testnet reward was released from the campaign escrow." : "Demo anti-cheat checks passed. The 24-hour challenge window is time-compressed for this presentation."}</p>
        <div className="result-card">
          <div><span>Distance</span><b>{distance.toFixed(2)} km</b></div><div><span>Time</span><b>{formatTime(seconds)}</b></div><div><span>Status</span><b>{complete ? "Eligible" : "Recorded"}</b></div>
        </div>
        {stage === "result" ? (
          <button className="button button-primary" onClick={() => setStage("claim")}>Fast-forward & claim demo reward <span>→</span></button>
        ) : (
          <button className="button button-secondary" onClick={() => { setStage("discover"); setSeconds(0); setDistance(0); }}>Return to campaigns</button>
        )}
        <p className="simulation-note"><b>Demo boundary:</b> result attestation and payout are simulated in this UI checkpoint. TON testnet adapter follows in the next build phase.</p>
      </section>
    );
  }

  return (
    <section className="runner-surface">
      <div className="runner-header">
        <div><Badge tone="blue">TELEGRAM MINI APP</Badge><h2>Good morning, runner.</h2><p>Your next onchain finish line is ready.</p></div>
        <button className={`wallet-chip ${wallet ? "connected" : ""}`} onClick={() => setWallet(!wallet)}>{wallet ? "EQC4…91x · Connected" : "Connect TON wallet"}</button>
      </div>
      <div className="campaign-feature">
        <div className="campaign-art"><span className="globe-ring ring-a" /><span className="globe-ring ring-b" /><strong>5K</strong><small>GLOBAL WEEK</small></div>
        <div className="campaign-info">
          <div className="campaign-badges"><Badge tone="green">POOL FUNDED</Badge><Badge tone="neutral">GLOBAL</Badge></div>
          <h1>{campaign.name}</h1><p className="sponsor-line">By {campaign.sponsor} · Verified project</p>
          <p>Complete 5 km across one or more foreground GPS sessions this week. Every verified finisher shares the pool.</p>
          <div className="info-grid"><div><span>Reward pool</span><b>{campaign.pool}</b></div><div><span>Participants</span><b>{campaign.participants.toLocaleString()}</b></div><div><span>Ends in</span><b>5d 18h</b></div></div>
          {stage === "discover" ? <button className="button button-primary" onClick={() => setStage("joined")}>Join campaign</button> : <Badge tone="green">✓ Joined</Badge>}
        </div>
      </div>
      {stage === "joined" && (
        <div className="start-panel">
          <div><span className="eyebrow">ACTIVITY SOURCE</span><h3>Ready to run?</h3><p>Tracking counts only after you press Start Run and keep the Mini App open.</p></div>
          <div className="mode-toggle"><button className={trackingMode === "live" ? "active" : ""} onClick={() => setTrackingMode("live")}><b>Live GPS</b><span>Device location</span></button><button className={trackingMode === "demo" ? "active" : ""} onClick={() => setTrackingMode("demo")}><b>Demo route</b><span>Time-compressed</span></button></div>
          <button className="button button-primary start-run" disabled={!wallet} onClick={startRun}>{wallet ? "Start run" : "Connect wallet to start"}<span>→</span></button>
        </div>
      )}
      <div className="transparency-card"><div className="status-icon">◈</div><div><b>Reward escrow is transparent</b><p>The sponsor-funded pool is locked before the campaign begins. GPS is verified offchain; payout rules execute on TON.</p></div><button>View contract ↗</button></div>
    </section>
  );
}

function AdminConsole() {
  const [verified, setVerified] = useState(false);
  const [step, setStep] = useState(0);
  const [funded, setFunded] = useState(false);
  const [published, setPublished] = useState(false);
  const steps = ["Basics", "Rules", "Rewards", "Review"];

  if (!verified) {
    return (
      <section className="admin-surface onboarding-layout">
        <div className="onboarding-story">
          <Badge tone="blue">PROJECT ONBOARDING</Badge><h1>Trust starts before the starting line.</h1><p>Public campaigns require a lightweight project verification. For this fundraising demo, the third-party KYB response is simulated and approved with one click.</p>
          <div className="flow-list"><div><span>1</span><p><b>Organization details</b><small>Project identity and official links</small></p></div><div><span>2</span><p><b>KYB provider check</b><small>Third-party verification</small></p></div><div><span>3</span><p><b>Runner review</b><small>Allowlist campaign creator</small></p></div></div>
        </div>
        <div className="kyb-card">
          <div className="card-title-row"><div><span className="eyebrow">STEP 2 OF 3</span><h2>Project verification</h2></div><Badge tone="amber">SIMULATED</Badge></div>
          <div className="provider-box"><span className="provider-logo">K</span><div><b>KYB Provider Sandbox</b><small>No data leaves this demo</small></div><span className="secure-label">Encrypted</span></div>
          <label>Registered project name<input value="Orbit Foundation" readOnly /></label>
          <label>Official Telegram<input value="@orbit_ton" readOnly /></label>
          <div className="check-row"><span>✓</span><p><b>Domain ownership checked</b><small>orbit.foundation</small></p></div>
          <div className="check-row"><span>✓</span><p><b>TON ecosystem profile found</b><small>Public project signals matched</small></p></div>
          <button className="button button-primary button-full" onClick={() => setVerified(true)}>Yes, approve demo verification <span>→</span></button>
          <p className="simulation-note">Production will connect to a real KYB/KYC provider and manual risk review. This button only demonstrates the approval branch.</p>
        </div>
      </section>
    );
  }

  if (published) {
    return (
      <section className="admin-surface dashboard-view">
        <div className="dashboard-head"><div><Badge tone="green">CAMPAIGN LIVE</Badge><h1>{campaign.name}</h1><p>Funded, discoverable and ready for global TON runners.</p></div><button className="button button-secondary" onClick={() => { setPublished(false); setStep(0); }}>Create another</button></div>
        <div className="dashboard-metrics"><div><span>Escrow status</span><b>1,000 TON</b><small>Funded on testnet demo</small></div><div><span>Participants</span><b>1,842</b><small>+214 today</small></div><div><span>Completion</span><b>38.4%</b><small>707 eligible so far</small></div><div><span>Campaign health</span><b className="green-text">Healthy</b><small>2.1% flagged runs</small></div></div>
        <div className="dashboard-grid"><div className="panel"><div className="panel-head"><h3>Campaign lifecycle</h3><Badge tone="blue">DAY 2 OF 7</Badge></div><div className="lifecycle"><div className="done"><span>✓</span><p><b>Funded</b><small>1,000 TON locked</small></p></div><div className="active"><span>2</span><p><b>Active</b><small>Runner sessions counting</small></p></div><div><span>3</span><p><b>Result review</b><small>24h challenge window</small></p></div><div><span>4</span><p><b>Claimable</b><small>Contract releases rewards</small></p></div></div></div><div className="panel"><div className="panel-head"><h3>Trust & controls</h3></div><div className="control-row"><span>Project allowlist</span><b>Verified</b></div><div className="control-row"><span>Reward escrow</span><b>Funded</b></div><div className="control-row"><span>Rule version</span><b>Completion v1</b></div><div className="control-row"><span>Oracle signer</span><b>Runner demo</b></div><button className="contract-link">Open testnet contract ↗</button></div></div>
      </section>
    );
  }

  return (
    <section className="admin-surface builder-view">
      <aside className="admin-sidebar"><div><Badge tone="green">✓ PROJECT VERIFIED</Badge><h3>New campaign</h3><p>Launch a funded IRL quest for your Telegram community.</p></div><div className="step-list">{steps.map((item, index) => <button key={item} className={index === step ? "active" : index < step ? "done" : ""} onClick={() => index <= step && setStep(index)}><span>{index < step ? "✓" : index + 1}</span><p><b>{item}</b><small>{["Name & duration", "Completion logic", "Pool & fees", "Fund & publish"][index]}</small></p></button>)}</div><p className="sidebar-note">Core campaign rules lock when funding completes.</p></aside>
      <div className="builder-main">
        <div className="builder-heading"><div><span className="eyebrow">STEP {step + 1} OF 4</span><h1>{["Campaign basics", "Choose the healthy rule", "Fund the reward pool", "Review and launch"][step]}</h1></div><Badge tone={step === 3 ? "amber" : "neutral"}>{step === 3 ? "TESTNET DEMO" : "DRAFT"}</Badge></div>
        {step === 0 && <div className="form-grid"><label className="span-two">Campaign name<input defaultValue={campaign.name} /></label><label>Duration<select defaultValue="7"><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select></label><label>Audience<select><option>Global TON community</option></select></label><label className="span-two">Campaign story<textarea defaultValue="Run together across the world. Complete 5 km this week and share a sponsor-funded TON reward pool." /></label></div>}
        {step === 1 && <div className="rule-cards"><button className="selected"><span className="rule-icon">✓</span><div><b>Completion pool</b><p>Everyone who reaches the distance goal and passes verification shares the reward.</p><Badge tone="green">RECOMMENDED FOR DEMO</Badge></div></button><button disabled><span className="rule-icon">↗</span><div><b>Distance leaderboard</b><p>Top verified distance wins. Higher anti-cheat risk.</p><Badge tone="neutral">LATER</Badge></div></button><div className="rule-settings"><label>Completion goal<div className="input-unit"><input defaultValue="5" /><span>KM</span></div></label><label>Sessions allowed<select><option>Multiple sessions</option><option>Single session</option></select></label><label>Challenge window<select><option>24 hours</option><option>48 hours</option></select></label></div></div>}
        {step === 2 && <div className="reward-layout"><div className="reward-card"><span className="eyebrow">REWARD ASSET</span><div className="token-row"><span className="ton-logo">◆</span><div><b>TON</b><small>The Open Network · Testnet demo</small></div><Badge tone="green">ALLOWLISTED</Badge></div><label>Reward pool<div className="input-unit"><input defaultValue="1000" /><span>TON</span></div></label></div><div className="fee-card"><h3>Flexible campaign fee</h3><div><span>Setup fee</span><b>50 TON</b></div><div><span>Pool service fee</span><b>5% · 50 TON</b></div><div className="fee-total"><span>Total to fund</span><b>1,100 TON</b></div><p>Fee strategy is configurable per project in production.</p></div></div>}
        {step === 3 && <div className="review-layout"><div className="review-card"><div className="review-title"><div><Badge tone="green">COMPLETION POOL</Badge><h2>{campaign.name}</h2><p>Global · 7 days · 5 km total</p></div><div className="big-reward"><b>1,000</b><span>TON REWARD POOL</span></div></div><div className="review-rows"><div><span>Project</span><b>Orbit Foundation · Verified</b></div><div><span>Challenge window</span><b>24 hours</b></div><div><span>Eligible finishers</span><b>Share pool equally</b></div><div><span>Contract rule</span><b>Completion v1 · Locked on fund</b></div></div></div><div className={`fund-box ${funded ? "funded" : ""}`}><span className="fund-icon">{funded ? "✓" : "◆"}</span><div><h3>{funded ? "Pool funded" : "Fund campaign escrow"}</h3><p>{funded ? "Demo transaction confirmed. Core rules are now locked." : "Connect the project wallet and approve the TON testnet transaction."}</p></div>{!funded && <Badge tone="amber">SIMULATED TX</Badge>}</div></div>}
        <div className="builder-footer"><button className="button button-secondary" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</button>{step < 3 ? <button className="button button-primary" onClick={() => setStep((value) => value + 1)}>Continue <span>→</span></button> : !funded ? <button className="button button-primary" onClick={() => setFunded(true)}>Approve demo transaction</button> : <button className="button button-primary" onClick={() => setPublished(true)}>Publish campaign <span>→</span></button>}</div>
      </div>
    </section>
  );
}
