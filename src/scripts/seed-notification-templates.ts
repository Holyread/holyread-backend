import { LanguageModel } from "../models/language.model";
import { NotificationTemplateModel } from "../models";
import { NOTIFICATION_TEMPLATE } from "../constants/notificationTemplate.constant";

/**
 * Seed data for notification templates.
 * Each entry maps to a { type, title, description } per language code.
 */
const TEMPLATE_SEED_DATA: Array<{
  type: string;
  translations: {
    en: { title: string; description: string };
    es: { title: string; description: string };
  };
}> = [
  // ─── Welcome ───────────────────────────────────────────────────────────────
  {
    type: NOTIFICATION_TEMPLATE.welcome,
    translations: {
      en: {
        title: "Welcome to Holy Reads 🎉",
        description:
          "Summarizing the best of Christian publishing for your busy schedule 📚",
      },
      es: {
        title: "Bienvenido a Holy Reads 🎉",
        description:
          "Lo mejor de la literatura cristiana, en versión breve para tu día a día. 📚",
      },
    },
  },

  // ─── Plans ─────────────────────────────────────────────────────────────────
  {
    type: NOTIFICATION_TEMPLATE.freeAccess,
    translations: {
      en: {
        title: "Holy Reads Free access 🔔",
        description:
          "Enjoy unlimited free access with Holy Reads best summaries 📚",
      },
      es: {
        title: "Holy Reads Acceso gratuito 🔔",
        description:
          "Disfruta de acceso gratuito ilimitado con Holy Reads mejores resúmenes 📚",
      },
    },
  },
  {
    type: NOTIFICATION_TEMPLATE.freePlan,
    translations: {
      en: {
        title: "Holy Reads Free Plan 🔔",
        description:
          "Enjoy unlimited free access with Holy Reads best summaries 📚",
      },
      es: {
        title: "Holy Reads Plan gratuito 🔔",
        description:
          "Disfruta de acceso gratuito ilimitado con Holy Reads mejores resúmenes 📚",
      },
    },
  },

  // ─── Account ───────────────────────────────────────────────────────────────
  {
    type: NOTIFICATION_TEMPLATE.changePassword,
    translations: {
      en: {
        title: "Change Password",
        description:
          "A request has been received to change your Holy Reads account password.",
      },
      es: {
        title: "Cambiar contraseña",
        description:
          "Se ha recibido una solicitud para cambiar la contraseña de su cuenta Holy Reads.",
      },
    },
  },
  {
    type: NOTIFICATION_TEMPLATE.emailAuthEnabled,
    translations: {
      en: {
        title: "Email auth enabled",
        description:
          "Now you can access Holy Reads by using your email and password",
      },
      es: {
        title: "Autenticación de correo electrónico habilitada",
        description:
          "Ahora puedes acceder a Holy Reads usando tu correo electrónico y contraseña",
      },
    },
  },
  {
    type: NOTIFICATION_TEMPLATE.passwordChanged,
    translations: {
      en: {
        title: "Password Changed Successfully",
        description:
          "Now you can access Holy Reads by using your email and password",
      },
      es: {
        title: "Contraseña cambiada correctamente",
        description:
          "Ahora puedes acceder a Holy Reads usando tu correo electrónico y contraseña",
      },
    },
  },

  // ─── Kindle ────────────────────────────────────────────────────────────────
  {
    type: NOTIFICATION_TEMPLATE.addKindleEmail,
    translations: {
      en: {
        title: "Add Kindle Email",
        description:
          "Add your Kindle email to start receiving summaries on your device.",
      },
      es: {
        title: "Agregar correo electrónico de Kindle",
        description:
          "Agrega tu correo de Kindle para recibir resúmenes en tu dispositivo.",
      },
    },
  },
  {
    type: NOTIFICATION_TEMPLATE.updateKindleEmail,
    translations: {
      en: {
        title: "Update Kindle Email",
        description:
          "Update your Kindle email to keep receiving summaries on your device.",
      },
      es: {
        title: "Actualizar correo electrónico de Kindle",
        description:
          "Actualiza tu correo de Kindle para seguir recibiendo resúmenes en tu dispositivo.",
      },
    },
  },
  {
    type: NOTIFICATION_TEMPLATE.kindleEmailAdded,
    translations: {
      en: {
        title: "Kindle email added",
        description: "Your Kindle email has been added successfully.",
      },
      es: {
        title: "Correo de Kindle añadido",
        description: "Tu correo de Kindle ha sido añadido exitosamente.",
      },
    },
  },
  {
    type: NOTIFICATION_TEMPLATE.kindleEmailUpdated,
    translations: {
      en: {
        title: "Kindle email updated",
        description: "Your Kindle email has been updated successfully.",
      },
      es: {
        title: "Correo electrónico de Kindle actualizado",
        description:
          "Tu correo electrónico de Kindle ha sido actualizado exitosamente.",
      },
    },
  },
  {
    type: NOTIFICATION_TEMPLATE.kindleSync,
    translations: {
      en: {
        title: "🔔 Sync your favorite books with your Kindle account for free!",
        description:
          "📙 Click here to finish setting it up begin reading Holy Reads on your Kindle.",
      },
      es: {
        title:
          "🔔 ¡Sincroniza tus libros favoritos con tu cuenta de Kindle gratis!",
        description:
          "📙 Haz clic aquí para terminar de configurarlo y comenzar a leer Holy Reads en tu Kindle.",
      },
    },
  },

  // ─── Subscription ──────────────────────────────────────────────────────────
  {
    type: NOTIFICATION_TEMPLATE.subscriptionActivated,
    translations: {
      en: {
        title: "Holy Reads Subscription",
        description:
          "Holy Reads {duration} subscription has been activated! 🎉",
      },
      es: {
        title: "Holy Reads Suscripción",
        description:
          "¡La suscripción de Holy Reads por {duration} ha sido activada! 🎉",
      },
    },
  },
  {
    type: NOTIFICATION_TEMPLATE.subscriptionCancelled,
    translations: {
      en: {
        title: "Holy Reads Subscription Canceled ⛔",
        description: "Your Holy Reads {duration} Subscription Canceled",
      },
      es: {
        title: "Holy Reads Suscripción cancelada ⛔",
        description: "Tu suscripción Holy Reads {duration} ha sido cancelada",
      },
    },
  },

  // ─── Invitation ────────────────────────────────────────────────────────────
  {
    type: NOTIFICATION_TEMPLATE.invitation,
    translations: {
      en: {
        title: "Holy Reads Invitation 🎁",
        description: "{inviterEmailUsername} invited you ✨",
      },
      es: {
        title: "Holy Reads Invitación 🎁",
        description: "{inviterEmailUsername} te invitó ✨",
      },
    },
  },

  // ─── Notifications ─────────────────────────────────────────────────────────
  {
    type: NOTIFICATION_TEMPLATE.newSummary,
    translations: {
      en: {
        title: "🔔 NEW Summary for you!",
        description: '📙 Explore the latest summary "{content}"',
      },
      es: {
        title: "🔔 ¡NUEVO resumen para ti!",
        description: '📙 Explora el último resumen "{content}"',
      },
    },
  },
  {
    type: NOTIFICATION_TEMPLATE.freshInspiration,
    translations: {
      en: {
        title: "🔔 Fresh Inspiration Alert!",
        description:
          "📙 Explore the latest in your favorite category with titles like {content}.",
      },
      es: {
        title: "🔔 ¡Nueva dosis de inspiración!",
        description:
          "📙 Explora lo más reciente en tu categoría favorita con títulos como {content}.",
      },
    },
  },
  {
    type: NOTIFICATION_TEMPLATE.dailyDevotional,
    translations: {
      en: {
        title: "🔔 Your daily devotional!",
        description:
          "📙 Today's Devotional: {title}. Dive in now for a dose of spiritual nourishment 🔖",
      },
      es: {
        title: "🔔 ¡Tu devocional diario!",
        description:
          "📙 Devocional de hoy: {title}. Sumérgete ahora para una dosis de alimento espiritual 🔖",
      },
    },
  },
  {
    type: NOTIFICATION_TEMPLATE.dailyDevotionalCategory,
    translations: {
      en: {
        title: "🔔 Your daily devotional!",
        description:
          "📙 Your daily devotional for {seriesTitles} are available 🔖",
      },
      es: {
        title: "🔔 ¡Tu devocional diario!",
        description:
          "📙 Tu devocional diario para {seriesTitles} está disponible 🔖",
      },
    },
  },
  {
    type: NOTIFICATION_TEMPLATE.engagementMotivation,
    translations: {
      en: {
        title: "🔔 We miss you at Holy Reads!",
        description:
          "📙 You've missed out on some uplifting content like {bookTitle}",
      },
      es: {
        title: "🔔 ¡Te extrañamos en Holy Reads!",
        description: "📙 Te has perdido contenido inspirador como {bookTitle}",
      },
    },
  },
  {
    type: NOTIFICATION_TEMPLATE.freeDailySummary,
    translations: {
      en: {
        title: "🔔 Free Summary For YOU! 😊",
        description: "📙 Enjoy your free daily summary {bookTitle}.",
      },
      es: {
        title: "🔔 ¡Resumen Gratuito Para Ti! 😊",
        description: "📙 Disfruta tu resumen diario gratuito {bookTitle}.",
      },
    },
  },
  {
    type: NOTIFICATION_TEMPLATE.notesAndHighlights,
    translations: {
      en: {
        title: "🔔 Notes and highlights!",
        description:
          "📙 By long pressing on your favorite line, you can make highlights and share them with your friends as quotes or images.",
      },
      es: {
        title: "🔔 ¡Notas y destacados!",
        description:
          "📙 Manteniendo presionada tu línea favorita, puedes hacer destacados y compartirlos con tus amigos como citas o imágenes.",
      },
    },
  },
  {
    type: NOTIFICATION_TEMPLATE.renewalReminder,
    translations: {
      en: {
        title: "Holy Reads Renewal Reminder ⏳",
        description:
          "Holy Reads gently reminds you that your {planTitle} plan will upgrade tomorrow ✨",
      },
      es: {
        title: "Recordatorio de Renovación de Holy Reads ⏳",
        description:
          "Holy Reads te recuerda amablemente que tu plan {planTitle} se actualizará mañana ✨",
      },
    },
  },
  {
    type: NOTIFICATION_TEMPLATE.newContent,
    translations: {
      en: {
        title: "🔔 We have something new for you",
        description: "📙 Lets read {bookTitle}.",
      },
      es: {
        title: "🔔 Tenemos algo nuevo para ti",
        description: "📙 Vamos a leer {bookTitle}.",
      },
    },
  },
  {
    type: NOTIFICATION_TEMPLATE.unfinishedContent,
    translations: {
      en: {
        title: "🔔 You left something unfinished!",
        description: "📙 Let's read {bookTitle}.",
      },
      es: {
        title: "🔔 ¡Dejaste algo sin terminar!",
        description: "📙 Vamos a leer {bookTitle}.",
      },
    },
  },
  // ─── App ───────────────────────────────────────────────────────────────────
  {
    type: NOTIFICATION_TEMPLATE.appUpdateAvailable,
    translations: {
      en: {
        title: "A newer version of the app is available!",
        description: "Please go to the store and update the app.",
      },
      es: {
        title: "¡Hay una versión más reciente de la aplicación disponible!",
        description: "Por favor, ve a la tienda y actualiza la aplicación.",
      },
    },
  },

  // ─── Email Templates ───────────────────────────────────────────────────────
  {
    type: NOTIFICATION_TEMPLATE.welcomeEmail,
    translations: {
      en: {
        title: "Welcome to Holy Reads – Your spiritual journey starts here!",
        description:
          "Thank you for downloading the Holy Reads app. We're truly glad you're here.",
      },
      es: {
        title: "Bienvenido a Holy Reads – ¡Tu viaje espiritual comienza aquí!",
        description:
          "Gracias por descargar la aplicación Holy Reads. Estamos realmente contentos de que estés aquí.",
      },
    },
  },

  // ─── Password Reset ────────────────────────────────────────────────────────
  {
    type: NOTIFICATION_TEMPLATE.passwordReset,
    translations: {
      en: {
        title: "Reset your Holy Reads password",
        description:
          "A request has been received to change your Holy Reads account password.",
      },
      es: {
        title: "Restablecer tu contraseña de Holy Reads",
        description:
          "Se ha recibido una solicitud para cambiar la contraseña de su cuenta Holy Reads.",
      },
    },
  },
];

/**
 * Seeds all notification templates for each available language.
 * Skips entries that already exist (type + language combination).
 */
export const seedNotificationTemplates = async () => {
  try {
    // Fetch all available languages
    const languages = await LanguageModel.find({});

    if (!languages.length) {
      console.warn(
        "⚠️  No languages found. Please run addLanguages() first before seeding templates.",
      );
      return;
    }

    const langMap = new Map(languages.map((l) => [l.code as string, l]));

    let created = 0;
    let skipped = 0;

    for (const templateDef of TEMPLATE_SEED_DATA) {
      for (const [code, translations] of Object.entries(
        templateDef.translations,
      ) as ["en" | "es", { title: string; description: string }][]) {
        const lang = langMap.get(code);

        if (!lang) {
          console.warn(
            `⚠️  Language "${code}" not found in DB, skipping type="${templateDef.type}".`,
          );
          skipped++;
          continue;
        }

        const exists = await NotificationTemplateModel.findOne({
          type: templateDef.type,
          language: lang._id,
        });

        if (exists) {
          console.log(
            `⏭️  Already exists: type="${templateDef.type}" lang="${code}" — skipping.`,
          );
          skipped++;
          continue;
        }

        await NotificationTemplateModel.create({
          type: templateDef.type,
          title: translations.title,
          description: translations.description,
          language: lang._id,
        });

        console.log(`✅ Created: type="${templateDef.type}" lang="${code}"`);
        created++;
      }
    }

    console.log(
      `\n✅ Notification template seeding complete — created: ${created}, skipped: ${skipped}\n`,
    );
  } catch (error) {
    console.error("❌ Notification template seeding failed:", error);
    throw error;
  }
};
