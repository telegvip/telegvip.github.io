# TELEGVIP V14 — pagos, comprobantes y seguimiento

## Checkout

- El nombre de ejemplo ahora es `Juan Pérez`.
- El correo electrónico es obligatorio.
- WhatsApp y usuario de Telegram son opcionales.
- Antes de enviar el comprobante se muestran nuevamente el nombre y correo, con un botón para corregirlos.
- El comprador puede elegir entre:
  - Tarjeta mediante el enlace Meru configurado.
  - USDT.
  - USDC.
  - Binance Pay.
- USDT y USDC tienen QR, red y dirección configurables por separado.
- El comprobante sigue guardándose en Firebase Storage y la solicitud en Firestore.
- La confirmación informa que la revisión manual puede demorar de 0 a 3 horas.

## Panel administrador

En **Pagos y contacto** ahora se pueden configurar:

- Enlace Meru.
- Procesador de tarjetas.
- QR, red y dirección de USDT.
- QR, red y dirección de USDC.
- QR y Pay ID de Binance Pay.
- Tiempo estimado de revisión.
- Texto sobre la entrega del enlace.

En cada perfil puedes decidir si las cantidades se muestran como `+400` o `400`.

Las solicitudes ahora guardan y muestran:

- Nombre.
- Correo.
- WhatsApp.
- Telegram.
- Método de pago.
- Activo y red utilizados.
- Comprobante.
- Estado.
- Enlace VIP entregado.

## Mis accesos

Se añadió **Mis accesos** en la cabecera. El comprador puede consultar desde el mismo navegador:

- Solicitud en revisión.
- Pago verificado.
- Acceso aprobado.
- Solicitud rechazada.
- Enlace único para entrar al grupo cuando el administrador lo publique.

El historial utiliza Firebase Authentication anónima y `localStorage`; no exige registro ni contraseña. Si se borran los datos del navegador, se pierde la referencia local de ese dispositivo.

## Actividad de compras

La animación bajo el perfil utiliza únicamente compras reales que el administrador haya marcado como verificadas o entregadas. Los datos se muestran de forma anónima y rotan cada 10 a 15 segundos.

No se generan compras, nombres ni usuarios falsos.

## Notificación privada por Telegram

Se incluyó la función opcional `notifyTelegramVipOrder` dentro de `functions/`. Al desplegarla y configurar sus secretos, envía al chat privado del administrador:

- Datos de la solicitud.
- Método de pago.
- Importe.
- Comprobante.

El token del bot no se coloca en el HTML ni en GitHub.
