import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const openWeatherApiKey = Deno.env.get('OPENWEATHER_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherRequest {
  location: string;
  includeForecast?: boolean;
}

interface OpenWeatherResponse {
  name: string;
  sys: {
    country: string;
  };
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
    deg: number;
  };
  visibility: number;
}

interface ForecastResponse {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      temp_min: number;
      temp_max: number;
      humidity: number;
    };
    weather: Array<{
      description: string;
      icon: string;
    }>;
    wind: {
      speed: number;
    };
    dt_txt: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openWeatherApiKey) {
      throw new Error('OpenWeather API key not configured');
    }

    const { location, includeForecast = true }: WeatherRequest = await req.json();

    if (!location) {
      throw new Error('Location is required');
    }

    console.log(`Fetching weather for location: ${location}`);

    // Parse location to extract city name
    // Handle formats like "146 Hurontario Street, Collingwood, Ontario L9Y 2L8, Canada"
    // or simple "Toronto" or "Toronto, ON"
    let cityQuery = location;
    
    // If location contains commas, it's likely a full address
    if (location.includes(',')) {
      const parts = location.split(',').map(part => part.trim());
      // Try to find the city (usually the second part in Canadian addresses)
      // Format: "Street, City, Province PostalCode, Country"
      if (parts.length >= 2) {
        // Use city and country for better accuracy
        const city = parts[1];
        const country = parts[parts.length - 1];
        cityQuery = `${city}, ${country}`;
      }
    }

    console.log(`Parsed city query: ${cityQuery}`);

    // Fetch current weather from OpenWeatherMap API
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityQuery)}&appid=${openWeatherApiKey}&units=metric`;
    
    const weatherResponse = await fetch(weatherUrl);
    
    if (!weatherResponse.ok) {
      const errorData = await weatherResponse.json();
      throw new Error(errorData.message || `Weather API error: ${weatherResponse.status}`);
    }

    const weatherData: OpenWeatherResponse = await weatherResponse.json();

    // Transform the data for our application
    const transformedData = {
      location: `${weatherData.name}, ${weatherData.sys.country}`,
      temperature: Math.round(weatherData.main.temp),
      feels_like: Math.round(weatherData.main.feels_like),
      humidity: weatherData.main.humidity,
      pressure: weatherData.main.pressure,
      visibility: Math.round(weatherData.visibility / 1000), // Convert to km
      wind_speed: Math.round(weatherData.wind.speed * 3.6), // Convert m/s to km/h
      wind_direction: weatherData.wind.deg,
      description: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon,
    };

    // Add construction-specific recommendations
    const getConstructionRecommendation = (data: typeof transformedData): string => {
      const { temperature, wind_speed, humidity, description } = data;
      
      if (wind_speed > 25) {
        return 'High winds detected - Exercise caution with crane operations and work at height';
      }
      
      if (description.toLowerCase().includes('rain') || description.toLowerCase().includes('storm')) {
        return 'Precipitation expected - Protect materials and consider indoor work activities';
      }
      
      if (temperature > 35) {
        return 'High temperature - Ensure adequate hydration and frequent breaks for workers';
      }
      
      if (temperature < 0) {
        return 'Freezing conditions - Take precautions for concrete work and worker safety';
      }
      
      if (humidity > 85) {
        return 'High humidity - Monitor concrete curing times and worker comfort';
      }
      
      return 'Favorable conditions for construction activities';
    };

    let responseData: any = {
      ...transformedData,
      recommendation: getConstructionRecommendation(transformedData),
    };

    // Fetch 7-day forecast if requested
    if (includeForecast) {
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityQuery)}&appid=${openWeatherApiKey}&units=metric&cnt=56`;
      
      try {
        const forecastResponse = await fetch(forecastUrl);
        if (forecastResponse.ok) {
          const forecastData: ForecastResponse = await forecastResponse.json();
          
          // Process forecast data - group by day and get daily highs/lows
          const dailyForecasts = new Map<string, any>();
          
          forecastData.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dateKey = date.toISOString().split('T')[0];
            
            if (!dailyForecasts.has(dateKey)) {
              dailyForecasts.set(dateKey, {
                date: dateKey,
                temp_min: item.main.temp_min,
                temp_max: item.main.temp_max,
                humidity: item.main.humidity,
                wind_speed: item.wind.speed * 3.6, // Convert to km/h
                description: item.weather[0].description,
                icon: item.weather[0].icon,
                timestamps: [item]
              });
            } else {
              const existing = dailyForecasts.get(dateKey);
              existing.temp_min = Math.min(existing.temp_min, item.main.temp_min);
              existing.temp_max = Math.max(existing.temp_max, item.main.temp_max);
              existing.timestamps.push(item);
            }
          });
          
          // Convert to array and get first 7 days
          const forecast = Array.from(dailyForecasts.values())
            .slice(0, 7)
            .map(day => ({
              date: day.date,
              temp_min: Math.round(day.temp_min),
              temp_max: Math.round(day.temp_max),
              humidity: Math.round(
                day.timestamps.reduce((sum: number, t: any) => sum + t.main.humidity, 0) / day.timestamps.length
              ),
              wind_speed: Math.round(
                day.timestamps.reduce((sum: number, t: any) => sum + t.wind.speed * 3.6, 0) / day.timestamps.length
              ),
              description: day.description,
              icon: day.icon,
            }));
          
          responseData.forecast = forecast;
        }
      } catch (forecastError) {
        console.error('Error fetching forecast:', forecastError);
        // Continue without forecast data
      }
    }

    console.log('Weather data successfully processed:', responseData);

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in get-weather function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch weather data',
        details: 'Please check the location name and try again'
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);