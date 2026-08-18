import multer from "multer";

const storage = multer.diskStorage({});

const allowedMimeTypes = [
  "application/pdf",

  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  "application/zip",
  "application/x-zip-compressed",

  "image/jpeg",
  "image/png",
];

const assignmentUpload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (
      allowedMimeTypes.includes(
        file.mimetype,
      )
    ) {
      cb(null, true);
      return;
    }

    cb(
      new Error(
        "Format file tidak didukung. Gunakan PDF, Word, Excel, PowerPoint, ZIP, JPG, atau PNG.",
      ),
    );
  },
});

export default assignmentUpload;