import { Problem } from "./types";

export const problems: Problem[] = [
  {
    id: "1",
    slug: "and-gate",
    title: "AND Gate",
    difficulty: "easy",
    category: "combinational",
    language: "systemverilog",
    description:
      "Implement a 2-input AND gate. The output should be 1 only when both inputs are 1.",
    inputDescription: "a, b — single-bit inputs",
    outputDescription: "y — single-bit output",
    constraints: ["Both inputs are single-bit values"],
    examples: [
      {
        title: "Both inputs high",
        input: "a = 1, b = 1",
        output: "y = 1",
      },
      {
        title: "One input low",
        input: "a = 1, b = 0",
        output: "y = 0",
      },
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
    category: "combinational",
    language: "systemverilog",
    description:
      "Implement a 2-input OR gate. The output should be 1 when at least one input is 1.",
    inputDescription: "a, b — single-bit inputs",
    outputDescription: "y — single-bit output",
    constraints: ["Both inputs are single-bit values"],
    examples: [
      {
        title: "Both inputs low",
        input: "a = 0, b = 0",
        output: "y = 0",
      },
      {
        title: "One input high",
        input: "a = 0, b = 1",
        output: "y = 1",
      },
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
    category: "combinational",
    language: "systemverilog",
    description:
      "Implement a NOT gate (inverter). The output should be the inverse of the input.",
    inputDescription: "a — single-bit input",
    outputDescription: "y — single-bit output",
    constraints: ["Input is a single-bit value"],
    examples: [
      {
        title: "Input high",
        input: "a = 1",
        output: "y = 0",
      },
      {
        title: "Input low",
        input: "a = 0",
        output: "y = 1",
      },
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
    category: "combinational",
    language: "systemverilog",
    description:
      "Implement a 2-input XOR gate. The output should be 1 when the inputs are different.",
    inputDescription: "a, b — single-bit inputs",
    outputDescription: "y — single-bit output",
    constraints: ["Both inputs are single-bit values"],
    examples: [
      {
        title: "Same inputs",
        input: "a = 0, b = 0",
        output: "y = 0",
      },
      {
        title: "Different inputs",
        input: "a = 0, b = 1",
        output: "y = 1",
      },
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
    slug: "multiplexer-2-1",
    title: "2:1 Multiplexer",
    difficulty: "easy",
    category: "combinational",
    language: "systemverilog",
    description:
      "Implement a 2-to-1 multiplexer. When sel is 0, output a; when sel is 1, output b.",
    inputDescription: "a, b — single-bit inputs, sel — select signal",
    outputDescription: "y — single-bit output",
    constraints: ["All inputs are single-bit values"],
    examples: [
      {
        title: "Select a",
        input: "a = 1, b = 0, sel = 0",
        output: "y = 1",
      },
      {
        title: "Select b",
        input: "a = 1, b = 0, sel = 1",
        output: "y = 0",
      },
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
    category: "arithmetic",
    language: "systemverilog",
    description:
      "Implement a half adder that adds two single-bit inputs producing sum and carry outputs.",
    inputDescription: "a, b — single-bit inputs",
    outputDescription: "sum, carry — single-bit outputs",
    constraints: ["Both inputs are single-bit values"],
    examples: [
      {
        title: "0 + 0",
        input: "a = 0, b = 0",
        output: "sum = 0, carry = 0",
      },
      {
        title: "1 + 1",
        input: "a = 1, b = 1",
        output: "sum = 0, carry = 1",
      },
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
    category: "arithmetic",
    language: "systemverilog",
    description:
      "Implement a full adder that adds two single-bit inputs plus a carry-in, producing sum and carry-out.",
    inputDescription: "a, b — single-bit inputs, cin — carry-in",
    outputDescription: "sum, cout — single-bit outputs",
    constraints: ["All inputs are single-bit values"],
    examples: [
      {
        title: "1 + 1 + 0",
        input: "a = 1, b = 1, cin = 0",
        output: "sum = 0, cout = 1",
      },
      {
        title: "1 + 1 + 1",
        input: "a = 1, b = 1, cin = 1",
        output: "sum = 1, cout = 1",
      },
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
    category: "sequential",
    language: "systemverilog",
    description:
      "Implement a positive-edge-triggered D flip-flop. On the rising edge of clk, the output q captures the input d.",
    inputDescription: "clk — clock signal, d — data input, rst — synchronous reset",
    outputDescription: "q — registered output",
    constraints: ["Reset is active high and synchronous"],
    examples: [
      {
        title: "Reset",
        input: "rst = 1",
        output: "q = 0",
      },
      {
        title: "Capture",
        input: "rst = 0, d = 1 (posedge clk)",
        output: "q = 1",
      },
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
    slug: "counter-4bit",
    title: "4-bit Counter",
    difficulty: "medium",
    category: "sequential",
    language: "systemverilog",
    description:
      "Design a synchronous 4-bit counter. The counter should reset to 0 when rst is asserted, increment on every rising edge of clk, and wrap from 15 back to 0.",
    inputDescription: "clk — clock signal, rst — synchronous active-high reset",
    outputDescription: "count[3:0] — 4-bit counter output",
    constraints: [
      "Reset is synchronous and active high",
      "Counter wraps from 15 to 0",
    ],
    examples: [
      {
        title: "Reset",
        input: "rst = 1",
        output: "count = 4'b0000",
      },
      {
        title: "Counting",
        input: "rst = 0, 4 clock edges",
        output: "count = 4'b0100",
      },
      {
        title: "Overflow",
        input: "count = 4'b1111, 1 clock edge",
        output: "count = 4'b0000",
      },
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
    slug: "alu-4bit",
    title: "ALU",
    difficulty: "medium",
    category: "arithmetic",
    language: "systemverilog",
    description:
      "Design a simple 4-bit arithmetic logic unit. The ALU should support addition, subtraction, AND, and OR operations based on a 2-bit opcode.",
    inputDescription:
      "a[3:0], b[3:0] — operands, op[1:0] — opcode (00=ADD, 01=SUB, 10=AND, 11=OR)",
    outputDescription: "result[3:0] — operation result",
    constraints: ["All operands are 4-bit values"],
    examples: [
      {
        title: "Addition",
        input: "a = 4'b0011, b = 4'b0001, op = 2'b00",
        output: "result = 4'b0100",
      },
      {
        title: "Subtraction",
        input: "a = 4'b0101, b = 4'b0010, op = 2'b01",
        output: "result = 4'b0011",
      },
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
    slug: "async-fifo",
    title: "Asynchronous FIFO",
    difficulty: "hard",
    category: "memory",
    language: "systemverilog",
    description:
      "Design an asynchronous FIFO with separate read and write clock domains using Gray code pointers for safe clock domain crossing.",
    inputDescription:
      "wclk, rclk — write and read clocks, wrst_n, rrst_n — active-low resets, wdata — write data, wren — write enable, rden — read enable",
    outputDescription: "rdata — read data, full, empty — status flags",
    constraints: [
      "Must handle asynchronous clock domains",
      "Gray code pointer synchronization required",
    ],
    examples: [
      {
        title: "Write and read",
        input: "Write 0x5 to FIFO, then read",
        output: "rdata = 0x5, empty = 1 after read",
      },
    ],
    starterCode: `// Future problem - not yet available
module async_fifo #(
  parameter DATA_WIDTH = 8,
  parameter ADDR_WIDTH = 4
) (
  // This problem is not yet available
endmodule`,
    locked: true,
  },
  {
    id: "12",
    slug: "cache-controller",
    title: "Cache Controller",
    difficulty: "hard",
    category: "protocols",
    language: "systemverilog",
    description:
      "Design a simple direct-mapped cache controller with write-back policy and LRU replacement for a basic memory hierarchy.",
    inputDescription:
      "clk, rst — clock and reset, addr — memory address, wdata — write data, mem_read, mem_write — control signals",
    outputDescription:
      "rdata — read data, hit, miss — status signals",
    constraints: [
      "Direct-mapped cache",
      "Write-back with write-allocate",
      "4-byte cache lines",
    ],
    examples: [
      {
        title: "Cache miss on first access",
        input: "addr = 0x0000, mem_read = 1",
        output: "miss = 1, then data returned on next cycle",
      },
    ],
    starterCode: `// Future problem - not yet available
module cache_controller (
  // This problem is not yet available
endmodule`,
    locked: true,
  },
  {
    id: "13",
    slug: "axi-arbiter",
    title: "AXI Arbiter",
    difficulty: "hard",
    category: "protocols",
    language: "systemverilog",
    description:
      "Design an AXI4 bus arbiter that arbitrates between multiple master interfaces and routes transactions to a single slave port.",
    inputDescription: "Multiple AXI master interfaces",
    outputDescription: "Single AXI slave interface, arbitration signals",
    constraints: [
      "AXI4 specification compliance",
      "Support at least 4 masters",
      "Round-robin or priority-based arbitration",
    ],
    examples: [
      {
        title: "Single request",
        input: "Master 0 issues read request",
        output: "Master 0 granted, transaction forwarded to slave",
      },
    ],
    starterCode: `// Future problem - not yet available
module axi_arbiter (
  // This problem is not yet available
endmodule`,
    locked: true,
  },
  {
    id: "14",
    slug: "priority-encoder-8to3",
    title: "8-to-3 Priority Encoder",
    difficulty: "easy",
    category: "Combinational Logic",
    language: "systemverilog",
    companyTags: ["NVIDIA", "Intel"],
    description:
      "Implement an 8-to-3 priority encoder. Given an 8-bit input, output the binary index of the highest-priority (most significant) active bit and a valid flag.\n\n**Behavior:**\n- `out` = index of the most significant bit that is 1 (bit 7 has highest priority).\n- `valid` = 1 if any input bit is 1, otherwise 0.\n- When `valid` = 0, `out` can be any value.\n\n**Example:**\n- `in` = 8'b00101100 → `out` = 3'd5, `valid` = 1 (bit 5 is highest)\n- `in` = 8'b00000000 → `valid` = 0",
    inputDescription: "in[7:0] — 8-bit input value",
    outputDescription:
      "out[2:0] — index of highest active bit, valid — active-high valid flag",
    constraints: [
      "Priority is from MSB (bit 7) to LSB (bit 0)",
      "Output is combinational",
    ],
    examples: [
      {
        title: "Active bit 5",
        input: "in = 8'b00101100",
        output: "out = 3'd5, valid = 1",
      },
      {
        title: "All zeros",
        input: "in = 8'b00000000",
        output: "valid = 0",
      },
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
    description:
      "Implement a bidirectional converter between binary and Gray code. When mode=0, convert binary to Gray code. When mode=1, convert Gray code to binary.\n\n**Behavior:**\n- When `mode` = 0: convert 4-bit binary input to Gray code.\n  - Formula: `gray = binary ^ (binary >> 1)`\n- When `mode` = 1: convert 4-bit Gray code input to binary.\n  - `binary[3] = gray[3]`, `binary[i] = binary[i+1] ^ gray[i]` for i = 2,1,0\n\n**Example:**\n- Binary 4'b1010 → Gray 4'b1111 (mode=0)\n- Gray 4'b1111 → Binary 4'b1010 (mode=1)",
    inputDescription:
      "in[3:0] — 4-bit input, mode — 0=binary-to-gray, 1=gray-to-binary",
    outputDescription: "out[3:0] — 4-bit converted output",
    constraints: [
      "All conversions are combinational",
      "4-bit width",
    ],
    examples: [
      {
        title: "Binary to Gray",
        input: "in = 4'b1010, mode = 0",
        output: "out = 4'b1111",
      },
      {
        title: "Gray to Binary",
        input: "in = 4'b1111, mode = 1",
        output: "out = 4'b1010",
      },
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
    description:
      "Count the number of leading zeros in an 8-bit input value. Also output an all_zeros flag when the input is 0.\n\n**Behavior:**\n- `count` = number of leading (most-significant) zero bits before the first 1.\n- `all_zeros` = 1 if input is 8'b00000000 (count would be 8).\n\n**Example:**\n- `in` = 8'b00101000 → `count` = 2, `all_zeros` = 0\n- `in` = 8'b10000000 → `count` = 0, `all_zeros` = 0\n- `in` = 8'b00000000 → `count` = 8, `all_zeros` = 1",
    inputDescription: "in[7:0] — 8-bit input value",
    outputDescription:
      "count[3:0] — number of leading zeros (0-8), all_zeros — high when input is zero",
    constraints: [
      "Output is combinational",
      "count ranges from 0 to 8",
    ],
    examples: [
      {
        title: "Leading zeros",
        input: "in = 8'b00101000",
        output: "count = 4'd2, all_zeros = 0",
      },
      {
        title: "All zeros",
        input: "in = 8'b00000000",
        output: "count = 4'd8, all_zeros = 1",
      },
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
    description:
      "Implement a 4-bit adder/subtractor. When sub=0, compute a+b. When sub=1, compute a-b using 2's complement. Report carry_out and signed overflow.\n\n**Behavior:**\n- When `sub` = 0: compute `result = a + b`.\n- When `sub` = 1: compute `result = a - b` (using 2's complement: invert b and add 1).\n- `carry_out`: the carry out of the MSB addition.\n- `overflow`: signed overflow = carry into MSB XOR carry out of MSB.\n\n**Example:**\n- a=4'd3, b=4'd2, sub=0 → result=4'd5, carry_out=0, overflow=0\n- a=4'd7, b=4'd1, sub=0 → result=4'd8, carry_out=0, overflow=1 (signed overflow: 7+1 overflows in 4-bit signed)\n- a=4'd5, b=4'd3, sub=1 → result=4'd2, carry_out=1, overflow=0",
    inputDescription:
      "a[3:0], b[3:0] — 4-bit operands, sub — 0=add, 1=subtract",
    outputDescription:
      "result[3:0] — operation result, carry_out — carry flag, overflow — signed overflow flag",
    constraints: [
      "All operands are 4-bit values",
      "Subtraction uses 2's complement",
    ],
    examples: [
      {
        title: "Addition without overflow",
        input: "a = 4'd3, b = 4'd2, sub = 0",
        output: "result = 4'd5, carry_out = 0, overflow = 0",
      },
      {
        title: "Subtraction",
        input: "a = 4'd5, b = 4'd3, sub = 1",
        output: "result = 4'd2, carry_out = 1, overflow = 0",
      },
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
    description:
      "Detect rising edges, falling edges, and any edge on a signal input. Output one-cycle pulse for each type.\n\n**Behavior:**\n- `pos_edge`: 1-cycle pulse on rising edge of `signal_in` (0→1).\n- `neg_edge`: 1-cycle pulse on falling edge of `signal_in` (1→0).\n- `any_edge`: 1-cycle pulse on any transition.\n- All outputs reset to 0 when `rst` is asserted (synchronous, active-high).\n\n**Example:**\n- signal_in: 0→1 → pos_edge=1, neg_edge=0, any_edge=1\n- signal_in: 1→0 → pos_edge=0, neg_edge=1, any_edge=1\n- signal_in: 1→1 → pos_edge=0, neg_edge=0, any_edge=0",
    inputDescription:
      "clk — clock, rst — synchronous reset, signal_in — input signal",
    outputDescription:
      "pos_edge — rising edge pulse, neg_edge — falling edge pulse, any_edge — any edge pulse",
    constraints: [
      "Synchronous active-high reset",
      "Edge detection uses a 1-cycle delayed version of signal_in",
    ],
    examples: [
      {
        title: "Rising edge detection",
        input: "signal_in: 0 -> 1",
        output: "pos_edge = 1, neg_edge = 0, any_edge = 1",
      },
      {
        title: "Falling edge detection",
        input: "signal_in: 1 -> 0",
        output: "pos_edge = 0, neg_edge = 1, any_edge = 1",
      },
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
    description:
      "Implement an 8-bit Fibonacci Linear Feedback Shift Register with taps at positions 8, 6, 5, and 4 (polynomial x^8+x^6+x^5+x^4+1). Include an enable signal.\n\n**Behavior:**\n- Polynomial: x^8 + x^6 + x^5 + x^4 + 1 (taps at bits 7, 5, 4, 3).\n- Feedback bit = XNOR of taps (to avoid all-zeros lockup).\n- On reset, load seed value 8'b00000001.\n- Shift right each cycle when `enable` is high, inserting feedback at MSB.\n\n**Example sequence (first 5 values):**\n- After reset: 8'h01\n- Cycle 1: 8'h80 (feedback=1, shifted right)\n- Cycle 2: 8'hC0",
    inputDescription:
      "clk — clock, rst — synchronous reset, enable — shift enable",
    outputDescription: "lfsr_out[7:0] — current LFSR state",
    constraints: [
      "Reset loads 8'h01",
      "Polynomial taps at bits 7, 5, 4, 3",
      "Use XNOR feedback",
    ],
    examples: [
      {
        title: "Reset state",
        input: "rst = 1",
        output: "lfsr_out = 8'h01",
      },
      {
        title: "First shift",
        input: "enable = 1 (1 cycle)",
        output: "lfsr_out = 8'h80",
      },
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
    description:
      "Design a Moore FSM traffic light controller. Cycle through GREEN→YELLOW→RED states. GREEN lasts while sensor is active, YELLOW lasts 3 cycles, RED lasts 5 cycles then transitions to GREEN.\n\n**State Machine:**\n- **GREEN**: `green`=1, `yellow`=0, `red`=0. Stays in GREEN while `sensor`=1. Transitions to YELLOW when `sensor`=0.\n- **YELLOW**: `green`=0, `yellow`=1, `red`=0. Stays for 3 clock cycles, then transitions to RED.\n- **RED**: `green`=0, `yellow`=0, `red`=1. Stays for 5 clock cycles, then transitions to GREEN.\n- On reset, start in GREEN state.\n\n**Example:**\n- After reset → green=1, yellow=0, red=0\n- sensor goes low → transition to YELLOW for 3 cycles\n- After YELLOW → RED for 5 cycles → back to GREEN",
    inputDescription:
      "clk — clock, rst — synchronous reset (active high), sensor — vehicle sensor",
    outputDescription:
      "green, yellow, red — one-hot traffic light outputs",
    constraints: [
      "Moore FSM",
      "GREEN exits when sensor=0",
      "YELLOW lasts 3 cycles",
      "RED lasts 5 cycles",
      "Synchronous active-high reset starts in GREEN",
    ],
    examples: [
      {
        title: "Reset state",
        input: "rst = 1, sensor = 1",
        output: "green = 1, yellow = 0, red = 0",
      },
      {
        title: "Sensor low transition",
        input: "sensor = 0 (1 clock cycle)",
        output: "green = 0, yellow = 1, red = 0",
      },
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
    description:
      "Convert an 8-bit binary number (0-255) to BCD using the Double Dabble (shift-and-add-3) algorithm. Output hundreds, tens, and ones digits.\n\n**Algorithm (Double Dabble / Shift-and-Add-3):**\n1. Initialize a 20-bit shift register: {hundreds[3:0], tens[3:0], ones[3:0], binary_in[7:0]}.\n2. Repeat 8 times:\n   a. If any BCD digit >= 5, add 3 to that digit.\n   b. Left-shift the entire register by 1.\n3. The upper 12 bits now hold the BCD digits.\n\n**Example:**\n- binary_in = 8'd255 → hundreds=4'd2, tens=4'd5, ones=4'd5\n- binary_in = 8'd99  → hundreds=4'd0, tens=4'd9, ones=4'd9\n- binary_in = 8'd0   → hundreds=4'd0, tens=4'd0, ones=4'd0",
    inputDescription:
      "binary_in[7:0] — unsigned 8-bit binary number (0-255)",
    outputDescription:
      "hundreds[3:0], tens[3:0], ones[3:0] — BCD digits",
    constraints: [
      "Must be purely combinational",
      "Input range 0-255",
    ],
    examples: [
      {
        title: "Convert 255",
        input: "binary_in = 8'd255",
        output: "hundreds = 4'd2, tens = 4'd5, ones = 4'd5",
      },
      {
        title: "Convert 99",
        input: "binary_in = 8'd99",
        output: "hundreds = 4'd0, tens = 4'd9, ones = 4'd9",
      },
      {
        title: "Convert 0",
        input: "binary_in = 8'd0",
        output: "hundreds = 4'd0, tens = 4'd0, ones = 4'd0",
      },
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

export function getProblemBySlug(slug: string): Problem | undefined {
  return problems.find((p) => p.slug === slug);
}

export function getProblemsByDifficulty(
  difficulty: string
): Problem[] {
  return problems.filter((p) => p.difficulty === difficulty);
}

export function getProblemsByCategory(
  category: string
): Problem[] {
  return problems.filter((p) => p.category === category);
}
