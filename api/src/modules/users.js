import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { prisma } from '../index.js'

const router = express.Router()

// Configuración de subida
const uploadDir = path.resolve('uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `avatar_${Date.now()}${ext}`)
  },
})

const upload = multer({ storage })

// ================================
// 📸 SUBIR AVATAR DE USUARIO
// ================================
router.post('/:id/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const userId = Number(req.params.id)
    if (!req.file) return res.status(400).json({ error: 'No se subió ninguna imagen' })

    const avatarPath = `/uploads/${req.file.filename}`

    // Guardar en la base de datos
    await prisma.user.update({
      where: { id: userId },
      data: { avatarPath },
    })

    res.json({ avatarPath })
  } catch (err) {
    console.error('Error al subir avatar:', err)
    res.status(500).json({ error: 'Error al subir avatar' })
  }
})

// ================================
// 📋 OTRAS RUTAS DE USUARIOS (si ya las tienes)
// ================================
router.get('/', async (req, res) => {
  const users = await prisma.user.findMany()
  res.json(users)
})

export default router
