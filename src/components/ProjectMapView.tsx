import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, ExternalLink, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProjectFeatures } from '@/hooks/useProjectFeatures';

// Fix for mapbox-gl CSS not loading properly in some bundlers
const mapboxCSS = `
.mapboxgl-map {
  position: relative;
  width: 100%;
  height: 100%;
}
.mapboxgl-canvas {
  position: absolute;
  left: 0;
  top: 0;
}
.mapboxgl-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
}
`;

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  location?: string;
  location_coordinates?: [number, number];
  budget?: number;
  progress?: number;
  category?: string;
}

interface ProjectMapViewProps {
  projects: Project[];
  language?: string;
}

const ProjectMapView: React.FC<ProjectMapViewProps> = ({ projects, language = 'en' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [geocodedProjects, setGeocodedProjects] = useState<(Project & { coordinates: [number, number] })[]>([]);
  
  // Feature flag check - MUST be called before any early returns
  const { isFeatureEnabled, isFeatureUpcoming } = useProjectFeatures();
  const featureEnabled = isFeatureEnabled('map_view');
  const featureUpcoming = isFeatureUpcoming('map_view');

  // Fetch Mapbox token
  useEffect(() => {
    // Skip fetching if feature is disabled
    if (!featureEnabled) return;
    
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('geocode-location', {
          body: { getTokenOnly: true }
        });
        
        if (error) {
          console.error('Error fetching token:', error);
          return;
        }
        
        if (data?.token) {
          setMapboxToken(data.token);
        }
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
      }
    };
    
    fetchToken();
  }, [featureEnabled]);

  // Geocode projects that don't have coordinates
  useEffect(() => {
    const geocodeProjects = async () => {
      if (!mapboxToken) return;
      
      const projectsWithCoords: (Project & { coordinates: [number, number] })[] = [];
      
      for (const project of projects) {
        // If project already has coordinates
        if (project.location_coordinates) {
          projectsWithCoords.push({
            ...project,
            coordinates: project.location_coordinates
          });
          continue;
        }
        
        // Try to geocode the location
        if (project.location) {
          try {
            const { data } = await supabase.functions.invoke('geocode-location', {
              body: { query: project.location }
            });
            
            if (data?.features?.[0]?.center) {
              projectsWithCoords.push({
                ...project,
                coordinates: data.features[0].center
              });
            }
          } catch (err) {
            console.warn(`Could not geocode location for ${project.name}:`, err);
          }
        }
      }
      
      setGeocodedProjects(projectsWithCoords);
      setLoading(false);
    };
    
    if (mapboxToken && projects.length > 0) {
      geocodeProjects();
    } else if (projects.length === 0) {
      setLoading(false);
    }
  }, [projects, mapboxToken]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    // Inject CSS if not already present
    if (!document.getElementById('mapbox-custom-css')) {
      const style = document.createElement('style');
      style.id = 'mapbox-custom-css';
      style.textContent = mapboxCSS;
      document.head.appendChild(style);
    }

    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-79.3832, 43.6532], // Toronto default
        zoom: 10,
        attributionControl: true
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      map.current.on('load', () => {
        console.log('Mapbox map loaded successfully');
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
      });
    } catch (err) {
      console.error('Error initializing Mapbox:', err);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Add markers when projects are geocoded and map is loaded
  useEffect(() => {
    if (!map.current || geocodedProjects.length === 0) return;

    const addMarkersToMap = () => {
      if (!map.current) return;
      
      // Trigger resize to ensure map renders properly
      map.current.resize();

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Add new markers
      const bounds = new mapboxgl.LngLatBounds();

      geocodedProjects.forEach(project => {
        const [lng, lat] = project.coordinates;
        bounds.extend([lng, lat]);

        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'project-marker';
        el.innerHTML = `
          <div class="w-10 h-10 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110 ${getMarkerColor(project.status)}">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `;

        // Create popup
        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
          .setHTML(`
            <div class="p-3 min-w-[200px]">
              <h3 class="font-semibold text-sm mb-1">${project.name}</h3>
              <p class="text-xs text-gray-500 mb-2">${project.location || 'No location'}</p>
              <div class="flex items-center gap-2 mb-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeClass(project.status)}">
                  ${formatStatus(project.status)}
                </span>
                ${project.category ? `<span class="text-xs text-gray-400">${project.category}</span>` : ''}
              </div>
              ${project.progress !== undefined ? `
                <div class="mb-2">
                  <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full bg-primary rounded-full" style="width: ${project.progress}%"></div>
                  </div>
                  <span class="text-xs text-gray-500">${project.progress}% complete</span>
                </div>
              ` : ''}
              <a href="/projects/${project.id}" class="text-xs text-primary hover:underline flex items-center gap-1">
                View Details
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
              </a>
            </div>
          `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
      });

      // Fit map to show all markers
      if (geocodedProjects.length > 0 && map.current) {
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 12
        });
      }
    };

    // If map is already loaded, add markers immediately
    if (map.current.loaded()) {
      addMarkersToMap();
    } else {
      // Wait for map to load
      map.current.on('load', addMarkersToMap);
    }
  }, [geocodedProjects]);

  const getMarkerColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'planning': return 'bg-purple-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-primary';
    }
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'planning': return 'bg-purple-100 text-purple-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string): string => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Feature disabled and not upcoming - don't render
  if (!featureEnabled && !featureUpcoming) {
    return null;
  }

  // Feature upcoming - show coming soon
  if (!featureEnabled && featureUpcoming) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 text-primary opacity-70" />
          <p className="font-medium text-lg">Coming Soon</p>
          <p className="text-sm">Map View feature is coming in a future update</p>
        </div>
      </Card>
    );
  }

  if (!mapboxToken) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Map feature is not available</p>
          <p className="text-sm">Please configure Mapbox token</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span>Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-violet-500"></div>
          <span>Planning</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span>On Hold</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sky-500"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted-foreground"></div>
          <span>Archived</span>
        </div>
      </div>

      {/* Map Container (always mounted so Mapbox can initialize) */}
      <Card className="overflow-hidden relative">
        <div
          ref={mapContainer}
          className="h-[500px] w-full"
          style={{ minHeight: '500px' }}
        />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
              <p className="text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}

        {!loading && geocodedProjects.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No projects with locations</p>
              <p className="text-sm">Add locations to your projects to see them on the map</p>
            </div>
          </div>
        )}
      </Card>

      {/* Project Count */}
      <p className="text-sm text-muted-foreground">
        Showing {geocodedProjects.length} of {projects.length} projects on the map
      </p>
    </div>
  );
};

export default ProjectMapView;
