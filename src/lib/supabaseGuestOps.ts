import { supabase } from '@/lib/supabase';
import { idbSaveGuest, idbBatchSaveGuests, idbDeleteGuest, idbDeleteCompletedGuests, idbUpdateGuest, idbBatchUpdateGuests, idbClearAllGuests, idbClearTodayGuests, type GuestRecord } from '@/lib/idb';
import type { Extension, Guest, PlayArea, SocksSize, GuestType } from '@/lib/types';
import { addMinutes } from '@/lib/time';

// Custom event for local component updates
export function notifyGuestsUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('unlimited_fun_guests_updated'));
  }
}

export async function fetchNextSerial(): Promise<number> {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

    const { data, error } = await supabase
      .from('guests')
      .select('serial_number')
      .gte('created_at', startOfDay)
      .order('serial_number', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return 1;
    }
    return (data[0].serial_number || 0) + 1;
  } catch {
    return 1;
  }
}

export async function fetchAllGuestsFromSupabase(): Promise<GuestRecord[]> {
  try {
    const { data, error } = await supabase
      .from('guests')
      .select('id, serial_number, guest_name, play_area, socks_size, guest_type, in_time, expected_out_time, actual_out_time, duration_minutes, status, remarks, created_by, created_at, updated_at, extensions(*)')
      .order('serial_number', { ascending: true });

    if (error) {
      console.warn('Error fetching guests from Supabase:', error.message);
      return [];
    }

    const records: GuestRecord[] = (data || []).map((row: any) => ({
      id: row.id,
      serial_number: row.serial_number,
      guest_name: row.guest_name,
      play_area: row.play_area || 'trampoline',
      socks_size: row.socks_size || 'medium',
      guest_type: row.guest_type || 'new',
      in_time: row.in_time,
      expected_out_time: row.expected_out_time,
      actual_out_time: row.actual_out_time || null,
      duration_minutes: row.duration_minutes,
      status: row.status,
      remarks: row.remarks || null,
      created_by: row.created_by || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      extensions: row.extensions || [],
    }));

    // Update local IndexedDB cache silently
    idbBatchSaveGuests(records).catch(() => {});

    return records;
  } catch (err) {
    console.error('fetchAllGuestsFromSupabase exception:', err);
    return [];
  }
}

export async function addGuest(input: {
  guest_name: string;
  play_area: PlayArea;
  socks_size: SocksSize;
  guest_type: GuestType;
  in_time: Date;
  duration_minutes: number;
  remarks?: string | null;
  serial_number?: number;
}): Promise<GuestRecord> {
  const serial = input.serial_number ?? (await fetchNextSerial());
  const expectedOut = addMinutes(input.in_time, input.duration_minutes);
  const nowIso = new Date().toISOString();

  const payload = {
    serial_number: serial,
    guest_name: input.guest_name.trim(),
    play_area: input.play_area,
    socks_size: input.socks_size,
    guest_type: input.guest_type,
    in_time: input.in_time.toISOString(),
    expected_out_time: expectedOut.toISOString(),
    actual_out_time: null,
    duration_minutes: input.duration_minutes,
    status: 'active',
    remarks: input.remarks?.trim() || null,
  };

  const { data, error } = await supabase
    .from('guests')
    .insert(payload)
    .select('id, serial_number, guest_name, play_area, socks_size, guest_type, in_time, expected_out_time, actual_out_time, duration_minutes, status, remarks, created_by, created_at, updated_at, extensions(*)')
    .single();

  if (error) {
    console.error('Failed to insert guest into Supabase:', error);
    throw new Error(error.message || 'Failed to save guest to central database.');
  }

  const created: GuestRecord = {
    id: data.id,
    serial_number: data.serial_number,
    guest_name: data.guest_name,
    play_area: data.play_area || input.play_area,
    socks_size: data.socks_size || input.socks_size,
    guest_type: data.guest_type || input.guest_type,
    in_time: data.in_time,
    expected_out_time: data.expected_out_time,
    actual_out_time: data.actual_out_time || null,
    duration_minutes: data.duration_minutes,
    status: data.status,
    remarks: data.remarks || null,
    created_by: data.created_by || null,
    created_at: data.created_at || nowIso,
    updated_at: data.updated_at || nowIso,
    extensions: [],
  };

  // Cache locally in IndexedDB
  await idbSaveGuest(created);
  notifyGuestsUpdated();
  return created;
}

export async function addBulkGuests(
  guestsData: Array<{
    name: string;
    play_area?: PlayArea;
    socks_size?: SocksSize;
    guest_type?: GuestType;
    in_time?: Date;
    duration_minutes: number;
    remarks?: string | null;
  }>
): Promise<GuestRecord[]> {
  if (guestsData.length === 0) return [];
  const startSerial = await fetchNextSerial();
  const now = new Date();

  const insertPayloads = guestsData.map((item, idx) => {
    const inTime = item.in_time ?? now;
    const expectedOut = addMinutes(inTime, item.duration_minutes);
    return {
      serial_number: startSerial + idx,
      guest_name: item.name.trim(),
      play_area: item.play_area ?? 'trampoline',
      socks_size: item.socks_size ?? 'medium',
      guest_type: item.guest_type ?? 'new',
      in_time: inTime.toISOString(),
      expected_out_time: expectedOut.toISOString(),
      actual_out_time: null,
      duration_minutes: item.duration_minutes,
      status: 'active',
      remarks: item.remarks?.trim() || null,
    };
  });

  const { data, error } = await supabase
    .from('guests')
    .insert(insertPayloads)
    .select('id, serial_number, guest_name, play_area, socks_size, guest_type, in_time, expected_out_time, actual_out_time, duration_minutes, status, remarks, created_by, created_at, updated_at, extensions(*)');

  if (error) {
    console.error('Failed to bulk insert guests into Supabase:', error);
    throw new Error(error.message || 'Failed to save bulk guests to central database.');
  }

  const createdRecords: GuestRecord[] = (data || []).map((row: any) => ({
    id: row.id,
    serial_number: row.serial_number,
    guest_name: row.guest_name,
    play_area: row.play_area || 'trampoline',
    socks_size: row.socks_size || 'medium',
    guest_type: row.guest_type || 'new',
    in_time: row.in_time,
    expected_out_time: row.expected_out_time,
    actual_out_time: row.actual_out_time || null,
    duration_minutes: row.duration_minutes,
    status: row.status,
    remarks: row.remarks || null,
    created_by: row.created_by || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    extensions: [],
  }));

  // Cache in local IndexedDB
  await idbBatchSaveGuests(createdRecords);
  notifyGuestsUpdated();
  return createdRecords;
}

export async function updateGuest(
  id: string,
  patch: Partial<Pick<Guest, 'guest_name' | 'play_area' | 'socks_size' | 'guest_type' | 'in_time' | 'expected_out_time' | 'duration_minutes' | 'remarks' | 'status'>>,
): Promise<void> {
  const updatePayload: any = { ...patch };

  const { error } = await supabase
    .from('guests')
    .update(updatePayload)
    .eq('id', id);

  if (error) {
    console.error('Failed to update guest in Supabase:', error);
    throw new Error(error.message || 'Failed to update guest in central database.');
  }

  await idbUpdateGuest(id, updatePayload);
  notifyGuestsUpdated();
}

export async function markGuestOut(id: string, actualOut: Date = new Date()): Promise<void> {
  const actualOutIso = actualOut.toISOString();
  const { error } = await supabase
    .from('guests')
    .update({
      actual_out_time: actualOutIso,
      status: 'completed',
    })
    .eq('id', id);

  if (error) {
    console.error('Failed to mark guest out in Supabase:', error);
    throw new Error(error.message || 'Failed to mark out in central database.');
  }

  await idbUpdateGuest(id, {
    actual_out_time: actualOutIso,
    status: 'completed',
  });
  notifyGuestsUpdated();
}

export async function markAllOverdueGuestsOut(guestIds: string[], actualOut: Date = new Date()): Promise<number> {
  if (guestIds.length === 0) return 0;
  const actualOutIso = actualOut.toISOString();

  // Perform single bulk update on Supabase database
  const { error } = await supabase
    .from('guests')
    .update({
      actual_out_time: actualOutIso,
      status: 'completed',
    })
    .in('id', guestIds);

  if (error) {
    console.error('Failed to mark overdue guests out in Supabase:', error);
    throw new Error(error.message || 'Could not complete overdue guests. Please try again.');
  }

  // Update local IndexedDB cache in bulk
  await idbBatchUpdateGuests(guestIds, {
    actual_out_time: actualOutIso,
    status: 'completed',
  });

  notifyGuestsUpdated();
  return guestIds.length;
}

export async function extendGuestTime(
  guest: Guest,
  extensionMinutes: number,
): Promise<Extension> {
  const currentExpectedMs = new Date(guest.expected_out_time).getTime();
  const nowMs = Date.now();
  const baseMs = currentExpectedMs < nowMs ? nowMs : currentExpectedMs;
  const newOut = new Date(baseMs + extensionMinutes * 60000);
  const newOutIso = newOut.toISOString();

  // 1. Insert into extensions table
  const { data: extData, error: extError } = await supabase
    .from('extensions')
    .insert({
      guest_id: guest.id,
      extension_minutes: extensionMinutes,
      previous_out_time: guest.expected_out_time,
      new_out_time: newOutIso,
    })
    .select()
    .single();

  if (extError) {
    console.error('Failed to create extension in Supabase:', extError);
    throw new Error(extError.message || 'Failed to record extension in database.');
  }

  // 2. Update guest expected out time & status
  const { error: guestError } = await supabase
    .from('guests')
    .update({
      expected_out_time: newOutIso,
      duration_minutes: guest.duration_minutes + extensionMinutes,
      status: 'active',
    })
    .eq('id', guest.id);

  if (guestError) {
    console.error('Failed to update guest after extension in Supabase:', guestError);
    throw new Error(guestError.message || 'Failed to update guest time in database.');
  }

  const extension: Extension = {
    id: extData.id,
    guest_id: guest.id,
    extension_minutes: extensionMinutes,
    previous_out_time: guest.expected_out_time,
    new_out_time: newOutIso,
    created_by: extData.created_by || null,
    created_at: extData.created_at,
  };

  notifyGuestsUpdated();
  return extension;
}

export async function cancelGuest(id: string): Promise<void> {
  const { error } = await supabase
    .from('guests')
    .update({ status: 'cancelled' })
    .eq('id', id);

  if (error) {
    console.error('Failed to cancel guest in Supabase:', error);
    throw new Error(error.message);
  }

  await idbUpdateGuest(id, { status: 'cancelled' });
  notifyGuestsUpdated();
}

export async function deleteGuest(id: string): Promise<void> {
  const { error } = await supabase
    .from('guests')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete guest in Supabase:', error);
    throw new Error(error.message || 'Failed to delete guest record.');
  }

  await idbDeleteGuest(id);
  notifyGuestsUpdated();
}

export async function clearTodayGuestsFromSupabase(): Promise<void> {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

  const { error } = await supabase
    .from('guests')
    .delete()
    .gte('created_at', startOfDay);

  if (error) {
    console.error('Failed to clear today guests in Supabase:', error);
    throw new Error(error.message || 'Failed to clear today guest records.');
  }

  await idbClearTodayGuests();
  notifyGuestsUpdated();
}

export async function clearAllGuestsFromSupabase(): Promise<void> {
  const { error } = await supabase
    .from('guests')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletes all rows

  if (error) {
    console.error('Failed to clear all guests in Supabase:', error);
    throw new Error(error.message || 'Failed to clear all guest records.');
  }

  await idbClearAllGuests();
  notifyGuestsUpdated();
}

export async function deleteAllCompletedGuestsFromSupabase(): Promise<number> {
  const { data, error } = await supabase
    .from('guests')
    .delete()
    .eq('status', 'completed')
    .select('id');

  if (error) {
    console.error('Failed to delete completed guests in Supabase:', error);
    throw new Error(error.message || 'Failed to delete completed guests from central database.');
  }

  await idbDeleteCompletedGuests();
  notifyGuestsUpdated();
  return (data || []).length;
}
