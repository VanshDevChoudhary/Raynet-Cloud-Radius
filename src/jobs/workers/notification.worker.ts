import { Worker } from "bullmq";
import Redis from "ioredis";
import { prisma } from "@/lib/prisma";
import { templateService } from "@/services/notification/template.service";
import { notificationLogService } from "@/services/notification/notification-log.service";
import { smsService } from "@/services/sms/sms.service";
import { emailService } from "@/services/email.service";
import { format } from "date-fns";
import type { NotificationType } from "@/generated/prisma";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

/**
 * Notification Worker
 * Processes notification jobs (expiry reminders, payment confirmations, etc.)
 */
export const notificationWorker = new Worker(
  "notifications",
  async (job) => {
    console.log(`[Notification Worker] Processing job: ${job.name}`);

    const { subscriberId, tenantId, type, daysUntilExpiry, amount, paymentMethod, transactionId, invoiceNumber } = job.data;

    try {
      const subscriber = await prisma.subscriber.findFirst({
        where: { id: subscriberId, tenantId },
        include: {
          plan: true,
          tenant: true,
        },
      });

      if (!subscriber) {
        console.error(`[Notification Worker] Subscriber not found: ${subscriberId}`);
        return;
      }

      const variables: Record<string, string> = {
        name: subscriber.name,
        plan: subscriber.plan?.name || "your plan",
        username: subscriber.username,
        phone: subscriber.phone,
        email: subscriber.email || "",
        address: subscriber.address || "",
        tenantName: subscriber.tenant.name,
        tenantPhone: subscriber.tenant.settings ? (subscriber.tenant.settings as any).phone || "" : "",
        tenantEmail: subscriber.tenant.settings ? (subscriber.tenant.settings as any).email || "" : "",
      };

      if (subscriber.expiryDate) {
        variables.expiry = format(subscriber.expiryDate, "dd MMM yyyy");
      }

      if (daysUntilExpiry !== undefined) {
        variables.daysUntilExpiry = String(daysUntilExpiry);
      }

      if (amount) variables.amount = amount;
      if (paymentMethod) variables.paymentMethod = paymentMethod;
      if (transactionId) variables.transactionId = transactionId;
      if (invoiceNumber) variables.invoiceNumber = invoiceNumber;

      const notificationType = type as NotificationType;
      const [smsTemplate, emailTemplate] = await Promise.all([
        templateService.getTemplate(tenantId, notificationType, "SMS"),
        templateService.getTemplate(tenantId, notificationType, "EMAIL"),
      ]);

      if (smsTemplate && subscriber.phone) {
        try {
          const message = templateService.renderTemplate(smsTemplate.template, variables);

          const result = await smsService.sendSms(tenantId, subscriber.phone, message);

          await notificationLogService.create({
            tenantId,
            subscriberId: subscriber.id,
            type: notificationType,
            channel: "SMS",
            recipient: subscriber.phone,
            message,
            status: result.success ? "SENT" : "FAILED",
            error: result.error,
            gatewayResponse: result.gatewayResponse as Record<string, string | number | boolean | null> | undefined,
            sentAt: result.success ? new Date() : undefined,
          });

          if (result.success) {
            console.log(`[Notification Worker] SMS sent to ${subscriber.phone}: ${message}`);
          } else {
            console.error(`[Notification Worker] SMS failed for ${subscriber.phone}: ${result.error}`);
          }
        } catch (error) {
          console.error(`[Notification Worker] Failed to send SMS:`, error);
          await notificationLogService.create({
            tenantId,
            subscriberId: subscriber.id,
            type: notificationType,
            channel: "SMS",
            recipient: subscriber.phone,
            message: "",
            status: "FAILED",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      if (emailTemplate && subscriber.email) {
        try {
          const subject = templateService.renderTemplate(emailTemplate.subject || "", variables);
          const html = templateService.renderTemplate(emailTemplate.template, variables);

          const result = await emailService.sendEmail({
            tenantId,
            to: subscriber.email,
            subject,
            html,
          });

          await notificationLogService.create({
            tenantId,
            subscriberId: subscriber.id,
            type: notificationType,
            channel: "EMAIL",
            recipient: subscriber.email,
            subject,
            message: html,
            status: result.success ? "SENT" : "FAILED",
            error: result.error,
            sentAt: result.success ? new Date() : undefined,
          });

          if (result.success) {
            console.log(`[Notification Worker] Email sent to ${subscriber.email}: ${subject}`);
          } else {
            console.error(`[Notification Worker] Email failed for ${subscriber.email}: ${result.error}`);
          }
        } catch (error) {
          console.error(`[Notification Worker] Failed to send Email:`, error);
          await notificationLogService.create({
            tenantId,
            subscriberId: subscriber.id,
            type: notificationType,
            channel: "EMAIL",
            recipient: subscriber.email || "",
            subject: emailTemplate.subject || "",
            message: "",
            status: "FAILED",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      const whatsappTemplate = await templateService.getTemplate(tenantId, notificationType, "WHATSAPP");
      if (whatsappTemplate && subscriber.phone) {
        try {
          const message = templateService.renderTemplate(whatsappTemplate.template, variables);
          const result = await smsService.sendWhatsApp(tenantId, subscriber.phone, message);

          await notificationLogService.create({
            tenantId,
            subscriberId: subscriber.id,
            type: notificationType,
            channel: "WHATSAPP",
            recipient: subscriber.phone,
            message,
            status: result.success ? "SENT" : "FAILED",
            error: result.error,
            gatewayResponse: result.gatewayResponse as Record<string, string | number | boolean | null> | undefined,
            sentAt: result.success ? new Date() : undefined,
          });

          if (result.success) {
            console.log(`[Notification Worker] WhatsApp sent to ${subscriber.phone}`);
          } else {
            console.error(`[Notification Worker] WhatsApp failed for ${subscriber.phone}: ${result.error}`);
          }
        } catch (error) {
          console.error(`[Notification Worker] Failed to send WhatsApp:`, error);
          await notificationLogService.create({
            tenantId,
            subscriberId: subscriber.id,
            type: notificationType,
            channel: "WHATSAPP",
            recipient: subscriber.phone,
            message: "",
            status: "FAILED",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      console.log(`[Notification Worker] Job ${job.name} completed for subscriber ${subscriber.name}`);
    } catch (error) {
      console.error(`[Notification Worker] Job ${job.name} failed:`, error);
      throw error; // Re-throw to mark job as failed in BullMQ
    }
  },
  {
    connection,
    concurrency: 5, // Process up to 5 notifications in parallel
  }
);

// Worker event handlers
notificationWorker.on("completed", (job) => {
  console.log(`[Notification Worker] Job ${job.id} (${job.name}) completed`);
});

notificationWorker.on("failed", (job, err) => {
  console.error(`[Notification Worker] Job ${job?.id} (${job?.name}) failed:`, err);
});

notificationWorker.on("error", (err) => {
  console.error("[Notification Worker] Worker error:", err);
});

console.log("[Notification Worker] Started");

export default notificationWorker;
