// Create payment record in the database
export const create = async (client, paymentData) => {
  const { user_id, amount, currency, payment_method, transaction_id, status } =
    paymentData;

  const query = `
      INSERT INTO payments 
      (user_id, amount, currency, payment_method, transaction_id, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

  const values = [
    user_id,
    amount,
    currency,
    payment_method,
    transaction_id,
    status,
  ];
  const result = await client.query(query, values);
  return result.rows[0];
};

// Link a ticket to a payment
export const linkTicketToPayment = async (client, payment_id, ticket_id) => {
  const query = `
      INSERT INTO payment_tickets (payment_id, ticket_id)
      VALUES ($1, $2)
      RETURNING *
    `;

  const result = await client.query(query, [payment_id, ticket_id]);
  return result.rows[0];
};

// Find payment by ID
export const findById = async (id) => {
  const query = "SELECT * FROM payments WHERE id = $1";
  const result = await global.pool.query(query, [id]);
  return result.rows[0];
};

// Find payments by user ID
export const findByUserId = async (userId) => {
  const query =
    "SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC";
  const result = await global.pool.query(query, [userId]);
  return result.rows;
};

// Get tickets associated with a payment
export const getPaymentTickets = async (paymentId) => {
  const query = `
      SELECT t.*, tt.name as ticket_type_name, e.name as event_name
      FROM tickets t
      JOIN payment_tickets pt ON t.id = pt.ticket_id
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      JOIN events e ON t.event_id = e.id
      WHERE pt.payment_id = $1
    `;

  const result = await global.pool.query(query, [paymentId]);
  return result.rows;
};
