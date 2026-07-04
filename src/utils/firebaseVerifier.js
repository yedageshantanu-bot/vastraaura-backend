const jwt = require("jsonwebtoken");

let cachedKeys = null;
let keysExpiryTime = 0;

const GOOGLE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

const fetchGooglePublicKeys = async () => {
  const now = Date.now();
  if (cachedKeys && now < keysExpiryTime) {
    return cachedKeys;
  }

  console.log("[VastraAura Backend] Fetching fresh Google public certificates...");
  try {
    const response = await fetch(GOOGLE_CERTS_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch certificates: ${response.statusText}`);
    }

    const data = await response.json();
    cachedKeys = data;

    // Cache certificates for 1 hour
    keysExpiryTime = now + 1000 * 60 * 60;
    return cachedKeys;
  } catch (error) {
    console.error("[VastraAura Backend] Failed to fetch Google certificates", error);
    if (cachedKeys) {
      // Fallback to expired cached keys if fetch fails
      return cachedKeys;
    }
    throw error;
  }
};

/**
 * Verifies a Firebase JWT ID Token using Google's public certificates.
 * Does NOT require any Firebase service account files!
 * 
 * @param {string} token - The raw Firebase ID Token
 * @param {string} projectId - Your Firebase Project ID
 * @returns {Promise<object>} The verified and decoded token payload
 */
const verifyFirebaseIdToken = async (token, projectId) => {
  if (!token) {
    throw new Error("Token is empty");
  }

  // 1. Decode token to inspect the header and get the 'kid' (Key ID)
  const decodedHeader = jwt.decode(token, { complete: true });
  if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
    throw new Error("Invalid token structure or missing 'kid' in header");
  }

  const kid = decodedHeader.header.kid;

  // 2. Retrieve active public certificates from Google
  const publicKeys = await fetchGooglePublicKeys();
  const publicKeyPem = publicKeys[kid];

  if (!publicKeyPem) {
    throw new Error(`Public key not found for kid: ${kid}`);
  }

  // 3. Verify the signature and claims using jsonwebtoken
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      publicKeyPem,
      {
        algorithms: ["RS256"],
        audience: projectId,
        issuer: `https://securetoken.google.com/${projectId}`,
        clockTolerance: 300, // Allow up to 5 minutes of clock skew
      },
      (err, decoded) => {
        if (err) {
          return reject(err);
        }

        // Validate extra claims with tolerance for clock skew
        const now = Math.floor(Date.now() / 1000);
        if (decoded.auth_time > now + 300) {
          return reject(new Error("Token auth_time is in the future"));
        }

        resolve(decoded);
      }
    );
  });
};

module.exports = {
  verifyFirebaseIdToken,
};
