'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});

admin.initializeApp();
const db = admin.firestore();

function getStripe() {
  var key = '';
  try { key = functions.config().stripe.secret_key; } catch(e) {}
  if (!key) key = process.env.STRIPE_SECRET_KEY || '';
  return require('stripe')(key);
}

// CREATE PAYMENT INTENT
exports.createPaymentIntent = functions.region('europe-west1').https.onRequest(function(req, res) {
  cors(req, res, async function() {
    if (req.method !== 'POST') {
      return res.status(405).json({error: 'Method not allowed'});
    }
    try {
      var body = req.body;
      var amount = body.amount;
      var uid = body.uid;
      var tipo = body.tipo;
      var sesId = body.sesId;
      var currency = body.currency || 'eur';

      if (!amount || !uid) {
        return res.status(400).json({error: 'Missing required fields'});
      }

      var stripe = getStripe();
      var paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        metadata: {
          uid: uid,
          tipo: tipo || '',
          sesId: sesId || ''
        }
      });

      return res.status(200).json({clientSecret: paymentIntent.client_secret});
    } catch(err) {
      console.error('createPaymentIntent error:', err);
      return res.status(500).json({error: err.message});
    }
  });
});

// STRIPE WEBHOOK
exports.stripeWebhook = functions.region('europe-west1').https.onRequest(async function(req, res) {
  var webhookSecret = '';
  try { webhookSecret = functions.config().stripe.webhook_secret; } catch(e) {}
  if (!webhookSecret) webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  var sig = req.headers['stripe-signature'];
  var event;
  try {
    var stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch(err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send('Webhook Error: ' + err.message);
  }

  if (event.type === 'payment_intent.succeeded') {
    var pi = event.data.object;
    var uid = pi.metadata.uid;
    var tipo = pi.metadata.tipo;
    var sesId = pi.metadata.sesId;
    var amount = pi.amount / 100;

    try {
      await db.collection('pagos').add({
        uid: uid,
        tipo: tipo,
        sesId: sesId || null,
        amount: amount,
        currency: pi.currency,
        paymentIntentId: pi.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      if (tipo === 'online') {
        await db.collection('users').doc(uid).update({
          cursoActivo: true,
          progreso: 0,
          leccionesCompletadas: []
        });
      }

      if (tipo === 'zoom' && sesId) {
        await db.collection('sessions').doc(sesId).update({
          alumnos: admin.firestore.FieldValue.arrayUnion(uid)
        });
        var sesDoc = await db.collection('sessions').doc(sesId).get();
        var sesData = sesDoc.data();
        if (sesData && sesData.alumnos && sesData.alumnos.length >= 5) {
          await db.collection('sessions').doc(sesId).update({status: 'confirmed'});
        }
      }
    } catch(err) {
      console.error('Error processing payment:', err);
    }
  }

  res.json({received: true});
});

// SCHEDULED: Auto-cancelar sesiones no confirmadas 5 dias antes
exports.checkSessions = functions.region('europe-west1').pubsub
  .schedule('every 24 hours')
  .onRun(async function(context) {
    var now = new Date();
    var fiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    var snap = await db.collection('sessions')
      .where('status', '==', 'pending')
      .where('fecha', '<=', admin.firestore.Timestamp.fromDate(fiveDays))
      .get();

    var batch = db.batch();
    snap.forEach(function(doc) {
      batch.update(doc.ref, {status: 'cancelled'});
    });
    await batch.commit();
    console.log('Auto-cancelled', snap.size, 'sessions');
    return null;
  });
