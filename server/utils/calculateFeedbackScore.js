const normalizeDominantVark = (dominant) => {
  if (!dominant) return null;

  const value = String(dominant)
    .trim()
    .toUpperCase();

  if (value === "V" || value === "VISUAL") return "V";
  if (value === "A" || value === "AURAL" || value === "AUDITORY") {
    return "A";
  }
  if (value === "R" || value === "READ" || value === "READING") {
    return "R";
  }
  if (value === "K" || value === "KINESTHETIC") return "K";

  return null;
};


/**
 * Mencari objek modalitas dominan sesuai profil praja.
 *
 * V/A/R:
 *   mental >= 84 -> macro
 *   mental < 84  -> micro
 *
 * K:
 *   mental >= 84 -> C4-C6
 *   mental < 84  -> C1-C3
 */
const getDominantLectures = ({
  chapter,
  dominantVark,
  mentalKepribadian,
}) => {
  const lectures = chapter.chapterContent || [];

  const mainSet = new Set(
    (chapter.mainLectureIds || []).map(String)
  );

  const highMental =
    Number(mentalKepribadian) >= 84;

  return lectures.filter((lecture) => {
    if (!lecture?.lectureId) return false;

    const lectureId = String(lecture.lectureId);

    // Materi utama tidak boleh dihitung dua kali
    if (mainSet.has(lectureId)) {
      return false;
    }

    const tag = String(
      lecture.tags || ""
    ).toUpperCase();

    if (tag !== dominantVark) {
      return false;
    }

    // Khusus Kinestetik
    if (dominantVark === "K") {
      const expectedLevel = highMental
        ? "C4-C6"
        : "C1-C3";

      return (
        String(lecture.cognitiveLevel) ===
        expectedLevel
      );
    }

    // V / A / R
    const expectedGranularity = highMental
      ? "macro"
      : "micro";

    return (
      String(
        lecture.contentGranularity || ""
      ).toLowerCase() === expectedGranularity
    );
  });
};


/**
 * Feedback comparable G1 vs G2.
 *
 * Per chapter:
 * - Materi utama        : masing-masing 1 unit
 * - Modalitas dominan   : maksimal 1 unit
 * - Objek tambahan      : maksimal 4 unit
 */
export const calculateFeedbackScore = ({
  course,
  lectureCompleted = [],
  dominant,
  mentalKepribadian,
}) => {
  const dominantVark =
    normalizeDominantVark(dominant);

  const completedSet = new Set(
    (lectureCompleted || []).map(String)
  );

  let mainEarned = 0;
  let mainPossible = 0;

  let dominantEarned = 0;
  let dominantPossible = 0;

  let supplementaryEarned = 0;
  let supplementaryPossible = 0;

  const chapterDetails = [];

  /*
   * Hanya chapter eksperimen.
   * Pada data Anda pertemuan 3-7 sudah memiliki mainLectureIds.
   * Pertemuan 1-2 otomatis tidak ikut.
   */
  const scoredChapters = (
    course?.courseContent || []
  ).filter(
    (chapter) =>
      Array.isArray(chapter.mainLectureIds) &&
      chapter.mainLectureIds.length > 0
  );

  for (const chapter of scoredChapters) {
    const lectures =
      chapter.chapterContent || [];

    // ============================
    // 1. MATERI UTAMA
    // ============================

    const mainIds = [
      ...new Set(
        (chapter.mainLectureIds || [])
          .map(String)
      ),
    ];

    const completedMainCount =
      mainIds.filter((id) =>
        completedSet.has(id)
      ).length;

    mainEarned += completedMainCount;
    mainPossible += mainIds.length;


    // ============================
    // 2. BLOK MODALITAS DOMINAN
    // ============================

    const dominantLectures =
      getDominantLectures({
        chapter,
        dominantVark,
        mentalKepribadian,
      });

    const dominantIds = [
      ...new Set(
        dominantLectures.map((lecture) =>
          String(lecture.lectureId)
        )
      ),
    ];

    const completedDominantCount =
      dominantIds.filter((id) =>
        completedSet.has(id)
      ).length;

    /*
     * Satu blok modalitas per chapter
     * maksimal bernilai 1.
     *
     * Contoh:
     * V-micro = 4/8 = 0.5
     * V-macro = 1/1 = 1
     * K       = 1/1 = 1
     */
    let chapterDominantScore = 0;

    if (dominantIds.length > 0) {
      chapterDominantScore =
        completedDominantCount /
        dominantIds.length;
    }

    dominantEarned +=
      chapterDominantScore;

    // Selalu 1 unit per chapter eksperimen
    dominantPossible += 1;


    // ============================
    // 3. OBJEK TAMBAHAN
    // ============================

    const excludedIds = new Set([
      ...mainIds,
      ...dominantIds,
    ]);

    const supplementaryIds = [
      ...new Set(
        lectures
          .filter(
            (lecture) =>
              lecture?.lectureId &&
              !excludedIds.has(
                String(lecture.lectureId)
              )
          )
          .map((lecture) =>
            String(lecture.lectureId)
          )
      ),
    ];

    const completedSupplementaryCount =
      supplementaryIds.filter((id) =>
        completedSet.has(id)
      ).length;

    /*
     * Baik G1 maupun G2:
     * maksimal hanya 4 unit tambahan/chapter.
     *
     * G2 kemungkinan menyelesaikannya karena
     * mendapat Top-4 recommendation.
     *
     * G1 bebas memilih sendiri.
     */
    const chapterSupplementaryScore =
      Math.min(
        completedSupplementaryCount,
        4
      );

    supplementaryEarned +=
      chapterSupplementaryScore;

    supplementaryPossible += 4;


    // ============================
    // DEBUG
    // ============================

    chapterDetails.push({
      chapterId: chapter.chapterId,

      main: {
        completed: completedMainCount,
        possible: mainIds.length,
      },

      dominant: {
        modality: dominantVark,
        assignedIds: dominantIds,
        completed:
          completedDominantCount,
        score: Number(
          chapterDominantScore.toFixed(4)
        ),
        possible: 1,
      },

      supplementary: {
        completed:
          completedSupplementaryCount,
        earned:
          chapterSupplementaryScore,
        possible: 4,
      },
    });
  }


  // ============================
  // TOTAL
  // ============================

  const earned =
    mainEarned +
    dominantEarned +
    supplementaryEarned;

  const possible =
    mainPossible +
    dominantPossible +
    supplementaryPossible;

  const feedback =
    possible > 0
      ? (earned / possible) * 100
      : 0;

  return {
    feedback: Number(
      feedback.toFixed(1)
    ),

    earned: Number(
      earned.toFixed(4)
    ),

    possible,

    mainEarned,
    mainPossible,

    dominantEarned: Number(
      dominantEarned.toFixed(4)
    ),
    dominantPossible,

    supplementaryEarned,
    supplementaryPossible,

    chapterDetails,
  };
};