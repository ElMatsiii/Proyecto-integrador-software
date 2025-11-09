# Proyecto-integrador-software
instalar node js
se pone esto en power shell Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
luego esto npm init -y
si da un error de este estilo npm error code EPERM npm error syscall open npm error path C:\WINDOWS\System32\package.json npm error errno -4048 npm error Error: EPERM: operation not permitted, open
copiarlo con tu ruta del proyecto cd "C:\Users\maxim\Documents\GitHub\Proyecto-integrador-software"
npm init -y
luego ir a la terminal del proyecto y copiar npm init -y
luego npm install axios
luego node proxy.js

## Configuración de la Base de Datos

Requisitos
Docker y Docker Compose instalados

Instalación
Clona el repositorio
Ejecuta:
   docker-compose up -d

La base de datos estará disponible en localhost:5432

Credenciales por defecto
Host: localhost
Puerto: 5432
Usuario: postgres
Contraseña: postgres
Base de datos: postgres