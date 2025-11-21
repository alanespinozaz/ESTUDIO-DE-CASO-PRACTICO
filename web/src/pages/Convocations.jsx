import React, { useEffect, useState } from "react";
import api from "../api";
import Swal from "sweetalert2";

export default function Convocations() {
  const [areas, setAreas] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaTrabajo, setFechaTrabajo] = useState("");
  const [convocations, setConvocations] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadAreas();
    loadEmployees();
    loadConvocations();
  }, []);

  /* ============================================================
     🔹 CARGA DE ÁREAS
  ============================================================ */
  const loadAreas = async () => {
    const { data } = await api.get("/areas");
    setAreas(data);
  };

  /* ============================================================
     🔹 CARGA DE EMPLEADOS (INCLUYE PENALIZACIONES)
  ============================================================ */
  const loadEmployees = async () => {
    const { data } = await api.get("/employees", {
      params: { estado: "ACTIVO", includePenalties: true },
    });
    setEmployees(data);
  };

  /* ============================================================
     🔹 CARGA DE CONVOCATORIAS
  ============================================================ */
  const loadConvocations = async () => {
    try {
      const { data } = await api.get("/convocations");
      setConvocations(data);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudieron cargar las convocatorias", "error");
    }
  };

  /* ============================================================
     🔹 DETECTA SI UN EMPLEADO TIENE PENALIZACIÓN ACTIVA
  ============================================================ */
  const isPenalized = (emp) => {
    if (!emp.Penalties || emp.Penalties.length === 0) return false;

    const now = new Date();

    return emp.Penalties.some(
      (p) =>
        p.activo === true &&
        new Date(p.fechaInicio) <= now &&
        new Date(p.fechaFin) >= now
    );
  };

  /* ============================================================
     🔹 SELECCIONAR EMPLEADO (CON VALIDACIÓN DE PENALIZADOS)
  ============================================================ */
  const toggleEmployee = (emp) => {
    if (isPenalized(emp)) {
      Swal.fire(
        "Empleado penalizado",
        `${emp.nombres} ${emp.apellidos} tiene una penalización activa y NO puede ser seleccionado.`,
        "error"
      );
      return;
    }

    setSelectedEmployees((prev) =>
      prev.includes(emp.id)
        ? prev.filter((eid) => eid !== emp.id)
        : [...prev, emp.id]
    );
  };

  /* ============================================================
     🔹 CREAR CONVOCATORIA
  ============================================================ */
  const createConvocation = async () => {
    if (!titulo || !fechaTrabajo || selectedEmployees.length === 0)
      return Swal.fire(
        "Aviso",
        "Completa los datos y selecciona empleados.",
        "warning"
      );

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaSeleccionada = new Date(fechaTrabajo);
    if (fechaSeleccionada < hoy)
      return Swal.fire(
        "Fecha inválida",
        "No puedes crear una convocatoria en una fecha anterior al día actual.",
        "error"
      );

    await api.post("/convocations", {
      titulo,
      descripcion,
      fechaTrabajo,
      employees: selectedEmployees.map((id) => ({ employeeId: id })),
    });

    setTitulo("");
    setDescripcion("");
    setFechaTrabajo("");
    setSelectedEmployees([]);
    setSelectedAreaId("");
    setShowCreateModal(false);
    loadConvocations();

    Swal.fire("Éxito", "Convocatoria creada exitosamente", "success");
  };

  /* ============================================================
     🔹 ENVIAR CORREOS
  ============================================================ */
  const sendEmails = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Enviar correos?",
      text: "¿Deseas enviar las notificaciones a los empleados?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, enviar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    const { data } = await api.post(`/convocations/${id}/send`);
    Swal.fire(
      "Enviado",
      `Correos enviados: ${data.enviados} / ${data.total}`,
      "success"
    );
    loadConvocations();
  };

  /* ============================================================
     🔹 ELIMINAR CONVOCATORIA
  ============================================================ */
  const deleteConvocation = async (id, estado) => {
    if (estado === "ENVIADA")
      return Swal.fire(
        "Aviso",
        "No puedes eliminar una convocatoria enviada.",
        "warning"
      );

    const confirm = await Swal.fire({
      title: "¿Eliminar convocatoria?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    await api.delete(`/convocations/${id}`);
    Swal.fire("Eliminada", "Convocatoria eliminada correctamente", "success");
    loadConvocations();
  };

  /* ============================================================
     🔹 INTERFAZ COMPLETA
  ============================================================ */
  return (
    <div className="page-container">
      <h1 className="page-title text-blue-800 font-bold mb-6">Convocatorias</h1>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded shadow"
        >
          Crear convocatoria
        </button>
      </div>

      {/* ============================ CONVOCATORIAS ABIERTAS ============================ */}
      <h2 className="text-lg font-semibold mb-2 text-blue-700">
        Convocatorias abiertas
      </h2>

      {convocations.filter((c) => new Date(c.fechaTrabajo) >= new Date())
        .length === 0 ? (
        <p className="text-gray-500 mb-4">No hay convocatorias abiertas</p>
      ) : (
        convocations
          .filter((c) => new Date(c.fechaTrabajo) >= new Date())
          .sort((a, b) => new Date(a.fechaTrabajo) - new Date(b.fechaTrabajo))
          .map((c) => (
            <div
              key={c.id}
              className="card-container mb-3 flex justify-between items-center border-l-4 border-blue-400"
            >
              <div>
                <b className="text-blue-800">{c.titulo}</b>
                <p className="text-sm text-gray-600">
                  {new Date(c.fechaTrabajo).toLocaleString("es-EC")} • Estado:{" "}
                  <span className="text-blue-700 font-semibold">
                    {c.estado}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded"
                  onClick={() => setModalData(c)}
                >
                  Ver detalles
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  onClick={() => deleteConvocation(c.id, c.estado)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
      )}

      {/* ============================ CONVOCATORIAS CERRADAS ============================ */}
      <h2 className="text-lg font-semibold mb-2 text-red-700 mt-6">
        Convocatorias cerradas
      </h2>

      {convocations.filter((c) => new Date(c.fechaTrabajo) < new Date())
        .length === 0 ? (
        <p className="text-gray-500">No hay convocatorias cerradas</p>
      ) : (
        convocations
          .filter((c) => new Date(c.fechaTrabajo) < new Date())
          .sort((a, b) => new Date(b.fechaTrabajo) - new Date(a.fechaTrabajo))
          .map((c) => (
            <div
              key={c.id}
              className="card-container mb-3 flex justify-between items-center border-l-4 border-gray-400 bg-gray-50"
            >
              <div>
                <b className="text-gray-800">{c.titulo}</b>
                <p className="text-sm text-gray-600">
                  {new Date(c.fechaTrabajo).toLocaleString("es-EC")} • Estado:{" "}
                  <span className="text-gray-600 font-semibold">
                    {c.estado}
                  </span>
                </p>
                <p className="text-xs italic text-gray-500 mt-1">Finalizada</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded"
                  onClick={() => setModalData(c)}
                >
                  Ver detalles
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  onClick={() => deleteConvocation(c.id, c.estado)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
      )}

      {/* ============================ MODAL DE CREACIÓN ============================ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-3/4 lg:w-1/2 p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-3 right-4 text-gray-500 hover:text-black"
            >
              ✖
            </button>
            <h3 className="text-xl font-semibold text-blue-700 mb-4">
              Nueva Convocatoria
            </h3>

            {/* FORMULARIO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              <input
                className="border p-2 rounded"
                placeholder="Título"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />

              <input
                className="border p-2 rounded"
                type="datetime-local"
                value={fechaTrabajo}
                onChange={(e) => setFechaTrabajo(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />

              <select
                className="border p-2 rounded"
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
              >
                <option value="">Seleccione un área</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              className="border p-2 rounded w-full mb-4"
              placeholder="Descripción"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />

            {/* ================================= EMPLEADOS ================================= */}
            {selectedAreaId && (
              <div className="mb-4">
                <p className="font-semibold mb-2 text-gray-700">
                  Empleados disponibles en{" "}
                  <b>
                    {areas.find((a) => a.id === Number(selectedAreaId))?.nombre}
                  </b>
                  :
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {employees
                    .filter((e) => e.areaId === Number(selectedAreaId))
                    .map((emp) => {
                      const penalizado = isPenalized(emp);

                      return (
                        <label
                          key={emp.id}
                          className={`p-3 rounded-lg shadow-sm border flex flex-col justify-between transition cursor-pointer ${
                            penalizado
                              ? "bg-red-100 border-red-400 opacity-70"
                              : selectedEmployees.includes(emp.id)
                              ? "bg-blue-100 border-blue-500"
                              : "bg-white border-gray-200 hover:border-blue-400"
                          }`}
                          title={
                            penalizado
                              ? "Empleado NO seleccionable: Penalización activa"
                              : ""
                          }
                        >
                          <div className="flex items-center justify-between">
                            <input
                              type="checkbox"
                              disabled={penalizado}
                              checked={selectedEmployees.includes(emp.id)}
                              onChange={() => toggleEmployee(emp)}
                              className="accent-blue-600"
                            />

                            <span
                              className={`text-sm font-semibold ${
                                penalizado ? "text-red-700" : "text-gray-800"
                              }`}
                            >
                              {emp.nombres} {emp.apellidos}
                            </span>
                          </div>

                          {penalizado && (
                            <p className="text-xs mt-1 text-red-600 font-semibold">
                              Penalización activa
                            </p>
                          )}
                        </label>
                      );
                    })}
                </div>
              </div>
            )}

            {/* EMPLEADOS SELECCIONADOS */}
            {selectedEmployees.length > 0 && (
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg shadow-md mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-blue-800 text-lg">
                    Empleados seleccionados ({selectedEmployees.length})
                  </h3>
                  <button
                    onClick={() => setSelectedEmployees([])}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Limpiar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {employees
                    .filter((e) => selectedEmployees.includes(e.id))
                    .map((e) => (
                      <div
                        key={e.id}
                        className="p-3 bg-white border border-blue-300 rounded-lg flex justify-between items-center shadow-sm"
                      >
                        <div>
                          <p className="text-sm font-semibold">
                            {e.nombres} {e.apellidos}
                          </p>

                          <p className="text-xs italic text-gray-600">
                            {e.area?.nombre}
                          </p>
                        </div>

                        <button
                          className="text-red-600 text-xs font-bold hover:underline"
                          onClick={() => toggleEmployee(e)}
                        >
                          ✖
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <button
              className="btn-primary w-full py-2 mt-3"
              onClick={createConvocation}
            >
              Guardar convocatoria
            </button>
          </div>
        </div>
      )}

      {/* ============================ MODAL DETALLES ============================ */}
      {modalData && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-2/3 lg:w-1/2 p-6 relative">
            <button
              onClick={() => setModalData(null)}
              className="absolute top-3 right-4 text-gray-500 hover:text-black"
            >
              ✖
            </button>

            <h3 className="text-xl font-semibold mb-2">{modalData.titulo}</h3>
            <p className="text-sm text-gray-600">
              <b>Fecha:</b>{" "}
              {new Date(modalData.fechaTrabajo).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">
              <b>Estado:</b> {modalData.estado}
            </p>

            <p className="text-sm text-gray-600 mb-3">
              <b>Descripción:</b> {modalData.descripcion || "Sin descripción"}
            </p>

            <h4 className="font-semibold mt-4 mb-2">Empleados convocados:</h4>

            {modalData.Employees?.length ? (
              <ul className="list-disc ml-6 text-sm">
                {modalData.Employees.map((emp) => (
                  <li key={emp.id}>
                    {emp.employee?.nombres} {emp.employee?.apellidos} —{" "}
                    <i>{emp.employee?.area?.nombre}</i> ({emp.estado})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">
                No hay empleados asociados.
              </p>
            )}

            {modalData.estado === "BORRADOR" && (
              <button
                className="btn-primary mt-4"
                onClick={() => sendEmails(modalData.id)}
              >
                Enviar correos
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
