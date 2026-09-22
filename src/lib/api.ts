import {
  supabaseFetchProblems,
  supabaseFetchProblemBySlug,
  supabaseFetchLeaderboard,
  supabaseFetchMyRank,
  supabaseFetchAllAchievements,
  supabaseFetchMyAchievements,
  supabaseFetchDiscussions,
  supabaseFetchProblemSubmissions,
} from "./supabase/queries";
import { createClient } from "./supabase/client";

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch {
    // Ignore error
  }
  return {};
}

import {
  Problem,
  ProblemListResponse,
  SubmissionResult,
  SubmissionRequest,
  WaveformData,
  LeaderboardResponse,
  UserRankResponse,
  UserAchievementsResponse,
  Achievement,
  AchievementInfo,
  AIChatRequest,
  AIChatResponse,
  AIConversationSummary,
  AIConversationDetail,
  AIFeedbackRequest,
  DailyChallenge,
  Contest,
  ContestProblem,
  ContestLeaderboardEntry,
  CommunitySolution,
} from "./types";

const RAW_API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const authHeader = await getAuthHeader();
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      (body as { detail?: string }).detail ||
      `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return res.json();
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface ApiProblem {
  id: number;
  slug: string;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  category: string;
  language: "VERILOG" | "SYSTEMVERILOG";
  input_description: string;
  output_description: string;
  constraints: string;
  starter_code: string;
  time_complexity: string;
  space_complexity: string;
  reference_solution: string;
  created_at: string;
  updated_at: string;
  public_test_cases: Array<{
    name: string;
    description: string;
    input: string;
    expected: string;
  }>;
  public_testbenches: Array<{
    name: string;
    testbench: string;
    language: string;
  }>;
  company_tags?: string;
}

interface ApiProblemListResponse {
  problems: ApiProblem[];
  total: number;
}

interface ApiTestResult {
  name: string;
  passed: boolean;
  expected: string;
  received: string;
  message: string;
}

interface ApiSubmissionResponse {
  status: string;
  message: string;
  compilation_message: string | null;
  tests: ApiTestResult[];
  score: number;
  tests_passed: number;
  tests_total: number;
  execution_time: number;
  submission_id: number;
  waveform_id: string | null;
  xp_earned: number;
  xp_total: number;
  level: number;
  progress_status: string | null;
  achievements_unlocked: ApiAchievementInfo[];
  submitted_by: string | null;
  submitted_by_display: string | null;
}

interface ApiAchievementInfo {
  slug: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
}

function mapDifficulty(d: "EASY" | "MEDIUM" | "HARD"): "easy" | "medium" | "hard" {
  return d.toLowerCase() as "easy" | "medium" | "hard";
}

function mapLanguage(
  l: "VERILOG" | "SYSTEMVERILOG"
): "verilog" | "systemverilog" {
  return l.toLowerCase() as "verilog" | "systemverilog";
}

function transformProblem(p: ApiProblem): Problem {
  return {
    id: String(p.id),
    slug: p.slug,
    title: p.title,
    difficulty: mapDifficulty(p.difficulty),
    category: p.category,
    language: mapLanguage(p.language),
    description: p.description,
    inputDescription: p.input_description,
    outputDescription: p.output_description,
    constraints: p.constraints ? p.constraints.split("\n").filter(Boolean) : [],
    examples: [],
    starterCode: p.starter_code,
    timeComplexity: p.time_complexity || undefined,
    spaceComplexity: p.space_complexity || undefined,
    referenceSolution: p.reference_solution || undefined,
    publicTestCases: p.public_test_cases || [],
    publicTestbenches: p.public_testbenches || [],
    companyTags: p.company_tags
      ? p.company_tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [],
  };
}

export const MOCK_PROBLEMS: Problem[] = [
  {
    id: "1",
    slug: "and-gate",
    title: "AND Gate",
    difficulty: "easy",
    category: "Combinational Logic",
    language: "systemverilog",
    companyTags: ["Intel", "AMD"],
    description: "Implement a 2-input AND gate. The output should be 1 only when both inputs are 1.",
    inputDescription: "a, b — single-bit inputs",
    outputDescription: "y — single-bit output",
    constraints: ["Both inputs are single-bit values"],
    examples: [
      { title: "Both inputs high", input: "a = 1, b = 1", output: "y = 1" },
      { title: "One input low", input: "a = 1, b = 0", output: "y = 0" },
    ],
    starterCode: `module and_gate (
  input  logic a,
  input  logic b,
  output logic y
);

  // Your code here

endmodule`,
  },
  {
    id: "2",
    slug: "or-gate",
    title: "OR Gate",
    difficulty: "easy",
    category: "Combinational Logic",
    language: "systemverilog",
    companyTags: ["Intel", "AMD"],
    description: "Implement a 2-input OR gate. The output should be 1 when at least one input is 1.",
    inputDescription: "a, b — single-bit inputs",
    outputDescription: "y — single-bit output",
    constraints: ["Both inputs are single-bit values"],
    examples: [
      { title: "Both inputs low", input: "a = 0, b = 0", output: "y = 0" },
      { title: "One input high", input: "a = 0, b = 1", output: "y = 1" },
    ],
    starterCode: `module or_gate (
  input  logic a,
  input  logic b,
  output logic y
);

  // Your code here

endmodule`,
  },
  {
    id: "3",
    slug: "not-gate",
    title: "NOT Gate",
    difficulty: "easy",
    category: "Combinational Logic",
    language: "systemverilog",
    companyTags: ["Intel", "AMD"],
    description: "Implement a NOT gate (inverter). The output should be the inverse of the input.",
    inputDescription: "a — single-bit input",
    outputDescription: "y — single-bit output",
    constraints: ["Input is a single-bit value"],
    examples: [
      { title: "Input high", input: "a = 1", output: "y = 0" },
      { title: "Input low", input: "a = 0", output: "y = 1" },
    ],
    starterCode: `module not_gate (
  input  logic a,
  output logic y
);

  // Your code here

endmodule`,
  },
  {
    id: "4",
    slug: "xor-gate",
    title: "XOR Gate",
    difficulty: "easy",
    category: "Combinational Logic",
    language: "systemverilog",
    companyTags: ["Intel", "AMD"],
    description: "Implement a 2-input XOR gate. The output should be 1 when the inputs are different.",
    inputDescription: "a, b — single-bit inputs",
    outputDescription: "y — single-bit output",
    constraints: ["Both inputs are single-bit values"],
    examples: [
      { title: "Same inputs", input: "a = 0, b = 0", output: "y = 0" },
      { title: "Different inputs", input: "a = 0, b = 1", output: "y = 1" },
    ],
    starterCode: `module xor_gate (
  input  logic a,
  input  logic b,
  output logic y
);

  // Your code here

endmodule`,
  },
  {
    id: "5",
    slug: "2-to-1-mux",
    title: "2:1 Multiplexer",
    difficulty: "easy",
    category: "Combinational Logic",
    language: "systemverilog",
    companyTags: ["Apple", "NVIDIA"],
    description: "Implement a 2-to-1 multiplexer. When sel is 0, output a; when sel is 1, output b.",
    inputDescription: "a, b — single-bit inputs, sel — select signal",
    outputDescription: "y — single-bit output",
    constraints: ["All inputs are single-bit values"],
    examples: [
      { title: "Select a", input: "a = 1, b = 0, sel = 0", output: "y = 1" },
      { title: "Select b", input: "a = 1, b = 0, sel = 1", output: "y = 0" },
    ],
    starterCode: `module mux2 (
  input  logic a,
  input  logic b,
  input  logic sel,
  output logic y
);

  // Your code here

endmodule`,
  },
  {
    id: "6",
    slug: "half-adder",
    title: "Half Adder",
    difficulty: "easy",
    category: "Arithmetic",
    language: "systemverilog",
    companyTags: ["Intel", "Qualcomm"],
    description: "Implement a half adder that adds two single-bit inputs producing sum and carry outputs.",
    inputDescription: "a, b — single-bit inputs",
    outputDescription: "sum, carry — single-bit outputs",
    constraints: ["Both inputs are single-bit values"],
    examples: [
      { title: "0 + 0", input: "a = 0, b = 0", output: "sum = 0, carry = 0" },
      { title: "1 + 1", input: "a = 1, b = 1", output: "sum = 0, carry = 1" },
    ],
    starterCode: `module half_adder (
  input  logic a,
  input  logic b,
  output logic sum,
  output logic carry
);

  // Your code here

endmodule`,
  },
  {
    id: "7",
    slug: "full-adder",
    title: "Full Adder",
    difficulty: "easy",
    category: "Arithmetic",
    language: "systemverilog",
    companyTags: ["Intel", "AMD"],
    description: "Implement a full adder that adds two single-bit inputs plus a carry-in, producing sum and carry-out.",
    inputDescription: "a, b — single-bit inputs, cin — carry-in",
    outputDescription: "sum, cout — single-bit outputs",
    constraints: ["All inputs are single-bit values"],
    examples: [
      { title: "1 + 1 + 0", input: "a = 1, b = 1, cin = 0", output: "sum = 0, cout = 1" },
      { title: "1 + 1 + 1", input: "a = 1, b = 1, cin = 1", output: "sum = 1, cout = 1" },
    ],
    starterCode: `module full_adder (
  input  logic a,
  input  logic b,
  input  logic cin,
  output logic sum,
  output logic cout
);

  // Your code here

endmodule`,
  },
  {
    id: "8",
    slug: "d-flip-flop",
    title: "D Flip-Flop",
    difficulty: "easy",
    category: "Sequential Logic",
    language: "systemverilog",
    companyTags: ["Qualcomm", "Apple"],
    description: "Implement a positive-edge-triggered D flip-flop. On the rising edge of clk, the output q captures the input d.",
    inputDescription: "clk — clock signal, d — data input, rst — synchronous reset",
    outputDescription: "q — registered output",
    constraints: ["Reset is active high and synchronous"],
    examples: [
      { title: "Reset", input: "rst = 1", output: "q = 0" },
      { title: "Capture", input: "rst = 0, d = 1 (posedge clk)", output: "q = 1" },
    ],
    starterCode: `module d_flip_flop (
  input  logic clk,
  input  logic rst,
  input  logic d,
  output logic q
);

  // Your code here

endmodule`,
  },
  {
    id: "9",
    slug: "4-bit-counter",
    title: "4-bit Counter",
    difficulty: "medium",
    category: "Sequential Logic",
    language: "systemverilog",
    companyTags: ["Qualcomm", "ARM"],
    description: "Design a synchronous 4-bit counter. The counter should reset to 0 when rst is asserted, increment on every rising edge of clk, and wrap from 15 back to 0.",
    inputDescription: "clk — clock signal, rst — synchronous active-high reset",
    outputDescription: "count[3:0] — 4-bit counter output",
    constraints: ["Reset is synchronous and active high", "Counter wraps from 15 to 0"],
    examples: [
      { title: "Reset", input: "rst = 1", output: "count = 4'b0000" },
      { title: "Counting", input: "rst = 0, 4 clock edges", output: "count = 4'b0100" },
    ],
    starterCode: `module counter (
  input  logic        clk,
  input  logic        rst,
  output logic [3:0]  count
);

  always_ff @(posedge clk) begin
    if (rst)
      count <= 4'b0000;
    else
      count <= count + 1'b1;
  end

endmodule`,
  },
  {
    id: "10",
    slug: "4-bit-alu",
    title: "ALU",
    difficulty: "medium",
    category: "Arithmetic",
    language: "systemverilog",
    companyTags: ["AMD", "Intel"],
    description: "Design a simple 4-bit arithmetic logic unit. The ALU should support addition, subtraction, AND, and OR operations based on a 2-bit opcode.",
    inputDescription: "a[3:0], b[3:0] — operands, op[1:0] — opcode (00=ADD, 01=SUB, 10=AND, 11=OR)",
    outputDescription: "result[3:0] — operation result",
    constraints: ["All operands are 4-bit values"],
    examples: [
      { title: "Addition", input: "a = 4'b0011, b = 4'b0001, op = 2'b00", output: "result = 4'b0100" },
      { title: "Subtraction", input: "a = 4'b0101, b = 4'b0010, op = 2'b01", output: "result = 4'b0011" },
    ],
    starterCode: `module alu (
  input  logic [3:0] a,
  input  logic [3:0] b,
  input  logic [1:0] op,
  output logic [3:0] result
);

  // Your code here

endmodule`,
  },
  {
    id: "11",
    slug: "chip-adder-4bit",
    title: "4-Bit Ripple Carry Adder Chip",
    difficulty: "easy",
    category: "Chip Design",
    language: "systemverilog",
    companyTags: ["Intel", "AMD", "Qualcomm"],
    description: "Construct a 4-bit ripple carry adder chip by instantiating full_adder parts.",
    inputDescription: "a[3:0], b[3:0] — 4-bit inputs, cin — carry in",
    outputDescription: "sum[3:0] — 4-bit sum, cout — carry out",
    constraints: ["Hierarchical structural model using full_adder parts."],
    examples: [
      { title: "Addition without carry", input: "a = 4'b0010, b = 4'b0001, cin = 0", output: "sum = 4'b0011, cout = 0" },
      { title: "Addition with carry out", input: "a = 4'b1111, b = 4'b0001, cin = 0", output: "sum = 4'b0000, cout = 1" },
    ],
    starterCode: `module chip_adder4 (
  input  logic [3:0] a,
  input  logic [3:0] b,
  input  logic       cin,
  output logic [3:0] sum,
  output logic       cout
);
  // Internal carry wires between Full Adder parts
  wire c1, c2, c3;

  // Instantiate 4 full_adder parts:
  // full_adder fa0 (.a(...), .b(...), .cin(...), .sum(...), .cout(...));

endmodule`,
  },
  {
    id: "12",
    slug: "chip-mux-4to1",
    title: "4:1 Multiplexer from 2:1 MUX Parts",
    difficulty: "easy",
    category: "Chip Design",
    language: "systemverilog",
    companyTags: ["NVIDIA", "Apple", "Broadcom"],
    description: "Construct a 4-to-1 multiplexer by instantiating three 2:1 multiplexer (mux2) parts.",
    inputDescription: "d0, d1, d2, d3 — single-bit inputs, sel[1:0] — 2-bit select",
    outputDescription: "y — selected output",
    constraints: ["Must use three mux2 instances."],
    examples: [
      { title: "Select channel 0", input: "d0=1, d1=0, d2=0, d3=0, sel=2'b00", output: "y = 1" },
      { title: "Select channel 3", input: "d0=0, d1=0, d2=0, d3=1, sel=2'b11", output: "y = 1" },
    ],
    starterCode: `module chip_mux4 (
  input  logic       d0,
  input  logic       d1,
  input  logic       d2,
  input  logic       d3,
  input  logic [1:0] sel,
  output logic       y
);
  // Internal wires connecting stage-1 mux parts to stage-2 mux
  wire m01, m23;

  // Instantiate 3 mux2 parts:
  // mux2 mux_lo (.d0(d0), .d1(d1), .sel(sel[0]), .y(m01));
  // mux2 mux_hi (.d0(d2), .d1(d3), .sel(sel[0]), .y(m23));
  // mux2 mux_out (.d0(m01), .d1(m23), .sel(sel[1]), .y(y));

endmodule`,
  },
  {
    id: "13",
    slug: "sync-fifo",
    title: "Synchronous FIFO Buffer",
    difficulty: "medium",
    category: "Sequential Logic",
    language: "systemverilog",
    companyTags: ["Apple Silicon", "NVIDIA", "Google Silicon"],
    description: "Implement an 8-word x 8-bit synchronous First-In First-Out (FIFO) buffer with full and empty flags.",
    inputDescription: "clk, rst, wr_en, rd_en, din[7:0]",
    outputDescription: "dout[7:0], full, empty",
    constraints: ["Synchronous write on posedge clk when wr_en && !full", "Synchronous read when rd_en && !empty"],
    examples: [
      { title: "Empty at reset", input: "rst = 1", output: "empty = 1, full = 0" },
      { title: "Write single word", input: "wr_en = 1, din = 8'hA5", output: "empty = 0, full = 0" },
    ],
    starterCode: `module sync_fifo (
  input  logic       clk,
  input  logic       rst,
  input  logic       wr_en,
  input  logic       rd_en,
  input  logic [7:0] din,
  output logic [7:0] dout,
  output logic       full,
  output logic       empty
);
  logic [7:0] mem [0:7];
  logic [2:0] wr_ptr;
  logic [2:0] rd_ptr;
  logic [3:0] count;

  assign empty = (count == 4'd0);
  assign full  = (count == 4'd8);

  always_ff @(posedge clk) begin
    if (rst) begin
      wr_ptr <= 3'd0;
      rd_ptr <= 3'd0;
      count  <= 4'd0;
      dout   <= 8'd0;
    end else begin
      // Your code here
    end
  end

endmodule`,
  },
  {
    id: "14",
    slug: "priority-encoder-8to3",
    title: "8-to-3 Priority Encoder",
    difficulty: "easy",
    category: "Combinational Logic",
    language: "systemverilog",
    companyTags: ["NVIDIA", "Intel"],
    description: "Implement an 8-to-3 priority encoder. Given an 8-bit input, output the binary index of the highest-priority (most significant) active bit and a valid flag.",
    inputDescription: "in[7:0] — 8-bit input value",
    outputDescription: "out[2:0] — index of highest active bit, valid — active-high valid flag",
    constraints: ["Priority is from MSB (bit 7) to LSB (bit 0)", "Output is combinational"],
    examples: [
      { title: "Active bit 5", input: "in = 8'b00101100", output: "out = 3'd5, valid = 1" },
      { title: "All zeros", input: "in = 8'b00000000", output: "valid = 0" },
    ],
    starterCode: `module priority_encoder (
  input  logic [7:0] in,
  output logic [2:0] out,
  output logic       valid
);

  // Your code here

endmodule`,
  },
  {
    id: "15",
    slug: "gray-code-converter",
    title: "Binary & Gray Code Converter",
    difficulty: "easy",
    category: "Arithmetic",
    language: "systemverilog",
    companyTags: ["Apple", "Qualcomm", "Broadcom"],
    description: "Implement a bidirectional converter between binary and Gray code. When mode=0, convert binary to Gray code. When mode=1, convert Gray code to binary.",
    inputDescription: "in[3:0] — 4-bit input, mode — 0=binary-to-gray, 1=gray-to-binary",
    outputDescription: "out[3:0] — 4-bit converted output",
    constraints: ["All conversions are combinational", "4-bit width"],
    examples: [
      { title: "Binary to Gray", input: "in = 4'b1010, mode = 0", output: "out = 4'b1111" },
      { title: "Gray to Binary", input: "in = 4'b1111, mode = 1", output: "out = 4'b1010" },
    ],
    starterCode: `module gray_code_converter (
  input  logic [3:0] in,
  input  logic       mode,
  output logic [3:0] out
);

  // Your code here

endmodule`,
  },
  {
    id: "16",
    slug: "leading-zero-counter",
    title: "Leading Zero Counter (8-bit)",
    difficulty: "medium",
    category: "Arithmetic",
    language: "systemverilog",
    companyTags: ["ARM", "AMD", "Google Silicon"],
    description: "Count the number of leading zeros in an 8-bit input value. Also output an all_zeros flag when the input is 0.",
    inputDescription: "in[7:0] — 8-bit input value",
    outputDescription: "count[3:0] — number of leading zeros (0-8), all_zeros — high when input is zero",
    constraints: ["Output is combinational", "count ranges from 0 to 8"],
    examples: [
      { title: "Two leading zeros", input: "in = 8'b00101000", output: "count = 4'd2, all_zeros = 0" },
      { title: "All zeros", input: "in = 8'b00000000", output: "count = 4'd8, all_zeros = 1" },
    ],
    starterCode: `module leading_zero_counter (
  input  logic [7:0] in,
  output logic [3:0] count,
  output logic       all_zeros
);

  // Your code here

endmodule`,
  },
  {
    id: "17",
    slug: "adder-subtractor-4bit",
    title: "4-Bit Adder-Subtractor with Overflow",
    difficulty: "medium",
    category: "Arithmetic",
    language: "systemverilog",
    companyTags: ["Intel", "Texas Instruments"],
    description: "Implement a 4-bit adder/subtractor. When sub=0, compute a+b. When sub=1, compute a-b using 2's complement. Report carry_out and signed overflow.",
    inputDescription: "a[3:0], b[3:0] — 4-bit operands, sub — 0=add, 1=subtract",
    outputDescription: "result[3:0] — operation result, carry_out — carry flag, overflow — signed overflow flag",
    constraints: ["All operands are 4-bit values", "Subtraction uses 2's complement"],
    examples: [
      { title: "Addition without overflow", input: "a = 4'd3, b = 4'd2, sub = 0", output: "result = 4'd5, carry_out = 0, overflow = 0" },
      { title: "Subtraction", input: "a = 4'd5, b = 4'd3, sub = 1", output: "result = 4'd2, carry_out = 1, overflow = 0" },
    ],
    starterCode: `module adder_subtractor (
  input  logic [3:0] a,
  input  logic [3:0] b,
  input  logic       sub,
  output logic [3:0] result,
  output logic       carry_out,
  output logic       overflow
);

  // Your code here

endmodule`,
  },
  {
    id: "18",
    slug: "edge-detector",
    title: "Multi-Edge Detector",
    difficulty: "easy",
    category: "Sequential Logic",
    language: "systemverilog",
    companyTags: ["Qualcomm", "Apple", "NVIDIA"],
    description: "Detect rising edges, falling edges, and any edge on a signal input. Output one-cycle pulse for each type.",
    inputDescription: "clk — clock, rst — synchronous reset, signal_in — input signal",
    outputDescription: "pos_edge — rising edge pulse, neg_edge — falling edge pulse, any_edge — any edge pulse",
    constraints: ["Synchronous active-high reset", "Edge detection uses a 1-cycle delayed version of signal_in"],
    examples: [
      { title: "Rising edge detection", input: "signal_in: 0 -> 1", output: "pos_edge = 1, neg_edge = 0, any_edge = 1" },
      { title: "Falling edge detection", input: "signal_in: 1 -> 0", output: "pos_edge = 0, neg_edge = 1, any_edge = 1" },
    ],
    starterCode: `module edge_detector (
  input  logic clk,
  input  logic rst,
  input  logic signal_in,
  output logic pos_edge,
  output logic neg_edge,
  output logic any_edge
);

  // Your code here

endmodule`,
  },
  {
    id: "19",
    slug: "lfsr-8bit",
    title: "8-Bit Fibonacci LFSR",
    difficulty: "medium",
    category: "Sequential Logic",
    language: "systemverilog",
    companyTags: ["AMD", "Qualcomm", "NVIDIA"],
    description: "Implement an 8-bit Fibonacci Linear Feedback Shift Register with taps at positions 8, 6, 5, and 4 (polynomial x^8+x^6+x^5+x^4+1). Include an enable signal.",
    inputDescription: "clk — clock, rst — synchronous reset, enable — shift enable",
    outputDescription: "lfsr_out[7:0] — current LFSR state",
    constraints: ["Reset loads 8'h01", "Polynomial taps at bits 7, 5, 4, 3", "Use XNOR feedback"],
    examples: [
      { title: "Reset state", input: "rst = 1", output: "lfsr_out = 8'h01" },
      { title: "First shift", input: "enable = 1 (1 cycle)", output: "lfsr_out = 8'h80" },
    ],
    starterCode: `module lfsr_8bit (
  input  logic       clk,
  input  logic       rst,
  input  logic       enable,
  output logic [7:0] lfsr_out
);

  // Your code here

endmodule`,
  },
  {
    id: "20",
    slug: "traffic-light-fsm",
    title: "Traffic Light Controller FSM",
    difficulty: "medium",
    category: "Finite State Machines",
    language: "systemverilog",
    companyTags: ["Intel", "Texas Instruments"],
    description: "Design a Moore FSM traffic light controller. Cycle through GREEN→YELLOW→RED states. GREEN lasts while sensor is active, YELLOW lasts 3 cycles, RED lasts 5 cycles then transitions to GREEN.",
    inputDescription: "clk — clock, rst — synchronous reset (active high), sensor — vehicle sensor",
    outputDescription: "green, yellow, red — one-hot traffic light outputs",
    constraints: ["Moore FSM", "GREEN exits when sensor=0", "YELLOW lasts 3 cycles", "RED lasts 5 cycles", "Synchronous active-high reset starts in GREEN"],
    examples: [
      { title: "Reset state", input: "rst = 1, sensor = 1", output: "green = 1, yellow = 0, red = 0" },
      { title: "Sensor low transition", input: "sensor = 0 (1 clock cycle)", output: "green = 0, yellow = 1, red = 0" },
    ],
    starterCode: `module traffic_light_fsm (
  input  logic       clk,
  input  logic       rst,
  input  logic       sensor,
  output logic       green,
  output logic       yellow,
  output logic       red
);

  // Your code here

endmodule`,
  },
  {
    id: "21",
    slug: "binary-to-bcd",
    title: "Binary to BCD Converter (Double Dabble)",
    difficulty: "hard",
    category: "Arithmetic",
    language: "systemverilog",
    companyTags: ["Apple", "Google Silicon", "Intel"],
    description: "Convert an 8-bit binary number (0-255) to BCD using the Double Dabble (shift-and-add-3) algorithm. Output hundreds, tens, and ones digits.",
    inputDescription: "binary_in[7:0] — unsigned 8-bit binary number (0-255)",
    outputDescription: "hundreds[3:0], tens[3:0], ones[3:0] — BCD digits",
    constraints: ["Must be purely combinational", "Input range 0-255"],
    examples: [
      { title: "Convert 255", input: "binary_in = 8'd255", output: "hundreds = 4'd2, tens = 4'd5, ones = 4'd5" },
      { title: "Convert 99", input: "binary_in = 8'd99", output: "hundreds = 4'd0, tens = 4'd9, ones = 4'd9" },
      { title: "Convert 0", input: "binary_in = 8'd0", output: "hundreds = 4'd0, tens = 4'd0, ones = 4'd0" },
    ],
    starterCode: `module binary_to_bcd (
  input  logic [7:0] binary_in,
  output logic [3:0] hundreds,
  output logic [3:0] tens,
  output logic [3:0] ones
);

  // Your code here

endmodule`,
  },
];

export async function fetchProblems(params?: {
  difficulty?: string;
  category?: string;
  search?: string;
}): Promise<ProblemListResponse> {
  const supabaseRes = await supabaseFetchProblems(params);
  if (supabaseRes) return supabaseRes;
  const searchParams = new URLSearchParams();
  if (params?.difficulty && params.difficulty !== "all") {
    searchParams.set("difficulty", params.difficulty.toUpperCase());
  }
  if (params?.category && params.category !== "all") {
    searchParams.set("category", params.category);
  }
  if (params?.search) {
    searchParams.set("search", params.search);
  }

  const qs = searchParams.toString();
  const path = `/api/problems${qs ? `?${qs}` : ""}`;

  try {
    const data = await apiFetch<ApiProblemListResponse>(path);
    return {
      problems: data.problems.map(transformProblem),
      total: data.total,
    };
  } catch {
    let filtered = [...MOCK_PROBLEMS];
    if (params?.difficulty && params.difficulty !== "all") {
      filtered = filtered.filter(
        (p) => p.difficulty.toLowerCase() === params.difficulty?.toLowerCase()
      );
    }
    if (params?.category && params.category !== "all") {
      const cat = params.category.toLowerCase().replace(/[^a-z]/g, "");
      filtered = filtered.filter((p) => {
        const pCat = p.category.toLowerCase().replace(/[^a-z]/g, "");
        return pCat.includes(cat) || cat.includes(pCat);
      });
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
      );
    }
    return {
      problems: filtered,
      total: filtered.length,
    };
  }
}

export async function fetchProblemBySlug(slug: string): Promise<Problem> {
  const supabaseProblem = await supabaseFetchProblemBySlug(slug);
  if (supabaseProblem) return supabaseProblem;
  try {
    const data = await apiFetch<ApiProblem>(`/api/problems/${slug}`);
    return transformProblem(data);
  } catch {
    const mock = MOCK_PROBLEMS.find((p) => p.slug === slug);
    if (mock) return mock;
    throw new ApiError(404, `Problem '${slug}' not found`);
  }
}

export async function runCode(
  request: SubmissionRequest
): Promise<SubmissionResult> {
  const apiRequest = {
    problem_slug: request.problemSlug,
    language: request.language.toUpperCase(),
    code: request.code,
    ...(request.testbenchCode ? { testbench_code: request.testbenchCode } : {}),
  };

  const data = await apiFetch<ApiSubmissionResponse>(
    "/api/submissions/run",
    {
      method: "POST",
      body: JSON.stringify(apiRequest),
    }
  );

  return transformSubmissionResponse(data);
}

export async function submitCode(
  request: SubmissionRequest
): Promise<SubmissionResult> {
  const apiRequest = {
    problem_slug: request.problemSlug,
    language: request.language.toUpperCase(),
    code: request.code,
    ...(request.testbenchCode ? { testbench_code: request.testbenchCode } : {}),
  };

  const data = await apiFetch<ApiSubmissionResponse>(
    "/api/submissions/submit",
    {
      method: "POST",
      body: JSON.stringify(apiRequest),
    }
  );

  return transformSubmissionResponse(data);
}

function transformSubmissionResponse(data: ApiSubmissionResponse): SubmissionResult {
  const status = data.status as SubmissionResult["status"];
  return {
    status,
    compilationMessage: data.compilation_message ?? undefined,
    tests: data.tests.map((t) => ({
      name: t.name,
      passed: t.passed,
      expected: t.expected || undefined,
      received: t.received || undefined,
      message: t.message || undefined,
    })),
    score: data.score,
    testsPassed: data.tests_passed,
    testsTotal: data.tests_total,
    executionTime: data.execution_time,
    waveformId: data.waveform_id ?? undefined,
    xpEarned: data.xp_earned,
    xpTotal: data.xp_total,
    level: data.level,
    progressStatus: data.progress_status,
    achievementsUnlocked: data.achievements_unlocked.map((a) => ({
      slug: a.slug,
      name: a.name,
      description: a.description,
      icon: a.icon,
      xpReward: a.xp_reward,
    })),
    submittedBy: data.submitted_by ?? undefined,
    submittedByDisplay: data.submitted_by_display ?? undefined,
  };
}

interface ApiWaveformSignalChange {
  time: number;
  value: string;
}

interface ApiWaveformSignal {
  name: string;
  width: number;
  changes: ApiWaveformSignalChange[];
}

interface ApiWaveformResponse {
  waveform_id: string;
  format: string;
  duration: number;
  timescale: string;
  file_size: number;
  signal_count: number;
  signals: ApiWaveformSignal[];
}

function transformWaveformData(data: ApiWaveformResponse): WaveformData {
  return {
    waveformId: data.waveform_id,
    format: data.format,
    duration: data.duration,
    timescale: data.timescale,
    fileSize: data.file_size,
    signalCount: data.signal_count,
    signals: data.signals.map((s) => ({
      name: s.name,
      width: s.width,
      changes: s.changes.map((c) => ({
        time: c.time,
        value: c.value,
      })),
    })),
  };
}

export async function fetchWaveform(waveformId: string): Promise<WaveformData> {
  const data = await apiFetch<ApiWaveformResponse>(
    `/api/waveforms/${waveformId}`
  );
  return transformWaveformData(data);
}

export async function fetchLeaderboard(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<LeaderboardResponse> {
  const supabaseLeaderboard = await supabaseFetchLeaderboard(params);
  if (supabaseLeaderboard) return supabaseLeaderboard;
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);

  const qs = searchParams.toString();
  const data = await apiFetch<{
    entries: Array<{
      rank: number;
      user_id: number;
      username: string;
      display_name: string | null;
      xp: number;
      level: number;
      solved_count: number;
      progress: number;
      streak: number;
      achievements: number;
    }>;
    total_users: number;
    page: number;
    limit: number;
    total_pages: number;
  }>(`/api/leaderboard${qs ? `?${qs}` : ""}`);

  return {
    entries: data.entries.map((e) => ({
      rank: e.rank,
      userId: e.user_id,
      username: e.username,
      displayName: e.display_name,
      xp: e.xp,
      level: e.level,
      solvedCount: e.solved_count,
      progress: e.progress,
      streak: e.streak,
      achievements: e.achievements,
    })),
    totalUsers: data.total_users,
    page: data.page,
    limit: data.limit,
    totalPages: data.total_pages,
  };
}

export async function fetchMyRank(): Promise<UserRankResponse> {
  const supabaseRank = await supabaseFetchMyRank();
  if (supabaseRank) return supabaseRank;
  const data = await apiFetch<{
    rank: number;
    xp: number;
    level: number;
    solved_count: number;
    progress: number;
    streak: number;
    achievements: number;
  }>("/api/leaderboard/me");

  return {
    rank: data.rank,
    xp: data.xp,
    level: data.level,
    solvedCount: data.solved_count,
    progress: data.progress,
    streak: data.streak,
    achievements: data.achievements,
  };
}

export async function fetchAllAchievements(): Promise<
  Achievement[]
> {
  const supabaseAch = await supabaseFetchAllAchievements();
  if (supabaseAch) return supabaseAch;
  const data = await apiFetch<{
    achievements: Array<{
      slug: string;
      name: string;
      description: string;
      icon: string;
      xp_reward: number;
      unlocked: boolean;
      unlocked_at: string | null;
      progress_current: number;
      progress_target: number;
    }>;
  }>("/api/achievements");

  return data.achievements.map((a) => ({
    slug: a.slug,
    name: a.name,
    description: a.description,
    icon: a.icon,
    xpReward: a.xp_reward,
    unlocked: a.unlocked,
    unlockedAt: a.unlocked_at,
    progressCurrent: a.progress_current,
    progressTarget: a.progress_target,
  }));
}

export async function fetchMyAchievements(): Promise<UserAchievementsResponse> {
  const supabaseMyAch = await supabaseFetchMyAchievements();
  if (supabaseMyAch) return supabaseMyAch;
  const data = await apiFetch<{
    achievements: Array<{
      slug: string;
      name: string;
      description: string;
      icon: string;
      xp_reward: number;
      unlocked: boolean;
      unlocked_at: string | null;
      progress_current: number;
      progress_target: number;
    }>;
    total_unlocked: number;
    total_available: number;
  }>("/api/achievements/me");

  return {
    achievements: data.achievements.map((a) => ({
      slug: a.slug,
      name: a.name,
      description: a.description,
      icon: a.icon,
      xpReward: a.xp_reward,
      unlocked: a.unlocked,
      unlockedAt: a.unlocked_at,
      progressCurrent: a.progress_current,
      progressTarget: a.progress_target,
    })),
    totalUnlocked: data.total_unlocked,
    totalAvailable: data.total_available,
  };
}

export async function fetchLearningPaths() {
  const data = await apiFetch<{
    paths: Array<{
      id: number;
      slug: string;
      title: string;
      description: string;
      difficulty: string;
      estimated_hours: number;
      module_count: number;
    }>;
  }>("/api/learning/paths");

  return {
    paths: data.paths.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      difficulty: p.difficulty,
      estimatedHours: p.estimated_hours,
      moduleCount: p.module_count,
    })),
  };
}

export async function fetchLearningPath(slug: string) {
  const data = await apiFetch<{
    id: number;
    slug: string;
    title: string;
    description: string;
    difficulty: string;
    estimated_hours: number;
    modules: Array<{
      id: number;
      slug: string;
      title: string;
      description: string;
      order_index: number;
      lessons: Array<{
        id: number;
        slug: string;
        title: string;
        description: string;
        difficulty: string;
        estimated_minutes: number;
        order_index: number;
        has_quiz: boolean;
      }>;
    }>;
  }>(`/api/learning/paths/${slug}`);

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    description: data.description,
    difficulty: data.difficulty,
    estimatedHours: data.estimated_hours,
    modules: data.modules.map((m) => ({
      id: m.id,
      slug: m.slug,
      title: m.title,
      description: m.description,
      orderIndex: m.order_index,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        description: l.description,
        difficulty: l.difficulty,
        estimatedMinutes: l.estimated_minutes,
        orderIndex: l.order_index,
        hasQuiz: l.has_quiz,
      })),
    })),
  };
}

export async function fetchLesson(slug: string) {
  const data = await apiFetch<{
    id: number;
    slug: string;
    title: string;
    description: string;
    content: string;
    difficulty: string;
    estimated_minutes: number;
    order_index: number;
    status: string;
    prerequisites_met: boolean;
    prerequisites: Array<{ slug: string; title: string }>;
    has_quiz: boolean;
    related_problems: Array<{ slug: string; title: string; difficulty: string; category: string }>;
    prev_lesson: { slug: string; title: string } | null;
    next_lesson: { slug: string; title: string } | null;
    module: { slug: string; title: string } | null;
    path: { slug: string; title: string } | null;
  }>(`/api/learning/lessons/${slug}`);

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    description: data.description,
    content: data.content,
    difficulty: data.difficulty,
    estimatedMinutes: data.estimated_minutes,
    orderIndex: data.order_index,
    status: data.status,
    prerequisitesMet: data.prerequisites_met,
    prerequisites: data.prerequisites,
    hasQuiz: data.has_quiz,
    relatedProblems: data.related_problems,
    prevLesson: data.prev_lesson,
    nextLesson: data.next_lesson,
    module: data.module,
    path: data.path,
  };
}

export async function startLesson(slug: string) {
  return apiFetch<{ status: string }>(`/api/learning/lessons/${slug}/start`, {
    method: "POST",
    credentials: "include",
  });
}

export async function completeLesson(slug: string) {
  return apiFetch<{ xp_earned: number }>(`/api/learning/lessons/${slug}/complete`, {
    method: "POST",
    credentials: "include",
  });
}

export async function fetchQuiz(lessonSlug: string) {
  const data = await apiFetch<{
    id: number;
    title: string;
    questions: Array<{
      id: number;
      question: string;
      question_type: string;
      options: string;
      order_index: number;
    }>;
  }>(`/api/learning/quizzes/${lessonSlug}`);

  return {
    id: data.id,
    title: data.title,
    questions: data.questions.map((q) => ({
      id: q.id,
      question: q.question,
      questionType: q.question_type,
      options: q.options,
      orderIndex: q.order_index,
    })),
  };
}

export async function submitQuiz(quizId: number, answers: string[]) {
  return apiFetch<{
    score: number;
    passed: boolean;
    results: Array<{
      question: string;
      correct: boolean;
      correct_answer: string;
      explanation: string;
    }>;
    xp_earned: number;
  }>(`/api/learning/quizzes/${quizId}/attempt`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ answers }),
  });
}

export async function fetchLearningProgress() {
  const data = await apiFetch<{
    paths: Array<{
      id: number;
      slug: string;
      title: string;
      description: string;
      difficulty: string;
      estimated_hours: number;
      modules: Array<{
        id: number;
        slug: string;
        title: string;
        description: string;
        order_index: number;
        lessons: Array<{
          id: number;
          slug: string;
          title: string;
          description: string;
          difficulty: string;
          estimated_minutes: number;
          order_index: number;
          status: string;
          prerequisites_met: boolean;
        }>;
        completed_lessons: number;
        total_lessons: number;
      }>;
      completed_lessons: number;
      total_lessons: number;
      progress_percent: number;
    }>;
    total_lessons: number;
    completed_lessons: number;
    progress_percent: number;
  }>("/api/learning/progress", { credentials: "include" });

  return {
    paths: data.paths.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      difficulty: p.difficulty,
      estimatedHours: p.estimated_hours,
      modules: p.modules.map((m) => ({
        id: m.id,
        slug: m.slug,
        title: m.title,
        description: m.description,
        orderIndex: m.order_index,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          slug: l.slug,
          title: l.title,
          description: l.description,
          difficulty: l.difficulty,
          estimatedMinutes: l.estimated_minutes,
          orderIndex: l.order_index,
          status: l.status,
          prerequisitesMet: l.prerequisites_met,
        })),
        completedLessons: m.completed_lessons,
        totalLessons: m.total_lessons,
      })),
      completedLessons: p.completed_lessons,
      totalLessons: p.total_lessons,
      progressPercent: p.progress_percent,
    })),
    totalLessons: data.total_lessons,
    completedLessons: data.completed_lessons,
    progressPercent: data.progress_percent,
  };
}

export async function fetchConceptMastery() {
  const data = await apiFetch<{
    concepts: Array<{
      slug: string;
      name: string;
      category: string;
      mastery_score: number;
      level: string;
      solved_count: number;
      failed_count: number;
    }>;
  }>("/api/learning/concepts/mastery", { credentials: "include" });

  return {
    concepts: data.concepts.map((c) => ({
      slug: c.slug,
      name: c.name,
      category: c.category,
      masteryScore: c.mastery_score,
      level: c.level,
      solvedCount: c.solved_count,
      failedCount: c.failed_count,
    })),
  };
}

export async function fetchLearningRecommendations() {
  const data = await apiFetch<{
    next_lesson: {
      slug: string;
      title: string;
      module_slug: string;
      module_title: string;
      path_slug: string;
      path_title: string;
    } | null;
    practice_problem: {
      slug: string;
      title: string;
      difficulty: string;
    } | null;
    weak_concept: {
      slug: string;
      name: string;
      mastery_score: number;
    } | null;
    reason: string;
  }>("/api/learning/recommendations", { credentials: "include" });

  return {
    nextLesson: data.next_lesson ? {
      slug: data.next_lesson.slug,
      title: data.next_lesson.title,
      moduleSlug: data.next_lesson.module_slug,
      moduleTitle: data.next_lesson.module_title,
      pathSlug: data.next_lesson.path_slug,
      pathTitle: data.next_lesson.path_title,
    } : null,
    practiceProblem: data.practice_problem ? {
      slug: data.practice_problem.slug,
      title: data.practice_problem.title,
      difficulty: data.practice_problem.difficulty,
    } : null,
    weakConcept: data.weak_concept ? {
      slug: data.weak_concept.slug,
      name: data.weak_concept.name,
      masteryScore: data.weak_concept.mastery_score,
    } : null,
    reason: data.reason,
  };
}

export async function sendAIChat(request: AIChatRequest): Promise<AIChatResponse> {
  const apiRequest = {
    task: request.task,
    problem_slug: request.problemSlug,
    submission_id: request.submissionId,
    code: request.code,
    compiler_error: request.compilerError,
    waveform_id: request.waveformId,
    lesson_slug: request.lessonSlug,
    user_question: request.userQuestion,
    hint_level: request.hintLevel || 1,
    concept_tags: request.conceptTags || [],
  };

  const data = await apiFetch<{
    response: string;
    model: string;
    tokens_used: number;
    conversation_id: number | null;
  }>("/api/ai/chat", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(apiRequest),
  });

  return {
    response: data.response,
    model: data.model,
    tokensUsed: data.tokens_used,
    conversationId: data.conversation_id,
  };
}

export async function sendAIFeedback(request: AIFeedbackRequest) {
  return apiFetch<{ status: string }>("/api/ai/feedback", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({
      message_id: request.messageId,
      rating: request.rating,
      comment: request.comment || "",
      task_type: request.taskType || "",
    }),
  });
}

export async function fetchAIConversations() {
  const data = await apiFetch<{
    conversations: Array<{
      id: number;
      task_type: string;
      problem_id: number | null;
      lesson_id: number | null;
      created_at: string;
    }>;
  }>("/api/ai/conversations", { credentials: "include" });

  return {
    conversations: data.conversations.map((c) => ({
      id: c.id,
      taskType: c.task_type,
      problemId: c.problem_id,
      lessonId: c.lesson_id,
      createdAt: c.created_at,
    })),
  };
}

export async function fetchAIConversation(conversationId: number) {
  const data = await apiFetch<{
    id: number;
    task_type: string;
    messages: Array<{
      id: number;
      role: string;
      content: string;
      created_at: string;
    }>;
  }>(`/api/ai/conversations/${conversationId}`, { credentials: "include" });

  return {
    id: data.id,
    taskType: data.task_type,
    messages: data.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.created_at,
    })),
  };
}

export async function fetchProblemSubmissions(slug: string): Promise<
  import("./types").ProblemSubmission[]
> {
  const supabaseSubs = await supabaseFetchProblemSubmissions(slug);
  if (supabaseSubs) return supabaseSubs;
  const data = await apiFetch<{
    submissions: Array<{
      id: number;
      score: number;
      status: string;
      tests_passed: number;
      tests_total: number;
      execution_time: number;
      language: string;
      code: string;
      created_at: string;
    }>;
  }>(`/api/submissions/problem/${slug}`, { credentials: "include" });

  return data.submissions.map((s) => ({
    id: s.id,
    score: s.score,
    status: s.status,
    testsPassed: s.tests_passed,
    testsTotal: s.tests_total,
    executionTime: s.execution_time,
    language: s.language,
    code: s.code,
    createdAt: s.created_at,
  }));
}

export async function fetchDiscussions(slug: string): Promise<
  import("./types").Discussion[]
> {
  const supabaseDisc = await supabaseFetchDiscussions(slug);
  if (supabaseDisc) return supabaseDisc;
  const data = await apiFetch<{
    discussions: Array<{
      id: number;
      content: string;
      username: string;
      display_name: string | null;
      upvotes: number;
      is_solution: boolean;
      reply_count: number;
      replies: Array<{
        id: number;
        content: string;
        username: string;
        display_name: string | null;
        upvotes: number;
        is_solution: boolean;
        created_at: string;
      }>;
      created_at: string;
    }>;
  }>(`/api/submissions/discussions/${slug}`);

  return data.discussions.map((d) => ({
    id: d.id,
    content: d.content,
    username: d.username,
    displayName: d.display_name,
    upvotes: d.upvotes,
    isSolution: d.is_solution,
    replyCount: d.reply_count,
    replies: d.replies.map((r) => ({
      id: r.id,
      content: r.content,
      username: r.username,
      displayName: r.display_name,
      upvotes: r.upvotes,
      isSolution: r.is_solution,
      createdAt: r.created_at,
    })),
    createdAt: d.created_at,
  }));
}

export async function createDiscussion(
  slug: string,
  content: string,
  parentId?: number
): Promise<{ id: number; content: string }> {
  return apiFetch(`/api/submissions/discussions/${slug}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ content, parent_id: parentId || null }),
  });
}

export async function voteDiscussion(
  discussionId: number,
  vote: number
): Promise<{ upvotes: number }> {
  return apiFetch(`/api/submissions/discussions/${discussionId}/vote`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ vote }),
  });
}

export async function fetchSolutions(
  slug: string
): Promise<CommunitySolution[]> {
  try {
    const data = await apiFetch<{ solutions: CommunitySolution[] }>(
      `/api/submissions/solutions/${slug}`
    );
    return data.solutions || [];
  } catch {
    return [];
  }
}

export async function createSolution(
  slug: string,
  data: {
    title: string;
    content: string;
    code: string;
    language?: string;
    tags?: string[];
  }
): Promise<{ id: number; title: string; message: string }> {
  return apiFetch(`/api/submissions/solutions/${slug}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({
      title: data.title,
      content: data.content,
      code: data.code,
      language: data.language || "SystemVerilog",
      tags: data.tags || [],
    }),
  });
}

export async function voteSolution(
  solutionId: number,
  vote: number
): Promise<{ upvotes: number }> {
  return voteDiscussion(solutionId, vote);
}

export async function fetchDailyChallenge(): Promise<DailyChallenge> {
  try {
    const data = await apiFetch<DailyChallenge>("/api/problems/daily");
    return data;
  } catch {
    // Fallback: select a daily problem deterministically from available problems
    const { problems } = await fetchProblems();
    const today = new Date().toISOString().split("T")[0];
    // Hash the date to pick an index
    const dateNum = today.split("-").reduce((acc, part) => acc + parseInt(part, 10), 0);
    const problem = problems.length > 0
      ? (problems.find((p) => p.slug === "chip-adder-4bit") || problems[dateNum % problems.length])
      : {
          id: "1",
          slug: "chip-adder-4bit",
          title: "4-Bit Ripple Carry Adder Chip",
          difficulty: "easy" as const,
          category: "Chip Design",
          language: "verilog" as const,
          description: "Build a 4-bit addition chip by instantiating modular 1-bit full adder parts.",
          inputDescription: "4-bit inputs A and B, 1-bit Cin",
          outputDescription: "4-bit Sum, 1-bit Cout",
          constraints: [],
          examples: [],
          starterCode: "",
          companyTags: ["Intel", "AMD", "Qualcomm"],
        };

    return {
      date: today,
      problem,
      streak: 4,
      bonusXp: 50,
      solvedToday: false,
      participantsCount: 384,
    };
  }
}

export async function fetchContests(): Promise<Contest[]> {
  try {
    const data = await apiFetch<Contest[]>("/api/contests");
    return data;
  } catch {
    // Return curated LeetCode-style Hardware Contests
    const now = new Date();
    const nextSunday = new Date();
    nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
    nextSunday.setHours(14, 0, 0, 0);

    const pastDate = new Date();
    pastDate.setDate(now.getDate() - 7);

    return [
      {
        id: "hw-weekly-42",
        slug: "weekly-hardware-sprint-42",
        title: "Weekly Hardware Sprint #42",
        edition: 42,
        description:
          "Solve 4 real-world digital VLSI & RTL design challenges under timed conditions. Ranked by simulation accuracy and latency.",
        startTime: nextSunday.toISOString(),
        endTime: new Date(nextSunday.getTime() + 90 * 60000).toISOString(),
        durationMinutes: 90,
        status: "upcoming",
        registered: false,
        registeredCount: 1420,
        sponsor: {
          name: "NVIDIA Microarchitecture Team",
          tagline: "Top 10 finish gets fast-track interview referral for Hardware Engineer roles",
        },
        problems: [
          { id: "p1", slug: "chip-mux-4to1", title: "4:1 Structural Mux Chip", difficulty: "easy", points: 300, solvedCount: 0 },
          { id: "p2", slug: "chip-adder-4bit", title: "4-Bit Carry Lookahead Adder", difficulty: "easy", points: 400, solvedCount: 0 },
          { id: "p3", slug: "sync-fifo", title: "Synchronous Circular FIFO", difficulty: "medium", points: 600, solvedCount: 0 },
          { id: "p4", slug: "4-bit-alu", title: "Pipelined Arithmetic Unit", difficulty: "hard", points: 800, solvedCount: 0 },
        ],
      },
      {
        id: "vlsi-biweekly-18",
        slug: "biweekly-silicon-cup-18",
        title: "Biweekly Silicon Design Cup #18",
        edition: 18,
        description:
          "Advanced microarchitecture and bus protocol contest. Features AMBA APB interfaces, CDC synchronizers, and memory blocks.",
        startTime: new Date(nextSunday.getTime() + 7 * 86400000).toISOString(),
        endTime: new Date(nextSunday.getTime() + 7 * 86400000 + 120 * 60000).toISOString(),
        durationMinutes: 120,
        status: "upcoming",
        registered: true,
        registeredCount: 890,
        sponsor: {
          name: "Qualcomm Snapdragon RTL",
          tagline: "Sponsored contest with cash prizes and direct recruitment consideration",
        },
        problems: [
          { id: "q1", slug: "d-flip-flop", title: "Glitch-free Clock Gate", difficulty: "easy", points: 250, solvedCount: 0 },
          { id: "q2", slug: "4-bit-counter", title: "Gray Code Counter for CDC", difficulty: "medium", points: 500, solvedCount: 0 },
          { id: "q3", slug: "sync-fifo", title: "Asynchronous Dual-Clock FIFO", difficulty: "hard", points: 800, solvedCount: 0 },
          { id: "q4", slug: "4-bit-alu", title: "RISC-V Integer ALU with Barrel Shifter", difficulty: "hard", points: 1000, solvedCount: 0 },
        ],
      },
      {
        id: "hw-weekly-41",
        slug: "weekly-hardware-sprint-41",
        title: "Weekly Hardware Sprint #41",
        edition: 41,
        description:
          "Past contest featuring combinational logic, priority encoders, and sequence detectors.",
        startTime: pastDate.toISOString(),
        endTime: new Date(pastDate.getTime() + 90 * 60000).toISOString(),
        durationMinutes: 90,
        status: "past",
        registered: true,
        registeredCount: 1682,
        sponsor: {
          name: "Apple Silicon Architecture",
          tagline: "Apple Hardware Systems challenge",
        },
        problems: [
          { id: "r1", slug: "2-to-1-mux", title: "2-to-1 Multiplexer", difficulty: "easy", points: 300, solvedCount: 1420 },
          { id: "r2", slug: "half-adder", title: "Half Adder", difficulty: "easy", points: 350, solvedCount: 1380 },
          { id: "r3", slug: "full-adder", title: "Full Adder with Carry", difficulty: "medium", points: 550, solvedCount: 920 },
          { id: "r4", slug: "4-bit-counter", title: "4-bit Synchronous Up-Down Counter", difficulty: "hard", points: 750, solvedCount: 460 },
        ],
      },
    ];
  }
}

