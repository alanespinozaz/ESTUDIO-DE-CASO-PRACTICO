import React, { useEffect, useState } from "react";
import api from "../api";
import Swal from "sweetalert2";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [areas, setAreas] = useState([]);

  // Modal formulario empleado
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Modal penalizaciones generales
  const [showPenModal, setShowPenModal] = useState(false);
  const [allPenalties, setAllPenalties] = useState([]);

  // Formulario empleado
  const [form, setForm] = useState({
    id: null,
    cedula: "",
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
    direccion: "",
    areaId: "",
    estado: "ACTIVO",
  });

  const [search, setSearch] = useState("");

  // Cargar empleados + áreas
  const loadData = async () => {
    const [resEmp, resArea] = await Promise.all([
      api.get("/employees"),
      api.get("/areas"),
    ]);

    setEmployees(resEmp.data);
    setAreas(resArea.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Manejar inputs
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const showToast = (title, icon = "success") => {
    Swal.fire({
      title,
      icon,
      timer: 2000,
      toast: true,
      position: "top-end",
      showConfirmButton: false,
    });
  };

  // GUARDAR / ACTUALIZAR EMPLEADO
  const handleSave = async () => {
    if (!form.cedula || !form.nombres || !form.apellidos || !form.areaId || !form.email) {
      Swal.fire("Campos incompletos", "Faltan datos obligatorios", "warning");
      return;
    }

    try {
      if (editMode) {
        await api.put(`/employees/${form.id}`, form);
        showToast("Empleado actualizado");
      } else {
        await api.post("/employees", form);
        showToast("Empleado agregado");
      }

      setShowModal(false);
      setEditMode(false);
      resetForm();
      loadData();
    } catch (err) {
      Swal.fire("Error", "No se pudieron guardar los datos", "error");
    }
  };

  // RESETEAR FORMULARIO
  const resetForm = () => {
    setForm({
      id: null,
      cedula: "",
      nombres: "",
      apellidos: "",
      email: "",
      telefono: "",
      direccion: "",
      areaId: "",
      estado: "ACTIVO",
    });
  };

  // EDITAR EMPLEADO (CORREGIDO)
  const handleEdit = (emp) => {
    setForm({
      id: emp.id,
      cedula: emp.cedula,
      nombres: emp.nombres,
      apellidos: emp.apellidos,
      email: emp.email,
      telefono: emp.telefono || "",
      direccion: emp.direccion || "",
      areaId: emp.areaId,   // ← SOLO AREAID
      estado: emp.estado,
    });

    setEditMode(true);
    setShowModal(true);
  };

  // ELIMINAR EMPLEADO
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar?",
      text: "No se puede deshacer",
      icon: "warning",
      showCancelButton: true,
    });

    if (confirm.isConfirmed) {
      await api.delete(`/employees/${id}`);
      showToast("Empleado eliminado");
      loadData();
    }
  };

  // CARGAR TODAS LAS PENALIZACIONES
  const loadAllPenalties = async () => {
    try {
      const { data } = await api.get("/penalties");
      setAllPenalties(data);
      setShowPenModal(true);
    } catch {
      Swal.fire("Error", "No se pudieron cargar penalizaciones", "error");
    }
  };

  // FILTRO DE BÚSQUEDA
  const filtered = employees.filter(
    (e) =>
      e.cedula.toLowerCase().includes(search.toLowerCase()) ||
      e.nombres.toLowerCase().includes(search.toLowerCase()) ||
      e.apellidos.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <h1 className="page-title text-blue-800 font-bold mb-4">Gestión de Empleados</h1>

      {/* Barra superior */}
      <div className="flex flex-wrap gap-2 items-center mb-4 bg-blue-50 border p-3 rounded-lg">
        <input
          className="border rounded-lg p-2 flex-1"
          placeholder="Buscar por cédula o nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg"
          onClick={loadAllPenalties}
        >
          Ver penalizaciones
        </button>

        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
          onClick={() => {
            resetForm();
            setEditMode(false);
            setShowModal(true);
          }}
        >
          Agregar empleado
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white border rounded-xl shadow p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-blue-100 text-blue-800">
              <th>#</th>
              <th>Cédula</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Área</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th>Estado</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-4 text-gray-500">
                  No hay empleados
                </td>
              </tr>
            ) : (
              filtered.map((e, i) => (
                <tr key={e.id} className="border-t text-center">
                  <td>{i + 1}</td>
                  <td>{e.cedula}</td>
                  <td>{e.nombres}</td>
                  <td>{e.apellidos}</td>
                  <td>{e.area?.nombre}</td>
                  <td>{e.email}</td>
                  <td>{e.telefono}</td>
                  <td>{e.direccion}</td>
                  <td className={e.estado === "ACTIVO" ? "text-green-600" : "text-red-500"}>
                    {e.estado}
                  </td>
                  <td>
                    <div className="flex justify-center gap-2">
                      <button
                        className="bg-yellow-400 px-3 py-1 rounded text-white"
                        onClick={() => handleEdit(e)}
                      >
                        Editar
                      </button>

                      <button
                        className="bg-red-500 px-3 py-1 rounded text-white"
                        onClick={() => handleDelete(e.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Penalizaciones */}
      {showPenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white w-11/12 md:w-2/3 rounded-xl shadow-lg p-6 relative">
            <button
              className="absolute top-3 right-4 text-xl text-gray-500 hover:text-black"
              onClick={() => setShowPenModal(false)}
            >
              ✖
            </button>

            <h2 className="text-2xl font-bold text-purple-700 text-center mb-4">
              Penalizaciones registradas
            </h2>

            {allPenalties.length === 0 ? (
              <p className="text-gray-500 text-center italic">
                No existen penalizaciones registradas
              </p>
            ) : (
              <ul className="max-h-96 overflow-y-auto space-y-3">
                {allPenalties.map((p) => (
                  <li key={p.id} className="border p-3 rounded bg-purple-50">
                    <p><strong>Empleado:</strong> {p.employee?.nombres} {p.employee?.apellidos}</p>
                    <p><strong>Cédula:</strong> {p.employee?.cedula}</p>
                    <p><strong>Motivo:</strong> {p.motivo}</p>
                    <p><strong>Inicio:</strong> {new Date(p.fechaInicio).toLocaleDateString()}</p>
                    <p><strong>Fin:</strong> {new Date(p.fechaFin).toLocaleDateString()}</p>
                    <p><strong>Activo:</strong> {p.activo ? "Sí" : "No"}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Modal Empleado */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white w-11/12 md:w-2/3 lg:w-1/2 rounded-xl shadow-lg p-6 relative">
            <button
              className="absolute top-3 right-4 text-gray-500 hover:text-black text-xl"
              onClick={() => setShowModal(false)}
            >
              ✖
            </button>

            <h2 className="text-xl font-semibold text-blue-700 mb-4 text-center">
              {editMode ? "Editar empleado" : "Registrar nuevo empleado"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label>Cédula *</label>
                <input
                  name="cedula"
                  value={form.cedula}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label>Nombres *</label>
                <input
                  name="nombres"
                  value={form.nombres}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label>Apellidos *</label>
                <input
                  name="apellidos"
                  value={form.apellidos}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label>Teléfono</label>
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label>Dirección</label>
                <input
                  name="direccion"
                  value={form.direccion}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label>Área *</label>
                <select
                  name="areaId"
                  value={form.areaId}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                >
                  <option value="">Seleccione un área</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Estado</label>
                <select
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>

              <button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                {editMode ? "Actualizar" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
