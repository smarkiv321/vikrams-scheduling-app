import { LocalEvent } from './local-events';

export type ImportedEvent = Omit<LocalEvent, 'id'>;

export type ImportResult = {
  events: ImportedEvent[];
  errors: string[];
};

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((field) => field.trim());
}

function toBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return ['true', 'yes', '1', 'y'].includes(value.trim().toLowerCase());
}

function isValidDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

function normalizeRow(
  row: Record<string, string>,
  rowLabel: string,
  errors: string[]
): ImportedEvent | null {
  const summary = row.title || row.summary;
  const start = row.start;
  const end = row.end || row.start;
  const isAllDay = toBoolean(row.allday ?? row.all_day);
  const notes = row.notes || undefined;

  if (!summary) {
    errors.push(`${rowLabel}: missing title`);
    return null;
  }
  if (!start) {
    errors.push(`${rowLabel}: missing start`);
    return null;
  }
  if (!isValidDate(isAllDay ? `${start}T00:00:00` : start)) {
    errors.push(`${rowLabel}: invalid start "${start}"`);
    return null;
  }
  if (!isValidDate(isAllDay ? `${end}T00:00:00` : end)) {
    errors.push(`${rowLabel}: invalid end "${end}"`);
    return null;
  }

  return {
    summary,
    notes,
    isAllDay,
    start: isAllDay ? start : new Date(start).toISOString(),
    end: isAllDay ? end : new Date(end).toISOString(),
  };
}

function parseCsv(text: string): ImportResult {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { events: [], errors: ['File is empty'] };

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const errors: string[] = [];
  const events: ImportedEvent[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    header.forEach((key, index) => {
      row[key] = values[index] ?? '';
    });
    const event = normalizeRow(row, `Row ${i + 1}`, errors);
    if (event) events.push(event);
  }

  return { events, errors };
}

function parseJson(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { events: [], errors: ['File is not valid JSON'] };
  }

  if (!Array.isArray(parsed)) {
    return { events: [], errors: ['JSON file must contain an array of events'] };
  }

  const errors: string[] = [];
  const events: ImportedEvent[] = [];

  parsed.forEach((item, index) => {
    if (typeof item !== 'object' || item === null) {
      errors.push(`Item ${index + 1}: not an object`);
      return;
    }
    const record = item as Record<string, unknown>;
    const row: Record<string, string> = {
      title: typeof record.title === 'string' ? record.title : (record.summary as string) ?? '',
      start: typeof record.start === 'string' ? record.start : '',
      end: typeof record.end === 'string' ? record.end : '',
      allday: record.isAllDay ? 'true' : record.allDay ? 'true' : '',
      notes: typeof record.notes === 'string' ? record.notes : '',
    };
    const event = normalizeRow(row, `Item ${index + 1}`, errors);
    if (event) events.push(event);
  });

  return { events, errors };
}

export function parseImportFile(text: string, fileName: string): ImportResult {
  if (fileName.toLowerCase().endsWith('.json')) {
    return parseJson(text);
  }
  return parseCsv(text);
}
