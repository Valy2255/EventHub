// backend/models/SocialAccount.js
import * as db from '../config/db.js';

export const create = async (data) => {
  const { user_id, provider, provider_id, provider_data } = data;
  
  const query = {
    text: `INSERT INTO social_accounts(user_id, provider, provider_id, provider_data) 
           VALUES($1, $2, $3, $4) 
           RETURNING *`,
    values: [user_id, provider, provider_id, provider_data]
  };
  
  const result = await db.query(query);
  return result.rows[0];
};

export const findByProviderAndProviderId = async (provider, providerId) => {
  const query = {
    text: 'SELECT * FROM social_accounts WHERE provider = $1 AND provider_id = $2',
    values: [provider, providerId]
  };
  
  const result = await db.query(query);
  return result.rows[0];
};