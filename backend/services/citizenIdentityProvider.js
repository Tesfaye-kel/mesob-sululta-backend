const crypto = require('crypto');

const getFanHash = (fan) => {
  const secret = process.env.FAN_HASH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    const error = new Error('JWT_SECRET must be configured before citizen FAN values can be stored safely.');
    error.status = 503;
    throw error;
  }
  return crypto.createHmac('sha256', secret).update(String(fan).trim()).digest('hex');
};

const maskPhone = (phone) => {
  const digits = String(phone).replace(/\D/g, '');
  return `*******${digits.slice(-3)}`;
};

async function lookupWithAuthorizedProvider(fan) {
  const url = process.env.FAN_IDENTITY_URL;
  const apiKey = process.env.FAN_IDENTITY_API_KEY;
  if (!url || !apiKey) {
    const error = new Error('Authorized FAN identity verification is not configured.');
    error.status = 503;
    throw error;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ fan }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    const error = new Error(response.status === 404 ? 'FAN was not found in the authorized identity source.' : 'Identity verification provider is unavailable.');
    error.status = response.status === 404 ? 404 : 503;
    throw error;
  }
  const record = await response.json();
  if (!record.verified || !record.phone || typeof record.phone !== 'string') {
    const error = new Error('The identity source did not return a verified phone number.');
    error.status = 403;
    throw error;
  }
  return {
    fanHash: getFanHash(fan),
    phone: record.phone,
    displayName: typeof record.name === 'string' ? record.name : '',
    verifiedBy: 'authorized-provider',
  };
}

async function lookupWithDevelopmentMock(fan) {
  if (process.env.NODE_ENV === 'production') {
    const error = new Error('The development identity mock is disabled in production.');
    error.status = 503;
    throw error;
  }
  let identities;
  try {
    identities = JSON.parse(process.env.FAN_MOCK_IDENTITIES || '{}');
  } catch (error) {
    throw new Error(`FAN_MOCK_IDENTITIES must be valid JSON: ${error.message}`);
  }

  const record = identities[String(fan).trim()];
  if (!record || typeof record.phone !== 'string' || !record.phone) {
    const error = new Error('FAN was not found in the configured development mock identity list.');
    error.status = 404;
    throw error;
  }
  return {
    fanHash: getFanHash(fan),
    phone: record.phone,
    displayName: typeof record.name === 'string' ? record.name : '',
    verifiedBy: 'development-mock',
  };
}

async function lookupVerifiedIdentity(fan) {
  if (process.env.FAN_IDENTITY_PROVIDER === 'mock') {
    return lookupWithDevelopmentMock(fan);
  }
  if (process.env.FAN_IDENTITY_PROVIDER !== 'authorized') {
    const error = new Error('Set FAN_IDENTITY_PROVIDER to "authorized" and configure the provider, or "mock" for local development only.');
    error.status = 503;
    throw error;
  }
  return lookupWithAuthorizedProvider(fan);
}

function encryptPhone(phone) {
  const keyHex = process.env.PHONE_ENCRYPTION_KEY;
  if (!keyHex || !/^[\da-f]{64}$/i.test(keyHex)) {
    throw new Error('PHONE_ENCRYPTION_KEY must be a 32-byte hex key.');
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(keyHex, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(phone, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptPhone(value) {
  const [ivHex, authTagHex, encryptedHex] = String(value).split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(process.env.PHONE_ENCRYPTION_KEY, 'hex'), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]).toString('utf8');
}

module.exports = { getFanHash, maskPhone, lookupVerifiedIdentity, encryptPhone, decryptPhone };
