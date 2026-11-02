import Link from "next/link";
import { ArrowRight, BarChart3, ChevronDown, Search, Waves } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Reveal } from "@/components/Reveal";
import { WaveField } from "@/components/WaveField";

const pipeline = ["Transport bits", "NR encoding + modulation", "OFDM resource grid", "Wireless channel", "Receiver + decoding", "BER / BLER"];

export default function Home() {
  return (
    <main>
      <Nav />
      <section className="hero">
        <div className="hero-glow" />
        <WaveField />
        <div className="hero-content">
          <p className="eyebrow eyebrow-dark">5G NR physical-layer laboratory</p>
          <h1>See the signal.<br />Understand the failure.</h1>
          <p className="hero-copy">Explore 5G NR performance through real physical-layer simulations, interactive signal analysis, and automated modem testing.</p>
          <div className="hero-actions">
            <Link className="button" href="/lab">Launch simulator <ArrowRight size={17} /></Link>
            <Link className="button button-ghost-dark" href="/learn">Explore the technology</Link>
          </div>
        </div>
        <Reveal className="product-preview">
          <div className="preview-bar"><span /><span /><span /><em>Signal Laboratory · illustrative empty state</em></div>
          <div className="preview-body">
            <aside><small>EXPERIMENT</small><b>Quick test</b><small>CHANNEL</small><b>AWGN</b><Link className="preview-launch" href="/lab">Configure run</Link></aside>
            <div className="preview-panels">
              <div className="preview-metrics"><span>BER<strong>Awaiting run</strong></span><span>BLER<strong>Awaiting run</strong></span><span>Bits tested<strong>—</strong></span></div>
              <div className="preview-chart"><div className="preview-axis" /><p>Measured performance appears here</p></div>
            </div>
          </div>
        </Reveal>
        <a className="scroll-cue" href="#overview" aria-label="Scroll to overview"><ChevronDown /></a>
      </section>

      <section id="overview" className="section intro">
        <Reveal>
          <p className="eyebrow">The invisible, explained</p>
          <h2>Wireless systems,<br />made visible.</h2>
          <p className="lede">ModemScope turns a standards-based uplink simulation into evidence you can inspect—from resource elements and noisy constellation points to exact information-bit errors.</p>
        </Reveal>
      </section>

      <section className="section features">
        <Reveal className="feature-card feature-blue">
          <div className="feature-icon"><Waves /></div><p className="eyebrow">01 · Configure</p><h3>Simulate the link.</h3><p>Choose a validated PUSCH MCS preset, channel, Eb/N0, workload, and seed.</p><div className="mini-wave" />
        </Reveal>
        <Reveal className="feature-card feature-dark">
          <div className="feature-icon"><BarChart3 /></div><p className="eyebrow eyebrow-dark">02 · Measure</p><h3>Count every error.</h3><p>BER and BLER come directly from transmitted and decoded Sionna information bits.</p><div className="mini-bars"><i /><i /><i /><i /><i /></div>
        </Reveal>
        <Reveal className="feature-card">
          <div className="feature-icon"><Search /></div><p className="eyebrow">03 · Diagnose</p><h3>Follow the evidence.</h3><p>Deterministic insights explain what the sample supports and suggest the next useful experiment.</p><div className="diagnostic-lines"><i /><i /><i /></div>
        </Reveal>
      </section>

      <section className="section pipeline-section">
        <Reveal>
          <p className="eyebrow">Implemented signal path</p><h2>From bits to evidence.</h2>
          <div className="pipeline">
            {pipeline.map((step, index) => <div className="pipeline-step" key={step}><span>{String(index + 1).padStart(2, "0")}</span><b>{step}</b>{index < pipeline.length - 1 && <ArrowRight />}</div>)}
          </div>
          <p className="technical-note">Single-user, single-layer PUSCH · frequency-domain AWGN and Rayleigh block fading · NVIDIA Sionna PHY 2.2</p>
        </Reveal>
      </section>

      <section className="final-cta">
        <Reveal><p className="eyebrow eyebrow-dark">Your next experiment</p><h2>Ready to explore<br />the physical layer?</h2><Link className="button button-light" href="/lab">Open ModemScope <ArrowRight size={17} /></Link></Reveal>
      </section>
      <footer><span>ModemScope</span><p>Simulated 5G NR PUSCH link-level testing—not hardware RF measurement.</p><span>Built with Sionna PHY</span></footer>
    </main>
  );
}
