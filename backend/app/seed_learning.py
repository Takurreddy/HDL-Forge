"""Seed curriculum data for the HDLForge learning system.

Run with: python -m app.seed_learning
"""

import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.database import Base
from app.db.models import (
    Concept,
    Difficulty,
    Language,
    Lesson,
    LessonPrerequisite,
    LessonProgressStatus,
    LearningModule,
    LearningPath,
    Problem,
    ProblemConcept,
    Quiz,
    QuizQuestion,
)


CONCEPTS = [
    {"slug": "and-gate", "name": "AND Gate", "category": "combinational"},
    {"slug": "or-gate", "name": "OR Gate", "category": "combinational"},
    {"slug": "not-gate", "name": "NOT Gate", "category": "combinational"},
    {"slug": "nand-nor", "name": "NAND and NOR Gates", "category": "combinational"},
    {"slug": "xor-xnor", "name": "XOR and XNOR Gates", "category": "combinational"},
    {"slug": "truth-tables", "name": "Truth Tables", "category": "combinational"},
    {"slug": "boolean-expressions", "name": "Boolean Expressions", "category": "combinational"},
    {"slug": "combinational", "name": "Combinational Logic", "category": "combinational"},
    {"slug": "continuous-assignment", "name": "Continuous Assignment", "category": "combinational"},
    {"slug": "always-comb", "name": "always_comb Block", "category": "combinational"},
    {"slug": "mux", "name": "Multiplexers", "category": "combinational"},
    {"slug": "decoder", "name": "Decoders", "category": "combinational"},
    {"slug": "encoder", "name": "Encoders", "category": "combinational"},
    {"slug": "comparator", "name": "Comparators", "category": "combinational"},
    {"slug": "adder", "name": "Adders", "category": "arithmetic"},
    {"slug": "sequential", "name": "Sequential Logic", "category": "sequential"},
    {"slug": "flip-flop", "name": "Flip-Flops", "category": "sequential"},
    {"slug": "register", "name": "Registers", "category": "sequential"},
    {"slug": "counter", "name": "Counters", "category": "sequential"},
    {"slug": "clock", "name": "Clock Signals", "category": "sequential"},
    {"slug": "reset", "name": "Reset Logic", "category": "sequential"},
    {"slug": "always-ff", "name": "always_ff Block", "category": "sequential"},
    {"slug": "binary-arithmetic", "name": "Binary Arithmetic", "category": "arithmetic"},
    {"slug": "signed-unsigned", "name": "Signed vs Unsigned", "category": "arithmetic"},
    {"slug": "alu", "name": "ALU Design", "category": "arithmetic"},
    {"slug": "overflow", "name": "Arithmetic Overflow", "category": "arithmetic"},
    {"slug": "parameterized", "name": "Parameterized Design", "category": "rtl-design"},
    {"slug": "fsm", "name": "Finite State Machines", "category": "fsm"},
    {"slug": "moore-fsm", "name": "Moore FSM", "category": "fsm"},
    {"slug": "mealy-fsm", "name": "Mealy FSM", "category": "fsm"},
    {"slug": "state-encoding", "name": "State Encoding", "category": "fsm"},
    {"slug": "fsm-patterns", "name": "FSM Coding Patterns", "category": "fsm"},
]

PROBLEM_CONCEPT_MAP = {
    "and-gate": ["and-gate", "combinational", "continuous-assignment"],
    "or-gate": ["or-gate", "combinational", "continuous-assignment"],
    "not-gate": ["not-gate", "combinational", "continuous-assignment"],
    "xor-gate": ["xor-xnor", "combinational", "continuous-assignment"],
    "2-to-1-mux": ["mux", "combinational", "continuous-assignment"],
    "half-adder": ["adder", "combinational", "binary-arithmetic"],
    "full-adder": ["adder", "combinational", "binary-arithmetic"],
    "d-flip-flop": ["flip-flop", "sequential", "always-ff", "clock"],
    "4-bit-counter": ["counter", "sequential", "always-ff"],
    "4-bit-alu": ["alu", "arithmetic", "combinational", "parameterized"],
}


def seed_concepts(session: Session):
    for c in CONCEPTS:
        existing = session.query(Concept).filter(Concept.slug == c["slug"]).first()
        if not existing:
            concept = Concept(slug=c["slug"], name=c["name"], category=c["category"])
            session.add(concept)
    session.commit()


def seed_problem_concepts(session: Session):
    for problem_slug, concept_slugs in PROBLEM_CONCEPT_MAP.items():
        problem = session.query(Problem).filter(Problem.slug == problem_slug).first()
        if not problem:
            continue
        for cs in concept_slugs:
            concept = session.query(Concept).filter(Concept.slug == cs).first()
            if not concept:
                continue
            existing = (
                session.query(ProblemConcept)
                .filter(ProblemConcept.problem_id == problem.id, ProblemConcept.concept_id == concept.id)
                .first()
            )
            if not existing:
                session.add(ProblemConcept(problem_id=problem.id, concept_id=concept.id))
    session.commit()


def seed_learning_content(session: Session | None = None) -> None:
    should_close = False
    if session is None:
        from app.db.database import SessionLocal
        session = SessionLocal()
        should_close = True
    try:
        seed_concepts(session)
        seed_problem_concepts(session)
        seed_curriculum(session)
    finally:
        if should_close:
            session.close()


def seed_curriculum(session: Session):
    existing = session.query(LearningPath).filter(LearningPath.slug == "rtl-foundations").first()
    if existing:
        return

    path = LearningPath(
        slug="rtl-foundations",
        title="RTL Foundations",
        description="Master the fundamentals of Register Transfer Level design, from basic digital logic to advanced RTL patterns.",
        difficulty=Difficulty.EASY,
        estimated_hours=40,
    )
    session.add(path)
    session.flush()

    modules_data = _get_modules_data()
    for m_data in modules_data:
        module = LearningModule(
            learning_path_id=path.id,
            slug=m_data["slug"],
            title=m_data["title"],
            description=m_data["description"],
            order_index=m_data["order"],
        )
        session.add(module)
        session.flush()

        for l_data in m_data["lessons"]:
            lesson = Lesson(
                module_id=module.id,
                slug=l_data["slug"],
                title=l_data["title"],
                description=l_data["description"],
                content=l_data["content"],
                order_index=l_data["order"],
                estimated_minutes=l_data.get("minutes", 15),
                difficulty=l_data.get("difficulty", Difficulty.EASY),
            )
            session.add(lesson)
            session.flush()

            if "prerequisites" in l_data:
                for prereq_slug in l_data["prerequisites"]:
                    prereq_lesson = session.query(Lesson).filter(Lesson.slug == prereq_slug).first()
                    if prereq_lesson:
                        session.add(LessonPrerequisite(
                            lesson_id=lesson.id,
                            prerequisite_lesson_id=prereq_lesson.id,
                        ))

            if "quiz" in l_data:
                quiz = Quiz(lesson_id=lesson.id, title=f"Quiz: {l_data['title']}")
                session.add(quiz)
                session.flush()

                for i, q_data in enumerate(l_data["quiz"]):
                    session.add(QuizQuestion(
                        quiz_id=quiz.id,
                        question=q_data["question"],
                        question_type=q_data.get("type", "multiple_choice"),
                        options=json.dumps(q_data["options"]),
                        correct_answer=q_data["answer"],
                        explanation=q_data["explanation"],
                        order_index=i,
                    ))

    session.commit()


def _get_modules_data():
    return [
        {
            "slug": "digital-logic-fundamentals",
            "title": "Digital Logic Fundamentals",
            "description": "Learn the building blocks of all digital circuits: logic gates, truth tables, and Boolean algebra.",
            "order": 0,
            "lessons": [
                {
                    "slug": "what-is-digital-logic",
                    "title": "What is Digital Logic?",
                    "description": "Understanding digital signals and logic levels.",
                    "order": 0,
                    "minutes": 10,
                    "content": """## What is Digital Logic?

Digital logic is the foundation of all modern computing. It deals with signals that have only two possible values: **0** (low/off) and **1** (high/on).

### Why Digital Logic?

- **Reliability**: Digital circuits tolerate noise better than analog circuits
- **Reproducibility**: Same input always produces same output
- **Scalability**: Billions of gates can be integrated on a single chip

### Logic Levels

| Level | Voltage | Binary |
|-------|---------|--------|
| Low | 0V | 0 |
| High | 1.8V-5V | 1 |

### Key Concepts

- **Logic Gate**: A circuit that performs a basic logical operation
- **Boolean Algebra**: Mathematical system for analyzing digital circuits
- **Truth Table**: A table showing all possible input combinations and their outputs

### Example: Simple Digital Signal

```systemverilog
// A digital signal alternates between 0 and 1
module clock_generator (
    output logic clk
);
    initial clk = 0;
    always #5 clk = ~clk;  // Toggle every 5 time units
endmodule
```

In this example, `clk` is a digital signal that alternates between 0 and 1 every 5 time units.""",
                    "quiz": [
                        {"question": "How many possible values does a digital signal have?", "options": ["1", "2", "4", "8"], "answer": "2", "explanation": "Digital signals have exactly two possible values: 0 (low) and 1 (high)."},
                        {"question": "What does a truth table show?", "options": ["Voltage levels", "All input/output combinations", "Power consumption", "Signal timing"], "answer": "All input/output combinations", "explanation": "A truth table lists every possible combination of inputs and their corresponding outputs."},
                    ],
                },
                {
                    "slug": "and-or-not-gates",
                    "title": "AND, OR, NOT Gates",
                    "description": "Master the three fundamental logic gates.",
                    "order": 1,
                    "minutes": 20,
                    "prerequisites": ["what-is-digital-logic"],
                    "content": """## AND, OR, NOT Gates

These three gates form the foundation of all digital logic.

### AND Gate

Output is **1** only when **both** inputs are 1.

| A | B | A AND B |
|---|---|---------|
| 0 | 0 | 0 |
| 0 | 1 | 0 |
| 1 | 0 | 0 |
| 1 | 1 | 1 |

```systemverilog
module and_gate (
    input  logic a,
    input  logic b,
    output logic y
);
    assign y = a & b;
endmodule
```

### OR Gate

Output is **1** when **at least one** input is 1.

| A | B | A OR B |
|---|---|--------|
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 1 |

```systemverilog
module or_gate (
    input  logic a,
    input  logic b,
    output logic y
);
    assign y = a | b;
endmodule
```

### NOT Gate (Inverter)

Output is the **opposite** of the input.

| A | NOT A |
|---|-------|
| 0 | 1 |
| 1 | 0 |

```systemverilog
module not_gate (
    input  logic a,
    output logic y
);
    assign y = ~a;
endmodule
```

### Key Takeaways

- `&` is the AND operator
- `|` is the OR operator
- `~` is the NOT operator
- These operators work on individual bits or vectors""",
                    "quiz": [
                        {"question": "What is the output of an AND gate when A=1 and B=0?", "options": ["0", "1", "Unknown", "Error"], "answer": "0", "explanation": "AND gate outputs 1 only when BOTH inputs are 1. Since B=0, output is 0."},
                        {"question": "Which operator is used for NOT in SystemVerilog?", "options": ["!", "~", "&", "|"], "answer": "~", "explanation": "The tilde (~) is the bitwise NOT operator in SystemVerilog."},
                        {"question": "What is the output of an OR gate when A=0 and B=1?", "options": ["0", "1", "Unknown", "Error"], "answer": "1", "explanation": "OR gate outputs 1 when at least one input is 1. Since B=1, output is 1."},
                    ],
                },
                {
                    "slug": "nand-nor-xor-xnor",
                    "title": "NAND, NOR, XOR, XNOR",
                    "description": "Learn derived logic gates and their applications.",
                    "order": 2,
                    "minutes": 20,
                    "prerequisites": ["and-or-not-gates"],
                    "content": """## NAND, NOR, XOR, XNOR Gates

### NAND Gate (NOT AND)

Output is 0 only when both inputs are 1.

```systemverilog
module nand_gate (
    input  logic a,
    input  logic b,
    output logic y
);
    assign y = ~(a & b);
endmodule
```

### NOR Gate (NOT OR)

Output is 1 only when both inputs are 0.

```systemverilog
module nor_gate (
    input  logic a,
    input  logic b,
    output logic y
);
    assign y = ~(a | b);
endmodule
```

### XOR Gate (Exclusive OR)

Output is 1 when inputs are **different**.

| A | B | A XOR B |
|---|---|---------|
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

```systemverilog
module xor_gate (
    input  logic a,
    input  logic b,
    output logic y
);
    assign y = a ^ b;
endmodule
```

### XNOR Gate (Exclusive NOR)

Output is 1 when inputs are **the same**.

```systemverilog
module xnor_gate (
    input  logic a,
    input  logic b,
    output logic y
);
    assign y = ~(a ^ b);
endmodule
```

### Applications

- **NAND/NOR**: Universal gates - any logic function can be built using only NAND or only NOR
- **XOR**: Parity checking, addition (half adder), encryption
- **XNOR**: Equality comparison, coincidence detection""",
                    "quiz": [
                        {"question": "When does an XOR gate output 1?", "options": ["Both inputs are 1", "Both inputs are 0", "Inputs are different", "Inputs are the same"], "answer": "Inputs are different", "explanation": "XOR outputs 1 when the two inputs have different values."},
                        {"question": "Which gate is considered a universal gate?", "options": ["AND", "OR", "XOR", "NAND"], "answer": "NAND", "explanation": "NAND is a universal gate because any logic function can be implemented using only NAND gates."},
                    ],
                },
                {
                    "slug": "truth-tables-boolean",
                    "title": "Truth Tables and Boolean Expressions",
                    "description": "Analyze and simplify logic circuits using truth tables.",
                    "order": 3,
                    "minutes": 25,
                    "prerequisites": ["nand-nor-xor-xnor"],
                    "content": """## Truth Tables and Boolean Expressions

### Truth Tables

A truth table shows every possible input combination and the corresponding output.

For a 2-input function: 2^2 = 4 rows
For a 3-input function: 2^3 = 8 rows

### Example: Majority Function

The majority function outputs 1 when more than half the inputs are 1.

| A | B | C | Output |
|---|---|---|--------|
| 0 | 0 | 0 | 0 |
| 0 | 0 | 1 | 0 |
| 0 | 1 | 0 | 0 |
| 0 | 1 | 1 | 1 |
| 1 | 0 | 0 | 0 |
| 1 | 0 | 1 | 1 |
| 1 | 1 | 0 | 1 |
| 1 | 1 | 1 | 1 |

Boolean expression: `AB + BC + AC`

### Boolean Algebra Laws

| Law | Expression |
|-----|------------|
| Identity | A + 0 = A, A · 1 = A |
| Null | A + 1 = 1, A · 0 = 0 |
| Idempotent | A + A = A, A · A = A |
| Complement | A + ~A = 1, A · ~A = 0 |
| Commutative | A + B = B + A |
| Associative | (A + B) + C = A + (B + C) |
| Distributive | A · (B + C) = A·B + A·C |

### Simplification

Use Boolean algebra or Karnaugh maps to minimize expressions.

```systemverilog
// Before simplification: y = (a & b) | (a & ~b)
// After simplification:  y = a

module simplified (
    input  logic a, b,
    output logic y
);
    assign y = a;  // b is irrelevant
endmodule
```

### Karnaugh Maps

K-maps help visualize and simplify Boolean expressions for up to 6 variables.

Group adjacent 1s in powers of 2 (1, 2, 4, 8...) to find the simplest expression.""",
                    "quiz": [
                        {"question": "How many rows does a truth table have for 3 inputs?", "options": ["3", "6", "8", "9"], "answer": "8", "explanation": "For n inputs, a truth table has 2^n rows. For 3 inputs: 2^3 = 8 rows."},
                        {"question": "What is A + ~A equal to?", "options": ["0", "1", "A", "~A"], "answer": "1", "explanation": "By the Complement law, a variable OR its complement always equals 1."},
                    ],
                },
            ],
        },
        {
            "slug": "combinational-logic",
            "title": "Combinational Logic",
            "description": "Build circuits where outputs depend only on current inputs: multiplexers, decoders, encoders, and adders.",
            "order": 1,
            "lessons": [
                {
                    "slug": "continuous-assignment",
                    "title": "Continuous Assignment with assign",
                    "description": "Learn the fundamental construct for combinational logic.",
                    "order": 0,
                    "minutes": 15,
                    "prerequisites": ["truth-tables-boolean"],
                    "content": """## Continuous Assignment

The `assign` statement creates combinational logic that continuously evaluates.

### Syntax

```systemverilog
module continuous_example (
    input  logic a, b, c,
    output logic y
);
    // Simple assign
    assign y = a & b;

    // Multi-bit assign
    logic [7:0] data_in;
    logic [7:0] data_out;
    assign data_out = data_in + 8'd1;

    // Conditional (ternary) assign
    assign y = a ? b : c;
endmodule
```

### Rules

1. **Left side** must be a net (wire/logic), not a variable
2. **Right side** can be any expression
3. Updates happen **continuously** - whenever inputs change
4. Multiple assigns to the same net create **multiple drivers** (error!)

### When to Use assign

- Simple combinational expressions
- When you want the output to always follow the input
- For conditional logic (ternary operator)

### Example: 2-input MUX

```systemverilog
module mux2 (
    input  logic a, b, sel,
    output logic y
);
    assign y = sel ? b : a;
endmodule
```

This is the simplest form of a multiplexer: when sel=0, output a; when sel=1, output b.""",
                    "quiz": [
                        {"question": "What happens when inputs change in a continuous assignment?", "options": ["Nothing", "Output updates immediately", "Output updates on clock edge", "Output updates after delay"], "answer": "Output updates immediately", "explanation": "Continuous assignments evaluate and update outputs whenever inputs change."},
                        {"question": "Can you assign to a reg variable using assign?", "options": ["Yes", "No", "Only in always blocks", "Only with #delay"], "answer": "No", "explanation": "assign statements drive nets (wire/logic), not reg variables. Use always blocks for reg variables."},
                    ],
                },
                {
                    "slug": "always-comb",
                    "title": "The always_comb Block",
                    "description": "Use always_comb for complex combinational logic.",
                    "order": 1,
                    "minutes": 20,
                    "prerequisites": ["continuous-assignment"],
                    "content": """## always_comb Block

`always_comb` is used for combinational logic that requires procedural (if/else, case) statements.

### Syntax

```systemverilog
module always_comb_example (
    input  logic [1:0] sel,
    input  logic [3:0] a, b, c, d,
    output logic [3:0] y
);
    always_comb begin
        case (sel)
            2'b00: y = a;
            2'b01: y = b;
            2'b10: y = c;
            2'b11: y = d;
            default: y = 4'b0;
        endcase
    end
endmodule
```

### Key Rules

1. **Sensitivity list** is inferred - all inputs on RHS are automatically included
2. **Must assign** to the output in ALL code paths (no latches!)
3. **No timing** control (#delay, @(posedge))
4. **One block** per signal - don't have multiple always_comb blocks driving the same signal

### Common Mistakes

```systemverilog
// BAD: Incomplete assignment creates a latch
always_comb begin
    if (sel)
        y = a;
    // Missing else - y retains value = LATCH!
end

// GOOD: Complete assignment
always_comb begin
    if (sel)
        y = a;
    else
        y = b;
end
```

### assign vs always_comb

| Feature | assign | always_comb |
|---------|--------|-------------|
| Syntax | Expression only | Procedural (if/else, case) |
| Multiple outputs | Separate statements | Single block |
| Readability | Simple expressions | Complex logic |
| Synthesis | Equivalent | Equivalent |""",
                    "quiz": [
                        {"question": "What happens if you don't assign a value in all code paths of always_comb?", "options": ["Compilation error", "Inferred latch", "Output is 0", "Nothing"], "answer": "Inferred latch", "explanation": "Incomplete assignments in always_comb create latches, which are generally undesirable in combinational logic."},
                        {"question": "Can always_comb contain #delay statements?", "options": ["Yes", "No", "Only at the end", "Only with special syntax"], "answer": "No", "explanation": "always_comb represents purely combinational logic and cannot contain timing controls."},
                    ],
                },
                {
                    "slug": "multiplexers",
                    "title": "Multiplexers",
                    "description": "Build data selectors from simple to parameterized.",
                    "order": 2,
                    "minutes": 25,
                    "prerequisites": ["always-comb"],
                    "content": """## Multiplexers (MUX)

A multiplexer selects one of several inputs based on a selector signal.

### 2:1 MUX

```systemverilog
module mux2to1 (
    input  logic a, b,
    input  logic sel,
    output logic y
);
    assign y = sel ? b : a;
endmodule
```

### 4:1 MUX

```systemverilog
module mux4to1 (
    input  logic [3:0] d,
    input  logic [1:0] sel,
    output logic y
);
    always_comb begin
        case (sel)
            2'b00: y = d[0];
            2'b01: y = d[1];
            2'b10: y = d[2];
            2'b11: y = d[3];
            default: y = 1'b0;
        endcase
    end
endmodule
```

### Parameterized MUX

```systemverilog
module mux_param #(
    parameter WIDTH = 8,
    parameter N = 4
)(
    input  logic [WIDTH-1:0] d [N],
    input  logic [$clog2(N)-1:0] sel,
    output logic [WIDTH-1:0] y
);
    assign y = d[sel];
endmodule
```

### Applications

- **Data selection**: Choose between multiple data sources
- **Function implementation**: Implement any Boolean function
- **Barrel shifter**: Multi-bit MUX for shifting
- **ALU**: Select operation result

### MUX as Logic

Any Boolean function can be implemented as a MUX:
- Connect input variables to selector
- Connect function values to data inputs""",
                    "quiz": [
                        {"question": "How many selector bits are needed for a 4:1 MUX?", "options": ["1", "2", "3", "4"], "answer": "2", "explanation": "A 4:1 MUX has 4 data inputs, requiring log2(4) = 2 selector bits."},
                        {"question": "What is a common use of a parameterized MUX?", "options": ["Only 2:1 selection", "Variable-width data paths", "Clock generation", "Reset logic"], "answer": "Variable-width data paths", "explanation": "Parameterized MUXes can handle different data widths by setting the WIDTH parameter."},
                    ],
                },
                {
                    "slug": "decoders-encoders",
                    "title": "Decoders and Encoders",
                    "description": "Convert between binary and one-hot representations.",
                    "order": 3,
                    "minutes": 20,
                    "prerequisites": ["multiplexers"],
                    "content": """## Decoders and Encoders

### Decoder

A decoder converts an n-bit input to 2^n output lines (one-hot).

```systemverilog
module decoder2to4 (
    input  logic [1:0] sel,
    output logic [3:0] y
);
    always_comb begin
        y = 4'b0;
        y[sel] = 1'b1;
    end
endmodule
```

### Priority Encoder

A priority encoder outputs the position of the highest-priority active input.

```systemverilog
module priority_encoder (
    input  logic [3:0] a,
    output logic [1:0] y,
    output logic valid
);
    always_comb begin
        valid = 1'b1;
        casez (a)
            4'b1???: y = 2'd3;
            4'b01??: y = 2'd2;
            4'b001?: y = 2'd1;
            4'b0001: y = 2'd0;
            default: begin
                y = 2'd0;
                valid = 1'b0;
            end
        endcase
    end
endmodule
```

### Applications

- **Memory addressing**: Select memory locations
- **LED displays**: Drive 7-segment displays
- **Register files**: Select registers for read/write
- **Interrupt handling**: Identify interrupt source""",
                    "quiz": [
                        {"question": "How many output lines does a 3-to-8 decoder have?", "options": ["3", "6", "8", "16"], "answer": "8", "explanation": "A decoder with n inputs has 2^n outputs. For 3 inputs: 2^3 = 8 outputs."},
                    ],
                },
                {
                    "slug": "adders",
                    "title": "Adders",
                    "description": "Build arithmetic circuits from half adders to ripple-carry adders.",
                    "order": 4,
                    "minutes": 25,
                    "prerequisites": ["decoders-encoders"],
                    "content": """## Adders

### Half Adder

Adds two 1-bit numbers, producing sum and carry.

| A | B | Sum | Carry |
|---|---|-----|-------|
| 0 | 0 | 0 | 0 |
| 0 | 1 | 1 | 0 |
| 1 | 0 | 1 | 0 |
| 1 | 1 | 0 | 1 |

```systemverilog
module half_adder (
    input  logic a, b,
    output logic sum, carry
);
    assign sum = a ^ b;
    assign carry = a & b;
endmodule
```

### Full Adder

Adds two 1-bit numbers plus a carry input.

```systemverilog
module full_adder (
    input  logic a, b, cin,
    output logic sum, cout
);
    assign sum = a ^ b ^ cin;
    assign cout = (a & b) | (a & cin) | (b & cin);
endmodule
```

### Ripple Carry Adder

Chains full adders for multi-bit addition.

```systemverilog
module ripple_carry_adder #(
    parameter WIDTH = 4
)(
    input  logic [WIDTH-1:0] a, b,
    input  logic cin,
    output logic [WIDTH-1:0] sum,
    output logic cout
);
    logic [WIDTH:0] carry;
    assign carry[0] = cin;

    genvar i;
    generate
        for (i = 0; i < WIDTH; i++) begin : fa
            full_adder fa_inst (
                .a(a[i]),
                .b(b[i]),
                .cin(carry[i]),
                .sum(sum[i]),
                .cout(carry[i+1])
            );
        end
    endgenerate

    assign cout = carry[WIDTH];
endmodule
```

### Carry Lookahead Adder

Faster than ripple carry by computing carry signals in parallel. Used in high-performance processors.""",
                    "quiz": [
                        {"question": "What is the sum output of a half adder when A=1 and B=1?", "options": ["0", "1", "2", "Error"], "answer": "0", "explanation": "1 + 1 = 10 in binary. Sum is 0, carry is 1."},
                        {"question": "What is the main disadvantage of a ripple carry adder?", "options": ["Uses too many gates", "Slow carry propagation", "Cannot handle signed numbers", "Requires clock"], "answer": "Slow carry propagation", "explanation": "In a ripple carry adder, the carry must propagate through each full adder, causing delay."},
                    ],
                },
            ],
        },
        {
            "slug": "sequential-logic",
            "title": "Sequential Logic",
            "description": "Learn circuits with memory: flip-flops, registers, and counters.",
            "order": 2,
            "lessons": [
                {
                    "slug": "combinational-vs-sequential",
                    "title": "Combinational vs Sequential Logic",
                    "description": "Understand the fundamental difference between the two types.",
                    "order": 0,
                    "minutes": 15,
                    "prerequisites": ["adders"],
                    "content": """## Combinational vs Sequential Logic

### Combinational Logic

- Output depends **only on current inputs**
- No memory of past inputs
- Examples: AND gate, MUX, adder

### Sequential Logic

- Output depends on current inputs **AND past state**
- Has memory elements (flip-flops, latches)
- Examples: Counter, register, FSM

### Why Sequential Logic?

- **Counting**: Track events over time
- **Storage**: Remember values
- **Sequencing**: Execute operations in order
- **State machines**: Implement control logic

### The Clock

Sequential circuits typically use a clock signal to synchronize state changes.

```
Clock:  _|‾|_|‾|_|‾|_|‾|_
State:  ___|‾‾‾‾‾|___|‾‾‾‾‾
```

### Two Main Types

| Feature | Latch | Flip-Flop |
|---------|-------|-----------|
| Trigger | Level-sensitive | Edge-triggered |
| Timing | Transparent during enable | Updates on clock edge |
| Usage | Less common | Preferred in synchronous design |

### In SystemVerilog

- `always_ff`: For flip-flops (sequential logic)
- `always_comb`: For combinational logic
- `always_latch`: For latches (avoid when possible)""",
                    "quiz": [
                        {"question": "What makes sequential logic different from combinational logic?", "options": ["Faster", "Has memory", "Uses fewer gates", "No clock needed"], "answer": "Has memory", "explanation": "Sequential logic has memory elements that store past state, allowing outputs to depend on both current and past inputs."},
                        {"question": "Which is preferred for synchronous design?", "options": ["Latches", "Flip-flops", "Both equally", "Neither"], "answer": "Flip-flops", "explanation": "Edge-triggered flip-flops are preferred because they provide predictable timing and are easier to analyze."},
                    ],
                },
                {
                    "slug": "d-flip-flop",
                    "title": "The D Flip-Flop",
                    "description": "Master the most important sequential building block.",
                    "order": 1,
                    "minutes": 20,
                    "prerequisites": ["combinational-vs-sequential"],
                    "content": """## The D Flip-Flop

The D (Data) flip-flop captures the input value on the clock edge.

### Basic D Flip-Flop

```systemverilog
module d_ff (
    input  logic clk,
    input  logic d,
    output logic q
);
    always_ff @(posedge clk) begin
        q <= d;
    end
endmodule
```

### D Flip-Flop with Reset

```systemverilog
module d_ff_reset (
    input  logic clk,
    input  logic rst_n,  // Active-low reset
    input  logic d,
    output logic q
);
    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            q <= 1'b0;
        else
            q <= d;
    end
endmodule
```

### Key Concepts

- **posedge clk**: Positive (rising) edge of clock
- **negedge rst_n**: Negative (falling) edge of reset
- **<=**: Non-blocking assignment (use in always_ff)
- **Asynchronous reset**: Reset works regardless of clock

### Timing Parameters

- **Setup time (tsu)**: Data must be stable BEFORE clock edge
- **Hold time (th)**: Data must be stable AFTER clock edge
- **Clock-to-Q (tcq)**: Delay from clock edge to output change

### Why D Flip-Flops?

- **Storage**: Stores 1 bit of data
- **Synchronization**: Aligns data to clock domain
- **Pipeline registers**: Separates pipeline stages
- **Edge detection**: Captures events on clock edges""",
                    "quiz": [
                        {"question": "On which clock edge does a standard D flip-flop capture data?", "options": ["Negative edge", "Positive edge", "Both edges", "Level"], "answer": "Positive edge", "explanation": "A standard D flip-flop captures data on the rising (positive) edge of the clock."},
                        {"question": "What is the purpose of the reset signal?", "options": ["Speed up circuit", "Set initial state", "Generate clock", "Reduce power"], "answer": "Set initial state", "explanation": "Reset initializes the flip-flop to a known state (usually 0) when the system starts or needs initialization."},
                    ],
                },
                {
                    "slug": "registers",
                    "title": "Registers",
                    "description": "Group flip-flops to store multi-bit values.",
                    "order": 2,
                    "minutes": 20,
                    "prerequisites": ["d-flip-flop"],
                    "content": """## Registers

A register is a group of flip-flops used to store multi-bit data.

### Simple Register

```systemverilog
module register #(
    parameter WIDTH = 8
)(
    input  logic clk,
    input  logic rst_n,
    input  logic [WIDTH-1:0] d,
    output logic [WIDTH-1:0] q
);
    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            q <= '0;
        else
            q <= d;
    end
endmodule
```

### Register with Enable

```systemverilog
module register_enable #(
    parameter WIDTH = 8
)(
    input  logic clk,
    input  logic rst_n,
    input  logic en,
    input  logic [WIDTH-1:0] d,
    output logic [WIDTH-1:0] q
);
    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            q <= '0;
        else if (en)
            q <= d;
    end
endmodule
```

### Register with Load Control

```systemverilog
module register_load #(
    parameter WIDTH = 8
)(
    input  logic clk,
    input  logic rst_n,
    input  logic load,
    input  logic [WIDTH-1:0] d,
    output logic [WIDTH-1:0] q
);
    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            q <= '0;
        else if (load)
            q <= d;
        // else q retains value (register behavior)
    end
endmodule
```

### Applications

- **Data buffers**: Hold data between pipeline stages
- **Status registers**: Store configuration/status bits
- **Address registers**: Hold memory addresses
- **Counters**: Specialized registers that increment/decrement""",
                    "quiz": [
                        {"question": "What is a register made of?", "options": ["Logic gates only", "Flip-flops", "Memory cells", "Multiplexers"], "answer": "Flip-flops", "explanation": "A register is a group of flip-flops, each storing one bit of data."},
                        {"question": "What does the enable signal do in a register?", "options": ["Resets the register", "Enables data storage", "Generates clock", "Powers down the register"], "answer": "Enables data storage", "explanation": "The enable signal controls when new data is loaded into the register. When disabled, the register retains its current value."},
                    ],
                },
                {
                    "slug": "counters",
                    "title": "Counters",
                    "description": "Build circuits that count events.",
                    "order": 3,
                    "minutes": 25,
                    "prerequisites": ["registers"],
                    "content": """## Counters

Counters are sequential circuits that cycle through a sequence of states.

### Binary Counter

```systemverilog
module counter #(
    parameter WIDTH = 4
)(
    input  logic clk,
    input  logic rst_n,
    output logic [WIDTH-1:0] count
);
    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            count <= '0;
        else
            count <= count + 1'b1;
    end
endmodule
```

### Counter with Enable

```systemverilog
module counter_enable #(
    parameter WIDTH = 4
)(
    input  logic clk,
    input  logic rst_n,
    input  logic en,
    output logic [WIDTH-1:0] count
);
    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            count <= '0;
        else if (en)
            count <= count + 1'b1;
    end
endmodule
```

### Up/Down Counter

```systemverilog
module updown_counter #(
    parameter WIDTH = 4
)(
    input  logic clk,
    input  logic rst_n,
    input  logic up_down,  // 1=up, 0=down
    output logic [WIDTH-1:0] count
);
    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            count <= '0;
        else if (up_down)
            count <= count + 1'b1;
        else
            count <= count - 1'b1;
    end
endmodule
```

### Modulo-N Counter

```systemverilog
module mod_counter #(
    parameter N = 10,
    parameter WIDTH = $clog2(N)
)(
    input  logic clk,
    input  logic rst_n,
    output logic [WIDTH-1:0] count,
    output logic tc  // Terminal count
);
    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            count <= '0;
            tc <= 1'b0;
        end else if (count == N-1) begin
            count <= '0;
            tc <= 1'b1;
        end else begin
            count <= count + 1'b1;
            tc <= 1'b0;
        end
    end
endmodule
```

### Applications

- **Frequency dividers**: Divide clock frequency
- **Event counters**: Count external events
- **Timers**: Generate time delays
- **Address generators**: Sequence through memory addresses""",
                    "quiz": [
                        {"question": "What does a modulo-N counter do when it reaches N-1?", "options": ["Stops counting", "Overflows to 0", "Goes to N", "Resets asynchronously"], "answer": "Overflows to 0", "explanation": "A modulo-N counter counts from 0 to N-1, then wraps around to 0."},
                        {"question": "How many flip-flops are needed for a 4-bit counter?", "options": ["2", "3", "4", "8"], "answer": "4", "explanation": "A 4-bit counter needs 4 flip-flops, one for each bit of the count value."},
                    ],
                },
            ],
        },
        {
            "slug": "arithmetic-rtl",
            "title": "Arithmetic RTL",
            "description": "Implement arithmetic operations in RTL: addition, subtraction, and ALU design.",
            "order": 3,
            "lessons": [
                {
                    "slug": "binary-arithmetic",
                    "title": "Binary Arithmetic",
                    "description": "Fundamentals of binary number representation and operations.",
                    "order": 0,
                    "minutes": 20,
                    "prerequisites": ["counters"],
                    "content": """## Binary Arithmetic

### Number Representation

| System | Base | Digits |
|--------|------|--------|
| Binary | 2 | 0, 1 |
| Decimal | 10 | 0-9 |
| Hexadecimal | 16 | 0-9, A-F |

### Unsigned Binary

Value = sum of (bit × 2^position)

Example: 1011 = 1×8 + 0×4 + 1×2 + 1×1 = 11

### Signed Binary (Two's Complement)

- **MSB** is the sign bit: 0=positive, 1=negative
- To negate: invert all bits and add 1

Example:
- +5 = 0101
- -5 = 1010 + 1 = 1011

### Overflow

When the result exceeds the representable range:
- 4-bit unsigned: 0-15
- 4-bit signed: -8 to +7

```systemverilog
module arithmetic_example (
    input  logic [3:0] a, b,
    output logic [3:0] sum,
    output logic overflow
);
    logic cout;
    assign {cout, sum} = a + b;
    assign overflow = cout;  // Unsigned overflow
endmodule
```

### Common Operations

| Operation | Expression | Notes |
|-----------|------------|-------|
| Add | a + b | Simple addition |
| Subtract | a - b | Or a + (~b + 1) |
| Multiply | a * b | Can be expensive |
| Divide | a / b | Synthesis may warn |
| Modulo | a % b | Use remainder |""",
                    "quiz": [
                        {"question": "What is the two's complement of 0101 (5)?", "options": ["1010", "1011", "1101", "1110"], "answer": "1011", "explanation": "To find two's complement: invert bits (1010) then add 1 (1011). This represents -5."},
                        {"question": "What is the range of a 4-bit signed number?", "options": ["0 to 15", "-8 to 7", "-16 to 15", "-7 to 7"], "answer": "-8 to 7", "explanation": "A 4-bit signed number uses one bit for sign, giving range -(2^3) to (2^3)-1 = -8 to 7."},
                    ],
                },
                {
                    "slug": "alu-design",
                    "title": "ALU Design",
                    "description": "Build an Arithmetic Logic Unit that performs multiple operations.",
                    "order": 1,
                    "minutes": 30,
                    "prerequisites": ["binary-arithmetic"],
                    "content": """## ALU Design

An ALU (Arithmetic Logic Unit) performs multiple arithmetic and logical operations.

### ALU Operations

| Op Code | Operation | Description |
|---------|-----------|-------------|
| 0000 | AND | Bitwise AND |
| 0001 | OR | Bitwise OR |
| 0010 | ADD | Addition |
| 0110 | SUB | Subtraction |
| 0111 | SLT | Set less than |
| 1100 | NOR | Bitwise NOR |

### 4-bit ALU

```systemverilog
module alu #(
    parameter WIDTH = 4
)(
    input  logic [WIDTH-1:0] a, b,
    input  logic [3:0] op,
    output logic [WIDTH-1:0] result,
    output logic zero
);
    always_comb begin
        case (op)
            4'b0000: result = a & b;        // AND
            4'b0001: result = a | b;        // OR
            4'b0010: result = a + b;        // ADD
            4'b0110: result = a - b;        // SUB
            4'b0111: result = {3'b0, $signed(a) < $signed(b)};  // SLT
            4'b1100: result = ~(a | b);     // NOR
            default: result = '0;
        endcase
    end

    assign zero = (result == '0);
endmodule
```

### Design Considerations

1. **Operation set**: Choose which operations to support
2. **Data width**: 32-bit, 64-bit, or parameterized
3. **Flags**: Zero, carry, overflow, negative
4. **Performance**: Critical path through ALU affects clock speed

### Parameterized ALU

```systemverilog
module alu_param #(
    parameter WIDTH = 8
)(
    input  logic [WIDTH-1:0] a, b,
    input  logic [2:0] op,
    output logic [WIDTH-1:0] result
);
    always_comb begin
        case (op)
            3'b000: result = a + b;
            3'b001: result = a - b;
            3'b010: result = a & b;
            3'b011: result = a | b;
            3'b100: result = a ^ b;
            3'b101: result = ~a;
            3'b110: result = a << 1;
            3'b111: result = a >> 1;
            default: result = '0;
        endcase
    end
endmodule
```""",
                    "quiz": [
                        {"question": "What does the zero flag indicate in an ALU?", "options": ["No input", "Result is zero", "No operation", "Overflow occurred"], "answer": "Result is zero", "explanation": "The zero flag is set when the ALU result equals zero, useful for comparison operations."},
                        {"question": "Which operation does SLT perform?", "options": ["Shift left", "Set less than", "Subtract lower", "Select lowest"], "answer": "Set less than", "explanation": "SLT (Set Less Than) outputs 1 if the first operand is less than the second (signed comparison)."},
                    ],
                },
            ],
        },
        {
            "slug": "fsm-fundamentals",
            "title": "FSM Fundamentals",
            "description": "Master Finite State Machines - the backbone of digital control logic.",
            "order": 4,
            "lessons": [
                {
                    "slug": "what-is-fsm",
                    "title": "What is an FSM?",
                    "description": "Introduction to finite state machines and their applications.",
                    "order": 0,
                    "minutes": 20,
                    "prerequisites": ["alu-design"],
                    "content": """## What is an FSM?

A Finite State Machine (FSM) is a sequential circuit that transitions between a finite number of states based on inputs.

### Components

1. **States**: A finite set of unique conditions
2. **Inputs**: Signals that affect state transitions
3. **Outputs**: Signals produced in each state
4. **Transitions**: Rules for moving between states

### State Diagram

```
    ┌─────────┐
    │  RESET  │
    └────┬────┘
         │ start
         ▼
    ┌─────────┐     done     ┌─────────┐
    │  STATE_A │─────────────│  STATE_B │
    └─────────┘              └─────────┘
         ▲                         │
         │         reset           │
         └─────────────────────────┘
```

### Types of FSMs

| Type | Output Depends On | Example |
|------|-------------------|---------|
| Moore | Current state only | Traffic light controller |
| Mealy | Current state AND inputs | UART receiver |

### FSM Design Steps

1. **Define states**: List all possible states
2. **Draw state diagram**: Show transitions
3. **Assign binary codes**: Encode states
4. **Write HDL**: Implement in SystemVerilog
5. **Verify**: Test all transitions

### Applications

- **Protocol controllers**: SPI, I2C, UART
- **Bus arbiters**: AMBA, Wishbone
- **Game logic**: Simple game states
- **Control units**: CPU control, memory controllers""",
                    "quiz": [
                        {"question": "What are the three main components of an FSM?", "options": ["Clock, reset, enable", "States, inputs, outputs", "Registers, MUX, ALU", "Input, process, output"], "answer": "States, inputs, outputs", "explanation": "An FSM consists of states, inputs that trigger transitions, and outputs produced in each state."},
                        {"question": "In a Moore FSM, outputs depend on:", "options": ["Inputs only", "Current state only", "Both state and inputs", "Clock edge"], "answer": "Current state only", "explanation": "In a Moore FSM, outputs are determined solely by the current state, making timing more predictable."},
                    ],
                },
                {
                    "slug": "moore-fsm",
                    "title": "Moore FSM Implementation",
                    "description": "Build a complete Moore FSM in SystemVerilog.",
                    "order": 1,
                    "minutes": 25,
                    "prerequisites": ["what-is-fsm"],
                    "content": """## Moore FSM Implementation

In a Moore FSM, outputs depend only on the current state.

### Traffic Light Controller

```systemverilog
module traffic_light (
    input  logic clk,
    input  logic rst_n,
    output logic [2:0] light  // {red, yellow, green}
);
    typedef enum logic [1:0] {
        RED,
        GREEN,
        YELLOW
    } state_t;

    state_t state, next_state;
    logic [2:0] timer;

    // State register
    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= RED;
            timer <= 3'd5;
        end else begin
            state <= next_state;
            if (timer == 0)
                timer <= 3'd5;
            else
                timer <= timer - 1;
        end
    end

    // Next state logic
    always_comb begin
        case (state)
            RED: begin
                if (timer == 0)
                    next_state = GREEN;
                else
                    next_state = RED;
            end
            GREEN: begin
                if (timer == 0)
                    next_state = YELLOW;
                else
                    next_state = GREEN;
            end
            YELLOW: begin
                if (timer == 0)
                    next_state = RED;
                else
                    next_state = YELLOW;
            end
            default: next_state = RED;
        endcase
    end

    // Output logic (Moore: depends only on state)
    always_comb begin
        case (state)
            RED:    light = 3'b100;
            GREEN:  light = 3'b001;
            YELLOW: light = 3'b010;
            default: light = 3'b000;
        endcase
    end
endmodule
```

### Moore FSM Template

```systemverilog
module moore_fsm (
    input  logic clk,
    input  logic rst_n,
    input  logic start, done,
    output logic ready, valid
);
    // 1. State encoding
    typedef enum logic [1:0] {
        IDLE, COMPUTE, DONE_ST
    } state_t;

    state_t state, next_state;

    // 2. State register
    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            state <= IDLE;
        else
            state <= next_state;
    end

    // 3. Next state logic
    always_comb begin
        case (state)
            IDLE:    next_state = start ? COMPUTE : IDLE;
            COMPUTE: next_state = done ? DONE_ST : COMPUTE;
            DONE_ST: next_state = IDLE;
            default: next_state = IDLE;
        endcase
    end

    // 4. Output logic
    always_comb begin
        ready = (state == IDLE);
        valid = (state == DONE_ST);
    end
endmodule
```""",
                    "quiz": [
                        {"question": "In the traffic light example, what triggers state transitions?", "options": ["Button press", "Timer reaching zero", "Random events", "External sensors"], "answer": "Timer reaching zero", "explanation": "The traffic light transitions when its timer counts down to zero, spending a fixed time in each state."},
                        {"question": "What is the purpose of the next_state logic?", "options": ["Generates outputs", "Determines state transitions", "Resets the FSM", "Controls timing"], "answer": "Determines state transitions", "explanation": "The next_state logic computes what the next state should be based on current state and inputs."},
                    ],
                },
                {
                    "slug": "mealy-fsm",
                    "title": "Mealy FSM Implementation",
                    "description": "Build a Mealy FSM where outputs depend on inputs too.",
                    "order": 2,
                    "minutes": 25,
                    "prerequisites": ["moore-fsm"],
                    "content": """## Mealy FSM Implementation

In a Mealy FSM, outputs depend on both the current state AND current inputs.

### Sequence Detector (101)

```systemverilog
module sequence_detector (
    input  logic clk,
    input  logic rst_n,
    input  logic din,
    output logic dout
);
    typedef enum logic [1:0] {
        S0,  // No match
        S1,  // Seen "1"
        S2   // Seen "10"
    } state_t;

    state_t state, next_state;

    // State register
    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            state <= S0;
        else
            state <= next_state;
    end

    // Next state logic
    always_comb begin
        case (state)
            S0: next_state = din ? S1 : S0;
            S1: next_state = din ? S1 : S2;
            S2: next_state = din ? S1 : S0;
            default: next_state = S0;
        endcase
    end

    // Output logic (Mealy: depends on state AND input)
    always_comb begin
        dout = (state == S2) && din;  // Output 1 when in S2 and din=1
    end
endmodule
```

### Moore vs Mealy Comparison

| Feature | Moore | Mealy |
|---------|-------|-------|
| Output depends on | State only | State + Inputs |
| Response time | 1 clock cycle | Immediate |
| Glitch sensitivity | Less | More |
| Number of states | Often more | Often fewer |

### When to Use Mealy

- **Fast response needed**: Output changes immediately with input
- **Fewer states**: Can reduce state count
- **Protocol handlers**: Where timing is critical

### When to Use Moore

- **Clean outputs**: No glitches from input changes
- **Simpler timing**: Output changes only on clock edge
- **Default choice**: Generally preferred unless Mealy is necessary""",
                    "quiz": [
                        {"question": "What is the main difference between Moore and Mealy FSMs?", "options": ["Number of states", "Output depends on inputs", "Clock usage", "Reset type"], "answer": "Output depends on inputs", "explanation": "In Mealy FSMs, outputs are a function of both the current state and current inputs, unlike Moore where outputs depend only on state."},
                        {"question": "Why might a Mealy FSM have fewer states than a Moore FSM?", "options": ["Uses more flip-flops", "Outputs can respond immediately to inputs", "Has simpler logic", "Doesn't need a clock"], "answer": "Outputs can respond immediately to inputs", "explanation": "Mealy outputs can change with inputs within a state, potentially eliminating the need for extra states to handle output timing."},
                    ],
                },
            ],
        },
        {
            "slug": "memories-and-storage",
            "title": "Memories and Storage",
            "description": "Understand different memory technologies: registers, SRAM, and ROM for storing data in digital systems.",
            "order": 5,
            "lessons": [
                {
                    "slug": "registers-vs-memory",
                    "title": "Registers vs Memory",
                    "description": "Learn when to use registers versus memory blocks.",
                    "order": 0,
                    "minutes": 15,
                    "prerequisites": ["mealy-fsm"],
                    "content": """## Registers vs Memory

### Register File

A register file is a small, fast array of registers with multiple read and write ports.

```systemverilog
module register_file #(
    parameter WIDTH = 32,
    parameter DEPTH = 8
)(
    input  logic clk,
    input  logic we,
    input  logic [$clog2(DEPTH)-1:0] raddr1, raddr2, waddr,
    input  logic [WIDTH-1:0] wdata,
    output logic [WIDTH-1:0] rdata1, rdata2
);
    logic [WIDTH-1:0] regs [DEPTH];

    always_ff @(posedge clk) begin
        if (we)
            regs[waddr] <= wdata;
    end

    assign rdata1 = regs[raddr1];
    assign rdata2 = regs[raddr2];
endmodule
```

### Memory Hierarchy

| Element | Speed | Size | Cost |
|---------|-------|------|------|
| Registers | Fastest | Small (8-64 bits) | High per bit |
| SRAM | Fast | Medium (KB-MB) | Medium per bit |
| DRAM | Slower | Large (GB) | Low per bit |
| Disk/SSD | Slowest | Very Large | Lowest per bit |

### When to Use Registers

- Small data (8-64 bits)
- Need all bits accessible simultaneously (parallel access)
- High-speed operation required
- Control/status storage

### When to Use Memory

- Large data arrays (kilobytes or more)
- Sequential or burst access patterns
- Area constraints
- Lower speed acceptable

### Common Mistakes

- Using memory for small data (wastes area and power)
- Using registers for large arrays (cannot synthesize efficiently)
- Ignoring read/write port limitations of memory""",
                    "quiz": [
                        {"question": "Which is faster: a register file or SRAM?", "options": ["SRAM", "Register file", "Same speed", "Depends on size"], "answer": "Register file", "explanation": "Register files are built from flip-flops and provide the fastest access, but occupy more area per bit than SRAM."},
                        {"question": "For a 128-bit data path, which storage is most appropriate?", "options": ["DRAM", "Register file", "SSD", "Hard drive"], "answer": "Register file", "explanation": "128 bits is small enough for a register file, which provides the speed and parallel access needed for data paths."},
                    ],
                },
                {
                    "slug": "ram",
                    "title": "RAM",
                    "description": "Implement synchronous RAM with read and write ports.",
                    "order": 1,
                    "minutes": 20,
                    "prerequisites": ["registers-vs-memory"],
                    "content": """## RAM (Random Access Memory)

### SRAM vs DRAM

| Feature | SRAM | DRAM |
|---------|------|------|
| Storage | Flip-flop pair | Capacitor |
| Refresh | Not needed | Required |
| Speed | Faster | Slower |
| Density | Lower | Higher |
| Use | Cache, registers | Main memory |

### Single-Port RAM

```systemverilog
module ram_sp #(
    parameter WIDTH = 8,
    parameter DEPTH = 256
)(
    input  logic clk,
    input  logic we,
    input  logic [$clog2(DEPTH)-1:0] addr,
    input  logic [WIDTH-1:0] wdata,
    output logic [WIDTH-1:0] rdata
);
    logic [WIDTH-1:0] mem [DEPTH];

    always_ff @(posedge clk) begin
        if (we)
            mem[addr] <= wdata;
        rdata <= mem[addr];
    end
endmodule
```

### Simple Dual-Port RAM

```systemverilog
module ram_sdp #(
    parameter WIDTH = 8,
    parameter DEPTH = 256
)(
    input  logic clk,
    input  logic we,
    input  logic [$clog2(DEPTH)-1:0] waddr, raddr,
    input  logic [WIDTH-1:0] wdata,
    output logic [WIDTH-1:0] rdata
);
    logic [WIDTH-1:0] mem [DEPTH];

    always_ff @(posedge clk) begin
        if (we)
            mem[waddr] <= wdata;
        rdata <= mem[raddr];
    end
endmodule
```

### True Dual-Port RAM

```systemverilog
module ram_tdp #(
    parameter WIDTH = 8,
    parameter DEPTH = 256
)(
    input  logic clk,
    input  logic wea, web,
    input  logic [$clog2(DEPTH)-1:0] addra, addrb,
    input  logic [WIDTH-1:0] dia, dib,
    output logic [WIDTH-1:0] doa, dob
);
    logic [WIDTH-1:0] mem [DEPTH];

    always_ff @(posedge clk) begin
        if (wea) mem[addra] <= dia;
        if (web) mem[addrb] <= dib;
        doa <= mem[addra];
        dob <= mem[addrb];
    end
endmodule
```

### Read-Write Ports

| Type | Read Ports | Write Ports | Use Case |
|------|------------|-------------|----------|
| Single-Port | 1 | 1 | Simple storage |
| Simple Dual-Port | 1 (separate) | 1 (separate) | FIFO, buffers |
| True Dual-Port | 2 | 2 | Dual-clock systems |
| Multi-Port | N | M | Register files |""",
                    "quiz": [
                        {"question": "What is the key difference between SRAM and DRAM?", "options": ["SRAM needs refresh, DRAM does not", "DRAM needs refresh, SRAM does not", "SRAM is slower", "DRAM uses flip-flops"], "answer": "DRAM needs refresh, SRAM does not", "explanation": "DRAM stores data in capacitors that leak charge and must be periodically refreshed. SRAM uses flip-flop pairs that maintain state without refresh."},
                        {"question": "In a single-port RAM, can you read and write simultaneously?", "options": ["Yes, always", "No, only one operation per cycle", "Only on different addresses", "Only if clock is fast enough"], "answer": "No, only one operation per cycle", "explanation": "Single-port RAM has one address port shared for read and write, so only one operation can occur per clock cycle."},
                    ],
                },
                {
                    "slug": "rom",
                    "title": "ROM",
                    "description": "Implement read-only memory for constant data storage.",
                    "order": 2,
                    "minutes": 15,
                    "prerequisites": ["ram"],
                    "content": """## ROM (Read-Only Memory)

### ROM Types

| Type | Programmability | Use Case |
|------|-----------------|----------|
| Mask ROM | Fixed at manufacturing | High-volume products |
| PROM | One-time programmable | Prototyping |
| EPROM | UV-erasable | Development |
| EEPROM | Electrically erasable | Firmware storage |
| Flash | Block-erasable | Storage, boot ROM |

### Simple ROM Implementation

```systemverilog
module rom #(
    parameter WIDTH = 8,
    parameter DEPTH = 16
)(
    input  logic [$clog2(DEPTH)-1:0] addr,
    output logic [WIDTH-1:0] data
);
    logic [WIDTH-1:0] mem [DEPTH];

    initial begin
        mem[0]  = 8'hA5;
        mem[1]  = 8'h3C;
        mem[2]  = 8'hFF;
        mem[3]  = 8'h00;
        // Initialize other locations
    end

    assign data = mem[addr];
endmodule
```

### ROM with Initialization File

```systemverilog
module rom_file #(
    parameter WIDTH = 8,
    parameter DEPTH = 256
)(
    input  logic [$clog2(DEPTH)-1:0] addr,
    output logic [WIDTH-1:0] data
);
    logic [WIDTH-1:0] mem [DEPTH];

    initial $readmemh("rom_data.hex", mem);

    assign data = mem[addr];
endmodule
```

### Lookup Table (LUT) ROM

```systemverilog
module sin_rom (
    input  logic [7:0] angle,
    output logic [15:0] sin_val
);
    logic [15:0] lut [256];

    initial begin
        lut[0]   = 16'h0000;  // sin(0) = 0
        lut[64]  = 16'h4000;  // sin(90°) = 1.0
        lut[128] = 16'h0000;  // sin(180°) = 0
        lut[192] = 16'hC000;  // sin(270°) = -1.0
        // Fill full table
    end

    assign sin_val = lut[angle];
endmodule
```

### Key Concepts

- **Combinational ROM**: Output is function of address (no clock)
- **Synchronous ROM**: Output registered for better timing
- **Initialization**: Use `initial` block or `$readmemh`
- **Synthesis**: ROM infers block RAM or LUTs depending on size

### Common Mistakes

- Forgetting to initialize ROM contents (undefined behavior)
- Using too large a ROM (consumes too many LUTs)
- Not considering timing for combinational ROM in pipelines""",
                    "quiz": [
                        {"question": "What is the main advantage of using $readmemh for ROM initialization?", "options": ["Faster access", "Code is cleaner and data can be external", "Uses less memory", "Supports more addresses"], "answer": "Code is cleaner and data can be external", "explanation": "$readmemh loads data from an external file, keeping the HDL code clean and allowing data to be maintained separately."},
                        {"question": "Can ROM be inferred as block RAM by synthesis tools?", "options": ["Never", "Only if synchronous", "Only if asynchronous", "Always"], "answer": "Only if synchronous", "explanation": "Synchronous ROM (with clocked output) can be mapped to block RAM. Combinational ROM typically uses LUTs."},
                    ],
                },
            ],
        },
        {
            "slug": "rtl-design-patterns",
            "title": "RTL Design Patterns",
            "description": "Master reusable design patterns: parameterization, shift registers, and pipelining.",
            "order": 6,
            "lessons": [
                {
                    "slug": "parameterization",
                    "title": "Parameterization",
                    "description": "Create flexible, reusable modules with parameters.",
                    "order": 0,
                    "minutes": 15,
                    "prerequisites": ["rom"],
                    "content": """## Parameterization

### Parameter vs Localparam

| Feature | parameter | localparam |
|---------|-----------|------------|
| Override | Can be overridden at instantiation | Cannot be overridden |
| Scope | Module port-like | Internal constant |
| Use | Configurable values | Derived constants |

### Module Parameters

```systemverilog
module adder #(
    parameter WIDTH = 8
)(
    input  logic [WIDTH-1:0] a, b,
    output logic [WIDTH:0] sum
);
    assign sum = a + b;
endmodule
```

### Parameter Override

```systemverilog
module top;
    logic [7:0]  sum8;
    logic [15:0] sum16;

    adder #(.WIDTH(8))  u_adder8  (.a(8'd5), .b(8'd3), .sum(sum8));
    adder #(.WIDTH(16)) u_adder16 (.a(16'd100), .b(16'd200), .sum(sum16));
endmodule
```

### $clog2 for Address Width

```systemverilog
module param_mux #(
    parameter N = 4
)(
    input  logic [$clog2(N)-1:0] sel,
    input  logic [N-1:0] din,
    output logic y
);
    assign y = din[sel];
endmodule
```

### Derived Parameters

```systemverilog
module fifo #(
    parameter DATA_WIDTH = 8,
    parameter DEPTH = 16
)(
    input  logic clk,
    input  logic rst_n,
    input  logic wr_en,
    input  logic [DATA_WIDTH-1:0] wdata,
    output logic [DATA_WIDTH-1:0] rdata,
    output logic full,
    output logic empty
);
    localparam ADDR_WIDTH = $clog2(DEPTH);

    logic [DATA_WIDTH-1:0] mem [DEPTH];
    logic [ADDR_WIDTH:0] wptr, rptr;

    // FIFO logic using derived parameters
endmodule
```

### Best Practices

- Use `parameter` for configurable values
- Use `localparam` for derived constants
- Always provide default values
- Document parameter meanings in comments""",
                    "quiz": [
                        {"question": "What is the difference between parameter and localparam?", "options": ["No difference", "parameter can be overridden at instantiation, localparam cannot", "localparam is faster", "parameter is only for ports"], "answer": "parameter can be overridden at instantiation, localparam cannot", "explanation": "Parameters can be overridden when instantiating a module, while localparams are internal constants that cannot be changed."},
                        {"question": "What does $clog2(N) return?", "options": ["N/2", "Log base 2 of N", "N squared", "Square root of N"], "answer": "Log base 2 of N", "explanation": "$clog2 returns the ceiling of the logarithm base 2, commonly used to calculate address width needed for N locations."},
                    ],
                },
                {
                    "slug": "shift-registers",
                    "title": "Shift Registers",
                    "description": "Build serial-in serial-out, parallel-in serial-out, and barrel shifters.",
                    "order": 1,
                    "minutes": 20,
                    "prerequisites": ["parameterization"],
                    "content": """## Shift Registers

### Serial-In Serial-Out (SISO)

```systemverilog
module siso #(
    parameter WIDTH = 8
)(
    input  logic clk,
    input  logic rst_n,
    input  logic sin,
    output logic sout
);
    logic [WIDTH-1:0] shift_reg;

    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            shift_reg <= '0;
        else
            shift_reg <= {shift_reg[WIDTH-2:0], sin};
    end

    assign sout = shift_reg[WIDTH-1];
endmodule
```

### Parallel-In Serial-Out (PISO)

```systemverilog
module piso #(
    parameter WIDTH = 8
)(
    input  logic clk,
    input  logic rst_n,
    input  logic load,
    input  logic [WIDTH-1:0] parallel_in,
    output logic serial_out
);
    logic [WIDTH-1:0] shift_reg;

    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            shift_reg <= '0;
        else if (load)
            shift_reg <= parallel_in;
        else
            shift_reg <= {shift_reg[WIDTH-2:0], 1'b0};
    end

    assign serial_out = shift_reg[WIDTH-1];
endmodule
```

### Barrel Shifter

```systemverilog
module barrel_shifter #(
    parameter WIDTH = 8
)(
    input  logic [WIDTH-1:0] din,
    input  logic [$clog2(WIDTH)-1:0] shift,
    input  logic direction,  // 0=left, 1=right
    output logic [WIDTH-1:0] dout
);
    logic [WIDTH-1:0] temp;

    always_comb begin
        if (direction)
            temp = din >> shift;
        else
            temp = din << shift;
    end

    assign dout = temp;
endmodule
```

### Applications

| Type | Application |
|------|-------------|
| SISO | Data transmission, delay lines |
| SIPO | Serial-to-parallel conversion |
| PISO | Parallel-to-serial conversion |
| Barrel Shifter | Multiplication/division by powers of 2 |

### Common Mistakes

- Forgetting reset value for shift register
- Off-by-one in shift amount calculation
- Not considering signed vs unsigned shift for arithmetic""",
                    "quiz": [
                        {"question": "What does a barrel shifter do?", "options": ["Stores data", "Shifts data by a variable amount in one cycle", "Converts serial to parallel", "Counts events"], "answer": "Shifts data by a variable amount in one cycle", "explanation": "A barrel shifter can shift (or rotate) data by any amount in a single clock cycle using a multi-stage MUX network."},
                        {"question": "In a PISO shift register, what does the 'load' signal do?", "options": ["Clears the register", "Loads parallel data into the shift register", "Enables clock", "Resets the counter"], "answer": "Loads parallel data into the shift register", "explanation": "The load signal captures the parallel input data into the shift register, after which it can be shifted out serially."},
                    ],
                },
                {
                    "slug": "pipelines",
                    "title": "Pipelines",
                    "description": "Improve throughput by inserting pipeline registers between stages.",
                    "order": 2,
                    "minutes": 25,
                    "prerequisites": ["shift-registers"],
                    "content": """## Pipelines

### Concept

A pipeline divides a combinational path into stages separated by registers, improving clock frequency at the cost of latency.

### Without Pipeline

```
Input → [Combinational Logic] → Output
         (long delay = slow clock)
```

### With Pipeline

```
Input → [Stage 1] → Reg → [Stage 2] → Reg → [Stage 3] → Output
        (shorter delay = faster clock)
```

### Simple Pipeline Example

```systemverilog
module pipeline_3stage #(
    parameter WIDTH = 8
)(
    input  logic clk,
    input  logic rst_n,
    input  logic [WIDTH-1:0] a, b, c,
    output logic [WIDTH-1:0] result
);
    logic [WIDTH-1:0] stage1, stage2;

    // Stage 1: a + b
    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            stage1 <= '0;
        else
            stage1 <= a + b;
    end

    // Stage 2: stage1 * c
    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            stage2 <= '0;
        else
            stage2 <= stage1 * c;
    end

    // Stage 3: stage2 - 1
    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            result <= '0;
        else
            result <= stage2 - 1;
    end
endmodule
```

### Pipeline Register

```systemverilog
module pipe_reg #(
    parameter WIDTH = 8
)(
    input  logic clk,
    input  logic rst_n,
    input  logic valid_in,
    input  logic [WIDTH-1:0] data_in,
    output logic valid_out,
    output logic [WIDTH-1:0] data_out
);
    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            valid_out <= 1'b0;
            data_out  <= '0;
        end else begin
            valid_out <= valid_in;
            data_out  <= data_in;
        end
    end
endmodule
```

### Throughput vs Latency

| Metric | Without Pipeline | With Pipeline |
|--------|------------------|---------------|
| Latency | 1 cycle | N cycles |
| Throughput | 1 result/cycle | 1 result/cycle (after fill) |
| Clock Period | Long | Short (1/N) |

### Pipeline Hazards

| Hazard | Description | Solution |
|--------|-------------|----------|
| Data | Later stage needs data from earlier | Forwarding, stall |
| Control | Branch changes flow | Branch prediction, stall |
| Structural | Resource conflict | Duplicate resources |

### Common Mistakes

- Not registering all pipeline stages equally
- Forgetting to pipeline valid/strobe signals
- Not handling pipeline flush on exceptions""",
                    "quiz": [
                        {"question": "What is the main benefit of pipelining?", "options": ["Reduces latency", "Increases throughput", "Uses fewer registers", "Simplifies logic"], "answer": "Increases throughput", "explanation": "Pipelining improves throughput by allowing multiple instructions to be in different stages simultaneously, even though each individual instruction takes longer."},
                        {"question": "What must be done to valid/strobe signals in a pipeline?", "options": ["Nothing", "They must be pipelined with data", "They should be combinational", "They must be removed"], "answer": "They must be pipelined with data", "explanation": "Control signals like valid must be delayed through the pipeline to match the data latency, ensuring correct operation."},
                    ],
                },
            ],
        },
        {
            "slug": "hdl-verification",
            "title": "HDL Verification Fundamentals",
            "description": "Learn to verify your designs with testbenches and assertions.",
            "order": 7,
            "lessons": [
                {
                    "slug": "testbenches",
                    "title": "Testbenches",
                    "description": "Build effective testbenches for RTL verification.",
                    "order": 0,
                    "minutes": 20,
                    "prerequisites": ["pipelines"],
                    "content": """## Testbenches

### Basic Testbench Structure

```systemverilog
module tb_adder;
    logic [7:0] a, b;
    logic [8:0] sum;

    // Instantiate DUT
    adder #(.WIDTH(8)) dut (
        .a(a),
        .b(b),
        .sum(sum)
    );

    // Stimulus
    initial begin
        a = 0; b = 0;
        #10;
        a = 8'd10; b = 8'd20;
        #10;
        a = 8'hFF; b = 8'd1;
        #10;
        $finish;
    end
endmodule
```

### Self-Checking Testbench

```systemverilog
module tb_adder_check;
    logic [7:0] a, b;
    logic [8:0] sum;
    int errors = 0;

    adder #(.WIDTH(8)) dut (.a(a), .b(b), .sum(sum));

    task automatic check(input logic [7:0] ta, tb, input logic [8:0] expected);
        a = ta; b = tb;
        #1;
        if (sum !== expected) begin
            $error("FAIL: %0d + %0d = %0d, expected %0d", ta, tb, sum, expected);
            errors++;
        end
    endtask

    initial begin
        check(0, 0, 0);
        check(10, 20, 30);
        check(255, 1, 256);
        check(128, 128, 256);

        if (errors == 0)
            $display("ALL TESTS PASSED");
        else
            $display("FAILURES: %0d", errors);
        $finish;
    end
endmodule
```

### Stimulus Generation

| Method | Description | Use Case |
|--------|-------------|----------|
| Direct assignment | Hardcoded values | Simple tests |
| Loops | Generate patterns | Exhaustive testing |
| Random | $urandom_range | Constrained random |
| File I/O | $readmemh | Real-world data |

### Common Testbench Patterns

```systemverilog
// Clock generation
logic clk = 0;
always #5 clk = ~clk;

// Reset sequence
logic rst_n = 0;
initial begin
    repeat(3) @(posedge clk);
    rst_n = 1;
end

// Timeout
initial begin
    #10000;
    $error("TIMEOUT");
    $finish;
end
```""",
                    "quiz": [
                        {"question": "What is the purpose of a self-checking testbench?", "options": ["Generate stimuli only", "Automatically verify expected results", "Reduce simulation time", "Synthesize the design"], "answer": "Automatically verify expected results", "explanation": "Self-checking testbenches compare actual outputs against expected values and report errors automatically."},
                        {"question": "Why use $urandom_range for stimulus generation?", "options": ["It is faster", "Provides constrained random testing", "Generates deterministic results", "Uses less memory"], "answer": "Provides constrained random testing", "explanation": "Random stimulus helps find corner cases that manual testing might miss, while constraints ensure valid inputs."},
                    ],
                },
                {
                    "slug": "assertions",
                    "title": "Assertions",
                    "description": "Use SystemVerilog Assertions (SVA) for property checking.",
                    "order": 1,
                    "minutes": 20,
                    "prerequisites": ["testbenches"],
                    "content": """## Assertions

### Immediate Assertions

```systemverilog
module check_adder (
    input  logic [7:0] a, b,
    input  logic [8:0] sum
);
    // Check no overflow for small values
    property no_overflow_small;
        @(posedge clk) (a < 128 && b < 128) |-> (sum < 256);
    endproperty

    assert property (no_overflow_small)
        else $error("Overflow detected with small operands");
endmodule
```

### Concurrent Assertions

```systemverilog
module protocol_checker (
    input  logic clk,
    input  logic req,
    input  logic ack
);
    // Request must be acknowledged within 4 cycles
    property req_ack;
        @(posedge clk) $rose(req) |-> ##[1:4] $rose(ack);
    endproperty

    assert property (req_ack)
        else $error("ACK not received within 4 cycles");

    // ACK cannot be asserted without prior REQ
    property no_spurious_ack;
        @(posedge clk) $rose(ack) |-> $past(req, 1) || $past(req, 2) ||
                                     $past(req, 3) || $past(req, 4);
    endproperty

    assert property (no_spurious_ack)
        else $error("Spurious ACK detected");
endmodule
```

### SVA Basics

| Construct | Meaning |
|-----------|---------|
| `assert` | Check property, report on failure |
| `assume` | Constrain inputs for formal verification |
| `cover` | Measure if property is reachable |
| `property` | Named temporal expression |
| `sequence` | Ordered list of events |

### Simple Sequence Examples

```systemverilog
// Two consecutive rising edges
sequence two_clks;
    @(posedge clk) 1 ##1 1;
endsequence

// Handshake: req followed by ack within 3 cycles
sequence handshake;
    $rose(req) ##[1:3] $rose(ack);
endsequence

// Assert handshake property
property handshake_prop;
    @(posedge clk) handshake;
endproperty

assert property (handshake_prop);
```

### Common Mistakes

- Using immediate assertions where concurrent are needed
- Not disabling assertions during reset
- Over-constraining with assume statements
- Forgetting `else` clause for error reporting""",
                    "quiz": [
                        {"question": "What is the difference between assert and assume?", "options": ["No difference", "assert checks properties, assume constrains inputs", "assume is for formal only", "assert is for simulation only"], "answer": "assert checks properties, assume constrains inputs", "explanation": "Assert properties verify design behavior, while assume properties constrain input behavior for formal verification tools."},
                        {"question": "What does |-> mean in SVA?", "options": ["Or-implies", "Implies", "Followed by", "Equals"], "answer": "Implies", "explanation": "The |-> operator is the overlapping implication operator, meaning if the left side is true, the right side must also be true in the same clock cycle."},
                    ],
                },
            ],
        },
        {
            "slug": "advanced-rtl",
            "title": "Advanced RTL Concepts",
            "description": "Master power reduction, resource sharing, and synthesis-aware design.",
            "order": 8,
            "lessons": [
                {
                    "slug": "clock-enable",
                    "title": "Clock Enable and Gating",
                    "description": "Reduce power with clock enable signals and clock gating.",
                    "order": 0,
                    "minutes": 20,
                    "prerequisites": ["assertions"],
                    "content": """## Clock Enable and Gating

### Clock Enable

A clock enable signal controls when flip-flops capture new data, without changing the clock frequency.

```systemverilog
module counter_ce #(
    parameter WIDTH = 8
)(
    input  logic clk,
    input  logic rst_n,
    input  logic ce,
    output logic [WIDTH-1:0] count
);
    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            count <= '0;
        else if (ce)
            count <= count + 1'b1;
    end
endmodule
```

### Clock Gating

Clock gating removes the clock from inactive modules to save power.

```systemverilog
module clock_gating (
    input  logic clk,
    input  logic en,
    output logic gated_clk
);
    // ICG cell pattern
    logic latch_en;

    always_latch begin
        if (!clk)
            latch_en = en;
    end

    assign gated_clk = clk & latch_en;
endmodule
```

### Enable vs Gating

| Feature | Clock Enable | Clock Gating |
|---------|--------------|--------------|
| Power savings | Moderate | High |
| Timing complexity | Low | Higher |
| Skew concerns | None | Yes (clock tree) |
| Synthesis | Automatic | Explicit or inferred |

### Power Reduction Techniques

| Technique | Description | Power Saving |
|-----------|-------------|--------------|
| Clock gating | Disable clock to idle modules | 30-60% |
| Clock enable | Disable FF updates | 10-30% |
| Operand isolation | Gate inputs to idle logic | 5-20% |
| Power gating | Shut down entire blocks | 50-90% |

### Common Mistakes

- Using clock gating without proper latch (glitches)
- Gating clock for high-frequency designs without careful analysis
- Not accounting for clock tree insertion delay
- Mixing enable and gating inconsistently""",
                    "quiz": [
                        {"question": "What is the main advantage of clock gating over clock enable?", "options": ["Simpler design", "Greater power savings", "Better timing", "No clock tree impact"], "answer": "Greater power savings", "explanation": "Clock gating eliminates switching power in the clock tree and logic, providing much greater power savings than just disabling FF updates."},
                        {"question": "Why is a latch used in clock gating?", "options": ["For speed", "To prevent glitches on gated clock", "To store data", "For reset"], "answer": "To prevent glitches on gated clock", "explanation": "The latch holds the enable signal stable during the high phase of the clock, preventing glitches that could cause errors."},
                    ],
                },
                {
                    "slug": "resource-sharing",
                    "title": "Resource Sharing",
                    "description": "Optimize area by sharing operators and resources.",
                    "order": 1,
                    "minutes": 15,
                    "prerequisites": ["clock-enable"],
                    "content": """## Resource Sharing

### Operator Sharing

When multiple operations occur in mutually exclusive conditions, they can share hardware.

```systemverilog
// WITHOUT sharing: two multipliers
module no_sharing (
    input  logic sel,
    input  logic [7:0] a, b, c, d,
    output logic [15:0] result
);
    always_comb begin
        if (sel)
            result = a * b;  // Multiplier 1
        else
            result = c * d;  // Multiplier 2
    end
endmodule

// WITH sharing: one multiplier
module with_sharing (
    input  logic sel,
    input  logic [7:0] a, b, c, d,
    output logic [15:0] result
);
    logic [7:0] op1, op2;

    always_comb begin
        if (sel) begin
            op1 = a;
            op2 = b;
        end else begin
            op1 = c;
            op2 = d;
        end
    end

    assign result = op1 * op2;  // Single multiplier
endmodule
```

### MUX-Based Sharing

```systemverilog
module mux_sharing (
    input  logic [1:0] sel,
    input  logic [7:0] a, b, c, d,
    output logic [7:0] result
);
    logic [7:0] mux_out;

    always_comb begin
        case (sel)
            2'b00: mux_out = a;
            2'b01: mux_out = b;
            2'b10: mux_out = c;
            default: mux_out = d;
        endcase
    end

    // Single adder shared by all operations
    assign result = mux_out + 8'd1;
endmodule
```

### Time-Multiplexing

```systemverilog
module time_mux #(
    parameter WIDTH = 8
)(
    input  logic clk,
    input  logic rst_n,
    input  logic [WIDTH-1:0] a, b,
    output logic [WIDTH:0] result
);
    logic [WIDTH:0] sum_reg;
    logic sel;

    // Alternate between operations each cycle
    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            sel <= 1'b0;
        else
            sel <= ~sel;
    end

    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            sum_reg <= '0;
        else if (sel)
            sum_reg <= a + b;
        else
            sum_reg <= sum_reg;  // Hold
    end

    assign result = sum_reg;
endmodule
```

### Sharing Guidelines

| Scenario | Recommendation |
|----------|----------------|
| Mutually exclusive operations | Share operator with MUX inputs |
| Sequential operations | Time-multiply if timing allows |
| Same operation, different data | Single operator, MUX data |
| High-performance required | Duplicate operators (no sharing) |""",
                    "quiz": [
                        {"question": "When can operators be shared?", "options": ["Always", "When operations are mutually exclusive", "Only for addition", "Only in sequential logic"], "answer": "When operations are mutually exclusive", "explanation": "Operators can be shared when only one operation executes at a time, allowing a single hardware unit to serve multiple functions."},
                        {"question": "What is the trade-off of resource sharing?", "options": ["More area, less speed", "Less area, potentially less speed", "More power", "More complexity"], "answer": "Less area, potentially less speed", "explanation": "Resource sharing reduces area by reusing hardware, but may increase latency or reduce throughput if operations must be serialized."},
                    ],
                },
                {
                    "slug": "synthesizable",
                    "title": "Synthesizable vs Non-Synthesizable",
                    "description": "Understand what SystemVerilog constructs can and cannot be synthesized.",
                    "order": 2,
                    "minutes": 15,
                    "prerequisites": ["resource-sharing"],
                    "content": """## Synthesizable vs Non-Synthesizable

### Synthesizable Constructs

| Construct | Description |
|-----------|-------------|
| `assign` | Continuous assignment |
| `always_ff` | Sequential logic |
| `always_comb` | Combinational logic |
| `always_latch` | Latch inference |
| `module` | Design unit |
| `parameter` | Compile-time constants |
| `typedef enum` | State encoding |
| `generate` | Conditional instantiation |

### Non-Synthesizable Constructs

| Construct | Description | Purpose |
|-----------|-------------|---------|
| `initial` | Initial block | Testbench only |
| `#delay` | Timing delays | Simulation only |
| `$display` | Display system task | Debugging |
| `$readmemh` | File reading | Initialization |
| `fork/join` | Parallel processes | Testbench |
| `wait` | Wait statement | Simulation |
| `event` | Event triggering | Testbench |

### Synthesis Guidelines

```systemverilog
// GOOD: Synthesizable
module good_example (
    input  logic clk,
    input  logic rst_n,
    input  logic [3:0] sel,
    output logic [7:0] out
);
    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            out <= '0;
        else
            case (sel)
                4'd0: out <= 8'hAA;
                4'd1: out <= 8'hBB;
                default: out <= '0;
            endcase
    end
endmodule

// BAD: Non-synthesizable patterns
module bad_example (
    input  logic clk,
    output logic [7:0] out
);
    // initial block - not synthesizable
    initial out = 0;

    // #delay - not synthesizable
    always_ff @(posedge clk)
        #5 out <= out + 1;  // ERROR

    // $display - not synthesizable (but synthesis tools ignore)
    always_ff @(posedge clk)
        $display("Value: %h", out);  // Synthesis ignores
endmodule
```

### Common Mistakes

- Using `initial` blocks in RTL (except for ROM initialization)
- Adding `#delay` in synthesizable code
- Relying on simulation-specific behavior
- Using `$display` for synthesis output (ignored)

### Best Practices

1. Use `always_ff` for sequential, `always_comb` for combinational
2. Avoid `initial` in RTL (except ROM init)
3. Never use `#delay` in synthesizable code
4. Keep simulation-only code in testbenches only
5. Use parameters for compile-time constants""",
                    "quiz": [
                        {"question": "Which of these is NOT synthesizable?", "options": ["assign", "always_ff", "#delay", "parameter"], "answer": "#delay", "explanation": "Delay statements (#) are simulation-only constructs and cannot be synthesized into hardware."},
                        {"question": "Can $display be used in synthesizable code?", "options": ["Yes, it synthesizes to display logic", "No, it causes errors", "Synthesis tools ignore it", "Only with special pragma"], "answer": "Synthesis tools ignore it", "explanation": "Synthesis tools silently ignore $display and other system tasks, but it is poor practice to include them in synthesizable code."},
                    ],
                },
            ],
        },
    ]
