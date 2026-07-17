# Actualización V11

Consulta `CAMBIOS-V11.md` para la sección de capturas reales, Grupo VIP y corrección del panel lateral.

# TELEGVIP V10

Versión con perfil compacto, publicaciones profesionales y editor administrativo con scroll completo.

## TELEGVIP — Versión V8 · Publicaciones estilo Telegram

# Panel de Acceso VIP para Telegram

Proyecto web listo para publicar y conectado al proyecto Firebase `diamantes-pro-players-pro`.

## Qué incluye

- Sitio público y panel administrador en `index.html`.
- Firebase Authentication para el acceso administrativo.
- Cloud Firestore para configuración, perfiles, categorías, testimonios, pedidos y reacciones.
- Cloud Storage para portadas, videos, capturas de testimonios y comprobantes.
- Reglas listas para Firestore, Storage y Realtime Database.
- Configuración opcional para Firebase Hosting.
- Identidad visual joven en azul Telegram, violeta y rosa.
- Perfiles mostrados como publicaciones verticales estilo Telegram.
- Descripciones independientes y seis reacciones configurables por publicación.
- Favicon oficial TELEGVIP preparado para navegadores y móviles, generado directamente desde el mismo logo definitivo.
- Header profesional y adaptable a escritorio y móviles.
- Editor administrativo organizado por secciones desplegables.
- Filtro general “Todos” editable y opcional desde Categorías.
- Reacciones reales sincronizadas mediante Firebase Authentication anónima y Cloud Firestore.

## Publicar el código en GitHub

1. Descomprime el ZIP.
2. Crea un repositorio vacío en GitHub.
3. Sube **el contenido de esta carpeta**, no solamente el archivo ZIP. En GitHub debes reemplazar también los archivos de favicon y logo.
4. Comprueba que `index.html` esté en la raíz del repositorio.

No se necesita compilar ni instalar dependencias: es un sitio HTML estático.

## Probarlo localmente

No abras `index.html` con `file://`, porque Firebase Authentication puede bloquear ese origen. Desde esta carpeta ejecuta una de estas opciones:

```bash
npx serve .
```

o:

```bash
python3 -m http.server 5500
```

Después abre la dirección local indicada por el comando.

## Publicar con GitHub Pages

1. En GitHub entra en **Settings > Pages**.
2. Selecciona la rama principal y la carpeta raíz del repositorio.
3. Cuando GitHub muestre la dirección pública, agrégala en Firebase Console: **Authentication > Configuración > Dominios autorizados**.

## Publicar con Firebase Hosting

Este repositorio ya incluye `firebase.json` y `.firebaserc`.

```bash
npm install -g firebase-tools
firebase login
firebase use diamantes-pro-players-pro
firebase deploy --only hosting
```

## Instalar las reglas con Firebase CLI

Primero revisa los tres archivos de reglas. Todos ya apuntan al administrador con UID:

```text
nMOQ6jgrGWQGK6NFBroiZIT8gKH2
```

Luego puedes publicarlas por separado:

```bash
firebase deploy --only firestore:rules
firebase deploy --only database
firebase deploy --only storage
```

También puedes publicar todo lo configurado en una sola operación:

```bash
firebase deploy
```

Consulta `FIREBASE-PASOS.md` antes de publicar las reglas.

## Inicio de sesión del administrador

Usa en el panel el correo y contraseña del usuario de Firebase Authentication cuyo UID es `nMOQ6jgrGWQGK6NFBroiZIT8gKH2`. No pongas esa contraseña en GitHub ni dentro del HTML.

El primer inicio autorizado migra el contenido inicial del navegador a Firestore. A partir de ahí, los cambios del panel se sincronizan en tiempo real.

## Importante sobre Storage

La carga de fotos, videos y comprobantes necesita que Cloud Storage esté habilitado. Si Firebase solicita el plan Blaze para crear o utilizar el bucket, completa ese paso antes de probar las cargas. El catálogo público puede abrirse mientras tanto.

## Seguridad

- La configuración web de Firebase y la API key presentes en `index.html` identifican la aplicación web; no son una contraseña.
- Nunca publiques una cuenta de servicio, una clave privada, contraseñas, tokens de Telegram, secretos de Stripe o claves secretas de otros proveedores.
- Los enlaces privados de acceso al canal se guardan en pedidos protegidos; no deben escribirse en colecciones públicas.

## Archivos

| Archivo | Función |
| --- | --- |
| `index.html` | Página pública, checkout y panel administrador |
| `logo-telegvip.svg`, `.png` y `.webp` | Logo corregido, transparente, 5 % más pequeño y centrado |
| `favicon.ico` y `favicon-*.png` | Favicons generados desde el mismo logo TELEGVIP |
| `apple-touch-icon.png` | Ícono para accesos directos en iPhone y iPad |
| `site.webmanifest` | Identidad del sitio cuando se instala como acceso directo |
| `firestore.rules` | Seguridad de Cloud Firestore, pedidos y reacciones |
| `storage.rules` | Seguridad de archivos y comprobantes |
| `database.rules.json` | Bloqueo de Realtime Database, que este sitio no utiliza |
| `firebase.json` | Configuración de despliegue y Firebase Hosting |
| `.firebaserc` | Proyecto Firebase predeterminado |
| `FIREBASE-PASOS.md` | Guía detallada de configuración |


## Publicaciones y reacciones V8

La antigua galería fue reemplazada por publicaciones en formato 720 × 1080. Desde el administrador puedes subir cada foto o video, escribir su descripción y configurar los seis contadores iniciales. Las reacciones de los visitantes se guardan en Firebase y se ordenan de mayor a menor. Debes volver a publicar `firestore.rules`.

## Corrección del icono V7

El área azul conserva el mismo tamaño visible. Solo el avión y la insignia interna se redujeron 5 % y se centraron ópticamente. Los archivos SVG, PNG, WebP, ICO y Apple Touch Icon tienen transparencia fuera del cuadro azul. Para evitar que el navegador muestre el recurso anterior, reemplaza también `index.html` y recarga con `Ctrl + F5`.
