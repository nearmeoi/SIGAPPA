import React, { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import ConfirmDialog from "@/Components/ConfirmDialog";
import { PageProps } from "@/types";
import { Trash2, Star, Eye, X, Calendar } from "lucide-react";
import BulkActionBar, {
  CheckboxCell,
  CheckboxHeader,
} from "@/Components/BulkActionBar";

interface EvaluasiSistem {
  id_evaluasi: number;
  nama: string;
  asal_instansi: string | null;
  no_telp: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  masukan: string | null;
  created_at: string;
}

export default function EvaluasiSistemIndex({ auth, evaluasi }: any) {
  const { props } = usePage();
  const isSuperadmin = (props as any).auth?.user?.role === 'superadmin';

  const [selectedDetail, setSelectedDetail] = useState<EvaluasiSistem | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editDateItem, setEditDateItem] = useState<EvaluasiSistem | null>(null);
  const [editDate, setEditDate] = useState('');

  // ── Bulk Delete ──
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const allIdsOnPage = (evaluasi as EvaluasiSistem[]).map((e) => e.id_evaluasi);
  const allChecked =
    allIdsOnPage.length > 0 &&
    allIdsOnPage.every((id) => selectedIds.includes(id));
  const toggleAll = () => {
    if (allChecked)
      setSelectedIds((prev) => prev.filter((id) => !allIdsOnPage.includes(id)));
    else setSelectedIds((prev) => [...new Set([...prev, ...allIdsOnPage])]);
  };
  const toggleOne = (id: number) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  const handleBulkDelete = () => {
    if (confirm(`Hapus ${selectedIds.length} data evaluasi terpilih?`)) {
      router.delete("/admin/evaluasi-sistem/bulk", {
        data: { ids: selectedIds },
        onSuccess: () => setSelectedIds([]),
        preserveState: true,
      });
    }
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      router.delete(`/admin/evaluasi-sistem/${deleteId}`, {
        onFinish: () => setDeleteId(null),
      });
    }
  };

  const getAverageRating = (evalItem: EvaluasiSistem) => {
    return (
      (evalItem.q1 + evalItem.q2 + evalItem.q3 + evalItem.q4 + evalItem.q5) /
      5
    ).toFixed(1);
  };

  return (
    <AdminLayout title="Supervisi Feedback">
      <Head title="Supervisi Feedback" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Feedback</h1>
          <p className="text-sm text-slate-500 mt-1">
            Umpan balik dan penilaian dari masyarakat dan stakeholder
          </p>
        </div>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        onDelete={handleBulkDelete}
        onClear={() => setSelectedIds([])}
        entityLabel="feedback"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-400 mb-1">
              Total Responden
            </p>
            <h3 className="text-3xl font-black text-slate-800">
              {evaluasi.length}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-[14px] bg-poltekpar-primary/10 text-poltekpar-primary flex items-center justify-center">
            <i className="fa-solid fa-users text-xl"></i>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-400 mb-1">
              Rata-Rata Kepuasan Masyarakat
            </p>
            <h3 className="text-3xl font-black text-slate-800 flex items-center gap-2">
              {evaluasi.length > 0
                ? (
                    evaluasi.reduce(
                      (acc: number, curr: EvaluasiSistem) =>
                        acc + parseFloat(getAverageRating(curr)),
                      0,
                    ) / evaluasi.length
                  ).toFixed(1)
                : "0.0"}
              <Star className="text-amber-400 fill-amber-400" size={20} />
            </h3>
          </div>
          <div className="w-12 h-12 rounded-[14px] bg-amber-50 text-amber-500 flex items-center justify-center">
            <i className="fa-solid fa-star-half-stroke text-xl"></i>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <CheckboxHeader
                  allChecked={allChecked}
                  onToggleAll={toggleAll}
                />
                <th className="px-6 py-4 font-semibold w-16">No</th>
                <th className="px-6 py-4 font-semibold">Responden</th>
                <th className="px-6 py-4 font-semibold">Rata-Rata Bintang</th>
                <th className="px-6 py-4 font-semibold">Tanggal</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {evaluasi.length > 0 ? (
                evaluasi.map((item: EvaluasiSistem, index: number) => {
                  const checked = selectedIds.includes(item.id_evaluasi);
                  return (
                    <tr
                      key={item.id_evaluasi}
                      className={`hover:bg-slate-50 transition-colors ${checked ? "bg-red-50/40" : ""}`}
                    >
                      <CheckboxCell
                        checked={checked}
                        onChange={() => toggleOne(item.id_evaluasi)}
                      />
                      <td className="px-6 py-4 text-center">{index + 1}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 mb-1">
                          {item.nama}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.asal_instansi || "Umum"} • {item.no_telp}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full font-bold">
                          <Star size={14} className="fill-amber-400" />
                          {getAverageRating(item)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {new Date(item.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedDetail(item)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye size={16} />
                        </button>
                        {isSuperadmin && (
                          <button
                            onClick={() => {
                              setEditDateItem(item);
                              setEditDate(item.created_at ? new Date(item.created_at).toISOString().slice(0, 10) : '');
                            }}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Ubah Tanggal"
                          >
                            <Calendar size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id_evaluasi)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Belum ada data evaluasi yang masuk.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setSelectedDetail(null)}
          ></div>
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="font-bold text-lg text-slate-800">
                  Detail Evaluasi Sistem
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Berdasarkan isian {selectedDetail.nama}
                </p>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors bg-white hover:bg-slate-200 p-2 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto w-full custom-scrollbar space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Terdaftar
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    {new Date(selectedDetail.created_at).toLocaleString(
                      "id-ID",
                    )}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Asal Instansi
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    {selectedDetail.asal_instansi || "-"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Target No Telp
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    {selectedDetail.no_telp}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Kepuasan Rata-rata
                  </span>
                  <span className="text-sm font-black text-amber-500">
                    {getAverageRating(selectedDetail)}/5
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-2 mb-4">
                  Rincian Penilaian (Bintang)
                </h4>
                <div className="space-y-3">
                  {[
                    { q: "Kemudahan Navigasi & Akses", val: selectedDetail.q1 },
                    {
                      q: "Kelengkapan & Akurasi Informasi",
                      val: selectedDetail.q2,
                    },
                    {
                      q: "Fitur WebGIS / Pemetaan Terpadu",
                      val: selectedDetail.q3,
                    },
                    { q: "Kenyamanan Pengajuan PKM", val: selectedDetail.q4 },
                    {
                      q: "Tingkat Kepuasan Keseluruhan",
                      val: selectedDetail.q5,
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <span className="text-[13px] font-bold text-slate-600">
                        {idx + 1}. {item.q}
                      </span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <Star
                            key={v}
                            size={14}
                            className={
                              item.val >= v
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200"
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-2 mb-4">
                  Kritik & Masukan Tambahan
                </h4>
                {selectedDetail.masukan ? (
                  <div className="p-4 bg-yellow-50 text-yellow-800 border-l-4 border-yellow-400 rounded-r-xl text-sm leading-relaxed whitespace-pre-wrap">
                    "{selectedDetail.masukan}"
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 text-slate-400 text-sm italic text-center rounded-xl border border-slate-100">
                    Tidak ada masukan tambahan.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ubah Tanggal (Superadmin) */}
      {editDateItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setEditDateItem(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Ubah Tanggal Feedback</h3>
              <button onClick={() => setEditDateItem(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Responden: <span className="font-bold text-slate-700">{editDateItem.nama}</span></p>
            <input
              type="date"
              value={editDate}
              onChange={e => setEditDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 mb-5"
            />
            <div className="flex gap-3">
              <button onClick={() => setEditDateItem(null)} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">Batal</button>
              <button
                onClick={() => {
                  if (!editDate) return;
                  router.patch(`/admin/evaluasi-sistem/${editDateItem.id_evaluasi}/date`, { created_at: editDate }, {
                    preserveScroll: true,
                    onSuccess: () => setEditDateItem(null),
                  });
                }}
                className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Evaluasi"
        message="Yakin ingin menghapus data evaluasi ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        variant="danger"
      />
    </AdminLayout>
  );
}
