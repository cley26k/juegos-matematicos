/* Ajedrez Academy · configuración del acceso con cuenta.
   Rellena estos dos valores con los de tu proyecto de Supabase
   (Project Settings → API). La clave «anon» es pública por diseño:
   los datos los protegen las reglas de la base de datos, no esta clave.
   Mientras estén vacíos, la app funciona como siempre, sin login. */
window.AA_AUTH = {
  url: 'https://rheldvmzqvxltxndyijs.supabase.co',          // p. ej. 'https://abcdxyz.supabase.co'
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoZWxkdm16cXZ4bHR4bmR5aWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4Nzc0MDMsImV4cCI6MjExMDQ1MzQwM30.BhWKYcx1qlvPajZ2UcmfNUeXAtzKzhICDcrdyzwYsx8',      // la clave «anon public»
  codeLength: 6     // dígitos del código que llega por correo
};
