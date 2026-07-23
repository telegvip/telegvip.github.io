"use strict";

const crypto = require("crypto");
const {setGlobalOptions} = require("firebase-functions/v2/options");
const {onRequest, onCall, HttpsError} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onDocumentCreated, onDocumentUpdated} = require("firebase-functions/v2/firestore");
const {defineSecret} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue, Timestamp} = require("firebase-admin/firestore");
const {getMessaging} = require("firebase-admin/messaging");

initializeApp();
setGlobalOptions({region: "us-central1", maxInstances: 5});

const TELEGRAM_BOT_TOKEN = defineSecret("TELEGRAM_BOT_TOKEN");
const TELEGRAM_WEBHOOK_SECRET = defineSecret("TELEGRAM_WEBHOOK_SECRET");

const PROJECT_ID = "diamantes-pro-players-pro";
const ADMIN_UID = "nMOQ6jgrGWQGK6NFBroiZIT8gKH2";
const TELEGRAM_WEBHOOK_URL = `https://us-central1-${PROJECT_ID}.cloudfunctions.net/telegramWebhook`;

const ORDERS = "telegramVip_orders";
const ADMIN_DEVICE_PATH = `telegramVip_admin_devices/${ADMIN_UID}/tokens`;
const TELEGRAM_CHANNELS = "telegramVip_telegram_channels";
const TELEGRAM_ACCESSES = "telegramVip_telegram_accesses";
const DEFAULT_CHANNEL_KEY = "clara-mt";
const DEFAULT_CHANNEL = {
  key: DEFAULT_CHANNEL_KEY,
  title: "VIP Clara MT",
  chatId: "-1004386572644",
};

function db() {
  return getFirestore();
}

function requireAdmin(request) {
  if (!request.auth || request.auth.uid !== ADMIN_UID) {
    throw new HttpsError("permission-denied", "Solo el administrador puede realizar esta acción.");
  }
}

function safeEqual(a, b) {
  const first = Buffer.from(String(a || ""));
  const second = Buffer.from(String(b || ""));
  return first.length === second.length && crypto.timingSafeEqual(first, second);
}

async function telegramApi(method, payload = {}) {
  const token = TELEGRAM_BOT_TOKEN.value();
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) {
    const message = result.description || `Telegram respondió HTTP ${response.status}`;
    const error = new Error(message);
    error.telegram = result;
    throw error;
  }
  return result.result;
}

async function getAdminTokens() {
  const snapshot = await db().collection(ADMIN_DEVICE_PATH).get();
  return snapshot.docs
      .map((doc) => ({id: doc.id, token: doc.get("token")}))
      .filter((item) => item.token);
}

function notificationChannel(type) {
  return type === "proof_received" ? "telegvip_payment_proofs" : "telegvip_new_requests";
}

async function sendToAdmin({title, body, orderId, type}) {
  const devices = await getAdminTokens();
  if (!devices.length) {
    logger.warn("No hay dispositivos administradores registrados.");
    return;
  }
  const response = await getMessaging().sendEachForMulticast({
    tokens: devices.map((item) => item.token),
    notification: {title, body},
    data: {
      title,
      body,
      orderId: String(orderId || ""),
      type: String(type || "new_order"),
    },
    android: {
      priority: "high",
      notification: {
        channelId: notificationChannel(type),
        sound: "default",
        defaultVibrateTimings: true,
        visibility: "private",
      },
    },
  });

  const invalid = [];
  response.responses.forEach((item, index) => {
    if (!item.success) {
      const code = item.error?.code || "";
      logger.warn("Error FCM", {code, deviceId: devices[index].id});
      if (code.includes("registration-token-not-registered") || code.includes("invalid-registration-token")) {
        invalid.push(devices[index].id);
      }
    }
  });
  if (invalid.length) {
    const batch = db().batch();
    invalid.forEach((id) => batch.delete(db().doc(`${ADMIN_DEVICE_PATH}/${id}`)));
    await batch.commit();
  }
}

exports.notifyNewTelegVipOrder = onDocumentCreated(`${ORDERS}/{orderId}`, async (event) => {
  const order = event.data?.data();
  if (!order) return;
  const buyer = order.buyerName || "Nuevo cliente";
  const profile = order.profileTitle || "Acceso VIP";
  const price = Number(order.price || 0).toFixed(0);
  await sendToAdmin({
    title: "Nueva solicitud TELEGVIP",
    body: `${buyer} ingresó sus datos para ${profile} · $${price}`,
    orderId: event.params.orderId,
    type: "new_order",
  });
  await event.data.ref.set({notificationCreatedAt: FieldValue.serverTimestamp()}, {merge: true});
});

exports.notifyTelegVipProofReceived = onDocumentUpdated(`${ORDERS}/{orderId}`, async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  const proofJustArrived = !before.proofUrl && Boolean(after.proofUrl);
  const statusJustPending = before.status !== "pending" && after.status === "pending";
  if (!proofJustArrived && !statusJustPending) return;
  await sendToAdmin({
    title: "Comprobante recibido",
    body: `${after.buyerName || "Un cliente"} envió el comprobante para ${after.profileTitle || "Acceso VIP"}`,
    orderId: event.params.orderId,
    type: "proof_received",
  });
});

exports.setupTelegramWebhook = onRequest(
    {secrets: [TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET], cors: false},
    async (request, response) => {
      if (request.method !== "POST") {
        response.status(405).json({ok: false, error: "Usa POST."});
        return;
      }
      const supplied = request.get("x-telegvip-setup-secret");
      if (!safeEqual(supplied, TELEGRAM_WEBHOOK_SECRET.value())) {
        response.status(403).json({ok: false, error: "Clave de configuración incorrecta."});
        return;
      }
      try {
        await db().collection(TELEGRAM_CHANNELS).doc(DEFAULT_CHANNEL_KEY).set({
          title: DEFAULT_CHANNEL.title,
          chatId: DEFAULT_CHANNEL.chatId,
          active: true,
          protectedContent: true,
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        }, {merge: true});

        const webhook = await telegramApi("setWebhook", {
          url: TELEGRAM_WEBHOOK_URL,
          secret_token: TELEGRAM_WEBHOOK_SECRET.value(),
          allowed_updates: ["chat_member"],
          drop_pending_updates: true,
          max_connections: 10,
        });
        const info = await telegramApi("getWebhookInfo");
        response.json({
          ok: Boolean(webhook),
          channel: DEFAULT_CHANNEL,
          webhookUrl: TELEGRAM_WEBHOOK_URL,
          webhookInfo: info,
        });
      } catch (error) {
        logger.error("No se pudo configurar el webhook", error);
        response.status(500).json({ok: false, error: error.message});
      }
    },
);

exports.telegramWebhook = onRequest(
    {secrets: [TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET], cors: false},
    async (request, response) => {
      if (request.method !== "POST") {
        response.status(405).send("Method not allowed");
        return;
      }
      const supplied = request.get("x-telegram-bot-api-secret-token");
      if (!safeEqual(supplied, TELEGRAM_WEBHOOK_SECRET.value())) {
        response.status(403).send("Forbidden");
        return;
      }

      try {
        const memberEvent = request.body?.chat_member;
        if (memberEvent) await processChatMemberUpdate(memberEvent);
        response.status(200).send("ok");
      } catch (error) {
        logger.error("Error procesando actualización de Telegram", error);
        // Respondemos 200 para evitar una cadena infinita de reintentos de Telegram.
        response.status(200).send("accepted");
      }
    },
);

async function processChatMemberUpdate(event) {
  const chatId = String(event.chat?.id || "");
  const oldStatus = String(event.old_chat_member?.status || "");
  const newStatus = String(event.new_chat_member?.status || "");
  const user = event.new_chat_member?.user;
  const inviteLink = event.invite_link?.invite_link || "";

  const joined = ["left", "kicked"].includes(oldStatus) && ["member", "administrator"].includes(newStatus);
  if (joined && inviteLink && user) {
    const querySnapshot = await db().collection(TELEGRAM_ACCESSES)
        .where("inviteLink", "==", inviteLink)
        .limit(1)
        .get();
    if (querySnapshot.empty) {
      logger.warn("Ingreso con enlace no registrado por TELEGVIP", {chatId, inviteLink});
      return;
    }

    const accessRef = querySnapshot.docs[0].ref;
    const access = querySnapshot.docs[0].data();
    if (access.status !== "link_created") {
      logger.info("El acceso ya había sido procesado", {accessId: accessRef.id, status: access.status});
      return;
    }

    const activatedMillis = Number(event.date || Math.floor(Date.now() / 1000)) * 1000;
    const durationDays = Math.max(1, Math.min(365, Number(access.durationDays || 30)));
    const expiresMillis = activatedMillis + durationDays * 24 * 60 * 60 * 1000;

    try {
      await telegramApi("revokeChatInviteLink", {chat_id: chatId, invite_link: inviteLink});
    } catch (error) {
      logger.warn("No se pudo revocar el enlace tras el ingreso", {error: error.message, accessId: accessRef.id});
    }

    const batch = db().batch();
    batch.set(accessRef, {
      status: "active",
      inviteRevoked: true,
      telegramUserId: String(user.id),
      telegramFirstName: user.first_name || "",
      telegramLastName: user.last_name || "",
      telegramUsername: user.username || "",
      activatedAt: Timestamp.fromMillis(activatedMillis),
      expiresAt: Timestamp.fromMillis(expiresMillis),
      updatedAt: FieldValue.serverTimestamp(),
    }, {merge: true});

    if (access.orderId) {
      batch.set(db().collection(ORDERS).doc(access.orderId), {
        telegramAccessStatus: "active",
        telegramUserId: String(user.id),
        telegramUsername: user.username || "",
        telegramAccessActivatedAt: Timestamp.fromMillis(activatedMillis),
        telegramAccessExpiresAt: Timestamp.fromMillis(expiresMillis),
        telegramInviteRevoked: true,
        updatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});
    }
    await batch.commit();
    logger.info("Acceso Telegram activado", {accessId: accessRef.id, orderId: access.orderId, userId: user.id});
    return;
  }

  const removed = ["member", "administrator", "restricted"].includes(oldStatus) && ["left", "kicked"].includes(newStatus);
  if (removed && user) {
    const snapshot = await db().collection(TELEGRAM_ACCESSES)
        .where("telegramUserId", "==", String(user.id))
        .limit(20)
        .get();
    const matching = snapshot.docs.filter((doc) => {
      const data = doc.data();
      return String(data.chatId || "") === chatId && data.status === "active";
    });
    if (matching.length) {
      const batch = db().batch();
      matching.forEach((doc) => batch.set(doc.ref, {
        status: newStatus === "kicked" ? "removed" : "left",
        removedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, {merge: true}));
      await batch.commit();
    }
  }
}

exports.listTelegramChannels = onCall(async (request) => {
  requireAdmin(request);
  const snapshot = await db().collection(TELEGRAM_CHANNELS).get();
  const channels = snapshot.docs
      .map((doc) => ({key: doc.id, ...doc.data()}))
      .filter((channel) => channel.active !== false && channel.chatId)
      .sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
  if (!channels.length) channels.push({...DEFAULT_CHANNEL, active: true});
  return {ok: true, channels};
});

exports.createTelegramAccess = onCall(
    {secrets: [TELEGRAM_BOT_TOKEN]},
    async (request) => {
      requireAdmin(request);
      const orderId = String(request.data?.orderId || "").trim();
      const channelKey = String(request.data?.channelKey || DEFAULT_CHANNEL_KEY).trim();
      const durationDays = Math.max(1, Math.min(365, Number(request.data?.durationDays || 30)));
      if (!orderId) throw new HttpsError("invalid-argument", "Falta el ID de la solicitud.");

      const orderRef = db().collection(ORDERS).doc(orderId);
      const orderSnapshot = await orderRef.get();
      if (!orderSnapshot.exists) throw new HttpsError("not-found", "La solicitud no existe.");
      const order = orderSnapshot.data();

      const channelSnapshot = await db().collection(TELEGRAM_CHANNELS).doc(channelKey).get();
      if (!channelSnapshot.exists) throw new HttpsError("failed-precondition", "El canal Telegram no está configurado.");
      const channel = channelSnapshot.data();
      if (!channel.active || !channel.chatId) throw new HttpsError("failed-precondition", "El canal Telegram está desactivado.");

      const previousSnapshot = await db().collection(TELEGRAM_ACCESSES)
          .where("orderId", "==", orderId)
          .limit(20)
          .get();
      const previous = previousSnapshot.docs.filter((doc) => doc.data().status === "link_created");
      for (const doc of previous) {
        const old = doc.data();
        if (old.inviteLink) {
          try {
            await telegramApi("revokeChatInviteLink", {chat_id: old.chatId, invite_link: old.inviteLink});
          } catch (error) {
            logger.warn("No se pudo revocar un enlace anterior", {accessId: doc.id, error: error.message});
          }
        }
        await doc.ref.set({status: "replaced", inviteRevoked: true, updatedAt: FieldValue.serverTimestamp()}, {merge: true});
      }

      const linkExpiresMillis = Date.now() + 48 * 60 * 60 * 1000;
      const orderCode = String(order.orderCode || orderId.slice(0, 8));
      const name = `${orderCode} ${durationDays}d`.slice(0, 32);
      let invite;
      try {
        invite = await telegramApi("createChatInviteLink", {
          chat_id: String(channel.chatId),
          name,
          expire_date: Math.floor(linkExpiresMillis / 1000),
          member_limit: 1,
        });
      } catch (error) {
        logger.error("Telegram no pudo crear el enlace", error);
        throw new HttpsError("internal", `Telegram: ${error.message}`);
      }

      const accessRef = db().collection(TELEGRAM_ACCESSES).doc();
      const batch = db().batch();
      batch.set(accessRef, {
        orderId,
        orderCode,
        ownerUid: order.ownerUid || "",
        buyerName: order.buyerName || "",
        buyerEmail: order.buyerEmail || "",
        profileId: order.profileId || "",
        profileTitle: order.profileTitle || "",
        channelKey,
        channelTitle: channel.title || DEFAULT_CHANNEL.title,
        chatId: String(channel.chatId),
        durationDays,
        inviteLink: invite.invite_link,
        inviteName: invite.name || name,
        linkExpiresAt: Timestamp.fromMillis(linkExpiresMillis),
        status: "link_created",
        inviteRevoked: false,
        createdBy: request.auth.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      batch.set(orderRef, {
        status: "delivered",
        accessLink: invite.invite_link,
        durationDays,
        telegramAccessId: accessRef.id,
        telegramAccessStatus: "link_created",
        telegramChannelKey: channelKey,
        telegramChannelId: String(channel.chatId),
        telegramChannelTitle: channel.title || DEFAULT_CHANNEL.title,
        telegramLinkExpiresAt: Timestamp.fromMillis(linkExpiresMillis),
        telegramInviteRevoked: false,
        updatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});
      await batch.commit();

      return {
        ok: true,
        accessId: accessRef.id,
        inviteLink: invite.invite_link,
        linkExpiresAt: linkExpiresMillis,
        durationDays,
        channelTitle: channel.title || DEFAULT_CHANNEL.title,
      };
    },
);

exports.revokeTelegramAccess = onCall(
    {secrets: [TELEGRAM_BOT_TOKEN]},
    async (request) => {
      requireAdmin(request);
      const accessId = String(request.data?.accessId || "").trim();
      if (!accessId) throw new HttpsError("invalid-argument", "Falta el ID del acceso.");
      const ref = db().collection(TELEGRAM_ACCESSES).doc(accessId);
      const snapshot = await ref.get();
      if (!snapshot.exists) throw new HttpsError("not-found", "El acceso no existe.");
      const access = snapshot.data();
      if (access.inviteLink && !access.inviteRevoked) {
        try {
          await telegramApi("revokeChatInviteLink", {chat_id: access.chatId, invite_link: access.inviteLink});
        } catch (error) {
          logger.warn("No se pudo revocar el enlace", {accessId, error: error.message});
        }
      }
      await ref.set({status: "revoked", inviteRevoked: true, revokedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp()}, {merge: true});
      if (access.orderId) {
        await db().collection(ORDERS).doc(access.orderId).set({
          accessLink: "",
          telegramAccessStatus: "revoked",
          telegramInviteRevoked: true,
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});
      }
      return {ok: true};
    },
);

exports.terminateTelegramAccess = onCall(
    {secrets: [TELEGRAM_BOT_TOKEN]},
    async (request) => {
      requireAdmin(request);
      const orderId = String(request.data?.orderId || "").trim();
      const accessId = String(request.data?.accessId || "").trim();
      let accessDoc = null;

      if (accessId) {
        const snapshot = await db().collection(TELEGRAM_ACCESSES).doc(accessId).get();
        if (snapshot.exists) accessDoc = snapshot;
      } else if (orderId) {
        const snapshot = await db().collection(TELEGRAM_ACCESSES)
            .where("orderId", "==", orderId)
            .limit(20)
            .get();
        accessDoc = snapshot.docs
            .sort((a, b) => (b.data().createdAt?.toMillis?.() || 0) - (a.data().createdAt?.toMillis?.() || 0))[0] || null;
      }

      if (!accessDoc) throw new HttpsError("not-found", "No se encontró el acceso de Telegram.");
      const access = accessDoc.data();

      if (access.inviteLink && !access.inviteRevoked) {
        try {
          await telegramApi("revokeChatInviteLink", {
            chat_id: access.chatId,
            invite_link: access.inviteLink,
          });
        } catch (error) {
          logger.warn("No se pudo revocar el enlace al cancelar", {accessId: accessDoc.id, error: error.message});
        }
      }

      if (access.telegramUserId && access.chatId && access.status === "active") {
        try {
          await telegramApi("banChatMember", {
            chat_id: access.chatId,
            user_id: Number(access.telegramUserId),
            revoke_messages: false,
          });
          await telegramApi("unbanChatMember", {
            chat_id: access.chatId,
            user_id: Number(access.telegramUserId),
            only_if_banned: true,
          });
        } catch (error) {
          logger.error("No se pudo retirar al usuario de Telegram", {accessId: accessDoc.id, error: error.message});
          throw new HttpsError("internal", `Telegram: ${error.message}`);
        }
      }

      const targetOrderId = String(access.orderId || orderId || "");
      const batch = db().batch();
      batch.set(accessDoc.ref, {
        status: access.status === "active" ? "removed" : "revoked",
        inviteRevoked: true,
        revokedAt: FieldValue.serverTimestamp(),
        removedAt: access.status === "active" ? FieldValue.serverTimestamp() : null,
        updatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});
      if (targetOrderId) {
        batch.set(db().collection(ORDERS).doc(targetOrderId), {
          accessLink: "",
          telegramAccessStatus: access.status === "active" ? "removed" : "revoked",
          telegramInviteRevoked: true,
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});
      }
      await batch.commit();
      return {ok: true};
    },
);

exports.expireTelegramMemberships = onSchedule(
    {
      schedule: "every 60 minutes",
      timeZone: "America/La_Paz",
      secrets: [TELEGRAM_BOT_TOKEN],
      retryCount: 1,
    },
    async () => {
      const now = Timestamp.now();
      const snapshot = await db().collection(TELEGRAM_ACCESSES)
          .where("expiresAt", "<=", now)
          .limit(200)
          .get();
      const expired = snapshot.docs.filter((doc) => doc.data().status === "active");
      if (!expired.length) return;

      for (const doc of expired) {
        const access = doc.data();
        try {
          await telegramApi("banChatMember", {
            chat_id: access.chatId,
            user_id: Number(access.telegramUserId),
            revoke_messages: false,
          });
          await telegramApi("unbanChatMember", {
            chat_id: access.chatId,
            user_id: Number(access.telegramUserId),
            only_if_banned: true,
          });
          await doc.ref.set({
            status: "expired",
            expiredAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          }, {merge: true});
          if (access.orderId) {
            await db().collection(ORDERS).doc(access.orderId).set({
              accessLink: "",
              telegramAccessStatus: "expired",
              telegramAccessExpiredAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            }, {merge: true});
          }
        } catch (error) {
          logger.error("No se pudo retirar una membresía vencida", {accessId: doc.id, error: error.message});
        }
      }
    },
);
