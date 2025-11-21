import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  try {
    let token = null

    // Buscar token en headers
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    }

    // Permitir token por query param (para PDFs, descargas, etc.)
    if (!token && req.query.token) {
      token = req.query.token
    }

    if (!token) return res.status(401).json({ error: 'No token' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey')
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

// 🔹 Middleware para control de roles
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ error: 'No autenticado' })

    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: 'Acceso denegado: rol no autorizado' })

    next()
  }
}
