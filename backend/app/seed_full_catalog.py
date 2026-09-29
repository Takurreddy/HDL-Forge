"""
Seed script to expand HDLForge to 10 problems per category (50 total).

Categories:
1. Combinational Logic (10 problems)
2. Arithmetic (10 problems)
3. Sequential Logic (10 problems)
4. Finite State Machines (10 problems)
5. Chip Design (10 problems)
"""

import logging
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import Difficulty, Language, Problem, TestCase, TestVisibility

logger = logging.getLogger(__name__)

NEW_CATALOG_PROBLEMS = [
    # =========================================================================
    # COMBINATIONAL LOGIC (4 new)
    # =========================================================================
    {
        "slug": "decoder-3to8",
        "title": "3-to-8 Decoder with Enable",
        "difficulty": Difficulty.EASY,
        "category": "Combinational Logic",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Intel, Qualcomm, NVIDIA",
        "description": (
            "Design an active-high 3-to-8 binary decoder with an enable signal (`en`).\n\n"
            "- When `en = 1`, one-hot output `out[in]` is set to 1, all other bits are 0.\n"
            "- When `en = 0`, all output bits `out[7:0]` must be 0."
        ),
        "input_description": "in[2:0] — 3-bit binary input, en — active-high enable",
        "output_description": "out[7:0] — 8-bit one-hot decoded output",
        "constraints": "Pure combinational logic.",
        "starter_code": (
            "module decoder_3to8 (\n"
            "  input  logic [2:0] in,\n"
            "  input  logic       en,\n"
            "  output logic [7:0] out\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module decoder_3to8 (\n"
            "  input  logic [2:0] in,\n"
            "  input  logic       en,\n"
            "  output logic [7:0] out\n"
            ");\n"
            "  assign out = en ? (8'b1 << in) : 8'b0;\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic [2:0] in; logic en; logic [7:0] out;
  decoder_3to8 uut (.in(in), .en(en), .out(out));
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic [7:0] exp, input string name);
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
    en = 0; in = 3'b011; #1; check(8'b00000000, "en=0 -> out=0");
    en = 1; in = 3'b000; #1; check(8'b00000001, "in=0 -> bit 0");
    en = 1; in = 3'b101; #1; check(8'b00100000, "in=5 -> bit 5");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "demux-1to4",
        "title": "1-to-4 Demultiplexer",
        "difficulty": Difficulty.EASY,
        "category": "Combinational Logic",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Apple, Broadcom",
        "description": (
            "Implement a 1-to-4 demultiplexer. Route single-bit input `in` to the output "
            "channel selected by `sel[1:0]`. All unselected channels must be driven to 0."
        ),
        "input_description": "in — single-bit data input, sel[1:0] — 2-bit channel select",
        "output_description": "out[3:0] — 4-bit output channels",
        "constraints": "Combinational routing.",
        "starter_code": (
            "module demux_1to4 (\n"
            "  input  logic       in,\n"
            "  input  logic [1:0] sel,\n"
            "  output logic [3:0] out\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module demux_1to4 (\n"
            "  input  logic       in,\n"
            "  input  logic [1:0] sel,\n"
            "  output logic [3:0] out\n"
            ");\n"
            "  always_comb begin\n"
            "    out = 4'b0000;\n"
            "    out[sel] = in;\n"
            "  end\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic in; logic [1:0] sel; logic [3:0] out;
  demux_1to4 uut (.in(in), .sel(sel), .out(out));
  int pass_count = 0; int total_count = 0;
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
    in = 1; sel = 2'd0; #1; check(4'b0001, "sel=0 -> ch0");
    in = 1; sel = 2'd2; #1; check(4'b0100, "sel=2 -> ch2");
    in = 0; sel = 2'd2; #1; check(4'b0000, "in=0 -> all 0");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "majority-detector",
        "title": "5-Input Majority Voter",
        "difficulty": Difficulty.MEDIUM,
        "category": "Combinational Logic",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "AMD, Google Silicon, Lockheed",
        "description": (
            "Implement a 5-input majority voting circuit. Output `y = 1` if 3 or more of "
            "the 5 inputs in `in[4:0]` are 1; otherwise `y = 0`."
        ),
        "input_description": "in[4:0] — 5-bit input vector",
        "output_description": "y — single-bit majority decision",
        "constraints": "Zero clock latency, purely combinational.",
        "starter_code": (
            "module majority_detector (\n"
            "  input  logic [4:0] in,\n"
            "  output logic       y\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module majority_detector (\n"
            "  input  logic [4:0] in,\n"
            "  output logic       y\n"
            ");\n"
            "  assign y = ($countones(in) >= 3);\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic [4:0] in; logic y;
  majority_detector uut (.in(in), .y(y));
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic exp, input string name);
    total_count++;
    if (y === exp) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%b", exp);
      $display("HDLFORGE_RECEIVED:%b", y);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    in = 5'b00011; #1; check(1'b0, "2 ones -> 0");
    in = 5'b00111; #1; check(1'b1, "3 ones -> 1");
    in = 5'b11111; #1; check(1'b1, "5 ones -> 1");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "parity-checker-8bit",
        "title": "8-Bit Even/Odd Parity Generator",
        "difficulty": Difficulty.EASY,
        "category": "Combinational Logic",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Cisco, NVIDIA, Intel",
        "description": (
            "Compute both even and odd parity for an 8-bit input byte `data[7:0]`.\n"
            "- `even_parity`: 1 if the total number of 1s in `data` is even.\n"
            "- `odd_parity`: 1 if the total number of 1s in `data` is odd."
        ),
        "input_description": "data[7:0] — 8-bit data byte",
        "output_description": "even_parity, odd_parity — parity flags",
        "constraints": "even_parity and odd_parity are complementary.",
        "starter_code": (
            "module parity_checker (\n"
            "  input  logic [7:0] data,\n"
            "  output logic       even_parity,\n"
            "  output logic       odd_parity\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module parity_checker (\n"
            "  input  logic [7:0] data,\n"
            "  output logic       even_parity,\n"
            "  output logic       odd_parity\n"
            ");\n"
            "  assign odd_parity = ^data;\n"
            "  assign even_parity = ~odd_parity;\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic [7:0] data; logic even_parity, odd_parity;
  parity_checker uut (.data(data), .even_parity(even_parity), .odd_parity(odd_parity));
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic exp_e, input logic exp_o, input string name);
    total_count++;
    if (even_parity === exp_e && odd_parity === exp_o) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:e=%b,o=%b", exp_e, exp_o);
      $display("HDLFORGE_RECEIVED:e=%b,o=%b", even_parity, odd_parity);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    data = 8'b00000000; #1; check(1'b1, 1'b0, "0 ones -> even=1,odd=0");
    data = 8'b00000001; #1; check(1'b0, 1'b1, "1 one  -> even=0,odd=1");
    data = 8'b11001100; #1; check(1'b1, 1'b0, "4 ones -> even=1,odd=0");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },

    # =========================================================================
    # ARITHMETIC (3 new)
    # =========================================================================
    {
        "slug": "multiplier-4bit",
        "title": "4x4 Combinational Array Multiplier",
        "difficulty": Difficulty.MEDIUM,
        "category": "Arithmetic",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "ARM, Qualcomm, Apple Silicon",
        "description": (
            "Design an unsigned 4-bit by 4-bit array multiplier. Computes the product "
            "`product = a * b` resulting in an 8-bit output."
        ),
        "input_description": "a[3:0], b[3:0] — unsigned 4-bit multiplicands",
        "output_description": "product[7:0] — 8-bit unsigned product",
        "constraints": "Output bit width is 8. Combinational.",
        "starter_code": (
            "module multiplier_4bit (\n"
            "  input  logic [3:0] a,\n"
            "  input  logic [3:0] b,\n"
            "  output logic [7:0] product\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module multiplier_4bit (\n"
            "  input  logic [3:0] a,\n"
            "  input  logic [3:0] b,\n"
            "  output logic [7:0] product\n"
            ");\n"
            "  assign product = a * b;\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic [3:0] a, b; logic [7:0] product;
  multiplier_4bit uut (.a(a), .b(b), .product(product));
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic [7:0] exp, input string name);
    total_count++;
    if (product === exp) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%0d", exp);
      $display("HDLFORGE_RECEIVED:%0d", product);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    a = 4'd3; b = 4'd5; #1; check(8'd15, "3 * 5 = 15");
    a = 4'd15; b = 4'd15; #1; check(8'd225, "15 * 15 = 225");
    a = 4'd0; b = 4'd9; #1; check(8'd0, "0 * 9 = 0");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "comparator-4bit",
        "title": "4-Bit Magnitude Comparator",
        "difficulty": Difficulty.EASY,
        "category": "Arithmetic",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Texas Instruments, Intel",
        "description": (
            "Compare two unsigned 4-bit numbers `a` and `b`. Assert exactly one of the outputs:\n"
            "- `greater = 1` if `a > b`\n"
            "- `equal = 1` if `a == b`\n"
            "- `less = 1` if `a < b`"
        ),
        "input_description": "a[3:0], b[3:0] — 4-bit unsigned inputs",
        "output_description": "greater, equal, less — mutual comparison flags",
        "constraints": "Exactly one output is active-high at any time.",
        "starter_code": (
            "module comparator_4bit (\n"
            "  input  logic [3:0] a,\n"
            "  input  logic [3:0] b,\n"
            "  output logic       greater,\n"
            "  output logic       equal,\n"
            "  output logic       less\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module comparator_4bit (\n"
            "  input  logic [3:0] a,\n"
            "  input  logic [3:0] b,\n"
            "  output logic       greater,\n"
            "  output logic       equal,\n"
            "  output logic       less\n"
            ");\n"
            "  assign greater = (a > b);\n"
            "  assign equal   = (a == b);\n"
            "  assign less    = (a < b);\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic [3:0] a, b; logic greater, equal, less;
  comparator_4bit uut (.a(a), .b(b), .greater(greater), .equal(equal), .less(less));
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic exp_g, input logic exp_e, input logic exp_l, input string name);
    total_count++;
    if (greater === exp_g && equal === exp_e && less === exp_l) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:g=%b,e=%b,l=%b", exp_g, exp_e, exp_l);
      $display("HDLFORGE_RECEIVED:g=%b,e=%b,l=%b", greater, equal, less);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    a = 4'd5; b = 4'd5; #1; check(1'b0, 1'b1, 1'b0, "5 == 5");
    a = 4'd7; b = 4'd3; #1; check(1'b1, 1'b0, 1'b0, "7 > 3");
    a = 4'd2; b = 4'd8; #1; check(1'b0, 1'b0, 1'b1, "2 < 8");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "barrel-shifter-8bit",
        "title": "8-Bit Barrel Shifter & Rotator",
        "difficulty": Difficulty.MEDIUM,
        "category": "Arithmetic",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "ARM, NVIDIA, AMD",
        "description": (
            "Design an 8-bit barrel shifter supporting logical shifts and circular rotations.\n"
            "- `mode = 2'b00`: Logical Shift Left (LSL) by `shift_amt[2:0]`\n"
            "- `mode = 2'b01`: Logical Shift Right (LSR) by `shift_amt[2:0]`\n"
            "- `mode = 2'b10`: Rotate Left (ROL) by `shift_amt[2:0]`\n"
            "- `mode = 2'b11`: Rotate Right (ROR) by `shift_amt[2:0]`"
        ),
        "input_description": "in[7:0] — data input, shift_amt[2:0] — 0-7 shift amount, mode[1:0] — operation mode",
        "output_description": "out[7:0] — 8-bit shifted/rotated result",
        "constraints": "Pure combinational barrel shifter.",
        "starter_code": (
            "module barrel_shifter (\n"
            "  input  logic [7:0] in,\n"
            "  input  logic [2:0] shift_amt,\n"
            "  input  logic [1:0] mode,\n"
            "  output logic [7:0] out\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module barrel_shifter (\n"
            "  input  logic [7:0] in,\n"
            "  input  logic [2:0] shift_amt,\n"
            "  input  logic [1:0] mode,\n"
            "  output logic [7:0] out\n"
            ");\n"
            "  always_comb begin\n"
            "    case (mode)\n"
            "      2'b00: out = in << shift_amt;\n"
            "      2'b01: out = in >> shift_amt;\n"
            "      2'b10: out = (in << shift_amt) | (in >> (8 - shift_amt));\n"
            "      2'b11: out = (in >> shift_amt) | (in << (8 - shift_amt));\n"
            "    endcase\n"
            "  end\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic [7:0] in; logic [2:0] shift_amt; logic [1:0] mode; logic [7:0] out;
  barrel_shifter uut (.in(in), .shift_amt(shift_amt), .mode(mode), .out(out));
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic [7:0] exp, input string name);
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
    in = 8'b00001111; shift_amt = 3'd2; mode = 2'b00; #1; check(8'b00111100, "LSL 2");
    in = 8'b11110000; shift_amt = 3'd2; mode = 2'b01; #1; check(8'b00111100, "LSR 2");
    in = 8'b10000001; shift_amt = 3'd1; mode = 2'b10; #1; check(8'b00000011, "ROL 1");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },

    # =========================================================================
    # SEQUENTIAL LOGIC (5 new)
    # =========================================================================
    {
        "slug": "t-flip-flop",
        "title": "T Flip-Flop with Enable",
        "difficulty": Difficulty.EASY,
        "category": "Sequential Logic",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Apple, Intel",
        "description": (
            "Design a positive-edge triggered Toggle Flip-Flop (T-FF) with synchronous reset (`rst`) and enable (`en`).\n"
            "- When `rst = 1`, `q` resets to 0.\n"
            "- When `rst = 0` and `en = 1`:\n"
            "  - If `t = 1`, toggle `q` (`q <= ~q`).\n"
            "  - If `t = 0`, hold `q`.\n"
            "- When `en = 0`, hold `q`."
        ),
        "input_description": "clk — clock, rst — synchronous reset, en — clock enable, t — toggle control",
        "output_description": "q — registered output",
        "constraints": "Synchronous active-high reset.",
        "starter_code": (
            "module t_flip_flop (\n"
            "  input  logic clk,\n"
            "  input  logic rst,\n"
            "  input  logic en,\n"
            "  input  logic t,\n"
            "  output logic q\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module t_flip_flop (\n"
            "  input  logic clk,\n"
            "  input  logic rst,\n"
            "  input  logic en,\n"
            "  input  logic t,\n"
            "  output logic q\n"
            ");\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (rst)      q <= 1'b0;\n"
            "    else if (en)  q <= t ? ~q : q;\n"
            "  end\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic clk, rst, en, t, q;
  t_flip_flop uut (.clk(clk), .rst(rst), .en(en), .t(t), .q(q));
  initial clk = 0; always #5 clk = ~clk;
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic exp, input string name);
    total_count++;
    if (q === exp) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%b", exp);
      $display("HDLFORGE_RECEIVED:%b", q);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    rst = 1; en = 0; t = 0; @(posedge clk); #1; check(1'b0, "Reset -> q=0");
    rst = 0; en = 1; t = 1; @(posedge clk); #1; check(1'b1, "t=1 -> toggle to 1");
    @(posedge clk); #1; check(1'b0, "t=1 -> toggle back to 0");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "jk-flip-flop",
        "title": "JK Flip-Flop with Reset",
        "difficulty": Difficulty.EASY,
        "category": "Sequential Logic",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "TI, Microchip",
        "description": (
            "Implement a positive-edge triggered JK flip-flop with active-high synchronous reset.\n"
            "- `J=0, K=0`: Hold `q`\n"
            "- `J=0, K=1`: Reset `q <= 0`\n"
            "- `J=1, K=0`: Set `q <= 1`\n"
            "- `J=1, K=1`: Toggle `q <= ~q`"
        ),
        "input_description": "clk, rst — clock and synchronous reset, j, k — control inputs",
        "output_description": "q, q_bar — true and inverted outputs",
        "constraints": "q_bar is always inverted value of q.",
        "starter_code": (
            "module jk_flip_flop (\n"
            "  input  logic clk,\n"
            "  input  logic rst,\n"
            "  input  logic j,\n"
            "  input  logic k,\n"
            "  output logic q,\n"
            "  output logic q_bar\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module jk_flip_flop (\n"
            "  input  logic clk,\n"
            "  input  logic rst,\n"
            "  input  logic j,\n"
            "  input  logic k,\n"
            "  output logic q,\n"
            "  output logic q_bar\n"
            ");\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (rst) q <= 1'b0;\n"
            "    else begin\n"
            "      case ({j, k})\n"
            "        2'b00: q <= q;\n"
            "        2'b01: q <= 1'b0;\n"
            "        2'b10: q <= 1'b1;\n"
            "        2'b11: q <= ~q;\n"
            "      endcase\n"
            "    end\n"
            "  end\n"
            "  assign q_bar = ~q;\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic clk, rst, j, k, q, q_bar;
  jk_flip_flop uut (.clk(clk), .rst(rst), .j(j), .k(k), .q(q), .q_bar(q_bar));
  initial clk = 0; always #5 clk = ~clk;
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic exp_q, input string name);
    total_count++;
    if (q === exp_q && q_bar === ~exp_q) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%b", exp_q);
      $display("HDLFORGE_RECEIVED:%b", q);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    rst = 1; j = 0; k = 0; @(posedge clk); #1; check(1'b0, "Reset");
    rst = 0; j = 1; k = 0; @(posedge clk); #1; check(1'b1, "Set (J=1,K=0)");
    j = 1; k = 1; @(posedge clk); #1; check(1'b0, "Toggle (J=1,K=1)");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "shift-register-4bit",
        "title": "4-Bit Universal Shift Register",
        "difficulty": Difficulty.MEDIUM,
        "category": "Sequential Logic",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Qualcomm, NVIDIA, AMD",
        "description": (
            "Design a 4-bit universal bidirectional shift register with mode control `op[1:0]`:\n"
            "- `op = 2'b00`: Hold current state\n"
            "- `op = 2'b01`: Shift Right (`q <= {d_in, q[3:1]}`)\n"
            "- `op = 2'b10`: Shift Left  (`q <= {q[2:0], d_in}`)\n"
            "- `op = 2'b11`: Parallel Load (`q <= parallel_in[3:0]`)"
        ),
        "input_description": "clk, rst, op[1:0] — control, d_in — serial input, parallel_in[3:0] — parallel data",
        "output_description": "q[3:0] — 4-bit register state",
        "constraints": "Synchronous active-high reset to 0.",
        "starter_code": (
            "module shift_register (\n"
            "  input  logic       clk,\n"
            "  input  logic       rst,\n"
            "  input  logic [1:0] op,\n"
            "  input  logic       d_in,\n"
            "  input  logic [3:0] parallel_in,\n"
            "  output logic [3:0] q\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module shift_register (\n"
            "  input  logic       clk,\n"
            "  input  logic       rst,\n"
            "  input  logic [1:0] op,\n"
            "  input  logic       d_in,\n"
            "  input  logic [3:0] parallel_in,\n"
            "  output logic [3:0] q\n"
            ");\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (rst) q <= 4'b0000;\n"
            "    else begin\n"
            "      case (op)\n"
            "        2'b00: q <= q;\n"
            "        2'b01: q <= {d_in, q[3:1]};\n"
            "        2'b10: q <= {q[2:0], d_in};\n"
            "        2'b11: q <= parallel_in;\n"
            "      endcase\n"
            "    end\n"
            "  end\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic clk, rst, d_in; logic [1:0] op; logic [3:0] parallel_in, q;
  shift_register uut (.clk(clk), .rst(rst), .op(op), .d_in(d_in), .parallel_in(parallel_in), .q(q));
  initial clk = 0; always #5 clk = ~clk;
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic [3:0] exp, input string name);
    total_count++;
    if (q === exp) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%b", exp);
      $display("HDLFORGE_RECEIVED:%b", q);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    rst = 1; op = 0; d_in = 0; parallel_in = 0; @(posedge clk); #1; check(4'b0000, "Reset");
    rst = 0; op = 2'b11; parallel_in = 4'b1010; @(posedge clk); #1; check(4'b1010, "Parallel Load");
    op = 2'b10; d_in = 1; @(posedge clk); #1; check(4'b0101, "Shift Left");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "ring-counter",
        "title": "4-Bit Self-Starting Ring Counter",
        "difficulty": Difficulty.EASY,
        "category": "Sequential Logic",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Intel, Apple",
        "description": (
            "Design a 4-bit synchronous one-hot ring counter.\n"
            "- When reset (`rst = 1`), initialize state to `4'b0001`.\n"
            "- On each clock cycle, rotate the one-hot bit left: `0001 -> 0010 -> 0100 -> 1000 -> 0001`.\n"
            "- Must self-recover to `0001` if entering an invalid non-one-hot state."
        ),
        "input_description": "clk — clock, rst — synchronous active-high reset",
        "output_description": "q[3:0] — one-hot 4-bit state",
        "constraints": "Exactly one bit is active high at any time.",
        "starter_code": (
            "module ring_counter (\n"
            "  input  logic       clk,\n"
            "  input  logic       rst,\n"
            "  output logic [3:0] q\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module ring_counter (\n"
            "  input  logic       clk,\n"
            "  input  logic       rst,\n"
            "  output logic [3:0] q\n"
            ");\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (rst || q == 4'b0000 || (q & (q - 1)) != 0) begin\n"
            "      q <= 4'b0001;\n"
            "    end else begin\n"
            "      q <= {q[2:0], q[3]};\n"
            "    end\n"
            "  end\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic clk, rst; logic [3:0] q;
  ring_counter uut (.clk(clk), .rst(rst), .q(q));
  initial clk = 0; always #5 clk = ~clk;
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic [3:0] exp, input string name);
    total_count++;
    if (q === exp) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%b", exp);
      $display("HDLFORGE_RECEIVED:%b", q);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    rst = 1; @(posedge clk); #1; check(4'b0001, "Reset -> 0001");
    rst = 0; @(posedge clk); #1; check(4'b0010, "Cycle 1 -> 0010");
    @(posedge clk); #1; check(4'b0100, "Cycle 2 -> 0100");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "johnson-counter",
        "title": "4-Bit Twisted Ring Johnson Counter",
        "difficulty": Difficulty.MEDIUM,
        "category": "Sequential Logic",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Qualcomm, AMD",
        "description": (
            "Design a 4-bit Johnson (Moebius) counter. The feedback input is the inverted output "
            "of the last stage (`~q[3]`), creating an 8-state sequence:\n"
            "`0000 -> 1000 -> 1100 -> 1110 -> 1111 -> 0111 -> 0011 -> 0001 -> 0000`.\n"
            "Include self-recovery to `0000` if in any unused state."
        ),
        "input_description": "clk — clock, rst — synchronous reset",
        "output_description": "q[3:0] — Johnson count output",
        "constraints": "8 unique states out of 16.",
        "starter_code": (
            "module johnson_counter (\n"
            "  input  logic       clk,\n"
            "  input  logic       rst,\n"
            "  output logic [3:0] q\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module johnson_counter (\n"
            "  input  logic       clk,\n"
            "  input  logic       rst,\n"
            "  output logic [3:0] q\n"
            ");\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (rst) q <= 4'b0000;\n"
            "    else     q <= {q[2:0], ~q[3]};\n"
            "  end\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic clk, rst; logic [3:0] q;
  johnson_counter uut (.clk(clk), .rst(rst), .q(q));
  initial clk = 0; always #5 clk = ~clk;
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic [3:0] exp, input string name);
    total_count++;
    if (q === exp) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%b", exp);
      $display("HDLFORGE_RECEIVED:%b", q);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    rst = 1; @(posedge clk); #1; check(4'b0000, "Reset -> 0000");
    rst = 0; @(posedge clk); #1; check(4'b0001, "Step 1 -> 0001");
    @(posedge clk); #1; check(4'b0011, "Step 2 -> 0011");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },

    # =========================================================================
    # FINITE STATE MACHINES (9 new)
    # =========================================================================
    {
        "slug": "sequence-detector-1011",
        "title": "Moore FSM 1011 Sequence Detector",
        "difficulty": Difficulty.MEDIUM,
        "category": "Finite State Machines",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "NVIDIA, Apple, Intel",
        "description": (
            "Design a Moore FSM that inspects serial bitstream `x` on each clock edge and detects the "
            "binary sequence `1011` with overlapping allowed.\n"
            "Because this is a Moore FSM, `detected` must be driven purely from the current state register."
        ),
        "input_description": "clk, rst — clock and synchronous reset, x — serial bit input",
        "output_description": "detected — asserted 1 cycle when 1011 completed",
        "constraints": "Moore FSM architecture (output registered). Overlapping allowed.",
        "starter_code": (
            "module seq_detector_1011 (\n"
            "  input  logic clk,\n"
            "  input  logic rst,\n"
            "  input  logic x,\n"
            "  output logic detected\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module seq_detector_1011 (\n"
            "  input  logic clk,\n"
            "  input  logic rst,\n"
            "  input  logic x,\n"
            "  output logic detected\n"
            ");\n"
            "  typedef enum logic [2:0] {S0, S1, S10, S101, S1011} state_t;\n"
            "  state_t state, next_state;\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (rst) state <= S0;\n"
            "    else     state <= next_state;\n"
            "  end\n"
            "  always_comb begin\n"
            "    next_state = state;\n"
            "    case (state)\n"
            "      S0:    next_state = x ? S1 : S0;\n"
            "      S1:    next_state = x ? S1 : S10;\n"
            "      S10:   next_state = x ? S101 : S0;\n"
            "      S101:  next_state = x ? S1011 : S10;\n"
            "      S1011: next_state = x ? S1 : S10;\n"
            "      default: next_state = S0;\n"
            "    endcase\n"
            "  end\n"
            "  assign detected = (state == S1011);\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic clk, rst, x, detected;
  seq_detector_1011 uut (.clk(clk), .rst(rst), .x(x), .detected(detected));
  initial clk = 0; always #5 clk = ~clk;
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic exp, input string name);
    total_count++;
    if (detected === exp) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%b", exp);
      $display("HDLFORGE_RECEIVED:%b", detected);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    rst = 1; x = 0; @(posedge clk); #1; check(1'b0, "Reset");
    rst = 0;
    x = 1; @(posedge clk); #1; check(1'b0, "Bit 1");
    x = 0; @(posedge clk); #1; check(1'b0, "Bit 0");
    x = 1; @(posedge clk); #1; check(1'b0, "Bit 1");
    x = 1; @(posedge clk); #1; check(1'b1, "Bit 1 -> 1011 Detected!");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "sequence-detector-1101",
        "title": "Mealy FSM 1101 Sequence Detector",
        "difficulty": Difficulty.MEDIUM,
        "category": "Finite State Machines",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Google Silicon, AMD",
        "description": (
            "Design a Mealy FSM detecting the sequence `1101` non-overlapping.\n"
            "Because this is a Mealy FSM, `detected` asserts concurrently on the clock cycle where the final bit (1) arrives."
        ),
        "input_description": "clk, rst — clock and reset, x — serial bit input",
        "output_description": "detected — asserted combinational output on completion",
        "constraints": "Mealy FSM architecture. Non-overlapping.",
        "starter_code": (
            "module seq_detector_1101_mealy (\n"
            "  input  logic clk,\n"
            "  input  logic rst,\n"
            "  input  logic x,\n"
            "  output logic detected\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module seq_detector_1101_mealy (\n"
            "  input  logic clk,\n"
            "  input  logic rst,\n"
            "  input  logic x,\n"
            "  output logic detected\n"
            ");\n"
            "  typedef enum logic [1:0] {S0, S1, S11, S110} state_t;\n"
            "  state_t state, next_state;\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (rst) state <= S0;\n"
            "    else     state <= next_state;\n"
            "  end\n"
            "  always_comb begin\n"
            "    next_state = state;\n"
            "    detected = 1'b0;\n"
            "    case (state)\n"
            "      S0: next_state = x ? S1 : S0;\n"
            "      S1: next_state = x ? S11 : S0;\n"
            "      S11: next_state = x ? S11 : S110;\n"
            "      S110: begin\n"
            "        if (x) begin\n"
            "          detected = 1'b1;\n"
            "          next_state = S0; // non-overlapping\n"
            "        end else begin\n"
            "          next_state = S0;\n"
            "        end\n"
            "      end\n"
            "    endcase\n"
            "  end\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic clk, rst, x, detected;
  seq_detector_1101_mealy uut (.clk(clk), .rst(rst), .x(x), .detected(detected));
  initial clk = 0; always #5 clk = ~clk;
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic exp, input string name);
    total_count++;
    if (detected === exp) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%b", exp);
      $display("HDLFORGE_RECEIVED:%b", detected);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    rst = 1; x = 0; @(posedge clk); #1; check(1'b0, "Reset");
    rst = 0;
    x = 1; @(posedge clk); #1;
    x = 1; @(posedge clk); #1;
    x = 0; @(posedge clk); #1;
    x = 1; #1; check(1'b1, "Final bit 1 -> Mealy detected=1");
    @(posedge clk); #1; check(1'b0, "Non-overlapping reset");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "vending-machine-fsm",
        "title": "15-Cent Vending Machine FSM",
        "difficulty": Difficulty.MEDIUM,
        "category": "Finite State Machines",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Intel, Qualcomm",
        "description": (
            "Design an FSM for a vending machine where items cost 15 cents.\n"
            "Accepts nickel (5 cents, `coin_5`) and dime (10 cents, `coin_10`).\n"
            "Outputs item release (`dispense = 1`) and change return (`change_5 = 1`) when 20 cents inserted."
        ),
        "input_description": "clk, rst, coin_5, coin_10 — coin pulses",
        "output_description": "dispense, change_5 — product and change outputs",
        "constraints": "At most one coin inserted per cycle.",
        "starter_code": (
            "module vending_machine (\n"
            "  input  logic clk,\n"
            "  input  logic rst,\n"
            "  input  logic coin_5,\n"
            "  input  logic coin_10,\n"
            "  output logic dispense,\n"
            "  output logic change_5\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module vending_machine (\n"
            "  input  logic clk,\n"
            "  input  logic rst,\n"
            "  input  logic coin_5,\n"
            "  input  logic coin_10,\n"
            "  output logic dispense,\n"
            "  output logic change_5\n"
            ");\n"
            "  typedef enum logic [1:0] {C0, C5, C10, C15} state_t;\n"
            "  state_t state, next_state;\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (rst) state <= C0;\n"
            "    else     state <= next_state;\n"
            "  end\n"
            "  always_comb begin\n"
            "    next_state = state;\n"
            "    dispense = 0;\n"
            "    change_5 = 0;\n"
            "    case (state)\n"
            "      C0: begin\n"
            "        if (coin_5) next_state = C5;\n"
            "        else if (coin_10) next_state = C10;\n"
            "      end\n"
            "      C5: begin\n"
            "        if (coin_5) next_state = C10;\n"
            "        else if (coin_10) begin\n"
            "          dispense = 1;\n"
            "          next_state = C0;\n"
            "        end\n"
            "      end\n"
            "      C10: begin\n"
            "        if (coin_5) begin\n"
            "          dispense = 1;\n"
            "          next_state = C0;\n"
            "        end else if (coin_10) begin\n"
            "          dispense = 1;\n"
            "          change_5 = 1;\n"
            "          next_state = C0;\n"
            "        end\n"
            "      end\n"
            "    endcase\n"
            "  end\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic clk, rst, coin_5, coin_10, dispense, change_5;
  vending_machine uut (.clk(clk), .rst(rst), .coin_5(coin_5), .coin_10(coin_10), .dispense(dispense), .change_5(change_5));
  initial clk = 0; always #5 clk = ~clk;
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic exp_d, input logic exp_c, input string name);
    total_count++;
    if (dispense === exp_d && change_5 === exp_c) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:d=%b,c=%b", exp_d, exp_c);
      $display("HDLFORGE_RECEIVED:d=%b,c=%b", dispense, change_5);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    rst = 1; coin_5 = 0; coin_10 = 0; @(posedge clk); #1; check(0, 0, "Reset");
    rst = 0; coin_10 = 1; @(posedge clk); #1; check(0, 0, "Insert 10c");
    coin_10 = 0; coin_5 = 1; #1; check(1, 0, "Insert 5c -> Dispense!");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "serial-parity-fsm",
        "title": "Serial Bitstream Parity Checker FSM",
        "difficulty": Difficulty.EASY,
        "category": "Finite State Machines",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Apple, ARM",
        "description": (
            "Design a 2-state Moore FSM that streams bit `din` and outputs `even = 1` if the "
            "running tally of 1s received since reset is even (including 0 ones); otherwise `even = 0`."
        ),
        "input_description": "clk, rst, din — clock, reset, serial bit",
        "output_description": "even — high when number of 1s is even",
        "constraints": "Moore FSM.",
        "starter_code": (
            "module serial_parity (\n"
            "  input  logic clk,\n"
            "  input  logic rst,\n"
            "  input  logic din,\n"
            "  output logic even\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module serial_parity (\n"
            "  input  logic clk,\n"
            "  input  logic rst,\n"
            "  input  logic din,\n"
            "  output logic even\n"
            ");\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (rst) even <= 1'b1;\n"
            "    else if (din) even <= ~even;\n"
            "  end\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic clk, rst, din, even;
  serial_parity uut (.clk(clk), .rst(rst), .din(din), .even(even));
  initial clk = 0; always #5 clk = ~clk;
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic exp, input string name);
    total_count++;
    if (even === exp) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%b", exp);
      $display("HDLFORGE_RECEIVED:%b", even);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    rst = 1; din = 0; @(posedge clk); #1; check(1'b1, "Reset -> even=1");
    rst = 0; din = 1; @(posedge clk); #1; check(1'b0, "1 received -> odd (even=0)");
    din = 1; @(posedge clk); #1; check(1'b1, "2nd 1 received -> even=1");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "elevator-controller-fsm",
        "title": "3-Floor Elevator State Controller",
        "difficulty": Difficulty.HARD,
        "category": "Finite State Machines",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Otis, Siemens, Texas Instruments",
        "description": (
            "Design an elevator controller FSM servicing 3 floors (Floors 1, 2, 3).\n"
            "- Target floor button requests are passed in `req[2:0]`.\n"
            "- Outputs `floor[1:0]` (1, 2, or 3) and motor direction `motor[1:0]`:\n"
            "  `2'b00` = IDLE, `2'b01` = UP, `2'b10` = DOWN."
        ),
        "input_description": "clk, rst, req[2:0] — floor call requests",
        "output_description": "floor[1:0] — current floor (1..3), motor[1:0] — motion state",
        "constraints": "Resets to floor 1 IDLE.",
        "starter_code": (
            "module elevator_controller (\n"
            "  input  logic       clk,\n"
            "  input  logic       rst,\n"
            "  input  logic [2:0] req,\n"
            "  output logic [1:0] floor,\n"
            "  output logic [1:0] motor\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module elevator_controller (\n"
            "  input  logic       clk,\n"
            "  input  logic       rst,\n"
            "  input  logic [2:0] req,\n"
            "  output logic [1:0] floor,\n"
            "  output logic [1:0] motor\n"
            ");\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (rst) begin\n"
            "      floor <= 2'd1;\n"
            "      motor <= 2'b00;\n"
            "    end else begin\n"
            "      if (req[2] && floor < 3) begin\n"
            "        floor <= floor + 1;\n"
            "        motor <= 2'b01;\n"
            "      end else if (req[0] && floor > 1) begin\n"
            "        floor <= floor - 1;\n"
            "        motor <= 2'b10;\n"
            "      end else begin\n"
            "        motor <= 2'b00;\n"
            "      end\n"
            "    end\n"
            "  end\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic clk, rst; logic [2:0] req; logic [1:0] floor, motor;
  elevator_controller uut (.clk(clk), .rst(rst), .req(req), .floor(floor), .motor(motor));
  initial clk = 0; always #5 clk = ~clk;
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic [1:0] exp_f, input logic [1:0] exp_m, input string name);
    total_count++;
    if (floor === exp_f && motor === exp_m) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:f=%0d,m=%b", exp_f, exp_m);
      $display("HDLFORGE_RECEIVED:f=%0d,m=%b", floor, motor);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    rst = 1; req = 0; @(posedge clk); #1; check(2'd1, 2'b00, "Reset -> Floor 1 IDLE");
    rst = 0; req = 3'b100; @(posedge clk); #1; check(2'd2, 2'b01, "Req Floor 3 -> Moving UP to 2");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "debouncer-fsm",
        "title": "Pushbutton Glitch Debouncer FSM",
        "difficulty": Difficulty.MEDIUM,
        "category": "Finite State Machines",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Xilinx, Altera, Lattice",
        "description": (
            "Design a digital debouncer FSM that filters bouncy pushbutton inputs.\n"
            "Output `clean_btn` only transitions to 1 after `noisy_btn` has been steadily high for 4 consecutive clock cycles."
        ),
        "input_description": "clk, rst, noisy_btn — noisy input",
        "output_description": "clean_btn — glitch-free debounced signal",
        "constraints": "Filters pulses shorter than 4 clock periods.",
        "starter_code": (
            "module debouncer (\n"
            "  input  logic clk,\n"
            "  input  logic rst,\n"
            "  input  logic noisy_btn,\n"
            "  output logic clean_btn\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module debouncer (\n"
            "  input  logic clk,\n"
            "  input  logic rst,\n"
            "  input  logic noisy_btn,\n"
            "  output logic clean_btn\n"
            ");\n"
            "  logic [1:0] count;\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (rst) begin\n"
            "      count <= 2'b00;\n"
            "      clean_btn <= 1'b0;\n"
            "    end else if (noisy_btn) begin\n"
            "      if (count == 2'd3) clean_btn <= 1'b1;\n"
            "      else count <= count + 1'b1;\n"
            "    end else begin\n"
            "      count <= 2'b00;\n"
            "      clean_btn <= 1'b0;\n"
            "    end\n"
            "  end\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic clk, rst, noisy_btn, clean_btn;
  debouncer uut (.clk(clk), .rst(rst), .noisy_btn(noisy_btn), .clean_btn(clean_btn));
  initial clk = 0; always #5 clk = ~clk;
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic exp, input string name);
    total_count++;
    if (clean_btn === exp) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%b", exp);
      $display("HDLFORGE_RECEIVED:%b", clean_btn);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    rst = 1; noisy_btn = 0; @(posedge clk); #1; check(1'b0, "Reset");
    rst = 0; noisy_btn = 1;
    @(posedge clk); #1; check(1'b0, "Cycle 1 noisy -> 0");
    @(posedge clk); #1; check(1'b0, "Cycle 2 noisy -> 0");
    @(posedge clk); #1; check(1'b0, "Cycle 3 noisy -> 0");
    @(posedge clk); #1; check(1'b1, "Cycle 4 stable -> 1");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "pwm-generator-fsm",
        "title": "Configurable Duty-Cycle PWM Generator",
        "difficulty": Difficulty.MEDIUM,
        "category": "Finite State Machines",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Tesla, TI, Bosch",
        "description": (
            "Design an 8-bit Pulse Width Modulation (PWM) generator.\n"
            "Period is 256 clock cycles. `pwm_out = 1` whenever internal 8-bit free-running counter is `< duty[7:0]`."
        ),
        "input_description": "clk, rst, duty[7:0] — threshold compare register",
        "output_description": "pwm_out — PWM output waveform",
        "constraints": "Duty range 0 to 255.",
        "starter_code": (
            "module pwm_generator (\n"
            "  input  logic       clk,\n"
            "  input  logic       rst,\n"
            "  input  logic [7:0] duty,\n"
            "  output logic       pwm_out\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module pwm_generator (\n"
            "  input  logic       clk,\n"
            "  input  logic       rst,\n"
            "  input  logic [7:0] duty,\n"
            "  output logic       pwm_out\n"
            ");\n"
            "  logic [7:0] counter;\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (rst) begin\n"
            "      counter <= 8'd0;\n"
            "      pwm_out <= 1'b0;\n"
            "    end else begin\n"
            "      counter <= counter + 1'b1;\n"
            "      pwm_out <= (counter < duty);\n"
            "    end\n"
            "  end\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic clk, rst; logic [7:0] duty; logic pwm_out;
  pwm_generator uut (.clk(clk), .rst(rst), .duty(duty), .pwm_out(pwm_out));
  initial clk = 0; always #5 clk = ~clk;
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic exp, input string name);
    total_count++;
    if (pwm_out === exp) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%b", exp);
      $display("HDLFORGE_RECEIVED:%b", pwm_out);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    rst = 1; duty = 8'd128; @(posedge clk); #1; check(1'b0, "Reset");
    rst = 0; @(posedge clk); #1; check(1'b1, "counter=0 < 128 -> High");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "spi-master-fsm",
        "title": "SPI Master Shift Engine FSM",
        "difficulty": Difficulty.HARD,
        "category": "Finite State Machines",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Broadcom, Qualcomm, NXP",
        "description": (
            "Design an 8-bit SPI Master transmit engine (CPOL=0, CPHA=0).\n"
            "- When `start = 1`, pull `cs_n = 0` and serialize `data_in[7:0]` MSB-first out on `mosi` over 8 clock pulses (`sclk`).\n"
            "- After transmitting 8 bits, raise `cs_n = 1` and assert `done = 1` for 1 cycle."
        ),
        "input_description": "clk, rst, start, data_in[7:0] — control & parallel byte",
        "output_description": "sclk, cs_n, mosi, done — SPI bus pins & completion flag",
        "constraints": "MSB first transmission.",
        "starter_code": (
            "module spi_master (\n"
            "  input  logic       clk,\n"
            "  input  logic       rst,\n"
            "  input  logic       start,\n"
            "  input  logic [7:0] data_in,\n"
            "  output logic       sclk,\n"
            "  output logic       cs_n,\n"
            "  output logic       mosi,\n"
            "  output logic       done\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module spi_master (\n"
            "  input  logic       clk,\n"
            "  input  logic       rst,\n"
            "  input  logic       start,\n"
            "  input  logic [7:0] data_in,\n"
            "  output logic       sclk,\n"
            "  output logic       cs_n,\n"
            "  output logic       mosi,\n"
            "  output logic       done\n"
            ");\n"
            "  logic [2:0] bit_cnt;\n"
            "  logic [7:0] shift_reg;\n"
            "  typedef enum logic [1:0] {IDLE, TX, FINISH} state_t;\n"
            "  state_t state;\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (rst) begin\n"
            "      state <= IDLE;\n"
            "      cs_n <= 1'b1;\n"
            "      sclk <= 1'b0;\n"
            "      done <= 1'b0;\n"
            "      bit_cnt <= 3'd0;\n"
            "    end else begin\n"
            "      done <= 1'b0;\n"
            "      case (state)\n"
            "        IDLE: begin\n"
            "          cs_n <= 1'b1;\n"
            "          sclk <= 1'b0;\n"
            "          if (start) begin\n"
            "            shift_reg <= data_in;\n"
            "            cs_n <= 1'b0;\n"
            "            bit_cnt <= 3'd7;\n"
            "            state <= TX;\n"
            "          end\n"
            "        end\n"
            "        TX: begin\n"
            "          mosi <= shift_reg[bit_cnt];\n"
            "          sclk <= ~sclk;\n"
            "          if (sclk) begin\n"
            "            if (bit_cnt == 0) state <= FINISH;\n"
            "            else bit_cnt <= bit_cnt - 1'b1;\n"
            "          end\n"
            "        end\n"
            "        FINISH: begin\n"
            "          cs_n <= 1'b1;\n"
            "          sclk <= 1'b0;\n"
            "          done <= 1'b1;\n"
            "          state <= IDLE;\n"
            "        end\n"
            "      endcase\n"
            "    end\n"
            "  end\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic clk, rst, start; logic [7:0] data_in; logic sclk, cs_n, mosi, done;
  spi_master uut (.clk(clk), .rst(rst), .start(start), .data_in(data_in),
                  .sclk(sclk), .cs_n(cs_n), .mosi(mosi), .done(done));
  initial clk = 0; always #5 clk = ~clk;
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic exp_cs, input string name);
    total_count++;
    if (cs_n === exp_cs) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%b", exp_cs);
      $display("HDLFORGE_RECEIVED:%b", cs_n);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    rst = 1; start = 0; data_in = 8'hA5; @(posedge clk); #1; check(1'b1, "Idle CS=1");
    rst = 0; start = 1; @(posedge clk); #1; check(1'b0, "Start assert CS=0");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "uart-tx-fsm",
        "title": "UART Serial Transmitter FSM (8-N-1)",
        "difficulty": Difficulty.HARD,
        "category": "Finite State Machines",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Apple, Intel, STMicroelectronics",
        "description": (
            "Design an asynchronous serial UART transmitter (8 data bits, no parity, 1 stop bit).\n"
            "- When idle, `tx_line` rests at 1 (MARK).\n"
            "- When `tx_start = 1`, send START bit (0), followed by 8 data bits LSB-first, followed by STOP bit (1).\n"
            "- Assert `tx_busy = 1` during transmission."
        ),
        "input_description": "clk, rst, tx_start, data_byte[7:0] — transmission controls",
        "output_description": "tx_line — serial wire output, tx_busy — active-high busy status",
        "constraints": "Standard 8-N-1 framing.",
        "starter_code": (
            "module uart_tx (\n"
            "  input  logic       clk,\n"
            "  input  logic       rst,\n"
            "  input  logic       tx_start,\n"
            "  input  logic [7:0] data_byte,\n"
            "  output logic       tx_line,\n"
            "  output logic       tx_busy\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module uart_tx (\n"
            "  input  logic       clk,\n"
            "  input  logic       rst,\n"
            "  input  logic       tx_start,\n"
            "  input  logic [7:0] data_byte,\n"
            "  output logic       tx_line,\n"
            "  output logic       tx_busy\n"
            ");\n"
            "  typedef enum logic [1:0] {IDLE, START, DATA, STOP} state_t;\n"
            "  state_t state;\n"
            "  logic [2:0] bit_idx;\n"
            "  logic [7:0] data_buf;\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (rst) begin\n"
            "      state <= IDLE;\n"
            "      tx_line <= 1'b1;\n"
            "      tx_busy <= 1'b0;\n"
            "      bit_idx <= 0;\n"
            "    end else begin\n"
            "      case (state)\n"
            "        IDLE: begin\n"
            "          tx_line <= 1'b1;\n"
            "          tx_busy <= 1'b0;\n"
            "          if (tx_start) begin\n"
            "            data_buf <= data_byte;\n"
            "            tx_line <= 1'b0; // start bit\n"
            "            tx_busy <= 1'b1;\n"
            "            state <= DATA;\n"
            "            bit_idx <= 0;\n"
            "          end\n"
            "        end\n"
            "        DATA: begin\n"
            "          tx_line <= data_buf[bit_idx];\n"
            "          if (bit_idx == 7) state <= STOP;\n"
            "          else bit_idx <= bit_idx + 1'b1;\n"
            "        end\n"
            "        STOP: begin\n"
            "          tx_line <= 1'b1; // stop bit\n"
            "          state <= IDLE;\n"
            "        end\n"
            "      endcase\n"
            "    end\n"
            "  end\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic clk, rst, tx_start; logic [7:0] data_byte; logic tx_line, tx_busy;
  uart_tx uut (.clk(clk), .rst(rst), .tx_start(tx_start), .data_byte(data_byte),
               .tx_line(tx_line), .tx_busy(tx_busy));
  initial clk = 0; always #5 clk = ~clk;
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic exp_line, input logic exp_busy, input string name);
    total_count++;
    if (tx_line === exp_line && tx_busy === exp_busy) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:l=%b,b=%b", exp_line, exp_busy);
      $display("HDLFORGE_RECEIVED:l=%b,b=%b", tx_line, tx_busy);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    rst = 1; tx_start = 0; data_byte = 8'h55; @(posedge clk); #1; check(1'b1, 1'b0, "IDLE line=1");
    rst = 0; tx_start = 1; @(posedge clk); #1; check(1'b0, 1'b1, "START bit=0");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },

    # =========================================================================
    # CHIP DESIGN & MEMORY (8 new)
    # =========================================================================
    {
        "slug": "single-port-ram",
        "title": "16x8 Synchronous Single-Port RAM",
        "difficulty": Difficulty.MEDIUM,
        "category": "Chip Design",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "TSMC, Micron, Intel",
        "description": (
            "Design a 16-word by 8-bit synchronous Single-Port SRAM macro.\n"
            "- When write enable `we = 1`, write `din[7:0]` to memory address `addr[3:0]` on clock edge.\n"
            "- `dout[7:0]` reads memory at `addr[3:0]` on every rising edge."
        ),
        "input_description": "clk, we, addr[3:0], din[7:0] — control, address, data input",
        "output_description": "dout[7:0] — registered synchronous read data",
        "constraints": "16 addresses (4-bit address space), 8-bit word.",
        "starter_code": (
            "module single_port_ram (\n"
            "  input  logic       clk,\n"
            "  input  logic       we,\n"
            "  input  logic [3:0] addr,\n"
            "  input  logic [7:0] din,\n"
            "  output logic [7:0] dout\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module single_port_ram (\n"
            "  input  logic       clk,\n"
            "  input  logic       we,\n"
            "  input  logic [3:0] addr,\n"
            "  input  logic [7:0] din,\n"
            "  output logic [7:0] dout\n"
            ");\n"
            "  logic [7:0] mem [0:15];\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (we) mem[addr] <= din;\n"
            "    dout <= mem[addr];\n"
            "  end\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic clk, we; logic [3:0] addr; logic [7:0] din, dout;
  single_port_ram uut (.clk(clk), .we(we), .addr(addr), .din(din), .dout(dout));
  initial clk = 0; always #5 clk = ~clk;
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic [7:0] exp, input string name);
    total_count++;
    if (dout === exp) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%h", exp);
      $display("HDLFORGE_RECEIVED:%h", dout);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    we = 1; addr = 4'd3; din = 8'hFE; @(posedge clk); #1;
    we = 0; addr = 4'd3; @(posedge clk); #1; check(8'hFE, "Read back addr 3");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "dual-port-ram",
        "title": "True Dual-Port Block RAM (16x8)",
        "difficulty": Difficulty.HARD,
        "category": "Chip Design",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Xilinx, Altera, Intel",
        "description": (
            "Design a 16x8 True Dual-Port Block RAM with independent ports A and B.\n"
            "Each port has its own write enable, address, data input, and data output."
        ),
        "input_description": "clk, we_a, addr_a[3:0], din_a[7:0], we_b, addr_b[3:0], din_b[7:0]",
        "output_description": "dout_a[7:0], dout_b[7:0]",
        "constraints": "Shared 16-word array.",
        "starter_code": (
            "module dual_port_ram (\n"
            "  input  logic       clk,\n"
            "  input  logic       we_a,\n"
            "  input  logic [3:0] addr_a,\n"
            "  input  logic [7:0] din_a,\n"
            "  output logic [7:0] dout_a,\n"
            "  input  logic       we_b,\n"
            "  input  logic [3:0] addr_b,\n"
            "  input  logic [7:0] din_b,\n"
            "  output logic [7:0] dout_b\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module dual_port_ram (\n"
            "  input  logic       clk,\n"
            "  input  logic       we_a,\n"
            "  input  logic [3:0] addr_a,\n"
            "  input  logic [7:0] din_a,\n"
            "  output logic [7:0] dout_a,\n"
            "  input  logic       we_b,\n"
            "  input  logic [3:0] addr_b,\n"
            "  input  logic [7:0] din_b,\n"
            "  output logic [7:0] dout_b\n"
            ");\n"
            "  logic [7:0] mem [0:15];\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (we_a) mem[addr_a] <= din_a;\n"
            "    dout_a <= mem[addr_a];\n"
            "  end\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (we_b) mem[addr_b] <= din_b;\n"
            "    dout_b <= mem[addr_b];\n"
            "  end\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic clk, we_a, we_b; logic [3:0] addr_a, addr_b; logic [7:0] din_a, din_b, dout_a, dout_b;
  dual_port_ram uut (.clk(clk), .we_a(we_a), .addr_a(addr_a), .din_a(din_a), .dout_a(dout_a),
                     .we_b(we_b), .addr_b(addr_b), .din_b(din_b), .dout_b(dout_b));
  initial clk = 0; always #5 clk = ~clk;
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic [7:0] exp, input string name);
    total_count++;
    if (dout_b === exp) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%h", exp);
      $display("HDLFORGE_RECEIVED:%h", dout_b);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    we_a = 1; addr_a = 4'd5; din_a = 8'h3C; we_b = 0; addr_b = 4'd5; @(posedge clk); #1;
    we_a = 0; @(posedge clk); #1; check(8'h3C, "Port A writes, Port B reads");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "rom-16x8",
        "title": "16x8 Synchronous Lookup ROM",
        "difficulty": Difficulty.EASY,
        "category": "Chip Design",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Samsung, SK Hynix",
        "description": (
            "Design a 16x8 Read-Only Memory (ROM) initialized with squares: `mem[i] = i * i` (mod 256).\n"
            "Outputs `dout[7:0]` on rising clock edge for the requested `addr[3:0]`."
        ),
        "input_description": "clk — clock, addr[3:0] — address",
        "output_description": "dout[7:0] — lookup data output",
        "constraints": "Read only.",
        "starter_code": (
            "module rom_16x8 (\n"
            "  input  logic       clk,\n"
            "  input  logic [3:0] addr,\n"
            "  output logic [7:0] dout\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module rom_16x8 (\n"
            "  input  logic       clk,\n"
            "  input  logic [3:0] addr,\n"
            "  output logic [7:0] dout\n"
            ");\n"
            "  always_ff @(posedge clk) begin\n"
            "    dout <= addr * addr;\n"
            "  end\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic clk; logic [3:0] addr; logic [7:0] dout;
  rom_16x8 uut (.clk(clk), .addr(addr), .dout(dout));
  initial clk = 0; always #5 clk = ~clk;
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic [7:0] exp, input string name);
    total_count++;
    if (dout === exp) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%0d", exp);
      $display("HDLFORGE_RECEIVED:%0d", dout);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    addr = 4'd4; @(posedge clk); #1; check(8'd16, "4^2 = 16");
    addr = 4'd7; @(posedge clk); #1; check(8'd49, "7^2 = 49");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "lifo-stack",
        "title": "16-Depth LIFO Hardware Stack",
        "difficulty": Difficulty.MEDIUM,
        "category": "Chip Design",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "ARM, Intel",
        "description": (
            "Implement a 16-element by 8-bit Last-In First-Out (LIFO) stack.\n"
            "- When `push = 1` and not full, store `data_in` onto top of stack.\n"
            "- When `pop = 1` and not empty, pop top element to `data_out`.\n"
            "- Provide status flags `full` and `empty`."
        ),
        "input_description": "clk, rst, push, pop, data_in[7:0]",
        "output_description": "data_out[7:0], full, empty",
        "constraints": "Depth = 16 words.",
        "starter_code": (
            "module lifo_stack (\n"
            "  input  logic       clk,\n"
            "  input  logic       rst,\n"
            "  input  logic       push,\n"
            "  input  logic       pop,\n"
            "  input  logic [7:0] data_in,\n"
            "  output logic [7:0] data_out,\n"
            "  output logic       full,\n"
            "  output logic       empty\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module lifo_stack (\n"
            "  input  logic       clk,\n"
            "  input  logic       rst,\n"
            "  input  logic       push,\n"
            "  input  logic       pop,\n"
            "  input  logic [7:0] data_in,\n"
            "  output logic [7:0] data_out,\n"
            "  output logic       full,\n"
            "  output logic       empty\n"
            ");\n"
            "  logic [7:0] stack [0:15];\n"
            "  logic [4:0] sp;\n"
            "  assign empty = (sp == 0);\n"
            "  assign full  = (sp == 16);\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (rst) begin\n"
            "      sp <= 0;\n"
            "      data_out <= 0;\n"
            "    end else begin\n"
            "      if (push && !full) begin\n"
            "        stack[sp] <= data_in;\n"
            "        sp <= sp + 1'b1;\n"
            "      end else if (pop && !empty) begin\n"
            "        data_out <= stack[sp - 1'b1];\n"
            "        sp <= sp - 1'b1;\n"
            "      end\n"
            "    end\n"
            "  end\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic clk, rst, push, pop; logic [7:0] data_in, data_out; logic full, empty;
  lifo_stack uut (.clk(clk), .rst(rst), .push(push), .pop(pop),
                  .data_in(data_in), .data_out(data_out), .full(full), .empty(empty));
  initial clk = 0; always #5 clk = ~clk;
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic [7:0] exp, input string name);
    total_count++;
    if (data_out === exp) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%h", exp);
      $display("HDLFORGE_RECEIVED:%h", data_out);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    rst = 1; push = 0; pop = 0; data_in = 0; @(posedge clk); #1;
    rst = 0; push = 1; data_in = 8'hA1; @(posedge clk); #1;
    push = 1; data_in = 8'hB2; @(posedge clk); #1;
    push = 0; pop = 1; @(posedge clk); #1; check(8'hB2, "Pop B2 first (LIFO)");
    @(posedge clk); #1; check(8'hA1, "Pop A1 second");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "circular-buffer",
        "title": "Circular Ring Buffer with Overwrite Protection",
        "difficulty": Difficulty.MEDIUM,
        "category": "Chip Design",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Qualcomm, Apple",
        "description": (
            "Design an 8-entry circular ring buffer for streaming DSP samples.\n"
            "- Tracks read pointer `rd_ptr[2:0]` and write pointer `wr_ptr[2:0]`.\n"
            "- Ignores writes when buffer count is 8, ignores reads when count is 0."
        ),
        "input_description": "clk, rst, wr_en, rd_en, wdata[7:0]",
        "output_description": "rdata[7:0], count[3:0]",
        "constraints": "Capacity = 8.",
        "starter_code": (
            "module circular_buffer (\n"
            "  input  logic       clk,\n"
            "  input  logic       rst,\n"
            "  input  logic       wr_en,\n"
            "  input  logic       rd_en,\n"
            "  input  logic [7:0] wdata,\n"
            "  output logic [7:0] rdata,\n"
            "  output logic [3:0] count\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module circular_buffer (\n"
            "  input  logic       clk,\n"
            "  input  logic       rst,\n"
            "  input  logic       wr_en,\n"
            "  input  logic       rd_en,\n"
            "  input  logic [7:0] wdata,\n"
            "  output logic [7:0] rdata,\n"
            "  output logic [3:0] count\n"
            ");\n"
            "  logic [7:0] mem [0:7];\n"
            "  logic [2:0] wr_ptr, rd_ptr;\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (rst) begin\n"
            "      wr_ptr <= 0;\n"
            "      rd_ptr <= 0;\n"
            "      count <= 0;\n"
            "      rdata <= 0;\n"
            "    end else begin\n"
            "      if (wr_en && count < 8) begin\n"
            "        mem[wr_ptr] <= wdata;\n"
            "        wr_ptr <= wr_ptr + 1'b1;\n"
            "        count <= count + 1'b1;\n"
            "      end\n"
            "      if (rd_en && count > 0) begin\n"
            "        rdata <= mem[rd_ptr];\n"
            "        rd_ptr <= rd_ptr + 1'b1;\n"
            "        count <= count - 1'b1;\n"
            "      end\n"
            "    end\n"
            "  end\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic clk, rst, wr_en, rd_en; logic [7:0] wdata, rdata; logic [3:0] count;
  circular_buffer uut (.clk(clk), .rst(rst), .wr_en(wr_en), .rd_en(rd_en),
                       .wdata(wdata), .rdata(rdata), .count(count));
  initial clk = 0; always #5 clk = ~clk;
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic [3:0] exp_cnt, input string name);
    total_count++;
    if (count === exp_cnt) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%0d", exp_cnt);
      $display("HDLFORGE_RECEIVED:%0d", count);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    rst = 1; wr_en = 0; rd_en = 0; wdata = 0; @(posedge clk); #1; check(4'd0, "Reset count=0");
    rst = 0; wr_en = 1; wdata = 8'h11; @(posedge clk); #1; check(4'd1, "Count=1 after write");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "async-fifo-gray",
        "title": "Asynchronous FIFO Gray Pointer Synchronizer",
        "difficulty": Difficulty.HARD,
        "category": "Chip Design",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "NVIDIA, Apple, Qualcomm",
        "description": (
            "Design a 2-flip-flop clock domain crossing (CDC) synchronizer for 4-bit Gray-coded FIFO pointers.\n"
            "Safely samples `async_gray_ptr[3:0]` from the source clock into `dest_clk` without metastability."
        ),
        "input_description": "dest_clk, dest_rst, async_gray_ptr[3:0]",
        "output_description": "sync_gray_ptr[3:0] — synchronized Gray pointer in destination domain",
        "constraints": "Standard 2-FF synchronizer architecture.",
        "starter_code": (
            "module async_gray_sync (\n"
            "  input  logic       dest_clk,\n"
            "  input  logic       dest_rst,\n"
            "  input  logic [3:0] async_gray_ptr,\n"
            "  output logic [3:0] sync_gray_ptr\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module async_gray_sync (\n"
            "  input  logic       dest_clk,\n"
            "  input  logic       dest_rst,\n"
            "  input  logic [3:0] async_gray_ptr,\n"
            "  output logic [3:0] sync_gray_ptr\n"
            ");\n"
            "  logic [3:0] stage1;\n"
            "  always_ff @(posedge dest_clk) begin\n"
            "    if (dest_rst) begin\n"
            "      stage1        <= 4'b0000;\n"
            "      sync_gray_ptr <= 4'b0000;\n"
            "    end else begin\n"
            "      stage1        <= async_gray_ptr;\n"
            "      sync_gray_ptr <= stage1;\n"
            "    end\n"
            "  end\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic dest_clk, dest_rst; logic [3:0] async_gray_ptr, sync_gray_ptr;
  async_gray_sync uut (.dest_clk(dest_clk), .dest_rst(dest_rst),
                       .async_gray_ptr(async_gray_ptr), .sync_gray_ptr(sync_gray_ptr));
  initial dest_clk = 0; always #5 dest_clk = ~dest_clk;
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic [3:0] exp, input string name);
    total_count++;
    if (sync_gray_ptr === exp) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:%b", exp);
      $display("HDLFORGE_RECEIVED:%b", sync_gray_ptr);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    dest_rst = 1; async_gray_ptr = 4'b1100; @(posedge dest_clk); #1; check(4'b0000, "Reset");
    dest_rst = 0; @(posedge dest_clk); #1; // stage 1 captures
    @(posedge dest_clk); #1; check(4'b1100, "2-FF latency synchronized value");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "cam-memory",
        "title": "8-Entry Content Addressable Memory (CAM)",
        "difficulty": Difficulty.HARD,
        "category": "Chip Design",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Cisco, Arista, Juniper",
        "description": (
            "Design an 8-entry by 8-bit Content Addressable Memory (CAM) lookup table.\n"
            "- `search_key[7:0]`: compare against all 8 stored slots in parallel.\n"
            "- If a slot matches, output `hit = 1` and `hit_addr[2:0]` with the matching slot index.\n"
            "- If no slot matches, output `hit = 0`."
        ),
        "input_description": "clk, we, wr_addr[2:0], wr_data[7:0], search_key[7:0]",
        "output_description": "hit, hit_addr[2:0]",
        "constraints": "Single-cycle parallel comparison across all words.",
        "starter_code": (
            "module cam_memory (\n"
            "  input  logic       clk,\n"
            "  input  logic       we,\n"
            "  input  logic [2:0] wr_addr,\n"
            "  input  logic [7:0] wr_data,\n"
            "  input  logic [7:0] search_key,\n"
            "  output logic       hit,\n"
            "  output logic [2:0] hit_addr\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module cam_memory (\n"
            "  input  logic       clk,\n"
            "  input  logic       we,\n"
            "  input  logic [2:0] wr_addr,\n"
            "  input  logic [7:0] wr_data,\n"
            "  input  logic [7:0] search_key,\n"
            "  output logic       hit,\n"
            "  output logic [2:0] hit_addr\n"
            ");\n"
            "  logic [7:0] mem [0:7];\n"
            "  always_ff @(posedge clk) begin\n"
            "    if (we) mem[wr_addr] <= wr_data;\n"
            "  end\n"
            "  always_comb begin\n"
            "    hit = 1'b0;\n"
            "    hit_addr = 3'd0;\n"
            "    for (int i = 0; i < 8; i++) begin\n"
            "      if (mem[i] == search_key) begin\n"
            "        hit = 1'b1;\n"
            "        hit_addr = 3'(i);\n"
            "      end\n"
            "    end\n"
            "  end\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic clk, we; logic [2:0] wr_addr; logic [7:0] wr_data, search_key;
  logic hit; logic [2:0] hit_addr;
  cam_memory uut (.clk(clk), .we(we), .wr_addr(wr_addr), .wr_data(wr_data),
                  .search_key(search_key), .hit(hit), .hit_addr(hit_addr));
  initial clk = 0; always #5 clk = ~clk;
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic exp_h, input logic [2:0] exp_a, input string name);
    total_count++;
    if (hit === exp_h && (hit ? (hit_addr === exp_a) : 1'b1)) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:hit=%b,addr=%0d", exp_h, exp_a);
      $display("HDLFORGE_RECEIVED:hit=%b,addr=%0d", hit, hit_addr);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    we = 1; wr_addr = 3'd4; wr_data = 8'hBE; search_key = 8'h00; @(posedge clk); #1;
    we = 0; search_key = 8'hBE; #1; check(1'b1, 3'd4, "Hit slot 4");
    search_key = 8'hFF; #1; check(1'b0, 3'd0, "Miss FF");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
    {
        "slug": "alu-slice-1bit",
        "title": "1-Bit Modular ALU Bit-Slice",
        "difficulty": Difficulty.MEDIUM,
        "category": "Chip Design",
        "language": Language.SYSTEMVERILOG,
        "company_tags": "Intel, AMD, IBM",
        "description": (
            "Design a 1-bit Standard Cell ALU Slice for bit-sliced processor datapaths.\n"
            "- `op = 2'b00`: AND (`res = a & b`)\n"
            "- `op = 2'b01`: OR  (`res = a | b`)\n"
            "- `op = 2'b10`: XOR (`res = a ^ b`)\n"
            "- `op = 2'b11`: Full Add (`{cout, res} = a + b + cin`)"
        ),
        "input_description": "a, b, cin, op[1:0] — operands and opcode",
        "output_description": "res, cout — bit result and carry out",
        "constraints": "Pure combinational slice.",
        "starter_code": (
            "module alu_slice (\n"
            "  input  logic       a,\n"
            "  input  logic       b,\n"
            "  input  logic       cin,\n"
            "  input  logic [1:0] op,\n"
            "  output logic       res,\n"
            "  output logic       cout\n"
            ");\n\n"
            "  // Your code here\n\n"
            "endmodule"
        ),
        "reference_solution": (
            "module alu_slice (\n"
            "  input  logic       a,\n"
            "  input  logic       b,\n"
            "  input  logic       cin,\n"
            "  input  logic [1:0] op,\n"
            "  output logic       res,\n"
            "  output logic       cout\n"
            ");\n"
            "  always_comb begin\n"
            "    cout = 1'b0;\n"
            "    case (op)\n"
            "      2'b00: res = a & b;\n"
            "      2'b01: res = a | b;\n"
            "      2'b10: res = a ^ b;\n"
            "      2'b11: {cout, res} = a + b + cin;\n"
            "    endcase\n"
            "  end\n"
            "endmodule"
        ),
        "testbench_public": """\
module testbench;
  logic a, b, cin; logic [1:0] op; logic res, cout;
  alu_slice uut (.a(a), .b(b), .cin(cin), .op(op), .res(res), .cout(cout));
  int pass_count = 0; int total_count = 0;
  task automatic check(input logic exp_r, input logic exp_c, input string name);
    total_count++;
    if (res === exp_r && cout === exp_c) begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_TEST_PASS");
      pass_count++;
    end else begin
      $display("HDLFORGE_TEST_NAME:%s", name);
      $display("HDLFORGE_EXPECTED:r=%b,c=%b", exp_r, exp_c);
      $display("HDLFORGE_RECEIVED:r=%b,c=%b", res, cout);
      $display("HDLFORGE_TEST_FAIL");
    end
  endtask
  initial begin
    a = 1; b = 1; cin = 1; op = 2'b11; #1; check(1'b1, 1'b1, "1+1+cin=1 -> res=1,cout=1");
    a = 1; b = 0; cin = 0; op = 2'b00; #1; check(1'b0, 1'b0, "1 & 0 -> res=0");
    $display("HDLFORGE_SCORE:%0d", (pass_count * 100) / total_count);
    $finish;
  end
endmodule""",
    },
]


def seed_full_catalog() -> None:
    db: Session = SessionLocal()
    try:
        added_count = 0
        for pdata in NEW_CATALOG_PROBLEMS:
            existing = db.query(Problem).filter(Problem.slug == pdata["slug"]).first()
            if existing:
                continue

            problem = Problem(
                slug=pdata["slug"],
                title=pdata["title"],
                description=pdata["description"],
                difficulty=pdata["difficulty"],
                category=pdata["category"],
                language=pdata["language"],
                input_description=pdata.get("input_description", ""),
                output_description=pdata.get("output_description", ""),
                constraints=pdata.get("constraints", ""),
                starter_code=pdata["starter_code"],
                reference_solution=pdata.get("reference_solution", ""),
                company_tags=pdata.get("company_tags", ""),
                time_limit=5,
                memory_limit=256,
            )
            db.add(problem)
            db.flush()

            # Add public test case
            tc = TestCase(
                problem_id=problem.id,
                name="Public Tests",
                description="Standard verification suite",
                testbench=pdata["testbench_public"],
                visibility=TestVisibility.PUBLIC,
                weight=1.0,
                execution_order=0,
                enabled=True,
            )
            db.add(tc)
            added_count += 1
            logger.info("Added problem: %s (%s)", problem.slug, problem.category)

        db.commit()
        logger.info("Successfully seeded %d new problems to complete 50-problem catalog!", added_count)
    except Exception as e:
        db.rollback()
        logger.error("Failed seeding full catalog: %s", e)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    seed_full_catalog()
