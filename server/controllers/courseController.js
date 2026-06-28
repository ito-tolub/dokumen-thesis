import Course from "../models/Course.js";
import User from "../models/User.js";
import Keprajaan from "../models/Keprajaan.js";
import Pegawai from "../models/pegawai.js";

// Normalisasi NPP agar 33.005 (Number) cocok dengan "33.0050" (String/Mixed) → "33.0050"
const nppKey = (v) => {
  const n = parseFloat(v);
  return Number.isNaN(n) ? String(v ?? "").trim() : n.toFixed(4);
};

// Get All Courses
export const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find({ isPublished: true })
            .select(['-courseContent', '-enrolledStudents'])
            .lean();   // lean → objek polos, bisa kita tambah field pengajarNama

        // Kumpulkan NIP educator, ambil namanya dari koleksi pegawai (manual join)
        const nips = [
            ...new Set(courses.map((c) => String(c.educator)).filter(Boolean)),
        ];
        const pegawaiList = await Pegawai.find({ nip: { $in: nips } }).lean();
        const namaByNip = Object.fromEntries(
            pegawaiList.map((p) => [String(p.nip), p.nama]),
        );

        const enriched = courses.map((c) => ({
            ...c,
            pengajarNama: c.pengajarNama || namaByNip[String(c.educator)] || null,
        }));

        res.json({ success: true, courses: enriched });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// GetCourse by Id
export const getCourseId = async (req, res) => {
    const { id } = req.params
    try {
        const courseData = await Course.findById(id).lean();   // lean → bisa tambah field

        if (!courseData) {
            return res.json({ success: false, message: 'Course tidak ditemukan' })
        }

        // Manual join: NIP educator → nama dari koleksi pegawai
        if (!courseData.pengajarNama && courseData.educator) {
            const pegawai = await Pegawai.findOne({ nip: String(courseData.educator) }).lean();
            courseData.pengajarNama = pegawai?.nama || null;
        }

        // Sembunyikan lectureUrl untuk lecture non-preview
        courseData.courseContent?.forEach(chapter => {
            chapter.chapterContent?.forEach(lecture => {
                if (!lecture.isPreviewFree) {
                    lecture.lectureUrl = '';
                }
            })
        })

        res.json({ success: true, courseData })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get Peserta (praja) sebuah course — nama dari koleksi Keprajaan via npp
export const getCoursePeserta = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).select(
      "enrolledStudents",
    );
    if (!course)
      return res.json({ success: false, message: "Course tidak ditemukan" });

    // 1) User yang terdaftar — dari id_user di enrolledStudents
    const users = await User.find(
      { _id: { $in: course.enrolledStudents } },
      "name imageUrl npp",
    ).lean();

    // 2) Peta nama dari Keprajaan, dikunci dengan NPP ter-normalisasi
    const allKeprajaan = await Keprajaan.find({}, "npp nama").lean();
    const namaByNpp = {};
    allKeprajaan.forEach((k) => {
      namaByNpp[nppKey(k.npp)] = k.nama;
    });

    // 3) Gabungkan: nama dari Keprajaan, fallback ke User.name
    const peserta = users
      .map((u) => ({
        _id: u._id,
        npp: u.npp,
        name: namaByNpp[nppKey(u.npp)] || u.name || "(Tanpa nama)",
        imageUrl: u.imageUrl,
      }))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    res.json({ success: true, peserta });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
