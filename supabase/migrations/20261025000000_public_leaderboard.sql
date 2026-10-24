-- Nova Vanguard: let signed-out visitors see the leaderboard preview on the landing page.
-- Only public fields are returned (username, avatar, score, survival time); contact details are never exposed.
grant execute on function public.get_leaderboard(text, date, int) to anon;
grant execute on function public.list_periods(text, int) to anon;
