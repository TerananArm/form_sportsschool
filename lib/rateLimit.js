/**
 * Rate Limiter for API Protection
 * ระบบจำกัดจำนวน request เพื่อป้องกัน DDoS และ Brute Force
 */

const rateLimitStore = new Map();

// Configuration for different types of rate limits
const RATE_LIMIT_CONFIG = {
    registration: {
        limit: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
        message: 'คุณส่งใบสมัครมากเกินไป กรุณารอ 15 นาทีแล้วลองใหม่อีกครั้ง'
    },
    login: {
        limit: 10,
        windowMs: 15 * 60 * 1000, // 15 minutes
        message: 'พยายามเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาทีแล้วลองใหม่'
    },
    api: {
        limit: 100,
        windowMs: 60 * 1000, // 1 minute
        message: 'คำขอมากเกินไป กรุณารอสักครู่'
    }
};

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
        if (now - value.timestamp > value.windowMs) {
            rateLimitStore.delete(key);
        }
    }
}, 300000);

/**
 * Get client IP from request headers
 */
export function getClientIP(request) {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Check rate limit with configurable type
 * @param {string} ip - Client IP
 * @param {string} type - 'registration', 'login', or 'api'
 */
export function checkRateLimit(ip, type = 'api') {
    const config = RATE_LIMIT_CONFIG[type] || RATE_LIMIT_CONFIG.api;
    const key = `${type}:${ip}`;
    const now = Date.now();

    if (!rateLimitStore.has(key)) {
        rateLimitStore.set(key, { count: 1, timestamp: now, windowMs: config.windowMs });
        return { success: true, remaining: config.limit - 1 };
    }

    const data = rateLimitStore.get(key);

    // Reset if window has passed
    if (now - data.timestamp > config.windowMs) {
        rateLimitStore.set(key, { count: 1, timestamp: now, windowMs: config.windowMs });
        return { success: true, remaining: config.limit - 1 };
    }

    // Check if limit exceeded
    if (data.count >= config.limit) {
        return {
            success: false,
            remaining: 0,
            retryAfter: Math.ceil((data.timestamp + config.windowMs - now) / 1000),
            message: config.message
        };
    }

    // Increment count
    data.count++;
    return { success: true, remaining: config.limit - data.count };
}

/**
 * Legacy function for backward compatibility
 */
export function rateLimitResponse(remaining, retryAfter, message) {
    return new Response(
        JSON.stringify({
            success: false,
            error: message || 'คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่'
        }),
        {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'X-RateLimit-Remaining': remaining.toString(),
                'Retry-After': retryAfter?.toString() || '60',
            },
        }
    );
}
