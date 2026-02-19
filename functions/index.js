const admin = require("firebase-admin");
const {setGlobalOptions} = require("firebase-functions/v2");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

admin.initializeApp();

setGlobalOptions({maxInstances: 10});

exports.registerView = onCall(async (request) => {
  const {productId} = request.data || {};

  if (productId === undefined || productId === null || productId === "") {
    throw new HttpsError("invalid-argument", "productId e obrigatorio.");
  }

  const productRef = admin
      .firestore()
      .collection("products")
      .doc(String(productId));

  try {
    await productRef.set({
      clicks: admin.firestore.FieldValue.increment(1),
    }, {merge: true});

    return {success: true};
  } catch (error) {
    logger.error("registerView falhou", {productId, error: String(error)});
    throw new HttpsError("internal", "Falha ao registrar visualizacao.");
  }
});
