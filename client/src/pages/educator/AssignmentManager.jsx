import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import axios from "axios";
import { toast } from "react-toastify";

import { AppContext } from "../../context/AppContext";

// ======================================================
// HELPER FORMAT TANGGAL
// ======================================================

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ======================================================
// ASSIGNMENT MANAGER
// ======================================================

const AssignmentManager = () => {
  const { backendUrl } =
    useContext(AppContext);

  const token =
    localStorage.getItem(
      "dosenToken",
    );

  // ====================================================
  // COURSE
  // ====================================================

  const [
    courses,
    setCourses,
  ] = useState([]);

  const [
    selectedCourseId,
    setSelectedCourseId,
  ] = useState("");

  // ====================================================
  // FORM TUGAS
  // ====================================================

  const [
    pertemuan,
    setPertemuan,
  ] = useState(3);

  const [
    title,
    setTitle,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    deadline,
    setDeadline,
  ] = useState("");

  const [
    file,
    setFile,
  ] = useState(null);

  // Untuk reset input file setelah submit.
  const [
    fileInputKey,
    setFileInputKey,
  ] = useState(0);

  // ====================================================
  // ASSIGNMENTS
  // ====================================================

  const [
    assignments,
    setAssignments,
  ] = useState([]);

  const [
    loadingAssignments,
    setLoadingAssignments,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    deletingAssignmentId,
    setDeletingAssignmentId,
  ] = useState(null);

  // ====================================================
  // SUBMISSION PRAJA
  // ====================================================

  const [
    selectedAssignment,
    setSelectedAssignment,
  ] = useState(null);

  const [
    submissions,
    setSubmissions,
  ] = useState([]);

  const [
    loadingSubmissions,
    setLoadingSubmissions,
  ] = useState(false);

  // ====================================================
  // FETCH COURSE
  // ====================================================

  const fetchCourses =
    useCallback(async () => {
      if (!backendUrl) {
        return;
      }

      if (!token) {
        toast.error(
          "Sesi dosen tidak ditemukan. Silakan login kembali.",
        );

        return;
      }

      try {
        const { data } =
          await axios.get(
            `${backendUrl}/api/educator/courses`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        if (!data.success) {
          toast.error(
            data.message ||
              "Gagal mengambil mata kuliah",
          );

          return;
        }

        const list =
          Array.isArray(
            data.courses,
          )
            ? data.courses
            : [];

        setCourses(list);

        if (
          list.length > 0 &&
          !selectedCourseId
        ) {
          setSelectedCourseId(
            list[0]._id,
          );
        }
      } catch (error) {
        console.error(
          "Fetch courses error:",
          error,
        );

        toast.error(
          error.response?.data
            ?.message ||
            "Gagal mengambil mata kuliah",
        );
      }
    }, [
      backendUrl,
      token,
      selectedCourseId,
    ]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // ====================================================
  // FETCH TUGAS
  // ====================================================

  const fetchAssignments =
    useCallback(async () => {
      if (
        !selectedCourseId ||
        !backendUrl ||
        !token
      ) {
        setAssignments([]);
        return;
      }

      try {
        setLoadingAssignments(
          true,
        );

        const { data } =
          await axios.get(
            `${backendUrl}/api/assignment/educator/${selectedCourseId}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        if (data.success) {
          setAssignments(
            Array.isArray(
              data.assignments,
            )
              ? data.assignments
              : [],
          );

          return;
        }

        setAssignments([]);

        toast.error(
          data.message ||
            "Gagal mengambil tugas",
        );
      } catch (error) {
        console.error(
          "Fetch assignments error:",
          error,
        );

        setAssignments([]);

        toast.error(
          error.response?.data
            ?.message ||
            "Gagal mengambil tugas",
        );
      } finally {
        setLoadingAssignments(
          false,
        );
      }
    }, [
      backendUrl,
      selectedCourseId,
      token,
    ]);

  useEffect(() => {
    fetchAssignments();

    // Tutup detail submission jika
    // dosen berpindah mata kuliah.
    setSelectedAssignment(null);
    setSubmissions([]);
  }, [fetchAssignments]);

  // ====================================================
  // CREATE TUGAS
  // ====================================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (!selectedCourseId) {
        toast.error(
          "Pilih mata kuliah",
        );

        return;
      }

      if (!title.trim()) {
        toast.error(
          "Judul tugas wajib diisi",
        );

        return;
      }

      if (
        Number(pertemuan) < 1
      ) {
        toast.error(
          "Pertemuan tidak valid",
        );

        return;
      }

      try {
        setSubmitting(true);

        const formData =
          new FormData();

        formData.append(
          "courseId",
          selectedCourseId,
        );

        formData.append(
          "pertemuan",
          pertemuan,
        );

        formData.append(
          "title",
          title.trim(),
        );

        formData.append(
          "description",
          description.trim(),
        );

        if (deadline) {
          formData.append(
            "deadline",
            deadline,
          );
        }

        if (file) {
          formData.append(
            "file",
            file,
          );
        }

        const { data } =
          await axios.post(
            `${backendUrl}/api/assignment`,
            formData,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        if (!data.success) {
          toast.error(
            data.message ||
              "Gagal membuat tugas",
          );

          return;
        }

        toast.success(
          data.message ||
            "Tugas berhasil dibuat",
        );

        // Reset form
        setTitle("");
        setDescription("");
        setDeadline("");
        setFile(null);

        setFileInputKey(
          (previous) =>
            previous + 1,
        );

        await fetchAssignments();
      } catch (error) {
        console.error(
          "Create assignment error:",
          error,
        );

        toast.error(
          error.response?.data
            ?.message ||
            "Gagal membuat tugas",
        );
      } finally {
        setSubmitting(false);
      }
    };

  // ====================================================
  // DELETE TUGAS
  // ====================================================

  const handleDelete =
    async (
      assignmentId,
    ) => {
      const confirmed =
        window.confirm(
          "Hapus tugas ini? Seluruh pengumpulan praja pada tugas ini juga akan dihapus.",
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingAssignmentId(
          assignmentId,
        );

        const { data } =
          await axios.delete(
            `${backendUrl}/api/assignment/${assignmentId}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        if (!data.success) {
          toast.error(
            data.message ||
              "Gagal menghapus tugas",
          );

          return;
        }

        toast.success(
          data.message ||
            "Tugas berhasil dihapus",
        );

        // Jika tugas yang sedang
        // dibuka adalah tugas yang
        // dihapus, tutup panel.
        if (
          String(
            selectedAssignment?._id,
          ) ===
          String(assignmentId)
        ) {
          setSelectedAssignment(
            null,
          );

          setSubmissions([]);
        }

        await fetchAssignments();
      } catch (error) {
        console.error(
          "Delete assignment error:",
          error,
        );

        toast.error(
          error.response?.data
            ?.message ||
            "Gagal menghapus tugas",
        );
      } finally {
        setDeletingAssignmentId(
          null,
        );
      }
    };

  // ====================================================
  // DOSEN: AMBIL SUBMISSION PRAJA
  // ====================================================

  const loadSubmissions =
    async (assignment) => {
      if (
        !assignment?._id
      ) {
        return;
      }

      try {
        setSelectedAssignment(
          assignment,
        );

        setLoadingSubmissions(
          true,
        );

        setSubmissions([]);

        const { data } =
          await axios.get(
            `${backendUrl}/api/assignment/${assignment._id}/submissions`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        if (!data.success) {
          toast.error(
            data.message ||
              "Gagal mengambil pengumpulan tugas",
          );

          return;
        }

        setSubmissions(
          Array.isArray(
            data.submissions,
          )
            ? data.submissions
            : [],
        );

        // Gunakan informasi assignment
        // terbaru dari backend bila ada.
        if (data.assignment) {
          setSelectedAssignment(
            (previous) => ({
              ...previous,
              ...data.assignment,
            }),
          );
        }
      } catch (error) {
        console.error(
          "Load submissions error:",
          error,
        );

        setSubmissions([]);

        toast.error(
          error.response?.data
            ?.message ||
            "Gagal mengambil pengumpulan tugas",
        );
      } finally {
        setLoadingSubmissions(
          false,
        );
      }
    };

  // ====================================================
  // TUTUP PANEL SUBMISSION
  // ====================================================

  const closeSubmissions =
    () => {
      setSelectedAssignment(
        null,
      );

      setSubmissions([]);
    };

  // ====================================================
  // SELECTED COURSE
  // ====================================================

  const selectedCourse =
    courses.find(
      (course) =>
        String(course._id) ===
        String(
          selectedCourseId,
        ),
    );

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      {/* ===============================
          HEADER
      =============================== */}

      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-800">
          Kelola Tugas
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Buat tugas berdasarkan
          mata kuliah dan pertemuan,
          serta lihat hasil
          pengumpulan tugas praja.
        </p>
      </div>

      {/* ===============================
          MAIN GRID
      =============================== */}

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* =================================
            FORM TUGAS
        ================================= */}

        <form
          onSubmit={
            handleSubmit
          }
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-5 font-semibold text-gray-700">
            Tambah Tugas
          </h2>

          <div className="space-y-4">
            {/* MATA KULIAH */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-600">
                Mata Kuliah
              </label>

              <select
                value={
                  selectedCourseId
                }
                onChange={(
                  event,
                ) =>
                  setSelectedCourseId(
                    event.target
                      .value,
                  )
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-green-500"
              >
                {courses.length ===
                  0 && (
                  <option value="">
                    Tidak ada mata
                    kuliah
                  </option>
                )}

                {courses.map(
                  (course) => (
                    <option
                      key={
                        course._id
                      }
                      value={
                        course._id
                      }
                    >
                      {
                        course.courseTitle
                      }
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* PERTEMUAN */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-600">
                Pertemuan
              </label>

              <select
                value={
                  pertemuan
                }
                onChange={(
                  event,
                ) =>
                  setPertemuan(
                    Number(
                      event.target
                        .value,
                    ),
                  )
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-green-500"
              >
                {Array.from(
                  {
                    length: 16,
                  },
                  (_, index) =>
                    index + 1,
                ).map(
                  (number) => (
                    <option
                      key={
                        number
                      }
                      value={
                        number
                      }
                    >
                      Pertemuan{" "}
                      {number}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* JUDUL */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-600">
                Judul Tugas
              </label>

              <input
                value={title}
                onChange={(
                  event,
                ) =>
                  setTitle(
                    event.target
                      .value,
                  )
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-500"
                placeholder="Contoh: Analisis Studi Kasus"
                required
              />
            </div>

            {/* INSTRUKSI */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-600">
                Instruksi
              </label>

              <textarea
                value={
                  description
                }
                onChange={(
                  event,
                ) =>
                  setDescription(
                    event.target
                      .value,
                  )
                }
                rows={5}
                className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-500"
                placeholder="Tuliskan instruksi tugas..."
              />
            </div>

            {/* DEADLINE */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-600">
                Deadline
              </label>

              <input
                type="datetime-local"
                value={
                  deadline
                }
                onChange={(
                  event,
                ) =>
                  setDeadline(
                    event.target
                      .value,
                  )
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-500"
              />
            </div>

            {/* LAMPIRAN */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-600">
                Lampiran
              </label>

              <input
                key={
                  fileInputKey
                }
                type="file"
                onChange={(
                  event,
                ) =>
                  setFile(
                    event.target
                      .files?.[0] ||
                      null,
                  )
                }
                className="w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-500 transition hover:border-green-500 hover:bg-green-50/40 focus:border-green-500 focus:outline-none"
              />

              {file && (
                <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2">
                  <p className="break-all text-xs font-medium text-gray-600">
                    {file.name}
                  </p>

                  <p className="mt-1 text-[11px] text-gray-400">
                    {(
                      file.size /
                      1024 /
                      1024
                    ).toFixed(2)}{" "}
                    MB
                  </p>
                </div>
              )}
            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={
                submitting ||
                !selectedCourseId
              }
              className="w-full rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Menyimpan..."
                : "Simpan Tugas"}
            </button>
          </div>
        </form>

        {/* =================================
            DAFTAR TUGAS
        ================================= */}

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-700">
              Daftar Tugas
            </h2>

            {selectedCourse && (
              <p className="mt-1 text-xs text-gray-400">
                {
                  selectedCourse.courseTitle
                }
              </p>
            )}
          </div>

          {loadingAssignments ? (
            <div className="p-12 text-center text-sm text-gray-400">
              Memuat tugas...
            </div>
          ) : assignments.length ===
            0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-gray-400">
                Belum ada tugas.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {assignments.map(
                (
                  assignment,
                ) => {
                  const isSelected =
                    String(
                      selectedAssignment?._id,
                    ) ===
                    String(
                      assignment._id,
                    );

                  return (
                    <div
                      key={
                        assignment._id
                      }
                      className={`p-5 transition ${
                        isSelected
                          ? "bg-blue-50/40"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        {/* INFORMASI */}

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-green-600">
                            Pertemuan{" "}
                            {
                              assignment.pertemuan
                            }
                          </p>

                          <h3 className="mt-1 font-semibold text-gray-800">
                            {
                              assignment.title
                            }
                          </h3>

                          {assignment.description && (
                            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-500">
                              {
                                assignment.description
                              }
                            </p>
                          )}

                          {/* DEADLINE */}

                          <div className="mt-3">
                            <p className="text-xs text-gray-400">
                              Deadline
                            </p>

                            <p className="mt-0.5 text-sm font-medium text-gray-600">
                              {assignment.deadline
                                ? formatDateTime(
                                    assignment.deadline,
                                  )
                                : "Tidak ada deadline"}
                            </p>
                          </div>

                          {/* LAMPIRAN */}

                          {assignment.attachmentUrl && (
                            <a
                              href={
                                assignment.attachmentUrl
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                            >
                              📎{" "}
                              {assignment.attachmentName ||
                                "Lampiran tugas"}
                            </a>
                          )}
                        </div>

                        {/* ACTION */}

                        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              loadSubmissions(
                                assignment,
                              )
                            }
                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                          >
                            Lihat
                            Pengumpulan
                          </button>

                          <button
                            type="button"
                            disabled={
                              deletingAssignmentId ===
                              assignment._id
                            }
                            onClick={() =>
                              handleDelete(
                                assignment._id,
                              )
                            }
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            {deletingAssignmentId ===
                            assignment._id
                              ? "Menghapus..."
                              : "Hapus"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>
      </div>

      {/* ==================================================
          PANEL PENGUMPULAN TUGAS PRAJA
      ================================================== */}

      {selectedAssignment && (
        <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* HEADER */}

          <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-medium text-green-600">
                Pertemuan{" "}
                {
                  selectedAssignment.pertemuan
                }
              </p>

              <h2 className="mt-1 text-lg font-bold text-gray-800">
                Pengumpulan:{" "}
                {
                  selectedAssignment.title
                }
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                {loadingSubmissions
                  ? "Mengambil data pengumpulan..."
                  : `${submissions.length} praja telah mengumpulkan tugas`}
              </p>

              {selectedAssignment.deadline && (
                <p className="mt-2 text-xs text-gray-400">
                  Deadline:{" "}
                  {formatDateTime(
                    selectedAssignment.deadline,
                  )}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={
                closeSubmissions
              }
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 transition hover:bg-gray-50"
            >
              Tutup
            </button>
          </div>

          {/* CONTENT */}

          {loadingSubmissions ? (
            <div className="p-14 text-center text-sm text-gray-400">
              Memuat pengumpulan
              tugas...
            </div>
          ) : submissions.length ===
            0 ? (
            <div className="p-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
                📭
              </div>

              <p className="mt-3 font-medium text-gray-600">
                Belum ada
                pengumpulan
              </p>

              <p className="mt-1 text-sm text-gray-400">
                Belum ada praja
                yang mengumpulkan
                tugas ini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-5 py-4 text-left font-medium">
                      No
                    </th>

                    <th className="px-5 py-4 text-left font-medium">
                      NPP
                    </th>

                    <th className="min-w-[200px] px-5 py-4 text-left font-medium">
                      Nama Praja
                    </th>

                    <th className="min-w-[220px] px-5 py-4 text-left font-medium">
                      File
                    </th>

                    <th className="min-w-[170px] px-5 py-4 text-left font-medium">
                      Waktu
                      Pengumpulan
                    </th>

                    <th className="px-5 py-4 text-center font-medium">
                      Status
                    </th>

                    <th className="px-5 py-4 text-center font-medium">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {submissions.map(
                    (
                      submission,
                      index,
                    ) => (
                      <tr
                        key={
                          submission._id ||
                          index
                        }
                        className="transition hover:bg-gray-50"
                      >
                        {/* NO */}

                        <td className="px-5 py-4 text-gray-400">
                          {index + 1}
                        </td>

                        {/* NPP */}

                        <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-600">
                          {submission.npp ||
                            "—"}
                        </td>

                        {/* NAMA */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {submission.imageUrl ? (
                              <img
                                src={
                                  submission.imageUrl
                                }
                                alt={
                                  submission.name ||
                                  ""
                                }
                                className="h-9 w-9 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-500">
                                {String(
                                  submission.name ||
                                    "P",
                                )
                                  .charAt(
                                    0,
                                  )
                                  .toUpperCase()}
                              </div>
                            )}

                            <span className="font-medium text-gray-700">
                              {submission.name ||
                                "Praja"}
                            </span>
                          </div>
                        </td>

                        {/* FILE */}

                        <td className="px-5 py-4">
                          <p className="max-w-[240px] truncate font-medium text-gray-600">
                            {submission.fileName ||
                              "File tugas"}
                          </p>
                        </td>

                        {/* WAKTU */}

                        <td className="px-5 py-4 text-gray-500">
                          {formatDateTime(
                            submission.submittedAt,
                          )}
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4 text-center">
                          {submission.onTime ? (
                            <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                              Tepat Waktu
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-500">
                              Terlambat
                            </span>
                          )}
                        </td>

                        {/* ACTION */}

                        <td className="px-5 py-4 text-center">
                          {submission.fileUrl ? (
                            <a
                              href={
                                submission.fileUrl
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                            >
                              Unduh /
                              Lihat
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">
                              Tidak ada
                              file
                            </span>
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssignmentManager;