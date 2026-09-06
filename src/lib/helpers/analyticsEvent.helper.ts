import axios from 'axios'
import config from '../../../config'

/**
 * Reports a confirmed server-side event to GA4/Firebase Analytics via the
 * Measurement Protocol, so it lands in the same funnel the app already logs
 * signup_completed / book_read_started / paywall_viewed to (see A6).
 *
 * The client SDK only ever sees "purchase initiated" — the App Store /
 * Stripe webhook is the only place a subscription is actually confirmed, and
 * that confirmation never reached analytics before this. Silent no-op if the
 * user has no firebaseAppInstanceId on file (never logged in post-B5, or an
 * Android install — only the iOS Firebase app is registered today) or the
 * secret isn't configured, since a missing event here should never break a
 * webhook that real money depends on.
 */
export const reportServerAnalyticsEvent = async (
    firebaseAppInstanceId: string | undefined | null,
    eventName: string,
    params: Record<string, string | number | boolean> = {}
): Promise<void> => {
    if (!firebaseAppInstanceId) return
    if (!config.GA_FIREBASE_APP_ID_IOS || !config.GA_MEASUREMENT_API_SECRET) return

    try {
        await axios.post(
            'https://www.google-analytics.com/mp/collect',
            {
                app_instance_id: firebaseAppInstanceId,
                events: [{ name: eventName, params }],
            },
            {
                params: {
                    firebase_app_id: config.GA_FIREBASE_APP_ID_IOS,
                    api_secret: config.GA_MEASUREMENT_API_SECRET,
                },
            }
        )
    } catch (error: any) {
        // Analytics is best-effort. Never let a reporting failure surface as
        // a webhook failure — Stripe/App Store retries the whole request.
        console.log('reportServerAnalyticsEvent failed:', error.message)
    }
}
