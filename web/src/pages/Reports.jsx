import React, { useState, useEffect } from "react";
import api from "../api";
import Swal from "sweetalert2";

export default function Reports() {
  const [tipoReporte, setTipoReporte] = useState("");
  const [areas, setAreas] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // =====================================================
  // 🔹 CARGAR ÁREAS AL INICIAR
  // =====================================================
  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    try {
      const { data } = await api.get("/areas");
      setAreas(data);
    } catch (error) {
      console.error("Error al cargar áreas:", error);
    }
  };

  // =====================================================
  // 🔹 GENERAR PDF
  // =====================================================
  const generarPDF = async () => {
    if (!tipoReporte)
      return Swal.fire("Selecciona un tipo de reporte", "", "warning");

    try {
      let endpoint = "";

      switch (tipoReporte) {
        case "empleados-activos":
          endpoint = "/reports/employees/pdf?estado=ACTIVO";
          break;

        case "empleados-inactivos":
          endpoint = "/reports/employees/pdf?estado=INACTIVO";
          break;

        case "empleados-area":
          if (!selectedAreaId)
            return Swal.fire("Selecciona un área antes de generar el reporte", "", "warning");
          endpoint = `/reports/employees/pdf?areaId=${selectedAreaId}`;
          break;

        case "convocatorias-todas":
          endpoint = "/reports/convocations/pdf";
          break;

        case "convocatorias-fechas":
          if (!fechaInicio || !fechaFin)
            return Swal.fire("Selecciona el rango de fechas", "", "warning");
          endpoint = `/reports/convocations/pdf?inicio=${fechaInicio}&fin=${fechaFin}`;
          break;

        default:
          return Swal.fire("Tipo de reporte no reconocido", "", "error");
      }

      const url = `${import.meta.env.VITE_API_BASE}${endpoint}`;
      window.open(url, "_blank"); // 🔹 Abre el PDF en nueva pestaña
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo generar el reporte", "error");
    }
  };

  // =====================================================
  // 🔹 INTERFAZ
  // =====================================================
  return (
    <div className="page-container">
      <h1 className="page-title text-blue-800 font-bold mb-6">Generar Reportes</h1>

      <div className="card-container bg-blue-50 border border-blue-200 p-6 rounded-lg shadow-md w-full max-w-2xl mx-auto space-y-4">
        <h2 className="text-lg font-semibold text-blue-700 mb-3">
          Selecciona el tipo de reporte
        </h2>

        {/* SELECTOR DE TIPO DE REPORTE */}
        <select
          value={tipoReporte}
          onChange={(e) => setTipoReporte(e.target.value)}
          className="border border-blue-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Selecciona un reporte --</option>
          <optgroup label="Empleados">
            <option value="empleados-activos">Empleados Activos</option>
            <option value="empleados-inactivos">Empleados Inactivos</option>
            <option value="empleados-area">Empleados por Área</option>
          </optgroup>
          <optgroup label="Convocatorias">
            <option value="convocatorias-todas">Todas las Convocatorias</option>
            <option value="convocatorias-fechas">Convocatorias por Fechas</option>
          </optgroup>
        </select>

        {/* 🔹 DESPLEGABLE DE ÁREAS */}
        {tipoReporte === "empleados-area" && (
          <select
            className="border border-blue-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500"
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
        )}

        {/* 🔹 CAMPOS DE FECHAS */}
        {tipoReporte === "convocatorias-fechas" && (
          <div className="flex gap-4">
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="border border-blue-300 rounded-lg p-2 flex-1"
            />
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="border border-blue-300 rounded-lg p-2 flex-1"
            />
          </div>
        )}

        {/* 🔹 BOTÓN GENERAR */}
        <button
          onClick={generarPDF}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition-all w-full mt-4"
        >
          Generar PDF
        </button>
      </div>
    </div>
  );
}
