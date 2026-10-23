// A teacher's picture: their photo when one was added, else a friendly faceless
// figure (an ustadz with a white kopiah, or an ustadzah in a hijab), or nothing
// when the admin chose to show none.

export const AVATARS = ["male", "female", "none"];

/** Ustadzah, Ibu, Bu, Hj. … read as a woman's name; everything else as a man's. */
export const guessAvatar = (name = "") => (/\b(ustadzah|ustazah|ustadzat|ibu|bu|hj|hajjah|umm|ummu|nyai|teh|mbak|ning)\b/i.test(name) ? "female" : "male");

/** Which picture a teacher shows: "photo", "male", "female" or "none". */
export function avatarKind(teacher) {
  if (teacher?.avatar === "none") return "none";
  if (teacher?.photo) return "photo";
  return AVATARS.includes(teacher?.avatar) ? teacher.avatar : guessAvatar(teacher?.name);
}

function Male() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: "block" }} aria-hidden="true">
      <rect width="100" height="100" fill="#eef1fb" />
      <path d="M10 100 V88 Q10 70 34 66 H66 Q90 70 90 88 V100 Z" fill="#9b8ec4" />
      <path d="M40 58 H60 V70 Q50 78 40 70 Z" fill="#eab28b" />
      <ellipse cx="27" cy="44" rx="5" ry="6.5" fill="#eab28b" />
      <ellipse cx="73" cy="44" rx="5" ry="6.5" fill="#eab28b" />
      <path d="M28 34 V48 H32 V34 Z M68 34 V48 H72 V34 Z" fill="#5b5966" />
      <path d="M30 32 Q30 62 50 64 Q70 62 70 32 Z" fill="#f8ccb1" />
      <path d="M27 33 Q27 12 50 12 Q73 12 73 33 Z" fill="#f2f3f7" />
      <path d="M27 33 H73" stroke="#d9dce6" strokeWidth="1.2" />
    </svg>
  );
}

function Female() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: "block" }} aria-hidden="true">
      <rect width="100" height="100" fill="#fbeff3" />
      <path d="M8 100 V90 Q8 70 32 64 H68 Q92 70 92 90 V100 Z" fill="#c48aa6" />
      {/* the hijab around the face, falling over the shoulders */}
      <path d="M22 44 Q22 12 50 12 Q78 12 78 44 V62 Q78 76 64 78 H36 Q22 76 22 62 Z" fill="#5f8f8b" />
      <path d="M33 40 Q33 22 50 22 Q67 22 67 40 Q67 62 50 64 Q33 62 33 40 Z" fill="#f8ccb1" />
      <path d="M33 30 Q50 18 67 30" stroke="#4d7a76" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M36 72 Q50 82 64 72" stroke="#4d7a76" strokeWidth="2" fill="none" opacity="0.6" />
    </svg>
  );
}

/** The picture itself, `size` px square, rounded. Nothing at all for "none". */
export default function TeacherAvatar({ teacher, kind, size = 40, className = "" }) {
  const k = kind || avatarKind(teacher);
  if (k === "none") return null;
  const style = { width: size, height: size, borderRadius: size * 0.3, overflow: "hidden", flexShrink: 0, display: "inline-block", boxShadow: "0 0 0 1px rgba(15,31,51,0.08)" };
  if (k === "photo" && teacher?.photo) {
    return <img src={teacher.photo} alt="" className={className} style={{ ...style, objectFit: "cover" }} />;
  }
  return (
    <span className={className} style={style}>
      {k === "female" ? <Female /> : <Male />}
    </span>
  );
}
