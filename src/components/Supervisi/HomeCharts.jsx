import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BASE } from "./SupervisiShell";
import { useCountUp } from "./parts";
import SchoolScene from "./SchoolScene";
import { schoolProgress } from "./SchoolsPage";
import { tr } from "./supervisiSchema";
import c from "./Charts.module.css";

// The home page's charts, drawn by hand and animated with CSS: the average
// on a gauge, the 5T profile on a radar, the aspects as bars, supervisions
// per month as columns, and how far each school is.

const NS = "internal/Supervisi";
// "1. Tamhid — membangun…" → "Tamhid"; "A. Persiapan…" → "Persiapan…"
const shortTitle = (text) => (text || "").split(" — ")[0].replace(/^\s*\S{1,2}\.\s+/, "").trim();
const clip = (text, n) => (text.length > n ? `${text.slice(0, n - 1)}…` : text);

/** Everything the charts show, from the finished supervisions. */
export function chartData({ sessions, schools, teachers, lang }) {
  const done = sessions.filter((s) => s.status === "done");
  const max = done[0]?.max || 5;
  const average = done.length ? done.reduce((a, s) => a + (s.average || 0), 0) / done.length : 0;

  const sections = new Map();
  const groups = new Map();
  for (const s of done) {
    const scores = s.scores || {};
    for (const section of s.instrument?.sections || []) {
      const sec = sections.get(section.id) || { id: section.id, title: tr(section.title, lang), sum: 0, n: 0 };
      sections.set(section.id, sec);
      for (const group of section.groups || []) {
        const key = `${section.id}/${group.id}`;
        const grp = group.title && (groups.get(key) || { key, section: section.id, title: tr(group.title, lang), sum: 0, n: 0 });
        if (grp) groups.set(key, grp);
        for (const item of group.items || []) {
          const v = scores[item.id];
          if (!v) continue;
          sec.sum += v;
          sec.n += 1;
          if (grp) {
            grp.sum += v;
            grp.n += 1;
          }
        }
      }
    }
  }
  const withAvg = (x) => ({ ...x, average: x.n ? x.sum / x.n : 0 });
  const sectionList = [...sections.values()].map(withAvg);

  // the radar follows the section with the most named groups (the 5T steps); otherwise the sections
  const bySection = {};
  for (const g of groups.values()) (bySection[g.section] ||= []).push(withAvg(g));
  const richest = Object.values(bySection).sort((a, b) => b.length - a.length)[0] || [];
  const axes = (richest.length >= 3 ? richest : sectionList).map((x) => ({ label: shortTitle(x.title), average: x.average }));

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const of = sessions.filter((s) => (s.date || "").slice(0, 7) === key);
    return { key, date: d, done: of.filter((s) => s.status === "done").length, open: of.filter((s) => s.status !== "done").length };
  });

  const schoolRows = schools
    .map((school) => ({ school, ...schoolProgress(school, teachers, sessions) }))
    .sort((a, b) => b.percent - a.percent || a.school.name.localeCompare(b.school.name))
    .slice(0, 6);

  return { done: done.length, max, average, sections: sectionList, axes, months, schools: schoolRows };
}

export function Gauge({ average, max }) {
  const { t } = useTranslation(NS);
  const shown = useCountUp(average);
  const ratio = max ? Math.min(1, average / max) : 0;
  return (
    <div className={c.card}>
      <h2 className={c.title}>{t("charts.average")}</h2>
      <svg viewBox="0 0 240 140" className={c.svg} aria-hidden="true">
        <defs>
          <linearGradient id="sup-gauge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#cc9933" />
            <stop offset="1" stopColor="#5fb58a" />
          </linearGradient>
        </defs>
        <path d="M30 122 A90 90 0 0 1 210 122" stroke="#e6ebf0" strokeWidth="18" fill="none" strokeLinecap="round" />
        {ratio > 0 && (
          <path
            d="M30 122 A90 90 0 0 1 210 122"
            stroke="url(#sup-gauge)"
            strokeWidth="18"
            fill="none"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="100 100"
            strokeDashoffset={100 - ratio * 100}
            className={c.draw}
          />
        )}
        <g className={c.needle} style={{ transform: `rotate(${-90 + 180 * ratio}deg)` }}>
          <path d="M116 122 L120 50 L124 122 Z" fill="#003366" />
        </g>
        <circle cx="120" cy="122" r="10" fill="#003366" />
        <circle cx="120" cy="122" r="4" fill="#cc9933" />
      </svg>
      <div className={c.gaugeValue}>
        {average ? shown.toFixed(1) : "–"}
        <small>{t("charts.of", { max })}</small>
      </div>
      <p className={c.caption}>{average ? t("charts.achieved", { percent: Math.round(ratio * 100) }) : t("charts.empty")}</p>
    </div>
  );
}

export function Radar({ axes, max, hasData }) {
  const { t } = useTranslation(NS);
  const n = axes.length;
  const cx = 180;
  const cy = 128;
  const R = 92;
  const at = (i, r) => {
    const a = ((-90 + (360 * i) / n) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a), Math.cos(a), Math.sin(a)];
  };
  const ring = (r) => axes.map((_, i) => at(i, r).slice(0, 2).join(",")).join(" ");
  const points = axes.map((x, i) => at(i, (R * x.average) / max));

  return (
    <div className={c.card}>
      <h2 className={c.title}>{t("charts.profile")}</h2>
      {n >= 3 ? (
        <svg viewBox="0 0 360 262" className={c.svg} aria-hidden="true">
          {Array.from({ length: max }, (_, l) => (
            <polygon key={l} points={ring((R * (max - l)) / max)} fill={l % 2 ? "#ffffff" : "#f5f7f9"} stroke="#e3e8ee" />
          ))}
          {axes.map((_, i) => {
            const [x, y] = at(i, R);
            return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e3e8ee" />;
          })}
          {hasData && (
            <g className={c.pop}>
              <polygon points={points.map((p) => p.slice(0, 2).join(",")).join(" ")} fill="#cc9933" fillOpacity="0.3" stroke="#cc9933" strokeWidth="2.5" strokeLinejoin="round" />
              {points.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="5" fill="#003366" stroke="#fff" strokeWidth="2" className={c.dot} style={{ animationDelay: `${0.9 + i * 0.15}s` }} />
              ))}
            </g>
          )}
          {axes.map((x, i) => {
            const [lx, ly, cos, sin] = at(i, R + 14);
            const anchor = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
            const y = sin < -0.5 ? ly - 6 : sin > 0.5 ? ly + 16 : ly + 5;
            return (
              <text key={i} x={lx} y={y} textAnchor={anchor} className={c.axis}>
                {clip(x.label, 16)}
                {hasData && <tspan className={c.axisValue}>{` ${x.average ? x.average.toFixed(1) : "–"}`}</tspan>}
              </text>
            );
          })}
        </svg>
      ) : null}
      {!hasData && <p className={c.caption}>{t("charts.empty")}</p>}
    </div>
  );
}

export function AspectBars({ sections, max }) {
  const { t } = useTranslation(NS);
  const colours = ["#003366", "#cc9933", "#5fb58a", "#7b4f9e"];
  return (
    <div className={c.card}>
      <h2 className={c.title}>{t("charts.aspects")}</h2>
      {sections.length ? (
        <ul className={c.bars}>
          {sections.map((s, i) => (
            <li key={s.id}>
              <div className={c.barHead}>
                <span dir="auto">{s.title}</span>
                <b>{s.average ? s.average.toFixed(1) : "–"}</b>
              </div>
              <div className={c.track}>
                <span className={c.fill} style={{ width: `${(100 * s.average) / max}%`, background: colours[i % colours.length], animationDelay: `${i * 0.15}s` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={c.caption}>{t("charts.empty")}</p>
      )}
    </div>
  );
}

export function Months({ months }) {
  const { t, i18n } = useTranslation(NS);
  const locale = { id: "id-ID", en: "en-GB", ar: "ar-u-nu-latn" }[(i18n.language || "id").slice(0, 2)] || "id-ID";
  const label = new Intl.DateTimeFormat(locale, { month: "short" });
  const top = Math.max(1, ...months.map((m) => m.done + m.open));
  return (
    <div className={c.card}>
      <div className={c.titleRow}>
        <h2 className={c.title}>{t("charts.months")}</h2>
        <span className={c.legend}>
          <i style={{ background: "#003366" }} /> {t("status.done")}
          <i style={{ background: "#cc9933" }} /> {t("charts.inProgress")}
        </span>
      </div>
      <div className={c.columns}>
        {months.map((m, i) => (
          <div key={m.key} className={c.column}>
            <span className={c.count}>{m.done + m.open || ""}</span>
            <div className={c.stack} style={{ height: `calc(${(m.done + m.open) / top} * (100% - 46px))`, animationDelay: `${i * 0.09}s` }}>
              {m.open > 0 && <span style={{ flexGrow: m.open, background: "#cc9933" }} />}
              {m.done > 0 && <span style={{ flexGrow: m.done, background: "#003366" }} />}
            </div>
            <span className={c.month}>{label.format(m.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SchoolsProgress({ rows }) {
  const { t } = useTranslation(NS);
  return (
    <div className={c.card}>
      <h2 className={c.title}>{t("charts.schools")}</h2>
      {rows.length ? (
        <ul className={c.schools}>
          {rows.map(({ school, teachers, supervised, percent }, i) => (
            <li key={school.id}>
              <Link to={`${BASE}/sekolah/${school.id}`} className={c.school}>
                <span className={c.avatar}>{school.cover ? <img src={school.cover} alt="" /> : <SchoolScene id={school.id} scene={school.scene} />}</span>
                <span className={c.schoolMain}>
                  <span className={c.barHead}>
                    <span dir="auto">{school.name}</span>
                    <b>{t("charts.teachersDone", { done: supervised, total: teachers })}</b>
                  </span>
                  <span className={c.track}>
                    <span className={c.fill} style={{ width: `${percent}%`, background: percent >= 100 ? "#5fb58a" : "#cc9933", animationDelay: `${i * 0.12}s` }} />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={c.caption}>{t("schools.empty")}</p>
      )}
    </div>
  );
}
