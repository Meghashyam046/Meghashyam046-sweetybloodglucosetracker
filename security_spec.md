# Database Security Specification - Store Rating Platform

## 1. Data Invariants
- **User Integrity**: A user profile must have a valid name (20–60 characters), a valid address (up to 400 characters), and a valid email format. The role must be one of `admin`, `user`, or `store_owner`.
- **Rating Integrity**: A rating must be an integer between 1 and 5. The submission must link to a valid user (`userId`) and a valid store (`storeId`).
- **Uniqueness**: A user can only submit one rating per store. Subsequent actions of submitting a rating must update the existing rating document rather than creating separate ones.

## 2. Dirty Dozen payloads (Identified & Denied)
1. Creating a user with `role: "admin"` bypass constraint.
2. Creating a user with a name less than 20 characters.
3. Creating a user with a name greater than 60 characters.
4. Setting address length above 400 characters.
5. Creating a rating of `0` or `10` (out of range).
6. Non-logged-in updates to store ratings.
7. Modifying another customer's rating document directly.
8. Submitting a rating pointing to a non-existent store owner.
9. Poisoning User ID fields with empty or 1MB payload strings.
10. Promoting role fields without privileges.
11. Injecting custom admin metadata.
12. Attempting to overwrite the `createdAt` timestamp during updates.

## 3. Test Runner Outline
Our application code uses Firestore client-side SDK. We will implement robust client guards, schema-based inputs validation, and configure secure Firestore Rules to prevent identity spoofing, value poisoning, and cross-user updates.
