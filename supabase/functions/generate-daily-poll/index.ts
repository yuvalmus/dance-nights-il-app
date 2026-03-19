// supabase/functions/generate-daily-poll/index.ts
// Runs daily at 06:00 Israel time via cron
// Creates today's poll with options auto-populated from today's events

import { createClient } from '@supabase/supabase-js';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const today = new Date().toISOString().split('T')[0];

  // Check if poll already exists for today
  const { data: existing } = await supabase
    .from('polls')
    .select('id')
    .eq('date', today)
    .maybeSingle();

  if (existing) {
    return new Response('Poll already exists for today');
  }

  // Get today's published events
  const { data: events } = await supabase
    .from('events')
    .select('id, title, venues(name)')
    .eq('date', today)
    .eq('is_published', true);

  if (!events || events.length === 0) {
    return new Response('No events today, skipping poll creation');
  }

  // Create poll
  const { data: poll } = await supabase
    .from('polls')
    .insert({ date: today })
    .select()
    .single();

  // Create options from events + "staying home" option
  const options = events.map((e: any, i: number) => ({
    poll_id: poll.id,
    event_id: e.id,
    label: `${e.venues.name}`,
    sort_order: i,
  }));

  options.push({
    poll_id: poll.id,
    event_id: null,
    label: 'נשאר בבית',
    sort_order: events.length,
  });

  await supabase.from('poll_options').insert(options);

  return new Response(`Poll created with ${options.length} options`);
});
