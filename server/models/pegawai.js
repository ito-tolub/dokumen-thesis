import mongoose from "mongoose";

const pegawaiSchema = new mongoose.Schema(
  {
    nip: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    nama: {
      type: String,
      required: true,
      trim: true,
    },

    jabatan: {
      type: String,
      default: "",
    },

    unit_kerja: {
      type: String,
      default: "",
    },

    pangkat: {
      type: String,
      default: "",
    },

    // Tidak dibuat required karena dosen lama belum tentu punya password
    password: {
      type: String,
      default: null,
      select: false,
    },

    passwordCreatedAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    collection: "pegawai",
  },
);

const Pegawai = mongoose.model("Pegawai", pegawaiSchema);

export default Pegawai;