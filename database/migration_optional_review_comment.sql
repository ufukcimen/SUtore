-- ============================================================
-- SUtore: Make reviews.comment nullable
-- ============================================================
-- Rating-only reviews (no comment) are auto-approved and skip the
-- product manager moderation queue. They count toward the average
-- rating just like reviews with comments.
--
-- Safe to re-run: the ALTER is idempotent.
-- ============================================================

ALTER TABLE reviews ALTER COLUMN comment DROP NOT NULL;

-- Verify with:
--   \d reviews
--   (the comment column should show "text" with no "not null")
