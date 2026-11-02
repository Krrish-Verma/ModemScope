# ModemScope engineering notes

These notes are written as an interview-ready explanation of what the application implements and what its measurements mean.

## PUSCH transmission pipeline

The 5G NR Physical Uplink Shared Channel carries scheduled user data from user equipment toward the base station. ModemScope uses Sionna's integrated `PUSCHTransmitter`, which creates information bits, performs transport-block processing and LDPC coding, maps the coded bits to QAM, inserts DMRS, and places the symbols in an OFDM resource grid. The matching `PUSCHReceiver` estimates the channel, detects symbols, produces soft bit information, and decodes the transport block.

The implemented path is:

1. Build a validated `PUSCHConfig` for one transmitter, one antenna port, and one layer.
2. Select the MCS through `TBConfig.mcs_index` and table 1.
3. Generate a batch of PUSCH slots and retain the generated information bits.
4. Convert the requested Eb/N0 to noise variance with Sionna's modulation order, target code rate, and resource grid.
5. Apply AWGN or normalized Rayleigh block fading in the frequency domain.
6. Decode through `PUSCHReceiver` and compare the information-bit tensors exactly.

## QAM

Quadrature amplitude modulation represents bits with a complex number, (I + jQ). QPSK carries two coded bits per symbol. 16-QAM carries four. Because 16-QAM packs more points into the same normalized signal space, the minimum distance between points is smaller and it generally needs a better channel for comparable reliability. ModemScope exposes MCS presets rather than claiming that modulation can be changed independently of the transport-block configuration.

## OFDM

OFDM sends data over many mutually orthogonal subcarriers. A slot can be viewed as a matrix whose columns are OFDM symbols and rows are subcarriers. Some resource elements contain data, some contain DMRS used for channel estimation, and some are unused. ModemScope's resource-grid explorer is derived from the actual frequency-domain transmitter tensor and the Sionna pilot mask.

## AWGN

Additive white Gaussian noise is a baseline channel model. “Additive” means it is summed with the transmitted complex samples; “white” means flat power spectral density over the modeled bandwidth; “Gaussian” describes the in-phase and quadrature noise distributions. It isolates coding and modulation performance without fading.

## Rayleigh block fading

Rayleigh fading is a useful model for a no-dominant-line-of-sight multipath channel. In block fading, the channel is constant over the modeled block and independently redrawn for another block. ModemScope uses Sionna's `RayleighBlockFading` as the channel model inside `OFDMChannel`, normalizes channel power, adds AWGN, and lets the PUSCH receiver estimate the channel from DMRS.

## Eb/N0 versus SNR

Eb/N0 is energy per information bit divided by noise spectral density. It is not interchangeable with sample SNR because coding, modulation, pilot overhead, unused resource elements, and cyclic-prefix overhead affect the conversion. ModemScope passes Eb/N0 to `ebnodb2no` together with the effective bits per symbol, target code rate, and resource grid. The UI deliberately labels the control Eb/N0 rather than SNR.

## BER versus BLER

Bit error rate is

```text
BER = wrong decoded information bits / transmitted information bits
```

Block error rate is

```text
BLER = transport blocks with one or more wrong information bits / transmitted blocks
```

The implementation counts both numerators before computing the rates. A measured zero means zero observed errors in a finite sample—not proof that the underlying probability is zero. On logarithmic plots, zero observations are identified rather than replaced with invented positive values.

## Sionna configuration

The two exposed presets use 3GPP MCS table 1:

| Preset | MCS index | Effective modulation order |
| --- | ---: | ---: |
| QPSK balanced | 5 | 2 bits/symbol |
| 16-QAM balanced | 11 | 4 bits/symbol |

At runtime, the engine checks `TBConfig.num_bits_per_symbol` against this claim. A mismatch fails the experiment. The transmitter's own target code rate is used for noise conversion and saved with the result.

## Validation strategy

- Unit tests verify exact error counts, schema bounds, storage round trips, and statistically honest diagnostic text.
- PHY tests run both exposed presets through the real AWGN chain and run Rayleigh block fading on CPU.
- Every test asserts `0 ≤ BER, BLER ≤ 1` and checks that stored rates reproduce their integer counts exactly.
- A fixed seed is applied to NumPy, PyTorch, and Sionna and is checked for repeatable error counts.
- Production validation includes frontend type checking/build plus an API-driven end-to-end run and export.

## Interview boundary statement

“ModemScope is a software PUSCH link-level verification tool, not a full UE or gNodeB and not an RF instrument. Its useful engineering claim is that it exercises Sionna's standards-based NR transport and receiver components, measures decoded information-bit errors, and makes the experiment reproducible and inspectable.”
