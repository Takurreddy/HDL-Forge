"""
Seed script for 8 new hardware interview problems.

Adds problems to the database idempotently (skips if slug already exists).
Each problem has PUBLIC and HIDDEN test cases with self-checking testbenches.
"""

import logging
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import Difficulty, Language, Problem, TestCase, TestVisibility

logger = logging.getLogger(__name__)

# ============================================================================
# PROBLEM DEFINITIONS
# ============================================================================

NEW_PROBLEMS = [
    # -----------------------------------------------------------------------
    # 1. Priority Encoder 8-to-3
    # -----------------------------------------------------------------------
    {
        "slug": "priority-encoder-8to3",
        "title": "8-to-3 Priority Encoder",
        "difficulty": Difficulty.EASY,
        "category": "Combinational Logic",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "NVIDIA, Intel",
        "description": (
            "Implement an 8-to-3 priority encoder. Given an 8-bit input, output the "
            "binary index of the highest-priority (most significant) active bit and a "
            "valid flag.\n\n"
            "**Behavior:**\n"
            "- `out` = index of the most significant bit that is 1 (bit 7 has highest priority).\n"
            "- `valid` = 1 if any input bit is 1, otherwise 0.\n"
            "- When `valid` = 0, `out` can be any value.\n\n"
            "**Example:**\n"
            "- `in` = 8'b00101100 ΓåÆ `out` = 3'd5, `valid` = 1 (bit 5 is highest)\n"
            "- `in` = 8'b00000000 ΓåÆ `valid` = 0"
        ),
        "input_description": "in[7:0] ΓÇö 8-bit input value",
        "output_description": "out[2:0] ΓÇö index of highest active bit, valid ΓÇö active-high valid flag",
        "constraints": "Priority is from MSB (bit 7) to LSB (bit 0). Output is combinational.",
        "starter_code": (
            "module priority_encoder (\n"
            "  input  logic [7:0] in,\n"
            "  output logic [2:0] out,\n"
            "  output logic       valid\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module priority_encoder (\n"
            "  input  logic [7:0] in,\n"
            "  output logic [2:0] out,\n"
            "  output logic       valid\n"
            ");\n"
            "  assign valid = |in;\n"
            "  always_comb begin\n"
            "    casez (in)\n"
            "      8'b1???????: out = 3'd7;\n"
            "      8'b01??????: out = 3'd6;\n"
            "      8'b001?????: out = 3'd5;\n"
            "      8'b0001????: out = 3'd4;\n"
            "      8'b00001???: out = 3'd3;\n"
            "      8'b000001??: out = 3'd2;\n"
            "      8'b0000001?: out = 3'd1;\n"
            "      8'b00000001: out = 3'd0;\n"
            "      default:     out = 3'd0;\n"
            "    endcase\n"
            "  end\n"
            "endmodule"
        ),
    },
    # -----------------------------------------------------------------------
    # 2. Binary & Gray Code Converter
    # -----------------------------------------------------------------------
    {
        "slug": "gray-code-converter",
        "title": "Binary & Gray Code Converter",
        "difficulty": Difficulty.EASY,
        "category": "Arithmetic",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Apple, Qualcomm, Broadcom",
        "description": (
            "Implement a bidirectional converter between binary and Gray code.\n\n"
            "**Behavior:**\n"
            "- When `mode` = 0: convert 4-bit binary input to Gray code.\n"
            "  - Formula: `gray = binary ^ (binary >> 1)`\n"
            "- When `mode` = 1: convert 4-bit Gray code input to binary.\n"
            "  - `binary[3] = gray[3]`, `binary[i] = binary[i+1] ^ gray[i]` for i = 2,1,0\n\n"
            "**Example:**\n"
            "- Binary 4'b1010 ΓåÆ Gray 4'b1111 (mode=0)\n"
            "- Gray 4'b1111 ΓåÆ Binary 4'b1010 (mode=1)"
        ),
        "input_description": "in[3:0] ΓÇö 4-bit input, mode ΓÇö 0=binary-to-gray, 1=gray-to-binary",
        "output_description": "out[3:0] ΓÇö 4-bit converted output",
        "constraints": "All conversions are combinational. 4-bit width.",
        "starter_code": (
            "module gray_code_converter (\n"
            "  input  logic [3:0] in,\n"
            "  input  logic       mode,\n"
            "  output logic [3:0] out\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module gray_code_converter (\n"
            "  input  logic [3:0] in,\n"
            "  input  logic       mode,\n"
            "  output logic [3:0] out\n"
            ");\n"
            "  logic [3:0] bin2gray, gray2bin;\n"
            "  assign bin2gray = in ^ (in >> 1);\n"
            "  assign gray2bin[3] = in[3];\n"
            "  assign gray2bin[2] = gray2bin[3] ^ in[2];\n"
            "  assign gray2bin[1] = gray2bin[2] ^ in[1];\n"
            "  assign gray2bin[0] = gray2bin[1] ^ in[0];\n"
            "  assign out = mode ? gray2bin : bin2gray;\n"
            "endmodule"
        ),
    },
    # -----------------------------------------------------------------------
    # 3. Leading Zero Counter (8-bit)
    # -----------------------------------------------------------------------
    {
        "slug": "leading-zero-counter",
        "title": "Leading Zero Counter (8-bit)",
        "difficulty": Difficulty.MEDIUM,
        "category": "Arithmetic",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "ARM, AMD, Google Silicon",
        "description": (
            "Count the number of leading zeros in an 8-bit input.\n\n"
            "**Behavior:**\n"
            "- `count` = number of leading (most-significant) zero bits before the first 1.\n"
            "- `all_zeros` = 1 if input is 8'b00000000 (count would be 8).\n\n"
            "**Example:**\n"
            "- `in` = 8'b00101000 ΓåÆ `count` = 2, `all_zeros` = 0\n"
            "- `in` = 8'b10000000 ΓåÆ `count` = 0, `all_zeros` = 0\n"
            "- `in` = 8'b00000000 ΓåÆ `count` = 8, `all_zeros` = 1"
        ),
        "input_description": "in[7:0] ΓÇö 8-bit input value",
        "output_description": "count[3:0] ΓÇö number of leading zeros (0-8), all_zeros ΓÇö high when input is zero",
        "constraints": "Output is combinational. count ranges from 0 to 8.",
        "starter_code": (
            "module leading_zero_counter (\n"
            "  input  logic [7:0] in,\n"
            "  output logic [3:0] count,\n"
            "  output logic       all_zeros\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module leading_zero_counter (\n"
            "  input  logic [7:0] in,\n"
            "  output logic [3:0] count,\n"
            "  output logic       all_zeros\n"
            ");\n"
            "  assign all_zeros = (in == 8'd0);\n"
            "  always_comb begin\n"
            "    casez (in)\n"
            "      8'b1???????: count = 4'd0;\n"
            "      8'b01??????: count = 4'd1;\n"
            "      8'b001?????: count = 4'd2;\n"
            "      8'b0001????: count = 4'd3;\n"
            "      8'b00001???: count = 4'd4;\n"
            "      8'b000001??: count = 4'd5;\n"
            "      8'b0000001?: count = 4'd6;\n"
            "      8'b00000001: count = 4'd7;\n"
            "      default:     count = 4'd8;\n"
            "    endcase\n"
            "  end\n"
            "endmodule"
        ),
    },
    # -----------------------------------------------------------------------
    # 4. 4-Bit Adder-Subtractor with Overflow
    # -----------------------------------------------------------------------
    {
        "slug": "adder-subtractor-4bit",
        "title": "4-Bit Adder-Subtractor with Overflow",
        "difficulty": Difficulty.MEDIUM,
        "category": "Arithmetic",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Intel, Texas Instruments",
        "description": (
            "Implement a 4-bit adder/subtractor with signed overflow detection.\n\n"
            "**Behavior:**\n"
            "- When `sub` = 0: compute `result = a + b`.\n"
            "- When `sub` = 1: compute `result = a - b` (using 2's complement: invert b and add 1).\n"
            "- `carry_out`: the carry out of the MSB addition.\n"
            "- `overflow`: signed overflow = carry into MSB XOR carry out of MSB.\n\n"
            "**Example:**\n"
            "- a=4'd3, b=4'd2, sub=0 ΓåÆ result=4'd5, carry_out=0, overflow=0\n"
            "- a=4'd7, b=4'd1, sub=0 ΓåÆ result=4'd8, carry_out=0, overflow=1 (signed overflow: 7+1 overflows in 4-bit signed)\n"
            "- a=4'd5, b=4'd3, sub=1 ΓåÆ result=4'd2, carry_out=1, overflow=0"
        ),
        "input_description": "a[3:0], b[3:0] ΓÇö 4-bit operands, sub ΓÇö 0=add, 1=subtract",
        "output_description": "result[3:0] ΓÇö operation result, carry_out ΓÇö carry flag, overflow ΓÇö signed overflow flag",
        "constraints": "All operands are 4-bit values. Subtraction uses 2's complement.",
        "starter_code": (
            "module adder_subtractor (\n"
            "  input  logic [3:0] a,\n"
            "  input  logic [3:0] b,\n"
            "  input  logic       sub,\n"
            "  output logic [3:0] result,\n"
            "  output logic       carry_out,\n"
            "  output logic       overflow\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module adder_subtractor (\n"
            "  input  logic [3:0] a,\n"
            "  input  logic [3:0] b,\n"
            "  input  logic       sub,\n"
            "  output logic [3:0] result,\n"
            "  output logic       carry_out,\n"
            "  output logic       overflow\n"
            ");\n"
            "  logic [3:0] b_eff;\n"
            "  logic [4:0] sum;\n"
            "  logic       c_in_msb;\n"
            "  assign b_eff = b ^ {4{sub}};\n"
            "  assign sum = a + b_eff + sub;\n"
            "  assign result = sum[3:0];\n"
            "  assign carry_out = sum[4];\n"
            "  // Overflow: carry into MSB != carry out of MSB\n"
            "  assign c_in_msb = a[2] ^ b_eff[2] ^ result[2] ^ a[3] ^ b_eff[3] ^ result[3] ^ carry_out;\n"
            "  // Simpler: overflow when sign of operands same but result differs\n"
            "  // For add: overflow = ~a[3] & ~b_eff[3] & result[3] | a[3] & b_eff[3] & ~result[3]\n"
            "  assign overflow = (a[3] == b_eff[3]) && (result[3] != a[3]);\n"
            "endmodule"
        ),
    },
    # -----------------------------------------------------------------------
    # 5. Multi-Edge Detector
    # -----------------------------------------------------------------------
    {
        "slug": "edge-detector",
        "title": "Multi-Edge Detector",
        "difficulty": Difficulty.EASY,
        "category": "Sequential Logic",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Qualcomm, Apple, NVIDIA",
        "description": (
            "Detect rising edges, falling edges, and any edge on a signal.\n\n"
            "**Behavior:**\n"
            "- `pos_edge`: 1-cycle pulse on rising edge of `signal_in` (0ΓåÆ1).\n"
            "- `neg_edge`: 1-cycle pulse on falling edge of `signal_in` (1ΓåÆ0).\n"
            "- `any_edge`: 1-cycle pulse on any transition.\n"
            "- All outputs reset to 0 when `rst` is asserted (synchronous, active-high).\n\n"
            "**Example:**\n"
            "- signal_in: 0ΓåÆ1 ΓåÆ pos_edge=1, neg_edge=0, any_edge=1\n"
            "- signal_in: 1ΓåÆ0 ΓåÆ pos_edge=0, neg_edge=1, any_edge=1\n"
            "- signal_in: 1ΓåÆ1 ΓåÆ pos_edge=0, neg_edge=0, any_edge=0"
        ),
        "input_description": "clk ΓÇö clock, rst ΓÇö synchronous reset, signal_in ΓÇö input signal",
        "output_description": "pos_edge ΓÇö rising edge pulse, neg_edge ΓÇö falling edge pulse, any_edge ΓÇö any edge pulse",
        "constraints": "Synchronous active-high reset. Edge detection uses a 1-cycle delayed version of signal_in.",
        "starter_code": (
            "module edge_detector (\n"
            "  input  logic clk,\n"
            "  input  logic rst,\n"
            "  input  logic signal_in,\n"
            "  output logic pos_edge,\n"
            "  output logic neg_edge,\n"
            "  output logic any_edge\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module edge_detector (\n"
            "  input  logic clk,\n"
            "  input  logic rst,\n"
            "  input  logic signal_in,\n"
            "  output logic pos_edge,\n"
            "  output logic neg_edge,\n"
            "  output logic any_edge\n"
            ");\n"
            "  logic signal_delayed;\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (rst)\n"
            "      signal_delayed <= 1'b0;\n"
            "    else\n"
            "      signal_delayed <= signal_in;\n"
            "  end\n"
            "  assign pos_edge = signal_in & ~signal_delayed;\n"
            "  assign neg_edge = ~signal_in & signal_delayed;\n"
            "  assign any_edge = signal_in ^ signal_delayed;\n"
            "endmodule"
        ),
    },
    # -----------------------------------------------------------------------
    # 6. 8-Bit Fibonacci LFSR
    # -----------------------------------------------------------------------
    {
        "slug": "lfsr-8bit",
        "title": "8-Bit Fibonacci LFSR",
        "difficulty": Difficulty.MEDIUM,
        "category": "Sequential Logic",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "AMD, Qualcomm, NVIDIA",
        "description": (
            "Implement an 8-bit Fibonacci Linear Feedback Shift Register.\n\n"
            "**Behavior:**\n"
            "- Polynomial: x^8 + x^6 + x^5 + x^4 + 1 (taps at bits 7, 5, 4, 3).\n"
            "- Feedback bit = XNOR of taps (to avoid all-zeros lockup).\n"
            "- On reset, load seed value 8'b00000001.\n"
            "- Shift right each cycle when `enable` is high, inserting feedback at MSB.\n\n"
            "**Example sequence (first 5 values):**\n"
            "- After reset: 8'h01\n"
            "- Cycle 1: 8'h80 (feedback=1, shifted right)\n"
            "- Cycle 2: 8'hC0\n"
            "- ..."
        ),
        "input_description": "clk ΓÇö clock, rst ΓÇö synchronous reset, enable ΓÇö shift enable",
        "output_description": "lfsr_out[7:0] ΓÇö current LFSR state",
        "constraints": "Reset loads 8'h01. Polynomial taps at bits 7,5,4,3. Use XNOR feedback.",
        "starter_code": (
            "module lfsr_8bit (\n"
            "  input  logic       clk,\n"
            "  input  logic       rst,\n"
            "  input  logic       enable,\n"
            "  output logic [7:0] lfsr_out\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module lfsr_8bit (\n"
            "  input  logic       clk,\n"
            "  input  logic       rst,\n"
            "  input  logic       enable,\n"
            "  output logic [7:0] lfsr_out\n"
            ");\n"
            "  logic feedback;\n"
            "  // XNOR taps at bits 7, 5, 4, 3\n"
            "  assign feedback = ~(lfsr_out[7] ^ lfsr_out[5] ^ lfsr_out[4] ^ lfsr_out[3]);\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (rst)\n"
            "      lfsr_out <= 8'h01;\n"
            "    else if (enable)\n"
            "      lfsr_out <= {feedback, lfsr_out[7:1]};\n"
            "  end\n"
            "endmodule"
        ),
    },
    # -----------------------------------------------------------------------
    # 7. Traffic Light Controller FSM
    # -----------------------------------------------------------------------
    {
        "slug": "traffic-light-fsm",
        "title": "Traffic Light Controller FSM",
        "difficulty": Difficulty.MEDIUM,
        "category": "Finite State Machines",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Intel, Texas Instruments",
        "description": (
            "Design a Moore FSM traffic light controller.\n\n"
            "**State Machine:**\n"
            "- **GREEN**: `green`=1, `yellow`=0, `red`=0. Stays in GREEN while `sensor`=1. Transitions to YELLOW when `sensor`=0.\n"
            "- **YELLOW**: `green`=0, `yellow`=1, `red`=0. Stays for 3 clock cycles, then transitions to RED.\n"
            "- **RED**: `green`=0, `yellow`=0, `red`=1. Stays for 5 clock cycles, then transitions to GREEN.\n"
            "- On reset, start in GREEN state.\n\n"
            "**Example:**\n"
            "- After reset ΓåÆ green=1, yellow=0, red=0\n"
            "- sensor goes low ΓåÆ transition to YELLOW for 3 cycles\n"
            "- After YELLOW ΓåÆ RED for 5 cycles ΓåÆ back to GREEN"
        ),
        "input_description": "clk ΓÇö clock, rst ΓÇö synchronous reset (active high), sensor ΓÇö vehicle sensor",
        "output_description": "green, yellow, red ΓÇö one-hot traffic light outputs",
        "constraints": "Moore FSM. GREEN exits when sensor=0. YELLOW lasts 3 cycles. RED lasts 5 cycles. Synchronous active-high reset starts in GREEN.",
        "starter_code": (
            "module traffic_light_fsm (\n"
            "  input  logic       clk,\n"
            "  input  logic       rst,\n"
            "  input  logic       sensor,\n"
            "  output logic       green,\n"
            "  output logic       yellow,\n"
            "  output logic       red\n"
            ");\n\n"
            "  // Define states and implement FSM\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module traffic_light_fsm (\n"
            "  input  logic       clk,\n"
            "  input  logic       rst,\n"
            "  input  logic       sensor,\n"
            "  output logic       green,\n"
            "  output logic       yellow,\n"
            "  output logic       red\n"
            ");\n"
            "  typedef enum logic [1:0] {S_GREEN, S_YELLOW, S_RED} state_t;\n"
            "  state_t state;\n"
            "  logic [2:0] timer;\n\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (rst) begin\n"
            "      state <= S_GREEN;\n"
            "      timer <= 3'd0;\n"
            "    end else begin\n"
            "      case (state)\n"
            "        S_GREEN: begin\n"
            "          if (!sensor) begin\n"
            "            state <= S_YELLOW;\n"
            "            timer <= 3'd0;\n"
            "          end\n"
            "        end\n"
            "        S_YELLOW: begin\n"
            "          if (timer == 3'd2) begin\n"
            "            state <= S_RED;\n"
            "            timer <= 3'd0;\n"
            "          end else\n"
            "            timer <= timer + 3'd1;\n"
            "        end\n"
            "        S_RED: begin\n"
            "          if (timer == 3'd4) begin\n"
            "            state <= S_GREEN;\n"
            "            timer <= 3'd0;\n"
            "          end else\n"
            "            timer <= timer + 3'd1;\n"
            "        end\n"
            "        default: state <= S_GREEN;\n"
            "      endcase\n"
            "    end\n"
            "  end\n\n"
            "  assign green  = (state == S_GREEN);\n"
            "  assign yellow = (state == S_YELLOW);\n"
            "  assign red    = (state == S_RED);\n"
            "endmodule"
        ),
    },
    # -----------------------------------------------------------------------
    # 8. Binary to BCD Converter (Double Dabble)
    # -----------------------------------------------------------------------
    {
        "slug": "binary-to-bcd",
        "title": "Binary to BCD Converter (Double Dabble)",
        "difficulty": Difficulty.HARD,
        "category": "Arithmetic",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Apple, Google Silicon, Intel",
        "description": (
            "Convert an 8-bit binary number (0ΓÇô255) to Binary-Coded Decimal (BCD).\n\n"
            "**Algorithm (Double Dabble / Shift-and-Add-3):**\n"
            "1. Initialize a 20-bit shift register: {hundreds[3:0], tens[3:0], ones[3:0], binary_in[7:0]}.\n"
            "2. Repeat 8 times:\n"
            "   a. If any BCD digit ΓëÑ 5, add 3 to that digit.\n"
            "   b. Left-shift the entire register by 1.\n"
            "3. The upper 12 bits now hold the BCD digits.\n\n"
            "**Example:**\n"
            "- binary_in = 8'd255 ΓåÆ hundreds=4'd2, tens=4'd5, ones=4'd5\n"
            "- binary_in = 8'd99  ΓåÆ hundreds=4'd0, tens=4'd9, ones=4'd9\n"
            "- binary_in = 8'd0   ΓåÆ hundreds=4'd0, tens=4'd0, ones=4'd0"
        ),
        "input_description": "binary_in[7:0] ΓÇö unsigned 8-bit binary number (0-255)",
        "output_description": "hundreds[3:0], tens[3:0], ones[3:0] ΓÇö BCD digits",
        "constraints": "Must be purely combinational. Input range 0-255.",
        "starter_code": (
            "module binary_to_bcd (\n"
            "  input  logic [7:0] binary_in,\n"
            "  output logic [3:0] hundreds,\n"
            "  output logic [3:0] tens,\n"
            "  output logic [3:0] ones\n"
            ");\n\n"
            "  // Implement the Double Dabble algorithm\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module binary_to_bcd (\n"
            "  input  logic [7:0] binary_in,\n"
            "  output logic [3:0] hundreds,\n"
            "  output logic [3:0] tens,\n"
            "  output logic [3:0] ones\n"
            ");\n"
            "  integer i;\n"
            "  always_comb begin\n"
            "    hundreds = 4'd0;\n"
            "    tens     = 4'd0;\n"
            "    ones     = 4'd0;\n"
            "    for (i = 7; i >= 0; i = i - 1) begin\n"
            "      // Add 3 to any BCD digit >= 5\n"
            "      if (hundreds >= 4'd5) hundreds = hundreds + 4'd3;\n"
            "      if (tens     >= 4'd5) tens     = tens     + 4'd3;\n"
            "      if (ones     >= 4'd5) ones     = ones     + 4'd3;\n"
            "      // Shift left\n"
            "      hundreds = {hundreds[2:0], tens[3]};\n"
            "      tens     = {tens[2:0], ones[3]};\n"
            "      ones     = {ones[2:0], binary_in[i]};\n"
            "    end\n"
            "  end\n"
            "endmodule"
        ),
    },
]

# ============================================================================
# TESTBENCHES
# ============================================================================

TESTBENCHES = {
    # -----------------------------------------------------------------------
    # Priority Encoder
    # -----------------------------------------------------------------------
    "priority-encoder-8to3": {
        "public": """\
module testbench;
  logic [7:0] in;
  logic [2:0] out;
  logic       valid;
  priority_encoder uut (.in(in), .out(out), .valid(valid));
  int pass_count = 0;
  int total_count = 0;
  task automatic check(input logic [2:0] exp_out, input logic exp_valid, input string name);
    total_count++;
    if (valid === exp_valid && (exp_valid == 0 || out === exp_out)) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:out=%0d,valid=%b", exp_out, exp_valid);
      $display("HDLFORGE_RECEIVED:out=%0d,valid=%b", out, valid);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    in = 8'b10000000; #1; check(3'd7, 1'b1, "Bit 7 only -> out=7");
    in = 8'b00000001; #1; check(3'd0, 1'b1, "Bit 0 only -> out=0");
    in = 8'b00000000; #1; check(3'd0, 1'b0, "No bits -> valid=0");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
        "hidden": """\
module testbench;
  logic [7:0] in;
  logic [2:0] out;
  logic       valid;
  priority_encoder uut (.in(in), .out(out), .valid(valid));
  int pass_count = 0;
  int total_count = 0;
  task automatic check(input logic [2:0] exp_out, input logic exp_valid, input string name);
    total_count++;
    if (valid === exp_valid && (exp_valid == 0 || out === exp_out)) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:out=%0d,valid=%b", exp_out, exp_valid);
      $display("HDLFORGE_RECEIVED:out=%0d,valid=%b", out, valid);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    in = 8'b10000000; #1; check(3'd7, 1'b1, "Bit 7 only");
    in = 8'b01000000; #1; check(3'd6, 1'b1, "Bit 6 only");
    in = 8'b00100000; #1; check(3'd5, 1'b1, "Bit 5 only");
    in = 8'b00010000; #1; check(3'd4, 1'b1, "Bit 4 only");
    in = 8'b00001000; #1; check(3'd3, 1'b1, "Bit 3 only");
    in = 8'b00000100; #1; check(3'd2, 1'b1, "Bit 2 only");
    in = 8'b00000010; #1; check(3'd1, 1'b1, "Bit 1 only");
    in = 8'b00000001; #1; check(3'd0, 1'b1, "Bit 0 only");
    in = 8'b00000000; #1; check(3'd0, 1'b0, "All zeros -> valid=0");
    in = 8'b11111111; #1; check(3'd7, 1'b1, "All ones -> out=7");
    in = 8'b00101100; #1; check(3'd5, 1'b1, "Multiple bits -> highest=5");
    in = 8'b00000011; #1; check(3'd1, 1'b1, "Bits 0,1 -> out=1");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    # -----------------------------------------------------------------------
    # Gray Code Converter
    # -----------------------------------------------------------------------
    "gray-code-converter": {
        "public": """\
module testbench;
  logic [3:0] in, out;
  logic       mode;
  gray_code_converter uut (.in(in), .mode(mode), .out(out));
  int pass_count = 0;
  int total_count = 0;
  task automatic check(input logic [3:0] exp, input string name);
    total_count++;
    if (out === exp) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%b", exp);
      $display("HDLFORGE_RECEIVED:%b", out);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    mode = 0; in = 4'b0000; #1; check(4'b0000, "Bin2Gray: 0000->0000");
    mode = 0; in = 4'b1010; #1; check(4'b1111, "Bin2Gray: 1010->1111");
    mode = 1; in = 4'b1111; #1; check(4'b1010, "Gray2Bin: 1111->1010");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
        "hidden": """\
module testbench;
  logic [3:0] in, out;
  logic       mode;
  gray_code_converter uut (.in(in), .mode(mode), .out(out));
  int pass_count = 0;
  int total_count = 0;
  task automatic check(input logic [3:0] exp, input string name);
    total_count++;
    if (out === exp) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%b", exp);
      $display("HDLFORGE_RECEIVED:%b", out);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    // Binary to Gray
    mode = 0; in = 4'b0000; #1; check(4'b0000, "B2G: 0->0");
    mode = 0; in = 4'b0001; #1; check(4'b0001, "B2G: 1->1");
    mode = 0; in = 4'b0010; #1; check(4'b0011, "B2G: 2->3");
    mode = 0; in = 4'b0011; #1; check(4'b0010, "B2G: 3->2");
    mode = 0; in = 4'b0100; #1; check(4'b0110, "B2G: 4->6");
    mode = 0; in = 4'b0111; #1; check(4'b0100, "B2G: 7->4");
    mode = 0; in = 4'b1010; #1; check(4'b1111, "B2G: 10->15");
    mode = 0; in = 4'b1111; #1; check(4'b1000, "B2G: 15->8");
    // Gray to Binary
    mode = 1; in = 4'b0000; #1; check(4'b0000, "G2B: 0->0");
    mode = 1; in = 4'b0001; #1; check(4'b0001, "G2B: 1->1");
    mode = 1; in = 4'b0011; #1; check(4'b0010, "G2B: 3->2");
    mode = 1; in = 4'b1111; #1; check(4'b1010, "G2B: 15->10");
    mode = 1; in = 4'b1000; #1; check(4'b1111, "G2B: 8->15");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    # -----------------------------------------------------------------------
    # Leading Zero Counter
    # -----------------------------------------------------------------------
    "leading-zero-counter": {
        "public": """\
module testbench;
  logic [7:0] in;
  logic [3:0] count;
  logic       all_zeros;
  leading_zero_counter uut (.in(in), .count(count), .all_zeros(all_zeros));
  int pass_count = 0;
  int total_count = 0;
  task automatic check(input logic [3:0] exp_count, input logic exp_az, input string name);
    total_count++;
    if (count === exp_count && all_zeros === exp_az) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:count=%0d,az=%b", exp_count, exp_az);
      $display("HDLFORGE_RECEIVED:count=%0d,az=%b", count, all_zeros);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    in = 8'b10000000; #1; check(4'd0, 1'b0, "MSB set -> count=0");
    in = 8'b00000001; #1; check(4'd7, 1'b0, "LSB only -> count=7");
    in = 8'b00000000; #1; check(4'd8, 1'b1, "All zeros -> count=8, az=1");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
        "hidden": """\
module testbench;
  logic [7:0] in;
  logic [3:0] count;
  logic       all_zeros;
  leading_zero_counter uut (.in(in), .count(count), .all_zeros(all_zeros));
  int pass_count = 0;
  int total_count = 0;
  task automatic check(input logic [3:0] exp_count, input logic exp_az, input string name);
    total_count++;
    if (count === exp_count && all_zeros === exp_az) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:count=%0d,az=%b", exp_count, exp_az);
      $display("HDLFORGE_RECEIVED:count=%0d,az=%b", count, all_zeros);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    in = 8'b10000000; #1; check(4'd0, 1'b0, "LZC=0");
    in = 8'b01000000; #1; check(4'd1, 1'b0, "LZC=1");
    in = 8'b00100000; #1; check(4'd2, 1'b0, "LZC=2");
    in = 8'b00010000; #1; check(4'd3, 1'b0, "LZC=3");
    in = 8'b00001000; #1; check(4'd4, 1'b0, "LZC=4");
    in = 8'b00000100; #1; check(4'd5, 1'b0, "LZC=5");
    in = 8'b00000010; #1; check(4'd6, 1'b0, "LZC=6");
    in = 8'b00000001; #1; check(4'd7, 1'b0, "LZC=7");
    in = 8'b00000000; #1; check(4'd8, 1'b1, "LZC=8, all_zeros");
    in = 8'b11111111; #1; check(4'd0, 1'b0, "All ones, LZC=0");
    in = 8'b00101000; #1; check(4'd2, 1'b0, "00101000, LZC=2");
    in = 8'b00010101; #1; check(4'd3, 1'b0, "00010101, LZC=3");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    # -----------------------------------------------------------------------
    # Adder-Subtractor
    # -----------------------------------------------------------------------
    "adder-subtractor-4bit": {
        "public": """\
module testbench;
  logic [3:0] a, b, result;
  logic       sub, carry_out, overflow;
  adder_subtractor uut (.a(a), .b(b), .sub(sub), .result(result), .carry_out(carry_out), .overflow(overflow));
  int pass_count = 0;
  int total_count = 0;
  task automatic check(input logic [3:0] exp_r, input logic exp_co, input logic exp_ov, input string name);
    total_count++;
    if (result === exp_r && carry_out === exp_co && overflow === exp_ov) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:r=%b,co=%b,ov=%b", exp_r, exp_co, exp_ov);
      $display("HDLFORGE_RECEIVED:r=%b,co=%b,ov=%b", result, carry_out, overflow);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    a=4'd3; b=4'd2; sub=0; #1; check(4'd5, 1'b0, 1'b0, "3+2=5");
    a=4'd5; b=4'd3; sub=1; #1; check(4'd2, 1'b1, 1'b0, "5-3=2");
    a=4'd7; b=4'd1; sub=0; #1; check(4'd8, 1'b0, 1'b1, "7+1=8 (overflow)");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
        "hidden": """\
module testbench;
  logic [3:0] a, b, result;
  logic       sub, carry_out, overflow;
  adder_subtractor uut (.a(a), .b(b), .sub(sub), .result(result), .carry_out(carry_out), .overflow(overflow));
  int pass_count = 0;
  int total_count = 0;
  task automatic check(input logic [3:0] exp_r, input logic exp_co, input logic exp_ov, input string name);
    total_count++;
    if (result === exp_r && carry_out === exp_co && overflow === exp_ov) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:r=%b,co=%b,ov=%b", exp_r, exp_co, exp_ov);
      $display("HDLFORGE_RECEIVED:r=%b,co=%b,ov=%b", result, carry_out, overflow);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    a=4'd0; b=4'd0; sub=0; #1; check(4'd0, 1'b0, 1'b0, "0+0=0");
    a=4'd3; b=4'd2; sub=0; #1; check(4'd5, 1'b0, 1'b0, "3+2=5");
    a=4'd7; b=4'd1; sub=0; #1; check(4'd8, 1'b0, 1'b1, "7+1=8 signed ovf");
    a=4'd15; b=4'd1; sub=0; #1; check(4'd0, 1'b1, 1'b0, "15+1=0 unsigned wrap");
    a=4'd5; b=4'd3; sub=1; #1; check(4'd2, 1'b1, 1'b0, "5-3=2");
    a=4'd3; b=4'd5; sub=1; #1; check(4'd14, 1'b0, 1'b0, "3-5=14 unsigned");
    a=4'd0; b=4'd0; sub=1; #1; check(4'd0, 1'b1, 1'b0, "0-0=0");
    a=4'd8; b=4'd1; sub=1; #1; check(4'd7, 1'b1, 1'b1, "-8-1 signed ovf");
    a=4'd8; b=4'd8; sub=0; #1; check(4'd0, 1'b1, 1'b1, "-8+(-8) signed ovf");
    a=4'd4; b=4'd4; sub=0; #1; check(4'd8, 1'b0, 1'b1, "4+4=8 signed ovf");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    # -----------------------------------------------------------------------
    # Edge Detector
    # -----------------------------------------------------------------------
    "edge-detector": {
        "public": """\
module testbench;
  logic clk, rst, signal_in;
  logic pos_edge, neg_edge, any_edge;
  edge_detector uut (.clk(clk), .rst(rst), .signal_in(signal_in),
                      .pos_edge(pos_edge), .neg_edge(neg_edge), .any_edge(any_edge));
  initial clk = 0;
  always #5 clk = ~clk;
  int pass_count = 0;
  int total_count = 0;
  task automatic check(input logic exp_p, input logic exp_n, input logic exp_a, input string name);
    total_count++;
    if (pos_edge === exp_p && neg_edge === exp_n && any_edge === exp_a) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:pos=%b,neg=%b,any=%b", exp_p, exp_n, exp_a);
      $display("HDLFORGE_RECEIVED:pos=%b,neg=%b,any=%b", pos_edge, neg_edge, any_edge);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    rst = 1; signal_in = 0; @(posedge clk); #1;
    rst = 0;
    // Rising edge: 0->1
    signal_in = 1; @(posedge clk); #1;
    check(1'b1, 1'b0, 1'b1, "Rising edge 0->1");
    // Hold high: no edge
    @(posedge clk); #1;
    check(1'b0, 1'b0, 1'b0, "No edge 1->1");
    // Falling edge: 1->0
    signal_in = 0; @(posedge clk); #1;
    check(1'b0, 1'b1, 1'b1, "Falling edge 1->0");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
        "hidden": """\
module testbench;
  logic clk, rst, signal_in;
  logic pos_edge, neg_edge, any_edge;
  edge_detector uut (.clk(clk), .rst(rst), .signal_in(signal_in),
                      .pos_edge(pos_edge), .neg_edge(neg_edge), .any_edge(any_edge));
  initial clk = 0;
  always #5 clk = ~clk;
  int pass_count = 0;
  int total_count = 0;
  task automatic check(input logic exp_p, input logic exp_n, input logic exp_a, input string name);
    total_count++;
    if (pos_edge === exp_p && neg_edge === exp_n && any_edge === exp_a) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:pos=%b,neg=%b,any=%b", exp_p, exp_n, exp_a);
      $display("HDLFORGE_RECEIVED:pos=%b,neg=%b,any=%b", pos_edge, neg_edge, any_edge);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    rst = 1; signal_in = 0; @(posedge clk); #1;
    rst = 0;
    // Start low, no edge after reset
    @(posedge clk); #1;
    check(1'b0, 1'b0, 1'b0, "Idle low, no edge");
    // Rising edge
    signal_in = 1; @(posedge clk); #1;
    check(1'b1, 1'b0, 1'b1, "Rising edge 0->1");
    // Hold high
    @(posedge clk); #1;
    check(1'b0, 1'b0, 1'b0, "Hold high 1->1");
    // Falling edge
    signal_in = 0; @(posedge clk); #1;
    check(1'b0, 1'b1, 1'b1, "Falling edge 1->0");
    // Hold low
    @(posedge clk); #1;
    check(1'b0, 1'b0, 1'b0, "Hold low 0->0");
    // Toggle fast
    signal_in = 1; @(posedge clk); #1;
    check(1'b1, 1'b0, 1'b1, "Rise again");
    signal_in = 0; @(posedge clk); #1;
    check(1'b0, 1'b1, 1'b1, "Fall again");
    // Reset during operation
    signal_in = 1; @(posedge clk); #1;
    rst = 1; @(posedge clk); #1;
    // After reset, delayed register should be 0
    rst = 0; signal_in = 0; @(posedge clk); #1;
    check(1'b0, 1'b0, 1'b0, "After reset idle");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    # -----------------------------------------------------------------------
    # LFSR 8-bit
    # -----------------------------------------------------------------------
    "lfsr-8bit": {
        "public": """\
module testbench;
  logic       clk, rst, enable;
  logic [7:0] lfsr_out;
  lfsr_8bit uut (.clk(clk), .rst(rst), .enable(enable), .lfsr_out(lfsr_out));
  initial clk = 0;
  always #5 clk = ~clk;
  int pass_count = 0;
  int total_count = 0;
  task automatic check(input logic [7:0] exp, input string name);
    total_count++;
    if (lfsr_out === exp) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%h", exp);
      $display("HDLFORGE_RECEIVED:%h", lfsr_out);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    rst = 1; enable = 0; @(posedge clk); #1;
    check(8'h01, "After reset -> 0x01");
    rst = 0; enable = 1;
    @(posedge clk); #1;
    check(8'h80, "Cycle 1 -> 0x80");
    @(posedge clk); #1;
    check(8'hC0, "Cycle 2 -> 0xC0");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
        "hidden": """\
module testbench;
  logic       clk, rst, enable;
  logic [7:0] lfsr_out;
  lfsr_8bit uut (.clk(clk), .rst(rst), .enable(enable), .lfsr_out(lfsr_out));
  initial clk = 0;
  always #5 clk = ~clk;
  int pass_count = 0;
  int total_count = 0;
  task automatic check(input logic [7:0] exp, input string name);
    total_count++;
    if (lfsr_out === exp) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%h", exp);
      $display("HDLFORGE_RECEIVED:%h", lfsr_out);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    rst = 1; enable = 0; @(posedge clk); #1;
    check(8'h01, "Reset -> 0x01");
    rst = 0; enable = 1;
    @(posedge clk); #1; check(8'h80, "Shift 1");
    @(posedge clk); #1; check(8'hC0, "Shift 2");
    @(posedge clk); #1; check(8'h60, "Shift 3");
    @(posedge clk); #1; check(8'h30, "Shift 4");
    @(posedge clk); #1; check(8'h98, "Shift 5");
    // Test enable=0 holds state
    enable = 0;
    @(posedge clk); #1;
    check(8'h98, "Enable=0 holds");
    enable = 1;
    @(posedge clk); #1; check(8'hCC, "Resume shift");
    // Test reset mid-operation
    rst = 1; @(posedge clk); #1;
    check(8'h01, "Re-reset -> 0x01");
    rst = 0; @(posedge clk); #1;
    check(8'h80, "After re-reset shift");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    # -----------------------------------------------------------------------
    # Traffic Light FSM
    # -----------------------------------------------------------------------
    "traffic-light-fsm": {
        "public": """\
module testbench;
  logic clk, rst, sensor;
  logic green, yellow, red;
  traffic_light_fsm uut (.clk(clk), .rst(rst), .sensor(sensor),
                          .green(green), .yellow(yellow), .red(red));
  initial clk = 0;
  always #5 clk = ~clk;
  int pass_count = 0;
  int total_count = 0;
  task automatic check(input logic exp_g, input logic exp_y, input logic exp_r, input string name);
    total_count++;
    if (green === exp_g && yellow === exp_y && red === exp_r) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:g=%b,y=%b,r=%b", exp_g, exp_y, exp_r);
      $display("HDLFORGE_RECEIVED:g=%b,y=%b,r=%b", green, yellow, red);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    rst = 1; sensor = 1; @(posedge clk); #1;
    check(1'b1, 1'b0, 1'b0, "Reset -> GREEN");
    rst = 0;
    // Stay in GREEN while sensor=1
    @(posedge clk); #1;
    check(1'b1, 1'b0, 1'b0, "GREEN holds with sensor=1");
    // Sensor goes low -> transition to YELLOW
    sensor = 0; @(posedge clk); #1;
    check(1'b0, 1'b1, 1'b0, "sensor=0 -> YELLOW");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
        "hidden": """\
module testbench;
  logic clk, rst, sensor;
  logic green, yellow, red;
  traffic_light_fsm uut (.clk(clk), .rst(rst), .sensor(sensor),
                          .green(green), .yellow(yellow), .red(red));
  initial clk = 0;
  always #5 clk = ~clk;
  int pass_count = 0;
  int total_count = 0;
  task automatic check(input logic exp_g, input logic exp_y, input logic exp_r, input string name);
    total_count++;
    if (green === exp_g && yellow === exp_y && red === exp_r) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:g=%b,y=%b,r=%b", exp_g, exp_y, exp_r);
      $display("HDLFORGE_RECEIVED:g=%b,y=%b,r=%b", green, yellow, red);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    // Reset
    rst = 1; sensor = 1; @(posedge clk); #1;
    check(1'b1, 1'b0, 1'b0, "Reset -> GREEN");
    rst = 0;
    // Stay GREEN with sensor high
    @(posedge clk); #1;
    check(1'b1, 1'b0, 1'b0, "GREEN hold 1");
    @(posedge clk); #1;
    check(1'b1, 1'b0, 1'b0, "GREEN hold 2");
    // Sensor goes low -> YELLOW
    sensor = 0; @(posedge clk); #1;
    check(1'b0, 1'b1, 1'b0, "YELLOW cycle 1");
    @(posedge clk); #1;
    check(1'b0, 1'b1, 1'b0, "YELLOW cycle 2");
    @(posedge clk); #1;
    check(1'b0, 1'b1, 1'b0, "YELLOW cycle 3");
    // After 3 YELLOW cycles -> RED
    @(posedge clk); #1;
    check(1'b0, 1'b0, 1'b1, "RED cycle 1");
    @(posedge clk); #1;
    check(1'b0, 1'b0, 1'b1, "RED cycle 2");
    @(posedge clk); #1;
    check(1'b0, 1'b0, 1'b1, "RED cycle 3");
    @(posedge clk); #1;
    check(1'b0, 1'b0, 1'b1, "RED cycle 4");
    @(posedge clk); #1;
    check(1'b0, 1'b0, 1'b1, "RED cycle 5");
    // After 5 RED cycles -> GREEN
    @(posedge clk); #1;
    check(1'b1, 1'b0, 1'b0, "Back to GREEN");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    # -----------------------------------------------------------------------
    # Binary to BCD
    # -----------------------------------------------------------------------
    "binary-to-bcd": {
        "public": """\
module testbench;
  logic [7:0] binary_in;
  logic [3:0] hundreds, tens, ones;
  binary_to_bcd uut (.binary_in(binary_in), .hundreds(hundreds), .tens(tens), .ones(ones));
  int pass_count = 0;
  int total_count = 0;
  task automatic check(input logic [3:0] exp_h, input logic [3:0] exp_t, input logic [3:0] exp_o, input string name);
    total_count++;
    if (hundreds === exp_h && tens === exp_t && ones === exp_o) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%0d%0d%0d", exp_h, exp_t, exp_o);
      $display("HDLFORGE_RECEIVED:%0d%0d%0d", hundreds, tens, ones);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    binary_in = 8'd0;   #1; check(4'd0, 4'd0, 4'd0, "0 -> 000");
    binary_in = 8'd99;  #1; check(4'd0, 4'd9, 4'd9, "99 -> 099");
    binary_in = 8'd255; #1; check(4'd2, 4'd5, 4'd5, "255 -> 255");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
        "hidden": """\
module testbench;
  logic [7:0] binary_in;
  logic [3:0] hundreds, tens, ones;
  binary_to_bcd uut (.binary_in(binary_in), .hundreds(hundreds), .tens(tens), .ones(ones));
  int pass_count = 0;
  int total_count = 0;
  task automatic check(input logic [3:0] exp_h, input logic [3:0] exp_t, input logic [3:0] exp_o, input string name);
    total_count++;
    if (hundreds === exp_h && tens === exp_t && ones === exp_o) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%0d%0d%0d", exp_h, exp_t, exp_o);
      $display("HDLFORGE_RECEIVED:%0d%0d%0d", hundreds, tens, ones);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    binary_in = 8'd0;   #1; check(4'd0, 4'd0, 4'd0, "0 -> 000");
    binary_in = 8'd1;   #1; check(4'd0, 4'd0, 4'd1, "1 -> 001");
    binary_in = 8'd9;   #1; check(4'd0, 4'd0, 4'd9, "9 -> 009");
    binary_in = 8'd10;  #1; check(4'd0, 4'd1, 4'd0, "10 -> 010");
    binary_in = 8'd42;  #1; check(4'd0, 4'd4, 4'd2, "42 -> 042");
    binary_in = 8'd99;  #1; check(4'd0, 4'd9, 4'd9, "99 -> 099");
    binary_in = 8'd100; #1; check(4'd1, 4'd0, 4'd0, "100 -> 100");
    binary_in = 8'd127; #1; check(4'd1, 4'd2, 4'd7, "127 -> 127");
    binary_in = 8'd128; #1; check(4'd1, 4'd2, 4'd8, "128 -> 128");
    binary_in = 8'd199; #1; check(4'd1, 4'd9, 4'd9, "199 -> 199");
    binary_in = 8'd200; #1; check(4'd2, 4'd0, 4'd0, "200 -> 200");
    binary_in = 8'd255; #1; check(4'd2, 4'd5, 4'd5, "255 -> 255");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
}

# ============================================================================
# TEST CASE CONFIGURATIONS
# ============================================================================

TEST_CASES_CONFIG = {
    "priority-encoder-8to3": [
        {"name": "Bit 7 only", "visibility": "PUBLIC", "weight": 0.33, "order": 1},
        {"name": "Bit 0 only", "visibility": "PUBLIC", "weight": 0.33, "order": 2},
        {"name": "All zeros", "visibility": "PUBLIC", "weight": 0.34, "order": 3},
        {"name": "All bits and priority", "visibility": "HIDDEN", "weight": 1.0, "order": 4},
    ],
    "gray-code-converter": [
        {"name": "Basic conversions", "visibility": "PUBLIC", "weight": 0.5, "order": 1},
        {"name": "Exhaustive bidirectional", "visibility": "HIDDEN", "weight": 0.5, "order": 2},
    ],
    "leading-zero-counter": [
        {"name": "Basic LZC", "visibility": "PUBLIC", "weight": 0.5, "order": 1},
        {"name": "Full coverage LZC", "visibility": "HIDDEN", "weight": 0.5, "order": 2},
    ],
    "adder-subtractor-4bit": [
        {"name": "Basic add/sub", "visibility": "PUBLIC", "weight": 0.5, "order": 1},
        {"name": "Overflow and edge cases", "visibility": "HIDDEN", "weight": 0.5, "order": 2},
    ],
    "edge-detector": [
        {"name": "Rise/fall/hold", "visibility": "PUBLIC", "weight": 0.5, "order": 1},
        {"name": "Full edge patterns", "visibility": "HIDDEN", "weight": 0.5, "order": 2},
    ],
    "lfsr-8bit": [
        {"name": "Reset and first shifts", "visibility": "PUBLIC", "weight": 0.5, "order": 1},
        {"name": "Enable/reset sequences", "visibility": "HIDDEN", "weight": 0.5, "order": 2},
    ],
    "traffic-light-fsm": [
        {"name": "Reset and first transition", "visibility": "PUBLIC", "weight": 0.5, "order": 1},
        {"name": "Full cycle verification", "visibility": "HIDDEN", "weight": 0.5, "order": 2},
    ],
    "binary-to-bcd": [
        {"name": "Boundary values", "visibility": "PUBLIC", "weight": 0.5, "order": 1},
        {"name": "Full range conversion", "visibility": "HIDDEN", "weight": 0.5, "order": 2},
    ],
}

# ============================================================================
# SEEDING FUNCTION
# ============================================================================

def seed_new_problems() -> None:
    """Add the 8 new hardware interview problems to the database (idempotent)."""
    db = SessionLocal()
    try:
        added = 0
        for problem_data in NEW_PROBLEMS:
            slug = problem_data["slug"]
            existing = db.query(Problem).filter(Problem.slug == slug).first()
            if existing:
                logger.info("Problem '%s' already exists (id=%d), skipping.", slug, existing.id)
                # Still ensure test cases exist
                _ensure_test_cases(db, existing, slug)
                continue

            problem_data.pop("company_tags", None)
            problem = Problem(**problem_data)
            db.add(problem)
            db.flush()
            _ensure_test_cases(db, problem, slug)
            added += 1
            logger.info("Added problem '%s' (id=%d)", slug, problem.id)

        db.commit()
        logger.info("Seeded %d new problems (%d already existed).", added, len(NEW_PROBLEMS) - added)
    except Exception as e:
        db.rollback()
        logger.error("Error seeding new problems: %s", e)
        raise
    finally:
        db.close()


def _ensure_test_cases(db: Session, problem: Problem, slug: str) -> None:
    """Create test cases for a problem if they don't already exist."""
    existing_count = db.query(TestCase).filter(TestCase.problem_id == problem.id).count()
    if existing_count > 0:
        logger.info("  Test cases already exist for '%s' (%d), skipping.", slug, existing_count)
        return

    configs = TEST_CASES_CONFIG.get(slug, [])
    tbs = TESTBENCHES.get(slug, {})
    public_tb = tbs.get("public", "")
    hidden_tb = tbs.get("hidden", "")

    for cfg in configs:
        visibility = TestVisibility.PUBLIC if cfg["visibility"] == "PUBLIC" else TestVisibility.HIDDEN
        tb = public_tb if cfg["visibility"] == "PUBLIC" else hidden_tb

        tc = TestCase(
            problem_id=problem.id,
            name=cfg["name"],
            description="",
            testbench=tb,
            visibility=visibility,
            weight=cfg["weight"],
            execution_order=cfg["order"],
            enabled=True,
        )
        db.add(tc)
        logger.info("  Added test case '%s' for '%s'", cfg["name"], slug)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    seed_new_problems()
