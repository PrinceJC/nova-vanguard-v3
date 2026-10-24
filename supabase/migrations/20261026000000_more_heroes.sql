-- Nova Vanguard: allow the six new hero ids (Astra, Seraphine, Elara, Kai, Lyra, Rook). Existing ids are unchanged.
alter table public.profiles drop constraint if exists profiles_avatar_known;
alter table public.profiles add constraint profiles_avatar_known check (avatar in ('lumi','nova','riko','pip','aria','kestrel','mochi','sable','juno','vega',
  'haru','ines','dax','orla','zephyr','tamsin','wren','cass','elio','luma','astra','seraphine','elara','kai','lyra','rook'));
