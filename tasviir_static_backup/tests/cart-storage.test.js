/**
 * Verifies cart localStorage sanitization — run: node tests/cart-storage.test.js
 */
'use strict';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500';

function stripHeavyDataUrl(value) {
    return (typeof value === 'string' && value.startsWith('data:')) ? PLACEHOLDER_IMAGE : value;
}

function sanitizeCartItemForStorage(item) {
    const copy = { ...item };
    copy.image = stripHeavyDataUrl(copy.image);
    if (copy.photoUrl) {
        copy.photoUrl = stripHeavyDataUrl(copy.photoUrl);
        if (copy.photoUrl === PLACEHOLDER_IMAGE && item.photoUrl && item.photoUrl.startsWith('data:')) {
            copy.hasCustomPhoto = true;
        }
    }
    return copy;
}

let passed = 0;
let failed = 0;

function assert(condition, label) {
    if (condition) {
        passed += 1;
        console.log(`  OK: ${label}`);
    } else {
        failed += 1;
        console.error(`  FAIL: ${label}`);
    }
}

const hugeBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(2_000_000);
const cartItem = {
    id: 'custom_1',
    title: 'Custom Frame',
    price: 499,
    image: hugeBase64,
    photoUrl: hugeBase64,
    qty: 1
};

const sanitized = sanitizeCartItemForStorage(cartItem);
const serialized = JSON.stringify([sanitized]);

assert(sanitized.image === PLACEHOLDER_IMAGE, 'image base64 replaced with placeholder');
assert(sanitized.photoUrl === PLACEHOLDER_IMAGE, 'photoUrl base64 replaced with placeholder');
assert(sanitized.hasCustomPhoto === true, 'hasCustomPhoto flag set');
assert(serialized.length < 5000, 'serialized cart stays small (<5KB)');
assert(JSON.stringify([cartItem]).length > 1_000_000, 'unsanitized cart would exceed 1MB');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
