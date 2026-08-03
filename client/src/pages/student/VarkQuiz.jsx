import React, { useContext, useMemo, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const questions = [
  {
    id: 1,
    question:
      "Saat kamu mempelajari keterampilan baru di tempat kerja, kamu lebih suka:",
    options: [
      { label: "A", text: "Membaca panduan atau prosedur tertulis", type: "R" },
      {
        label: "B",
        text: "Melihat demonstrasi atau diagram alur kerja",
        type: "V",
      },
      {
        label: "C",
        text: "Mendengarkan penjelasan langsung dari rekan atau atasan",
        type: "A",
      },
      {
        label: "D",
        text: "Langsung mencoba dan belajar dari pengalaman",
        type: "K",
      },
    ],
  },
  {
    id: 2,
    question:
      "Ketika kamu perlu memahami peraturan atau kebijakan baru, kamu cenderung:",
    options: [
      {
        label: "A",
        text: "Membaca dokumen peraturan secara lengkap",
        type: "R",
      },
      {
        label: "B",
        text: "Melihat infografis atau bagan yang menjelaskan peraturan",
        type: "V",
      },
      {
        label: "C",
        text: "Bertanya langsung kepada yang lebih berpengalaman",
        type: "A",
      },
      {
        label: "D",
        text: "Langsung menerapkan dan menyesuaikan di lapangan",
        type: "K",
      },
    ],
  },
  {
    id: 3,
    question:
      "Dalam rapat atau pertemuan, kamu lebih mudah mengingat informasi dengan cara:",
    options: [
      {
        label: "A",
        text: "Mencatat poin-poin penting secara tertulis",
        type: "R",
      },
      { label: "B", text: "Melihat presentasi visual atau slide", type: "V" },
      { label: "C", text: "Mendengarkan diskusi dan penjelasan", type: "A" },
      {
        label: "D",
        text: "Terlibat aktif dalam diskusi dan simulasi",
        type: "K",
      },
    ],
  },
  {
    id: 4,
    question:
      "Saat kamu mendapat tugas baru yang belum pernah dikerjakan, kamu akan:",
    options: [
      {
        label: "A",
        text: "Mencari referensi tertulis atau contoh laporan sebelumnya",
        type: "R",
      },
      {
        label: "B",
        text: "Meminta contoh hasil kerja atau melihat template visual",
        type: "V",
      },
      {
        label: "C",
        text: "Mendiskusikan langkah-langkahnya dengan rekan kerja",
        type: "A",
      },
      {
        label: "D",
        text: "Langsung mulai mengerjakan sambil belajar",
        type: "K",
      },
    ],
  },
  {
    id: 5,
    question:
      "Ketika menghadapi masalah di tempat kerja, cara kamu mencari solusi adalah:",
    options: [
      {
        label: "A",
        text: "Membaca literatur atau dokumentasi terkait masalah",
        type: "R",
      },
      {
        label: "B",
        text: "Membuat diagram atau peta konsep untuk memahami masalah",
        type: "V",
      },
      {
        label: "C",
        text: "Berdiskusi dengan tim untuk mendapatkan berbagai sudut pandang",
        type: "A",
      },
      {
        label: "D",
        text: "Mencoba berbagai solusi secara langsung",
        type: "K",
      },
    ],
  },
  {
    id: 6,
    question:
      "Saat mengikuti pelatihan atau diklat, kamu merasa paling banyak belajar ketika:",
    options: [
      {
        label: "A",
        text: "Mendapatkan modul atau bahan bacaan yang lengkap",
        type: "R",
      },
      {
        label: "B",
        text: "Materi disajikan dengan video atau visualisasi menarik",
        type: "V",
      },
      {
        label: "C",
        text: "Ada sesi tanya jawab dan diskusi kelompok",
        type: "A",
      },
      {
        label: "D",
        text: "Ada praktik langsung atau studi kasus nyata",
        type: "K",
      },
    ],
  },
  {
    id: 7,
    question:
      "Untuk mengingat informasi penting dalam pekerjaan, kamu biasanya:",
    options: [
      {
        label: "A",
        text: "Menuliskan ringkasan atau catatan di buku atau dokumen",
        type: "R",
      },
      { label: "B", text: "Membuat mind map atau diagram visual", type: "V" },
      {
        label: "C",
        text: "Mengulang informasi dengan cara menyampaikannya kepada orang lain",
        type: "A",
      },
      { label: "D", text: "Langsung mempraktikkan agar tidak lupa", type: "K" },
    ],
  },
  {
    id: 8,
    question:
      "Ketika harus menyampaikan laporan kepada atasan, kamu lebih suka:",
    options: [
      {
        label: "A",
        text: "Membuat laporan tertulis yang detail dan terstruktur",
        type: "R",
      },
      {
        label: "B",
        text: "Menyajikan dengan grafik, tabel, atau presentasi visual",
        type: "V",
      },
      {
        label: "C",
        text: "Menyampaikan secara lisan dengan penjelasan langsung",
        type: "A",
      },
      {
        label: "D",
        text: "Mendemonstrasikan hasil kerja secara langsung",
        type: "K",
      },
    ],
  },
  {
    id: 9,
    question:
      "Saat belajar menggunakan aplikasi atau sistem baru di kantor, kamu lebih suka:",
    options: [
      { label: "A", text: "Membaca manual atau panduan penggunaan", type: "R" },
      {
        label: "B",
        text: "Melihat video tutorial atau screenshot langkah demi langkah",
        type: "V",
      },
      {
        label: "C",
        text: "Minta dijelaskan langsung oleh rekan yang sudah paham",
        type: "A",
      },
      {
        label: "D",
        text: "Langsung eksplorasi sendiri fitur-fiturnya",
        type: "K",
      },
    ],
  },
  {
    id: 10,
    question:
      "Ketika kamu perlu memahami data atau statistik, kamu lebih mudah dengan:",
    options: [
      {
        label: "A",
        text: "Membaca penjelasan tertulis tentang data tersebut",
        type: "R",
      },
      {
        label: "B",
        text: "Melihat grafik, diagram, atau visualisasi data",
        type: "V",
      },
      {
        label: "C",
        text: "Mendengarkan seseorang menjelaskan arti dari data tersebut",
        type: "A",
      },
      {
        label: "D",
        text: "Mengolah dan menganalisis data sendiri secara langsung",
        type: "K",
      },
    ],
  },
  {
    id: 11,
    question:
      "Dalam situasi darurat atau krisis di tempat kerja, kamu cenderung:",
    options: [
      {
        label: "A",
        text: "Merujuk pada prosedur atau SOP tertulis",
        type: "R",
      },
      {
        label: "B",
        text: "Mengingat diagram alur atau peta prosedur yang pernah dilihat",
        type: "V",
      },
      {
        label: "C",
        text: "Berkomunikasi dengan tim untuk koordinasi cepat",
        type: "A",
      },
      {
        label: "D",
        text: "Langsung bertindak berdasarkan pengalaman sebelumnya",
        type: "K",
      },
    ],
  },
  {
    id: 12,
    question:
      "Saat memberikan instruksi kepada bawahan atau rekan, kamu lebih suka:",
    options: [
      {
        label: "A",
        text: "Memberikan instruksi tertulis yang jelas dan detail",
        type: "R",
      },
      {
        label: "B",
        text: "Menunjukkan dengan gambar, diagram, atau contoh visual",
        type: "V",
      },
      { label: "C", text: "Menjelaskan secara lisan dengan detail", type: "A" },
      {
        label: "D",
        text: "Mendemonstrasikan langsung cara melakukannya",
        type: "K",
      },
    ],
  },
  {
    id: 13,
    question:
      "Ketika menghadiri seminar atau konferensi, kamu paling banyak mendapat manfaat dari:",
    options: [
      { label: "A", text: "Makalah atau artikel yang dibagikan", type: "R" },
      {
        label: "B",
        text: "Slide presentasi yang informatif dan menarik",
        type: "V",
      },
      { label: "C", text: "Sesi diskusi panel dan tanya jawab", type: "A" },
      { label: "D", text: "Workshop atau sesi praktik langsung", type: "K" },
    ],
  },
  {
    id: 14,
    question: "Untuk meningkatkan kompetensi diri, kamu lebih memilih:",
    options: [
      {
        label: "A",
        text: "Membaca buku atau jurnal terkait bidang kerja",
        type: "R",
      },
      {
        label: "B",
        text: "Menonton video pembelajaran atau dokumenter",
        type: "V",
      },
      { label: "C", text: "Mengikuti podcast atau diskusi online", type: "A" },
      {
        label: "D",
        text: "Mengikuti magang atau program on-the-job training",
        type: "K",
      },
    ],
  },
  {
    id: 15,
    question: "Saat mengevaluasi hasil pekerjaan tim, kamu lebih suka:",
    options: [
      {
        label: "A",
        text: "Membaca laporan evaluasi tertulis secara menyeluruh",
        type: "R",
      },
      {
        label: "B",
        text: "Melihat dashboard atau visualisasi performa tim",
        type: "V",
      },
      {
        label: "C",
        text: "Mendiskusikan hasil evaluasi bersama tim",
        type: "A",
      },
      {
        label: "D",
        text: "Langsung melakukan perbaikan berdasarkan temuan di lapangan",
        type: "K",
      },
    ],
  },
  {
  id: 16,
  question:
    "Ketika ditempatkan pada unit kerja baru dan perlu memahami tata letak serta alur pelayanan, kamu lebih memilih:",
  options: [
    {
      label: "A",
      text: "Mengikuti peninjauan langsung dan mencoba alur pelayanan tersebut",
      type: "K",
    },
    {
      label: "B",
      text: "Melihat denah ruangan dan diagram alur pelayanan",
      type: "V",
    },
    {
      label: "C",
      text: "Mendengarkan penjelasan dari petugas dan mengajukan pertanyaan",
      type: "A",
    },
    {
      label: "D",
      text: "Membaca panduan tertulis mengenai tata letak dan prosedur pelayanan",
      type: "R",
    },
  ],
},
];

const typeLabels = {
  V: {
    label: "Visual",
    desc: "Menunjukkan preferensi terhadap diagram, grafik, peta, pola, dan representasi visual.",
  },
  A: {
    label: "Aural",
    desc: "Menunjukkan preferensi terhadap penjelasan lisan, diskusi, tanya jawab, dan percakapan.",
  },
  R: {
    label: "Read/Write",
    desc: "Menunjukkan preferensi terhadap teks, daftar, catatan, dan kegiatan membaca atau menulis.",
  },
  K: {
    label: "Kinesthetic",
    desc: "Menunjukkan preferensi terhadap contoh nyata, pengalaman, praktik, simulasi, dan penerapan langsung.",
  },
};

const typeOrder = ["V", "A", "R", "K"];

/**
 * Mengubah urutan tampil pilihan secara deterministik berdasarkan indeks soal.
 * Tujuannya agar posisi modalitas tidak selalu sama pada setiap pertanyaan.
 * Pemetaan jawaban ke V, A, R, atau K tetap mengikuti properti `type`.
 */
const orderOptionsForDisplay = (options, questionIndex) => {
  if (!Array.isArray(options) || options.length === 0) return [];
  const offset = questionIndex % options.length;
  return [...options.slice(offset), ...options.slice(0, offset)];
};

const VarkQuiz = () => {
  const { backendUrl, getToken, setUserData } = useContext(AppContext);
  const navigate = useNavigate();

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const currentQuestion = questions[currentQ];

  const displayedOptions = useMemo(
    () => orderOptionsForDisplay(currentQuestion.options, currentQ),
    [currentQuestion, currentQ],
  );

  const selectedTypes = answers[currentQ] || [];

  const answeredQuestionCount = useMemo(
    () =>
      Object.values(answers).filter(
        (selected) => Array.isArray(selected) && selected.length > 0,
      ).length,
    [answers],
  );

  const toggleOption = (type) => {
    setAnswers((previous) => {
      const current = previous[currentQ] || [];
      const updated = current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type];

      return { ...previous, [currentQ]: updated };
    });
  };

  const isSelected = (type) => selectedTypes.includes(type);

  const goToNextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((previous) => previous + 1);
      return;
    }

    calculateResult(answers);
  };

  const handleSkip = () => {
    const updatedAnswers = { ...answers, [currentQ]: [] };
    setAnswers(updatedAnswers);

    if (currentQ < questions.length - 1) {
      setCurrentQ((previous) => previous + 1);
      return;
    }

    calculateResult(updatedAnswers);
  };

  const handleBack = () => {
    if (currentQ > 0) {
      setCurrentQ((previous) => previous - 1);
    }
  };

  const calculateResult = async (answerSnapshot = answers) => {
    const rawScores = { V: 0, A: 0, R: 0, K: 0 };

    Object.values(answerSnapshot).forEach((types) => {
      if (!Array.isArray(types)) return;
      types.forEach((type) => {
        if (Object.prototype.hasOwnProperty.call(rawScores, type)) {
          rawScores[type] += 1;
        }
      });
    });

    const totalSelections = Object.values(rawScores).reduce(
      (sum, value) => sum + value,
      0,
    );

    if (totalSelections === 0) {
      toast.warn("Pilih setidaknya satu jawaban sebelum melihat hasil.");
      return;
    }

    const highestScore = Math.max(...Object.values(rawScores));
    const highestModalities = typeOrder.filter(
      (type) => rawScores[type] === highestScore,
    );

    const completedQuestions = Object.values(answerSnapshot).filter(
      (types) => Array.isArray(types) && types.length > 0,
    ).length;

    const varkResult = {
      instrument: "adapted-vark-modalities",
      scoringMethod: "raw-count-vector",
      questionnaireVersion: "custom-workplace-1.0",
      rawScores,
      highestModalities,
      // Kompatibilitas dengan struktur backend lama.
      // Field `scores` sekarang menyimpan skor mentah VARK.
      scores: rawScores,
      dominant: highestModalities,
      completedQuestions,
      skippedQuestions: questions.length - completedQuestions,
      totalQuestions: questions.length,
      totalSelections,
      officialPreference: null,
    };

    setResult(varkResult);

    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/save-vark`,
        { varkResult },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (data.success) {
        setUserData(data.user);
        toast.success("Profil preferensi VARK berhasil disimpan.");
      } else {
        toast.error(data.message || "Hasil VARK gagal disimpan.");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Terjadi kesalahan saat menyimpan hasil.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetQuiz = () => {
    setResult(null);
    setAnswers({});
    setCurrentQ(0);
  };

  const progress = Math.round(((currentQ + 1) / questions.length) * 100);

  if (result) {
    const highestNames = result.highestModalities
      .map((type) => typeLabels[type]?.label)
      .filter(Boolean);

    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-2xl shadow-lg max-w-xl w-full p-8">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">✓</div>
            <h2 className="text-2xl font-bold text-gray-800">
              Profil Preferensi VARK
            </h2>
            <p className="text-gray-500 mt-2">
              Modalitas dengan skor mentah tertinggi:
            </p>
          </div>

          <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-5 text-center mb-6">
            <p className="text-2xl font-bold text-blue-700">
              {highestNames.join(" / ")}
            </p>
            <p className="mt-2 text-sm text-blue-700">
              {result.highestModalities.length > 1
                ? "Beberapa modalitas memperoleh skor tertinggi yang sama."
                : typeLabels[result.highestModalities[0]]?.desc}
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {typeOrder.map((type) => {
              const rawScore = result.rawScores[type];
              const percentage =
                result.totalSelections > 0
                  ? (rawScore / result.totalSelections) * 100
                  : 0;

              return (
                <div key={type}>
                  <div className="flex justify-between text-sm text-gray-700 mb-1">
                    <span className="font-medium">
                      {typeLabels[type].label}
                    </span>
                    <span>
                      {rawScore} poin ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 mb-6">
            <p className="font-semibold mb-1">Catatan metodologis</p>
            <p>
              Hasil dan data yang disimpan menggunakan skor mentah VARK.
              Persentase pada tampilan hanya membantu interpretasi dan tidak
              disimpan sebagai vektor rekomendasi. Aplikasi ini tidak menghasilkan
              kategori resmi VARK seperti “mild Visual”, “VRK”, atau kategori resmi
              lainnya.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-8">
            <div className="rounded-lg bg-gray-50 p-3">
              <span className="block text-xs text-gray-400">Terjawab</span>
              <strong>{result.completedQuestions} pertanyaan</strong>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <span className="block text-xs text-gray-400">Dilewati</span>
              <strong>{result.skippedQuestions} pertanyaan</strong>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              Kembali ke Beranda
            </button>
            <button
              type="button"
              onClick={resetQuiz}
              className="flex-1 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
            >
              Ulangi Kuis
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl shadow-lg max-w-xl w-full p-8">
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>
              Pertanyaan {currentQ + 1} dari {questions.length}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {answeredQuestionCount} pertanyaan telah dijawab
          </p>
        </div>

        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          {currentQuestion.question}
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Pilih satu atau beberapa jawaban yang paling sesuai. Lewati
          pertanyaan apabila tidak ada pilihan yang sesuai.
        </p>

        <div className="space-y-3">
          {displayedOptions.map((option, index) => {
            const displayLabel = String.fromCharCode(65 + index);
            const selected = isSelected(option.type);

            return (
              <button
                type="button"
                key={`${currentQuestion.id}-${option.type}`}
                onClick={() => toggleOption(option.type)}
                aria-pressed={selected}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-700 ${
                  selected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 ${
                      selected
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selected && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span>
                    <span className="font-semibold text-blue-600 mr-1">
                      {displayLabel}.
                    </span>
                    {option.text}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap justify-between items-center gap-3 mt-7">
          <button
            type="button"
            onClick={handleBack}
            className={`text-sm text-gray-500 hover:text-gray-700 ${
              currentQ === 0 ? "invisible" : ""
            }`}
          >
            ← Sebelumnya
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSkip}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 font-medium disabled:opacity-50"
            >
              Lewati
            </button>
            <button
              type="button"
              onClick={goToNextQuestion}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {currentQ === questions.length - 1
                ? loading
                  ? "Menyimpan..."
                  : "Lihat Hasil"
                : "Selanjutnya →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VarkQuiz;
