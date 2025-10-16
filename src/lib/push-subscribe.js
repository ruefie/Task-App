// src/lib/push-subscribe.js
// import { supabase } from './supabaseClient';

// export async function subscribeUserToPush(supabaseClient, subscription) {
//   const {
//     data: { user },
//     error: userErr
//   } = await supabaseClient.auth.getUser();
//   if (userErr || !user) {
//     console.error('No authenticated user', userErr);
//     return;
//   }

//   const { error: dbErr } = await supabaseClient
//     .from('push_subscriptions')
//     .insert({ user_id: user.id, subscription });

//   if (dbErr) console.error('DB insert error:', dbErr);
// }



// src/lib/push-subscribe.js

// Normalize a PushSubscription to plain JSON and pull out the endpoint.
function normalizeSubscription(subscription) {
  const json = typeof subscription?.toJSON === 'function'
    ? subscription.toJSON()
    : subscription;

  const endpoint = subscription?.endpoint || json?.endpoint;
  if (!endpoint) throw new Error('PushSubscription missing endpoint');

  return { endpoint, json };
}

/**
 * Upsert the current user's subscription.
 * - Idempotent: one row per endpoint (avoids duplicates)
 * - Updates subscription JSON if endpoint already exists
 */
export async function subscribeUserToPush(supabaseClient, subscription) {
  const {
    data: { user },
    error: userErr,
  } = await supabaseClient.auth.getUser();
  if (userErr || !user) {
    console.error('No authenticated user', userErr);
    return;
  }

  const { endpoint, json } = normalizeSubscription(subscription);

  const payload = {
    user_id: user.id,
    endpoint,
    subscription: json,
    updated_at: new Date().toISOString(),
  };

  // requires UNIQUE constraint on `endpoint` (see SQL below)
  const { error: dbErr } = await supabaseClient
    .from('push_subscriptions')
    .upsert(payload, { onConflict: 'endpoint' });

  if (dbErr) console.error('push_subscriptions upsert error:', dbErr);
}

/**
 * Delete a subscription by PushSubscription object or endpoint string.
 */
export async function deleteUserPushSubscription(supabaseClient, subscriptionOrEndpoint) {
  const endpoint = typeof subscriptionOrEndpoint === 'string'
    ? subscriptionOrEndpoint
    : subscriptionOrEndpoint?.endpoint ||
      (typeof subscriptionOrEndpoint?.toJSON === 'function'
        ? subscriptionOrEndpoint.toJSON()?.endpoint
        : undefined);

  if (!endpoint) {
    console.warn('deleteUserPushSubscription: missing endpoint');
    return;
  }

  const { error } = await supabaseClient
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint);

  if (error) console.error('push_subscriptions delete error:', error);
}

/**
 * (Optional) List current user's subscriptions.
 */
export async function listUserPushSubscriptions(supabaseClient) {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabaseClient
    .from('push_subscriptions')
    .select('endpoint, subscription, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('push_subscriptions list error:', error);
    return [];
  }
  return data || [];
}
