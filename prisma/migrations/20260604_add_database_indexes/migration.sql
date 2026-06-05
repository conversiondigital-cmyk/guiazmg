-- Add indexes for frequent queries and FK lookups
CREATE INDEX IF NOT EXISTS "boosts_businessId_idx" ON "boosts"("businessId");
CREATE INDEX IF NOT EXISTS "boosts_listingId_idx" ON "boosts"("listingId");
CREATE INDEX IF NOT EXISTS "boosts_status_idx" ON "boosts"("status");
CREATE INDEX IF NOT EXISTS "boosts_startsAt_idx" ON "boosts"("startsAt");

CREATE INDEX IF NOT EXISTS "review_responses_businessId_idx" ON "review_responses"("businessId");
CREATE INDEX IF NOT EXISTS "review_responses_userId_idx" ON "review_responses"("userId");

CREATE INDEX IF NOT EXISTS "business_claim_requests_userId_idx" ON "business_claim_requests"("userId");
CREATE INDEX IF NOT EXISTS "business_claim_requests_businessId_idx" ON "business_claim_requests"("businessId");
CREATE INDEX IF NOT EXISTS "business_claim_requests_status_idx" ON "business_claim_requests"("status");
CREATE INDEX IF NOT EXISTS "business_claim_requests_createdAt_idx" ON "business_claim_requests"("createdAt");

CREATE INDEX IF NOT EXISTS "payments_businessId_idx" ON "payments"("businessId");
CREATE INDEX IF NOT EXISTS "payments_type_idx" ON "payments"("type");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");
CREATE INDEX IF NOT EXISTS "payments_createdAt_idx" ON "payments"("createdAt");

CREATE INDEX IF NOT EXISTS "service_request_responses_requestId_idx" ON "service_request_responses"("requestId");
CREATE INDEX IF NOT EXISTS "service_request_responses_userId_idx" ON "service_request_responses"("userId");
