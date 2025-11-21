import xlsx from 'xlsx'

export function buildEmployeesTemplate() {
  const headers = ['cedula','nombres','apellidos','email','telefono','cargo','area_nombre','fecha_ingreso','estado','notas']
  const ws = xlsx.utils.aoa_to_sheet([headers])
  const wb = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(wb, ws, 'Empleados')
  const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return buf
}
