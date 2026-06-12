-- Reading Adventures experiment schema

CREATE TABLE IF NOT EXISTS adventure_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT,
  total_chapters INT NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS adventure_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES adventure_stories(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  chapter_number INT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  word_count INT NOT NULL,
  target_wpm INT NOT NULL DEFAULT 250,
  xp_reward INT NOT NULL DEFAULT 25,
  completion_bonus_xp INT NOT NULL DEFAULT 0,
  reward_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(story_id, chapter_number)
);

CREATE TABLE IF NOT EXISTS adventure_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES adventure_chapters(id) ON DELETE CASCADE,
  sort_order INT NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_adventure_progress (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES adventure_stories(id) ON DELETE CASCADE,
  current_chapter_number INT NOT NULL DEFAULT 1,
  chapters_completed INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  total_xp_earned INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, story_id)
);

CREATE TABLE IF NOT EXISTS adventure_chapter_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES adventure_stories(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES adventure_chapters(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  target_wpm INT NOT NULL,
  words_read INT,
  elapsed_seconds INT,
  questions_correct INT,
  questions_total INT NOT NULL DEFAULT 3,
  comprehension_pct INT,
  xp_awarded INT NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adventure_chapters_story ON adventure_chapters(story_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_adventure_questions_chapter ON adventure_questions(chapter_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_user_adventure_progress_user ON user_adventure_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_adventure_attempts_user_story ON adventure_chapter_attempts(user_id, story_id);

ALTER TABLE adventure_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventure_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventure_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_adventure_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventure_chapter_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read adventure stories" ON adventure_stories;
CREATE POLICY "Anyone can read adventure stories" ON adventure_stories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read adventure chapters" ON adventure_chapters;
CREATE POLICY "Anyone can read adventure chapters" ON adventure_chapters FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read adventure questions" ON adventure_questions;
CREATE POLICY "Anyone can read adventure questions" ON adventure_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users read own adventure progress" ON user_adventure_progress;
CREATE POLICY "Users read own adventure progress"
  ON user_adventure_progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own adventure attempts" ON adventure_chapter_attempts;
CREATE POLICY "Users read own adventure attempts"
  ON adventure_chapter_attempts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages adventures" ON adventure_stories;
CREATE POLICY "Service role manages adventures" ON adventure_stories FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role manages adventure chapters" ON adventure_chapters;
CREATE POLICY "Service role manages adventure chapters" ON adventure_chapters FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role manages adventure questions" ON adventure_questions;
CREATE POLICY "Service role manages adventure questions" ON adventure_questions FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role manages user adventure progress" ON user_adventure_progress;
CREATE POLICY "Service role manages user adventure progress" ON user_adventure_progress FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role manages adventure attempts" ON adventure_chapter_attempts;
CREATE POLICY "Service role manages adventure attempts" ON adventure_chapter_attempts FOR ALL USING (auth.role() = 'service_role');

-- Seed: The Lost Crystal Dragon
INSERT INTO adventure_stories (id, slug, title, description, theme, total_chapters) VALUES
(
  'e5000001-0000-4000-8000-000000000001',
  'lost-crystal-dragon',
  'The Lost Crystal Dragon',
  'A blocky adventure about a missing dragon egg, a glowing portal, and a clue hidden deep underground.',
  'pixel-adventure',
  5
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO adventure_chapters (id, story_id, slug, chapter_number, title, body, word_count, target_wpm, xp_reward, completion_bonus_xp, reward_name) VALUES
(
  'e5100001-0000-4000-8000-000000000001',
  'e5000001-0000-4000-8000-000000000001',
  'vanished-egg',
  1,
  'The Vanished Egg',
  'In the blocky village of Stonebrook, every spring the crystal dragon left a single glowing egg on the obsidian tower. The egg warmed the crops, lit the night market, and reminded everyone that magic still lived in their pixel forest.

This year, the tower was empty.

Kai, a young explorer with a satchel full of maps, stood at the tower base and stared at the bare stone. Villagers whispered that the dragon had flown to a floating island beyond the clouds. Others said shadow creatures from the deep caves had stolen it.

Kai did not believe rumors. Kai believed clues.

A faint trail of silver dust spiraled away from the tower and into the wheat fields. The grains bent in a curved path, as if something heavy and bright had rolled through at midnight. At the edge of the field, the dust stopped beside a cracked square of earth.

Kai knelt and brushed away dirt. Underneath was a wooden hatch — the kind miners used to reach tunnels below the village. The hatch was unlocked. A cool breeze rose from the dark opening, smelling of stone and old rain.

From the hatch, Kai heard a soft tapping sound. Not pickaxes. Not footsteps. Something rhythmic, like a heartbeat made of light.

Kai tied a lantern to their belt, gripped the ladder, and began to climb down. Above, the village bells rang once, as if warning the sky itself that an explorer had chosen the underground path.',
  248,
  250,
  25,
  0,
  'Glowing Map Fragment'
),
(
  'e5100001-0000-4000-8000-000000000002',
  'e5000001-0000-4000-8000-000000000001',
  'map-in-the-mine',
  2,
  'The Map in the Mine',
  'The ladder dropped Kai into a mine older than Stonebrook. Wooden supports groaned overhead. Blue mushrooms clung to the walls like tiny lanterns. Far ahead, the tapping sound grew louder.

Kai followed silver dust along the tracks until they found a miner cart tipped on its side. Inside was a leather pack — not stolen, but placed carefully, as if someone wanted it found. Kai opened the pack and pulled out a folded map drawn on graph paper.

The map showed three paths. One led to the village library. One curved toward a river dock. The third dove deeper into the mine toward a glowing cave marked with a purple ring.

A note was pinned to the map: "The egg did not vanish. It was moved. Follow the light, not the noise."

Kai almost went to the library first. Libraries meant answers. But the tapping sound pulsed from the deeper tunnel, and the purple ring on the map shimmered when Kai held the lantern close, as if reacting to heat.

The deeper tunnel narrowed. Water dripped from the ceiling in steady beats. Then Kai saw scratch marks on the wall — blocky symbols carved by someone in a hurry. One symbol looked like an egg. Another looked like a portal.

At the tunnel fork, fresh boot prints turned left toward the glowing cave. The right path smelled like river mud and old rope.

Kai took the left path. The air warmed. The walls changed from gray stone to black glass that reflected Kai''s lantern like stars.

Then the tunnel opened into a round chamber. In the center, floating above a stone pedestal, was a map fragment made of light — and behind it, a sealed door with a keyhole shaped like a dragon''s wing.',
  268,
  250,
  25,
  0,
  'Miner''s Compass'
),
(
  'e5100001-0000-4000-8000-000000000003',
  'e5000001-0000-4000-8000-000000000001',
  'portal-fragment',
  3,
  'The Portal Fragment',
  'Kai touched the glowing map fragment. It melted into their palm and became a warm tattoo of lines and arrows pointing downward. The dragon-wing door shuddered, but did not open. Something was still missing.

A voice echoed from the shadows. "You are early, explorer." An old miner stepped into the lantern light, face lined like stacked bricks. "I am Bram. I helped move the egg to keep it safe."

Kai demanded the truth. Bram pointed to a mural on the chamber wall. It showed a crystal dragon circling a floating island while a purple portal spun beneath it. "Shadow creatures hunt the egg for its light. We hid it below the cave of blue fire."

Bram opened a hidden panel and removed a shard of purple glass — a portal fragment, humming with energy. "This opens the lower gate. But the shard must be aimed correctly. Wrong angle, and the gate sends you to the river dock instead."

Kai studied the mural. The portal in the painting tilted toward a tunnel labeled with a crystal symbol, not toward water. Bram nodded. "You see it. Most people rush. That is how they get lost."

Together they walked to the lower gate — a ring of obsidian blocks set into the floor. Kai placed the portal fragment in the center. The ring glowed cyan, then purple, then gold. Stone blocks around the edge lifted one inch, then settled, forming a staircase that had not existed a moment before.

Bram stayed behind. "I guard the upper mine. You are young enough to run if the shadows return."

Kai descended. Wind rushed upward, carrying the smell of cold metal and burnt sugar — the smell of blue fire. At the bottom of the stairs, a cavern mouth waited, pulsing with light like a heartbeat.

Kai''s tattoo-map burned gently, pointing straight ahead. Somewhere in that pulse, the missing egg was waiting.',
  278,
  250,
  25,
  0,
  'Portal Shard'
),
(
  'e5100001-0000-4000-8000-000000000004',
  'e5000001-0000-4000-8000-000000000001',
  'cave-of-blue-fire',
  4,
  'The Cave of Blue Fire',
  'The cave of blue fire lived up to its name. Flames burned without heat along the walls, casting sharp shadows that moved like living things. Kai walked on a path of flat stones, careful not to step into the fire lines.

Halfway through the cave, shadow creatures appeared — not monsters with names, but shifting patches of darkness with bright eyes. They did not attack. They watched. They hungered for light.

Kai remembered the egg warmed crops because it shared light freely. So Kai raised the lantern and loosened its shutter, letting a wide beam sweep the cave. The shadow creatures recoiled, hissing silently, and melted into cracks in the stone.

Beyond them, the cave opened into a crystal garden. Stalactites hung like frozen rain. In the center sat a nest of woven metal and moss. Inside the nest rested the dragon egg, cracked slightly open, pulsing with gold light.

Kai approached slowly. The egg was warm and humming. A tiny scale, translucent as glass, lay beside it — shed by the crystal dragon before the egg was hidden. Kai pocketed the scale.

Then the ground shook. The blue fire flared bright white. A roar rolled through the cave — not angry, but desperate. The crystal dragon was calling from somewhere above the stone ceiling, unable to reach its egg through solid rock.

The egg''s crack widened. A claw the size of Kai''s thumb pushed through, glowing. Kai realized the egg was hatching early because it sensed danger. If shadows returned in force, the hatchling might not survive.

Kai had to choose: carry the egg up the long mine path, or place the dragon scale into the nest to strengthen its shield of light until the mother could break through.

The tattoo-map flared and drew a third option — a narrow vertical shaft behind the nest, leading toward the obsidian tower above.',
  272,
  250,
  25,
  0,
  'Blue Fire Crystal'
),
(
  'e5100001-0000-4000-8000-000000000005',
  'e5000001-0000-4000-8000-000000000001',
  'dragon-returns',
  5,
  'The Dragon Returns',
  'Kai chose the vertical shaft. Climbing with one hand on the ladder and the other cradling the half-hatched egg was the hardest thing they had ever done. Blue fire light followed upward through cracks, cheering them on like a trail of friends.

At the top, Kai burst into the base of the obsidian tower. Rain had started over Stonebrook. Villagers gathered in the square, pointing at the storm clouds. From inside the egg came a bright chirp — a sound like glass bells.

Kai placed the egg on the tower stone where it belonged. The dragon scale was pressed into the nest beside it. Light exploded upward, painting the clouds gold. Villagers shielded their eyes and then laughed as warmth returned to the air.

The tower roof tore open with a thunder crack — not from damage, but from a crystal dragon diving out of the storm. Her wings were blocky and vast, edges sharp as cut gems. She landed gently, curled around the egg, and breathed a thread of silver fire that sealed the crack without burning.

The hatchling emerged — a small dragon no bigger than a goat, blinking cyan eyes. It sneezed a sparkle of light that turned into a crest-shaped mark on Kai''s satchel.

"You found what was lost," the mother dragon said, voice rumbling like distant drums. "Not only the egg. You found the courage to go underground when others waited for rumors."

She lowered her head to Kai. "Stonebrook will remember your path."

The purple portal in the mine collapsed safely. Shadows fled the deep caves. The village market lights flickered on, one lantern at a time.

Kai stood on the tower and watched the pixel forest sway in the renewed wind. Somewhere beyond the floating islands, other explorers were beginning their own stories. But tonight, the crystal dragon was home — and Kai had earned a rest before the next adventure called.',
  298,
  250,
  25,
  100,
  'Dragon Crest'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO adventure_questions (chapter_id, sort_order, prompt, options, correct_index) VALUES
('e5100001-0000-4000-8000-000000000001', 1, 'Where did the silver dust trail lead Kai?',
 '["To a wooden hatch at the edge of the wheat field", "To the village library", "To the river dock", "To the floating island"]', 0),
('e5100001-0000-4000-8000-000000000001', 2, 'What sound did Kai hear from below the hatch?',
 '["A rhythmic tapping like a heartbeat of light", "Village bells ringing all night", "Shadow creatures roaring", "A miner selling maps"]', 0),
('e5100001-0000-4000-8000-000000000001', 3, 'What was missing from the obsidian tower?',
 '["The crystal dragon''s glowing egg", "The village mayor", "All the wheat crops", "The purple portal"]', 0),

('e5100001-0000-4000-8000-000000000002', 1, 'What did Kai find inside the tipped miner cart?',
 '["A leather pack with a folded map", "The dragon egg", "A portal fragment", "A library book"]', 0),
('e5100001-0000-4000-8000-000000000002', 2, 'Which path did the note tell Kai to follow?',
 '["Follow the light, not the noise", "Go straight to the river", "Ask the village first", "Wait until morning"]', 0),
('e5100001-0000-4000-8000-000000000002', 3, 'Which tunnel did Kai choose at the fork?',
 '["The left path toward the glowing cave", "The right path toward river mud", "Back to the library", "Up to the floating island"]', 0),

('e5100001-0000-4000-8000-000000000003', 1, 'Who explained why the egg was moved?',
 '["Bram the old miner", "The crystal dragon", "A shadow creature", "The village mayor"]', 0),
('e5100001-0000-4000-8000-000000000003', 2, 'What opened the lower gate?',
 '["Placing the portal fragment in the obsidian ring", "Burning the map", "Breaking the tower door", "Flooding the mine"]', 0),
('e5100001-0000-4000-8000-000000000003', 3, 'Where was the egg hidden according to Bram?',
 '["Below the cave of blue fire", "At the river dock", "On the floating island", "In the village library"]', 0),

('e5100001-0000-4000-8000-000000000004', 1, 'How did Kai make the shadow creatures retreat?',
 '["By opening the lantern to share a wide beam of light", "By running back to the village", "By closing the lantern", "By shouting at them"]', 0),
('e5100001-0000-4000-8000-000000000004', 2, 'What was happening to the egg when Kai found it?',
 '["It was cracking open and hatching early", "It had turned to stone", "It was missing again", "It was floating above the tower"]', 0),
('e5100001-0000-4000-8000-000000000004', 3, 'What did Kai pocket from the crystal garden?',
 '["A translucent dragon scale", "A portal fragment", "Bram''s mining pick", "A library scroll"]', 0),

('e5100001-0000-4000-8000-000000000005', 1, 'How did Kai bring the egg back to the tower?',
 '["Climbed a vertical shaft while cradling the egg", "Used the river dock", "Sent it with Bram", "Left it in the cave"]', 0),
('e5100001-0000-4000-8000-000000000005', 2, 'What appeared on Kai''s satchel after the hatchling sneezed?',
 '["A crest-shaped mark of light", "A map to the floating island", "A shadow creature", "A library stamp"]', 0),
('e5100001-0000-4000-8000-000000000005', 3, 'What did the mother dragon say Kai had found?',
 '["Courage to go underground instead of waiting for rumors", "A way to sell eggs at the market", "The river dock shortcut", "A new floating island"]', 0);
