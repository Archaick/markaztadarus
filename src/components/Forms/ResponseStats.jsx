import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import letterhead from "../../assets/imgs/letterhead-mt.png";
import { formatDateTime } from "../Internal/timeAgo";
import { gradeResponse, quizOf } from "./formSchema";
import { TAGLINE } from "./ResponseSheet";
import { plainText } from "./richText";
import c from "./ResponseStats.module.css";

const NS = "internal/Forms";
const PALETTE = ["#1a4970", "#d4a912", "#10b981", "#7c3aed", "#ef4444", "#0ea5e9", "#f97316", "#64748b", "#14b8a6", "#e11d48"];
const DAY = 24 * 60 * 60 * 1000;
const toDate = (v) => (v && typeof v.toDate === "function" ? v.toDate() : v ? new Date(v) : null);
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const pct = (n, of) => (of ? Math.round((n / of) * 100) : 0);

/**
 * Everything the charts show, from the responses: how many came in each day
 * (or week, over a long stretch), each choice question's answers, and for a
 * quiz the spread of scores and how often each question was answered right.
 */
export function useResponseStats(form, fields, responses, quizKey) {
  return useMemo(() => {
    const list = responses || [];

    // ── when the responses came in ──
    const dates = list.map((r) => toDate(r.submittedAt)).filter(Boolean);
    let timeline = [];
    let byWeek = false;
    if (dates.length) {
      const first = new Date(Math.min(...dates));
      const last = new Date(Math.max(...dates));
      first.setHours(0, 0, 0, 0);
      const days = Math.floor((last - first) / DAY) + 1;
      byWeek = days > 45;
      const step = byWeek ? 7 : 1;
      const counts = new Map();
      dates.forEach((d) => {
        const bucket = Math.floor((new Date(d).setHours(0, 0, 0, 0) - first) / DAY / step);
        counts.set(bucket, (counts.get(bucket) || 0) + 1);
      });
      const buckets = Math.floor((days - 1) / step) + 1;
      timeline = Array.from({ length: buckets }, (_, i) => {
        const at = new Date(first.getTime() + i * step * DAY);
        return { label: `${at.getDate()}/${at.getMonth() + 1}`, count: counts.get(i) || 0, key: dayKey(at) };
      });
    }

    // ── a quiz: each response's grade ──
    const quiz = quizOf(form);
    const grades = quiz.enabled ? list.map((r) => gradeResponse(form.fields || [], quizKey || {}, r.answers || {}, r.grades || {})) : [];
    const max = grades[0]?.max || 0;

    // ── each choice question ──
    const questions = fields
      .filter((f) => f.type === "choice" || f.type === "checkbox")
      .map((f) => {
        const counts = Object.fromEntries((f.options || []).map((o) => [o, 0]));
        let answered = 0;
        list.forEach((r) => {
          const value = r.answers?.[f.id];
          const picked = Array.isArray(value) ? value : value ? [value] : [];
          if (picked.length) answered += 1;
          picked.forEach((p) => {
            counts[p] = (counts[p] || 0) + 1;
          });
        });
        const right = new Set(quiz.enabled ? quizKey?.[f.id] || [] : []);
        const options = Object.entries(counts).map(([label, count], i) => ({
          label,
          count,
          pct: pct(count, answered),
          color: PALETTE[i % PALETTE.length],
          correct: right.has(label),
        }));
        if (f.type === "checkbox") options.sort((a, b) => b.count - a.count);
        return { field: f, kind: f.type === "choice" ? "donut" : "bars", options, answered };
      });

    // ── a quiz: the spread of scores, and each question's share of right answers ──
    let quizStats = null;
    if (quiz.enabled && grades.length && max) {
      const spread = Array.from({ length: 10 }, (_, i) => ({ label: `${i * 10}`, count: 0 }));
      grades.forEach((g) => {
        spread[Math.min(9, Math.floor((g.score / max) * 10))].count += 1;
      });
      const perQuestion = fields
        .map((f) => {
          const marked = grades.map((g) => g.per[f.id]).filter((p) => p && p.correct !== null && p.correct !== undefined);
          if (!marked.length) return null;
          const right = marked.filter((p) => p.correct).length;
          return { field: f, rate: pct(right, marked.length), right, of: marked.length };
        })
        .filter(Boolean);
      quizStats = {
        max,
        average: grades.reduce((a, g) => a + g.score, 0) / grades.length,
        best: Math.max(...grades.map((g) => g.score)),
        spread,
        perQuestion,
      };
    }

    return { count: list.length, latest: dates.length ? new Date(Math.max(...dates)) : null, timeline, byWeek, questions, quiz: quizStats };
  }, [form, fields, responses, quizKey]);
}

/** Columns, for counts over time or a spread. */
function Columns({ data, color = "#1a4970", highlightLast }) {
  const top = Math.max(1, ...data.map((d) => d.count));
  const n = data.length;
  const labelEvery = Math.ceil(n / 12);
  return (
    <div className={c.columns}>
      <div className={c.columnsPlot}>
        {data.map((d, i) => (
          <div key={d.key || d.label} className={c.column} title={`${d.label}: ${d.count}`}>
            {d.count > 0 && n <= 20 && <span className={c.columnValue}>{d.count}</span>}
            <span className={c.columnBar} style={{ height: `${(d.count / top) * 100}%`, background: highlightLast && i === n - 1 ? "#d4a912" : color }} />
          </div>
        ))}
      </div>
      <div className={c.columnsAxis}>
        {data.map((d, i) => (
          <span key={d.key || d.label}>{i % labelEvery === 0 ? d.label : ""}</span>
        ))}
      </div>
    </div>
  );
}

/** A donut with its legend, for a one-answer question. */
function Donut({ options, answered }) {
  const { t } = useTranslation(NS);
  const R = 15.915; // circumference 100
  let offset = 25; // start at the top
  return (
    <div className={c.donutWrap}>
      {/* the ring is drawn; the number in the middle is ordinary text over it (SVG text loses its size in the PDF) */}
      <div className={c.donutBox}>
        <svg viewBox="0 0 42 42" className={c.donut} aria-hidden="true">
          <circle cx="21" cy="21" r={R} fill="none" stroke="#eef2f7" strokeWidth="6" />
          {options.map((o) => {
            const share = answered ? (o.count / answered) * 100 : 0;
            const piece = (
              <circle
                key={o.label}
                cx="21"
                cy="21"
                r={R}
                fill="none"
                stroke={o.color}
                strokeWidth="6"
                strokeDasharray={`${share} ${100 - share}`}
                strokeDashoffset={offset}
              />
            );
            offset -= share;
            return share > 0 ? piece : null;
          })}
        </svg>
        <div className={c.donutCentre}>
          <b>{answered}</b>
          <span>{t("stats.answers")}</span>
        </div>
      </div>
      <ul className={c.legend}>
        {options.map((o) => (
          <li key={o.label} className={o.correct ? c.legendRight : undefined}>
            <span className={c.swatch} style={{ background: o.color }} />
            <span className={c.legendText} dir="auto">
              {o.label}
            </span>
            <b>{o.pct}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Bars, for a many-answers question (sorted, biggest first). */
function Bars({ options }) {
  return (
    <ul className={c.bars}>
      {options.map((o) => (
        <li key={o.label} className={o.correct ? c.legendRight : undefined}>
          <div className={c.barText}>
            <span dir="auto">{o.label}</span>
            <b>
              {o.count} · {o.pct}%
            </b>
          </div>
          <div className={c.barTrack}>
            <span style={{ width: `${o.pct}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** The charts, as cards; `report` lays them out for the A4 report. */
export default function ResponseStats({ stats, report = false }) {
  const { t } = useTranslation(NS);
  if (!stats.count) return null;
  const rate = (r) => (r >= 80 ? "#10b981" : r >= 50 ? "#d4a912" : "#ef4444");

  return (
    <div className={`${c.grid} ${report ? c.report : ""}`}>
      <section className={`${c.card} ${c.wide}`}>
        <h3>{stats.byWeek ? t("stats.perWeek") : t("stats.perDay")}</h3>
        <Columns data={stats.timeline} />
      </section>

      {stats.quiz && (
        <>
          <section className={c.card}>
            <h3>{t("stats.spread")}</h3>
            <p className={c.note}>{t("stats.averageOf", { average: Math.round(stats.quiz.average * 10) / 10, max: stats.quiz.max, best: stats.quiz.best })}</p>
            <Columns data={stats.quiz.spread.map((s, i) => ({ ...s, label: i === 9 ? "90–100" : `${s.label}–${Number(s.label) + 9}` }))} color="#d4a912" />
            <p className={c.axisNote}>{t("stats.spreadAxis")}</p>
          </section>
          {stats.quiz.perQuestion.length > 0 && (
            <section className={c.card}>
              <h3>{t("stats.rightRate")}</h3>
              <p className={c.note}>{t("stats.rightRateNote")}</p>
              <ul className={c.bars}>
                {stats.quiz.perQuestion.map((q) => (
                  <li key={q.field.id}>
                    <div className={c.barText}>
                      <span dir="auto">{plainText(q.field.label).split("\n")[0]}</span>
                      <b style={{ color: rate(q.rate) }}>{q.rate}%</b>
                    </div>
                    <div className={c.barTrack}>
                      <span style={{ width: `${q.rate}%`, background: rate(q.rate) }} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {stats.questions.map((q) => (
        <section className={c.card} key={q.field.id}>
          <h3 dir="auto">{plainText(q.field.label)}</h3>
          <p className={c.note}>{t("stats.answered", { count: q.answered })}</p>
          {q.kind === "donut" ? <Donut options={q.options} answered={q.answered} /> : <Bars options={q.options} />}
        </section>
      ))}
    </div>
  );
}

/** The statistics on the Markaz Tadarus letterhead, for the PDF report (A4, 794px wide). */
export function StatsReport({ form, stats, sheetRef }) {
  const { t } = useTranslation(NS);
  return (
    <div ref={sheetRef} className={c.sheet} dir={form.language === "ar" ? "rtl" : "ltr"}>
      <div className={c.reportHead}>
        <img src={letterhead} alt="مركز التدارس إندونيسيا" />
        <span>{TAGLINE}</span>
      </div>
      <h1 className={c.reportTitle} dir="auto">
        {t("stats.reportTitle")}
        <small>{form.title}</small>
      </h1>
      <div className={c.figures}>
        <div>
          <b>{stats.count}</b>
          <span>{t("stats.responses")}</span>
        </div>
        {stats.quiz && (
          <div>
            <b>
              {Math.round(stats.quiz.average * 10) / 10}
              <small> / {stats.quiz.max}</small>
            </b>
            <span>{t("stats.average")}</span>
          </div>
        )}
        <div>
          <b className={c.figureDate}>{stats.latest ? formatDateTime(stats.latest) : "—"}</b>
          <span>{t("stats.latest")}</span>
        </div>
      </div>
      <ResponseStats stats={stats} report />
      <p className={c.generated}>{t("stats.generated", { date: formatDateTime(new Date()) })}</p>
    </div>
  );
}
