import React, { useMemo, useState } from 'react'

/* ============================================================
   Ikon (Tabler — sudah dipakai di CourseDetail/Navbar)
   ============================================================ */
const Ico = ({ name, size = 16, className = '', style = {} }) => (
  <i className={`ti ti-${name} ${className}`} aria-hidden="true" style={{ fontSize: size, ...style }} />
)

/* ============================================================
   DATA DEMO — ganti dengan data nyata bila backend sudah siap
   ============================================================ */
const DEMO_TUGAS = [
  // Kosongkan array ini untuk melihat empty state "Tidak ada tugas."
]

const DEMO_FEED = [
  {
    id: 'p1',
    type: 'kelas',
    author: 'MUHAMMAD TOSAN BINGAMAWA, M.Kom',
    initials: 'MT',
    action: 'menambahkan tugas',
    breadcrumb: ['Manajemen Proyek Sistem Informasi Pemerintahan', 'Pertemuan ke 8'],
    assignment: {
      title: 'Ujian Tengah Semester UTS',
      deadline: '22 September 2026 23:59',
      desc: 'Anda dapat mengacu pada materi perkuliahan pertemuan ke 1-7 yang sudah saya upload. Selamat mengerjakan.',
      file: 'SOAL UTS MPSIP.pdf',
    },
    liked: false,
    comments: [],
  },
  {
    id: 'p2',
    type: 'kelas',
    author: 'RINA WAHYUNI, S.Kom., M.T.I',
    initials: 'RW',
    action: 'membagikan materi',
    breadcrumb: ['Manajemen Risiko Pelayanan Publik', 'Sesi ke 12'],
    time: '2 hari yang lalu',
    assignment: {
      title: 'Modul: Identifikasi & Mitigasi Risiko',
      deadline: null,
      desc: 'Silakan pelajari modul berikut sebelum pertemuan minggu depan. Akan ada kuis singkat di awal sesi.',
      status: null,
      file: 'Modul-Mitigasi-Risiko.pdf',
    },
    likes: 9,
    liked: true,
    comments: [
      { id: 'c1', author: 'Annisa Rahmadhani DM', text: 'Terima kasih Ibu, sangat membantu.' },
    ],
  },
  {
    id: 'p3',
    type: 'berita',
    author: 'Bagian Akademik IPDN',
    initials: 'AK',
    action: 'mengumumkan',
    breadcrumb: ['Pengumuman Akademik'],
    time: '5 hari yang lalu',
    assignment: {
      title: 'Jadwal Pekan Ujian Tengah Semester Genap',
      deadline: null,
      desc: 'Pekan UTS Genap dilaksanakan 7–11 Juli 2026. Praja diharapkan memeriksa jadwal masing-masing melalui menu Beranda.',
      status: null,
      file: null,
    },
    likes: 21,
    liked: false,
    comments: [],
  },
]

const DEMO_BERITA = [
  // Kosongkan array ini untuk melihat empty state "Tidak ada berita."
  { id: 'b1', title: 'Penerimaan Praja Baru T.A. 2026/2027 Resmi Dibuka', time: '1 hari yang lalu' },
  { id: 'b2', title: 'Kuliah Umum: Transformasi Digital Pemerintahan Daerah', time: '4 hari yang lalu' },
]

const TABS = [
  { key: 'semua', label: 'Semua' },
  { key: 'kelas', label: 'Kelas' },
  { key: 'berita', label: 'Berita' },
]

const COMPOSER = [
  {
    label: 'Survei', color: '#f59e0b', bg: '#fef3c7',
    svg: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="20" x2="6" y2="13" />
        <line x1="12" y1="20" x2="12" y2="9" />
        <line x1="18" y1="20" x2="18" y2="5" />
      </svg>
    ),
  },
  {
    label: 'Info', color: '#2563eb', bg: '#dbeafe',
    svg: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l16-5v12L3 13z" />
        <path d="M11 15.5a2.5 2.5 0 0 1-4.8.9" />
      </svg>
    ),
  },
  {
    label: 'Acara', color: '#dc2626', bg: '#fee2e2',
    svg: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <line x1="16" y1="3" x2="16" y2="7" />
        <line x1="8" y1="3" x2="8" y2="7" />
        <line x1="4" y1="11" x2="20" y2="11" />
      </svg>
    ),
  },
]

/* ============================================================
   Sub-komponen
   ============================================================ */
const SectionCard = ({ title, children }) => (
  <section>
    <h2 className="text-[15px] font-bold text-gray-700 mb-3">{title}</h2>
    <div className="bg-white border border-gray-200 rounded-xl">{children}</div>
  </section>
)

const EmptyState = ({ text }) => (
  <p className="px-4 py-5 text-sm text-gray-400">{text}</p>
)

const TugasItem = ({ tugas }) => (
  <div className="px-4 py-3 border-b border-gray-50 last:border-0">
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
        <Ico name="clipboard-list" size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">{tugas.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{tugas.course}</p>
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <Ico name="clock" size={12} /> {tugas.deadline}
        </p>
      </div>
    </div>
  </div>
)

const BeritaItem = ({ berita }) => (
  <button className="w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
    <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">{berita.title}</p>
    <p className="text-xs text-gray-400 mt-1">{berita.time}</p>
  </button>
)

const Avatar = ({ initials }) => (
  <span className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold shrink-0">
    {initials}
  </span>
)

const PostCard = ({ post, onLike, onComment }) => {
  const [draft, setDraft] = useState('')
  const a = post.assignment

  const submit = () => {
    const text = draft.trim()
    if (!text) return
    onComment(post.id, text)
    setDraft('')
  }

  return (
    <article className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar initials={post.initials} />
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">
            <span className="font-bold text-gray-800">{post.author}</span>{' '}
            <span className="text-gray-500">{post.action}</span>
          </p>
          <p className="text-xs text-green-700 mt-0.5 flex items-center flex-wrap gap-x-1">
            {post.breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <Ico name="chevron-right" size={11} className="text-gray-300" />}
                <span className="hover:underline cursor-pointer">{b}</span>
              </span>
            ))}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{post.time}</p>
        </div>
      </div>

      {/* Kartu materi / tugas */}
      {a && (
        <div className="mt-4 border border-gray-100 rounded-xl p-4 bg-gray-50/50">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
              <Ico name="clipboard-text" size={18} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-800 text-sm">{a.title}</h3>
                  {a.deadline && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Batas pengumpulan: <span className="font-medium">{a.deadline}</span>
                    </p>
                  )}
                </div>
            
              </div>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{a.desc}</p>

              {a.file && (
                <div className="mt-3 flex items-center justify-between gap-3 bg-indigo-50 rounded-lg px-3 py-2.5">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold text-white bg-red-500 rounded px-1.5 py-0.5 shrink-0">PDF</span>
                    <span className="text-sm text-gray-700 truncate">{a.file}</span>
                  </span>
                  <button className="flex items-center gap-1 text-sm text-indigo-600 font-medium hover:underline shrink-0">
                    <Ico name="download" size={15} /> Unduh
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Aksi */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 text-sm">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 transition-colors ${post.liked ? 'text-rose-500' : 'text-gray-500 hover:text-rose-500'}`}
        >
          <Ico name={post.liked ? 'heart-filled' : 'heart'} size={17} />
          Suka {post.likes > 0 && <span className="text-xs text-gray-400">({post.likes})</span>}
        </button>
        <span className="flex items-center gap-1.5 text-gray-500">
          <Ico name="message-circle" size={17} /> Komentar
          {post.comments.length > 0 && <span className="text-xs text-gray-400">({post.comments.length})</span>}
        </span>
        <button className="flex items-center gap-1.5 text-gray-500 hover:text-green-600 transition-colors">
          <Ico name="share" size={17} /> Bagikan
        </button>
      </div>

      {/* Daftar komentar */}
      {post.comments.length > 0 && (
        <div className="mt-3 space-y-2">
          {post.comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <Avatar initials={c.author.split(' ').map((w) => w[0]).slice(0, 2).join('')} />
              <div className="bg-gray-50 rounded-2xl px-3 py-2 flex-1">
                <p className="text-xs font-semibold text-gray-700">{c.author}</p>
                <p className="text-sm text-gray-600">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input komentar */}
      <div className="mt-3 flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
          <Ico name="user" size={16} />
        </span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Tambahkan komentar..."
          className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-full px-4 py-2 outline-none focus:border-green-400"
        />
        <button
          onClick={submit}
          className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors shrink-0"
        >
          <Ico name="send" size={16} />
        </button>
      </div>
    </article>
  )
}

/* ============================================================
   Halaman utama
   ============================================================ */
const TimelineBerita = () => {
  const [feed, setFeed] = useState(DEMO_FEED)
  const [tab, setTab] = useState('semua')

  const visibleFeed = useMemo(
    () => (tab === 'semua' ? feed : feed.filter((p) => p.type === tab)),
    [feed, tab]
  )

  const toggleLike = (id) =>
    setFeed((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p
      )
    )

  const addComment = (id, text) =>
    setFeed((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, comments: [...p.comments, { id: `c${Date.now()}`, author: 'Annisa Rahmadhani DM', text }] }
          : p
      )
    )

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 lg:px-12 py-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Kiri: Tugas belum dikumpulkan ── */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <SectionCard title="Tugas belum dikumpulkan">
            {DEMO_TUGAS.length === 0 ? (
              <EmptyState text="Tidak ada tugas." />
            ) : (
              DEMO_TUGAS.map((t) => <TugasItem key={t.id} tugas={t} />)
            )}
          </SectionCard>
        </div>

        {/* ── Tengah: Komposer + Timeline ── */}
        <div className="lg:col-span-6 order-1 lg:order-2">
          {/* Komposer */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
            <p className="text-sm text-gray-600 mb-3">Bagikan sesuatu di kelas Anda:</p>
            <div className="grid grid-cols-3 gap-3">
              {COMPOSER.map((c) => (
                <button
                  key={c.label}
                  className="flex flex-col items-center gap-2 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: c.bg, color: c.color }}
                  >
                    {c.svg}
                  </span>
                  <span className="text-sm text-gray-600">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Header timeline + filter */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-[15px] font-bold text-gray-700">
              <Ico name="list" size={18} className="text-gray-400" /> Timeline
            </h2>
            <div className="flex items-center gap-1.5">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                    tab === t.key
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feed */}
          {visibleFeed.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-10 text-center text-sm text-gray-400">
              Belum ada aktivitas pada kategori ini.
            </div>
          ) : (
            visibleFeed.map((p) => (
              <PostCard key={p.id} post={p} onLike={toggleLike} onComment={addComment} />
            ))
          )}
        </div>

        {/* ── Kanan: Berita Kampus ── */}
        <div className="lg:col-span-3 order-3">
          <SectionCard title="Berita Kampus">
            {DEMO_BERITA.length === 0 ? (
              <EmptyState text="Tidak ada berita." />
            ) : (
              DEMO_BERITA.map((b) => <BeritaItem key={b.id} berita={b} />)
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

export default TimelineBerita
