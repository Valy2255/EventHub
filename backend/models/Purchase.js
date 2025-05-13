// backend/models/Purchase.js
import * as db from '../config/db.js';

// Find purchases by user ID
export const findByUser = async (userId, page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    
    const query = {
      text: `
        SELECT p.*, 
               COALESCE(e.name, 'Credit Purchase') as event_name,
               e.image_url as event_image,
               COUNT(*) OVER() as total_count
        FROM purchases p
        LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
        LEFT JOIN ticket_types tt ON pi.ticket_type_id = tt.id
        LEFT JOIN events e ON tt.event_id = e.id
        WHERE p.user_id = $1
        GROUP BY p.id, e.name, e.image_url
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3
      `,
      values: [userId, limit, offset]
    };
    
    const result = await db.query(query);
    
    // Extract total count for pagination
    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    const totalPages = Math.ceil(totalCount / limit);
    
    // Remove total_count from result rows
    const purchases = result.rows.map(row => {
      const { total_count, ...purchase } = row;
      return purchase;
    });
    
    return {
      purchases,
      pagination: {
        total: totalCount,
        totalPages,
        currentPage: page,
        hasMore: page < totalPages
      }
    };
  } catch (error) {
    console.error('Error finding purchases by user ID:', error);
    throw error;
  }
};

// Find purchase by ID
export const findById = async (id) => {
  try {
    const query = {
      text: `
        SELECT * FROM purchases
        WHERE id = $1
      `,
      values: [id]
    };
    
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error finding purchase by ID:', error);
    throw error;
  }
};

// Get items (tickets) by purchase ID
export const getItemsByPurchaseId = async (purchaseId) => {
  try {
    const query = {
      text: `
        SELECT pi.*, tt.name as ticket_type_name, e.id as event_id
        FROM purchase_items pi
        LEFT JOIN ticket_types tt ON pi.ticket_type_id = tt.id
        LEFT JOIN events e ON tt.event_id = e.id
        WHERE pi.purchase_id = $1
      `,
      values: [purchaseId]
    };
    
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error getting purchase items:', error);
    throw error;
  }
};

// Create a new purchase
export const createPurchase = async (client, purchaseData, items) => {
  const dbClient = client || global.pool;
  const shouldReleaseClient = !client;
  
  let localClient = dbClient;
  
  if (shouldReleaseClient) {
    localClient = await global.pool.connect();
  }
  
  try {
    if (shouldReleaseClient) {
      await localClient.query('BEGIN');
    }
    
    // Insert the purchase
    const purchaseQuery = {
      text: `
        INSERT INTO purchases (
          user_id, order_id, total, subtotal, discounts, 
          payment_method, payment_status, purchase_date, purchase_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `,
      values: [
        purchaseData.user_id,
        purchaseData.order_id || `ORDER-${Date.now()}`,
        purchaseData.total,
        purchaseData.subtotal,
        purchaseData.discounts || 0,
        purchaseData.payment_method || 'credit',
        purchaseData.payment_status || 'completed',
        purchaseData.purchase_date || new Date(),
        purchaseData.purchase_time || new Date().toTimeString().split(' ')[0]
      ]
    };
    
    const purchaseResult = await localClient.query(purchaseQuery);
    const purchase = purchaseResult.rows[0];
    
    // Insert the purchase items
    for (const item of items) {
      const itemQuery = {
        text: `
          INSERT INTO purchase_items (
            purchase_id, ticket_type_id, quantity, price
          ) VALUES ($1, $2, $3, $4)
          RETURNING *
        `,
        values: [
          purchase.id,
          item.ticket_type_id,
          item.quantity,
          item.price
        ]
      };
      
      await localClient.query(itemQuery);
    }
    
    if (shouldReleaseClient) {
      await localClient.query('COMMIT');
    }
    
    return purchase;
  } catch (error) {
    if (shouldReleaseClient) {
      await localClient.query('ROLLBACK');
    }
    console.error('Error creating purchase:', error);
    throw error;
  } finally {
    if (shouldReleaseClient && localClient) {
      localClient.release();
    }
  }
};

// Find tickets associated with a purchase
export const findTicketsByPurchaseId = async (purchaseId) => {
  try {
    const query = {
      text: `
        SELECT t.*, tt.name as ticket_type_name
        FROM tickets t
        JOIN ticket_types tt ON t.ticket_type_id = tt.id
        WHERE t.purchase_id = $1
      `,
      values: [purchaseId]
    };
    
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error finding tickets by purchase ID:', error);
    throw error;
  }
};