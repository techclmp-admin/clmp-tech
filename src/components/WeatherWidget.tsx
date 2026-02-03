import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Cloud, 
  CloudRain, 
  Sun, 
  CloudSnow, 
  Wind, 
  Thermometer, 
  Droplets, 
  Eye,
  RefreshCw,
  MapPin,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProjectFeatures } from "@/hooks/useProjectFeatures";

interface ForecastDay {
  date: string;
  temp_min: number;
  temp_max: number;
  humidity: number;
  wind_speed: number;
  description: string;
  icon: string;
}

interface WeatherData {
  location: string;
  temperature: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  visibility: number;
  wind_speed: number;
  wind_direction: number;
  description: string;
  icon: string;
  uv_index?: number;
  precipitation?: number;
  recommendation: string;
  forecast?: ForecastDay[];
}

interface WeatherWidgetProps {
  projectId: string;
  defaultLocation?: string;
}

const getWeatherIcon = (iconCode: string) => {
  const code = iconCode.toLowerCase();

  if (code.includes('sun') || code.includes('clear')) {
    return <Sun className="h-8 w-8 text-primary" />;
  } else if (code.includes('rain') || code.includes('drizzle')) {
    return <CloudRain className="h-8 w-8 text-primary" />;
  } else if (code.includes('snow')) {
    return <CloudSnow className="h-8 w-8 text-muted-foreground" />;
  } else {
    return <Cloud className="h-8 w-8 text-muted-foreground" />;
  }
};

const getConstructionRecommendation = (weather: WeatherData): { level: 'good' | 'caution' | 'warning', message: string } => {
  const { temperature, wind_speed, humidity, description } = weather;
  
  // High wind warning
  if (wind_speed > 25) {
    return {
      level: 'warning',
      message: 'High winds - Avoid crane operations and outdoor work at height'
    };
  }
  
  // Rain warning
  if (description.toLowerCase().includes('rain') || description.toLowerCase().includes('storm')) {
    return {
      level: 'warning',
      message: 'Precipitation expected - Protect materials and consider indoor work'
    };
  }
  
  // Extreme temperature
  if (temperature > 35 || temperature < 0) {
    return {
      level: 'caution',
      message: 'Extreme temperatures - Take frequent breaks and ensure worker safety'
    };
  }
  
  // High humidity
  if (humidity > 85) {
    return {
      level: 'caution',
      message: 'High humidity - Monitor worker comfort and concrete curing'
    };
  }
  
  return {
    level: 'good',
    message: 'Good conditions for construction work'
  };
};

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ projectId, defaultLocation = 'London' }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState(defaultLocation);
  const [inputLocation, setInputLocation] = useState(defaultLocation);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();
  const { isFeatureEnabled, isFeatureUpcoming } = useProjectFeatures();
  
  const featureEnabled = isFeatureEnabled('weather_widget');
  const featureUpcoming = isFeatureUpcoming('weather_widget');

  const fetchWeather = async (locationQuery: string = location) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-weather', {
        body: { location: locationQuery }
      });

      if (error) throw error;

      setWeather(data);
      setLocation(locationQuery);
      setLastUpdated(new Date());
      
      toast({
        title: "Weather updated",
        description: `Weather data for ${locationQuery} has been refreshed`,
      });
    } catch (error: any) {
      console.error('Weather fetch error:', error);
      toast({
        title: "Weather fetch failed",
        description: error.message || "Failed to fetch weather data. Please check the location and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationUpdate = () => {
    if (inputLocation.trim()) {
      fetchWeather(inputLocation.trim());
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const recommendation = weather ? getConstructionRecommendation(weather) : null;

  // If feature is disabled and not marked as upcoming, don't render
  if (!featureEnabled && !featureUpcoming) {
    return null;
  }

  // If feature is upcoming (disabled but marked to show), show upcoming message
  if (!featureEnabled && featureUpcoming) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Weather Conditions
            <Badge variant="secondary" className="ml-2">Soon</Badge>
          </CardTitle>
          <CardDescription>
            Real-time weather data for construction planning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Cloud className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
            <p className="text-muted-foreground">
              This feature is currently under development and will be available soon.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Weather Conditions
            </CardTitle>
            <CardDescription>
              Current weather for construction planning
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchWeather()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Input */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="location" className="text-sm">Location</Label>
            <Input
              id="location"
              value={inputLocation}
              onChange={(e) => setInputLocation(e.target.value)}
              placeholder="Enter city name..."
              onKeyPress={(e) => e.key === 'Enter' && handleLocationUpdate()}
            />
          </div>
          <Button 
            onClick={handleLocationUpdate}
            disabled={loading}
            className="mt-6"
          >
            Update
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Fetching weather data...</p>
            </div>
          </div>
        ) : weather ? (
          <div className="space-y-4">
            {/* Main Weather Display */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getWeatherIcon(weather.icon)}
                <div>
                  <h3 className="text-2xl font-bold">{Math.round(weather.temperature)}°C</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {weather.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Feels like {Math.round(weather.feels_like)}°C
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">{weather.location}</p>
                {lastUpdated && (
                  <p className="text-xs text-muted-foreground">
                    Updated {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            {/* Weather Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Wind className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Wind</p>
                  <p className="text-sm font-medium">{weather.wind_speed} km/h</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Droplets className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Humidity</p>
                  <p className="text-sm font-medium">{weather.humidity}%</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Thermometer className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Pressure</p>
                  <p className="text-sm font-medium">{weather.pressure} hPa</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Visibility</p>
                  <p className="text-sm font-medium">{weather.visibility} km</p>
                </div>
              </div>
            </div>

            {/* Construction Recommendation */}
            {recommendation && (
              <div
                className={`p-4 rounded-lg border-l-4 ${
                  recommendation.level === 'good'
                    ? 'bg-primary/10 border-primary'
                    : recommendation.level === 'caution'
                    ? 'bg-secondary/20 border-secondary'
                    : 'bg-destructive/10 border-destructive'
                }`}
              >
                <div className="flex items-start gap-2">
                  {recommendation.level === 'warning' && (
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium text-sm">Construction Advisory</p>
                    <p className="text-sm text-muted-foreground">{recommendation.message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 7-Day Forecast */}
            {weather.forecast && weather.forecast.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">7-Day Forecast</h4>
                <div className="grid gap-2">
                  {weather.forecast.map((day, index) => {
                    const date = new Date(day.date);
                    const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    return (
                      <div
                        key={day.date}
                        className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {/* Left: Day + Icon */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="min-w-[50px]">
                            <p className="text-sm font-medium">{dayName}</p>
                            <p className="text-xs text-muted-foreground">{dateStr}</p>
                          </div>
                          <div className="flex-shrink-0">{getWeatherIcon(day.icon)}</div>
                          <p className="text-xs text-muted-foreground capitalize truncate hidden sm:block max-w-[100px]">
                            {day.description}
                          </p>
                        </div>

                        {/* Right: Wind + Temps */}
                        <div className="flex items-center gap-3 text-sm flex-shrink-0">
                          <div className="flex items-center gap-1">
                            <Wind className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs whitespace-nowrap">{day.wind_speed}km/h</span>
                          </div>
                          <div className="flex gap-1">
                            <span className="font-semibold">{day.temp_max}°</span>
                            <span className="text-muted-foreground">{day.temp_min}°</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No weather data available</p>
            <Button 
              variant="outline" 
              onClick={() => fetchWeather()} 
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;