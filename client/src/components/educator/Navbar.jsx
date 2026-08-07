import React, { useContext, useEffect, useRef, useState } from "react";
import { assets } from "../../assets/assets";
import { Link, useLocation } from "react-router-dom";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { AppContext } from "../../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const DosenUserButton = ({ mobile = false, dosenNama, onSignOut }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const initial = dosenNama ? dosenNama.charAt(0).toUpperCase() : "D";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);

  const handleSignOut = () => {
    setShowMenu(false);
    onSignOut();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={showMenu}
        onClick={() => setShowMenu((current) => !current)}
        className={`flex items-center gap-2 ${mobile ? "" : "hover:opacity-80"}`}
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
          {initial}
        </div>

        {!mobile && (
          <span className="text-sm text-gray-700 max-w-30 truncate">
            {dosenNama}
          </span>
        )}
      </button>

      {showMenu && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
        >
          {mobile && (
            <div className="px-4 py-2 text-sm text-gray-700 font-medium border-b border-gray-100 truncate">
              {dosenNama}
            </div>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
          >
            Keluar
          </button>
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const { navigate, backendUrl } = useContext(AppContext);
  const location = useLocation();
  const isCourseListPage = location.pathname.includes("/course-list");

  const { openSignIn } = useClerk();
  const { user } = useUser();

  const [showDosenModal, setShowDosenModal] = useState(false);
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingDosen, setLoadingDosen] = useState(false);
  const [dosenToken, setDosenToken] = useState(
    localStorage.getItem("dosenToken"),
  );
  const [dosenNama, setDosenNama] = useState(
    localStorage.getItem("dosenNama") || "",
  );

  const loginDosen = async () => {
    const nipDosen = nip.trim();

    if (!nipDosen || !password) {
      return toast.error("NIP dan password wajib diisi");
    }

    try {
      setLoadingDosen(true);

      const { data } = await axios.post(backendUrl + "/api/educator/login", {
        nip: nipDosen,
        password,
      });

      localStorage.setItem("dosenToken", data.token);
      localStorage.setItem("dosenNama", data.nama);

      setDosenToken(data.token);
      setDosenNama(data.nama);

      setShowDosenModal(false);
      setNip("");
      setPassword("");

      toast.success(`Selamat datang, ${data.nama}`);
      navigate("/educator/student-engagement");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login dosen gagal");
    } finally {
      setLoadingDosen(false);
    }
  };

  const signOutDosen = () => {
    localStorage.removeItem("dosenToken");
    localStorage.removeItem("dosenNama");

    setDosenToken(null);
    setDosenNama("");

    window.location.replace("/");
  };

  return (
    <>
      <div
        className={`relative z-[100] pointer-events-auto flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-gray-500 py-4 ${
          isCourseListPage ? "bg-white" : "bg-cyan-100/70"
        }`}
      >
        <img
          onClick={() => navigate("/")}
          src={assets.logo}
          alt="Logo"
          className="w-16 lg:w-16 cursor-pointer"
        />

        <div className="hidden md:flex items-center gap-5 text-gray-500">
          {dosenToken ? (
            <DosenUserButton dosenNama={dosenNama} onSignOut={signOutDosen} />
          ) : (NULL
            // <button
            //   type="button"
            //   // onClick={handleOpenDosenModal}
            //   className="relative z-[110] pointer-events-auto cursor-pointer text-sm border border-gray-400 px-4 py-1.5 rounded-full hover:bg-gray-100"
            // >
            //   Login sebagai Dosen
            // </button>
          )}

          {user && <Link to="/my-enrollments">My Enrollments</Link>}

          {user ? (
            <UserButton />
          ) : (
            !dosenToken && (
              <button
                type="button"
                onClick={() => openSignIn()}
                className="bg-blue-600 text-white px-5 py-2 rounded-full"
              >
                Masuk sebagai Praja
              </button>
            )
          )}
        </div>

        <div className="md:hidden flex items-center gap-2 sm:gap-5 text-gray-500">
          {dosenToken ? (
            <DosenUserButton
              mobile
              dosenNama={dosenNama}
              onSignOut={signOutDosen}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowDosenModal(true)}
              className="text-xs border border-gray-400 px-3 py-1 rounded-full"
            >
              Login Dosen
            </button>
          )}

          {user ? (
            <UserButton />
          ) : (
            !dosenToken && (
              <button type="button" onClick={() => openSignIn()}>
                <img src={assets.user_icon} alt="Masuk sebagai Praja" />
              </button>
            )
          )}
        </div>
      </div>

      {showDosenModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              Login Dosen
            </h2>

            <p className="text-sm text-gray-500 mb-5">
              Masukkan NIP Anda untuk mengakses dashboard
            </p>

            <input
              type="text"
              value={nip}
              onChange={(event) => setNip(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !loadingDosen) {
                  loginDosen();
                }
              }}
              placeholder="Masukkan NIP"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm mb-4 focus:outline-none focus:border-blue-400"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDosenModal(false);
                  setNip("");
                }}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={loginDosen}
                disabled={loadingDosen}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingDosen ? "Memuat..." : "Masuk"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
