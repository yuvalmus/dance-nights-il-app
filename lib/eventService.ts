import { supabase } from '@/lib/supabase';
import { EventFormValues } from '@/components/venue/EventForm';

type CreateEventParams = {
  values: EventFormValues;
  venueId: string;
  userId: string;
};

type UpdateEventParams = {
  values: EventFormValues;
  eventId: string;
  originalPosterUrl: string | null;
};

async function uploadPoster(uri: string, venueId: string): Promise<string> {
  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${venueId}/${Date.now()}.${ext}`;

  const formData = new FormData();
  formData.append('file', {
    uri,
    name: `poster.${ext}`,
    type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
  } as any);

  const { error } = await supabase.storage
    .from('posters')
    .upload(path, formData, { contentType: 'multipart/form-data' });

  if (error) throw error;

  const { data } = supabase.storage.from('posters').getPublicUrl(path);
  return data.publicUrl;
}

async function deletePoster(posterUrl: string): Promise<void> {
  const path = posterUrl.split('/posters/')[1];
  if (path) {
    await supabase.storage.from('posters').remove([path]);
  }
}

async function upsertSchedules(eventId: string, schedules: EventFormValues['schedules']): Promise<void> {
  // Delete existing schedules
  const { error: deleteError } = await supabase
    .from('event_schedules')
    .delete()
    .eq('event_id', eventId);

  if (deleteError) throw deleteError;

  if (schedules.length === 0) return;

  const rows = schedules.map((s, i) => ({
    event_id: eventId,
    time: s.time,
    description: s.description,
    level: s.level || null,
    sort_order: i,
  }));

  const { error } = await supabase.from('event_schedules').insert(rows);
  if (error) throw error;
}

function buildEventRow(values: EventFormValues, posterUrl: string | null) {
  return {
    title: values.title,
    description: values.description || null,
    date: values.date,
    dance_styles: values.dance_styles,
    poster_url: posterUrl,
    price: values.price ? parseInt(values.price, 10) : null,
    price_note: values.price_note || null,
    dj: values.dj || null,
    instructors: values.instructors,
    pre_register: values.pre_register,
    registration_link: values.registration_link || null,
    spots_total: values.spots_total ? parseInt(values.spots_total, 10) : null,
    is_published: values.is_published,
  };
}

export async function createEvent({ values, venueId, userId }: CreateEventParams): Promise<void> {
  let posterUrl: string | null = null;

  if (values.posterUri && values.posterChanged) {
    posterUrl = await uploadPoster(values.posterUri, venueId);
  }

  const { data: event, error } = await supabase
    .from('events')
    .insert({ ...buildEventRow(values, posterUrl), venue_id: venueId, created_by: userId })
    .select()
    .single();

  if (error) throw error;

  if (values.schedules.length > 0) {
    await upsertSchedules(event.id, values.schedules);
  }
}

export async function updateEvent({ values, eventId, originalPosterUrl }: UpdateEventParams): Promise<void> {
  let posterUrl: string | null = values.posterUri;

  if (values.posterChanged) {
    if (originalPosterUrl) {
      await deletePoster(originalPosterUrl);
    }
    posterUrl = values.posterUri
      ? await uploadPoster(values.posterUri, eventId)
      : null;
  }

  const { error } = await supabase
    .from('events')
    .update(buildEventRow(values, posterUrl))
    .eq('id', eventId);

  if (error) throw error;

  await upsertSchedules(eventId, values.schedules);
}
