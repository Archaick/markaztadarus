// Teacher supervision (SKENARIO SUPERVISI GURU / BAHAN SUPERVISI): schools,
// their teachers, editable instruments, and one document per supervision.

export const SCHOOLS = "supervisi_schools";
export const TEACHERS = "supervisi_teachers";
export const INSTRUMENTS = "supervisi_instruments";
export const SESSIONS = "supervisi_sessions";
// one document of defaults for every supervision (supervisor, signature, photos)
export const SETTINGS = "supervisi_settings";
export const SETTINGS_DOC = "defaults";

export const SCALE = [1, 2, 3, 4, 5];

// draft = the identity sheet is being filled in; observing = in class;
// done = finished, signed and saved as a report.
export const STATUSES = ["draft", "observing", "done"];

// The identity sheet of the documents (Lembar Data Pendukung), in order.
export const IDENTITY_FIELDS = ["teacherName", "schoolName", "date", "className", "book", "surah", "supervisorName"];

/** Text in the page's language, falling back to Indonesian (the documents' language). */
export const tr = (text, lang) => {
  if (!text) return "";
  if (typeof text === "string") return text;
  return text[(lang || "id").slice(0, 2)] || text.id || text.en || text.ar || "";
};

/** What the # column shows: the number the admin wrote, else the running one. */
export const itemNo = (item, n) => (item?.no || "").trim() || String(n);

/**
 * A header of the assessment table ("num", "indicator", or "s1"…"s5" for the
 * score columns) as the admin worded it, else the standard one.
 */
export const headerOf = (instrument, key, lang, fallback) => tr(instrument?.headers?.[key], lang) || fallback;

/**
 * A supervision's own copy of its instrument, with the numbers and table
 * headers of the instrument as it is now: those are only labels, so editing
 * them also renumbers reports already made. Texts and scores stay as copied.
 */
export function withLiveLabels(copy, live) {
  if (!copy || !live) return copy;
  const numbers = new Map(indicatorsOf(live).map((i) => [i.id, i.no]));
  return {
    ...copy,
    headers: live.headers || copy.headers,
    sections: (copy.sections || []).map((section) => ({
      ...section,
      groups: (section.groups || []).map((group) => ({
        ...group,
        items: (group.items || []).map((item) => (numbers.has(item.id) ? { ...item, no: numbers.get(item.id) || "" } : item)),
      })),
    })),
  };
}

/** A stored document without its bookkeeping fields (for copies). */
export const withoutMeta = (obj) => {
  const copy = { ...obj };
  ["id", "auditId", "createdAt", "updatedAt", "version"].forEach((k) => delete copy[k]);
  return copy;
};

export const newId = () => Math.random().toString(36).slice(2, 10);

/** Every indicator of an instrument, flat, in order, with its section and group. */
export const indicatorsOf = (instrument) =>
  (instrument?.sections || []).flatMap((section) =>
    (section.groups || []).flatMap((group) => (group.items || []).map((item) => ({ ...item, section, group })))
  );

/**
 * Totals for a supervision. Per the documents, an indicator with no score yet
 * is something to clarify with the teacher, not a zero: averages count only
 * scored indicators, and `toClarify` lists the rest.
 */
export function summarize(instrument, scores = {}) {
  const max = instrument?.scaleMax || SCALE.length;
  const sectionStats = (instrument?.sections || []).map((section) => {
    const items = (section.groups || []).flatMap((g) => g.items || []);
    const scored = items.filter((i) => scores[i.id]);
    const sum = scored.reduce((s, i) => s + scores[i.id], 0);
    return {
      id: section.id,
      title: section.title,
      total: items.length,
      scored: scored.length,
      sum,
      average: scored.length ? sum / scored.length : 0,
    };
  });
  const all = indicatorsOf(instrument);
  const scored = all.filter((i) => scores[i.id]);
  const sum = scored.reduce((s, i) => s + scores[i.id], 0);
  return {
    sections: sectionStats,
    total: all.length,
    scored: scored.length,
    toClarify: all.length - scored.length,
    sum,
    average: scored.length ? sum / scored.length : 0,
    percent: scored.length ? Math.round((sum / (scored.length * max)) * 1000) / 10 : 0,
    max,
  };
}

export const formatAverage = (n) => (n ? n.toFixed(1) : "–");

const t3 = (id, en, ar) => ({ id, en, ar });
const item = (key, id, en, ar) => ({ id: key, text: t3(id, en, ar) });

/**
 * SUPERVISI GURU PQA — Metode 5T, exactly as BAHAN SUPERVISI lists it.
 * Installed once as the first instrument; admins can edit it afterwards.
 */
export const PQA_5T = {
  key: "pqa-5t",
  name: t3("Supervisi Guru PQA — Metode 5T", "PQA Teacher Supervision — 5T Method", "الإشراف على معلم PQA — منهج 5T"),
  note: t3(
    "Klik nilai pada indikator yang sudah terlihat selama observasi. Indikator yang belum dinilai perlu diklarifikasi, bukan otomatis dianggap tidak dilakukan.",
    "Score the indicators you saw during the observation. An indicator without a score is to be clarified with the teacher — it does not count as not done.",
    "قيّم المؤشرات التي ظهرت أثناء الملاحظة. المؤشر غير المقيَّم يُستوضح مع المعلم، ولا يُعدّ تلقائياً غير منفَّذ."
  ),
  scaleMax: 5,
  sections: [
    {
      id: "a",
      title: t3("A. Persiapan Pembelajaran", "A. Lesson Preparation", "أ. الاستعداد للتعليم"),
      description: t3(
        "Aspek ini menilai kesiapan guru sebelum pembelajaran dimulai.",
        "How ready the teacher is before the lesson begins.",
        "يقيس هذا الجانب استعداد المعلم قبل بدء الدرس."
      ),
      groups: [
        {
          id: "a1",
          title: null,
          items: [
            item("a1", "Guru memahami tujuan pembelajaran pada materi atau surah yang diajarkan.", "The teacher understands the learning goals of the material or surah being taught.", "يفهم المعلم أهداف التعلّم في المادة أو السورة التي يدرّسها."),
            item("a2", "Guru menguasai materi dalam buku Pendidikan Qur'ani Anak.", "The teacher has mastered the material in the Pendidikan Qur'ani Anak book.", "يتقن المعلم مادة كتاب التربية القرآنية للطفل."),
            item("a3", "Guru menyiapkan alur pembelajaran sesuai Metode 5T (administrasi kelas).", "The teacher prepares the lesson flow following the 5T Method (class administration).", "يُعِدّ المعلم مسار الدرس وفق منهج 5T (إدارة الصف)."),
            item("a4", "Guru menyiapkan pertanyaan pemantik, media, cerita, gambar, atau ilustrasi yang relevan.", "The teacher prepares relevant opening questions, media, stories, pictures or illustrations.", "يُعِدّ المعلم أسئلة تحفيزية ووسائل وقصصاً وصوراً أو رسوماً مناسبة."),
            item("a5", "Guru memahami pesan utama surah yang menjadi fokus pembelajaran.", "The teacher understands the main message of the surah in focus.", "يفهم المعلم الرسالة الأساسية للسورة محور الدرس."),
          ],
        },
      ],
    },
    {
      id: "b",
      title: t3("B. Pelaksanaan Pembelajaran Metode 5T", "B. Teaching with the 5T Method", "ب. تنفيذ الدرس بمنهج 5T"),
      description: t3(
        "Supervisor mengamati alur pembelajaran buku PQA di kelas.",
        "The supervisor follows the PQA lesson flow in class.",
        "يتابع المشرف مسار درس كتاب PQA في الصف."
      ),
      groups: [
        {
          id: "tamhid",
          title: t3("1. Tamhid — membangun kesiapan dan ketertarikan anak", "1. Tamhid — building the children's readiness and interest", "١. التمهيد — بناء استعداد الطفل واهتمامه"),
          items: [
            item("b1", "Guru mengawali pembelajaran dengan pertanyaan pemantik atau ilustrasi yang menarik.", "The teacher opens with an engaging question or illustration.", "يبدأ المعلم الدرس بسؤال تحفيزي أو رسم جذّاب."),
            item("b2", "Guru menghubungkan pengalaman anak dengan materi yang akan dipelajari.", "The teacher links the children's experience to the coming material.", "يربط المعلم خبرات الأطفال بالمادة التي ستُدرَس."),
            item("b3", "Guru membangun rasa ingin tahu tanpa langsung memberikan kesimpulan.", "The teacher builds curiosity without giving the conclusion straight away.", "يثير المعلم الفضول دون أن يعطي الخلاصة مباشرة."),
          ],
        },
        {
          id: "tilawah",
          title: t3("2. Tilawah — membimbing anak membaca dan mengenali ayat", "2. Tilawah — guiding the children to read and recognise the verses", "٢. التلاوة — توجيه الطفل إلى قراءة الآيات ومعرفتها"),
          items: [
            item("b4", "Guru membimbing bacaan ayat sesuai kaidah yang dipelajari.", "The teacher guides the recitation according to the rules learnt.", "يوجّه المعلم تلاوة الآيات وفق القواعد المدروسة."),
            item("b5", "Guru memastikan anak mengenali urutan dan posisi ayat (jika tilawah dengan cara menyambung ayat).", "The teacher makes sure the children know the order and position of the verses (when reciting by continuing verses).", "يتأكد المعلم من معرفة الأطفال ترتيب الآيات ومواضعها (عند التلاوة بوصل الآيات)."),
            item("b6", "Guru melibatkan anak secara aktif dalam kegiatan membaca dan mengingat ayat.", "The teacher actively involves the children in reading and remembering the verses.", "يُشرك المعلم الأطفال بفاعلية في قراءة الآيات وتذكّرها."),
          ],
        },
        {
          id: "tafsir",
          title: t3("3. Tafsir — membantu anak memahami arti ayat", "3. Tafsir — helping the children understand the meaning", "٣. التفسير — مساعدة الطفل على فهم معنى الآيات"),
          items: [
            item("b7", "Guru menjelaskan arti kata atau ayat dengan bahasa yang sederhana.", "The teacher explains the meaning of words or verses in simple language.", "يشرح المعلم معاني الكلمات أو الآيات بلغة بسيطة."),
            item("b8", "Guru memberikan penjelasan tafsir singkat yang sesuai dengan sumber dan materi buku.", "The teacher gives a short tafsir that matches the sources and the book.", "يقدّم المعلم تفسيراً موجزاً موافقاً للمصادر ومادة الكتاب."),
            item("b9", "Guru memeriksa pemahaman anak melalui pertanyaan.", "The teacher checks understanding by asking questions.", "يتحقق المعلم من فهم الأطفال بالأسئلة."),
          ],
        },
        {
          id: "tadabbur",
          title: t3("4. Tadabbur — membimbing anak menemukan pesan ayat", "4. Tadabbur — guiding the children to find the verses' message", "٤. التدبر — توجيه الطفل إلى اكتشاف رسالة الآيات"),
          items: [
            item("b10", "Guru mengajukan pertanyaan yang membantu anak menemukan pesan ayat.", "The teacher asks questions that help the children find the message of the verses.", "يطرح المعلم أسئلة تساعد الأطفال على اكتشاف رسالة الآيات."),
            item("b11", "Guru mengarahkan anak menghubungkan pesan ayat dengan kehidupan sehari-hari.", "The teacher guides the children to link the message to daily life.", "يوجّه المعلم الأطفال إلى ربط رسالة الآيات بحياتهم اليومية."),
            item("b12", "Guru memberi kesempatan anak berpikir, menjawab, dan menyampaikan pendapat.", "The teacher gives the children time to think, answer and share their views.", "يمنح المعلم الأطفال فرصة للتفكير والإجابة وإبداء الرأي."),
          ],
        },
        {
          id: "tazkiyah",
          title: t3("5. Tazkiyah — menumbuhkan keimanan dan pengamalan ayat", "5. Tazkiyah — growing faith and living the verses", "٥. التزكية — تنمية الإيمان والعمل بالآيات"),
          items: [
            item("b13", "Guru membimbing anak mengungkapkan keyakinan atau nilai keimanan (tazkiyah imaniyah: “Aku meyakini …”, “Aku merasakan …”).", "The teacher guides the children to express the belief or faith they gained (tazkiyah imaniyah: “I believe …”, “I feel …”).", "يوجّه المعلم الأطفال إلى التعبير عن الإيمان الذي نشأ من الدرس (التزكية الإيمانية: «أنا أؤمن…»، «أنا أشعر…»)."),
            item("b14", "Guru mengajak anak menentukan tindakan nyata (tazkiyah amaliyah: “Aku akan …”) sesuai pesan ayat.", "The teacher invites the children to choose a real action that fits the message (tazkiyah amaliyah: “I will …”).", "يدعو المعلم الأطفال إلى تحديد عمل واقعي يوافق رسالة الآيات (التزكية العملية: «سوف…»)."),
            item("b15", "Guru mendorong tindak lanjut dan pembiasaan, bukan sekadar meminta anak menghafal komitmen.", "The teacher encourages follow-up and habits, not just memorising a commitment.", "يشجّع المعلم المتابعة وبناء العادة، لا مجرد حفظ الالتزام."),
          ],
        },
      ],
    },
    {
      id: "c",
      title: t3("C. Keterampilan Pedagogis Guru", "C. The Teacher's Teaching Skills", "ج. المهارات التربوية للمعلم"),
      description: t3(
        "Bagaimana guru berinteraksi dengan anak selama pembelajaran.",
        "How the teacher interacts with the children during the lesson.",
        "كيف يتفاعل المعلم مع الأطفال أثناء الدرس."
      ),
      groups: [
        {
          id: "c1",
          title: null,
          items: [
            item("c1", "Guru menggunakan bahasa yang sederhana, jelas, dan sesuai usia anak.", "Uses simple, clear, age-appropriate language.", "يستخدم لغة بسيطة وواضحة تناسب عمر الأطفال."),
            item("c2", "Guru mampu menghidupkan suasana belajar yang aktif dan menyenangkan.", "Keeps the lesson active and enjoyable.", "يجعل جوّ التعلّم نشطاً وممتعاً."),
            item("c3", "Guru menunjukkan kesabaran dalam membimbing bacaan dan pemahaman anak.", "Is patient in guiding reading and understanding.", "يُظهر الصبر في توجيه القراءة والفهم."),
            item("c4", "Guru memberikan kesempatan kepada setiap anak untuk berpartisipasi.", "Gives every child a chance to take part.", "يمنح كل طفل فرصة للمشاركة."),
            item("c5", "Guru membangun suasana yang aman sehingga anak berani bertanya dan menjawab.", "Builds a safe atmosphere where children dare to ask and answer.", "يبني جوّاً آمناً يجرؤ فيه الأطفال على السؤال والإجابة."),
            item("c6", "Guru menghindari mempermalukan anak ketika melakukan kesalahan.", "Never embarrasses a child for a mistake.", "يتجنّب إحراج الطفل عند الخطأ."),
            item("c7", "Guru menggunakan pertanyaan terbuka untuk merangsang pemikiran anak.", "Uses open questions to stimulate thinking.", "يستخدم أسئلة مفتوحة لتحفيز التفكير."),
            item("c8", "Guru memberikan respons yang positif terhadap jawaban anak.", "Responds positively to the children's answers.", "يستجيب بإيجابية لإجابات الأطفال."),
            item("c9", "Guru tidak mendominasi pembelajaran dengan ceramah.", "Does not dominate the lesson with lecturing.", "لا يهيمن على الدرس بالمحاضرة."),
            item("c10", "Guru mengelola kelas secara tertib tanpa menghilangkan suasana hangat.", "Keeps the class orderly while staying warm.", "يدير الصف بانضباط دون أن يفقد الدفء."),
            item("c11", "Guru mampu menyesuaikan pendekatan dengan perbedaan kemampuan anak.", "Adapts the approach to the children's different abilities.", "يكيّف أسلوبه وفق اختلاف قدرات الأطفال."),
            item("c12", "Guru memberikan keteladanan melalui sikap, ucapan, dan perilakunya.", "Sets an example through attitude, words and behaviour.", "يكون قدوة بسلوكه وكلامه وتصرفاته."),
          ],
        },
      ],
    },
  ],
};
