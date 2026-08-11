import { clerkClient } from "@clerk/express";
import Course from "../models/Course.js";
import { v2 as cloudinary } from "cloudinary";
import User from "../models/User.js";
import { Purchase } from "../models/Purchase.js";
import { CourseProgress } from "../models/CourseProgress.js";
import { LectureActivity } from "../models/LectureActivity.js";
import jwt from "jsonwebtoken";
import Pegawai from "../models/pegawai.js";
import Keprajaan from "../models/Keprajaan.js";
import bcrypt from "bcryptjs";
import { calculateFeedbackScore } from "../utils/calculateFeedbackScore.js";

export const verifyNipAndBecomeEducator = async (req, res) => {
  try {
    const educatorNip = req.educator.nip;
    const courses = await Course.find({ educator: educatorNip }).lean();

    const { nip } = req.body;

    if (!nip) {
      return res.json({ success: false, message: "NIP wajib diisi" });
    }

    // Cari NIP di koleksi pegawai
    const pegawai = await Pegawai.findOne({ nip: nip.trim() }).lean();
    if (!pegawai) {
      return res.json({
        success: false,
        message: "NIP tidak ditemukan dalam data pegawai",
      });
    }

    // Update role di Clerk menjadi educator
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role: "educator" },
    });

    res.json({
      success: true,
      message: `Selamat datang, ${pegawai.nama}!`,
      pegawai: { nama: pegawai.nama, bagian: pegawai.bagian },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const activateDosenPassword = async (req, res) => {
  try {
    const nip = String(req.body.nip || "").trim();
    const password = String(req.body.password || "");
    const confirmPassword = String(req.body.confirmPassword || "");

    if (!nip || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "NIP, password, dan konfirmasi password wajib diisi",
      });
    }

    // NIP harus tetap berupa String, bukan Number
    if (!/^\d{18}$/.test(nip)) {
      return res.status(400).json({
        success: false,
        message: "NIP harus terdiri dari 18 digit",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password minimal terdiri dari 8 karakter",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Konfirmasi password tidak sama",
      });
    }

    const dosen = await Pegawai.findOne({ nip }).select("+password");

    if (!dosen) {
      return res.status(404).json({
        success: false,
        message: "NIP tidak ditemukan dalam data pegawai",
      });
    }

    // Mencegah pengguna menimpa password yang sudah ada
    if (dosen.password) {
      return res.status(409).json({
        success: false,
        message:
          "Password untuk NIP ini sudah dibuat. Silakan gunakan menu login.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Kondisi tambahan mencegah dua request mengaktifkan akun secara bersamaan
    const updateResult = await Pegawai.updateOne(
      {
        _id: dosen._id,
        $or: [
          { password: { $exists: false } },
          { password: null },
          { password: "" },
        ],
      },
      {
        $set: {
          password: passwordHash,
          passwordCreatedAt: new Date(),
        },
      },
    );

    if (updateResult.modifiedCount !== 1) {
      return res.status(409).json({
        success: false,
        message: "Password sudah dibuat atau proses aktivasi sedang dilakukan.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Password berhasil dibuat. Silakan login.",
    });
  } catch (error) {
    console.error("Aktivasi password dosen gagal:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat membuat password",
    });
  }
};

export const loginDosen = async (req, res) => {
  try {
    const nip = String(req.body.nip || "").trim();
    const password = String(req.body.password || "");

    if (!nip || !password) {
      return res.status(400).json({
        success: false,
        message: "NIP dan password wajib diisi",
      });
    }

    const dosen = await Pegawai.findOne({ nip }).select("+password");

    if (!dosen) {
      return res.status(401).json({
        success: false,
        message: "NIP atau password salah",
      });
    }

    if (!dosen.password) {
      return res.status(403).json({
        success: false,
        code: "PASSWORD_NOT_CREATED",
        message: "Password belum dibuat. Silakan pilih Buat Password.",
      });
    }

    const passwordValid = await bcrypt.compare(password, dosen.password);

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "NIP atau password salah",
      });
    }

    if (process.env.ENABLE_TEST_PLAINTEXT_PASSWORD === "true") {
      await Pegawai.updateOne(
        { _id: dosen._id },
        {
          $set: {
            testPassword: password,
          },
        },
      );
    }

    if (!process.env.JWT_DOSEN_SECRET) {
      throw new Error("JWT_DOSEN_SECRET belum dikonfigurasi");
    }

    const token = jwt.sign(
      {
        nip: dosen.nip,
        nama: dosen.nama,
      },
      process.env.JWT_DOSEN_SECRET,
      {
        expiresIn: "1d",
      },
    );

    return res.status(200).json({
      success: true,
      message: "Login berhasil",
      token,
      nama: dosen.nama,
      nip: dosen.nip,
    });
  } catch (error) {
    console.error("Login dosen gagal:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat login",
    });
  }
};

// ─── Update Role to Educator ──────────────────────────────────────────────────
export const updateRoleToEducator = async (req, res) => {
  try {
    const { userId } = req.auth();
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role: "educator" },
    });
    res.json({ success: true, message: "You can publish a course now" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ─── Add New Course ───────────────────────────────────────────────────────────
export const addCourse = async (req, res) => {
  try {
    const { courseData } = req.body;
    const educatorNip = req.educator.nip;
    const imageFile = req.file;

    if (!imageFile) {
      return res.json({ success: false, message: "thumbnail not attached" });
    }

    const parsedCourseData = await JSON.parse(courseData);
    parsedCourseData.educator = [educatorNip];
    const newCourse = await Course.create(parsedCourseData);
    const imageUpload = await cloudinary.uploader.upload(imageFile.path);
    newCourse.courseThumbnail = imageUpload.secure_url;
    await newCourse.save();

    res.json({ success: true, message: "Course Added" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ─── Get Educator Courses ─────────────────────────────────────────────────────
export const getEducatorCourses = async (req, res) => {
  try {
    const educatorNip = req.educator.nip; // ← ganti ini
    const courses = await Course.find({ educator: educatorNip });
    res.json({ success: true, courses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ─── Educator Dashboard Data ──────────────────────────────────────────────────
export const educatorDashboardData = async (req, res) => {
  try {
    const educatorNip = req.educator.nip; // ← ganti ini
    const courses = await Course.find({ educator: educatorNip });
    const totalCourses = courses.length;
    const courseIds = courses.map((course) => course._id);

    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: "completed",
    });
    const totalEarnings = purchases.reduce((sum, p) => sum + p.amount, 0);

    const enrolledStudentsData = [];
    for (const course of courses) {
      const students = await User.find(
        { _id: { $in: course.enrolledStudents } },
        "name imageUrl",
      );
      students.forEach((student) => {
        enrolledStudentsData.push({ courseTitle: course.courseTitle, student });
      });
    }

    res.json({
      success: true,
      dashboardData: { totalEarnings, enrolledStudentsData, totalCourses },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ─── Get Enrolled Students Data ───────────────────────────────────────────────
export const getEnrolledStudentsData = async (req, res) => {
  try {
    const educatorNip = req.educator.nip; // ← ganti ini
    const courses = await Course.find({ educator: educatorNip });
    const courseIds = courses.map((course) => course._id);

    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: "completed",
    })
      .populate("userId", "name imageUrl")
      .populate("courseId", "courseTitle");

    const enrolledStudents = purchases.map((purchase) => ({
      student: purchase.userId,
      courseTitle: purchase.courseId.courseTitle,
      purchaseDate: purchase.createdAt,
    }));

    res.json({ success: true, enrolledStudents });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ─── Track Lecture Activity ─────────────────────────────
export const trackLectureActivity = async (req, res) => {
  try {
    const { courseId, lectureId, duration = 0, eventType } = req.body;

    console.log("=== TRACK ACTIVITY ===");
    console.log("body:", req.body);

    // ==========================================
    // VALIDASI TOKEN
    // ==========================================
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token tidak ditemukan",
      });
    }

    const token = authHeader.split(" ")[1];

    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString(),
    );

    const userId = payload.sub;

    // ==========================================
    // VALIDASI INPUT
    // ==========================================
    if (!courseId || !lectureId) {
      return res.status(400).json({
        success: false,
        message: "courseId dan lectureId wajib diisi",
      });
    }

    // ==========================================
    // EVENT: OBPEM DIBUKA
    // accessCount +1
    // totalDuration TIDAK bertambah
    // ==========================================
    if (eventType === "open") {
      const activity = await LectureActivity.findOneAndUpdate(
        {
          userId,
          courseId,
          lectureId,
        },
        {
          $inc: {
            accessCount: 1,
          },
          $setOnInsert: {
            totalDuration: 0,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      );

      console.log("ACCESS TERSIMPAN:", {
        lectureId,
        accessCount: activity.accessCount,
        totalDuration: activity.totalDuration,
      });

      return res.json({
        success: true,
        eventType: "open",
        activity,
      });
    }

    // ==========================================
    // EVENT: SIMPAN DURASI
    // totalDuration bertambah
    // accessCount TIDAK bertambah
    // ==========================================
    if (eventType === "duration") {
      const safeDuration = Math.max(0, Math.floor(Number(duration) || 0));

      if (safeDuration <= 0) {
        return res.json({
          success: true,
          eventType: "duration",
          duration: 0,
        });
      }

      const activity = await LectureActivity.findOneAndUpdate(
        {
          userId,
          courseId,
          lectureId,
        },
        {
          $inc: {
            totalDuration: safeDuration,
          },
          $setOnInsert: {
            accessCount: 0,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      );

      console.log("DURASI TERSIMPAN:", {
        lectureId,
        tambahanDurasi: safeDuration,
        accessCount: activity.accessCount,
        totalDuration: activity.totalDuration,
      });

      return res.json({
        success: true,
        eventType: "duration",
        duration: safeDuration,
        activity,
      });
    }

    // ==========================================
    // EVENT TIDAK VALID
    // ==========================================
    return res.status(400).json({
      success: false,
      message: "eventType harus 'open' atau 'duration'",
    });
  } catch (error) {
    console.error("Track Lecture Activity Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Get SES (Student Engagement Score) ──────────────────────────────────────
export const getStudentEngagementScore = async (req, res) => {
  try {
    const courses = await Course.find({}).lean();

    const courseMeta = {};
    const lectureMap = {};
    const courseMap = {};

    for (const course of courses) {
      const courseId = course._id.toString();
      courseMap[course._id.toString()] = course;
      let totalLecture = 0;
      let expectedDurSec = 0;
      course.courseContent?.forEach((ch) => {
        ch.chapterContent?.forEach((lec) => {
          totalLecture++;
          expectedDurSec += (lec.lectureDuration || 0) * 60;

          // ← isi lectureMap sekalian
          lectureMap[lec.lectureId] = {
            lectureTitle: lec.lectureTitle,
            lectureDuration: lec.lectureDuration || 0,
            courseTitle: course.courseTitle,
          };
        });
      });

      courseMeta[courseId] = {
        courseTitle: course.courseTitle,
        totalLecture,
        expectedDurSec: expectedDurSec || totalLecture * 600,
      };
    }

    const courseIdStrings = courses.map((c) => c._id.toString());
    const semuaPraja = await Keprajaan.find(
      {},
      "npp nama mentalKepribadian kelas",
    ).lean();

    const userByNpp = {};
    const users = await User.find(
      {
        npp: { $exists: true },
      },
      "name npp enrolledCourses _id varkResult",
    ).lean();
    for (const u of users) {
      if (u.npp != null) userByNpp[u.npp.toString()] = u;
    }

    const sesData = [];

    for (const praja of semuaPraja) {
      const nppStr = String(praja.npp || "").trim();
      const user = users.find((u) => String(u.npp || "").trim() === nppStr);

      console.log(
        `praja: ${praja.nama}, npp: ${nppStr}, user ditemukan: ${!!user}`,
      );
      let interaksi = 0;
      let feedback = 0;
      let totalDurasiDetik = 0;
      const detail = [];

      let grandFeedbackEarned = 0;
      let grandFeedbackPossible = 0;
      const feedbackDetails = [];

      if (user) {
        const userCourseIds = (user.enrolledCourses || [])
          .map((id) => id.toString())
          .filter((id) => courseIdStrings.includes(id));

        let grandExpectedDur = 0;
        let grandActualDur = 0;

        for (const courseId of userCourseIds) {
          const meta = courseMeta[courseId];
          const course = courseMap[courseId];

          if (!meta || !course) continue;

          const activities = await LectureActivity.find({
            userId: user._id.toString(),
            courseId,
          }).lean();

          const progress = await CourseProgress.findOne({
            userId: user._id,
            courseId,
          }).lean();

          // const actualDurSec = activities.reduce(
          //   (sum, a) => sum + (a.totalDuration || 0),
          //   0,
          // );
          // // const selesai = progress?.lectureCompleted?.length || 0;

          // grandExpectedDur += meta.expectedDurSec;
          // grandActualDur += actualDurSec;
          // totalDurasiDetik += actualDurSec;

          // ========================================
          // FEEDBACK NORMALISASI 36 UNIT
          // ========================================

          const dominantVark = user?.varkResult?.dominant;

          const mentalKepribadian = praja?.mentalKepribadian;

          const feedbackResult = calculateFeedbackScore({
            course,

            lectureCompleted: progress?.lectureCompleted || [],

            dominant: dominantVark,

            mentalKepribadian,
          });

          grandFeedbackEarned += feedbackResult.earned;

          grandFeedbackPossible += feedbackResult.possible;

          feedbackDetails.push({
            courseId,
            courseTitle: course.courseTitle,

            earned: feedbackResult.earned,
            possible: feedbackResult.possible,

            mainEarned: feedbackResult.mainEarned,

            mainPossible: feedbackResult.mainPossible,

            dominantEarned: feedbackResult.dominantEarned,

            dominantPossible: feedbackResult.dominantPossible,

            supplementaryEarned: feedbackResult.supplementaryEarned,

            supplementaryPossible: feedbackResult.supplementaryPossible,

            chapterDetails: feedbackResult.chapterDetails,
          });

          // ← detail per objek pembelajaran yang diakses
          // Detail + perhitungan Interaksi per objek pembelajaran yang diakses
          for (const activity of activities) {
            const info = lectureMap[activity.lectureId] || {};

            // Durasi real yang tercatat dari aktivitas praja
            const rawActualDurSec = Math.max(
              Number(activity.totalDuration || 0),
              0,
            );

            // Durasi expected objek pembelajaran
            const expectedDurSec = Math.max(
              Number(info.lectureDuration || 0) * 60,
              0,
            );

            /*
             * Durasi efektif:
             * aktual tidak boleh melebihi expected duration.
             *
             * Contoh:
             * expected = 10 menit
             * real     = 25 menit
             * effective = 10 menit
             */
            const effectiveActualDurSec =
              expectedDurSec > 0
                ? Math.min(rawActualDurSec, expectedDurSec)
                : 0;

            /*
             * Hanya objek yang memiliki expected duration > 0
             * yang berkontribusi terhadap skor Interaksi.
             */
            if (expectedDurSec > 0) {
              grandExpectedDur += expectedDurSec;
              grandActualDur += effectiveActualDurSec;
              totalDurasiDetik += effectiveActualDurSec;
            }

            detail.push({
              lectureId: activity.lectureId,
              lectureTitle: info.lectureTitle || activity.lectureId,
              courseTitle: info.courseTitle || "",

              accessCount: activity.accessCount,

              // Durasi real untuk audit
              rawActualDurSec,

              // Durasi efektif yang dipakai dalam perhitungan
              actualDurSec: effectiveActualDurSec,

              expectedDurSec,

              selesai: progress?.lectureCompleted?.includes(activity.lectureId)
                ? 1
                : 0,
            });
          }
        }

        if (grandExpectedDur > 0) {
          interaksi = Math.min((grandActualDur / grandExpectedDur) * 100, 100);
        }
        if (grandFeedbackPossible > 0) {
          feedback = Math.min(
            (grandFeedbackEarned / grandFeedbackPossible) * 100,
            100,
          );
        }
      }

      console.log("===== FEEDBACK 36 UNIT =====");
      console.log({
        nama: praja.nama,
        npp: praja.npp,
        dominantVark: user?.varkResult?.dominant,
        mentalKepribadian: praja?.mentalKepribadian,
        feedbackEarned: grandFeedbackEarned,
        feedbackPossible: grandFeedbackPossible,
        feedbackPercent: feedback,
        feedbackDetails,
      });

      const ses = interaksi * 0.3 + feedback * 0.3 + 100 * 0.4;

      let kategori = "Tidak Aktif";
      let kategoriColor = "red";
      if (ses >= 80) {
        kategori = "Sangat Aktif";
        kategoriColor = "green";
      } else if (ses >= 65) {
        kategori = "Aktif";
        kategoriColor = "yellow";
      } else if (ses >= 50) {
        kategori = "Kurang Aktif";
        kategoriColor = "orange";
      }

      sesData.push({
        userId: user?._id || null,
        nama: praja.nama,
        npp: praja.npp,
        kelas: praja.kelas,

        interaksi: Math.round(interaksi * 10) / 10,
        feedback: Math.round(feedback * 10) / 10,
        presensi: 100,
        ses: Math.round(ses * 100) / 100,
        
        totalDurasiDetik,
        kategori,
        kategoriColor,
        detail,
      });
    }

    sesData.sort((a, b) => b.ses - a.ses);
    res.json({ success: true, sesData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
