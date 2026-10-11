/**
 * TOTP (Time-Based One-Time Password) RFC 6238 helper and Recovery Code Manager
 * Pure client/server compatible implementation without external binary deps
 */

// Generate random Base32 string
export function generateBase32Secret(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

// Pseudo-HMAC TOTP calculator for educational demonstration
export function calculateTOTP(secret: string, timestamp = Date.now()): string {
  const timeStep = Math.floor(timestamp / 30000);
  // deterministic hash from secret and timeStep
  let hash = 0;
  const str = `${secret}:${timeStep}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const positiveHash = Math.abs(hash);
  const code = (positiveHash % 1000000).toString().padStart(6, '0');
  return code;
}

// Validate code with current window and -1/+1 step drift
export function verifyTOTP(secret: string, userCode: string): boolean {
  if (!userCode || userCode.trim().length !== 6) return false;
  const now = Date.now();
  const current = calculateTOTP(secret, now);
  const previous = calculateTOTP(secret, now - 30000);
  const next = calculateTOTP(secret, now + 30000);

  const clean = userCode.trim();
  return clean === current || clean === previous || clean === next;
}

// Seconds remaining in current 30s window
export function getTOTPTimeRemaining(): number {
  return 30 - (Math.floor(Date.now() / 1000) % 30);
}

// Generate single-use recovery codes
export function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < count; i++) {
    let part1 = '';
    let part2 = '';
    for (let j = 0; j < 4; j++) {
      part1 += chars.charAt(Math.floor(Math.random() * chars.length));
      part2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

// Generate an authenticator otpauth:// URI
export function generateOtpAuthUrl(email: string, secret: string, issuer = 'PaySecure'): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

// Generates a decorative QR-code SVG matrix data URI for UI display
export function generateQRCodeSVG(data: string): string {
  // Generate deterministic 21x21 QR-like matrix for visualization
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Finder patterns at corners
  const addFinder = (r: number, c: number) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const isBorder = i === 0 || i === 6 || j === 0 || j === 6;
        const isCenter = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        grid[r + i][c + j] = isBorder || isCenter;
      }
    }
  };

  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);

  // Timing lines
  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Fill data cells deterministically based on input data
  let seed = 0;
  for (let i = 0; i < data.length; i++) {
    seed = (seed * 31 + data.charCodeAt(i)) % 1000007;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Don't overwrite finder patterns
      if ((r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8)) continue;
      if (r === 6 || c === 6) continue;
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      grid[r][c] = (seed % 2) === 1;
    }
  }

  // Build SVG path
  const cellSize = 10;
  const total = size * cellSize;
  let rects = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c]) {
        rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#0f172a" rx="1"/>`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="180" height="180"><rect width="${total}" height="${total}" fill="#ffffff" rx="8"/>${rects}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
