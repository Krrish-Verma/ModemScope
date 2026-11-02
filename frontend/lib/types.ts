export type Measurement = {
  ebn0_db: number;
  ber: number;
  bler: number;
  bit_errors: number;
  num_bits: number;
  block_errors: number;
  num_blocks: number;
  runtime_seconds: number;
  noise_variance: number;
};

export type Insight = {
  title: string;
  severity: "info" | "warning" | "success";
  evidence: string;
  observation: string;
  explanation: string;
  suggestion: string;
};

export type IQPoint = { i: number; q: number };

export type SimulationResult = {
  engine: { name: string; version: string; torch_version: string; device: string };
  phy: {
    label: string;
    modulation: string;
    mcs_index: number;
    effective_bits_per_symbol: number;
    target_code_rate: number;
    tb_size: number;
    num_prbs: number;
    num_layers: number;
  };
  measurements: Measurement[];
  visualizations: {
    constellation: {
      label: string;
      note: string;
      transmitted: IQPoint[];
      received: IQPoint[];
    };
    resource_grid: {
      num_symbols: number;
      num_subcarriers: number;
      classification: number[][];
      legend: Record<string, string>;
    };
  };
  point_visualizations?: SimulationResult["visualizations"][];
  diagnostics: Insight[];
  runtime_seconds: number;
  seed: number;
};

export type RunRecord = {
  id: string;
  status: "queued" | "running" | "completed" | "failed" | "interrupted";
  created_at: string;
  updated_at: string;
  configuration: {
    mode: "quick" | "sweep";
    preset: string;
    channel_model: string;
    ebn0_db: number;
    sweep_start_db: number;
    sweep_end_db: number;
    sweep_step_db: number;
    num_blocks: number;
    seed: number;
  };
  progress: number;
  stage: string;
  result: SimulationResult | null;
  error: string | null;
};
