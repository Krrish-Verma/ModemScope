"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, CircleAlert, Gauge, History, LoaderCircle, RotateCcw } from "lucide-react";
import { Nav } from "@/components/Nav";
import { api, type RunInput } from "@/lib/api";
import type { RunRecord } from "@/lib/types";

const defaults: RunInput = { mode: "quick", preset: "qpsk-balanced", channel_model: "awgn", ebn0_db: 4, sweep_start_db: -2, sweep_end_db: 8, sweep_step_db: 2, num_blocks: 8, seed: 42 };

export default function LabPage() {
  const [form, setForm] = useState<RunInput>(defaults);
  const [health, setHealth] = useState<{ status: string; sionna_available: boolean; sionna_version: string | null; device: string } | null>(null);
  const [history, setHistory] = useState<RunRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { Promise.all([api.health(), api.listRuns()]).then(([nextHealth, runs]) => { setHealth(nextHealth); setHistory(runs); }).catch((cause) => setError(cause instanceof Error ? cause.message : "Backend unavailable")); }, []);
  const set = <K extends keyof RunInput>(key: K, value: RunInput[K]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => { event.preventDefault(); setSubmitting(true); setError(null); try { const run = await api.createRun(form); window.location.href = `/runs/${run.id}`; } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not start experiment"); setSubmitting(false); } };

  return (
    <main className="app-page"><Nav /><div className="lab-shell">
      <header className="lab-header"><div><p className="eyebrow">Interactive 5G NR testing</p><h1>Signal Laboratory</h1><p>Configure, simulate, and investigate uplink performance.</p></div><span className={`status ${health?.sionna_available ? "success" : "danger"}`}>{health?.sionna_available ? <Activity size={14} /> : <CircleAlert size={14} />}{health ? (health.sionna_available ? `Engine ready · ${health.device.toUpperCase()}` : "Engine unavailable") : "Checking engine"}</span></header>
      {error && <div className="alert"><CircleAlert /><div><b>Could not complete the request</b><p>{error}</p></div></div>}
      <div className="lab-layout">
        <form className="config-panel" onSubmit={submit}>
          <div className="config-title"><div><span>Experiment setup</span><h2>Configure the link</h2></div><button type="button" onClick={() => setForm(defaults)}><RotateCcw size={14} /> Reset</button></div>
          <fieldset><legend>Experiment mode</legend><div className="segmented"><button type="button" className={form.mode === "quick" ? "active" : ""} onClick={() => set("mode", "quick")}>Quick test</button><button type="button" className={form.mode === "sweep" ? "active" : ""} onClick={() => set("mode", "sweep")}>Eb/N0 sweep</button></div></fieldset>
          <label>Modulation / MCS preset<select value={form.preset} onChange={(e) => set("preset", e.target.value)}><option value="qpsk-balanced">QPSK · MCS 5</option><option value="16qam-balanced">16-QAM · MCS 11</option></select><small>Validated Sionna TB configurations—not an arbitrary modulation switch.</small></label>
          <label>Channel model<select value={form.channel_model} onChange={(e) => set("channel_model", e.target.value)}><option value="awgn">AWGN</option><option value="rayleigh">Rayleigh block fading</option></select></label>
          {form.mode === "quick" ? <label>Eb/N0 <output>{form.ebn0_db} dB</output><input type="range" min="-4" max="12" step="1" value={form.ebn0_db} onChange={(e) => set("ebn0_db", Number(e.target.value))} /></label> : <div className="field-row"><label>Start (dB)<input type="number" min="-4" max="12" step="0.5" value={form.sweep_start_db} onChange={(e) => set("sweep_start_db", Number(e.target.value))} /></label><label>End (dB)<input type="number" min="-4" max="12" step="0.5" value={form.sweep_end_db} onChange={(e) => set("sweep_end_db", Number(e.target.value))} /></label><label>Step (dB)<input type="number" min="0.5" max="8" step="0.5" value={form.sweep_step_db} onChange={(e) => set("sweep_step_db", Number(e.target.value))} /></label></div>}
          <label>Number of blocks<select value={form.num_blocks} onChange={(e) => set("num_blocks", Number(e.target.value))}><option value="8">Quick · 8 blocks/point</option><option value="32">Standard · 32 blocks/point</option><option value="128">Detailed · 128 blocks/point</option></select><small>Workload target; not a statistical accuracy guarantee.</small></label>
          <label>Random seed<input type="number" min="0" max="2147483647" value={form.seed} onChange={(e) => set("seed", Number(e.target.value))} /></label>
          <button className="button run-button" disabled={submitting || !health?.sionna_available}>{submitting ? <><LoaderCircle className="spin" /> Creating job…</> : <><Gauge /> Run simulation</>}</button>
          <p className="config-footnote">Runs locally. One CPU/GPU job at a time. No result is generated if the PHY fails.</p>
        </form>
        <section className="lab-main">
          <div className="empty-instrument"><div className="orb"><Activity /></div><p className="eyebrow eyebrow-dark">Instrument standing by</p><h2>Configure an experiment.<br />Reveal the signal.</h2><p>Measured BER, BLER, I/Q samples, and the actual OFDM resource grid will appear in the run view.</p><div className="empty-grid"><i /><i /><i /><i /><i /><i /></div></div>
          <section className="history-panel"><div className="history-title"><div><History /><div><p className="eyebrow">Persistent history</p><h2>Recent experiments</h2></div></div><span>{history.length} stored</span></div>{history.length === 0 ? <div className="history-empty">No completed or queued experiments yet.</div> : <div className="history-list">{history.slice(0, 8).map((run) => <Link href={`/runs/${run.id}`} key={run.id}><span className={`run-dot ${run.status}`} /><div><b>{run.configuration.preset.replace("-balanced", "").toUpperCase()} · {run.configuration.channel_model.toUpperCase()}</b><small>{new Date(run.created_at).toLocaleString()} · seed {run.configuration.seed}</small></div><em>{run.status}</em><ArrowRight /></Link>)}</div>}</section>
        </section>
      </div>
    </div></main>
  );
}
