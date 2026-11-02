"use client";

import dynamic from "next/dynamic";
import type { Measurement, SimulationResult } from "@/lib/types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false, loading: () => <div className="chart-loading">Preparing interactive chart…</div> });

const layoutBase = {
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  font: { family: "Inter, ui-sans-serif, system-ui", color: "#a1a1aa", size: 12 },
  margin: { l: 62, r: 20, t: 22, b: 52 },
  showlegend: true,
  legend: { orientation: "h" as const, x: 0, y: 1.12 },
};

export function PerformanceChart({ points }: { points: Measurement[] }) {
  const x = points.map((point) => point.ebn0_db);
  const positive = points.flatMap((point) => [point.ber, point.bler]).filter((value) => value > 0);
  const useLog = positive.length > 0 && Math.max(...positive) / Math.min(...positive) > 20;
  return (
    <Plot
      data={[
        { x, y: points.map((p) => p.ber || null), name: "BER", type: points.length === 1 ? "scatter" : "scatter", mode: points.length === 1 ? "markers" : "lines+markers", line: { color: "#38bdf8", width: 3 }, marker: { size: 9 }, customdata: points.map((p) => [p.bit_errors, p.num_bits]), hovertemplate: "Eb/N0 %{x} dB<br>BER %{y:.3e}<br>%{customdata[0]} / %{customdata[1]} bits<extra></extra>" },
        { x, y: points.map((p) => p.bler || null), name: "BLER", type: "scatter", mode: points.length === 1 ? "markers" : "lines+markers", line: { color: "#a78bfa", width: 3, dash: "dot" }, marker: { size: 9 }, customdata: points.map((p) => [p.block_errors, p.num_blocks]), hovertemplate: "Eb/N0 %{x} dB<br>BLER %{y:.3e}<br>%{customdata[0]} / %{customdata[1]} blocks<extra></extra>" },
      ]}
      layout={{ ...layoutBase, xaxis: { title: { text: "Eb/N0 (dB)" }, gridcolor: "#24262d", zeroline: false }, yaxis: { title: { text: useLog ? "Error rate (log)" : "Error rate" }, type: useLog ? "log" : "linear", gridcolor: "#24262d", range: useLog ? undefined : [0, 1] }, annotations: points.some((p) => p.ber === 0 || p.bler === 0) ? [{ text: "Zero observations are omitted from the log scale", xref: "paper", yref: "paper", x: 1, y: -0.2, showarrow: false, font: { size: 10, color: "#71717a" } }] : [] }}
      config={{ responsive: true, displaylogo: false, modeBarButtonsToRemove: ["lasso2d", "select2d"] }}
      style={{ width: "100%", height: "360px" }}
    />
  );
}

export function ConstellationChart({ data }: { data: SimulationResult["visualizations"]["constellation"] }) {
  const traces = [
    { points: data.received, name: "Received · raw", color: "#38bdf8", opacity: 0.45, size: 5 },
    { points: data.transmitted, name: "Transmitted", color: "#f8fafc", opacity: 0.65, size: 6 },
  ];
  return (
    <>
      <Plot
        data={traces.map((trace) => ({ x: trace.points.map((p) => p.i), y: trace.points.map((p) => p.q), name: trace.name, type: "scattergl", mode: "markers", marker: { color: trace.color, opacity: trace.opacity, size: trace.size }, hovertemplate: "I %{x:.3f}<br>Q %{y:.3f}<extra></extra>" }))}
        layout={{ ...layoutBase, xaxis: { title: { text: "In-phase (I)" }, gridcolor: "#24262d", scaleanchor: "y", scaleratio: 1 }, yaxis: { title: { text: "Quadrature (Q)" }, gridcolor: "#24262d" } }}
        config={{ responsive: true, displaylogo: false }}
        style={{ width: "100%", height: "390px" }}
      />
      <p className="chart-note">{data.label}. {data.note}</p>
    </>
  );
}

export function ResourceGrid({ data }: { data: SimulationResult["visualizations"]["resource_grid"] }) {
  const width = data.num_symbols * 18;
  const height = data.num_subcarriers * 5;
  const colors = ["#17191f", "#087bb8", "#f59e0b"];
  return (
    <div className="grid-visual-wrap">
      <svg className="grid-visual" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`OFDM resource grid with ${data.num_symbols} symbols and ${data.num_subcarriers} subcarriers`}>
        {data.classification.map((row, subcarrier) => row.map((value, symbol) => <rect key={`${subcarrier}-${symbol}`} x={symbol * 18} y={(data.num_subcarriers - subcarrier - 1) * 5} width="17" height="4" rx="1" fill={colors[value] ?? colors[0]} />))}
      </svg>
      <div className="grid-legend"><span><i className="legend-data" />Data / occupied</span><span><i className="legend-pilot" />DMRS / pilot</span><span><i className="legend-empty" />Unused</span></div>
      <p className="chart-note">Actual transmitted frequency-domain grid · x: OFDM symbol · y: subcarrier</p>
    </div>
  );
}
