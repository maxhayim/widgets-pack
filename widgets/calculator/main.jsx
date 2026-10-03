import { useState } from "react";
import { mountWidget } from "../../src/shared/shell.jsx";

/* Calculator: after the Braun ET66 by Dieter Rams and Dietrich Lubs, 1987 */
const CALC_MAX_DIGITS = 9;

function formatCalc(n) {
  if (!Number.isFinite(n)) return "Error";
  if (Math.abs(n) >= 1e9 || (Math.abs(n) < 1e-7 && n !== 0)) return n.toExponential(3).replace("e+", "e");
  return String(Number.parseFloat(n.toPrecision(CALC_MAX_DIGITS)));
}

function calcStep(state, key) {
  const value = Number.parseFloat(state.display);
  const apply = (a, op, b) => (op === "+" ? a + b : op === "−" ? a - b : op === "×" ? a * b : b === 0 ? Number.NaN : a / b);
  if (state.display === "Error" && key !== "C") return state;
  if (/^[0-9]$/.test(key)) {
    if (state.fresh) return { ...state, display: key, fresh: false };
    if (state.display.replace(/[-.]/g, "").length >= CALC_MAX_DIGITS) return state;
    return { ...state, display: state.display === "0" ? key : state.display + key };
  }
  if (key === ".") {
    if (state.fresh) return { ...state, display: "0.", fresh: false };
    return state.display.includes(".") ? state : { ...state, display: `${state.display}.` };
  }
  if (key === "C") return { display: "0", acc: null, op: null, fresh: true };
  if (key === "±") return { ...state, display: formatCalc(-value) };
  // Percent finishes the sum like a pocket calculator: 50 × 10 % = 5, 200 + 10 % = 220, 200 − 10 % = 180
  if (key === "%") {
    if (state.acc === null || !state.op) return { ...state, display: formatCalc(value / 100), fresh: true };
    const part = (state.acc * value) / 100;
    const result = state.op === "×" ? part : state.op === "÷" ? (value === 0 ? Number.NaN : (state.acc * 100) / value) : state.op === "+" ? state.acc + part : state.acc - part;
    return { display: formatCalc(result), acc: null, op: null, fresh: true };
  }
  if (["+", "−", "×", "÷"].includes(key)) {
    const acc = state.acc !== null && state.op && !state.fresh ? apply(state.acc, state.op, value) : value;
    return { display: formatCalc(acc), acc, op: key, fresh: true };
  }
  if (key === "=") {
    if (state.acc === null || !state.op) return { ...state, fresh: true };
    return { display: formatCalc(apply(state.acc, state.op, value)), acc: null, op: null, fresh: true };
  }
  return state;
}

const CALC_KEYS = ["C", "±", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "0", ".", "="];
const KEY_MAP = { "*": "×", x: "×", "/": "÷", "-": "−", "+": "+", Enter: "=", "=": "=", Escape: "C", c: "C", C: "C", ",": ".", ".": ".", "%": "%" };
const KEY_NAMES = { "÷": "divide", "×": "multiply", "−": "minus", "+": "plus", "±": "change sign", "%": "percent", C: "clear", "=": "equals", ".": "point" };

function CalculatorWidget() {
  const [state, setState] = useState({ display: "0", acc: null, op: null, fresh: true });
  const press = (key) => setState((s) => calcStep(s, key));

  return (
    <section
      className="widget widget-calc"
      aria-label="Calculator"
      tabIndex={0}
      onKeyDown={(e) => {
        const key = /^[0-9]$/.test(e.key) ? e.key : KEY_MAP[e.key];
        if (e.key === "Backspace") {
          e.preventDefault();
          setState((s) => (s.fresh ? s : { ...s, display: s.display.length > 1 ? s.display.slice(0, -1) : "0" }));
        } else if (key && !e.altKey && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          e.stopPropagation(); // Escape clears instead of closing settings
          press(key);
        }
      }}
    >
      <div className="widget-calc-lcd" aria-live="polite">
        <span className="widget-calc-op">{state.op || ""}</span>
        {state.display}
      </div>
      <div className="widget-calc-keys">
        {CALC_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => press(key)}
            className={`widget-calc-key ${key === "=" ? "widget-calc-equals" : ""} ${key === "C" ? "widget-calc-clear" : ""} ${key === "0" ? "col-span-2" : ""} ${["÷", "×", "−", "+"].includes(key) ? "widget-calc-fn" : ""}`}
            aria-label={KEY_NAMES[key] || key}
          >
            {key}
          </button>
        ))}
      </div>
    </section>
  );
}

mountWidget({ id: "calculator", label: "Calculator", Widget: CalculatorWidget });
