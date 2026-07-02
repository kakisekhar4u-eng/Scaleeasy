// apps/api/src/modules/whatsapp/service.js
// WhatsApp Business Integration — connector-based, multi-provider
const db = require('../../db/client');
const { getConnector, ConnectorNotAvailableError } = require('../../core/connectorLayer');
const { emit } = require('../../core/eventBus');
const logger = require('../../shared/utils/logger');
const { validateIndianPhone } = require('../../shared/utils/indiaValidation');

const TEMPLATE_KEYS = [
  'order_confirmation', 'invoice', 'payment_receipt', 'advance_receipt',
  'delivery_ready', 'delivery_reminder', 'order_update', 'shipment_tracking',
  'promotion', 'customer_support',
];

function getProviderName(provider) {
  const map = { meta: 'whatsapp_meta', msg91: 'whatsapp_msg91', exotel: 'whatsapp_exotel' };
  return map[provider] || `whatsapp_${provider}`;
}

async function getWhatsAppClient(storeId, provider = 'meta') {
  return getConnector(storeId, getProviderName(provider));
}

async function sendMessage({ phone, customerId, templateKey, provider, content, mediaUrl, messageType }, storeId, actorId) {
  const phoneResult = validateIndianPhone(phone);
  if (!phoneResult.valid) throw new Error(phoneResult.error);

  if (customerId) {
    const optStatus = await db('whatsapp_opt_status')
      .where({ store_id: storeId, customer_id: customerId })
      .first();
    if (optStatus && !optStatus.opted_in) {
      throw new Error('Customer has opted out of WhatsApp messages');
    }
  }

  const resolvedProvider = provider || 'meta';
  const [msg] = await db('whatsapp_messages').insert({
    store_id: storeId,
    customer_id: customerId || null,
    phone: phoneResult.formatted,
    direction: 'outbound',
    template_key: templateKey || null,
    provider: resolvedProvider,
    message_type: messageType || (templateKey ? 'template' : 'text'),
    content: content || {},
    media_url: mediaUrl || null,
    status: 'queued',
  }).returning('*');

  try {
    const client = await getWhatsAppClient(storeId, resolvedProvider);
    let result;

    if (templateKey) {
      const template = await db('whatsapp_templates')
        .where({ store_id: storeId, template_key: templateKey, provider: resolvedProvider, status: 'approved' })
        .first();
      if (!template) throw new Error(`Approved template not found for key: ${templateKey}`);

      result = await client.sendTemplate({
        to: phoneResult.formatted,
        templateName: template.template_name,
        language: template.language,
        components: content.components || [],
      });
    } else if (mediaUrl && messageType === 'document') {
      result = await client.sendDocument({
        to: phoneResult.formatted,
        documentUrl: mediaUrl,
        filename: content.filename || 'document.pdf',
        caption: content.caption || '',
      });
    } else if (mediaUrl && messageType === 'image') {
      result = await client.sendImage({
        to: phoneResult.formatted,
        imageUrl: mediaUrl,
        caption: content.caption || '',
      });
    } else {
      result = await client.sendText({
        to: phoneResult.formatted,
        text: content.text || content.body || '',
      });
    }

    const providerMessageId = result?.messages?.[0]?.id || result?.id || result?.request_id || null;
    await db('whatsapp_messages').where({ id: msg.id }).update({
      status: 'sent',
      provider_message_id: providerMessageId,
      updated_at: new Date(),
    });

    await auditLog(storeId, msg.id, 'message_sent', actorId, { templateKey, phone: phoneResult.formatted });
    await emit('WhatsAppSent', { messageId: msg.id, customerId, templateKey, phone: phoneResult.formatted }, 'whatsapp');

    return { ...msg, status: 'sent', provider_message_id: providerMessageId };
  } catch (err) {
    const shouldRetry = msg.retry_count < msg.max_retries;
    await db('whatsapp_messages').where({ id: msg.id }).update({
      status: shouldRetry ? 'queued' : 'failed',
      failure_reason: err.message,
      retry_count: msg.retry_count + 1,
      updated_at: new Date(),
    });
    await auditLog(storeId, msg.id, 'message_failed', actorId, { error: err.message, willRetry: shouldRetry });

    if (err instanceof ConnectorNotAvailableError) {
      throw new Error(`WhatsApp provider ${resolvedProvider} is not connected. Configure it in Connected Apps.`);
    }
    throw err;
  }
}

async function sendOrderConfirmation(orderId, storeId, actorId) {
  const order = await db('order_cards').where({ id: orderId, store_id: storeId }).first();
  if (!order) throw new Error('Order not found');
  const customer = await db('customers').where({ id: order.customer_id }).first();
  if (!customer?.phone) throw new Error('Customer has no phone number');

  return sendMessage({
    phone: customer.phone,
    customerId: customer.id,
    templateKey: 'order_confirmation',
    content: {
      components: [
        { type: 'body', parameters: [
          { type: 'text', text: customer.full_name || 'Customer' },
          { type: 'text', text: orderId.substring(0, 8) },
          { type: 'text', text: String(order.total_amount || '') },
        ]},
      ],
    },
  }, storeId, actorId);
}

async function sendInvoice(saleId, storeId, actorId) {
  const invoice = await db('invoices').where({ sale_id: saleId }).first();
  if (!invoice) throw new Error('Invoice not found');
  const sale = await db('sales').where({ id: saleId, store_id: storeId }).first();
  if (!sale) throw new Error('Sale not found');
  const customer = sale.customer_id ? await db('customers').where({ id: sale.customer_id }).first() : null;
  if (!customer?.phone) throw new Error('No customer phone for this sale');

  const messageData = {
    phone: customer.phone,
    customerId: customer.id,
    templateKey: 'invoice',
    content: {
      components: [
        { type: 'body', parameters: [
          { type: 'text', text: customer.full_name || 'Customer' },
          { type: 'text', text: invoice.invoice_number },
          { type: 'text', text: String(invoice.grand_total || sale.total) },
        ]},
      ],
    },
  };

  if (invoice.pdf_url) {
    messageData.mediaUrl = invoice.pdf_url;
    messageData.messageType = 'document';
    messageData.content.filename = `${invoice.invoice_number}.pdf`;
  }

  return sendMessage(messageData, storeId, actorId);
}

async function sendPaymentReceipt(paymentId, storeId, actorId) {
  const payment = await db('payment_transactions')
    .where({ id: paymentId, store_id: storeId })
    .first();
  if (!payment) throw new Error('Payment not found');
  const customer = payment.customer_id ? await db('customers').where({ id: payment.customer_id }).first() : null;
  if (!customer?.phone) throw new Error('No customer phone');

  return sendMessage({
    phone: customer.phone,
    customerId: customer.id,
    templateKey: 'payment_receipt',
    content: {
      components: [
        { type: 'body', parameters: [
          { type: 'text', text: customer.full_name || 'Customer' },
          { type: 'text', text: String(payment.amount) },
          { type: 'text', text: payment.payment_method },
        ]},
      ],
    },
  }, storeId, actorId);
}

async function upsertTemplate(storeId, templateData) {
  const data = {
    store_id: storeId,
    template_key: templateData.templateKey,
    provider: templateData.provider || 'meta',
    provider_template_id: templateData.providerTemplateId || null,
    template_name: templateData.templateName,
    language: templateData.language || 'en',
    body_template: templateData.bodyTemplate,
    header_type: templateData.headerType || null,
    button_type: templateData.buttonType || null,
    status: templateData.status || 'draft',
    metadata: templateData.metadata || {},
    updated_at: new Date(),
  };

  const [row] = await db('whatsapp_templates')
    .insert(data)
    .onConflict(['store_id', 'template_key', 'language'])
    .merge(data)
    .returning('*');
  return row;
}

async function listTemplates(storeId) {
  return db('whatsapp_templates').where({ store_id: storeId }).orderBy('template_key');
}

async function getMessages(storeId, { customerId, status, limit = 50, offset = 0 }) {
  const query = db('whatsapp_messages').where({ store_id: storeId });
  if (customerId) query.where({ customer_id: customerId });
  if (status) query.where({ status });
  return query.orderBy('created_at', 'desc').limit(limit).offset(offset);
}

async function updateOptStatus(storeId, customerId, phone, optedIn, source) {
  const phoneResult = validateIndianPhone(phone);
  if (!phoneResult.valid) throw new Error(phoneResult.error);

  const [row] = await db('whatsapp_opt_status')
    .insert({
      store_id: storeId,
      customer_id: customerId,
      phone: phoneResult.formatted,
      opted_in: optedIn,
      opted_in_at: optedIn ? new Date() : null,
      opted_out_at: optedIn ? null : new Date(),
      source,
    })
    .onConflict(['store_id', 'customer_id'])
    .merge({
      opted_in: optedIn,
      opted_in_at: optedIn ? new Date() : undefined,
      opted_out_at: optedIn ? undefined : new Date(),
      source,
    })
    .returning('*');
  return row;
}

async function getOptStatus(storeId, customerId) {
  return db('whatsapp_opt_status').where({ store_id: storeId, customer_id: customerId }).first();
}

async function updateMessageStatus(providerMessageId, status) {
  await db('whatsapp_messages')
    .where({ provider_message_id: providerMessageId })
    .update({ status, updated_at: new Date() });
}

async function auditLog(storeId, messageId, action, actorId, details) {
  await db('whatsapp_audit_log').insert({
    store_id: storeId,
    message_id: messageId,
    action,
    actor_id: actorId,
    details,
  });
}

module.exports = {
  sendMessage,
  sendOrderConfirmation,
  sendInvoice,
  sendPaymentReceipt,
  upsertTemplate,
  listTemplates,
  getMessages,
  updateOptStatus,
  getOptStatus,
  updateMessageStatus,
  TEMPLATE_KEYS,
};
