# ModemScope

**5G NR modem testing and signal analysis platform**  
*Status: Work in progress*

ModemScope is a planned Python-based testbench for exploring 5G NR physical-layer performance under simulated wireless channel conditions. The goal is to automate repeatable modem tests and make signal impairments easier to analyze.

## Planned features

- Simulate 5G NR PUSCH uplink transmission using NVIDIA Sionna.
- Test QPSK and QAM modulation across signal-to-noise ratios and channel models.
- Measure bit error rate (BER) and block error rate (BLER).
- Visualize constellation diagrams and BER/BLER performance curves.
- Generate reproducible test reports and basic failure diagnostics.

## Proposed stack

Python · NVIDIA Sionna · NumPy · Pandas · FastAPI · Plotly

## Roadmap

- [ ] Build and verify a baseline PUSCH transmit/receive simulation
- [ ] Add automated channel and SNR sweeps
- [ ] Validate BER/BLER results and generate plots
- [ ] Add a simple dashboard and test report export

> This repository currently documents a project in development. No simulation results or measured performance are claimed yet.
