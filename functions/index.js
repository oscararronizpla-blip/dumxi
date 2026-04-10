'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});

admin.initializeApp();
const db = admin.firestore();

var stripeKey = process.env.STRIPE_SECRET_KEY || '';
var webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
try {
  var cfg = functions.config();
  if (cfg.stripe) {
    if (cfg.stripe.secret_key) stripeKey = cfg.stripe.secret_key;
    if (cfg.stripe.webhook_secret) webhookSecret = cfg.stripe.webhook_secret;
  }
} catch(e) {}

var stripe = require('stripe')(stripeKey);

exports.createPaymentIntent = functions.region('europe-west1').https.onRequest(function(req, res) {
  cors(req, res, async function() {
    if (req.method !== 'POST') {
      return res.status(405).json({error: 'Method not allowed'});
    }
    try {
      var amount = req.body.amount;
      var uid = req.body.uid;
      var tipo = req.body.tipo || '';
      var sesId = req.body.sesId || '';
      var currency = req.body.currency || 'eur';

      if (!amount || !uid) {
        return res.status(400).json({error: 'Missing required fields'});
      }

      var paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        metadata: {uid: uid, tipo: tipo, sesId: sesId}
      });

      return res.status(200).json({clientSecret: paymentIntent.client_secret});
    } catch(err) {
      console.error('createPaymentIntent error:', err);
      return res.status(500).json({error: err.message});
    }
  });
});

exports.stripeWebhook = functions.region('europe-west1').https.onRequest(async function(req, res) {
  var sig = req.headers['stripe-signature'];
  var event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch(err) {
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
        uid: uid, tipo: tipo, sesId: sesId || null,
        amount: amount, currency: pi.currency,
        paymentIntentId: pi.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      if (tipo === 'online') {
        await db.collection('users').doc(uid).update({
          cursoActivo: true, progreso: 0, leccionesCompletadas: []
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
    snap.forEach(function(doc) { batch.update(doc.ref, {status: 'cancelled'}); });
    await batch.commit();
    console.log('Auto-cancelled', snap.size, 'sessions');
    return null;
  });
