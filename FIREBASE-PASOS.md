# Panel de Acceso VIP para Telegram — activación de Firebase

Proyecto conectado: `diamantes-pro-players-pro`

Administrador autorizado: `nMOQ6jgrGWQGK6NFBroiZIT8gKH2`

## 1. Publicar las reglas de Firestore

1. Abre Firebase Console.
2. Entra en **Firestore → Reglas**.
3. Reemplaza el contenido completo por el archivo `firestore.rules`.
4. Pulsa **Publicar**.

Las reglas permiten lectura pública del catálogo, pero solamente el UID autorizado puede modificar el contenido o gestionar solicitudes.

## 2. Bloquear Realtime Database

Este proyecto no utiliza Realtime Database.

1. Entra en **Realtime Database → Reglas**.
2. Pega el contenido de `database.rules.json`.
3. Pulsa **Publicar**.

Esto evita que la base creada accidentalmente pueda recibir datos.

## 3. Activar Cloud Storage

Cloud Storage requiere el plan Blaze.

1. Actualiza el proyecto a Blaze.
2. Entra en **Storage → Comenzar**.
3. Utiliza modo de producción.
4. Cuando se cree el bucket, abre **Storage → Reglas**.
5. Reemplaza las reglas por el contenido de `storage.rules`.
6. Pulsa **Publicar**.

Las reglas aceptan:

- Fotos o videos administrativos de hasta 100 MB por archivo.
- Comprobantes JPG, PNG o WEBP de hasta 10 MB.
- Lectura de comprobantes únicamente para el comprador propietario o el administrador.

## 4. Probar el panel

No abras el HTML directamente mediante `file://`. Utiliza Firebase Hosting, tu hosting HTTPS o un servidor local.

1. Abre la página.
2. Pulsa **Administrar**.
3. Ingresa el correo y contraseña creados en Firebase Authentication.
4. El UID debe coincidir exactamente con el autorizado.
5. En el primer acceso, el contenido local se migrará automáticamente a Firestore.
6. En **Resumen**, puedes pulsar **Sincronizar todo con Firebase** para repetir una sincronización completa.

## 5. Comprobar la migración

En Firestore deben aparecer estas colecciones:

- `telegramVip_site`
- `telegramVip_profiles`
- `telegramVip_categories`
- `telegramVip_testimonials`
- `telegramVip_orders`

## 6. Flujo de comprobantes

Después de configurar Storage:

1. Un cliente elige un perfil.
2. Ingresa su nombre y correo opcional.
3. Abre el enlace Meru configurado para ese perfil.
4. Adjunta una imagen del comprobante.
5. Firebase Authentication crea una sesión anónima.
6. Storage guarda la captura en una carpeta privada del comprador.
7. Firestore crea la solicitud.
8. El administrador la ve en **Solicitudes** y **Comprobantes**.
9. El administrador puede marcarla como verificada, registrar el enlace VIP y marcar el acceso como entregado.

## 7. Seguridad importante

- No publiques la contraseña del administrador.
- No incluyas archivos de cuentas de servicio dentro del HTML.
- No pongas claves secretas de Stripe ni tokens de Telegram en Firestore.
- El token del futuro bot de Telegram se guardará con Secret Manager y Cloud Functions.
