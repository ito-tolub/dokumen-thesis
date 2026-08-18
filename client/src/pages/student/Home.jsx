import React, { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useUser } from "@clerk/clerk-react";

/* ============================================================
   Konstanta kalender
   ============================================================ */
const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const DAY_HDR = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const DAYS_ID = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

const firstDayOffset = (y, m) => {
  const d = new Date(y, m, 1).getDay();
  return d === 0 ? 6 : d - 1;
};
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const dowOf = (y, m, d) => {
  const w = new Date(y, m, d).getDay();
  return w === 0 ? 6 : w - 1;
};

const SEMESTER_START = new Date(2026, 7, 3); // Senin, 22 Juni 2026 — minggu ke-1
const WEEKS_BEFORE_BREAK = 8;
const BREAK_WEEKS = 1;
const WEEKS_AFTER_BREAK = 7;

const MS_DAY = 86400000;
const midnight = (y, m, d) => new Date(y, m, d).getTime();
const weekIndexFromStart = (y, m, d) => {
  const diff = Math.floor(
    (midnight(y, m, d) -
      midnight(
        SEMESTER_START.getFullYear(),
        SEMESTER_START.getMonth(),
        SEMESTER_START.getDate(),
      )) /
      MS_DAY,
  );
  return diff < 0 ? -1 : Math.floor(diff / 7);
};
const isTeachingDate = (y, m, d) => {
  const w = weekIndexFromStart(y, m, d);
  if (w < 0) return false;
  const secondStart = WEEKS_BEFORE_BREAK + BREAK_WEEKS;
  return (
    w < WEEKS_BEFORE_BREAK ||
    (w >= secondStart && w < secondStart + WEEKS_AFTER_BREAK)
  );
};
const isBreakDate = (y, m, d) => {
  const w = weekIndexFromStart(y, m, d);
  return w >= WEEKS_BEFORE_BREAK && w < WEEKS_BEFORE_BREAK + BREAK_WEEKS;
};

/* ============================================================
   Ikon inline (proyek tidak memakai library ikon)
   ============================================================ */
const I = {
  chevL: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  chevR: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  chevD: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  search: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  user: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  book: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  trophy: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </svg>
  ),
  calendar: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  clipboard: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  ),
};

/* ============================================================
   Kalender — berfungsi penuh (navigasi bulan, hari ini, pilih tgl)
   ============================================================ */
const CalendarCard = ({ enrolledCourses = [] }) => {
  const today = useMemo(() => new Date(), []);
  const [cur, setCur] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
  });
  const [sel, setSel] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
    d: today.getDate(),
  });

  // Peta: nama hari → daftar kelas pada hari itu
  const jadwalPerHari = useMemo(() => {
    const map = {};
    (enrolledCourses || []).forEach((c) => {
      const day = c?.schedule?.day;
      if (!day) return;
      (map[day] ||= []).push({
        title: c.courseTitle,
        startTime: c?.schedule?.startTime,
        endTime: c?.schedule?.endTime,
      });
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || "")),
    );
    return map;
  }, [enrolledCourses]);

  const prev = () =>
    setCur((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { ...c, m: c.m - 1 }));
  const next = () =>
    setCur((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { ...c, m: c.m + 1 }));

  const offset = firstDayOffset(cur.y, cur.m);
  const total = daysInMonth(cur.y, cur.m);
  const prevTotal = daysInMonth(cur.y, cur.m - 1);
  const trailing = (offset + total) % 7 === 0 ? 0 : 7 - ((offset + total) % 7);

  const cells = [
    ...Array.from({ length: offset }, (_, i) => ({
      d: prevTotal - offset + 1 + i,
      other: true,
    })),
    ...Array.from({ length: total }, (_, i) => ({ d: i + 1, other: false })),
    ...Array.from({ length: trailing }, (_, i) => ({ d: i + 1, other: true })),
  ];

  const todayDate = today.getDate(),
    todayMon = today.getMonth(),
    todayYr = today.getFullYear();
  const selDow = dowOf(sel.y, sel.m, sel.d);
  const selLabel = `${DAYS_ID[selDow]}, ${sel.d} ${MONTHS_ID[sel.m]} ${sel.y}`;

  // apakah tanggal (di bulan yg ditampilkan) punya kelas + masuk minggu aktif
  const dayHasClass = (d) => {
    if (!isTeachingDate(cur.y, cur.m, d)) return false;
    const name = DAYS_ID[dowOf(cur.y, cur.m, d)];
    return (jadwalPerHari[name] || []).length > 0;
  };

  // kelas pada tanggal terpilih
  const selClasses = isTeachingDate(sel.y, sel.m, sel.d)
    ? jadwalPerHari[DAYS_ID[selDow]] || []
    : [];
  const selIsBreak = isBreakDate(sel.y, sel.m, sel.d);

  const cellCls = (cell) => {
    if (cell.other) return "text-gray-300 cursor-default";
    const isToday =
      cur.y === todayYr && cur.m === todayMon && cell.d === todayDate;
    const isSel = cur.y === sel.y && cur.m === sel.m && cell.d === sel.d;
    if (isToday) return "bg-green-600 text-white font-bold cursor-pointer";
    if (isSel) return "bg-green-100 text-green-800 font-bold cursor-pointer";
    return "text-gray-700 hover:bg-green-50 cursor-pointer";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      {/* header navigasi bulan */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prev}
          aria-label="Bulan sebelumnya"
          className="w-7 h-7 border border-gray-200 rounded-md flex items-center justify-center text-gray-600 hover:bg-gray-50"
        >
          <I.chevL width={14} height={14} />
        </button>
        <span className="text-sm font-bold text-gray-800">
          {MONTHS_ID[cur.m]} {cur.y}
        </span>
        <button
          onClick={next}
          aria-label="Bulan berikutnya"
          className="w-7 h-7 border border-gray-200 rounded-md flex items-center justify-center text-gray-600 hover:bg-gray-50"
        >
          <I.chevR width={14} height={14} />
        </button>
      </div>

      {/* header hari */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAY_HDR.map((d, i) => (
          <div
            key={d}
            className={`text-center text-[10px] font-semibold py-1 ${i >= 5 ? "text-rose-300" : "text-gray-400"}`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* grid tanggal */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, i) => {
          const showDot = !cell.other && dayHasClass(cell.d);
          const isTodayCell =
            !cell.other &&
            cur.y === todayYr &&
            cur.m === todayMon &&
            cell.d === todayDate;
          return (
            <button
              key={i}
              disabled={cell.other}
              onClick={() =>
                !cell.other && setSel({ y: cur.y, m: cur.m, d: cell.d })
              }
              className={`relative text-center text-xs py-1.5 rounded-md transition-colors ${cellCls(cell)}`}
            >
              {cell.d}
              {showDot && (
                <span
                  className={`absolute left-1/2 -translate-x-1/2 bottom-0.5 w-1 h-1 rounded-full ${isTodayCell ? "bg-white" : "bg-green-600"}`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* panel jadwal tanggal terpilih */}
      <div className="border-t border-gray-100 mt-3 pt-3">
        <p className="text-xs font-bold text-gray-800 mb-2">{selLabel}</p>

        {selClasses.length > 0 ? (
          <div className="flex flex-col gap-2">
            {selClasses.map((k, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600 mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-gray-800 leading-snug">
                    {k.title}
                  </div>
                  {(k.startTime || k.endTime) && (
                    <div className="text-[10px] text-gray-500">
                      {k.startTime}
                      {k.endTime ? ` – ${k.endTime}` : ""}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-3">
            <I.calendar
              width={32}
              height={32}
              className="mx-auto text-gray-300 mb-1.5"
            />
            <p className="text-[11px] text-gray-400">
              {selIsBreak
                ? "Libur semester"
                : "Tidak ada jadwal kelas di tanggal ini"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================
   Kartu kelas — navigasi mengikuti alur asli: /course/:id
   ============================================================ */
const barColor = (p) => (p === 0 ? "#9ca3af" : p < 50 ? "#f59e0b" : "#16a34a");
const TARGET_COURSE_TITLE = "Manajemen Proyek Sistem Informasi Pemerintahan";

const ClassCard = ({ course, isEnrolled, isEnrolling, onTakeCourse }) => {
  const { isSignedIn } = useUser();
  const educatorName = Array.isArray(course?.pengajar)
    ? course.pengajar
        .map((dosen) => dosen?.nama)
        .filter(Boolean)
        .join("/ ")
    : course?.pengajar?.nama || course?.pengajarNama || "Dosen Pengajar";

  const sch = course?.schedule;

  const jadwal = sch?.day
    ? `${sch.day}${sch.startTime ? `, ${sch.startTime}` : ""}${
        sch.endTime ? ` – ${sch.endTime}` : ""
      }`
    : null;

  const hadir = course?.kehadiran?.hadir ?? 0;
  const totalSesi = course?.kehadiran?.totalSesi ?? 0;

  const pct = totalSesi > 0 ? Math.round((hadir / totalSesi) * 100) : 0;

  const isTargetCourse =
    course?.courseTitle?.trim().toLowerCase() ===
    TARGET_COURSE_TITLE.toLowerCase();

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
      <Link
        to={isSignedIn ? `/course/${course._id}` : "#"}
        onClick={(event) => {
          if (!isSignedIn) {
            event.preventDefault();

            toast.info("Silakan login terlebih dahulu.");

            return;
          }

          window.scrollTo(0, 0);
        }}
        className="block p-3.5 cursor-pointer"
      >
        <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">
          {course.courseTitle}
        </h3>

        <p className="text-[11px] text-gray-500 mt-0.5">
          Teknologi Rekayasa Informasi Pemerintahan
        </p>

        <span className="inline-block text-[10px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 mt-2 mb-2">
          Kelas Akademik
        </span>

        <div className="flex items-center gap-1.5 text-[11px] text-gray-700 mb-1">
          <I.user width={12} height={12} className="text-gray-400 shrink-0" />

          <span className="leading-snug">{educatorName}</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-gray-700">
          <I.calendar
            width={12}
            height={12}
            className="text-gray-400 shrink-0"
          />

          <span>{jadwal || "Jadwal belum tersedia"}</span>
        </div>

        {totalSesi > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-gray-50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-500">
                Kehadiran: {hadir} dari {totalSesi} pertemuan
              </span>

              <span
                className="text-[10px] font-semibold"
                style={{ color: barColor(pct) }}
              >
                {pct}%
              </span>
            </div>

            <div className="h-1 bg-gray-200 rounded-full">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: barColor(pct),
                }}
              />
            </div>
          </div>
        )}
      </Link>

      {isSignedIn && isTargetCourse && (
        <div className="px-3.5 pb-3.5">
          <button
            type="button"
            disabled={isEnrolled || isEnrolling}
            onClick={() => onTakeCourse(course._id)}
            className={`w-full rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              isEnrolled
                ? "bg-green-100 text-green-700 cursor-default"
                : "bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
            }`}
          >
            {isEnrolled
              ? "Mata Kuliah Sudah Diambil"
              : isEnrolling
                ? "Memproses..."
                : "Ambil Mata Kuliah"}
          </button>
        </div>
      )}
    </div>
  );
};

const WelcomeBanner = ({ name }) => (
  <div className="relative overflow-hidden bg-green-600 rounded-xl px-6 py-5 mb-5">
    <div className="absolute -top-10 right-16 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
    <div className="absolute top-2 right-48 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
    <h1 className="text-xl font-bold text-white relative z-10">
      Selamat datang, {name} 👋
    </h1>
    <p className="text-sm text-white/80 mt-1 relative z-10">
      Berikut ringkasan kelas dan jadwal Anda pada periode akademik ini.
    </p>
  </div>
);

const Home = () => {
  const {
    allCourses,
    enrolledCourses,
    userData,
    backendUrl,
    getToken,
    fetUserEnrolledCourses,
  } = useContext(AppContext);

  const [tab, setTab] = useState("akademik");
  const [search, setSearch] = useState("");
  const [semester, setSemester] = useState("2025 Ganjil");
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);

  const enrolledCourseIds = useMemo(() => {
    return new Set((enrolledCourses || []).map((course) => String(course._id)));
  }, [enrolledCourses]);

  const baseClasses = useMemo(() => {
    const targetTitle = TARGET_COURSE_TITLE.trim().toLowerCase();

    // Jika sudah login dan course target
    // sudah diambil, gunakan data enrolled.
    const enrolledTarget = (enrolledCourses || []).find(
      (course) => course?.courseTitle?.trim().toLowerCase() === targetTitle,
    );

    if (enrolledTarget) {
      return [enrolledTarget];
    }

    // Sebelum login atau belum mengambil course:
    // hanya tampilkan course target dari allCourses.
    const targetCourse = (allCourses || []).find(
      (course) => course?.courseTitle?.trim().toLowerCase() === targetTitle,
    );

    return targetCourse ? [targetCourse] : [];
  }, [allCourses, enrolledCourses]);

  const handleTakeCourse = async (courseId) => {
    if (enrollingCourseId) {
      return;
    }

    try {
      setEnrollingCourseId(courseId);

      const token = await getToken();

      if (!token) {
        toast.error("Silakan masuk terlebih dahulu");
        return;
      }

      const { data } = await axios.post(
        `${backendUrl}/api/user/enroll-free`,
        {
          courseId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!data.success) {
        if (data.message === "Sudah terdaftar di kursus ini") {
          await fetUserEnrolledCourses();

          toast.info("Mata kuliah ini sudah pernah diambil");

          return;
        }

        toast.error(data.message || "Mata kuliah gagal diambil");

        return;
      }

      await fetUserEnrolledCourses();

      toast.success("Mata kuliah berhasil diambil");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Mata kuliah gagal diambil",
      );
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const classes = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return baseClasses;

    return baseClasses.filter((course) => {
      const educatorNames = Array.isArray(course?.pengajar)
        ? course.pengajar
            .map((dosen) => dosen?.nama || "")
            .join(" ")
            .toLowerCase()
        : (course?.pengajar?.nama || course?.pengajarNama || "").toLowerCase();

      return (
        (course?.courseTitle || "").toLowerCase().includes(q) ||
        educatorNames.includes(q)
      );
    });
  }, [baseClasses, search]);

  const displayName = userData?.namaKeprajaan || userData?.name || "Praja";

  return (
    <div className="min-h-screen bg-gray-100 w-full text-left">
      <div className="max-w-[1180px] mx-auto px-4 md:px-6 py-5">
        <WelcomeBanner name={displayName} />

        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* ===== Sidebar kiri ===== */}
          <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-3">
            <CalendarCard enrolledCourses={enrolledCourses} />

            {/* Perlu Dikerjakan */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center mb-2.5">
                <span className="text-sm font-bold text-gray-800">
                  Perlu Dikerjakan
                </span>
                <span className="ml-1.5 text-[10px] font-bold bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">
                  0
                </span>
              </div>
              <div className="text-center py-3.5">
                <I.clipboard
                  width={30}
                  height={30}
                  className="mx-auto text-gray-300 mb-1.5"
                />
                <p className="text-[11px] text-gray-400">
                  Tidak ada yang perlu dikerjakan saat ini
                </p>
              </div>
            </div>

            {/* CTA leaderboard */}
            <div className="bg-green-600 rounded-xl p-3.5 flex items-center gap-2.5 cursor-pointer">
              <I.trophy
                width={22}
                height={22}
                className="text-white shrink-0"
              />
              <p className="text-[11px] font-semibold text-white leading-snug">
                Selesaikan aktivitas, kumpulkan poin, dan raih posisi puncak di
                leaderboard!
              </p>
            </div>
          </aside>

          {/* ===== Panel utama ===== */}
          <section className="flex-1 min-w-0 w-full">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                {[
                  { key: "akademik", label: "Kelas Akademik" },
                  { key: "personal", label: "Kelas Personal" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`px-5 py-3 text-xs font-semibold transition-colors border-b-2 ${
                      tab === t.key
                        ? "text-green-600 border-green-600"
                        : "text-gray-500 border-transparent"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {tab === "akademik" ? (
                  <>
                    <h2 className="text-sm font-bold text-gray-900">
                      Kelas Akademik
                    </h2>
                    <p className="text-[11px] text-gray-500 mt-0.5 mb-3.5">
                      Anda memiliki {baseClasses.length} kelas sesuai jadwal
                      perkuliahan di SiAkad pada periode ini
                    </p>

                    {/* search + semester */}
                    <div className="flex gap-2 mb-4">
                      <div className="flex-1 relative">
                        <I.search
                          width={13}
                          height={13}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Cari mata kuliah, kode kelas, atau nama dosen"
                          className="w-full pl-7 pr-2.5 py-2 text-[11px] text-gray-700 border border-gray-200 rounded-lg outline-none focus:border-green-500"
                        />
                      </div>
                      <div className="relative">
                        <select
                          value={semester}
                          onChange={(e) => setSemester(e.target.value)}
                          className="appearance-none pl-3 pr-8 py-2 text-[11px] text-gray-700 border border-gray-200 rounded-lg bg-white outline-none cursor-pointer focus:border-green-500"
                        >
                          <option>2026 Ganjil</option>
                          <option>2026 Genap</option>
                        </select>
                        <I.chevD
                          width={12}
                          height={12}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                        />
                      </div>
                    </div>

                    {/* grid kelas */}
                    {classes.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {classes.map((course) => (
                          <ClassCard
                            key={course._id}
                            course={course}
                            isEnrolled={enrolledCourseIds.has(
                              String(course._id),
                            )}
                            isEnrolling={
                              String(enrollingCourseId) === String(course._id)
                            }
                            onTakeCourse={handleTakeCourse}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-gray-400">
                        <I.search
                          width={30}
                          height={30}
                          className="mx-auto mb-2"
                        />
                        <p className="text-xs">
                          {search
                            ? `Tidak ada kelas untuk "${search}"`
                            : "Belum ada kelas tersedia"}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <h2 className="text-sm font-bold text-gray-900">
                      Kelas Personal
                    </h2>
                    <p className="text-[11px] text-gray-500 mt-0.5 mb-3.5">
                      Belum ada kelas personal yang terdaftar
                    </p>
                    <div className="text-center py-10 text-gray-400">
                      <I.book width={32} height={32} className="mx-auto mb-2" />
                      <p className="text-xs">Belum ada kelas personal</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Home;
