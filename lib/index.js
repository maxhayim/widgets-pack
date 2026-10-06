import { createContext as e, createElement as t, forwardRef as n, useContext as r, useEffect as i, useMemo as a, useRef as o, useState as s } from "react";
import { Fragment as c, jsx as l, jsxs as u } from "react/jsx-runtime";
//#region src/shared/host.jsx
function d(e = "widgets-pack:") {
	return {
		get(t) {
			try {
				return localStorage.getItem(e + t);
			} catch {
				return null;
			}
		},
		set(t, n) {
			try {
				n === null ? localStorage.removeItem(e + t) : localStorage.setItem(e + t, n);
			} catch {}
		},
		subscribe(t, n) {
			let r = (r) => r.key === e + t && n();
			return window.addEventListener("storage", r), window.addEventListener("focus", n), () => {
				window.removeEventListener("storage", r), window.removeEventListener("focus", n);
			};
		}
	};
}
var f = {
	storage: d(),
	openUrl: (e) => {
		/^https:\/\/[^\s"']+$/.test(e) && window.open(e, "_blank", "noopener");
	},
	locate: () => new Promise((e, t) => {
		if (!navigator.geolocation) {
			t(/* @__PURE__ */ Error("unavailable"));
			return;
		}
		navigator.geolocation.getCurrentPosition((t) => e({
			name: "you",
			lat: Math.round(t.coords.latitude * 100) / 100,
			lon: Math.round(t.coords.longitude * 100) / 100
		}), () => t(/* @__PURE__ */ Error("unavailable")), {
			maximumAge: 18e5,
			timeout: 1e4
		});
	}),
	useShared: null,
	sound: null,
	createAudio: () => new Audio(),
	photos: null,
	clockMark: "",
	origin: typeof location > "u" ? "" : location.origin
}, p = e(f);
function m({ host: e, children: t }) {
	let n = a(() => ({
		...f,
		...e
	}), [e]);
	return /* @__PURE__ */ l(p.Provider, {
		value: n,
		children: t
	});
}
var h = () => r(p), g = "wp-store", _ = (e, t) => {
	if (e == null) return t;
	try {
		return JSON.parse(e);
	} catch {
		return t;
	}
};
function v(e, t) {
	let { storage: n } = h(), [r, a] = s(() => _(n.get(e), t));
	return i(() => {
		let r = () => a(_(n.get(e), t)), i = (t) => t.detail === e && r();
		window.addEventListener(g, i);
		let o = n.subscribe?.(e, r);
		return () => {
			window.removeEventListener(g, i), o?.();
		};
	}, [e, n]), [r, (r) => {
		let i = typeof r == "function" ? r(_(n.get(e), t)) : r;
		n.set(e, i == null ? null : JSON.stringify(i)), window.dispatchEvent(new CustomEvent(g, { detail: e }));
	}];
}
function y(e) {
	let [t, n] = v(e.key, {});
	return [b(e, t), (t) => n((n) => ({
		...b(e, n),
		...t
	}))];
}
function b({ defaults: e, allowed: t = {} }, n) {
	let r = n && typeof n == "object" ? n : {}, i = typeof e == "function" ? e() : e;
	return Object.fromEntries(Object.entries(i).map(([e, n]) => {
		let i = r[e];
		return [e, typeof i == typeof n && (!t[e] || t[e].includes(i)) ? i : n];
	}));
}
var x = () => navigator.language || "en-US", S = () => {
	try {
		let e = new Intl.DateTimeFormat(void 0, { hour: "numeric" }).resolvedOptions().hourCycle;
		return e === "h23" || e === "h24" ? "24" : "12";
	} catch {
		return "12";
	}
}, C = () => /-(US|LR|MM|BS|BZ|KY|PW|FM|MH)$/i.test(x()) ? "f" : "c", w = [
	{
		id: "auto",
		label: "match computer"
	},
	{
		id: "en-US",
		label: "English (US)"
	},
	{
		id: "en-GB",
		label: "English (UK)"
	},
	{
		id: "he-IL",
		label: "עברית"
	},
	{
		id: "es-ES",
		label: "Español"
	},
	{
		id: "fr-FR",
		label: "Français"
	},
	{
		id: "de-DE",
		label: "Deutsch"
	},
	{
		id: "it-IT",
		label: "Italiano"
	},
	{
		id: "pt-BR",
		label: "Português (Brasil)"
	},
	{
		id: "ru-RU",
		label: "Русский"
	},
	{
		id: "ar",
		label: "العربية"
	},
	{
		id: "zh-CN",
		label: "中文"
	},
	{
		id: "ja-JP",
		label: "日本語"
	}
], T = {
	key: "shared",
	defaults: () => ({
		locale: "auto",
		temperature: C(),
		clock: S(),
		theme: "auto"
	}),
	allowed: {
		locale: w.map((e) => e.id),
		temperature: ["f", "c"],
		clock: ["12", "24"],
		theme: [
			"auto",
			"light",
			"dark"
		]
	}
};
function E() {
	let [e, t] = y(T);
	return [{
		...e,
		locale: e.locale === "auto" ? x() : e.locale
	}, t];
}
function D() {
	return (h().useShared || E)();
}
//#endregion
//#region widgets/calculator/widget.jsx
var O = 9;
function k(e) {
	return Number.isFinite(e) ? Math.abs(e) >= 1e9 || Math.abs(e) < 1e-7 && e !== 0 ? e.toExponential(3).replace("e+", "e") : String(Number.parseFloat(e.toPrecision(O))) : "Error";
}
function A(e, t) {
	let n = Number.parseFloat(e.display), r = (e, t, n) => t === "+" ? e + n : t === "−" ? e - n : t === "×" ? e * n : n === 0 ? NaN : e / n;
	if (e.display === "Error" && t !== "C") return e;
	if (/^[0-9]$/.test(t)) return e.fresh ? {
		...e,
		display: t,
		fresh: !1
	} : e.display.replace(/[-.]/g, "").length >= O ? e : {
		...e,
		display: e.display === "0" ? t : e.display + t
	};
	if (t === ".") return e.fresh ? {
		...e,
		display: "0.",
		fresh: !1
	} : e.display.includes(".") ? e : {
		...e,
		display: `${e.display}.`
	};
	if (t === "C") return {
		display: "0",
		acc: null,
		op: null,
		fresh: !0
	};
	if (t === "±") return {
		...e,
		display: k(-n)
	};
	if (t === "%") {
		if (e.acc === null || !e.op) return {
			...e,
			display: k(n / 100),
			fresh: !0
		};
		let t = e.acc * n / 100;
		return {
			display: k(e.op === "×" ? t : e.op === "÷" ? n === 0 ? NaN : e.acc * 100 / n : e.op === "+" ? e.acc + t : e.acc - t),
			acc: null,
			op: null,
			fresh: !0
		};
	}
	if ([
		"+",
		"−",
		"×",
		"÷"
	].includes(t)) {
		let i = e.acc !== null && e.op && !e.fresh ? r(e.acc, e.op, n) : n;
		return {
			display: k(i),
			acc: i,
			op: t,
			fresh: !0
		};
	}
	return t === "=" ? e.acc === null || !e.op ? {
		...e,
		fresh: !0
	} : {
		display: k(r(e.acc, e.op, n)),
		acc: null,
		op: null,
		fresh: !0
	} : e;
}
var ee = [
	"C",
	"±",
	"%",
	"÷",
	"7",
	"8",
	"9",
	"×",
	"4",
	"5",
	"6",
	"−",
	"1",
	"2",
	"3",
	"+",
	"0",
	".",
	"="
], te = {
	"*": "×",
	x: "×",
	"/": "÷",
	"-": "−",
	"+": "+",
	Enter: "=",
	"=": "=",
	Escape: "C",
	c: "C",
	C: "C",
	",": ".",
	".": ".",
	"%": "%"
}, ne = {
	"÷": "divide",
	"×": "multiply",
	"−": "minus",
	"+": "plus",
	"±": "change sign",
	"%": "percent",
	C: "clear",
	"=": "equals",
	".": "point"
};
function re() {
	let [e, t] = s({
		display: "0",
		acc: null,
		op: null,
		fresh: !0
	}), n = (e) => t((t) => A(t, e));
	return /* @__PURE__ */ u("section", {
		className: "widget widget-calc",
		"aria-label": "Calculator",
		tabIndex: 0,
		onKeyDown: (e) => {
			let r = /^[0-9]$/.test(e.key) ? e.key : te[e.key];
			e.key === "Backspace" ? (e.preventDefault(), t((e) => e.fresh ? e : {
				...e,
				display: e.display.length > 1 ? e.display.slice(0, -1) : "0"
			})) : r && !e.altKey && !e.metaKey && !e.ctrlKey && (e.preventDefault(), e.stopPropagation(), n(r));
		},
		children: [/* @__PURE__ */ u("div", {
			className: "widget-calc-lcd",
			"aria-live": "polite",
			children: [/* @__PURE__ */ l("span", {
				className: "widget-calc-op",
				children: e.op || ""
			}), e.display]
		}), /* @__PURE__ */ l("div", {
			className: "widget-calc-keys",
			children: ee.map((e) => /* @__PURE__ */ l("button", {
				type: "button",
				onClick: () => n(e),
				className: `widget-calc-key ${e === "=" ? "widget-calc-equals" : ""} ${e === "C" ? "widget-calc-clear" : ""} ${e === "0" ? "col-span-2" : ""} ${[
					"÷",
					"×",
					"−",
					"+"
				].includes(e) ? "widget-calc-fn" : ""}`,
				"aria-label": ne[e] || e,
				children: e
			}, e))
		})]
	});
}
var ie = {
	id: "calculator",
	label: "Calculator",
	Widget: re
};
//#endregion
//#region src/shared/ui.jsx
function ae({ label: e, value: t, options: n, onChange: r }) {
	return /* @__PURE__ */ u("div", {
		className: "wp-field",
		role: "radiogroup",
		"aria-label": e,
		children: [e, /* @__PURE__ */ l("div", {
			className: "flex gap-1",
			children: n.map(([e, n]) => /* @__PURE__ */ l("button", {
				type: "button",
				role: "radio",
				"aria-checked": t === e,
				onClick: () => r(e),
				className: `wp-btn flex-1 px-1 ${t === e ? "wp-btn-main" : ""}`,
				children: n
			}, e))
		})]
	});
}
function j({ href: e, className: t, children: n, ...r }) {
	let { openUrl: i } = h();
	return /* @__PURE__ */ l("a", {
		href: e,
		className: t,
		onClick: (t) => {
			t.preventDefault(), i(e);
		},
		...r,
		children: n
	});
}
var M = (e) => /^#[0-9a-f]{6}$/i.test(e || ""), oe = [
	["#e8591a", "orange"],
	["#f2b200", "yellow"],
	["#c8371a", "red"],
	["#3f7f33", "green"],
	["#46687a", "blue"],
	["#7a5aa6", "violet"],
	["#262624", "black"]
], se = [
	["#f3f1ec", "warm white"],
	["#201f1d", "graphite"],
	["#e8591a", "orange"],
	["#f2b200", "yellow"],
	["#8a9a6b", "olive"],
	["#5d7f93", "blue"],
	["#d9d4c7", "stone"]
];
function N({ label: e, value: t, onChange: n, presets: r = oe }) {
	let i = M(t) ? t.toLowerCase() : "", a = i && !r.some(([e]) => e === i);
	return /* @__PURE__ */ u("div", {
		className: "wp-field",
		role: "radiogroup",
		"aria-label": e,
		children: [e, /* @__PURE__ */ u("div", {
			className: "flex flex-wrap items-center gap-1.5",
			children: [
				/* @__PURE__ */ l("button", {
					type: "button",
					role: "radio",
					"aria-checked": !i,
					onClick: () => n(""),
					className: `wp-btn px-2 py-0.5 ${i ? "" : "wp-btn-main"}`,
					children: "default"
				}),
				r.map(([e, t]) => /* @__PURE__ */ l("button", {
					type: "button",
					role: "radio",
					"aria-checked": i === e,
					"aria-label": t,
					title: t,
					onClick: () => n(e),
					className: `wp-swatch ${i === e ? "wp-swatch-on" : ""}`,
					style: { background: e }
				}, e)),
				/* @__PURE__ */ l("label", {
					className: `wp-swatch wp-swatch-custom ${a ? "wp-swatch-on" : ""}`,
					title: "Any color",
					style: a ? { background: i } : void 0,
					children: /* @__PURE__ */ l("input", {
						type: "color",
						value: i || "#e8591a",
						onChange: (e) => n(e.target.value),
						className: "sr-only",
						"aria-label": `${e}: any color`
					})
				})
			]
		})]
	});
}
function ce(e) {
	if (!M(e)) return;
	let [t, n, r] = [
		1,
		3,
		5
	].map((t) => parseInt(e.slice(t, t + 2), 16) / 255).map((e) => e <= .03928 ? e / 12.92 : ((e + .055) / 1.055) ** 2.4), i = .2126 * t + .7152 * n + .0722 * r < .3 ? "#eeebe4" : "#262624";
	return {
		"--w-case": e,
		"--os-ink": i,
		"--os-ink-2": `color-mix(in oklab, ${i} 80%, ${e})`,
		"--os-ink-3": `color-mix(in oklab, ${i} 60%, ${e})`,
		"--w-line": `color-mix(in oklab, ${i} 18%, ${e})`,
		"--os-hover": `color-mix(in oklab, ${i} 8%, transparent)`
	};
}
//#endregion
//#region src/shared/time.jsx
var P = [
	{
		id: "auto",
		label: "this computer"
	},
	{
		id: "America/New_York",
		label: "Miami · New York"
	},
	{
		id: "America/Chicago",
		label: "Chicago"
	},
	{
		id: "America/Denver",
		label: "Denver"
	},
	{
		id: "America/Los_Angeles",
		label: "Los Angeles"
	},
	{
		id: "America/Anchorage",
		label: "Anchorage"
	},
	{
		id: "Pacific/Honolulu",
		label: "Honolulu"
	},
	{
		id: "America/Mexico_City",
		label: "Mexico City"
	},
	{
		id: "America/Sao_Paulo",
		label: "São Paulo"
	},
	{
		id: "Europe/London",
		label: "London"
	},
	{
		id: "Europe/Paris",
		label: "Paris · Berlin · Rome"
	},
	{
		id: "Europe/Athens",
		label: "Athens"
	},
	{
		id: "Europe/Moscow",
		label: "Moscow"
	},
	{
		id: "Asia/Jerusalem",
		label: "Jerusalem · Tel Aviv"
	},
	{
		id: "Asia/Dubai",
		label: "Dubai"
	},
	{
		id: "Asia/Kolkata",
		label: "Mumbai · Delhi"
	},
	{
		id: "Asia/Bangkok",
		label: "Bangkok"
	},
	{
		id: "Asia/Singapore",
		label: "Singapore"
	},
	{
		id: "Asia/Shanghai",
		label: "Shanghai"
	},
	{
		id: "Asia/Tokyo",
		label: "Tokyo"
	},
	{
		id: "Australia/Sydney",
		label: "Sydney"
	},
	{
		id: "Pacific/Auckland",
		label: "Auckland"
	},
	{
		id: "UTC",
		label: "UTC"
	}
], le = (e) => !e || e === "auto" ? void 0 : e;
function F(e = 1e3) {
	let [t, n] = s(() => /* @__PURE__ */ new Date());
	return i(() => {
		let t = setInterval(() => n(/* @__PURE__ */ new Date()), e);
		return () => clearInterval(t);
	}, [e]), t;
}
var ue = () => F(6e4);
function I(e, { locale: t, clock: n }, r) {
	return e.toLocaleTimeString(t, {
		hour: "numeric",
		minute: "2-digit",
		hourCycle: n === "24" ? "h23" : "h12",
		timeZone: le(r)
	});
}
function de(e, t) {
	let n = le(t);
	if (!n) return {
		h: e.getHours(),
		m: e.getMinutes(),
		s: e.getSeconds()
	};
	let r = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
		timeZone: n,
		hourCycle: "h23",
		hour: "numeric",
		minute: "numeric",
		second: "numeric"
	}).formatToParts(e).map((e) => [e.type, e.value]));
	return {
		h: Number(r.hour) % 24,
		m: Number(r.minute),
		s: Number(r.second)
	};
}
function fe({ now: e, timeZone: t, className: n = "h-[18px] w-[18px]" }) {
	let r = de(e, t), i = r.s, a = r.m + i / 60, o = r.h % 12 + a / 60, s = (e, t, n, r) => /* @__PURE__ */ l("line", {
		x1: "12",
		y1: "12",
		x2: "12",
		y2: 12 - t,
		stroke: r,
		strokeWidth: n,
		strokeLinecap: "round",
		transform: `rotate(${e} 12 12)`
	});
	return /* @__PURE__ */ u("svg", {
		viewBox: "0 0 24 24",
		className: n,
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ l("circle", {
				cx: "12",
				cy: "12",
				r: "11",
				fill: "var(--os-card)",
				stroke: "var(--os-line)"
			}),
			[
				0,
				90,
				180,
				270
			].map((e) => /* @__PURE__ */ l("line", {
				x1: "12",
				y1: "2.6",
				x2: "12",
				y2: "4.2",
				stroke: "var(--os-ink-3)",
				strokeWidth: "1",
				transform: `rotate(${e} 12 12)`
			}, e)),
			s(o * 30, 5, 1.8, "var(--os-ink)"),
			s(a * 6, 7.5, 1.3, "var(--os-ink)"),
			s(i * 6, 8.5, .8, "var(--os-accent)"),
			/* @__PURE__ */ l("circle", {
				cx: "12",
				cy: "12",
				r: "1.1",
				fill: "var(--os-accent)"
			})
		]
	});
}
//#endregion
//#region widgets/calendar/widget.jsx
var pe = {
	key: "calendar",
	defaults: {
		weekStart: "auto",
		accent: "",
		case: ""
	},
	allowed: { weekStart: [
		"auto",
		"0",
		"1",
		"6"
	] }
};
function me(e) {
	try {
		let t = new Intl.Locale(e), n = t.getWeekInfo?.().firstDay ?? t.weekInfo?.firstDay;
		if (n) return n % 7;
	} catch {}
	return /-(US|CA|BR|JP|IL|MX|PH)$/i.test(e) || ["he", "ja"].includes(e) ? 0 : 1;
}
function he() {
	let e = ue(), [t] = D(), [n] = y(pe), { locale: r } = t, i = n.weekStart === "auto" ? me(r) : Number(n.weekStart), a = e.getFullYear(), o = e.getMonth(), s = (new Date(a, o, 1).getDay() - i + 7) % 7, c = new Date(a, o + 1, 0).getDate(), d = [...Array(s).fill(null), ...Array.from({ length: c }, (e, t) => t + 1)], f = Array.from({ length: 7 }, (e, t) => new Date(2024, 0, 7 + (i + t) % 7).toLocaleDateString(r, { weekday: "narrow" }));
	return /* @__PURE__ */ u("section", {
		className: "widget widget-calendar px-3.5 pb-3.5 pt-3",
		style: {
			...ce(n.case),
			...M(n.accent) ? { "--os-accent": n.accent } : {}
		},
		"aria-label": `Calendar: ${e.toLocaleDateString(r, {
			weekday: "long",
			month: "long",
			day: "numeric",
			year: "numeric"
		})}`,
		children: [
			/* @__PURE__ */ u("div", {
				className: "flex items-baseline justify-between text-[10px] uppercase tracking-[0.16em]",
				children: [/* @__PURE__ */ l("span", {
					className: "font-semibold text-[var(--os-accent)]",
					dir: "auto",
					children: e.toLocaleDateString(r, { month: "long" })
				}), /* @__PURE__ */ l("span", {
					className: "text-[var(--os-ink-3)]",
					children: a
				})]
			}),
			/* @__PURE__ */ l("div", {
				className: "mt-2 grid grid-cols-7 text-center text-[9.5px] text-[var(--os-ink-3)]",
				"aria-hidden": "true",
				children: f.map((e, t) => /* @__PURE__ */ l("span", { children: e }, t))
			}),
			/* @__PURE__ */ l("div", {
				className: "mt-1 grid grid-cols-7 gap-y-0.5 text-center text-[11px] tabular-nums",
				"aria-hidden": "true",
				children: d.map((t, n) => /* @__PURE__ */ l("span", {
					className: `mx-auto flex h-[21px] w-[21px] items-center justify-center rounded-full ${t === e.getDate() ? "bg-[var(--os-accent)] font-semibold text-white" : ""}`,
					children: t || ""
				}, n))
			})
		]
	});
}
function ge() {
	let [e, t] = y(pe);
	return /* @__PURE__ */ u(c, { children: [
		/* @__PURE__ */ l(N, {
			label: "month and today",
			value: e.accent,
			onChange: (e) => t({ accent: e })
		}),
		/* @__PURE__ */ l(N, {
			label: "case",
			value: e.case,
			onChange: (e) => t({ case: e }),
			presets: se
		}),
		/* @__PURE__ */ l(ae, {
			label: "week starts on",
			value: e.weekStart,
			options: [
				["auto", "auto"],
				["0", "Sun"],
				["1", "Mon"],
				["6", "Sat"]
			],
			onChange: (e) => t({ weekStart: e })
		})
	] });
}
var _e = {
	id: "calendar",
	label: "Calendar",
	Widget: he,
	Settings: ge
}, ve = "\"Twemoji Mozilla\",\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\",\"Noto Color Emoji\",\"EmojiOne Color\",\"Android Emoji\",sans-serif";
function ye() {
	let e = document.createElement("canvas");
	e.width = e.height = 1;
	let t = e.getContext("2d", { willReadFrequently: !0 });
	return t.textBaseline = "top", t.font = `100px ${ve}`, t.scale(.01, .01), t;
}
function be(e, t, n) {
	return e.clearRect(0, 0, 100, 100), e.fillStyle = n, e.fillText(t, 0, 0), e.getImageData(0, 0, 1, 1).data.join(",");
}
function xe(e) {
	let t = ye(), n = be(t, e, "#fff"), r = be(t, e, "#000");
	return r === n && !r.startsWith("0,0,0,");
}
function Se(e = "Twemoji Country Flags", t = "https://cdn.jsdelivr.net/npm/country-flag-emoji-polyfill@0.1/dist/TwemojiCountryFlags.woff2") {
	if (typeof window < "u" && xe("😊") && !xe("🇨🇭")) {
		let n = document.createElement("style");
		return n.textContent = `@font-face {
      font-family: "${e}";
      unicode-range: U+1F1E6-1F1FF, U+1F3F4, U+E0062-E0063, U+E0065, U+E0067,
        U+E006C, U+E006E, U+E0073-E0074, U+E0077, U+E007F;
      src: url('${t}') format('woff2');
      font-display: swap;
    }`, document.head.appendChild(n), !0;
	}
	return !1;
}
//#endregion
//#region src/shared/flags.js
Se("Twemoji Country Flags", "data:font/woff2;base64,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");
var Ce = (e) => /^[A-Z]{2}$/.test(e || "") ? String.fromCodePoint(...[...e].map((e) => 127462 + e.charCodeAt(0) - 65)) : "", we = /* @__PURE__ */ new Set([
	"EU",
	"EZ",
	"UN",
	"QO",
	"XA",
	"XB",
	"ZZ"
]);
function Te(e) {
	let t;
	try {
		t = new Intl.DisplayNames([e, "en"], {
			type: "region",
			fallback: "none"
		});
	} catch {
		return [];
	}
	let n = [];
	for (let e = 65; e <= 90; e++) for (let r = 65; r <= 90; r++) {
		let i = String.fromCharCode(e, r);
		if (we.has(i)) continue;
		let a = t.of(i);
		a && a !== i && n.push({
			code: i,
			name: a
		});
	}
	return n.sort((t, n) => t.name.localeCompare(n.name, e));
}
//#endregion
//#region widgets/clock/widget.jsx
var Ee = {
	key: "clock",
	defaults: {
		timeZone: "auto",
		seconds: !0,
		name: "",
		flag: "",
		ticker: ""
	},
	allowed: { timeZone: P.map((e) => e.id) }
};
function De() {
	let e = F(), [t] = y(Ee), [n] = D(), { clockMark: r } = h(), i = t.timeZone === "auto" ? n.timeZone || "auto" : t.timeZone, a = de(e, i), o = a.s, s = a.m + o / 60, c = a.h % 12 + s / 60, d = (e, t, n, r, i) => /* @__PURE__ */ l("line", {
		x1: "100",
		y1: 100 + n,
		x2: "100",
		y2: 100 - t,
		stroke: i,
		strokeWidth: r,
		transform: `rotate(${e} 100 100)`
	});
	return /* @__PURE__ */ l("section", {
		className: "widget widget-clock",
		style: M(t.ticker) ? { "--w-yellow": t.ticker } : void 0,
		"aria-label": `${t.name || "Clock"}: ${I(e, n, i)}`,
		children: /* @__PURE__ */ u("svg", {
			viewBox: "0 0 200 200",
			className: "block h-full w-full",
			"aria-hidden": "true",
			children: [
				/* @__PURE__ */ l("circle", {
					cx: "100",
					cy: "100",
					r: "90",
					fill: "var(--w-face)"
				}),
				Array.from({ length: 60 }, (e, t) => t % 5 == 0 ? null : /* @__PURE__ */ l("line", {
					x1: "100",
					y1: "13",
					x2: "100",
					y2: "17",
					stroke: "var(--w-mark)",
					strokeWidth: "1",
					transform: `rotate(${t * 6} 100 100)`
				}, t)),
				Array.from({ length: 12 }, (e, t) => {
					let n = t + 1, r = n * 30 * Math.PI / 180;
					return /* @__PURE__ */ l("text", {
						x: 100 + Math.sin(r) * 72,
						y: 100 - Math.cos(r) * 72,
						textAnchor: "middle",
						dominantBaseline: "central",
						className: "widget-clock-num",
						children: n
					}, n);
				}),
				t.flag || t.name ? /* @__PURE__ */ u("text", {
					x: "100",
					y: "62",
					textAnchor: "middle",
					dominantBaseline: "central",
					className: "widget-clock-label",
					children: [
						t.flag && /* @__PURE__ */ l("tspan", {
							className: "widget-clock-flag",
							children: Ce(t.flag)
						}),
						t.flag && t.name ? " " : "",
						t.name.slice(0, 18)
					]
				}) : r ? /* @__PURE__ */ l("text", {
					x: "100",
					y: "62",
					textAnchor: "middle",
					className: "widget-clock-brand",
					children: r
				}) : null,
				d(c * 30, 46, 10, 6, "var(--w-hand)"),
				d(s * 6, 70, 12, 4, "var(--w-hand)"),
				t.seconds && /* @__PURE__ */ u("g", {
					transform: `rotate(${o * 6} 100 100)`,
					children: [/* @__PURE__ */ l("line", {
						x1: "100",
						y1: "124",
						x2: "100",
						y2: "20",
						stroke: "var(--w-yellow)",
						strokeWidth: "1.6"
					}), /* @__PURE__ */ l("circle", {
						cx: "100",
						cy: "122",
						r: "5",
						fill: "var(--w-yellow)"
					})]
				}),
				/* @__PURE__ */ l("circle", {
					cx: "100",
					cy: "100",
					r: "4",
					fill: t.seconds ? "var(--w-yellow)" : "var(--w-hand)"
				})
			]
		})
	});
}
function Oe() {
	let [e, t] = y(Ee), [n] = D(), r = a(() => Te(n.locale), [n.locale]);
	return /* @__PURE__ */ u(c, { children: [
		/* @__PURE__ */ u("label", {
			className: "wp-field",
			children: ["name on the face", /* @__PURE__ */ l("input", {
				className: "wp-input",
				value: e.name,
				onChange: (e) => t({ name: e.target.value.slice(0, 18) }),
				placeholder: "e.g. Home, Office, Mom",
				maxLength: 18
			})]
		}),
		/* @__PURE__ */ u("label", {
			className: "wp-field",
			children: ["flag", /* @__PURE__ */ u("select", {
				className: "wp-input wp-flag",
				value: e.flag,
				onChange: (e) => t({ flag: e.target.value }),
				children: [/* @__PURE__ */ l("option", {
					value: "",
					children: "none"
				}), r.map((e) => /* @__PURE__ */ u("option", {
					value: e.code,
					children: [
						Ce(e.code),
						" ",
						e.name
					]
				}, e.code))]
			})]
		}),
		/* @__PURE__ */ l(N, {
			label: "second hand",
			value: e.ticker,
			onChange: (e) => t({ ticker: e }),
			presets: [["#f2b200", "yellow"], ...oe.filter(([e]) => e !== "#f2b200")]
		}),
		/* @__PURE__ */ u("label", {
			className: "wp-field",
			children: ["time zone", /* @__PURE__ */ l("select", {
				className: "wp-input",
				value: e.timeZone,
				onChange: (e) => t({ timeZone: e.target.value }),
				children: P.map((e) => /* @__PURE__ */ l("option", {
					value: e.id,
					children: e.label
				}, e.id))
			})]
		}),
		/* @__PURE__ */ l(ae, {
			label: "second hand",
			value: e.seconds ? "on" : "off",
			options: [["on", "on"], ["off", "off"]],
			onChange: (e) => t({ seconds: e === "on" })
		})
	] });
}
var ke = {
	id: "clock",
	label: "Clock",
	Widget: De,
	Settings: Oe
}, L = {
	length: {
		label: "length",
		units: {
			mm: .001,
			cm: .01,
			m: 1,
			km: 1e3,
			in: .0254,
			ft: .3048,
			yd: .9144,
			mi: 1609.344,
			nmi: 1852
		},
		from: "mi",
		to: "km"
	},
	weight: {
		label: "weight",
		units: {
			mg: 1e-6,
			g: .001,
			kg: 1,
			t: 1e3,
			oz: .028349523125,
			lb: .45359237,
			st: 6.35029318
		},
		from: "lb",
		to: "kg"
	},
	volume: {
		label: "volume",
		units: {
			ml: .001,
			l: 1,
			"US cup": .2365882365,
			"US fl oz": .0295735295625,
			"US qt": .946352946,
			"US gal": 3.785411784,
			"UK gal": 4.54609
		},
		from: "US gal",
		to: "l"
	},
	speed: {
		label: "speed",
		units: {
			"m/s": 1,
			"km/h": 1 / 3.6,
			mph: .44704,
			kn: 1852 / 3600
		},
		from: "mph",
		to: "km/h"
	},
	area: {
		label: "area",
		units: {
			"m²": 1,
			"km²": 1e6,
			ha: 1e4,
			"ft²": .09290304,
			acre: 4046.8564224,
			"mi²": 2589988.110336
		},
		from: "acre",
		to: "m²"
	},
	temperature: {
		label: "temperature",
		units: {
			"°F": null,
			"°C": null,
			K: null
		},
		from: "°F",
		to: "°C"
	},
	currency: {
		label: "currency",
		units: null,
		from: "USD",
		to: "EUR"
	}
}, R = "min-w-0 rounded-md bg-[var(--os-card)] px-1.5 py-1 text-[12px] ring-1 ring-[var(--w-line)] focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]", Ae = "w-full min-w-0 rounded-md bg-[var(--os-card)] px-2 py-1 text-[13px] ring-1 ring-[var(--w-line)] focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";
function je(e, t, n) {
	let r = t === "°C" ? e : t === "°F" ? (e - 32) * 5 / 9 : e - 273.15;
	return n === "°C" ? r : n === "°F" ? r * 9 / 5 + 32 : r + 273.15;
}
var z = {
	names: null,
	rates: /* @__PURE__ */ new Map()
};
async function Me() {
	if (z.names) return z.names;
	let e = await fetch("https://api.frankfurter.dev/v1/currencies");
	if (!e.ok) throw Error("rates");
	return z.names = await e.json(), z.names;
}
async function Ne(e, t) {
	let n = `${e}>${t}`, r = z.rates.get(n);
	if (r && Date.now() - r.at < 36e5) return r;
	let i = await fetch(`https://api.frankfurter.dev/v1/latest?base=${e}&symbols=${t}`);
	if (!i.ok) throw Error("rates");
	let a = await i.json(), o = {
		rate: a.rates[t],
		date: a.date,
		at: Date.now()
	};
	return z.rates.set(n, o), o;
}
var Pe = (e, t) => Number.isFinite(e) ? e.toLocaleString(t, {
	maximumSignificantDigits: Math.abs(e) >= 1 ? 10 : 6,
	maximumFractionDigits: 6
}) : "—";
function Fe() {
	let [e] = D(), [t, n] = v("convert", {
		group: "currency",
		value: "1",
		from: "USD",
		to: "EUR"
	}), [r, a] = s(z.names), [o, c] = s(null), d = L[t.group] ? t.group : "currency", f = d === "currency", p = Object.keys(f ? r || {
		USD: "",
		EUR: "",
		ILS: "",
		GBP: ""
	} : L[d].units), m = p.includes(t.from) ? t.from : L[d].from, h = p.includes(t.to) ? t.to : L[d].to, g = Number.parseFloat(String(t.value).replace(",", ".")), _ = `${m}>${h}`;
	i(() => {
		if (!f || r) return;
		let e = !1;
		return Me().then((t) => !e && a(t)).catch(() => {}), () => {
			e = !0;
		};
	}, [f, r]), i(() => {
		if (!f || m === h) return;
		let e = !1;
		return Ne(m, h).then((t) => !e && c({
			key: _,
			rate: t.rate,
			date: t.date
		})).catch(() => !e && c({
			key: _,
			error: !0
		})), () => {
			e = !0;
		};
	}, [
		f,
		m,
		h,
		_
	]);
	let y = NaN, b = "";
	Number.isFinite(g) && (f ? m === h ? y = g : o?.key === _ && !o.error ? (y = g * o.rate, b = `ECB rate, ${o.date}`) : b = o?.key === _ ? "Rates aren't available right now." : "Getting today's rate…" : y = d === "temperature" ? je(g, m, h) : g * L[d].units[m] / L[d].units[h]);
	let x = (e) => n((t) => ({
		...t,
		...e
	})), S = f && r?.[m] && r?.[h] ? `${r[m]} → ${r[h]}` : "";
	return /* @__PURE__ */ u("section", {
		className: "widget widget-convert px-3.5 pb-3.5 pt-3",
		"aria-label": "Convert",
		children: [
			/* @__PURE__ */ u("div", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ l("span", {
					className: "text-[10px] uppercase tracking-[0.16em] text-[var(--os-ink-3)]",
					children: "convert"
				}), /* @__PURE__ */ l("select", {
					value: d,
					onChange: (e) => x({
						group: e.target.value,
						from: L[e.target.value].from,
						to: L[e.target.value].to
					}),
					className: R,
					"aria-label": "What to convert",
					children: Object.entries(L).map(([e, t]) => /* @__PURE__ */ l("option", {
						value: e,
						children: t.label
					}, e))
				})]
			}),
			/* @__PURE__ */ l("input", {
				value: t.value,
				onChange: (e) => x({ value: e.target.value.slice(0, 18) }),
				inputMode: "decimal",
				"aria-label": "Amount",
				className: `${Ae} mt-2.5 text-[15px] tabular-nums`
			}),
			/* @__PURE__ */ u("div", {
				className: "mt-2 flex items-center gap-1",
				children: [
					/* @__PURE__ */ l("select", {
						value: m,
						onChange: (e) => x({ from: e.target.value }),
						className: `${R} flex-1`,
						"aria-label": "From",
						children: p.map((e) => /* @__PURE__ */ l("option", {
							value: e,
							children: e
						}, e))
					}),
					/* @__PURE__ */ l("button", {
						type: "button",
						onClick: () => x({
							from: h,
							to: m
						}),
						className: "widget-mini-btn shrink-0",
						"aria-label": "Swap",
						title: "Swap",
						children: "⇄"
					}),
					/* @__PURE__ */ l("select", {
						value: h,
						onChange: (e) => x({ to: e.target.value }),
						className: `${R} flex-1`,
						"aria-label": "To",
						children: p.map((e) => /* @__PURE__ */ l("option", {
							value: e,
							children: e
						}, e))
					})
				]
			}),
			/* @__PURE__ */ u("div", {
				className: "mt-3 truncate text-[26px] font-light leading-none tracking-tight tabular-nums",
				"aria-live": "polite",
				children: [Pe(y, e.locale), /* @__PURE__ */ l("span", {
					className: "ml-1 text-[13px] font-medium text-[var(--os-ink-3)]",
					children: h
				})]
			}),
			/* @__PURE__ */ l("div", {
				className: "mt-1.5 truncate text-[10.5px] text-[var(--os-ink-2)]",
				children: S
			}),
			/* @__PURE__ */ l("div", {
				className: "h-[14px] truncate text-[10.5px] text-[var(--os-ink-3)]",
				children: b
			})
		]
	});
}
var Ie = {
	id: "convert",
	label: "Convert",
	Widget: Fe
}, Le = (...e) => e.filter((e, t, n) => !!e && e.trim() !== "" && n.indexOf(e) === t).join(" ").trim(), Re = (e) => e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), ze = (e) => e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, t, n) => n ? n.toUpperCase() : t.toLowerCase()), Be = (e) => {
	let t = ze(e);
	return t.charAt(0).toUpperCase() + t.slice(1);
}, Ve = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 24,
	height: 24,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round",
	strokeLinejoin: "round"
}, He = (e) => {
	for (let t in e) if (t.startsWith("aria-") || t === "role" || t === "title") return !0;
	return !1;
}, Ue = n(({ color: e = "currentColor", size: n = 24, strokeWidth: r = 2, absoluteStrokeWidth: i, className: a = "", children: o, iconNode: s, ...c }, l) => t("svg", {
	ref: l,
	...Ve,
	width: n,
	height: n,
	stroke: e,
	strokeWidth: i ? Number(r) * 24 / Number(n) : r,
	className: Le("lucide", a),
	...!o && !He(c) && { "aria-hidden": "true" },
	...c
}, [...s.map(([e, n]) => t(e, n)), ...Array.isArray(o) ? o : [o]])), B = (e, r) => {
	let i = n(({ className: n, ...i }, a) => t(Ue, {
		ref: a,
		iconNode: r,
		className: Le(`lucide-${Re(Be(e))}`, `lucide-${e}`, n),
		...i
	}));
	return i.displayName = Be(e), i;
}, We = B("chevron-right", [["path", {
	d: "m9 18 6-6-6-6",
	key: "mthhwq"
}]]), Ge = B("cloud-drizzle", [
	["path", {
		d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",
		key: "1pljnt"
	}],
	["path", {
		d: "M8 19v1",
		key: "1dk2by"
	}],
	["path", {
		d: "M8 14v1",
		key: "84yxot"
	}],
	["path", {
		d: "M16 19v1",
		key: "v220m7"
	}],
	["path", {
		d: "M16 14v1",
		key: "g12gj6"
	}],
	["path", {
		d: "M12 21v1",
		key: "q8vafk"
	}],
	["path", {
		d: "M12 16v1",
		key: "1mx6rx"
	}]
]), Ke = B("cloud-fog", [
	["path", {
		d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",
		key: "1pljnt"
	}],
	["path", {
		d: "M16 17H7",
		key: "pygtm1"
	}],
	["path", {
		d: "M17 21H9",
		key: "1u2q02"
	}]
]), qe = B("cloud-lightning", [["path", {
	d: "M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973",
	key: "1cez44"
}], ["path", {
	d: "m13 12-3 5h4l-3 5",
	key: "1t22er"
}]]), Je = B("cloud-moon", [["path", {
	d: "M13 16a3 3 0 0 1 0 6H7a5 5 0 1 1 4.9-6z",
	key: "ie2ih4"
}], ["path", {
	d: "M18.376 14.512a6 6 0 0 0 3.461-4.127c.148-.625-.659-.97-1.248-.714a4 4 0 0 1-5.259-5.26c.255-.589-.09-1.395-.716-1.248a6 6 0 0 0-4.594 5.36",
	key: "zwnc1e"
}]]), Ye = B("cloud-rain", [
	["path", {
		d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",
		key: "1pljnt"
	}],
	["path", {
		d: "M16 14v6",
		key: "1j4efv"
	}],
	["path", {
		d: "M8 14v6",
		key: "17c4r9"
	}],
	["path", {
		d: "M12 16v6",
		key: "c8a4gj"
	}]
]), Xe = B("cloud-snow", [
	["path", {
		d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",
		key: "1pljnt"
	}],
	["path", {
		d: "M8 15h.01",
		key: "a7atzg"
	}],
	["path", {
		d: "M8 19h.01",
		key: "puxtts"
	}],
	["path", {
		d: "M12 17h.01",
		key: "p32p05"
	}],
	["path", {
		d: "M12 21h.01",
		key: "h35vbk"
	}],
	["path", {
		d: "M16 15h.01",
		key: "rnfrdf"
	}],
	["path", {
		d: "M16 19h.01",
		key: "1vcnzz"
	}]
]), Ze = B("cloud-sun", [
	["path", {
		d: "M12 2v2",
		key: "tus03m"
	}],
	["path", {
		d: "m4.93 4.93 1.41 1.41",
		key: "149t6j"
	}],
	["path", {
		d: "M20 12h2",
		key: "1q8mjw"
	}],
	["path", {
		d: "m19.07 4.93-1.41 1.41",
		key: "1shlcs"
	}],
	["path", {
		d: "M15.947 12.65a4 4 0 0 0-5.925-4.128",
		key: "dpwdj0"
	}],
	["path", {
		d: "M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z",
		key: "s09mg5"
	}]
]), Qe = B("cloud", [["path", {
	d: "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z",
	key: "p7xjir"
}]]), $e = B("external-link", [
	["path", {
		d: "M15 3h6v6",
		key: "1q9fwt"
	}],
	["path", {
		d: "M10 14 21 3",
		key: "gplh6r"
	}],
	["path", {
		d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
		key: "a6xqqp"
	}]
]), V = B("image", [
	["rect", {
		width: "18",
		height: "18",
		x: "3",
		y: "3",
		rx: "2",
		ry: "2",
		key: "1m3agn"
	}],
	["circle", {
		cx: "9",
		cy: "9",
		r: "2",
		key: "af1f0g"
	}],
	["path", {
		d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",
		key: "1xmnt7"
	}]
]), et = B("locate-fixed", [
	["line", {
		x1: "2",
		x2: "5",
		y1: "12",
		y2: "12",
		key: "bvdh0s"
	}],
	["line", {
		x1: "19",
		x2: "22",
		y1: "12",
		y2: "12",
		key: "1tbv5k"
	}],
	["line", {
		x1: "12",
		x2: "12",
		y1: "2",
		y2: "5",
		key: "11lu5j"
	}],
	["line", {
		x1: "12",
		x2: "12",
		y1: "19",
		y2: "22",
		key: "x3vr5v"
	}],
	["circle", {
		cx: "12",
		cy: "12",
		r: "7",
		key: "fim9np"
	}],
	["circle", {
		cx: "12",
		cy: "12",
		r: "3",
		key: "1v7zrd"
	}]
]), tt = B("moon", [["path", {
	d: "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",
	key: "kfwtm"
}]]), nt = B("plane", [["path", {
	d: "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z",
	key: "1v9wt8"
}]]), rt = B("play", [["path", {
	d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",
	key: "10ikf1"
}]]), it = B("radio-tower", [
	["path", {
		d: "M4.9 16.1C1 12.2 1 5.8 4.9 1.9",
		key: "s0qx1y"
	}],
	["path", {
		d: "M7.8 4.7a6.14 6.14 0 0 0-.8 7.5",
		key: "1idnkw"
	}],
	["circle", {
		cx: "12",
		cy: "9",
		r: "2",
		key: "1092wv"
	}],
	["path", {
		d: "M16.2 4.8c2 2 2.26 5.11.8 7.47",
		key: "ojru2q"
	}],
	["path", {
		d: "M19.1 1.9a9.96 9.96 0 0 1 0 14.1",
		key: "rhi7fg"
	}],
	["path", {
		d: "M9.5 18h5",
		key: "mfy3pd"
	}],
	["path", {
		d: "m8 22 4-11 4 11",
		key: "25yftu"
	}]
]), at = B("square", [["rect", {
	width: "18",
	height: "18",
	x: "3",
	y: "3",
	rx: "2",
	key: "afitv7"
}]]), ot = B("sun", [
	["circle", {
		cx: "12",
		cy: "12",
		r: "4",
		key: "4exip2"
	}],
	["path", {
		d: "M12 2v2",
		key: "tus03m"
	}],
	["path", {
		d: "M12 20v2",
		key: "1lh1kg"
	}],
	["path", {
		d: "m4.93 4.93 1.41 1.41",
		key: "149t6j"
	}],
	["path", {
		d: "m17.66 17.66 1.41 1.41",
		key: "ptbguv"
	}],
	["path", {
		d: "M2 12h2",
		key: "1t8f8n"
	}],
	["path", {
		d: "M20 12h2",
		key: "1q8mjw"
	}],
	["path", {
		d: "m6.34 17.66-1.41 1.41",
		key: "1m8zz5"
	}],
	["path", {
		d: "m19.07 4.93-1.41 1.41",
		key: "1shlcs"
	}]
]), st = B("x", [["path", {
	d: "M18 6 6 18",
	key: "1bl5f8"
}], ["path", {
	d: "m6 6 12 12",
	key: "d8bk6v"
}]]), ct = {
	AA: "AAL",
	UA: "UAL",
	DL: "DAL",
	WN: "SWA",
	B6: "JBU",
	AS: "ASA",
	NK: "NKS",
	F9: "FFT",
	HA: "HAL",
	LY: "ELY",
	BA: "BAW",
	VS: "VIR",
	LH: "DLH",
	AF: "AFR",
	KL: "KLM",
	IB: "IBE",
	AY: "FIN",
	SK: "SAS",
	LX: "SWR",
	OS: "AUA",
	TK: "THY",
	EK: "UAE",
	QR: "QTR",
	EY: "ETD",
	FR: "RYR",
	U2: "EZY",
	AC: "ACA",
	AM: "AMX",
	AV: "AVA",
	CM: "CMP",
	LA: "LAN",
	SQ: "SIA",
	CX: "CPA",
	NH: "ANA",
	JL: "JAL",
	QF: "QFA"
}, lt = "w-full min-w-0 rounded-md bg-[var(--os-card)] px-2 py-1 text-[13px] ring-1 ring-[var(--w-line)] focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";
function ut(e) {
	let t = e.toUpperCase().replace(/[^A-Z0-9]/g, ""), n = t.match(/^([A-Z0-9]{2})(\d{1,4})$/), r = n && ct[n[1]] ? `${ct[n[1]]}${n[2]}` : null;
	return [...new Set([t, r].filter(Boolean))];
}
async function dt(e) {
	for (let t of ut(e)) {
		let e = await fetch(`https://api.adsbdb.com/v0/callsign/${t}`).catch(() => null);
		if (!e) throw Error("offline");
		if (e.status === 404 || e.status === 400) continue;
		let n = (await e.json())?.response?.flightroute;
		if (n) return n;
	}
	throw Error("unknown");
}
function ft(e, t) {
	let n = Math.PI / 180, r = (t.lat - e.lat) * n, i = (t.lon - e.lon) * n, a = Math.sin(r / 2) ** 2 + Math.cos(e.lat * n) * Math.cos(t.lat * n) * Math.sin(i / 2) ** 2;
	return 12742 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function pt() {
	let [e, t] = v("flight", { flight: "LY1" }), [n, r] = s(e.flight), [a, o] = s({
		flight: null,
		route: null,
		error: null
	}), d = e.flight, [f] = D();
	i(() => {
		if (!d) return;
		let e = !1;
		return dt(d).then((t) => !e && o({
			flight: d,
			route: t,
			error: null
		})).catch((t) => !e && o({
			flight: d,
			route: null,
			error: t.message
		})), () => {
			e = !0;
		};
	}, [d]);
	let p = a.flight === d ? a : {
		route: null,
		error: null
	}, m = p.route, h = m ? ft({
		lat: m.origin.latitude,
		lon: m.origin.longitude
	}, {
		lat: m.destination.latitude,
		lon: m.destination.longitude
	}) : 0, g = f.temperature === "f" ? `${Math.round(h * .621371).toLocaleString(f.locale)} mi` : `${Math.round(h).toLocaleString(f.locale)} km`, _ = m?.callsign_icao || d;
	return /* @__PURE__ */ u("section", {
		className: "widget widget-flight px-3.5 pb-3.5 pt-3",
		"aria-label": "Flight tracker",
		children: [/* @__PURE__ */ u("form", {
			className: "flex items-center gap-1.5",
			onSubmit: (e) => {
				e.preventDefault();
				let r = n.trim().toUpperCase();
				r && t({ flight: r });
			},
			children: [
				/* @__PURE__ */ l(nt, {
					className: "h-3.5 w-3.5 shrink-0 text-[var(--os-ink-3)]",
					"aria-hidden": "true"
				}),
				/* @__PURE__ */ l("input", {
					value: n,
					onChange: (e) => r(e.target.value.slice(0, 10)),
					placeholder: "Flight, e.g. LY1",
					"aria-label": "Flight number",
					className: `${lt} font-mono uppercase`
				}),
				/* @__PURE__ */ l("button", {
					type: "submit",
					className: "widget-mini-btn shrink-0 ring-1 ring-[var(--w-line)]",
					"aria-label": "Look up flight",
					title: "Look up",
					children: "↵"
				})
			]
		}), m ? /* @__PURE__ */ u(c, { children: [
			/* @__PURE__ */ l("div", {
				className: "mt-2.5 truncate text-[12px] font-semibold",
				children: m.airline?.name || "Flight"
			}),
			/* @__PURE__ */ l("div", {
				className: "text-[10.5px] text-[var(--os-ink-3)]",
				children: [m.callsign_iata, m.callsign_icao].filter(Boolean).join(" · ")
			}),
			/* @__PURE__ */ u("div", {
				className: "mt-2.5 flex items-center justify-between gap-2",
				children: [
					/* @__PURE__ */ u("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ l("div", {
							className: "text-[22px] font-semibold leading-none tracking-tight",
							children: m.origin.iata_code
						}), /* @__PURE__ */ l("div", {
							className: "truncate text-[10.5px] text-[var(--os-ink-3)]",
							children: m.origin.municipality
						})]
					}),
					/* @__PURE__ */ l("div", {
						className: "widget-flight-path",
						"aria-hidden": "true",
						children: /* @__PURE__ */ l(nt, { className: "h-3.5 w-3.5 rotate-45 text-[var(--os-accent)]" })
					}),
					/* @__PURE__ */ u("div", {
						className: "min-w-0 text-right",
						children: [/* @__PURE__ */ l("div", {
							className: "text-[22px] font-semibold leading-none tracking-tight",
							children: m.destination.iata_code
						}), /* @__PURE__ */ l("div", {
							className: "truncate text-[10.5px] text-[var(--os-ink-3)]",
							children: m.destination.municipality
						})]
					})
				]
			}),
			/* @__PURE__ */ u("div", {
				className: "mt-2 text-center text-[10.5px] text-[var(--os-ink-3)]",
				children: [g, " great-circle"]
			}),
			/* @__PURE__ */ u(j, {
				href: `https://globe.adsbexchange.com/?callsign=${encodeURIComponent(_)}`,
				className: "mt-2 flex items-center justify-center gap-1 rounded-full py-1 text-[11.5px] ring-1 ring-[var(--w-line)] hover:bg-[var(--os-hover)]",
				children: ["track live ", /* @__PURE__ */ l($e, {
					className: "h-3 w-3",
					"aria-hidden": "true"
				})]
			})
		] }) : /* @__PURE__ */ l("div", {
			className: "flex h-[150px] items-center justify-center px-2 text-center text-[12px] text-[var(--os-ink-3)]",
			children: p.error === "unknown" ? `No route found for ${d}. Try the airline's code, like LY1 or ELY1.` : p.error ? "Couldn't reach the flight database." : "Looking up the route…"
		})]
	});
}
var mt = {
	id: "flight-tracker",
	label: "Flight Tracker",
	Widget: pt
}, ht = 6e4, gt = "!ffffffff", _t = (e) => e && typeof e.url == "string" && typeof e.token == "string" && e.url && e.token;
function vt(e) {
	let t = e.trim().replace(/\/+$/, "");
	return t ? (/^https?:\/\//i.test(t) || (t = /^(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(t) ? `http://${t}` : `https://${t}`), t.replace(/\/api(\/v1)?$/i, "")) : "";
}
async function H(e, t) {
	let n;
	try {
		n = await fetch(`${e.url}/api/v1${t}`, {
			headers: {
				Authorization: `Bearer ${e.token}`,
				Accept: "application/json"
			},
			credentials: "omit",
			cache: "no-store"
		});
	} catch {
		throw Error("unreachable");
	}
	if (n.status === 401) throw Error("token");
	if (n.status === 403) throw Error("permission");
	if (!n.ok) throw Error("server");
	let r = await n.json().catch(() => null);
	if (!r || r.success === !1) throw Error("server");
	return r.data;
}
function yt(e, t = "", n = "") {
	return e.message === "unreachable" ? `Couldn't reach ${t || "MeshMonitor"}. Check the address, that it's online, and that MeshMonitor's ALLOWED_ORIGINS setting includes ${n || "this page's address"}.` : e.message === "token" ? "MeshMonitor didn't accept that API token." : e.message === "permission" ? "That token isn't allowed to read nodes on this source." : "MeshMonitor answered with an error. Check that it's version 4.13 or newer.";
}
async function bt(e) {
	let t = `/sources/${encodeURIComponent(e.source)}`, [n, r, i] = await Promise.all([
		H(e, `${t}/nodes`),
		H(e, `${t}/status`).catch(() => null),
		H(e, `${t}/messages?limit=25`).catch(() => [])
	]), a = Array.isArray(n) ? n : [], o = Date.now() / 1e3, s = (e) => a.filter((t) => t.lastHeard && o - t.lastHeard < e).length, c = (e) => {
		let t = a.find((t) => t.nodeId === e);
		return t?.longName || t?.shortName || e;
	}, l = (Array.isArray(i) ? i : []).find((e) => e.text && e.toNodeId === gt);
	return {
		total: a.length,
		hour: s(3600),
		day: s(86400),
		week: s(604800),
		local: r ? {
			name: r.longName || r.shortName || r.localNodeId,
			connected: !!r.connected
		} : null,
		message: l ? {
			from: c(l.fromNodeId),
			text: l.text,
			at: l.timestamp
		} : null
	};
}
function xt(e) {
	let t = e ? `${e.url}|${e.source}|${e.token}` : "", [n, r] = s({
		key: t,
		data: null,
		error: null
	});
	return i(() => {
		if (!e) return;
		let n = !1, i = async () => {
			try {
				let i = await bt(e);
				n || r({
					key: t,
					data: i,
					error: null
				});
			} catch (e) {
				n || r((n) => ({
					key: t,
					data: n.key === t ? n.data : null,
					error: e
				}));
			}
		};
		i();
		let a = setInterval(i, ht);
		return () => {
			n = !0, clearInterval(a);
		};
	}, [t]), e && n.key === t ? n : {
		data: null,
		error: null
	};
}
var St = (e) => {
	let t = Math.max(0, (Date.now() - e) / 1e3);
	return t < 60 ? "now" : t < 3600 ? `${Math.floor(t / 60)} min` : t < 86400 ? `${Math.floor(t / 3600)} h` : `${Math.floor(t / 86400)} d`;
};
function Ct({ openSettings: e }) {
	let { origin: t } = h(), [n] = v("meshmonitor", null), r = _t(n) ? {
		url: n.url,
		token: n.token,
		source: n.source || "default"
	} : null, { data: i, error: a } = xt(r);
	ue();
	let o = i && !a && i.local?.connected !== !1;
	return /* @__PURE__ */ u("section", {
		className: "widget widget-mesh px-3.5 pb-4 pt-3",
		"aria-label": r ? `Mesh: ${i ? `${i.hour} nodes heard in the last hour` : "loading"}` : "Mesh: not connected",
		children: [
			/* @__PURE__ */ u("div", {
				className: "flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--os-ink-3)]",
				children: [/* @__PURE__ */ l("span", {
					className: `widget-led ${o ? "widget-led-on" : ""}`,
					"aria-hidden": "true"
				}), /* @__PURE__ */ l("span", {
					className: "min-w-0 truncate",
					children: r && i?.local?.name || "mesh"
				})]
			}),
			r ? i ? /* @__PURE__ */ u(c, { children: [
				/* @__PURE__ */ u("div", {
					className: "mt-1.5 flex items-end gap-2",
					children: [/* @__PURE__ */ l("span", {
						className: "widget-weather-temp",
						children: i.hour
					}), /* @__PURE__ */ u("span", {
						className: "mb-1 text-[11px] leading-tight text-[var(--os-ink-3)]",
						children: [
							"heard in the",
							/* @__PURE__ */ l("br", {}),
							"last hour"
						]
					})]
				}),
				/* @__PURE__ */ l("div", {
					className: "mt-2 grid grid-cols-3 gap-1 border-t border-[var(--w-line)] pt-2 text-center tabular-nums",
					children: [
						["day", i.day],
						["week", i.week],
						["all", i.total]
					].map(([e, t]) => /* @__PURE__ */ u("div", { children: [/* @__PURE__ */ l("div", {
						className: "text-[14px] font-semibold",
						children: t
					}), /* @__PURE__ */ l("div", {
						className: "text-[9.5px] uppercase tracking-[0.12em] text-[var(--os-ink-3)]",
						children: e
					})] }, e))
				}),
				/* @__PURE__ */ l("div", {
					className: "mt-2 min-h-[34px] border-t border-[var(--w-line)] pt-2 text-[11px] leading-snug",
					children: i.message ? /* @__PURE__ */ u(c, { children: [/* @__PURE__ */ u("div", {
						className: "flex items-baseline justify-between gap-2 text-[10px] text-[var(--os-ink-3)]",
						children: [/* @__PURE__ */ l("span", {
							className: "truncate font-semibold text-[var(--os-ink-2)]",
							children: i.message.from
						}), /* @__PURE__ */ l("span", {
							className: "shrink-0",
							children: St(i.message.at)
						})]
					}), /* @__PURE__ */ l("p", {
						className: "line-clamp-2 text-[var(--os-ink-2)]",
						dir: "auto",
						children: i.message.text
					})] }) : /* @__PURE__ */ l("p", {
						className: "text-[var(--os-ink-3)]",
						children: "No channel messages yet."
					})
				})
			] }) : /* @__PURE__ */ l("div", {
				className: "flex h-[150px] items-center justify-center px-2 text-center text-[12px] text-[var(--os-ink-3)]",
				children: a ? yt(a, "", t).split(". ")[0] + "." : "Listening…"
			}) : /* @__PURE__ */ u("div", {
				className: "flex h-[150px] flex-col items-center justify-center gap-2 text-center",
				children: [
					/* @__PURE__ */ l(it, {
						className: "h-8 w-8 text-[var(--os-ink-3)]",
						strokeWidth: 1.4,
						"aria-hidden": "true"
					}),
					/* @__PURE__ */ l("p", {
						className: "text-[12px] leading-snug text-[var(--os-ink-2)]",
						children: "Connect your MeshMonitor to see your mesh here."
					}),
					/* @__PURE__ */ l("button", {
						type: "button",
						onClick: e,
						className: "rounded-full px-3 py-1 text-[12px] ring-1 ring-[var(--os-line)] hover:bg-[var(--os-hover)]",
						children: "set up…"
					})
				]
			}),
			/* @__PURE__ */ l("span", {
				className: "widget-credit",
				children: "MeshMonitor"
			})
		]
	});
}
function wt() {
	let { origin: e } = h(), [t, n] = v("meshmonitor", null), r = _t(t) ? t : null, [i, a] = s(r?.url || ""), [o, c] = s(r?.token || ""), [d, f] = s(null), [p, m] = s(r?.source || "default"), [g, _] = s(null), y = async () => {
		let t = vt(i);
		a(t), _({
			kind: "testing",
			text: "Connecting…"
		});
		try {
			let e = {
				url: t,
				token: o.trim(),
				source: p
			}, r = await H(e, "/sources"), i = Array.isArray(r) ? r : [];
			f(i);
			let a = i.some((e) => e.id === p) ? p : i.find((e) => e.isPrimary)?.id || i[0]?.id || "default";
			m(a);
			let s = await H({
				...e,
				source: a
			}, `/sources/${encodeURIComponent(a)}/status`).catch(() => null);
			n({
				...e,
				source: a
			});
			let c = i.find((e) => e.id === a)?.name, l = s?.longName || s?.shortName || s?.localNodeId;
			_({
				kind: "ok",
				text: `Connected${l ? ` to ${l}` : ""}${c ? ` on ${c}` : ""}.`
			});
		} catch (n) {
			_({
				kind: "error",
				text: yt(n, t, e)
			});
		}
	};
	return /* @__PURE__ */ u("form", {
		className: "grid gap-2",
		onSubmit: (e) => {
			e.preventDefault(), i.trim() && o.trim() && y();
		},
		children: [
			/* @__PURE__ */ u("label", {
				className: "wp-field",
				children: ["MeshMonitor address", /* @__PURE__ */ l("input", {
					className: "wp-input",
					value: i,
					onChange: (e) => a(e.target.value),
					placeholder: "https://meshmonitor.example.com",
					inputMode: "url",
					autoComplete: "off",
					spellCheck: !1
				})]
			}),
			/* @__PURE__ */ u("label", {
				className: "wp-field",
				children: ["API token", /* @__PURE__ */ l("input", {
					className: "wp-input font-mono",
					type: "password",
					value: o,
					onChange: (e) => c(e.target.value),
					placeholder: "mm_v1_…",
					autoComplete: "off",
					spellCheck: !1
				})]
			}),
			d && d.length > 1 && /* @__PURE__ */ u("label", {
				className: "wp-field",
				children: ["source", /* @__PURE__ */ l("select", {
					className: "wp-input",
					value: p,
					onChange: (e) => {
						m(e.target.value), r && n({
							...r,
							source: e.target.value
						});
					},
					children: d.map((e) => /* @__PURE__ */ u("option", {
						value: e.id,
						children: [e.name, e.type ? ` · ${e.type}` : ""]
					}, e.id))
				})]
			}),
			/* @__PURE__ */ u("div", {
				className: "flex justify-end gap-1.5",
				children: [r && /* @__PURE__ */ l("button", {
					type: "button",
					onClick: () => {
						n(null), c(""), f(null), _({
							kind: "ok",
							text: "Disconnected. The address and token were removed."
						});
					},
					className: "wp-btn text-[var(--os-warn)]",
					children: "disconnect"
				}), /* @__PURE__ */ l("button", {
					type: "submit",
					disabled: !i.trim() || !o.trim() || g?.kind === "testing",
					className: "wp-btn",
					children: r ? "save" : "connect"
				})]
			}),
			g && /* @__PURE__ */ l("p", {
				className: `text-[11px] leading-snug ${g.kind === "error" ? "text-[var(--os-warn)]" : "text-[var(--os-ink-2)]"}`,
				"aria-live": "polite",
				children: g.text
			}),
			/* @__PURE__ */ u("p", {
				className: "text-[10.5px] leading-snug text-[var(--os-ink-3)]",
				children: [
					"Make a token in MeshMonitor’s settings (read-only is plenty) and add ",
					/* @__PURE__ */ l("code", {
						className: "font-mono",
						children: e
					}),
					" to its",
					" ",
					/* @__PURE__ */ l("code", {
						className: "font-mono",
						children: "ALLOWED_ORIGINS"
					}),
					"."
				]
			})
		]
	});
}
var Tt = {
	id: "mesh",
	label: "Mesh",
	Widget: Ct,
	Settings: wt
}, Et = 2e4, Dt = "widgets-pack-photos", U = "photos", W = "wp-photos-changed";
function Ot() {
	return new Promise((e, t) => {
		let n = indexedDB.open(Dt, 1);
		n.onupgradeneeded = () => {
			n.result.objectStoreNames.contains(U) || n.result.createObjectStore(U, { keyPath: "id" });
		}, n.onsuccess = () => e(n.result), n.onerror = () => t(n.error || /* @__PURE__ */ Error("Photos can't be kept here."));
	});
}
async function G(e, t) {
	let n = await Ot();
	return new Promise((r, i) => {
		let a = n.transaction(U, e), o = t(a.objectStore(U));
		a.oncomplete = () => {
			n.close(), r(o?.result);
		}, a.onerror = () => {
			n.close(), i(a.error);
		};
	});
}
var kt = () => window.dispatchEvent(new Event(W)), At = async () => (await G("readonly", (e) => e.getAll()) || []).sort((e, t) => e.added - t.added);
async function jt(e) {
	await G("readwrite", (t) => t.delete(e)), kt();
}
function Mt(e, t, n = .85) {
	return new Promise((r, i) => {
		if (!e?.type?.startsWith("image/")) {
			i(/* @__PURE__ */ Error("That file isn't a picture."));
			return;
		}
		if (e.size > 41943040) {
			i(/* @__PURE__ */ Error("That picture is too large (40 MB at most)."));
			return;
		}
		let a = URL.createObjectURL(e), o = new Image();
		o.onload = () => {
			URL.revokeObjectURL(a);
			let e = Math.min(1, t / Math.max(o.naturalWidth, o.naturalHeight)), s = document.createElement("canvas");
			s.width = Math.round(o.naturalWidth * e), s.height = Math.round(o.naturalHeight * e);
			let c = s.getContext("2d");
			c.imageSmoothingQuality = "high", c.drawImage(o, 0, 0, s.width, s.height), s.toBlob((e) => e ? r(e) : i(/* @__PURE__ */ Error("That picture couldn't be read.")), "image/jpeg", n);
		}, o.onerror = () => {
			URL.revokeObjectURL(a), i(/* @__PURE__ */ Error("That picture couldn't be opened."));
		}, o.src = a;
	});
}
var Nt = (e) => new Promise((t, n) => {
	let r = new FileReader();
	r.onload = () => t(r.result), r.onerror = () => n(r.error), r.readAsDataURL(e);
});
async function Pt(e) {
	let [t, n] = await Promise.all([Mt(e, 1600), Mt(e, 240, .75)]), r = await Nt(n), i = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
	await G("readwrite", (n) => n.put({
		id: i,
		blob: t,
		thumb: r,
		name: e.name,
		added: Date.now()
	})), kt();
}
function Ft() {
	let [e, t] = s([]);
	return i(() => {
		let e = !1, n = () => At().then((n) => !e && t(n)).catch(() => !e && t([]));
		return n(), window.addEventListener(W, n), window.addEventListener("focus", n), () => {
			e = !0, window.removeEventListener(W, n), window.removeEventListener("focus", n);
		};
	}, []), e;
}
var It = {
	usePhotos: Ft,
	add: async (e) => {
		for (let t of e) await Pt(t).catch(() => {});
	},
	remove: jt
};
function Lt(e) {
	let t = a(() => e ? URL.createObjectURL(e) : null, [e]);
	return i(() => () => t && URL.revokeObjectURL(t), [t]), t;
}
function Rt(e) {
	let t = o(null), [n, r] = s(!1), i = async (t) => {
		r(!0);
		try {
			await e.add(t);
		} finally {
			r(!1);
		}
	};
	return {
		busy: n,
		pick: () => t.current?.click(),
		input: /* @__PURE__ */ l("input", {
			ref: t,
			type: "file",
			accept: "image/*",
			multiple: !0,
			className: "sr-only",
			tabIndex: -1,
			onChange: (e) => {
				i([...e.target.files || []]), e.target.value = "";
			}
		})
	};
}
function zt() {
	let e = h().photos || It, t = e.usePhotos(), [n, r] = s(0), [a, d] = s(!1), { busy: f, pick: p, input: m } = Rt(e), g = t.length, _ = g ? (n % g + g) % g : 0, v = g ? t[_] : null, y = Lt(v?.blob), b = o(null);
	return i(() => {
		if (g < 2 || a) return;
		let e = setInterval(() => r((e) => e + 1), Et);
		return () => clearInterval(e);
	}, [g, a]), i(() => {
		if (!a) return;
		let e = (e) => {
			e.key === "Escape" ? d(!1) : e.key === "ArrowRight" ? r((e) => e + 1) : e.key === "ArrowLeft" && r((e) => e - 1);
		};
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, [a]), i(() => {
		b.current?.querySelector("[aria-current='true']")?.scrollIntoView({
			block: "nearest",
			inline: "center"
		});
	}, [_, a]), a ? /* @__PURE__ */ u("section", {
		className: "widget widget-photos-big",
		"aria-label": "Photo gallery",
		children: [
			/* @__PURE__ */ u("div", {
				className: "flex items-center gap-2 px-1 pb-2 text-[12px]",
				children: [
					/* @__PURE__ */ l("button", {
						type: "button",
						onClick: () => d(!1),
						className: "widget-mini-btn",
						"aria-label": "Back to the frame",
						title: "Back to the frame",
						children: /* @__PURE__ */ l(st, {
							className: "h-3.5 w-3.5",
							strokeWidth: 2.2
						})
					}),
					/* @__PURE__ */ l("span", {
						className: "min-w-0 flex-1 truncate font-semibold",
						children: v ? v.name.replace(/\.[^.]+$/, "") : "photo gallery"
					}),
					g > 0 && /* @__PURE__ */ u("span", {
						className: "tabular-nums text-[var(--os-ink-3)]",
						children: [
							_ + 1,
							" / ",
							g
						]
					}),
					/* @__PURE__ */ l("button", {
						type: "button",
						disabled: f,
						onClick: p,
						className: "wp-btn",
						children: f ? "adding…" : "add photos…"
					}),
					v && /* @__PURE__ */ l("button", {
						type: "button",
						onClick: () => {
							e.remove(v.id), r(Math.max(0, Math.min(_, g - 2)));
						},
						className: "wp-btn",
						children: "remove"
					})
				]
			}),
			/* @__PURE__ */ u("div", {
				className: "widget-photos-stage",
				children: [v ? y && /* @__PURE__ */ l("img", {
					src: y,
					alt: v.name,
					className: "max-h-full max-w-full object-contain"
				}) : /* @__PURE__ */ u("div", {
					className: "text-center text-white/80",
					children: [/* @__PURE__ */ l(V, {
						className: "mx-auto h-10 w-10",
						strokeWidth: 1.3,
						"aria-hidden": "true"
					}), /* @__PURE__ */ l("p", {
						className: "mt-2 text-[13px]",
						children: "No photos yet."
					})]
				}), g > 1 && /* @__PURE__ */ u(c, { children: [/* @__PURE__ */ l("button", {
					type: "button",
					onClick: () => r(_ - 1),
					className: "widget-photos-arrow left-3",
					"aria-label": "Previous photo",
					children: /* @__PURE__ */ l(We, { className: "h-5 w-5 rotate-180" })
				}), /* @__PURE__ */ l("button", {
					type: "button",
					onClick: () => r(_ + 1),
					className: "widget-photos-arrow right-3",
					"aria-label": "Next photo",
					children: /* @__PURE__ */ l(We, { className: "h-5 w-5" })
				})] })]
			}),
			g > 0 && /* @__PURE__ */ l("div", {
				ref: b,
				className: "flex gap-1.5 overflow-x-auto pl-6 pt-2",
				role: "list",
				"aria-label": "Photos",
				children: t.map((e, t) => /* @__PURE__ */ l("button", {
					type: "button",
					role: "listitem",
					"aria-current": t === _,
					"aria-label": e.name,
					onClick: () => r(t),
					className: `widget-photos-thumb ${t === _ ? "widget-photos-thumb-on" : ""}`,
					children: /* @__PURE__ */ l("img", {
						src: e.thumb,
						alt: "",
						className: "h-full w-full object-cover"
					})
				}, e.id))
			}),
			m
		]
	}) : /* @__PURE__ */ u("section", {
		className: "widget widget-photos",
		"aria-label": v ? `Photo Gallery: ${v.name}` : "Photo Gallery",
		children: [
			v ? /* @__PURE__ */ l("button", {
				type: "button",
				onClick: () => d(!0),
				className: "widget-photos-frame",
				title: "Open the large view",
				"aria-label": `${v.name}. Open the large view.`,
				children: y && /* @__PURE__ */ l("img", {
					src: y,
					alt: "",
					className: "h-full w-full object-cover"
				})
			}) : /* @__PURE__ */ u("div", {
				className: "flex h-full flex-col items-center justify-center gap-2 p-4 text-center",
				children: [
					/* @__PURE__ */ l(V, {
						className: "h-8 w-8 text-[var(--os-ink-3)]",
						strokeWidth: 1.4,
						"aria-hidden": "true"
					}),
					/* @__PURE__ */ l("p", {
						className: "text-[12px] text-[var(--os-ink-2)]",
						children: "Your photos, in a frame."
					}),
					/* @__PURE__ */ l("button", {
						type: "button",
						disabled: f,
						onClick: p,
						className: "rounded-full px-3 py-1 text-[12px] ring-1 ring-[var(--os-line)] hover:bg-[var(--os-hover)]",
						children: f ? "adding…" : "add photos…"
					})
				]
			}),
			g > 1 && /* @__PURE__ */ l("div", {
				className: "widget-photos-dots",
				"aria-hidden": "true",
				children: t.slice(0, 8).map((e, t) => /* @__PURE__ */ l("span", { className: t === _ % 8 ? "on" : "" }, e.id))
			}),
			m
		]
	});
}
function Bt() {
	let e = h().photos || It, t = e.usePhotos(), { busy: n, pick: r, input: i } = Rt(e);
	return /* @__PURE__ */ u("div", {
		className: "grid gap-2",
		children: [
			/* @__PURE__ */ u("span", {
				className: "wp-field",
				children: ["photos · ", t.length]
			}),
			/* @__PURE__ */ u("div", {
				className: "grid grid-cols-4 gap-1.5",
				children: [t.map((t) => /* @__PURE__ */ u("div", {
					className: "relative",
					children: [/* @__PURE__ */ l("img", {
						src: t.thumb,
						alt: t.name,
						title: t.name,
						className: "aspect-square w-full rounded-md object-cover ring-1 ring-[var(--w-line,var(--os-line))]"
					}), /* @__PURE__ */ l("button", {
						type: "button",
						onClick: () => e.remove(t.id),
						className: "absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--os-ink)] text-[var(--os-case)] hover:bg-[var(--os-warn)]",
						"aria-label": `Remove ${t.name}`,
						title: "Remove",
						children: /* @__PURE__ */ l(st, {
							className: "h-2.5 w-2.5",
							strokeWidth: 3
						})
					})]
				}, t.id)), /* @__PURE__ */ u("button", {
					type: "button",
					disabled: n,
					onClick: r,
					className: "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md border border-dashed border-[var(--w-line,var(--os-line))] text-[10px] text-[var(--os-ink-2)] hover:bg-[var(--os-hover)]",
					"aria-label": "Add photos",
					children: [/* @__PURE__ */ l(V, {
						className: "h-3.5 w-3.5",
						strokeWidth: 1.6,
						"aria-hidden": "true"
					}), n ? "adding…" : "add…"]
				})]
			}),
			/* @__PURE__ */ l("p", {
				className: "text-[10.5px] leading-snug text-[var(--os-ink-3)]",
				children: "Photos are resized and kept on this computer. Nothing is uploaded."
			}),
			i
		]
	});
}
var Vt = {
	id: "photo-gallery",
	label: "Photo Gallery",
	Widget: zt,
	Settings: Bt
}, K = {
	status: "off",
	stream: null,
	audio: null,
	sound: null,
	start: null,
	listeners: /* @__PURE__ */ new Set()
};
function q(e) {
	Object.assign(K, e), K.listeners.forEach((e) => e());
}
function Ht() {
	let [, e] = s(0);
	return i(() => {
		let t = () => e((e) => e + 1);
		return K.listeners.add(t), () => K.listeners.delete(t);
	}, []), K;
}
function Ut(e) {
	if (!K.audio) {
		let t = e();
		t.preload = "none", t.addEventListener("playing", () => q({ status: "on" })), t.addEventListener("waiting", () => K.status !== "off" && q({ status: "tuning" })), t.addEventListener("error", () => K.status !== "off" && q({ status: "error" })), K.audio = t;
	}
	return K.audio;
}
function Wt(e, { volume: t, sound: n, createAudio: r = () => new Audio() }) {
	let i = Ut(r);
	i.src = e, n ? n.attach(i) : i.volume = t / 100, q({
		status: "tuning",
		stream: e,
		sound: n
	}), i.play().catch((e) => e?.name !== "AbortError" && K.status !== "off" && q({ status: "error" }));
}
function J() {
	let e = K.audio, t = K.sound;
	q({
		status: "off",
		stream: null,
		sound: null
	}), e && (e.pause(), e.removeAttribute("src"), e.load(), t?.detach(e));
}
function Gt(e) {
	K.audio && !K.sound && (K.audio.volume = e / 100);
}
function Kt(e) {
	K.start = e;
}
function qt() {
	K.status === "off" ? K.start?.() : J();
}
//#endregion
//#region widgets/radio/widget.jsx
var Jt = [
	{
		id: "rp",
		name: "Radio Paradise",
		genre: "eclectic mix · California",
		stream: "https://stream.radioparadise.com/mp3-128",
		site: "https://radioparadise.com/"
	},
	{
		id: "rp-mellow",
		name: "RP Mellow",
		genre: "mellow mix · California",
		stream: "https://stream.radioparadise.com/mellow-128",
		site: "https://radioparadise.com/"
	},
	{
		id: "kexp",
		name: "KEXP",
		genre: "indie and alternative · Seattle",
		stream: "https://kexp.streamguys1.com/kexp160.aac",
		site: "https://www.kexp.org/",
		nowPlaying: async () => {
			let e = (await (await fetch("https://api.kexp.org/v2/plays/?limit=1")).json()).results?.[0];
			return e?.play_type === "trackplay" && e.artist ? `${e.artist} — ${e.song}` : null;
		}
	},
	{
		id: "fip",
		name: "FIP",
		genre: "eclectic · Paris",
		stream: "https://icecast.radiofrance.fr/fip-midfi.mp3",
		site: "https://www.radiofrance.fr/fip"
	},
	{
		id: "fip-jazz",
		name: "FIP Jazz",
		genre: "jazz · Paris",
		stream: "https://icecast.radiofrance.fr/fipjazz-midfi.mp3",
		site: "https://www.radiofrance.fr/fip"
	},
	{
		id: "nts",
		name: "NTS 1",
		genre: "underground radio · London",
		stream: "https://stream-relay-geo.ntslive.net/stream",
		site: "https://www.nts.live/",
		nowPlaying: async () => ((await (await fetch("https://www.nts.live/api/v2/live")).json()).results?.find((e) => e.channel_name === "1"))?.now?.broadcast_title || null
	},
	{
		id: "galgalatz",
		name: "Galgalatz",
		genre: "Israeli and international pop · Tel Aviv",
		stream: "https://glzicylv01.bynetcdn.com/glglz_mp3",
		site: "https://glz.co.il/"
	},
	{
		id: "kiss-country",
		name: "Kiss Country 99.9",
		genre: "country · Miami",
		stream: "https://live.amperwave.net/direct/audacy-wkisfmaac-imc",
		site: "https://www.audacy.com/stations/kisscountry999"
	},
	{
		id: "revolution",
		name: "Revolution 93.5",
		genre: "dance and electronic · Miami",
		stream: "https://centova87.shoutcastservices.com/proxy/revolution935/stream",
		site: "https://www.revolution935.com/"
	}
], Yt = {
	key: "radio",
	defaults: {
		station: "rp",
		volume: 70
	}
}, Xt = 16, Zt = Xt - Jt.length, Qt = (e) => /^https?:\/\/[^\s"']+$/i.test(e);
function $t(e) {
	return (Array.isArray(e) ? e : []).filter((e) => e && typeof e.id == "string" && typeof e.name == "string" && Qt(e.stream || "")).slice(0, Zt).map((e) => ({
		id: e.id,
		name: e.name.slice(0, 40),
		genre: typeof e.genre == "string" && e.genre ? e.genre.slice(0, 60) : "your station",
		stream: e.stream,
		site: typeof e.site == "string" && /^https:\/\/[^\s"']+$/.test(e.site) ? e.site : null,
		own: !0
	}));
}
function en() {
	let [e, t] = v("radio-stations", []), n = $t(e);
	return {
		stations: [...Jt, ...n],
		own: n,
		saveOwn: t
	};
}
function tn(e, t) {
	return new Promise((n) => {
		let r = t();
		r.muted = !0, r.preload = "auto";
		let i = !1, a = (e) => {
			i || (i = !0, clearTimeout(o), r.pause(), r.removeAttribute("src"), r.load(), n(e));
		}, o = setTimeout(() => a("unknown"), 1e4);
		r.addEventListener("canplay", () => a("ok"), { once: !0 }), r.addEventListener("playing", () => a("ok"), { once: !0 }), r.addEventListener("error", () => a("bad"), { once: !0 }), r.src = e, r.play().catch((e) => e?.name !== "NotAllowedError" && e?.name !== "AbortError" && a("bad"));
	});
}
function nn(e, t) {
	let [n, r] = s(null);
	return i(() => {
		if (!t || !e.nowPlaying) return;
		let n = !1, i = async () => {
			try {
				let t = await e.nowPlaying();
				n || r({
					stationId: e.id,
					text: t
				});
			} catch {}
		};
		i();
		let a = setInterval(i, 3e4);
		return () => {
			n = !0, clearInterval(a);
		};
	}, [e, t]), t && n?.stationId === e.id ? n.text : null;
}
var rn = () => !1;
function an() {
	let [e, t] = y(Yt), { stations: n } = en(), r = n.length, a = n.findIndex((t) => t.id === e.station), o = a >= 0 ? a : 0, { sound: s, createAudio: c } = h(), { status: d } = Ht(), f = n[o], p = d !== "off", m = nn(f, d === "on"), g = () => Wt(f.stream, {
		volume: e.volume,
		sound: s,
		createAudio: c
	}), _ = (e) => t({ station: n[(o + e + r) % r].id });
	i(() => {
		K.status !== "off" && K.stream !== f.stream && Wt(f.stream, {
			volume: e.volume,
			sound: s,
			createAudio: c
		});
	}, [f.stream]), i(() => Gt(e.volume), [e.volume]), i(() => (Kt(g), () => {
		K.start === g && Kt(null);
	}));
	let v = (s?.useMuted || rn)();
	return /* @__PURE__ */ u("section", {
		className: "widget widget-radio",
		"aria-label": "Radio",
		children: [
			/* @__PURE__ */ l("div", {
				className: "widget-radio-grille",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ u("div", {
				className: "px-3.5 pt-3",
				children: [
					/* @__PURE__ */ u("div", {
						className: "flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--os-ink-3)]",
						children: [
							/* @__PURE__ */ l("span", {
								className: `widget-led ${d === "on" && !v ? "widget-led-on" : ""}`,
								"aria-hidden": "true"
							}),
							/* @__PURE__ */ l("span", {
								"aria-live": "polite",
								children: p ? d === "error" ? "no signal" : d === "tuning" ? "tuning…" : v ? "muted" : "on air" : "off"
							}),
							/* @__PURE__ */ u("span", {
								className: "ml-auto tabular-nums",
								children: [
									o + 1,
									"/",
									r
								]
							})
						]
					}),
					/* @__PURE__ */ l("div", {
						className: "mt-1 truncate text-[15px] font-semibold tracking-tight",
						children: f.name
					}),
					/* @__PURE__ */ l("div", {
						className: "truncate text-[11px] text-[var(--os-ink-3)]",
						title: m || f.genre,
						children: p && v && s?.unmute ? /* @__PURE__ */ l("button", {
							type: "button",
							className: "underline underline-offset-2 hover:text-[var(--os-ink)]",
							onClick: s.unmute,
							children: "turn sound on"
						}) : m || f.genre
					})
				]
			}),
			/* @__PURE__ */ u("div", {
				className: "flex items-end justify-between px-3.5 pb-4 pt-2.5",
				children: [/* @__PURE__ */ l("button", {
					type: "button",
					className: "widget-radio-dial",
					onClick: (e) => _(e.shiftKey ? -1 : 1),
					onKeyDown: (e) => {
						e.key === "ArrowLeft" || e.key === "ArrowDown" ? (e.preventDefault(), _(-1)) : (e.key === "ArrowRight" || e.key === "ArrowUp") && (e.preventDefault(), _(1));
					},
					"aria-label": `Station ${o + 1} of ${r}: ${f.name}. Turn to change station.`,
					title: "Turn to change station",
					children: /* @__PURE__ */ u("svg", {
						viewBox: "0 0 64 64",
						className: "h-full w-full",
						"aria-hidden": "true",
						children: [/* @__PURE__ */ u("g", {
							className: "widget-radio-wheel",
							style: { transform: `rotate(${-o * 360 / r}deg)` },
							children: [
								/* @__PURE__ */ l("circle", {
									cx: "32",
									cy: "32",
									r: "30",
									fill: "var(--w-face)"
								}),
								Array.from({ length: 36 }, (e, t) => /* @__PURE__ */ l("line", {
									x1: "32",
									y1: "3",
									x2: "32",
									y2: "6.5",
									stroke: "var(--w-mark)",
									strokeWidth: "0.8",
									transform: `rotate(${t * 10} 32 32)`
								}, t)),
								n.map((e, t) => {
									let n = t * 360 / r, i = Math.PI / 180 * n, a = 32 + Math.sin(i) * 19, o = 32 - Math.cos(i) * 19;
									return /* @__PURE__ */ l("text", {
										x: a,
										y: o,
										textAnchor: "middle",
										dominantBaseline: "central",
										transform: `rotate(${n} ${a} ${o})`,
										className: "widget-radio-num",
										style: r > 12 ? { fontSize: "6.5px" } : void 0,
										children: t + 1
									}, e.id);
								}),
								/* @__PURE__ */ l("circle", {
									cx: "32",
									cy: "32",
									r: "7",
									fill: "var(--w-case)",
									stroke: "var(--w-mark)",
									strokeWidth: "0.6"
								})
							]
						}), /* @__PURE__ */ l("path", {
							d: "M32 0 L35 5 L29 5 Z",
							fill: "var(--os-accent)"
						})]
					})
				}), /* @__PURE__ */ l("button", {
					type: "button",
					onClick: () => p ? J() : g(),
					"aria-pressed": p,
					"aria-label": p ? "Turn radio off" : "Turn radio on",
					title: p ? "Off" : "On",
					className: `os-knob widget-radio-power ${p ? "os-knob-power" : ""}`,
					children: p ? /* @__PURE__ */ l(at, {
						className: "h-3.5 w-3.5",
						fill: "currentColor",
						strokeWidth: 0
					}) : /* @__PURE__ */ l(rt, {
						className: "ml-0.5 h-4 w-4",
						fill: "currentColor",
						strokeWidth: 0
					})
				})]
			}),
			f.site && /* @__PURE__ */ l(j, {
				href: f.site,
				className: "widget-credit",
				children: f.name
			})
		]
	});
}
function on() {
	let [e, t] = y(Yt), { sound: n, createAudio: r } = h(), { stations: i, own: a, saveOwn: o } = en(), d = i.some((t) => t.id === e.station) ? e.station : i[0].id, [f, p] = s(""), [m, g] = s(""), [_, v] = s(null), b = async () => {
		let e = m.trim(), n = f.trim();
		if (!n || !Qt(e)) {
			v({
				kind: "error",
				text: "Give it a name and a stream address starting with http:// or https://."
			});
			return;
		}
		if (i.some((t) => t.stream === e)) {
			v({
				kind: "error",
				text: "That stream is already on the dial."
			});
			return;
		}
		v({
			kind: "testing",
			text: "Tuning in…"
		});
		let s = await tn(e, r);
		if (s === "bad") {
			v({
				kind: "error",
				text: "That stream didn't play. Use the direct stream address (often ending in /stream, .mp3, or .aac), not a .pls or .m3u playlist or a web page."
			});
			return;
		}
		let c = `own-${Date.now().toString(36)}`;
		o([...a, {
			id: c,
			name: n,
			stream: e
		}]), t({ station: c }), p(""), g(""), v({
			kind: "ok",
			text: s === "ok" ? `Added ${n} as station ${i.length + 1}.` : `Added ${n} as station ${i.length + 1}. It was slow to answer, so check that it plays.`
		});
	}, x = (n) => {
		o(a.filter((e) => e.id !== n)), e.station === n && t({ station: i[0].id });
	};
	return /* @__PURE__ */ u(c, { children: [
		/* @__PURE__ */ u("label", {
			className: "wp-field",
			children: ["station", /* @__PURE__ */ l("select", {
				className: "wp-input",
				value: d,
				onChange: (e) => t({ station: e.target.value }),
				children: i.map((e, t) => /* @__PURE__ */ u("option", {
					value: e.id,
					children: [
						t + 1,
						". ",
						e.name
					]
				}, e.id))
			})]
		}),
		n ? n.openSettings && /* @__PURE__ */ l("p", {
			className: "wp-field",
			children: /* @__PURE__ */ u("span", { children: [
				"volume and mute:",
				" ",
				/* @__PURE__ */ l("button", {
					type: "button",
					className: "underline underline-offset-2",
					onClick: n.openSettings,
					children: "sound settings"
				})
			] })
		}) : /* @__PURE__ */ u("label", {
			className: "wp-field",
			children: [
				"volume · ",
				e.volume,
				"%",
				/* @__PURE__ */ l("input", {
					type: "range",
					min: "0",
					max: "100",
					step: "5",
					value: e.volume,
					onChange: (e) => t({ volume: Number(e.target.value) }),
					className: "accent-[var(--os-accent)]"
				})
			]
		}),
		/* @__PURE__ */ u("div", {
			className: "wp-section grid gap-2",
			children: [
				/* @__PURE__ */ l("span", {
					className: "wp-label",
					children: "your stations"
				}),
				a.length > 0 && /* @__PURE__ */ l("ul", {
					className: "grid gap-1",
					children: a.map((e) => /* @__PURE__ */ u("li", {
						className: "flex items-center gap-1.5 text-[11.5px]",
						children: [
							/* @__PURE__ */ u("span", {
								className: "tabular-nums text-[var(--os-ink-3)]",
								children: [i.findIndex((t) => t.id === e.id) + 1, "."]
							}),
							/* @__PURE__ */ l("span", {
								className: "min-w-0 flex-1 truncate",
								title: e.stream,
								children: e.name
							}),
							/* @__PURE__ */ l("button", {
								type: "button",
								onClick: () => x(e.id),
								className: "widget-mini-btn h-5 w-5",
								"aria-label": `Remove ${e.name}`,
								title: "Remove",
								children: "×"
							})
						]
					}, e.id))
				}),
				a.length < Zt ? /* @__PURE__ */ u("form", {
					className: "grid gap-1.5",
					onSubmit: (e) => {
						e.preventDefault(), b();
					},
					children: [
						/* @__PURE__ */ l("input", {
							className: "wp-input",
							value: f,
							onChange: (e) => p(e.target.value.slice(0, 40)),
							placeholder: "Name, e.g. WLRN",
							"aria-label": "Station name"
						}),
						/* @__PURE__ */ l("input", {
							className: "wp-input",
							value: m,
							onChange: (e) => g(e.target.value),
							placeholder: "https://…/stream",
							"aria-label": "Stream address",
							inputMode: "url",
							autoComplete: "off",
							spellCheck: !1
						}),
						/* @__PURE__ */ l("div", {
							className: "flex justify-end",
							children: /* @__PURE__ */ l("button", {
								type: "submit",
								className: "wp-btn",
								disabled: !f.trim() || !m.trim() || _?.kind === "testing",
								children: _?.kind === "testing" ? "testing…" : "add station"
							})
						})
					]
				}) : /* @__PURE__ */ u("p", {
					className: "text-[11px] text-[var(--os-ink-3)]",
					children: [
						"The dial is full (",
						Xt,
						" stations). Remove one to add another."
					]
				}),
				_ && _.kind !== "testing" && /* @__PURE__ */ l("p", {
					className: `text-[11px] leading-snug ${_.kind === "error" ? "text-[var(--os-warn)]" : "text-[var(--os-ink-2)]"}`,
					"aria-live": "polite",
					children: _.text
				})
			]
		})
	] });
}
var sn = {
	id: "radio",
	label: "Radio",
	Widget: an,
	Settings: on
}, Y = {
	yellow: "#f2c94c",
	orange: "#f08a5d",
	green: "#8fb07a",
	blue: "#7fa6c4",
	grey: "#c9c4b8"
}, cn = (e = "yellow") => ({
	id: `n${Date.now().toString(36)}`,
	text: "",
	color: e
});
function ln(e) {
	let t = Array.isArray(e) ? e.filter((e) => e && typeof e.text == "string") : [];
	return t.length ? t.map((e) => ({
		id: String(e.id),
		text: e.text.slice(0, 2e3),
		color: Y[e.color] ? e.color : "yellow"
	})) : [{
		id: "n1",
		text: "",
		color: "yellow"
	}];
}
function un() {
	let [e, t] = v("notes", null), n = ln(e), [r, i] = s(0), a = Math.min(r, n.length - 1), o = n[a], c = (e) => t(n.map((t) => t.id === o.id ? {
		...t,
		...e
	} : t));
	return /* @__PURE__ */ u("section", {
		className: "widget widget-notes",
		"aria-label": "Sticky notes",
		style: { "--note": Y[o.color] },
		children: [/* @__PURE__ */ l("textarea", {
			value: o.text,
			maxLength: 2e3,
			onChange: (e) => c({ text: e.target.value }),
			placeholder: "Write a note…",
			"aria-label": `Note ${a + 1} of ${n.length}`,
			spellCheck: !0,
			dir: "auto",
			className: "widget-notes-text"
		}), /* @__PURE__ */ u("div", {
			className: "widget-notes-bar",
			children: [
				/* @__PURE__ */ l("button", {
					type: "button",
					disabled: a === 0,
					onClick: () => i(a - 1),
					className: "widget-notes-btn",
					"aria-label": "Previous note",
					children: "‹"
				}),
				/* @__PURE__ */ u("span", {
					className: "tabular-nums",
					children: [
						a + 1,
						"/",
						n.length
					]
				}),
				/* @__PURE__ */ l("button", {
					type: "button",
					disabled: a >= n.length - 1,
					onClick: () => i(a + 1),
					className: "widget-notes-btn",
					"aria-label": "Next note",
					children: "›"
				}),
				/* @__PURE__ */ l("span", {
					className: "ml-auto flex gap-1",
					role: "radiogroup",
					"aria-label": "Note color",
					children: Object.entries(Y).map(([e, t]) => /* @__PURE__ */ l("button", {
						type: "button",
						role: "radio",
						"aria-checked": o.color === e,
						"aria-label": e,
						onClick: () => c({ color: e }),
						className: `h-3 w-3 rounded-full ${o.color === e ? "ring-2 ring-[var(--os-ink)] ring-offset-1 ring-offset-transparent" : ""}`,
						style: { background: t }
					}, e))
				}),
				/* @__PURE__ */ l("button", {
					type: "button",
					onClick: () => {
						let e = [...n, cn(Object.keys(Y)[n.length % 5])];
						t(e), i(e.length - 1);
					},
					className: "widget-notes-btn",
					"aria-label": "New note",
					title: "New note",
					children: "+"
				}),
				/* @__PURE__ */ l("button", {
					type: "button",
					onClick: () => {
						let e = n.filter((e) => e.id !== o.id);
						t(e.length ? e : [cn()]), i((t) => Math.max(0, Math.min(t, e.length - 1)));
					},
					className: "widget-notes-btn",
					"aria-label": "Delete this note",
					title: "Delete this note",
					children: "×"
				})
			]
		})]
	});
}
var dn = {
	id: "sticky-notes",
	label: "Sticky Notes",
	Widget: un
}, X = {
	BTC: "bitcoin",
	ETH: "ethereum",
	SOL: "solana",
	XRP: "ripple",
	DOGE: "dogecoin",
	ADA: "cardano",
	LTC: "litecoin",
	BNB: "binancecoin"
}, Z = "AAPL, MSFT, NVDA, TSLA, BTC, ETH", fn = 6e4, pn = (e) => String(e || Z).toUpperCase().split(/[\s,]+/).filter((e) => /^[A-Z0-9.^-]{1,10}$/.test(e)).slice(0, 8);
async function mn(e, t) {
	let n = e.filter((e) => X[e]), r = e.filter((e) => !X[e]), i = {};
	if (n.length) {
		let e = n.map((e) => X[e]).join(","), t = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${e}&vs_currencies=usd&include_24hr_change=true`).catch(() => null), r = t?.ok ? await t.json() : {};
		n.forEach((e) => {
			let t = r[X[e]];
			t && (i[e] = {
				price: t.usd,
				change: t.usd_24h_change
			});
		});
	}
	return r.length && t && await Promise.all(r.map(async (e) => {
		let n = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(e)}&token=${encodeURIComponent(t)}`).catch(() => null);
		if (n?.status === 401) i[e] = { error: "key" };
		else if (n?.ok) {
			let t = await n.json();
			t && t.c && (i[e] = {
				price: t.c,
				change: t.dp
			});
		}
	})), i;
}
function hn({ openSettings: e }) {
	let [t] = v("stocks", {
		symbols: Z,
		key: ""
	}), n = pn(t.symbols), r = typeof t.key == "string" ? t.key : "", a = `${n.join(",")}|${r}`, [o, c] = s({
		key: a,
		data: null
	}), [d] = D();
	i(() => {
		let e = !1, t = () => mn(a.split("|")[0].split(","), r).then((t) => !e && c({
			key: a,
			data: t
		}));
		t();
		let n = setInterval(t, fn);
		return () => {
			e = !0, clearInterval(n);
		};
	}, [a, r]);
	let f = o.key === a ? o.data : null, p = !r && n.some((e) => !X[e]), m = (e) => e.toLocaleString(d.locale, {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: e >= 1e3 ? 0 : 2
	});
	return /* @__PURE__ */ u("section", {
		className: "widget widget-stocks px-3.5 pb-3 pt-3",
		"aria-label": "Stocks",
		children: [
			/* @__PURE__ */ u("div", {
				className: "flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-[var(--os-ink-3)]",
				children: [/* @__PURE__ */ l("span", { children: "stocks" }), /* @__PURE__ */ l("button", {
					type: "button",
					onClick: e,
					className: "normal-case tracking-normal underline-offset-2 hover:underline",
					children: "edit"
				})]
			}),
			/* @__PURE__ */ l("ul", {
				className: "mt-1.5 divide-y divide-[var(--w-line)]",
				children: n.map((e) => {
					let t = f?.[e], n = t?.change >= 0;
					return /* @__PURE__ */ u("li", {
						className: "flex items-center justify-between gap-2 py-[5px] text-[12.5px] tabular-nums",
						children: [
							/* @__PURE__ */ l("span", {
								className: "w-12 shrink-0 font-semibold",
								children: e
							}),
							/* @__PURE__ */ l("span", {
								className: "min-w-0 flex-1 truncate text-right",
								children: t?.price ? m(t.price) : t?.error ? "key?" : "—"
							}),
							/* @__PURE__ */ l("span", {
								className: `w-[52px] shrink-0 rounded px-1 text-right text-[11px] ${t?.price ? n ? "stock-up" : "stock-down" : "text-[var(--os-ink-3)]"}`,
								children: t?.price && Number.isFinite(t.change) ? `${n ? "+" : ""}${t.change.toFixed(2)}%` : ""
							})
						]
					}, e);
				})
			}),
			/* @__PURE__ */ l("p", {
				className: "mt-1.5 pl-5 text-[10px] leading-snug text-[var(--os-ink-3)]",
				children: p ? "Add a free Finnhub key in settings for stock prices." : "Prices may be delayed."
			})
		]
	});
}
function gn() {
	let [e, t] = v("stocks", {
		symbols: Z,
		key: ""
	}), [n, r] = s(String(e.symbols || Z)), [i, a] = s(typeof e.key == "string" ? e.key : ""), [o, c] = s(!1);
	return /* @__PURE__ */ u("form", {
		className: "grid gap-2",
		onSubmit: (e) => {
			e.preventDefault(), t({
				symbols: n,
				key: i.trim()
			}), c(!0);
		},
		children: [
			/* @__PURE__ */ u("label", {
				className: "wp-field",
				children: ["watchlist (up to 8)", /* @__PURE__ */ l("input", {
					className: "wp-input font-mono",
					value: n,
					onChange: (e) => {
						r(e.target.value.toUpperCase()), c(!1);
					},
					placeholder: Z,
					autoComplete: "off",
					spellCheck: !1
				})]
			}),
			/* @__PURE__ */ u("label", {
				className: "wp-field",
				children: ["Finnhub API key", /* @__PURE__ */ l("input", {
					className: "wp-input font-mono",
					type: "password",
					value: i,
					onChange: (e) => {
						a(e.target.value), c(!1);
					},
					placeholder: "for stock prices",
					autoComplete: "off",
					spellCheck: !1
				})]
			}),
			/* @__PURE__ */ u("div", {
				className: "flex items-center justify-between gap-2 text-[10.5px] text-[var(--os-ink-3)]",
				children: [o ? /* @__PURE__ */ l("span", { children: "Saved." }) : /* @__PURE__ */ l(j, {
					href: "https://finnhub.io/register",
					className: "underline underline-offset-2 hover:text-[var(--os-ink)]",
					children: "get a free key"
				}), /* @__PURE__ */ l("button", {
					type: "submit",
					className: "wp-btn",
					children: "save"
				})]
			}),
			/* @__PURE__ */ l("p", {
				className: "text-[10.5px] leading-snug text-[var(--os-ink-3)]",
				children: "Crypto (BTC, ETH, SOL…) works without a key. The key stays on this computer."
			})
		]
	});
}
var _n = {
	id: "stocks",
	label: "Stocks",
	Widget: hn,
	Settings: gn
}, vn = [
	["en", "English"],
	["he", "עברית"],
	["es", "Español"],
	["fr", "Français"],
	["de", "Deutsch"],
	["it", "Italiano"],
	["pt", "Português"],
	["ru", "Русский"],
	["ar", "العربية"],
	["zh", "中文"],
	["ja", "日本語"]
], yn = 450, bn = "min-w-0 rounded-md bg-[var(--os-card)] px-1.5 py-1 text-[12px] ring-1 ring-[var(--w-line)] focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]", xn = "w-full min-w-0 rounded-md bg-[var(--os-card)] px-2 py-1 text-[13px] ring-1 ring-[var(--w-line)] focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]", Sn = (e) => new DOMParser().parseFromString(`<!doctype html><body>${e}`, "text/html").body.textContent || "";
async function Cn(e, t, n) {
	if (typeof self < "u" && "Translator" in self) try {
		if (await self.Translator.availability({
			sourceLanguage: t,
			targetLanguage: n
		}) === "available") return {
			text: await (await self.Translator.create({
				sourceLanguage: t,
				targetLanguage: n
			})).translate(e),
			via: "on this computer"
		};
	} catch {}
	let r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(e)}&langpair=${t}|${n}`), i = await r.json().catch(() => null);
	if (!r.ok || !i?.responseData || i.quotaFinished) throw Error("translate");
	return {
		text: Sn(i.responseData.translatedText),
		via: "MyMemory"
	};
}
function wn() {
	let [e, t] = v("translator", {
		from: "en",
		to: "he"
	}), [n, r] = s(""), [i, a] = s(null), o = async () => {
		let t = n.trim();
		if (t) {
			a("working");
			try {
				a(await Cn(t, e.from, e.to));
			} catch {
				a({ error: "Couldn't translate right now. Try again in a little while." });
			}
		}
	};
	return /* @__PURE__ */ u("section", {
		className: "widget widget-translate px-3.5 pb-3 pt-3",
		"aria-label": "Translator",
		children: [
			/* @__PURE__ */ u("div", {
				className: "flex items-center gap-1",
				children: [
					/* @__PURE__ */ l("select", {
						value: e.from,
						onChange: (e) => t((t) => ({
							...t,
							from: e.target.value
						})),
						className: `${bn} flex-1`,
						"aria-label": "From language",
						children: vn.map(([e, t]) => /* @__PURE__ */ l("option", {
							value: e,
							children: t
						}, e))
					}),
					/* @__PURE__ */ l("button", {
						type: "button",
						onClick: () => t((e) => ({
							from: e.to,
							to: e.from
						})),
						className: "widget-mini-btn shrink-0",
						"aria-label": "Swap languages",
						title: "Swap",
						children: "⇄"
					}),
					/* @__PURE__ */ l("select", {
						value: e.to,
						onChange: (e) => t((t) => ({
							...t,
							to: e.target.value
						})),
						className: `${bn} flex-1`,
						"aria-label": "To language",
						children: vn.map(([e, t]) => /* @__PURE__ */ l("option", {
							value: e,
							children: t
						}, e))
					})
				]
			}),
			/* @__PURE__ */ l("textarea", {
				value: n,
				onChange: (e) => r(e.target.value.slice(0, yn)),
				onKeyDown: (e) => {
					e.key === "Enter" && !e.shiftKey && (e.preventDefault(), o());
				},
				placeholder: "Type, then press Enter",
				"aria-label": "Text to translate",
				dir: "auto",
				rows: 3,
				className: `${xn} mt-2 resize-none leading-snug`
			}),
			/* @__PURE__ */ l("div", {
				className: "mt-2 min-h-[54px] rounded-md bg-[var(--os-hover)] px-2 py-1.5 text-[13px] leading-snug select-text",
				"aria-live": "polite",
				dir: "auto",
				"data-nodrag": !0,
				children: i === "working" ? /* @__PURE__ */ l("span", {
					className: "text-[var(--os-ink-3)]",
					children: "Translating…"
				}) : i?.error ? /* @__PURE__ */ l("span", {
					className: "text-[12px] text-[var(--os-warn)]",
					children: i.error
				}) : i ? i.text : /* @__PURE__ */ l("span", {
					className: "text-[var(--os-ink-3)]",
					children: "The translation appears here."
				})
			}),
			/* @__PURE__ */ u("div", {
				className: "mt-1.5 flex items-center justify-end gap-2 text-[10px] text-[var(--os-ink-3)]",
				children: [/* @__PURE__ */ l("span", {
					className: "mr-auto truncate pl-5",
					children: i?.via ? `by ${i.via}` : ""
				}), /* @__PURE__ */ l("button", {
					type: "button",
					onClick: o,
					disabled: !n.trim() || i === "working",
					className: "rounded-full px-2 py-0.5 text-[11px] ring-1 ring-[var(--w-line)] hover:bg-[var(--os-hover)] disabled:opacity-40",
					children: "translate"
				})]
			})
		]
	});
}
var Tn = {
	id: "translator",
	label: "Translator",
	Widget: wn
}, Q = {
	name: "Miami",
	lat: 25.7617,
	lon: -80.1918
}, En = 9e5, Dn = {
	key: "weather-look",
	defaults: { accent: "" }
}, $ = (e) => e && typeof e.name == "string" && Number.isFinite(e.lat) && Number.isFinite(e.lon);
function On(e, t = !0) {
	return e === 0 ? {
		label: t ? "Clear" : "Clear night",
		Icon: t ? ot : tt
	} : e === 1 ? {
		label: "Mostly clear",
		Icon: t ? ot : tt
	} : e === 2 ? {
		label: "Partly cloudy",
		Icon: t ? Ze : Je
	} : e === 3 ? {
		label: "Overcast",
		Icon: Qe
	} : e === 45 || e === 48 ? {
		label: "Fog",
		Icon: Ke
	} : e >= 51 && e <= 57 ? {
		label: "Drizzle",
		Icon: Ge
	} : e >= 61 && e <= 67 ? {
		label: "Rain",
		Icon: Ye
	} : e >= 71 && e <= 77 ? {
		label: "Snow",
		Icon: Xe
	} : e >= 80 && e <= 82 ? {
		label: "Showers",
		Icon: Ye
	} : e === 85 || e === 86 ? {
		label: "Snow showers",
		Icon: Xe
	} : e >= 95 ? {
		label: "Thunderstorms",
		Icon: qe
	} : {
		label: "—",
		Icon: Qe
	};
}
function kn(e, t) {
	let n = `${e.lat},${e.lon},${t}`, [r, a] = s({
		data: null,
		error: !1,
		key: n
	});
	return i(() => {
		let r = !1, i = async () => {
			let i = new URLSearchParams({
				latitude: e.lat.toFixed(3),
				longitude: e.lon.toFixed(3),
				current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day",
				daily: "weather_code,temperature_2m_max,temperature_2m_min",
				forecast_days: "5",
				timezone: "auto",
				temperature_unit: t === "c" ? "celsius" : "fahrenheit",
				wind_speed_unit: t === "c" ? "kmh" : "mph"
			});
			try {
				let e = await fetch(`https://api.open-meteo.com/v1/forecast?${i}`);
				if (!e.ok) throw Error("weather");
				let t = await e.json();
				r || a({
					data: t,
					error: !1,
					key: n
				});
			} catch {
				r || a((e) => ({
					data: e.key === n ? e.data : null,
					error: !0,
					key: n
				}));
			}
		};
		i();
		let o = setInterval(i, En);
		return () => {
			r = !0, clearInterval(o);
		};
	}, [
		n,
		e.lat,
		e.lon,
		t
	]), r.key === n ? r : {
		data: null,
		error: !1
	};
}
function An() {
	let [e, t] = v("weather", {
		home: Q,
		here: null
	}), [n, r] = D(), [i, a] = s(!1), [o] = y(Dn), { locate: d } = h(), f = $(e.home) ? e.home : Q, p = $(e.here) ? e.here : null, m = p || f, g = n.temperature, { data: _, error: b } = kn(m, g), x = async () => {
		if (p) {
			t((e) => ({
				...e,
				here: null
			}));
			return;
		}
		a(!0);
		try {
			let e = await d();
			t((t) => ({
				...t,
				here: {
					name: e.name,
					lat: e.lat,
					lon: e.lon
				}
			}));
		} catch {} finally {
			a(!1);
		}
	}, S = _?.current, C = _?.daily, w = S ? On(S.weather_code, S.is_day === 1) : null, T = C ? C.time.map((e, t) => ({
		date: e,
		hi: Math.round(C.temperature_2m_max[t]),
		lo: Math.round(C.temperature_2m_min[t]),
		code: C.weather_code[t]
	})) : [], E = Math.min(...T.map((e) => e.lo)), O = Math.max(...T.map((e) => e.hi)), k = Math.max(1, O - E), A = (e) => {
		let t = /* @__PURE__ */ new Date(`${e}T12:00:00`), r = t.toLocaleDateString(n.locale, { weekday: "short" }).replace(".", "");
		return /^[A-Za-zÀ-ÿ]/.test(r) ? r.slice(0, 2) : t.toLocaleDateString(n.locale, { weekday: "narrow" });
	};
	return /* @__PURE__ */ u("section", {
		className: "widget widget-weather px-3.5 pb-3 pt-3",
		style: M(o.accent) ? { "--os-accent": o.accent } : void 0,
		"aria-label": "Weather",
		children: [
			/* @__PURE__ */ u("div", {
				className: "flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.16em] text-[var(--os-ink-3)]",
				children: [/* @__PURE__ */ u("span", {
					className: "flex min-w-0 items-center gap-1.5",
					children: [/* @__PURE__ */ l("span", {
						className: `widget-led ${S ? "widget-led-on" : ""}`,
						"aria-hidden": "true"
					}), /* @__PURE__ */ l("span", {
						className: "truncate",
						children: p ? `near ${p.name}` : f.name
					})]
				}), /* @__PURE__ */ l("button", {
					type: "button",
					onClick: x,
					disabled: i,
					className: `widget-mini-btn ${p ? "widget-mini-btn-on" : ""}`,
					"aria-label": p ? `Back to ${f.name}` : "Show weather near you",
					title: p ? `Back to ${f.name}` : "Near me",
					children: /* @__PURE__ */ l(et, {
						className: `h-3.5 w-3.5 ${i ? "animate-pulse" : ""}`,
						strokeWidth: 2
					})
				})]
			}),
			S ? /* @__PURE__ */ u(c, { children: [
				/* @__PURE__ */ u("div", {
					className: "mt-1.5 flex items-start justify-between",
					children: [/* @__PURE__ */ u("button", {
						type: "button",
						onClick: () => r({ temperature: g === "f" ? "c" : "f" }),
						className: "widget-weather-temp",
						"aria-label": `${Math.round(S.temperature_2m)} degrees ${g === "f" ? "Fahrenheit" : "Celsius"}. Switch to ${g === "f" ? "Celsius" : "Fahrenheit"}.`,
						title: `Switch to °${g === "f" ? "C" : "F"}`,
						children: [Math.round(S.temperature_2m), /* @__PURE__ */ u("span", {
							className: "widget-weather-unit",
							children: ["°", g.toUpperCase()]
						})]
					}), /* @__PURE__ */ l(w.Icon, {
						className: "mt-1.5 h-8 w-8 text-[var(--os-ink-2)]",
						strokeWidth: 1.4,
						"aria-hidden": "true"
					})]
				}),
				/* @__PURE__ */ l("div", {
					className: "truncate text-[12px] font-semibold",
					children: w.label
				}),
				/* @__PURE__ */ u("div", {
					className: "truncate text-[11px] tabular-nums text-[var(--os-ink-3)]",
					children: [
						"feels ",
						Math.round(S.apparent_temperature),
						"° · ",
						Math.round(S.relative_humidity_2m),
						"% · ",
						Math.round(S.wind_speed_10m),
						" ",
						g === "c" ? "km/h" : "mph"
					]
				}),
				/* @__PURE__ */ l("div", {
					className: "mt-2.5 grid grid-cols-5 gap-1 border-t border-[var(--w-line)] pt-2",
					role: "list",
					"aria-label": "Five-day forecast",
					children: T.map((e, t) => {
						let { label: n } = On(e.code);
						return /* @__PURE__ */ u("div", {
							role: "listitem",
							className: "flex flex-col items-center text-[10px] tabular-nums",
							"aria-label": `${A(e.date)}: ${n}, high ${e.hi}, low ${e.lo}`,
							children: [
								/* @__PURE__ */ l("span", {
									className: `uppercase tracking-[0.08em] ${t === 0 ? "font-semibold text-[var(--os-ink)]" : "text-[var(--os-ink-3)]"}`,
									children: A(e.date)
								}),
								/* @__PURE__ */ l("span", {
									className: "mt-0.5 text-[var(--os-ink-2)]",
									children: e.hi
								}),
								/* @__PURE__ */ l("span", {
									className: "widget-weather-track",
									"aria-hidden": "true",
									children: /* @__PURE__ */ l("span", {
										className: "widget-weather-range",
										style: {
											top: `${(O - e.hi) / k * 100}%`,
											bottom: `${(e.lo - E) / k * 100}%`
										}
									})
								}),
								/* @__PURE__ */ l("span", {
									className: "text-[var(--os-ink-3)]",
									children: e.lo
								})
							]
						}, e.date);
					})
				})
			] }) : /* @__PURE__ */ l("div", {
				className: "flex h-[150px] items-center justify-center text-[12px] text-[var(--os-ink-3)]",
				children: b ? "No forecast right now." : "Reading the sky…"
			}),
			/* @__PURE__ */ l(j, {
				href: "https://open-meteo.com/",
				className: "widget-credit",
				children: "Open-Meteo"
			})
		]
	});
}
function jn() {
	let [e, t] = v("weather", {
		home: Q,
		here: null
	}), [n] = D(), r = $(e.home) ? e.home : Q, [i, a] = s(""), [o, c] = y(Dn), [d, f] = s(null), p = async () => {
		let e = i.trim();
		if (e) {
			f("searching");
			try {
				let t = new URLSearchParams({
					name: e,
					count: "6",
					language: n.locale.split("-")[0],
					format: "json"
				}), r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${t}`);
				if (!r.ok) throw Error("search");
				let i = await r.json();
				f((i.results || []).map((e) => ({
					name: e.name,
					detail: [e.admin1, e.country].filter(Boolean).join(", "),
					lat: Math.round(e.latitude * 1e3) / 1e3,
					lon: Math.round(e.longitude * 1e3) / 1e3
				})));
			} catch {
				f("error");
			}
		}
	};
	return /* @__PURE__ */ u("div", {
		className: "grid gap-1.5",
		children: [
			/* @__PURE__ */ l(N, {
				label: "temperature bars",
				value: o.accent,
				onChange: (e) => c({ accent: e })
			}),
			/* @__PURE__ */ u("span", {
				className: "wp-field",
				children: ["city: ", /* @__PURE__ */ l("strong", {
					className: "text-[var(--os-ink)]",
					children: r.name
				})]
			}),
			/* @__PURE__ */ u("form", {
				className: "flex gap-1",
				onSubmit: (e) => {
					e.preventDefault(), p();
				},
				children: [/* @__PURE__ */ l("input", {
					className: "wp-input",
					value: i,
					onChange: (e) => a(e.target.value),
					placeholder: "Find a city",
					"aria-label": "Find a city"
				}), /* @__PURE__ */ l("button", {
					type: "submit",
					className: "wp-btn shrink-0",
					disabled: !i.trim(),
					children: "find"
				})]
			}),
			d === "searching" && /* @__PURE__ */ l("p", {
				className: "text-[11px] text-[var(--os-ink-3)]",
				children: "Searching…"
			}),
			d === "error" && /* @__PURE__ */ l("p", {
				className: "text-[11px] text-[var(--os-warn)]",
				children: "Couldn't search right now."
			}),
			Array.isArray(d) && (d.length ? /* @__PURE__ */ l("ul", {
				className: "grid gap-0.5",
				children: d.map((e) => /* @__PURE__ */ l("li", { children: /* @__PURE__ */ u("button", {
					type: "button",
					className: "w-full truncate rounded-md px-1.5 py-1 text-left text-[11.5px] hover:bg-[var(--os-hover)]",
					onClick: () => {
						t({
							home: {
								name: e.name,
								lat: e.lat,
								lon: e.lon
							},
							here: null
						}), f(null), a("");
					},
					children: [
						/* @__PURE__ */ l("span", {
							className: "font-semibold",
							children: e.name
						}),
						" ",
						/* @__PURE__ */ l("span", {
							className: "text-[var(--os-ink-3)]",
							children: e.detail
						})
					]
				}) }, `${e.lat},${e.lon}`))
			}) : /* @__PURE__ */ l("p", {
				className: "text-[11px] text-[var(--os-ink-3)]",
				children: "No places by that name."
			}))
		]
	});
}
var Mn = {
	id: "weather",
	label: "Weather",
	Widget: An,
	Settings: jn
}, Nn = P.filter((e) => e.id !== "auto"), Pn = {
	key: "world-clock",
	defaults: {
		a: "Asia/Jerusalem",
		b: "Europe/London",
		c: "Asia/Tokyo",
		ticker: ""
	},
	allowed: Object.fromEntries([
		"a",
		"b",
		"c"
	].map((e) => [e, Nn.map((e) => e.id)]))
}, Fn = (e) => (Nn.find((t) => t.id === e)?.label || e).split(" · ").pop();
function In(e, t) {
	let n = new Date(e.toLocaleString("en-US")), r = new Date(e.toLocaleString("en-US", { timeZone: t })), i = Math.round((new Date(r.toDateString()) - new Date(n.toDateString())) / 864e5);
	return i > 0 ? "tomorrow" : i < 0 ? "yesterday" : "today";
}
function Ln() {
	let e = F(), [t] = y(Pn), [n] = D(), r = [
		t.a,
		t.b,
		t.c
	];
	return /* @__PURE__ */ u("section", {
		className: "widget widget-world px-3 pb-3.5 pt-3",
		style: M(t.ticker) ? { "--os-accent": t.ticker } : void 0,
		"aria-label": `World clock: ${r.map((t) => `${Fn(t)} ${I(e, n, t)}`).join(", ")}`,
		children: [/* @__PURE__ */ l("div", {
			className: "text-[10px] uppercase tracking-[0.16em] text-[var(--os-ink-3)]",
			children: "world clock"
		}), /* @__PURE__ */ l("div", {
			className: "mt-2 grid grid-cols-3 gap-1 text-center",
			children: r.map((t, r) => /* @__PURE__ */ u("div", {
				className: "flex min-w-0 flex-col items-center",
				children: [
					/* @__PURE__ */ l(fe, {
						now: e,
						timeZone: t,
						className: "h-[50px] w-[50px]"
					}),
					/* @__PURE__ */ l("span", {
						className: "mt-1.5 w-full truncate text-[11px] font-semibold",
						children: Fn(t)
					}),
					/* @__PURE__ */ l("span", {
						className: "text-[10.5px] tabular-nums text-[var(--os-ink-2)]",
						dir: "auto",
						children: I(e, n, t)
					}),
					/* @__PURE__ */ l("span", {
						className: "text-[9.5px] text-[var(--os-ink-3)]",
						children: In(e, t)
					})
				]
			}, `${t}-${r}`))
		})]
	});
}
function Rn() {
	let [e, t] = y(Pn);
	return [/* @__PURE__ */ l(N, {
		label: "second hands",
		value: e.ticker,
		onChange: (e) => t({ ticker: e })
	}, "ticker"), ...[
		"a",
		"b",
		"c"
	].map((n, r) => /* @__PURE__ */ u("label", {
		className: "wp-field",
		children: [
			"city ",
			r + 1,
			/* @__PURE__ */ l("select", {
				className: "wp-input",
				value: e[n],
				onChange: (e) => t({ [n]: e.target.value }),
				children: Nn.map((e) => /* @__PURE__ */ l("option", {
					value: e.id,
					children: e.label
				}, e.id))
			})
		]
	}, n))];
}
var zn = {
	id: "world-clock",
	label: "World Clock",
	Widget: Ln,
	Settings: Rn
}, Bn = [
	ke,
	sn,
	Mn,
	Tt,
	ie,
	_e,
	dn,
	zn,
	Vt,
	Ie,
	Tn,
	mt,
	_n
];
//#endregion
export { w as LOCALES, Bn as WIDGETS, m as WidgetHost, f as browserHost, ie as calculator, _e as calendar, ke as clock, Ie as convert, mt as flightTracker, d as localStorageStorage, Tt as mesh, Vt as photoGallery, sn as radio, dn as stickyNotes, _n as stocks, J as stopRadio, qt as toggleRadio, Tn as translator, h as useHost, Ht as useRadio, D as useShared, v as useStored, Mn as weather, zn as worldClock };
