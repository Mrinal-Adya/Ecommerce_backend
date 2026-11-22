import { EnquiryRequest, Product } from './types.js';

export interface EmailService {
  sendEnquiry(enquiry: EnquiryRequest, product?: Product | null): Promise<void>;
}

export class ConsoleEmailService implements EmailService {
  private readonly salesInbox: string;

  constructor(salesInbox = process.env.SALES_INBOX_EMAIL || 'sales@example.com') {
    this.salesInbox = salesInbox;
  }

  async sendEnquiry(enquiry: EnquiryRequest, product?: Product | null): Promise<void> {
    const productLabel = product
      ? `[${product.id}] ${product.title} ($${product.price})`
      : `[${enquiry.productId ?? 'N/A'}] ${enquiry.productTitle ?? 'General Enquiry'}`;

    console.log('\n================ NEW PRODUCT ENQUIRY ================');
    console.log(`To:       ${this.salesInbox}`);
    console.log(`From:     ${enquiry.name} <${enquiry.email}>`);
    console.log(`Phone:    ${enquiry.phone}`);
    console.log(`Product:  ${productLabel}`);
    console.log(`Quantity: ${enquiry.quantity ?? 1}`);
    console.log('=====================================================\n');
  }
}