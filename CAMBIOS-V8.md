# TELEGVIP V8 — Publicaciones estilo Telegram

Esta versión conserva el diseño moderno y el icono centrado de V7. El cambio principal está en la vista de cada perfil y en su editor administrativo.

## Cambios públicos

- El botón **Descubrir perfil** ahora se llama **Ver perfil**.
- La portada de cada tarjeta también abre el perfil al hacer clic.
- La antigua galería cuadrada fue reemplazada por publicaciones verticales estilo Telegram.
- Cada publicación muestra el avatar, nombre, usuario, fotografía o video y una descripción propia.
- El marco multimedia utiliza proporción **720 × 1080 (2:3)**.
- Las imágenes y videos conservan su proporción y nunca se estiran.
- Las imágenes que no coinciden con el formato se muestran centradas sobre un fondo desenfocado generado con la misma fotografía.
- Se incluyen seis reacciones: ❤️ 🔥 😍 🥵 😈 💋.
- Las tres reacciones con mayor contador aparecen directamente.
- El botón **+** abre las otras tres reacciones encima de la barra.
- Cada visitante puede seleccionar una reacción por publicación y volver a pulsarla para retirarla.
- Los contadores se ordenan automáticamente de mayor a menor.

## Cambios del administrador

Dentro de **Perfiles VIP → Editar perfil**, ahora existe el bloque **Publicaciones de muestra**.

Desde allí puedes:

- Subir varias fotografías o videos.
- Añadir publicaciones mediante una URL.
- Escribir un texto diferente debajo de cada publicación.
- Reemplazar individualmente el archivo de una publicación.
- Eliminar publicaciones.
- Simular el contador inicial de las seis reacciones.

Los archivos continúan guardándose en Firebase Storage y la información se sincroniza en Cloud Firestore.

## Reacciones reales en Firebase

V8 incluye una colección segura para registrar las reacciones reales de los visitantes. Cada usuario anónimo puede mantener solamente una reacción por publicación.

Debes publicar nuevamente el archivo `firestore.rules` incluido en esta versión.
