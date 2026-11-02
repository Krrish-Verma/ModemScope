"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, Download, Info, LoaderCircle, Trash2, TriangleAlert } from "lucide-react";
import { api } from "@/lib/api";
import type { Measurement, RunRecord } from "@/lib/types";
import { ConstellationChart, PerformanceChart, ResourceGrid } from "./Charts";

function formatRate(value: number) {
  return value === 0 ? "0 observed" : value < 0.001 ? value.toExponential(2) : value.toPrecision(3);
}

export function RunView({ id }: { id: string }) {
  const [run, setRun] = useState<RunRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const next = await api.getRun(id);
        if (!active) return;
        setRun(next);
        setError(null);
        if (next.status === "queued" || next.status === "running") timer = setTimeout(load, 1000);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load experiment.");
      }
    };
    load();
    return () => { active = false; clearTimeout(timer); };
  }, [id]);

  const selected: Measurement | null = useMemo(() => run?.result?.measurements[selectedIndex] ?? null, [run, selectedIndex]);

  if (error) return <div className="state-panel"><AlertCircle /><h2>Experiment unavailable</h2><p>{error}</p><Link className="button" href="/lab">Back to laboratory</Link></div>;
  if (!run) return <div className="state-panel"><LoaderCircle className="spin" /><h2>Loading experiment</h2></div>;
  if (run.status === "queued" || run.status === "running") return <div className="state-panel"><LoaderCircle className="spin" /><p className="eyebrow">Real Sionna PHY job</p><h2>{run.stage}</h2><div className="progress"><i style={{ width: `${Math.max(4, run.progress * 100)}%` }} /></div><p>{Math.round(run.progress * 100)}% · One heavy simulation runs at a time.</p></div>;
  if (run.status !== "completed" || !run.result) return <div className="state-panel error-state"><TriangleAlert /><h2>{run.status === "interrupted" ? "Experiment interrupted" : "Simulation failed"}</h2><p>{run.error ?? run.stage}</p><p>No synthetic result was substituted.</p><Link className="button" href="/lab">Adjust configuration</Link></div>;

  const result = run.result;
  const visuals = result.point_visualizations?.[selectedIndex] ?? result.visualizations;
  return (
    <div className="run-view">
      <div className="run-toolbar">
        <Link href="/lab" className="back-link"><ArrowLeft size={16} /> Laboratory</Link>
        <div className="run-actions"><a href={api.exportUrl(id, "json")}><Download size={15} /> JSON</a><a href={api.exportUrl(id, "csv")}><Download size={15} /> CSV</a><button onClick={async () => { if (confirm("Delete this experiment permanently?")) { await api.deleteRun(id); window.location.href = "/lab"; } }}><Trash2 size={15} /> Delete</button></div>
      </div>
      <header className="run-header"><div><p className="eyebrow">Completed experiment</p><h1>{result.phy.modulation} over {run.configuration.channel_model === "awgn" ? "AWGN" : "Rayleigh fading"}</h1><p>MCS {result.phy.mcs_index} · {result.phy.tb_size.toLocaleString()} bits/block · seed {run.configuration.seed} · {result.engine.device.toUpperCase()}</p></div><span className="status success"><CheckCircle2 size={14} /> Complete</span></header>

      <div className="point-picker" aria-label="Select Eb/N0 measurement">{result.measurements.map((point, index) => <button className={selectedIndex === index ? "active" : ""} onClick={() => setSelectedIndex(index)} key={point.ebn0_db}>{point.ebn0_db} dB</button>)}</div>
      {selected && <section className="metric-grid">
        <article><span>Bit error rate</span><strong>{formatRate(selected.ber)}</strong><small>{selected.bit_errors.toLocaleString()} / {selected.num_bits.toLocaleString()} bits</small></article>
        <article><span>Block error rate</span><strong>{formatRate(selected.bler)}</strong><small>{selected.block_errors.toLocaleString()} / {selected.num_blocks.toLocaleString()} blocks</small></article>
        <article><span>Bits tested</span><strong>{selected.num_bits.toLocaleString()}</strong><small>Information bits</small></article>
        <article><span>Simulation runtime</span><strong>{result.runtime_seconds.toFixed(2)} s</strong><small>Sionna PHY 2.2</small></article>
      </section>}

      <section className="instrument-panel"><div className="panel-heading"><div><p className="eyebrow eyebrow-dark">Measured performance</p><h2>BER / BLER</h2></div><span>{result.measurements.length === 1 ? "Single measured point" : `${result.measurements.length}-point sweep`}</span></div><PerformanceChart points={result.measurements} /></section>
      <div className="visual-grid"><section className="instrument-panel"><div className="panel-heading"><div><p className="eyebrow eyebrow-dark">I/Q samples</p><h2>Constellation explorer</h2></div></div><ConstellationChart data={visuals.constellation} /></section><section className="instrument-panel"><div className="panel-heading"><div><p className="eyebrow eyebrow-dark">OFDM allocation</p><h2>Resource grid</h2></div></div><ResourceGrid data={visuals.resource_grid} /></section></div>
      <section className="diagnostics"><div className="section-heading"><p className="eyebrow">Deterministic analysis</p><h2>What the evidence says.</h2></div><div className="insight-grid">{result.diagnostics.map((insight) => <article key={insight.title} className={`insight ${insight.severity}`}><div className="insight-title">{insight.severity === "warning" ? <TriangleAlert /> : insight.severity === "success" ? <CheckCircle2 /> : <Info />}<div><span>{insight.evidence}</span><h3>{insight.title}</h3></div></div><b>{insight.observation}</b><p>{insight.explanation}</p><small>Next experiment</small><p>{insight.suggestion}</p></article>)}</div></section>
      <section className="run-provenance"><h3>Reproducibility record</h3><dl><div><dt>Engine</dt><dd>{result.engine.name} {result.engine.version}</dd></div><div><dt>PyTorch</dt><dd>{result.engine.torch_version}</dd></div><div><dt>Code rate</dt><dd>{result.phy.target_code_rate.toFixed(4)}</dd></div><div><dt>Layers / PRBs</dt><dd>{result.phy.num_layers} / {result.phy.num_prbs}</dd></div></dl></section>
    </div>
  );
}
