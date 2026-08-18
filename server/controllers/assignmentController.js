import fs from "node:fs/promises";

import { getAuth } from "@clerk/express";
import { v2 as cloudinary } from "cloudinary";

import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import Course from "../models/Course.js";
import User from "../models/User.js";

// ==========================================
// HELPER: HAPUS FILE TEMPORARY MULTER
// ==========================================

const cleanupTempFile = async (filePath) => {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (error) {
    // File temporary mungkin sudah terhapus.
    if (error?.code !== "ENOENT") {
      console.error(
        "Gagal menghapus file temporary:",
        error.message,
      );
    }
  }
};

// ==========================================
// CREATE TUGAS DOSEN
// ==========================================

export const createAssignment = async (
  req,
  res,
) => {
  try {
    const educatorNip =
      req.educator?.nip;

    if (!educatorNip) {
      await cleanupTempFile(
        req.file?.path,
      );

      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      courseId,
      pertemuan,
      title,
      description,
      deadline,
    } = req.body || {};

    if (!courseId) {
      await cleanupTempFile(
        req.file?.path,
      );

      return res.status(400).json({
        success: false,
        message:
          "Mata kuliah wajib dipilih",
      });
    }

    if (!pertemuan) {
      await cleanupTempFile(
        req.file?.path,
      );

      return res.status(400).json({
        success: false,
        message:
          "Pertemuan wajib dipilih",
      });
    }

    if (!title?.trim()) {
      await cleanupTempFile(
        req.file?.path,
      );

      return res.status(400).json({
        success: false,
        message:
          "Judul tugas wajib diisi",
      });
    }

    // Pastikan course milik dosen.
    const course =
      await Course.findOne({
        _id: courseId,
        educator: educatorNip,
      }).lean();

    if (!course) {
      await cleanupTempFile(
        req.file?.path,
      );

      return res.status(403).json({
        success: false,
        message:
          "Mata kuliah tidak ditemukan atau bukan milik dosen ini",
      });
    }

    let attachmentUrl = "";
    let attachmentName = "";
    let attachmentType = "";

    // ==========================================
    // UPLOAD LAMPIRAN TUGAS DOSEN
    // ==========================================

    if (req.file) {
      const uploadResult =
        await cloudinary.uploader.upload(
          req.file.path,
          {
            resource_type: "auto",
            folder: "assignments",
            use_filename: true,
            unique_filename: true,
          },
        );

      attachmentUrl =
        uploadResult.secure_url;

      attachmentName =
        req.file.originalname;

      attachmentType =
        req.file.mimetype;

      await cleanupTempFile(
        req.file.path,
      );
    }

    // ==========================================
    // SIMPAN TUGAS
    // ==========================================

    const assignment =
      await Assignment.create({
        courseId,
        educatorNip,

        pertemuan:
          Number(pertemuan),

        title:
          title.trim(),

        description:
          description?.trim() || "",

        deadline:
          deadline || null,

        attachmentUrl,
        attachmentName,
        attachmentType,
      });

    return res.status(201).json({
      success: true,
      message:
        "Tugas berhasil dibuat",
      assignment,
    });
  } catch (error) {
    await cleanupTempFile(
      req.file?.path,
    );

    console.error(
      "Create Assignment Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Gagal membuat tugas",
    });
  }
};

// ==========================================
// LIST TUGAS UNTUK DOSEN
// ==========================================

export const getEducatorAssignments =
  async (req, res) => {
    try {
      const educatorNip =
        req.educator?.nip;

      if (!educatorNip) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { courseId } =
        req.params;

      const assignments =
        await Assignment.find({
          courseId,
          educatorNip,
        })
          .sort({
            pertemuan: 1,
            createdAt: -1,
          })
          .lean();

      return res.json({
        success: true,
        assignments,
      });
    } catch (error) {
      console.error(
        "Get Educator Assignments Error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Gagal mengambil data tugas",
      });
    }
  };

// ==========================================
// LIST TUGAS UNTUK PRAJA
// + STATUS SUBMISSION PRAJA
// ==========================================

export const getCourseAssignments =
  async (req, res) => {
    try {
      const { userId } =
        getAuth(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { courseId } =
        req.params;

      // ========================================
      // CEK USER
      // ========================================

      const user =
        await User.findById(
          userId,
        ).lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Data pengguna tidak ditemukan",
        });
      }

      // ========================================
      // CEK PRAJA TERDAFTAR
      // ========================================

      const enrolled =
        (
          user.enrolledCourses || []
        ).some(
          (id) =>
            String(id) ===
            String(courseId),
        );

      if (!enrolled) {
        return res.status(403).json({
          success: false,
          message:
            "Anda tidak terdaftar pada mata kuliah ini",
        });
      }

      // ========================================
      // AMBIL SELURUH TUGAS
      // ========================================

      const assignments =
        await Assignment.find({
          courseId,
          isPublished: true,
        })
          .sort({
            pertemuan: 1,
            createdAt: -1,
          })
          .select(
            "courseId pertemuan title description deadline attachmentUrl attachmentName attachmentType createdAt",
          )
          .lean();

      // ========================================
      // AMBIL ID SELURUH TUGAS
      // ========================================

      const assignmentIds =
        assignments.map(
          (assignment) =>
            assignment._id,
        );

      // ========================================
      // AMBIL SUBMISSION PRAJA
      // ========================================

      const submissions =
        assignmentIds.length
          ? await AssignmentSubmission.find(
              {
                assignmentId: {
                  $in: assignmentIds,
                },

                userId,
              },
            )
              .select(
                "assignmentId fileName fileUrl fileType submittedAt",
              )
              .lean()
          : [];

      // ========================================
      // BUAT MAP SUBMISSION
      // ========================================

      const submissionMap =
        new Map(
          submissions.map(
            (submission) => [
              String(
                submission.assignmentId,
              ),
              submission,
            ],
          ),
        );

      // ========================================
      // GABUNGKAN TUGAS + SUBMISSION
      // ========================================

      const data =
        assignments.map(
          (assignment) => {
            const submission =
              submissionMap.get(
                String(
                  assignment._id,
                ),
              );

            return {
              ...assignment,

              submitted:
                Boolean(submission),

              submission:
                submission
                  ? {
                      _id:
                        submission._id,

                      fileName:
                        submission.fileName,

                      fileUrl:
                        submission.fileUrl,

                      fileType:
                        submission.fileType,

                      submittedAt:
                        submission.submittedAt,
                    }
                  : null,
            };
          },
        );

      return res.json({
        success: true,
        assignments: data,
      });
    } catch (error) {
      console.error(
        "Get Course Assignments Error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Gagal mengambil tugas",
      });
    }
  };

// ==========================================
// PRAJA: UPLOAD / GANTI JAWABAN TUGAS
// ==========================================

export const submitAssignment =
  async (req, res) => {
    try {
      const { userId } =
        getAuth(req);

      if (!userId) {
        await cleanupTempFile(
          req.file?.path,
        );

        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // ========================================
      // CEK FILE
      // ========================================

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "File jawaban tugas wajib dipilih",
        });
      }

      // ========================================
      // CARI TUGAS
      // ========================================

      const assignment =
        await Assignment.findById(
          req.params.assignmentId,
        ).lean();

      if (!assignment) {
        await cleanupTempFile(
          req.file.path,
        );

        return res.status(404).json({
          success: false,
          message:
            "Tugas tidak ditemukan",
        });
      }

      if (
        !assignment.isPublished
      ) {
        await cleanupTempFile(
          req.file.path,
        );

        return res.status(403).json({
          success: false,
          message:
            "Tugas belum tersedia",
        });
      }

      // ========================================
      // CEK DEADLINE
      // ========================================

      if (
        assignment.deadline
      ) {
        const deadline =
          new Date(
            assignment.deadline,
          );

        if (
          !Number.isNaN(
            deadline.getTime(),
          ) &&
          new Date() >
            deadline
        ) {
          await cleanupTempFile(
            req.file.path,
          );

          return res
            .status(403)
            .json({
              success: false,

              code:
                "ASSIGNMENT_CLOSED",

              message:
                "Batas waktu pengumpulan tugas telah berakhir",
            });
        }
      }

      // ========================================
      // CEK USER
      // ========================================

      const user =
        await User.findById(
          userId,
        ).lean();

      if (!user) {
        await cleanupTempFile(
          req.file.path,
        );

        return res.status(404).json({
          success: false,
          message:
            "Data praja tidak ditemukan",
        });
      }

      if (!user.npp) {
        await cleanupTempFile(
          req.file.path,
        );

        return res.status(400).json({
          success: false,
          message:
            "NPP praja tidak ditemukan",
        });
      }

      // ========================================
      // CEK PRAJA TERDAFTAR DI COURSE
      // ========================================

      const enrolled =
        (
          user.enrolledCourses || []
        ).some(
          (courseId) =>
            String(courseId) ===
            String(
              assignment.courseId,
            ),
        );

      if (!enrolled) {
        await cleanupTempFile(
          req.file.path,
        );

        return res.status(403).json({
          success: false,
          message:
            "Anda tidak terdaftar pada mata kuliah ini",
        });
      }

      // ========================================
      // CEK SUBMISSION LAMA
      // ========================================

      const existingSubmission =
        await AssignmentSubmission.findOne(
          {
            assignmentId:
              assignment._id,

            userId,
          },
        );

      // ========================================
      // UPLOAD FILE KE CLOUDINARY
      // ========================================

      const uploadResult =
        await cloudinary.uploader.upload(
          req.file.path,
          {
            resource_type: "auto",

            folder:
              `assignment-submissions/${assignment.courseId}/${assignment._id}`,

            use_filename: true,

            unique_filename: true,
          },
        );

      // File temporary multer sudah
      // tidak dibutuhkan.
      await cleanupTempFile(
        req.file.path,
      );

      // ========================================
      // HAPUS FILE SUBMISSION LAMA
      // ========================================

      if (
        existingSubmission
          ?.filePublicId &&
        existingSubmission
          .filePublicId !==
          uploadResult.public_id
      ) {
        try {
          await cloudinary.uploader.destroy(
            existingSubmission.filePublicId,
            {
              resource_type:
                existingSubmission
                  .cloudinaryResourceType ||
                "raw",
            },
          );
        } catch (error) {
          console.error(
            "Gagal menghapus file submission lama:",
            error.message,
          );
        }
      }

      let submission;

      // ========================================
      // UPDATE SUBMISSION
      // ========================================

      if (existingSubmission) {
        existingSubmission.courseId =
          assignment.courseId;

        existingSubmission.npp =
          user.npp;

        existingSubmission.fileUrl =
          uploadResult.secure_url;

        existingSubmission.fileName =
          req.file.originalname;

        existingSubmission.fileType =
          req.file.mimetype;

        existingSubmission.filePublicId =
          uploadResult.public_id;

        existingSubmission.cloudinaryResourceType =
          uploadResult.resource_type;

        existingSubmission.submittedAt =
          new Date();

        submission =
          await existingSubmission.save();
      }

      // ========================================
      // BUAT SUBMISSION BARU
      // ========================================

      else {
        submission =
          await AssignmentSubmission.create(
            {
              assignmentId:
                assignment._id,

              courseId:
                assignment.courseId,

              userId,

              npp:
                user.npp,

              fileUrl:
                uploadResult.secure_url,

              fileName:
                req.file.originalname,

              fileType:
                req.file.mimetype,

              filePublicId:
                uploadResult.public_id,

              cloudinaryResourceType:
                uploadResult.resource_type,

              submittedAt:
                new Date(),
            },
          );
      }

      // ========================================
      // RESPONSE
      // ========================================

      return res
        .status(
          existingSubmission
            ? 200
            : 201,
        )
        .json({
          success: true,

          message:
            existingSubmission
              ? "File tugas berhasil diperbarui"
              : "Tugas berhasil dikumpulkan",

          submission: {
            _id:
              submission._id,

            assignmentId:
              submission.assignmentId,

            fileName:
              submission.fileName,

            fileUrl:
              submission.fileUrl,

            fileType:
              submission.fileType,

            submittedAt:
              submission.submittedAt,
          },
        });
    } catch (error) {
      await cleanupTempFile(
        req.file?.path,
      );

      console.error(
        "Submit Assignment Error:",
        error,
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Gagal mengumpulkan tugas",
      });
    }
  };

// ==========================================
// DOSEN: LIHAT SUBMISSION PRAJA
// ==========================================

export const getAssignmentSubmissions =
  async (req, res) => {
    try {
      const educatorNip =
        req.educator?.nip;

      if (!educatorNip) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const assignment =
        await Assignment.findById(
          req.params.assignmentId,
        ).lean();

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message:
            "Tugas tidak ditemukan",
        });
      }

      // ========================================
      // CARI COURSE
      // ========================================

      const course =
        await Course.findById(
          assignment.courseId,
        ).lean();

      if (!course) {
        return res.status(404).json({
          success: false,
          message:
            "Mata kuliah tidak ditemukan",
        });
      }

const educatorList = Array.isArray(
  course.educator,
)
  ? course.educator
  : course.educator
    ? [course.educator]
    : [];

const isEducator =
  educatorList.some(
    (nip) =>
      String(nip) ===
      String(educatorNip),
  );

if (!isEducator) {
  return res.status(403).json({
    success: false,
    message:
      "Anda tidak memiliki akses ke tugas ini",
  });
}
      // ========================================
      // AMBIL SUBMISSION
      // ========================================

      const submissions =
        await AssignmentSubmission.find(
          {
            assignmentId:
              assignment._id,
          },
        )
          .populate(
            "userId",
            "name npp imageUrl",
          )
          .sort({
            submittedAt: -1,
          })
          .lean();

      // ========================================
      // FORMAT DATA
      // ========================================

      const data =
        submissions.map(
          (submission) => ({
            _id:
              submission._id,

            userId:
              submission.userId
                ?._id ||
              submission.userId,

            name:
              submission.userId
                ?.name ||
              "Praja",

            npp:
              submission.npp ||
              submission.userId
                ?.npp ||
              "",

            imageUrl:
              submission.userId
                ?.imageUrl ||
              "",

            fileName:
              submission.fileName,

            fileUrl:
              submission.fileUrl,

            fileType:
              submission.fileType,

            submittedAt:
              submission.submittedAt,

            onTime:
              !assignment.deadline ||
              new Date(
                submission.submittedAt,
              ) <=
                new Date(
                  assignment.deadline,
                ),
          }),
        );

      // ========================================
      // RESPONSE
      // ========================================

      return res.json({
        success: true,

        assignment: {
          _id:
            assignment._id,

          title:
            assignment.title,

          pertemuan:
            assignment.pertemuan,

          deadline:
            assignment.deadline,
        },

        count:
          data.length,

        submissions:
          data,
      });
    } catch (error) {
      console.error(
        "Get Assignment Submissions Error:",
        error,
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Gagal mengambil pengumpulan tugas",
      });
    }
  };

// ==========================================
// DELETE TUGAS
// ==========================================

export const deleteAssignment =
  async (req, res) => {
    try {
      const educatorNip =
        req.educator?.nip;

      if (!educatorNip) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const assignment =
        await Assignment.findOne({
          _id:
            req.params
              .assignmentId,

          educatorNip,
        });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message:
            "Tugas tidak ditemukan",
        });
      }

      // ========================================
      // AMBIL SUBMISSION TERKAIT
      // ========================================

      const submissions =
        await AssignmentSubmission.find(
          {
            assignmentId:
              assignment._id,
          },
        );

      // ========================================
      // HAPUS FILE SUBMISSION DARI CLOUDINARY
      // ========================================

      for (
        const submission
        of submissions
      ) {
        if (
          submission.filePublicId
        ) {
          try {
            await cloudinary.uploader.destroy(
              submission.filePublicId,
              {
                resource_type:
                  submission
                    .cloudinaryResourceType ||
                  "raw",
              },
            );
          } catch (error) {
            console.error(
              "Gagal menghapus file submission:",
              error.message,
            );
          }
        }
      }

      // ========================================
      // HAPUS DATA SUBMISSION
      // ========================================

      await AssignmentSubmission.deleteMany(
        {
          assignmentId:
            assignment._id,
        },
      );

      // ========================================
      // HAPUS TUGAS
      // ========================================

      await assignment.deleteOne();

      return res.json({
        success: true,
        message:
          "Tugas berhasil dihapus",
      });
    } catch (error) {
      console.error(
        "Delete Assignment Error:",
        error,
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Gagal menghapus tugas",
      });
    }
  };