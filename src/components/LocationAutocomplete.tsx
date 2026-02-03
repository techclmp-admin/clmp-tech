import React, { useState, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LocationSuggestion {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string, coordinates?: [number, number]) => void;
  placeholder?: string;
  label?: string;
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Enter project location",
  label = "Location"
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout>();

  const searchLocation = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('geocode-location', {
        body: { query }
      });

      if (error) throw error;

      setSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Debounce search
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      searchLocation(newValue);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    onChange(suggestion.place_name, suggestion.center);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="location">{label}</Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="location"
          value={value}
          onChange={handleInputChange}
          onFocus={() => value.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="pl-9 pr-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full top-full mt-1">
          <Command className="rounded-lg border shadow-md">
            <CommandList>
              <CommandEmpty>No locations found.</CommandEmpty>
              <CommandGroup>
                {suggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion.id}
                    onSelect={() => handleSelectSuggestion(suggestion)}
                    className="cursor-pointer"
                  >
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{suggestion.text}</p>
                      <p className="text-xs text-muted-foreground">{suggestion.place_name}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
