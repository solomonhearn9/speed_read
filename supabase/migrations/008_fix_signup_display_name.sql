-- Hotfix: signup trigger failed with "Database error saving new user"
-- because generate_display_name() was unresolved under auth's SECURITY DEFINER search_path.

CREATE OR REPLACE FUNCTION public.generate_display_name()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  animals TEXT[] := ARRAY[
    'otter', 'falcon', 'lynx', 'heron', 'badger', 'osprey', 'marten', 'kite',
    'stoat', 'eagle', 'fox', 'wolf', 'hawk', 'raven', 'puma', 'crane',
    'swift', 'ibex', 'mink', 'tern'
  ];
  adjectives TEXT[] := ARRAY[
    'swift', 'bright', 'keen', 'bold', 'calm', 'quick', 'sharp', 'steady',
    'nimble', 'clear', 'brave', 'fleet'
  ];
  candidate TEXT;
  attempts INT := 0;
BEGIN
  LOOP
    candidate := adjectives[1 + floor(random() * array_length(adjectives, 1))::int]
      || '-'
      || animals[1 + floor(random() * array_length(animals, 1))::int]
      || '-'
      || (100 + floor(random() * 900))::int::text;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE display_name = candidate
    );
    attempts := attempts + 1;
    IF attempts > 20 THEN
      candidate := candidate || '-' || substr(md5(random()::text), 1, 4);
      EXIT;
    END IF;
  END LOOP;
  RETURN candidate;
END;
$$;

ALTER TABLE public.profiles
  ALTER COLUMN display_name SET DEFAULT public.generate_display_name();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, public.generate_display_name());
  RETURN NEW;
END;
$$;
