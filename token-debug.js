// Quick token analysis
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMTE5ZjNjMy00ZTUzLTQyNWUtOWNjOC0zZjI2NzQzYzEzMDgiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzYxMzkzOTQyLCJleHAiOjE3NjE5OTg3NDJ9.QXuuCq5mVAEhgfZ0ez-FqvjdiDEeuAFnNDd_ZjKWNzo";

const parts = token.split(".");
console.log("Part 1:", parts[0]);
console.log("Part 2:", parts[1]);
console.log("Part 3:", parts[2]);

// Test different regexes
const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
const base64UrlRegex = /^[A-Za-z0-9_-]*={0,2}$/;
const relaxedRegex = /^[A-Za-z0-9+/_-]*={0,2}$/;

console.log("Original regex tests:");
parts.forEach((part, i) => {
  console.log(`Part ${i + 1} - Original:`, base64Regex.test(part));
  console.log(`Part ${i + 1} - URL-safe:`, base64UrlRegex.test(part));
  console.log(`Part ${i + 1} - Relaxed:`, relaxedRegex.test(part));
  console.log(`Part ${i + 1} content:`, part);
  console.log("---");
});
