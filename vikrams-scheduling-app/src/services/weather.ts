export type WeatherCondition = 'clear' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm';

export type WeatherSnapshot = {
  condition: WeatherCondition;
  isDay: boolean;
  fetchedAt: number;
};

function conditionFromWeatherCode(code: number): WeatherCondition {
  if (code <= 1) return 'clear';
  if (code <= 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloudy';
}

export async function fetchWeatherForLocation(
  latitude: number,
  longitude: number
): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'weather_code,is_day',
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Weather API error (${res.status})`);
  }

  const data = await res.json();
  const code = data?.current?.weather_code;
  const isDay = data?.current?.is_day;

  if (typeof code !== 'number') {
    throw new Error('Weather API returned an unexpected response');
  }

  return {
    condition: conditionFromWeatherCode(code),
    isDay: isDay !== 0,
    fetchedAt: Date.now(),
  };
}
