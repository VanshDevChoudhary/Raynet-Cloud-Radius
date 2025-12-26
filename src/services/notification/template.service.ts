import { prisma } from "@/lib/prisma";
import type { NotificationType, NotificationChannel } from "@/generated/prisma";

export interface TemplateVariables {
  name?: string;
  plan?: string;
  expiry?: string;
  daysUntilExpiry?: string;
  amount?: string;
  date?: string;
  username?: string;
  password?: string;
  phone?: string;
  email?: string;
  address?: string;
  ticketId?: string;
  ticketStatus?: string;
  fupLimit?: string;
  dataUsed?: string;
  paymentMethod?: string;
  transactionId?: string;
  invoiceNumber?: string;
  dueDate?: string;
  tenantName?: string;
  tenantPhone?: string;
  tenantEmail?: string;
  [key: string]: string | undefined;
}

export const templateService = {
  async getTemplate(
    tenantId: string,
    eventType: NotificationType,
    channel: NotificationChannel
  ) {
    return prisma.notificationTemplate.findFirst({
      where: {
        tenantId,
        eventType,
        channel,
        isActive: true,
      },
    });
  },

  escapeHtml(str: string): string {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return str.replace(/[&<>"']/g, (c) => map[c] || c);
  },

  // Replaces {variableName} placeholders. HTML-escapes values by default to prevent XSS.
  renderTemplate(
    template: string,
    variables: TemplateVariables,
    options?: { escapeHtml?: boolean }
  ): string {
    let rendered = template;
    const shouldEscape = options?.escapeHtml !== false;

    for (const [key, value] of Object.entries(variables)) {
      if (value !== undefined && value !== null) {
        const pattern = new RegExp(`\\{${key}\\}`, "g");
        const safeValue = shouldEscape ? this.escapeHtml(value) : value;
        rendered = rendered.replace(pattern, safeValue);
      }
    }

    return rendered;
  },

  // Called during tenant onboarding to seed SMS + email templates
  async createDefaultTemplates(tenantId: string) {
    const defaultTemplates = [
      // SMS Templates
      {
        tenantId,
        eventType: "EXPIRY_REMINDER" as NotificationType,
        channel: "SMS" as NotificationChannel,
        name: "Expiry Reminder (SMS)",
        template:
          "Hi {name}, your {plan} expires in {daysUntilExpiry} days on {expiry}. Renew now to continue enjoying uninterrupted service! - {tenantName}",
        variables: [
          "name",
          "plan",
          "daysUntilExpiry",
          "expiry",
          "tenantName",
        ],
        isActive: true,
      },
      {
        tenantId,
        eventType: "EXPIRED_NOTICE" as NotificationType,
        channel: "SMS" as NotificationChannel,
        name: "Expired Notice (SMS)",
        template:
          "Hi {name}, your {plan} has expired. Please contact us at {tenantPhone} to renew your plan. - {tenantName}",
        variables: ["name", "plan", "tenantPhone", "tenantName"],
        isActive: true,
      },
      {
        tenantId,
        eventType: "PAYMENT_CONFIRMATION" as NotificationType,
        channel: "SMS" as NotificationChannel,
        name: "Payment Confirmation (SMS)",
        template:
          "Payment of Rs.{amount} received for {plan}. Your plan is now active until {expiry}. Thank you! - {tenantName}",
        variables: ["amount", "plan", "expiry", "tenantName"],
        isActive: true,
      },
      {
        tenantId,
        eventType: "PLAN_ACTIVATION" as NotificationType,
        channel: "SMS" as NotificationChannel,
        name: "Plan Activation (SMS)",
        template:
          "Welcome {name}! Your {plan} is now active. Username: {username}. Expires: {expiry}. Happy browsing! - {tenantName}",
        variables: ["name", "plan", "username", "expiry", "tenantName"],
        isActive: true,
      },
      {
        tenantId,
        eventType: "PAYMENT_DUE" as NotificationType,
        channel: "SMS" as NotificationChannel,
        name: "Payment Due Reminder (SMS)",
        template:
          "Hi {name}, your payment of Rs.{amount} for {plan} is due on {dueDate}. Please pay to avoid service interruption. - {tenantName}",
        variables: ["name", "amount", "plan", "dueDate", "tenantName"],
        isActive: true,
      },
      {
        tenantId,
        eventType: "OTP" as NotificationType,
        channel: "SMS" as NotificationChannel,
        name: "OTP Verification (SMS)",
        template:
          "{password} is your OTP for {tenantName}. Valid for 5 minutes. Do not share this code with anyone.",
        variables: ["password", "tenantName"],
        isActive: true,
      },
      {
        tenantId,
        eventType: "FUP_REACHED" as NotificationType,
        channel: "SMS" as NotificationChannel,
        name: "FUP Limit Reached (SMS)",
        template:
          "Hi {name}, you have used {dataUsed} of your {fupLimit} FUP limit. Your speed will be reduced as per your plan. - {tenantName}",
        variables: ["name", "dataUsed", "fupLimit", "tenantName"],
        isActive: true,
      },

      // Email Templates
      {
        tenantId,
        eventType: "EXPIRY_REMINDER" as NotificationType,
        channel: "EMAIL" as NotificationChannel,
        name: "Expiry Reminder (Email)",
        subject: "Your plan expires in {daysUntilExpiry} days",
        template: `
          <h2>Hi {name},</h2>
          <p>This is a reminder that your <strong>{plan}</strong> will expire in <strong>{daysUntilExpiry} days</strong> on <strong>{expiry}</strong>.</p>
          <p>To continue enjoying uninterrupted service, please renew your plan before the expiry date.</p>
          <p>If you have any questions, feel free to contact us at {tenantPhone} or {tenantEmail}.</p>
          <p>Best regards,<br>{tenantName}</p>
        `,
        variables: [
          "name",
          "plan",
          "daysUntilExpiry",
          "expiry",
          "tenantPhone",
          "tenantEmail",
          "tenantName",
        ],
        isActive: true,
      },
      {
        tenantId,
        eventType: "EXPIRED_NOTICE" as NotificationType,
        channel: "EMAIL" as NotificationChannel,
        name: "Expired Notice (Email)",
        subject: "Your plan has expired",
        template: `
          <h2>Hi {name},</h2>
          <p>Your <strong>{plan}</strong> has expired.</p>
          <p>Please contact us at {tenantPhone} or {tenantEmail} to renew your plan and restore your service.</p>
          <p>Best regards,<br>{tenantName}</p>
        `,
        variables: ["name", "plan", "tenantPhone", "tenantEmail", "tenantName"],
        isActive: true,
      },
      {
        tenantId,
        eventType: "PAYMENT_CONFIRMATION" as NotificationType,
        channel: "EMAIL" as NotificationChannel,
        name: "Payment Confirmation (Email)",
        subject: "Payment received - Plan activated",
        template: `
          <h2>Hi {name},</h2>
          <p>We have received your payment of <strong>Rs.{amount}</strong> for <strong>{plan}</strong>.</p>
          <p>Your plan is now active and will expire on <strong>{expiry}</strong>.</p>
          <p>Payment Method: {paymentMethod}<br>
          Transaction ID: {transactionId}<br>
          Invoice Number: {invoiceNumber}</p>
          <p>Thank you for your payment!</p>
          <p>Best regards,<br>{tenantName}</p>
        `,
        variables: [
          "name",
          "amount",
          "plan",
          "expiry",
          "paymentMethod",
          "transactionId",
          "invoiceNumber",
          "tenantName",
        ],
        isActive: true,
      },
      {
        tenantId,
        eventType: "PLAN_ACTIVATION" as NotificationType,
        channel: "EMAIL" as NotificationChannel,
        name: "Plan Activation (Email)",
        subject: "Welcome to {tenantName} - Your plan is active",
        template: `
          <h2>Welcome {name}!</h2>
          <p>Your <strong>{plan}</strong> has been successfully activated.</p>
          <p><strong>Connection Details:</strong></p>
          <ul>
            <li>Username: {username}</li>
            <li>Password: {password}</li>
            <li>Expires on: {expiry}</li>
          </ul>
          <p>If you need any assistance, please contact us at {tenantPhone} or {tenantEmail}.</p>
          <p>Happy browsing!<br>{tenantName}</p>
        `,
        variables: [
          "name",
          "plan",
          "username",
          "password",
          "expiry",
          "tenantPhone",
          "tenantEmail",
          "tenantName",
        ],
        isActive: true,
      },
    ];

    return prisma.notificationTemplate.createMany({
      data: defaultTemplates,
      skipDuplicates: true,
    });
  },

  async getAllTemplates(tenantId: string) {
    return prisma.notificationTemplate.findMany({
      where: { tenantId },
      orderBy: [{ eventType: "asc" }, { channel: "asc" }],
    });
  },

  async upsertTemplate(
    tenantId: string,
    data: {
      eventType: NotificationType;
      channel: NotificationChannel;
      name: string;
      subject?: string;
      template: string;
      variables: string[];
      isActive?: boolean;
    }
  ) {
    return prisma.notificationTemplate.upsert({
      where: {
        tenantId_eventType_channel: {
          tenantId,
          eventType: data.eventType,
          channel: data.channel,
        },
      },
      create: {
        tenantId,
        ...data,
      },
      update: {
        name: data.name,
        subject: data.subject,
        template: data.template,
        variables: data.variables,
        isActive: data.isActive,
      },
    });
  },

  async deleteTemplate(
    tenantId: string,
    eventType: NotificationType,
    channel: NotificationChannel
  ) {
    return prisma.notificationTemplate.delete({
      where: {
        tenantId_eventType_channel: {
          tenantId,
          eventType,
          channel,
        },
      },
    });
  },

  async toggleTemplate(
    tenantId: string,
    eventType: NotificationType,
    channel: NotificationChannel,
    isActive: boolean
  ) {
    return prisma.notificationTemplate.update({
      where: {
        tenantId_eventType_channel: {
          tenantId,
          eventType,
          channel,
        },
      },
      data: { isActive },
    });
  },
};
