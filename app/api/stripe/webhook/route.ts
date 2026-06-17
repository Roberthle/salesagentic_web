import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import Stripe from 'stripe';

const dbPath = process.env.REGISTRY_DB_PATH || '/Users/robertle/tomcat_registry/data/registry.db';

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const sig = req.headers.get('stripe-signature') || '';

        const stripeKey = process.env.STRIPE_SECRET_KEY || '';
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

        if (!stripeKey) {
            return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
        }

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2025-12-18.acacia' as any
        });

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
        } catch (err: any) {
            console.error(`Webhook signature verification failed:`, err.message);
            return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
        }

        console.log(`Received Stripe Webhook Event: ${event.type}`);

        // Handle the event
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const metadata = session.metadata || {};
            const email = metadata.email;
            const domain = metadata.domain;
            const audience = metadata.audience;
            const what_you_sell = metadata.what_you_sell;

            if (email) {
                console.log(`Activating trial for user: ${email} (domain: ${domain}, audience: ${audience}, what_you_sell: ${what_you_sell})`);

                const customerId = session.customer as string;
                const subscriptionId = session.subscription as string;

                await new Promise<void>((resolve, reject) => {
                    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
                        if (err) return reject(err);
                    });

                    db.serialize(() => {
                        // 1. Update trial_users table status to active
                        db.run(`
                            UPDATE trial_users
                            SET status = 'active', stripe_customer_id = ?, stripe_subscription_id = ?
                            WHERE email = ?
                        `, [customerId, subscriptionId, email], function(err) {
                            if (err) {
                                db.close();
                                return reject(err);
                            }
                        });

                        // 2. Fetch the updated user ID
                        db.get("SELECT id FROM trial_users WHERE email = ?", [email], (err, row: any) => {
                            if (err || !row) {
                                db.close();
                                return reject(err || new Error("User not found"));
                            }

                            const userId = row.id;

                            // 3. Create active trial campaign with 50 email limit
                            db.run(`
                                INSERT OR REPLACE INTO trial_campaigns (trial_user_id, emails_sent, max_emails, status)
                                VALUES (?, 0, 50, 'running')
                            `, [userId], (err) => {
                                db.close();
                                if (err) return reject(err);
                                resolve();
                            });
                        });
                    });
                });

                console.log(`Successfully activated trial and campaign for: ${email}`);
            }
        }

        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: error.message || "Webhook handler failed" }, { status: 500 });
    }
}
