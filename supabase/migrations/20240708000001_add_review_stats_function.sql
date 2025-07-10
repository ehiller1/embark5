-- Function to get review statistics for a provider
CREATE OR REPLACE FUNCTION get_review_stats(provider_id_param UUID)
RETURNS TABLE (
  total_reviews BIGINT,
  average_rating NUMERIC,
  count_5 BIGINT,
  count_4 BIGINT,
  count_3 BIGINT,
  count_2 BIGINT,
  count_1 BIGINT,
  pending_responses BIGINT
) 
LANGUAGE SQL
AS $$
  SELECT 
    COUNT(*)::BIGINT AS total_reviews,
    COALESCE(AVG(rating)::NUMERIC(10,2), 0) AS average_rating,
    COUNT(*) FILTER (WHERE rating = 5)::BIGINT AS count_5,
    COUNT(*) FILTER (WHERE rating = 4)::BIGINT AS count_4,
    COUNT(*) FILTER (WHERE rating = 3)::BIGINT AS count_3,
    COUNT(*) FILTER (WHERE rating = 2)::BIGINT AS count_2,
    COUNT(*) FILTER (WHERE rating = 1)::BIGINT AS count_1,
    COUNT(*) FILTER (WHERE provider_response IS NULL)::BIGINT AS pending_responses
  FROM service_reviews
  WHERE provider_id = provider_id_param;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_review_stats(UUID) TO authenticated;
