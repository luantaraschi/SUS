const crypto = require("crypto");

const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
});

console.log("--- COPIE PARA A VARIÁVEL JWT_PRIVATE_KEY ---");
console.log(privateKey.replace(/\n/g, "\\n"));

const jwk = crypto.createPublicKey(publicKey).export({ format: "jwk" });
jwk.alg = "RS256";
jwk.use = "sig";
jwk.kid = crypto.randomBytes(16).toString("hex");

console.log("\n--- COPIE PARA A VARIÁVEL JWKS ---");
console.log(JSON.stringify({ keys: [jwk] }));
