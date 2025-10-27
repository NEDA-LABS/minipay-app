/**
 * Invoice Email Template
 * Professional invoice email template with payment link
 */

import { BaseEmailTemplate } from './base';
import { InvoiceEmailData, EmailTemplateType, EmailAddress } from '../types';
import { buildEmailAddress } from '../config';

export class InvoiceEmailTemplate extends BaseEmailTemplate<InvoiceEmailData> {
  getType(): EmailTemplateType {
    return EmailTemplateType.INVOICE;
  }

  protected getRecipients(data: InvoiceEmailData): EmailAddress[] {
    return [buildEmailAddress(data.recipientEmail || (data as any).email, data.recipient)];
  }

  protected getSubject(data: InvoiceEmailData): string {
    return `Invoice #${data.invoiceId} from ${data.sender} - Due ${this.formatDate(data.dueDate)}`;
  }

  protected generateHtml(data: InvoiceEmailData): string {
    const lineItemsHtml = this.generateLineItems(data.lineItems, data.currency);
    const paymentLinkSection = data.paymentLink
      ? this.generatePaymentLinkSection(data.paymentLink)
      : '';

    const content = `
      <div class="header">
        <h1>Invoice</h1>
        <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px;">Payment Request</p>
      </div>

      <div class="content">
        <!-- Greeting -->
        <div style="margin-bottom: 32px;">
          <h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">
            Dear ${data.recipient},
          </h2>
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0;">
            We hope this email finds you well. Please find your invoice details below.
          </p>
        </div>

        <!-- Invoice Details -->
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #667eea;">
          <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 20px 0;">
            Invoice Information
          </h3>
          ${this.generateInvoiceDetails(data)}
        </div>

        <!-- Line Items -->
        <div style="margin-bottom: 32px;">
          <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 20px 0;">
            Items & Services
          </h3>
          ${lineItemsHtml}
        </div>

        <!-- Total Amount -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 8px; padding: 24px; margin-bottom: 32px; text-align: center;">
          <p style="color: #ffffff; font-size: 16px; margin: 0 0 8px 0; opacity: 0.9;">
            Total Amount Due
          </p>
          <p style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: -0.025em;">
            ${this.formatCurrency(data.totalAmount, data.currency)}
          </p>
        </div>

        ${paymentLinkSection}

        <!-- Footer Message -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
            Thank you for your business! If you have any questions about this invoice, 
            please don't hesitate to contact us.
          </p>
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    return this.wrapWithLayout(content);
  }

  private generateInvoiceDetails(data: InvoiceEmailData): string {
    return `
      <div style="display: grid; gap: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="color: #6b7280; font-weight: 500;">Invoice ID:</span>
          <span style="color: #1f2937; font-weight: 600;">#${data.invoiceId}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="color: #6b7280; font-weight: 500;">Merchant:</span>
          <span style="color: #1f2937; font-weight: 600;">${data.sender}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="color: #6b7280; font-weight: 500;">Payment Method:</span>
          <span style="color: #1f2937; font-weight: 600;">${data.paymentCollection}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="color: #6b7280; font-weight: 500;">Due Date:</span>
          <span style="color: #dc2626; font-weight: 600;">${this.formatDate(data.dueDate)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
          <span style="color: #6b7280; font-weight: 500;">Currency:</span>
          <span style="color: #1f2937; font-weight: 600;">${data.currency}</span>
        </div>
      </div>
    `;
  }

  private generateLineItems(lineItems: InvoiceEmailData['lineItems'], currency: string): string {
    const rows = lineItems
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">
            ${item.description}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; text-align: right; font-weight: 600;">
            ${this.formatCurrency(item.amount, currency)}
          </td>
        </tr>
      `
      )
      .join('');

    return `
      <div style="overflow-x: auto; border-radius: 8px; border: 1px solid #e5e7eb;">
        <table style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="padding: 16px 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">
                Description
              </th>
              <th style="padding: 16px 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  private generatePaymentLinkSection(paymentLink: string): string {
    return `
      <div style="text-align: center; margin-bottom: 32px;">
        <p style="color: #6b7280; font-size: 16px; margin: 0 0 20px 0;">
          Click the button below to proceed with your payment:
        </p>
        <a href="${paymentLink}" class="button">
          Pay Now
        </a>
        <p style="color: #9ca3af; font-size: 14px; margin: 16px 0 0 0;">
          Payment Link: <span style="color: #6b7280; word-break: break-all;">${paymentLink}</span>
        </p>
      </div>
    `;
  }
}
