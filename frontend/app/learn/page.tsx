import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = { title: "Inside the Signal" };

const lessons = [
  ["01", "What is 5G NR PUSCH?", "The Physical Uplink Shared Channel carries user data from a device toward a base station. ModemScope models its transport-block coding, QAM mapping, DMRS pilots, OFDM grid, channel, detection, and decoding for a single-user link."],
  ["02", "OFDM divides the problem.", "Orthogonal frequency-division multiplexing places symbols across many narrow subcarriers and OFDM symbol intervals. The resulting resource grid makes data and reference-signal allocation visible."],
  ["03", "QAM gives bits a position.", "Quadrature amplitude modulation represents groups of bits as complex I/Q symbols. QPSK maps two bits per symbol; 16-QAM maps four, trading greater throughput for closer constellation spacing."],
  ["04", "The channel changes the evidence.", "AWGN adds complex Gaussian noise. Rayleigh block fading also applies a random channel response, modeling a no-line-of-sight multipath amplitude and phase change over a block."],
  ["05", "Eb/N0, not a vague SNR.", "Eb/N0 is energy per information bit divided by noise spectral density. Sionna converts it to the noise variance using modulation order, target code rate, and resource-grid overhead."],
  ["06", "BER and BLER answer different questions.", "BER counts wrong decoded information bits. BLER counts transport blocks with at least one wrong information bit. A link can have a modest BER while losing many blocks."],
  ["07", "The receiver reconstructs the bits.", "The PUSCH receiver estimates the channel from DMRS, detects QAM symbols, forms soft information, reverses layer mapping, and decodes the 5G transport block."],
  ["08", "ModemScope closes the loop.", "Every run stores its configuration and seed, compares the transmitted and decoded bit tensors, derives exact counts, and attaches raw frequency-domain samples for inspection."],
];

export default function LearnPage() {
  return <main><Nav /><section className="learn-hero"><p className="eyebrow eyebrow-dark">A visual field guide</p><h1>Inside the Signal.</h1><p>Eight ideas that turn a 5G uplink from an abstraction into an experiment you can explain.</p><div className="qam-orbit" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <i key={i} />)}</div></section><section className="lesson-list">{lessons.map(([number, title, copy], index) => <Reveal className={`lesson ${index % 2 ? "lesson-offset" : ""}`} key={number}><span>{number}</span><div><h2>{title}</h2><p>{copy}</p></div></Reveal>)}</section><section className="scope-note"><Reveal><p className="eyebrow">Know the boundary</p><h2>A link-level model,<br />not a complete modem.</h2><p>ModemScope intentionally models a validated subset: single-user, single-layer 5G NR PUSCH in software. It does not model a full protocol stack, RF front-end impairments, scheduling, mobility procedures, or hardware measurements.</p><Link className="button" href="/lab">Run an experiment <ArrowRight /></Link></Reveal></section></main>;
}
