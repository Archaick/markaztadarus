import { textDir } from "../Belajar/belajarSchema";
import ArabicText from "./ArabicText";
import styles from "./Guru.module.css";

/** A table in a section's reading: navy header with a gold rule, soft gold stripes; scrolls sideways on a phone. */
export default function ReadingTable({ block }) {
  const rows = (block.rows || []).map((r) => r.cells || []);
  if (!rows.length) return null;
  const head = block.head !== false ? rows[0] : null;
  const body = head ? rows.slice(1) : rows;
  return (
    <div className={styles.rtableWrap}>
      <table className={styles.rtable}>
        {head && (
          <thead>
            <tr>
              {head.map((c, i) => (
                <th key={i} dir={textDir(c)}>
                  <ArabicText text={c} />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {body.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} dir={textDir(c)}>
                  <ArabicText text={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
