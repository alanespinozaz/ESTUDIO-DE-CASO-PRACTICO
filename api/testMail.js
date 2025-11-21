// testMail.js
import dotenv from 'dotenv'
dotenv.config({ path: './.env' }) // 👈 Carga el .env manualmente

import nodemailer from 'nodemailer'

async function main() {
  console.log('📨 Variables cargadas:', {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS ? '*** oculto ***' : 'NO DEFINIDO',
  })

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  })

  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: 'test@example.com',
      subject: 'Correo de prueba desde Mailtrap',
      text: '¡Esto es una prueba de Mailtrap!',
    })

    console.log('✅ Correo enviado correctamente:', info.messageId)
  } catch (err) {
    console.error('❌ Error al enviar correo:', err)
  }
}

main()
