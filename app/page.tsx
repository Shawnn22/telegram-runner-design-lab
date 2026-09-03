"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TonConnectButton, TonConnectUIProvider, useTonAddress, useTonWallet } from "@tonconnect/ui-react";
import {
  getTelegramLocationManager,
  initializeTelegramWebApp,
  initializeTelegramLocation,
  requestTelegramLocation,
  type TelegramLocationManager,
} from "./telegram-location";

type RunnerStage = "ready" | "tracking" | "summary";
type RunnerTab = "run" | "activity" | "rewards";
type RewardStatus = "checking" | "eligible" | "more-running" | "claimed";

type Point = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp: number;
};

type SavedRun = {
  distance: number;
  seconds: number;
  mode: "demo" | "live";
  proofId: string;
};

const campaign = {
  name: "TON Global 5K Week",
  sponsor: "Orbit Foundation",
  goal: 5,
  pool: "1,000 TON",
  participants: 1842,
  duration: "7 days",
};

const TON_CONNECT_MANIFEST = "https://telegram-runner-design-lab.shawn22222.chatgpt.site/tonconnect-manifest.json";

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

function liveMapUrl(point: Point) {
  const latitudeSpan = Math.max(0.003, Math.min(0.02, ((point.accuracy ?? 35) / 111_000) * 8));
  const longitudeSpan = latitudeSpan / Math.max(0.3, Math.cos((point.latitude * Math.PI) / 180));
  const west = point.longitude - longitudeSpan;
  const east = point.longitude + longitudeSpan;
  const south = point.latitude - latitudeSpan;
  const north = point.latitude + latitudeSpan;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${west.toFixed(6)}%2C${south.toFixed(6)}%2C${east.toFixed(6)}%2C${north.toFixed(6)}&layer=mapnik&marker=${point.latitude.toFixed(6)}%2C${point.longitude.toFixed(6)}`;
}

function Badge({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "green" | "amber" | "neutral" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export default function Home() {
  const [telegramSession, setTelegramSession] = useState(false);

  useEffect(() => {
    const initializeId = window.setTimeout(() => {
      setTelegramSession(initializeTelegramWebApp());
    }, 0);
    return () => window.clearTimeout(initializeId);
  }, []);

  return (
    <main className="app-shell design-lab">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Telegram Runner home">
          <span className="brand-mark">R</span>
          <span>RUNNER</span>
          <Badge tone="neutral">TON</Badge><span className="lab-signal">DESIGN LAB</span>
        </Link>
        <div className="user-flow-label"><b>RUNNING, REFINED</b><span>Start → record → save privately</span></div>
        <div className={`demo-pill ${telegramSession ? "telegram-session" : ""}`}><span /> {telegramSession ? "Telegram session" : "Browser preview"}</div>
      </header>
      <TonConnectUIProvider manifestUrl={TON_CONNECT_MANIFEST} actionsConfiguration={{ returnStrategy: "back" }}>
        <RunnerApp />
      </TonConnectUIProvider>
    </main>
  );
}

function RunnerApp() {
  const [stage, setStage] = useState<RunnerStage>("ready");
  const [tab, setTab] = useState<RunnerTab>("run");
  const [walletSheet, setWalletSheet] = useState(false);
  const [trackingMode, setTrackingMode] = useState<"demo" | "live">("live");
  const [tracking, setTracking] = useState(false);
  const [gpsLocked, setGpsLocked] = useState(false);
  const [paused, setPaused] = useState(false);
  const [finishArmed, setFinishArmed] = useState(false);
  const [latestRun, setLatestRun] = useState<SavedRun | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [livePoint, setLivePoint] = useState<Point | null>(null);
  const [gpsStatus, setGpsStatus] = useState("Ready to request live GPS");
  const [locationBlocked, setLocationBlocked] = useState(false);
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>([]);
  const [rewardStatus, setRewardStatus] = useState<RewardStatus>("checking");
  const lastPoint = useRef<Point | null>(null);
  const watchId = useRef<number | null>(null);
  const telegramPollId = useRef<number | null>(null);
  const telegramLocationManager = useRef<TelegramLocationManager | null>(null);
  const liveSessionId = useRef(0);
  const wallet = useTonWallet();
  const walletAddress = useTonAddress();

  useEffect(() => {
    if (!tracking || (trackingMode === "live" && !gpsLocked)) return;
    const timer = window.setInterval(() => {
      setSeconds((value) => value + 1);
      if (trackingMode === "demo") setDistance((value) => Math.min(campaign.goal, value + 0.085));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [tracking, trackingMode, gpsLocked]);

  useEffect(() => () => clearLiveLocation(), []);

  function clearLiveLocation() {
    if (watchId.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId.current);
    if (telegramPollId.current !== null) window.clearInterval(telegramPollId.current);
    watchId.current = null;
    telegramPollId.current = null;
  }

  function recordLocation(next: Point, source: "Telegram" | "Device") {
    const accuracy = next.accuracy ?? Number.POSITIVE_INFINITY;
    if (accuracy > 65) {
      setGpsStatus(`${source} GPS is searching for a stronger signal`);
      return;
    }

    const previous = lastPoint.current;
    if (previous) {
      const delta = haversineKm(previous, next);
      const elapsedSeconds = Math.max(1, (next.timestamp - previous.timestamp) / 1000);
      const speedKmh = (delta / elapsedSeconds) * 3600;
      if (delta >= 0.003 && delta < 0.25 && speedKmh <= 28) setDistance((value) => value + delta);
      if (delta >= 0.25 || speedKmh > 28) {
        setGpsStatus(`${source} GPS ignored an implausible jump`);
        return;
      }
    }

    lastPoint.current = next;
    setGpsLocked(true);
    setLivePoint(next);
    setGpsStatus(`${source} GPS · ±${Math.round(accuracy)}m`);
  }

  function beginLiveSession(status: string, reset = true) {
    liveSessionId.current += 1;
    if (reset) {
      setSeconds(0);
      setDistance(0);
      setLivePoint(null);
      setGpsLocked(false);
    }
    lastPoint.current = null;
    setLocationBlocked(false);
    setPaused(false);
    setFinishArmed(false);
    setStage("tracking");
    setTracking(true);
    setGpsStatus(status);
    return liveSessionId.current;
  }

  function stopUnavailableGps(message: string, canOpenSettings = false) {
    liveSessionId.current += 1;
    clearLiveLocation();
    setTracking(false);
    setStage("ready");
    setLocationBlocked(canOpenSettings);
    setGpsStatus(message);
  }

  async function startTelegramGps(manager: TelegramLocationManager, reset = true) {
    const sessionId = beginLiveSession(reset ? "Requesting Telegram location…" : "Resuming Telegram GPS…", reset);
    const available = await initializeTelegramLocation(manager);
    if (sessionId !== liveSessionId.current) return true;
    if (!available) return false;

    const readLocation = async () => {
      const location = await requestTelegramLocation(manager);
      if (sessionId !== liveSessionId.current) return false;
      if (!location) return false;
      recordLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.horizontal_accuracy,
        timestamp: Date.now(),
      }, "Telegram");
      return true;
    };

    const receivedFirstFix = await readLocation();
    if (receivedFirstFix && sessionId === liveSessionId.current && lastPoint.current) {
      telegramPollId.current = window.setInterval(() => void readLocation(), 5000);
    }
    return receivedFirstFix;
  }

  function startDeviceGps(reset = true) {
    if (!navigator.geolocation) {
      stopUnavailableGps("This browser does not provide location services");
      return;
    }
    const sessionId = beginLiveSession(reset ? "Requesting device location…" : "Resuming device GPS…", reset);
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        if (sessionId !== liveSessionId.current) return;
        recordLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        }, "Device");
      },
      (error) => {
        if (sessionId === liveSessionId.current) stopUnavailableGps(error.code === error.PERMISSION_DENIED ? "Allow location access in your device settings to run live" : "GPS signal unavailable — move outdoors and try again");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  }

  function startLiveGps(reset = true) {
    clearLiveLocation();
    const manager = getTelegramLocationManager();
    if (manager) {
      telegramLocationManager.current = manager;
      void startTelegramGps(manager, reset).then((receivedFix) => {
        if (!receivedFix && liveSessionId.current > 0) {
          setGpsStatus("Telegram GPS timed out — using device GPS instead");
          startDeviceGps(reset);
        }
      });
    } else {
      startDeviceGps(reset);
    }
  }

  function startRun() {
    if (trackingMode === "live") {
      startLiveGps(true);
      return;
    }
    setSeconds(0);
    setDistance(0);
    setLivePoint(null);
    setGpsLocked(false);
    lastPoint.current = null;
    liveSessionId.current += 1;
    setStage("tracking");
    setTracking(true);
    setPaused(false);
    setFinishArmed(false);
    setGpsStatus("Simulated route active");
  }

  function selectTrackingMode(mode: "demo" | "live") {
    clearLiveLocation();
    setTrackingMode(mode);
    setLocationBlocked(false);
    setPaused(false);
    setGpsStatus(mode === "live" ? "Ready to request live GPS" : "Demo route is intentionally simulated");
  }

  function stopRun() {
    if (!finishArmed) {
      setFinishArmed(true);
      setGpsStatus("Tap Finish again to save this run");
      return;
    }
    liveSessionId.current += 1;
    setTracking(false);
    clearLiveLocation();
    if (distance < 0.02 || seconds < 10) {
      setStage("ready");
      setPaused(false);
      setGpsStatus("Run not saved — move at least 20 m for 10 seconds");
      return;
    }
    lastPoint.current = null;
    setLivePoint(null);
    const receipt = { distance, seconds, mode: trackingMode, proofId: `RUN-${Date.now().toString(36).toUpperCase()}` } as SavedRun;
    setSavedRuns((runs) => [receipt, ...runs]);
    setLatestRun(receipt);
    setRewardStatus("checking");
    setStage("summary");
    setPaused(false);
    setFinishArmed(false);
  }

  function pauseRun(reason = "Paused") {
    if (!tracking) return;
    liveSessionId.current += 1;
    clearLiveLocation();
    lastPoint.current = null;
    setTracking(false);
    setFinishArmed(false);
    setPaused(true);
    setGpsStatus(reason);
  }

  function resumeRun() {
    if (trackingMode === "live") {
      startLiveGps(false);
      return;
    }
    setPaused(false);
    setTracking(true);
    setGpsStatus("Demo route active");
  }

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) pauseRun("Paused — return to Telegram to continue");
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  });

  const pace = distance > 0 ? Math.max(4, seconds / 60 / distance) : 0;
  const verifiedDistance = savedRuns.reduce((total, run) => total + run.distance, 0);
  const weeklyProgress = Math.min(100, (verifiedDistance / campaign.goal) * 100);
  const remainingDistance = Math.max(0, campaign.goal - verifiedDistance);

  if (stage === "summary" && latestRun) {
    return <RunSummary run={latestRun} onContinue={() => { setLatestRun(null); setStage("ready"); setTab("run"); }} onActivity={() => { setLatestRun(null); setStage("ready"); setTab("activity"); }} onRewards={() => { setLatestRun(null); setStage("ready"); setTab("rewards"); }} />;
  }

  if (stage === "tracking") {
    return (
      <section className="runner-surface tracking-surface">
        <div className="runner-topline"><button className="text-button" onClick={stopRun}>Finish & save</button><Badge tone={paused ? "amber" : trackingMode === "live" ? "green" : "amber"}>{paused ? "PAUSED" : trackingMode === "live" ? "LIVE GPS" : "DEMO ROUTE"}</Badge></div>
        <div className={`tracking-map ${trackingMode === "live" ? "live-map" : "demo-map"}`}>
          <div className="map-grid" />
          {trackingMode === "live" && livePoint && <iframe className="live-map-frame" title="Your live GPS location" src={liveMapUrl(livePoint)} referrerPolicy="no-referrer" />}
          {trackingMode === "live" && !livePoint && <div className="live-map-wait"><b>{paused ? "Run paused" : "Finding your GPS…"}</b><span>{paused ? "Tap resume when you are ready to keep running." : "We will switch to device GPS automatically if Telegram does not reply."}</span>{!paused && <button className="gps-retry" onClick={() => startDeviceGps(true)}>Use device GPS now</button>}{locationBlocked && telegramLocationManager.current && <button className="gps-retry" onClick={() => telegramLocationManager.current?.openSettings()}>Open Telegram settings</button>}</div>}
          {trackingMode === "demo" && <><span className="track-line track-one" /><span className="track-line track-two" /><span className="track-line track-three" /><span className="track-line track-four" /></>}
          <span className="runner-pulse"><i /></span>
          <div className="gps-chip"><span className={paused ? "gps-dot paused" : gpsLocked ? "gps-dot" : "gps-dot searching"} />{gpsStatus}</div>
          {trackingMode === "live" && livePoint && <a className="map-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>}
        </div>
        <div className="tracking-panel">
          <div className="tracking-primary"><span className="run-label">{trackingMode === "live" ? gpsLocked ? "GPS LOCKED · RECORDING" : "WAITING FOR GPS LOCK" : "DEMO SESSION"}</span><strong>{distance.toFixed(2)}</strong><span>KILOMETERS</span></div>
          <div className="tracking-secondary"><div><strong>{formatTime(seconds)}</strong><span>ELAPSED</span></div><div><strong>{pace ? `${Math.floor(pace)}:${Math.round((pace % 1) * 60).toString().padStart(2, "0")}` : "--:--"}</strong><span>AVG PACE /KM</span></div></div>
          <div className="goal-progress"><span style={{ width: `${Math.min(100, (distance / campaign.goal) * 100)}%` }} /><b>{Math.min(100, Math.round((distance / campaign.goal) * 100))}% toward an available 5K reward</b></div>
          <div className="run-controls">{paused ? <button className="resume-button" onClick={resumeRun}><span>▶</span> Resume run</button> : <button className="pause-button" onClick={() => pauseRun()}><span>Ⅱ</span> Pause</button>}<button className={`stop-button ${finishArmed ? "armed" : ""}`} onClick={stopRun}><span>■</span>{finishArmed ? " Tap again to save" : " Finish run"}</button></div>
        </div>
      </section>
    );
  }

  return (
    <section className="runner-surface">
      <div className="runner-header">
        <div className="runner-welcome"><div className="runner-avatar">R</div><div><Badge tone="blue">RUNNER · TON</Badge><h2>{savedRuns.length ? "Keep your rhythm." : "Your run starts here."}</h2><p>{savedRuns.length ? `${savedRuns.length} activity ${savedRuns.length === 1 ? "receipt" : "receipts"} saved this week.` : "No signup. No wallet. Just move."}</p></div></div>
        <div className="weekly-glance"><span>THIS WEEK</span><b>{verifiedDistance.toFixed(1)} <small>/ {campaign.goal} km</small></b><i><em style={{ width: `${weeklyProgress}%` }} /></i></div>
        <button className={`wallet-chip ${wallet ? "connected" : ""}`} onClick={() => setWalletSheet(true)}>{wallet ? `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)} · Connected` : "Connect TON wallet"}</button>
      </div>
      <nav className="runner-nav" aria-label="Runner sections">
        <button className={tab === "run" ? "active" : ""} onClick={() => setTab("run")}><i>⌁</i>Run</button>
        <button className={tab === "activity" ? "active" : ""} onClick={() => setTab("activity")}><i>◷</i>Activity {savedRuns.length > 0 && <span>{savedRuns.length}</span>}</button>
        <button className={tab === "rewards" ? "active" : ""} onClick={() => setTab("rewards")}><i>✦</i>Rewards {savedRuns.length > 0 && rewardStatus !== "claimed" && <span>1</span>}</button>
      </nav>
      {tab === "run" && <>
      <div className="run-journey" aria-label="How the runner flow works"><span className="journey-live"><i /> Live GPS session</span><span>Save private receipt</span><span>Check rewards later</span></div>
      <div className="start-panel quick-run-panel">
        <div className="start-copy"><div className="ready-orbit"><i /><i /><span>R</span></div><span className="eyebrow">TODAY&apos;S RUN</span><h3>{remainingDistance ? "Your pace. Your moment." : "You finished the week strong."}</h3><p>{remainingDistance ? `${remainingDistance.toFixed(1)} km remains toward this week’s 5K. Start when your GPS is ready.` : "Your weekly goal is complete. Keep the streak going with another easy run."}</p><div className="run-intent"><span><b>Foreground only</b><small>We pause when Telegram closes</small></span><span><b>Private receipt</b><small>Route points are discarded</small></span></div></div>
        <div className="start-control"><div className="gps-readiness"><span className="gps-dot" /><div><b>{trackingMode === "live" ? "GPS will check when you start" : "Demo route ready"}</b><small>{trackingMode === "live" ? "Telegram first, then device GPS automatically" : "For UI testing only"}</small></div></div><div className="mode-toggle"><button className={trackingMode === "live" ? "active" : ""} onClick={() => selectTrackingMode("live")}><i>⌖</i><b>Live GPS</b><span>Telegram or device</span></button><button className={trackingMode === "demo" ? "active" : ""} onClick={() => selectTrackingMode("demo")}><i>◷</i><b>Demo route</b><span>Time-compressed</span></button></div><div className="gps-start-actions">{trackingMode === "live" && <p className="gps-access-note" role="status"><span className="signal-dot" />{gpsStatus}{locationBlocked && telegramLocationManager.current && <button className="text-button" onClick={() => telegramLocationManager.current?.openSettings()}>Open Telegram settings</button>}</p>}<button className="button button-primary start-run" onClick={startRun}><span className="start-icon">⌖</span>{trackingMode === "live" ? "Start live run" : "Start quick run"} <span>→</span></button></div></div>
      </div>
      <div className="section-kicker"><span>OPEN CHALLENGE</span><small>Rewards are optional. Your run is the main event.</small></div><div className="campaign-feature">
        <div className="campaign-art"><span className="globe-ring ring-a" /><span className="globe-ring ring-b" /><strong>5K</strong><small>GLOBAL WEEK</small></div>
        <div className="campaign-info">
          <div className="campaign-badges"><Badge tone="green">POOL FUNDED</Badge><Badge tone="neutral">GLOBAL</Badge></div>
          <h1>{campaign.name}</h1><p className="sponsor-line">By {campaign.sponsor} · Verified project</p>
          <p>Complete 5 km across one or more foreground GPS sessions this week. After every run, Rewards auto-matches your verified receipts—no registration required.</p>
          <div className="info-grid"><div><span>Reward pool</span><b>{campaign.pool}</b></div><div><span>Participants</span><b>{campaign.participants.toLocaleString()}</b></div><div><span>Ends in</span><b>5d 18h</b></div></div>
          <Badge tone="blue">AUTO-MATCH AFTER RUN</Badge>
        </div>
      </div>
      <div className="transparency-card"><div className="status-icon">◈</div><div><b>Reward escrow is transparent</b><p>The sponsor-funded pool is locked before the campaign begins. A wallet is needed only when you choose to claim; GPS is verified offchain and payout rules execute on TON.</p></div><button>View contract ↗</button></div>
      </>}
      {tab === "activity" && <ActivityScreen savedRuns={savedRuns} onRewards={() => setTab("rewards")} onRun={() => setTab("run")} />}
      {tab === "rewards" && <RewardsScreen savedRuns={savedRuns} verifiedDistance={verifiedDistance} rewardStatus={rewardStatus} wallet={Boolean(wallet)} onCheck={() => setRewardStatus(verifiedDistance >= campaign.goal * 0.95 ? "eligible" : "more-running")} onClaim={() => setRewardStatus("claimed")} onRun={() => setTab("run")} onConnectWallet={() => setWalletSheet(true)} />}
      {walletSheet && <WalletSheet connected={Boolean(wallet)} address={walletAddress} onClose={() => setWalletSheet(false)} />}
    </section>
  );
}

function RunSummary({ run, onContinue, onActivity, onRewards }: { run: SavedRun; onContinue: () => void; onActivity: () => void; onRewards: () => void }) {
  const pace = run.distance > 0 ? run.seconds / 60 / run.distance : 0;
  return <section className="runner-surface run-summary"><Badge tone="green">RUN SAVED</Badge><div className="summary-hero"><span>✓</span><h1>Nice work.</h1><p>Your route was discarded. Only this private activity receipt was saved.</p></div><div className="summary-metrics"><div><b>{run.distance.toFixed(2)}</b><small>KM</small></div><div><b>{formatTime(run.seconds)}</b><small>TIME</small></div><div><b>{pace ? formatTime(Math.round(pace * 60)) : "--:--"}</b><small>PACE /KM</small></div></div><div className="summary-receipt"><span>⌁</span><p><b>{run.mode === "live" ? "Live GPS receipt" : "Demo receipt"}</b><small>Proof {run.proofId} · raw GPS points deleted</small></p></div><div className="summary-actions"><button className="button button-primary" onClick={onRewards}>Check rewards <span>→</span></button><button className="button button-secondary" onClick={onActivity}>View activity</button><button className="text-button" onClick={onContinue}>Start another run</button></div></section>;
}

function WalletSheet({ connected, address, onClose }: { connected: boolean; address: string; onClose: () => void }) {
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="TON wallet connection"><div className="wallet-modal"><button className="modal-close" onClick={onClose} aria-label="Close wallet dialog">×</button><Badge tone="blue">TON CONNECT · TESTNET</Badge><h2>{connected ? "Wallet connected" : "Connect a TON wallet"}</h2><p>{connected ? `${address.slice(0, 6)}…${address.slice(-6)} is connected through TON Connect.` : "Choose a testnet-capable TON wallet. Runner never sees or stores your private key."}</p><div className="wallet-option"><span className="ton-logo">◆</span><div><b>TON Connect</b><small>{connected ? "Wallet connection confirmed" : "Open your wallet to connect"}</small></div>{connected ? <Badge tone="green">CONNECTED</Badge> : <TonConnectButton />}</div><p className="simulation-note">Wallet connection is live. Claim stays disabled until the audited testnet escrow address and oracle proof endpoint are configured.</p></div></div>;
}

function ActivityScreen({ savedRuns, onRewards, onRun }: { savedRuns: SavedRun[]; onRewards: () => void; onRun: () => void }) {
  if (savedRuns.length === 0) return <div className="empty-state"><div className="empty-icon">↗</div><Badge tone="neutral">NO ACTIVITIES YET</Badge><h2>Your run history will live here.</h2><p>Start a foreground GPS session whenever you want. Saving a run never guarantees a reward—eligibility is checked separately.</p><button className="button button-primary" onClick={onRun}>Start a quick run <span>→</span></button></div>;
  const weeklyDistance = savedRuns.reduce((total, run) => total + run.distance, 0);
  return <div className="activity-view"><div className="section-heading"><div><Badge tone="green">ACTIVITIES SAVED</Badge><h1>Every run stays on your record.</h1><p>Several activity receipts can contribute to an open weekly rule. Only summaries and proof IDs are retained—never a persistent route map.</p></div><button className="button button-primary" onClick={onRewards}>View matching rewards <span>→</span></button></div><div className="weekly-progress"><div><span className="eyebrow">THIS WEEK</span><b>{weeklyDistance.toFixed(2)} <small>/ {campaign.goal.toFixed(2)} KM</small></b><p>{savedRuns.length} verified activity {savedRuns.length === 1 ? "receipt" : "receipts"} ready for matching.</p></div><div className="weekly-progress-bar"><span style={{ width: `${Math.min(100, (weeklyDistance / campaign.goal) * 100)}%` }} /></div></div><div className="activity-list">{savedRuns.map((savedRun, index) => <div className="activity-card" key={savedRun.proofId}><div className="privacy-receipt"><span className="receipt-lock">⌁</span><b>Private by default</b><small>NO ROUTE MAP STORED</small></div><div className="activity-body"><div className="activity-meta"><Badge tone={savedRun.mode === "live" ? "green" : "amber"}>{savedRun.mode === "live" ? "LIVE GPS" : "DEMO ROUTE"}</Badge><span>{index === 0 ? "Saved just now" : `Activity ${savedRuns.length - index}`} · no campaign joined</span></div><div className="activity-stats"><div><b>{savedRun.distance.toFixed(2)}</b><span>KM</span></div><div><b>{formatTime(savedRun.seconds)}</b><span>TIME</span></div><div><b>{savedRun.distance ? `${Math.floor(savedRun.seconds / 60 / savedRun.distance)}:${Math.round(((savedRun.seconds / 60 / savedRun.distance) % 1) * 60).toString().padStart(2, "0")}` : "--:--"}</b><span>PACE /KM</span></div></div><div className="activity-save-note"><span>✓</span><p><b>Activity proof {savedRun.proofId}</b><small>Distance, duration, session window and verification result are retained. Raw GPS points were discarded after this session.</small></p></div></div></div>)}</div></div>;
}

function RewardsScreen({ savedRuns, verifiedDistance, rewardStatus, wallet, onCheck, onClaim, onRun, onConnectWallet }: { savedRuns: SavedRun[]; verifiedDistance: number; rewardStatus: RewardStatus; wallet: boolean; onCheck: () => void; onClaim: () => void; onRun: () => void; onConnectWallet: () => void }) {
  if (savedRuns.length === 0) return <div className="empty-state"><div className="empty-icon">◆</div><Badge tone="neutral">NO REWARDS TO CHECK</Badge><h2>Rewards appear after a saved activity.</h2><p>Run first without registering. This page will auto-match the verified activity receipt against open campaign rules.</p><button className="button button-primary" onClick={onRun}>Start a quick run <span>→</span></button></div>;
  const complete = verifiedDistance >= campaign.goal * 0.95;
  if (rewardStatus === "claimed") return <div className="reward-centered"><div className="success-ring"><span>TON</span></div><Badge tone="green">REWARD CLAIMED</Badge><h2>Reward released.</h2><p>Your demo payout was released from the campaign escrow after the separate eligibility check completed.</p><div className="result-card"><div><span>Campaign</span><b>TON Global 5K Week</b></div><div><span>Reward</span><b>Demo TON</b></div><div><span>Claim status</span><b>Complete</b></div></div><p className="simulation-note"><b>Demo boundary:</b> payout is simulated. A production release will call the TON testnet contract after a signed oracle result.</p></div>;
  return <div className="rewards-view"><div className="section-heading"><div><Badge tone={rewardStatus === "checking" ? "amber" : rewardStatus === "eligible" ? "green" : "neutral"}>{rewardStatus === "checking" ? "MATCHING" : rewardStatus === "eligible" ? "ELIGIBLE" : "MORE ACTIVITY NEEDED"}</Badge><h1>Reward check</h1><p>Your saved activities are being matched with campaign rules now—not with a campaign you joined before running.</p></div></div><div className="reward-check-card"><div className="check-orbit"><span>{rewardStatus === "eligible" ? "✓" : rewardStatus === "more-running" ? "5K" : "…"}</span></div><div className="check-content"><div className="campaign-badges"><Badge tone="green">POOL FUNDED</Badge><Badge tone="neutral">{campaign.pool}</Badge></div><h2>{campaign.name}</h2><p>{rewardStatus === "checking" ? "We are checking the saved activity receipts against this open campaign rule. Your activity history is unchanged." : rewardStatus === "eligible" ? "Your combined verified distance meets the rule. Connect a wallet only when you are ready to claim." : `${Math.max(0, campaign.goal - verifiedDistance).toFixed(2)} km remains before this completion-pool reward can be claimed.`}</p><div className="reward-distance"><span>VERIFIED THIS WEEK</span><b>{verifiedDistance.toFixed(2)} <small>/ {campaign.goal.toFixed(2)} KM</small></b><div><i style={{ width: `${Math.min(100, (verifiedDistance / campaign.goal) * 100)}%` }} /></div></div><div className="check-timeline"><div className="done"><span>✓</span><p><b>{savedRuns.length} activity {savedRuns.length === 1 ? "receipt" : "receipts"} saved</b><small>{verifiedDistance.toFixed(2)} km total, no routes stored</small></p></div><div className={rewardStatus === "checking" ? "active" : "done"}><span>{rewardStatus === "checking" ? "2" : "✓"}</span><p><b>GPS & session check</b><small>{rewardStatus === "checking" ? "Awaiting demo oracle" : "Passed demo checks"}</small></p></div><div className={rewardStatus === "eligible" || rewardStatus === "more-running" ? "done" : ""}><span>{rewardStatus === "checking" ? "3" : "✓"}</span><p><b>Campaign auto-match</b><small>{rewardStatus === "eligible" ? "Completion rule met" : rewardStatus === "more-running" ? "Goal not met yet" : "Waiting for review"}</small></p></div></div>{rewardStatus === "checking" && <button className="button button-primary" onClick={onCheck}>Run demo eligibility check <span>→</span></button>}{rewardStatus === "eligible" && (wallet ? <button className="button button-primary" onClick={onClaim}>Claim demo reward <span>→</span></button> : <button className="button button-primary" onClick={onConnectWallet}>Connect wallet to claim <span>→</span></button>)}{rewardStatus === "more-running" && <button className="button button-primary" onClick={onRun}>Log another run <span>→</span></button>}</div></div>{!complete && rewardStatus !== "more-running" && <p className="simulation-note"><b>Demo note:</b> your combined activity is below the 5 km requirement. The matcher correctly keeps it out of the claim flow.</p>}</div>;
}

export function AdminConsole() {
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
