-- Kart sistemi yerine "tek özet kartı" modeli.
-- Her analiz turunda AI, dersin o ana kadarki onaylı mesajlarından okunabilir, başlıklı bir özet üretir.
-- Öğretmen "Cevaplandı" deyince özet temizlenir ve yeni özet yalnızca bundan sonra işlenen mesajlardan başlar.
--
-- summary: { "sections": [ { "title": "...", "items": [ { "text": "..." } ] } ] } ya da null
-- summary_cleared_at: son "Cevaplandı" anı; bu andan önce işlenen mesajlar özete girmez.
alter table public.lessons
  add column summary jsonb,
  add column summary_updated_at timestamptz,
  add column summary_cleared_at timestamptz;
