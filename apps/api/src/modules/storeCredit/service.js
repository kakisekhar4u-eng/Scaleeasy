// apps/api/src/modules/storeCredit/service.js
// Store Credit / Loyalty Foundation
const db = require('../../db/client');
const { emit } = require('../../core/eventBus');

async function getOrCreateWallet(storeId, customerId) {
  let wallet = await db('store_credit_wallets')
    .where({ store_id: storeId, customer_id: customerId })
    .first();
  if (!wallet) {
    [wallet] = await db('store_credit_wallets')
      .insert({ store_id: storeId, customer_id: customerId })
      .onConflict(['store_id', 'customer_id'])
      .merge({ updated_at: new Date() })
      .returning('*');
  }
  return wallet;
}

async function getWallet(storeId, customerId) {
  return db('store_credit_wallets')
    .where({ store_id: storeId, customer_id: customerId })
    .first();
}

async function addCredit(storeId, customerId, amount, { type, referenceType, referenceId, note, expiresAt, createdBy }) {
  if (amount <= 0) throw new Error('Credit amount must be positive');

  return db.transaction(async (trx) => {
    const wallet = await getOrCreateWallet(storeId, customerId);
    const newBalance = Number(wallet.balance) + amount;

    await trx('store_credit_wallets').where({ id: wallet.id }).update({
      balance: newBalance,
      lifetime_earned: Number(wallet.lifetime_earned) + amount,
      updated_at: new Date(),
    });

    const [txn] = await trx('store_credit_transactions').insert({
      wallet_id: wallet.id,
      store_id: storeId,
      amount,
      balance_after: newBalance,
      type: type || 'manual_credit',
      reference_type: referenceType || 'manual',
      reference_id: referenceId || null,
      note,
      created_by: createdBy || null,
      expires_at: expiresAt || null,
    }).returning('*');

    await auditLog(storeId, wallet.id, 'credit_added', createdBy, { amount, type, referenceId });
    await emit('StoreCreditAdded', { customerId, amount, walletId: wallet.id, balance: newBalance }, 'store_credit');

    return { transaction: txn, balance: newBalance };
  });
}

async function debitCredit(storeId, customerId, amount, { referenceType, referenceId, note, createdBy }) {
  if (amount <= 0) throw new Error('Debit amount must be positive');

  return db.transaction(async (trx) => {
    const wallet = await trx('store_credit_wallets')
      .where({ store_id: storeId, customer_id: customerId, is_active: true })
      .forUpdate()
      .first();
    if (!wallet) throw new Error('No active wallet found');
    if (Number(wallet.balance) < amount) throw new Error('Insufficient store credit balance');

    const newBalance = Number(wallet.balance) - amount;

    await trx('store_credit_wallets').where({ id: wallet.id }).update({
      balance: newBalance,
      lifetime_spent: Number(wallet.lifetime_spent) + amount,
      updated_at: new Date(),
    });

    const [txn] = await trx('store_credit_transactions').insert({
      wallet_id: wallet.id,
      store_id: storeId,
      amount: -amount,
      balance_after: newBalance,
      type: 'payment_debit',
      reference_type: referenceType || 'sale',
      reference_id: referenceId || null,
      note,
      created_by: createdBy || null,
    }).returning('*');

    await auditLog(storeId, wallet.id, 'credit_debited', createdBy, { amount, referenceId });
    await emit('StoreCreditDebited', { customerId, amount, walletId: wallet.id, balance: newBalance }, 'store_credit');

    return { transaction: txn, balance: newBalance };
  });
}

async function creditFromRefund(customerId, amount, paymentId, actorId) {
  const payment = await db('payment_transactions').where({ id: paymentId }).first();
  if (!payment) throw new Error('Payment not found');

  return addCredit(payment.store_id, customerId, amount, {
    type: 'refund_credit',
    referenceType: 'refund',
    referenceId: paymentId,
    note: 'Credit from refund',
    createdBy: actorId,
  });
}

async function getTransactions(storeId, customerId, { limit = 50, offset = 0 } = {}) {
  const wallet = await getWallet(storeId, customerId);
  if (!wallet) return { wallet: null, transactions: [] };

  const transactions = await db('store_credit_transactions')
    .where({ wallet_id: wallet.id })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

  return { wallet, transactions };
}

async function auditLog(storeId, walletId, action, actorId, details) {
  await db('store_credit_audit_log').insert({
    store_id: storeId,
    wallet_id: walletId,
    action,
    actor_id: actorId,
    details,
  });
}

module.exports = {
  getOrCreateWallet,
  getWallet,
  addCredit,
  debitCredit,
  creditFromRefund,
  getTransactions,
};
