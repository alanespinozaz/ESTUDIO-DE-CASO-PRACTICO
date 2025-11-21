import React, { useEffect, useState } from "react";
import api from "../api";
import Swal from "sweetalert2";

const ESTADOS = ["CONVOCADO", "CONFIRMADO", "ASISTIÓ", "FALTÓ", "JUSTIFICADO"];

export default function Attendance() {
  const [convocatorias, setConvocatorias] = useState([]);
  const [selConvId, setSelConvId] = useState("");
  const [empleados, setEmpleados] = useState([]);
  const [file, setFile] = useState(null);
  const [asistencias, setAsistencias] = useState([]);

  // ===== Modal Penalizar =====
  const [penalModal, setPenalModal] = useState(null);
  const [penalMotivo, setPenalMotivo] = useState("");
  const [penalInicio, setPenalInicio] = useState("");
  const [penalFin, setPenalFin] = useState("");

  // ============================================================
  // 🔹 Cargar lista de convocatorias
  // ============================================================
  useEffect(() => {
    api
      .get("/convocations")
      .then(({ data }) => setConvocatorias(data))
      .catch(() =>
        Swal.fire("Error", "No se pudo cargar las convocatorias", "error")
      );
  }, []);

  // ============================================================
  // 🔹 Cargar empleados y asistencias de la convocatoria
  // ============================================================
  const loadConvData = async (id) => {
    if (!id) return;
    try {
      const conv = (await api.get(`/convocations/${id}`)).data;

      const empleadosMap = (conv.Employees || []).map((ce) => ({
        employeeId: ce.employeeId,
        nombre: `${ce.employee.nombres} ${ce.employee.apellidos}`,
        estado: ce.estado || "CONVOCADO",
        comentario: ce.comentario || "",
      }));

      setEmpleados(empleadosMap);

      const { data: asist } = await api.get(`/attendance?convocationId=${id}`);
      setAsistencias(asist);
    } catch (err) {
      console.error("Error cargando convocatoria:", err);
      Swal.fire("Error", "No se pudo cargar la información", "error");
    }
  };

  // ============================================================
  // 🔹 Cambiar estado o comentario
  // ============================================================
  const setEstado = (employeeId, estado) => {
    setEmpleados((prev) =>
      prev.map((e) => (e.employeeId === employeeId ? { ...e, estado } : e))
    );
  };

  const setComentario = (employeeId, comentario) =>
    setEmpleados((prev) =>
      prev.map((e) =>
        e.employeeId === employeeId ? { ...e, comentario } : e
      )
    );

  // ============================================================
  // 🔹 Guardar asistencias (convocatoria)
  // ============================================================
  const guardar = async () => {
    if (!selConvId)
      return Swal.fire("Selecciona una convocatoria", "", "warning");

    const updates = empleados.map((e) => ({
      employeeId: e.employeeId,
      estado: e.estado,
      comentario: e.comentario,
    }));

    try {
      await api.patch(`/attendance/${selConvId}/attendance`, { updates });
      Swal.fire("Asistencias guardadas correctamente", "", "success");
    } catch (err) {
      console.error("Error guardando asistencias:", err);
      Swal.fire("Error", "No se pudieron guardar las asistencias", "error");
    }
  };

  // ============================================================
  // 🔹 Subir archivo Excel
  // ============================================================
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !selConvId)
      return Swal.fire(
        "Atención",
        "Selecciona una convocatoria y un archivo Excel",
        "warning"
      );

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post(
        `/attendance/${selConvId}/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      Swal.fire({
        title: "Archivo procesado",
        text: data.message,
        icon: "success",
      }).then(() => loadConvData(selConvId));
    } catch (err) {
      console.error("Error al subir Excel:", err);
      Swal.fire("Error", "No se pudo procesar el archivo", "error");
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("es-EC");
  const formatTime = (t) => (t ? new Date(t).toLocaleTimeString("es-EC") : "—");

  // ============================================================
  // 🔹 Penalizar empleado (llama al backend)
  // ============================================================
  const penalizarEmpleado = async () => {
    if (!penalModal) return;

    if (!penalMotivo || !penalInicio || !penalFin)
      return Swal.fire("Completa todos los campos", "", "warning");

    try {
      await api.post("/attendance/penalizar", {
        employeeId: penalModal.employeeId,
        motivo: penalMotivo,
        fechaInicio: penalInicio,
        fechaFin: penalFin,
      });

      Swal.fire("Empleado penalizado", "Penalización registrada", "success");

      // Reset modal
      setPenalModal(null);
      setPenalMotivo("");
      setPenalInicio("");
      setPenalFin("");
    } catch (err) {
      console.error("Error penalizando empleado:", err);
      Swal.fire("Error", "No se pudo penalizar al empleado", "error");
    }
  };

  // ============================================================
  // 🔹 Render principal
  // ============================================================
  return (
    <div className="page-container">
      <h1 className="page-title text-blue-800 font-bold mb-4">
        Control de Asistencias por Convocatoria
      </h1>

      {/* Selector de convocatoria */}
      <div className="card-container flex flex-wrap items-center gap-3 bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
        <select
          className="border p-2 rounded flex-1"
          value={selConvId}
          onChange={(e) => {
            setSelConvId(e.target.value);
            loadConvData(e.target.value);
          }}
        >
          <option value="">Seleccione una convocatoria</option>

          {convocatorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.titulo} — {new Date(c.fechaTrabajo).toLocaleString("es-EC")}
            </option>
          ))}
        </select>

        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded shadow"
          onClick={guardar}
          disabled={!selConvId || !empleados.length}
        >
          Guardar asistencias
        </button>
      </div>

      {/* Tabla asistencia */}
      {empleados.length > 0 && (
        <div className="card-container mb-8 overflow-x-auto">
          <h2 className="text-lg font-semibold text-blue-700 mb-3">
            Asistencia por convocatoria
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-blue-100 text-blue-800">
                <th className="p-2 text-left">Empleado</th>
                <th className="p-2 text-center">Estado</th>
                <th className="p-2 text-left">Comentario</th>
                <th className="p-2 text-center">Penalizar</th>
              </tr>
            </thead>

            <tbody>
              {empleados.map((e) => (
                <tr key={e.employeeId} className="border-t hover:bg-blue-50">
                  <td className="p-2">{e.nombre}</td>

                  <td className="p-2 text-center">
                    <select
                      className="border p-1 rounded"
                      value={e.estado}
                      onChange={(ev) => setEstado(e.employeeId, ev.target.value)}
                    >
                      {ESTADOS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-2">
                    <input
                      className="border p-1 rounded w-full"
                      value={e.comentario}
                      onChange={(ev) =>
                        setComentario(e.employeeId, ev.target.value)
                      }
                      placeholder="Comentario opcional"
                    />
                  </td>

                  {/* BOTÓN PENALIZAR - solo si FALTÓ */}
                  <td className="text-center">
                    {e.estado === "FALTÓ" && (
                      <button
                        className="px-3 py-1 rounded bg-red-600 text-white text-sm"
                        onClick={() =>
                          setPenalModal({
                            employeeId: e.employeeId,
                            nombre: e.nombre,
                          })
                        }
                      >
                        Penalizar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUBIR EXCEL */}
      <div className="card-container mb-6">
        <h2 className="text-lg font-semibold text-blue-700 mb-3">
          Importar marcaciones (lector biométrico)
        </h2>

        <form
          onSubmit={handleUpload}
          className="flex flex-wrap items-center gap-3 bg-blue-50 border border-blue-200 p-4 rounded-lg shadow-sm"
        >
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0])}
            className="border border-blue-300 rounded p-2 flex-1 bg-white"
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md transition"
          >
            Subir Excel
          </button>
        </form>
      </div>

      {/* MARCACIONES */}
      <div className="card-container bg-white border border-blue-100 rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold text-blue-700 mb-3">
          Registro de marcaciones
        </h2>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-blue-100 text-blue-800 text-left">
              <th className="p-2 w-10 text-center">#</th>
              <th className="p-2">Empleado</th>
              <th className="p-2">Cédula</th>
              <th className="p-2">Fecha</th>
              <th className="p-2 text-green-700">Entrada</th>
              <th className="p-2 text-red-700">Salida</th>
            </tr>
          </thead>

          <tbody>
            {asistencias.length ? (
              asistencias.map((a, i) => (
                <tr key={i} className="border-t hover:bg-blue-50 text-center">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">
                    {a.employee
                      ? `${a.employee.nombres} ${a.employee.apellidos}`
                      : "—"}
                  </td>
                  <td className="p-2">{a.employee?.cedula || "—"}</td>
                  <td className="p-2">{formatDate(a.fecha)}</td>
                  <td className="p-2 text-green-600">
                    {formatTime(a.horaEntrada)}
                  </td>
                  <td className="p-2 text-red-600">
                    {formatTime(a.horaSalida)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-4 text-gray-500 italic"
                >
                  No hay registros de asistencia.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL PENALIZAR ================= */}
      {penalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
            <button
              className="absolute top-2 right-3"
              onClick={() => setPenalModal(null)}
            >
              ✖
            </button>

            <h2 className="text-lg font-bold text-red-600">
              Penalizar a {penalModal.nombre}
            </h2>

            <label className="block mt-3">Motivo:</label>
            <input
              className="border p-2 rounded w-full"
              value={penalMotivo}
              onChange={(e) => setPenalMotivo(e.target.value)}
            />

            <label className="block mt-3">Fecha inicio:</label>
            <input
              type="date"
              className="border p-2 rounded w-full"
              value={penalInicio}
              onChange={(e) => setPenalInicio(e.target.value)}
            />

            <label className="block mt-3">Fecha fin:</label>
            <input
              type="date"
              className="border p-2 rounded w-full"
              value={penalFin}
              onChange={(e) => setPenalFin(e.target.value)}
            />

            <button
              className="bg-red-700 text-white w-full py-2 rounded mt-4"
              onClick={penalizarEmpleado}
            >
              Guardar penalización
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
