const { sanitizeNoSql, sanitizeXss } = require("../src/middleware/sanitizeInput");
const { sanitizeInternalPath } = require("../src/utils/auth");

let passed = 0;
let total = 0;

const assert = (condition, name) => {
  total++;
  if (condition) {
    console.log(`[PASS] ${name}`);
    passed++;
  } else {
    console.error(`[FAIL] ${name}`);
  }
};

console.log("--- RUNNING SECURITY FIX VERIFICATION TESTS ---");

// Test 1: NoSQL Operator Injection
const unsafeNoSql = {
  email: { $ne: null },
  $where: "this.password != null",
  user: "test@example.com",
};
const cleanNoSql = sanitizeNoSql(unsafeNoSql);
assert(!cleanNoSql.$where, "NoSQL $where operator stripped");
assert(cleanNoSql.email && !cleanNoSql.email.$ne, "NoSQL $ne operator stripped from object");
assert(cleanNoSql.user === "test@example.com", "Safe string preserved");

// Test 2: Stored XSS Script Tag Injection
const unsafeXss = {
  comment: "<script>alert('xss')</script>Great product!",
  author: "John <img src=x onerror=alert(1)>",
};
const cleanXss = sanitizeXss(unsafeXss);
assert(!cleanXss.comment.includes("<script>"), "Script tag stripped from comment");
assert(cleanXss.comment === "Great product!", "Clean text retained after script strip");

// Test 3: Open Redirect Prevention
assert(sanitizeInternalPath("https://evil.com") === "/", "Absolute URL rejected for redirect");
assert(sanitizeInternalPath("//evil.com") === "/", "Protocol-relative URL rejected for redirect");
assert(sanitizeInternalPath("/\\evil.com") === "/", "Backslash relative URL rejected for redirect");
assert(sanitizeInternalPath("/checkout?step=2") === "/checkout?step=2", "Valid internal path accepted");

console.log(`\nVerification Summary: ${passed}/${total} security tests passed.`);
if (passed !== total) {
  process.exit(1);
}
