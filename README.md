# Panel de Acceso VIP para Telegram

Proyecto web listo para publicar y conectado al proyecto Firebase `diamantes-pro-players-pro`.

## Qué incluye

- Sitio público y panel administrador en `index.html`.
- Firebase Authentication para el acceso administrativo.
- Cloud Firestore para configuración, perfiles, categorías, testimonios y pedidos.
- Cloud Storage para portadas, videos, capturas de testimonios y comprobantes.
- Reglas listas para Firestore, Storage y Realtime Database.
- Configuración opcional para Firebase Hosting.
- Identidad visual azul Telegram, azul profundo y dorado basada en el logo TELEGVIP definitivo.
- Favicon oficial TELEGVIP preparado para navegadores y móviles, generado directamente desde el mismo logo definitivo.
- Header normal que desaparece al desplazarse por la página.
- Editor administrativo organizado por secciones desplegables.
- Filtro general “Todos” editable y opcional desde Categorías.

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
| `logo-telegvip.webp` | Logo único y optimizado utilizado en header, panel, login y footer |
| `favicon.ico` y `favicon-*.png` | Favicons generados desde el mismo logo TELEGVIP |
| `apple-touch-icon.png` | Ícono para accesos directos en iPhone y iPad |
| `site.webmanifest` | Identidad del sitio cuando se instala como acceso directo |
| `firestore.rules` | Seguridad de Cloud Firestore |
| `storage.rules` | Seguridad de archivos y comprobantes |
| `database.rules.json` | Bloqueo de Realtime Database, que este sitio no utiliza |
| `firebase.json` | Configuración de despliegue y Firebase Hosting |
| `.firebaserc` | Proyecto Firebase predeterminado |
| `ARCHIVOS-A-ELIMINAR.md` | Lista exacta de recursos antiguos que puedes borrar de GitHub |
| `FIREBASE-PASOS.md` | Guía detallada de configuración |
