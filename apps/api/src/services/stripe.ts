import Stripe from 'stripe';
import { prisma } from '@cryb/database';

export class StripeService {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey || secretKey.startsWith('sk_test_temp')) {
      console.warn('⚠️ Stripe running with test/temporary key. Replace with actual key for production.');
    }

    this.stripe = new Stripe(secretKey || 'sk_test_temp', {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    });

    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  // Create a customer in Stripe
  async createCustomer(userId: string, email: string, name?: string) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
          platform: 'cryb',
        },
      });

      // Save Stripe customer ID to database
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
      });

      return customer;
    } catch (error) {
      console.error('Failed to create Stripe customer:', error);
      throw error;
    }
  }

  // Create subscription checkout session
  async createCheckoutSession(
    userId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, stripeCustomerId: true },
      });

      if (!user) throw new Error('User not found');

      // Create customer if doesn't exist
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await this.createCustomer(userId, user.email!);
        customerId = customer.id;
      }

      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
        },
      });

      return session;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      throw error;
    }
  }

  // Create one-time payment session
  async createPaymentSession(
    userId: string,
    amount: number,
    currency: string = 'usd',
    description: string,
    successUrl: string,
    cancelUrl: string
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, stripeCustomerId: true },
      });

      if (!user) throw new Error('User not found');

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await this.createCustomer(userId, user.email!);
        customerId = customer.id;
      }

      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: description,
                description: `Payment for ${description}`,
              },
              unit_amount: amount * 100, // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          description,
        },
      });

      return session;
    } catch (error) {
      console.error('Failed to create payment session:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string) {
    try {
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      
      // Update user's premium status in database
      const userId = subscription.metadata?.userId;
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { 
            isPremium: false,
            premiumUntil: new Date(),
          },
        });
      }

      return subscription;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  // Get customer's subscriptions
  async getSubscriptions(customerId: string) {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
      });

      return subscriptions.data;
    } catch (error) {
      console.error('Failed to get subscriptions:', error);
      throw error;
    }
  }

  // Process webhook events
  async handleWebhook(signature: string, body: string) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        this.webhookSecret
      );

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;
          
          if (userId) {
            await prisma.user.update({
              where: { id: userId },
              data: {
                isPremium: subscription.status === 'active',
                premiumUntil: new Date(subscription.current_period_end * 1000),
              },
            });
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;
          
          if (userId) {
            await prisma.user.update({
              where: { id: userId },
              data: {
                isPremium: false,
                premiumUntil: new Date(),
              },
            });
          }
          break;
        }

        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log('Payment succeeded:', paymentIntent.id);
          
          // Record transaction in database
          if (paymentIntent.metadata?.userId) {
            await prisma.transaction.create({
              data: {
                userId: paymentIntent.metadata.userId,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency,
                status: 'completed',
                stripePaymentIntentId: paymentIntent.id,
                type: 'payment',
              },
            });
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.error('Payment failed:', paymentIntent.id);
          
          // Record failed transaction
          if (paymentIntent.metadata?.userId) {
            await prisma.transaction.create({
              data: {
                userId: paymentIntent.metadata.userId,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency,
                status: 'failed',
                stripePaymentIntentId: paymentIntent.id,
                type: 'payment',
              },
            });
          }
          break;
        }
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error);
      throw error;
    }
  }

  // Create customer portal session for billing management
  async createPortalSession(customerId: string, returnUrl: string) {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return session;
    } catch (error) {
      console.error('Failed to create portal session:', error);
      throw error;
    }
  }

  // Get payment methods
  async getPaymentMethods(customerId: string) {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      console.error('Failed to get payment methods:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService();