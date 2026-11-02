# ModemScope architecture

ModemScope is a local two-process application. The browser never fabricates or estimates engineering results; it renders persisted outputs returned by FastAPI.

```text
Next.js browser UI
  ├─ configuration validation and job submission
  ├─ status polling
  ├─ Plotly performance and I/Q charts
  └─ history, deletion, JSON/CSV downloads
              │ HTTP / JSON
              ▼
FastAPI
  ├─ Pydantic request boundaries
  ├─ one-worker ThreadPoolExecutor
  ├─ SQLite run state and results
  └─ deterministic diagnostics
              │
              ▼
Sionna PHY 2.2 / PyTorch
  PUSCHTransmitter → channel → PUSCHReceiver
       │           AWGN or          │
       │    Rayleigh+OFDMChannel    │
       └──────── bit comparison ────┘
```

## Process boundaries

- Next.js runs on port 3000 and treats the API as the source of truth.
- FastAPI runs on port 8000. CORS is limited to the two usual localhost origins.
- A bounded executor serializes PHY jobs so multiple submissions cannot exhaust a development machine.
- SQLite stores configuration, lifecycle state, measurements, visual samples, diagnostics, and simulator provenance.
- On backend startup, jobs left in `queued` or `running` are marked `interrupted`.

## Data integrity

The engine returns no fallback measurements. Import, configuration, transmitter, channel, or receiver failures mark the run as failed. BER and BLER are recomputed from the original and decoded information-bit tensors. Export endpoints serialize only stored records.

## Current model boundary

The implemented link is single-user, SISO, and single-layer. It uses a four-PRB frequency-domain PUSCH slot with the Sionna-configured DMRS pattern. AWGN is additive noise only. Rayleigh mode uses `RayleighBlockFading` through `OFDMChannel` with normalized channel power and receiver channel estimation.
