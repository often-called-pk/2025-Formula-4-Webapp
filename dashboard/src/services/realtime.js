// dashboard/src/services/realtime.js
import { supabase, TABLES } from '../config/supabase.js';

class RealtimeService {
  constructor() {
    this.subscriptions = new Map();
    this.listeners = new Map();
  }

  // Subscribe to session updates
  subscribeToSessions(callback) {
    const subscriptionKey = 'sessions';
    
    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribe(subscriptionKey);
    }

    const subscription = supabase
      .channel('sessions-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.SESSIONS
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);
    return subscriptionKey;
  }

  // Subscribe to telemetry data updates for a specific session
  subscribeToTelemetryData(sessionId, callback) {
    const subscriptionKey = `telemetry-${sessionId}`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribe(subscriptionKey);
    }

    const subscription = supabase
      .channel(`telemetry-${sessionId}-channel`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.TELEMETRY_DATA,
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);
    return subscriptionKey;
  }

  // Subscribe to live telemetry streaming (for real-time data acquisition)
  subscribeToLiveTelemetry(callback) {
    const subscriptionKey = 'live-telemetry';
    
    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribe(subscriptionKey);
    }

    const subscription = supabase
      .channel('live-telemetry-channel')
      .on('broadcast', { event: 'telemetry-update' }, (payload) => {
        callback(payload);
      })
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);
    return subscriptionKey;
  }

  // Subscribe to lap updates
  subscribeToLaps(sessionId, callback) {
    const subscriptionKey = `laps-${sessionId}`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribe(subscriptionKey);
    }

    const subscription = supabase
      .channel(`laps-${sessionId}-channel`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.LAPS,
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);
    return subscriptionKey;
  }

  // Subscribe to driver updates
  subscribeToDrivers(callback) {
    const subscriptionKey = 'drivers';
    
    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribe(subscriptionKey);
    }

    const subscription = supabase
      .channel('drivers-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.DRIVERS
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);
    return subscriptionKey;
  }

  // Broadcast live telemetry data
  async broadcastTelemetryData(data) {
    try {
      const { error } = await supabase
        .channel('live-telemetry-channel')
        .send({
          type: 'broadcast',
          event: 'telemetry-update',
          payload: data
        });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Broadcast telemetry data error:', error);
      return { error: error.message };
    }
  }

  // Subscribe to presence (online users)
  subscribeToPresence(userId, userInfo, callback) {
    const subscriptionKey = 'presence';
    
    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribe(subscriptionKey);
    }

    const subscription = supabase
      .channel('presence-channel')
      .on('presence', { event: 'sync' }, () => {
        const state = subscription.presenceState();
        callback(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        callback({ event: 'join', key, newPresences });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        callback({ event: 'leave', key, leftPresences });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await subscription.track({
            user_id: userId,
            ...userInfo,
            online_at: new Date().toISOString()
          });
        }
      });

    this.subscriptions.set(subscriptionKey, subscription);
    return subscriptionKey;
  }

  // Unsubscribe from a specific subscription
  unsubscribe(subscriptionKey) {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(subscriptionKey);
      return true;
    }
    return false;
  }

  // Unsubscribe from all subscriptions
  unsubscribeAll() {
    for (const [key, subscription] of this.subscriptions) {
      supabase.removeChannel(subscription);
    }
    this.subscriptions.clear();
  }

  // Get subscription status
  getSubscriptionStatus(subscriptionKey) {
    const subscription = this.subscriptions.get(subscriptionKey);
    return subscription ? subscription.state : 'CLOSED';
  }

  // Get all active subscriptions
  getActiveSubscriptions() {
    return Array.from(this.subscriptions.keys());
  }

  // Subscribe to custom events
  subscribeToCustomEvent(eventName, callback) {
    const subscriptionKey = `custom-${eventName}`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribe(subscriptionKey);
    }

    const subscription = supabase
      .channel(`custom-${eventName}-channel`)
      .on('broadcast', { event: eventName }, (payload) => {
        callback(payload);
      })
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);
    return subscriptionKey;
  }

  // Broadcast custom event
  async broadcastCustomEvent(eventName, data) {
    try {
      const { error } = await supabase
        .channel(`custom-${eventName}-channel`)
        .send({
          type: 'broadcast',
          event: eventName,
          payload: data
        });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Broadcast custom event error:', error);
      return { error: error.message };
    }
  }
}

export const realtimeService = new RealtimeService();
export default realtimeService;