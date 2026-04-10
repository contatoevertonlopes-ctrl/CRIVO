
DELETE FROM public.transactions
WHERE user_id NOT IN (
  '1e6abf9a-e38f-48ab-9ea3-c16b58d8abfc',
  '41945181-d355-499e-a45c-c1099e2d740d',
  '40367a34-21b3-40a2-832b-de52e93aed1a'
);
