import { useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Rewind, 
  FastForward,
  Calendar,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

interface PlaybackTimelineProps {
  cameraName: string;
}

// Mock events on timeline
const mockTimelineEvents = [
  { time: 15, type: 'motion', label: 'Motion' },
  { time: 32, type: 'ppe', label: 'PPE Alert' },
  { time: 58, type: 'motion', label: 'Motion' },
  { time: 75, type: 'vehicle', label: 'Vehicle' },
];

const PlaybackTimeline = ({ cameraName }: PlaybackTimelineProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState([30]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const formatTime = (percent: number) => {
    const totalMinutes = 60;
    const minutes = Math.floor((percent / 100) * totalMinutes);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours + 13).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const speeds = [0.5, 1, 2, 4, 8];

  const cycleSpeed = () => {
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
  };

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Playback: {cameraName}
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            <Calendar className="h-3 w-3 mr-1" />
            Today
          </Badge>
          <Badge 
            variant="secondary" 
            className="cursor-pointer"
            onClick={cycleSpeed}
          >
            {playbackSpeed}x
          </Badge>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pt-6">
        {/* Event markers */}
        <div className="absolute top-0 left-0 right-0 h-4">
          {mockTimelineEvents.map((event, idx) => (
            <div 
              key={idx}
              className="absolute -translate-x-1/2"
              style={{ left: `${event.time}%` }}
            >
              <div className={`w-2 h-2 rounded-full ${
                event.type === 'ppe' ? 'bg-red-500' : 
                event.type === 'vehicle' ? 'bg-blue-500' : 'bg-yellow-500'
              }`} />
              <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap">
                {event.label}
              </span>
            </div>
          ))}
        </div>

        {/* Slider */}
        <Slider
          value={currentTime}
          onValueChange={setCurrentTime}
          max={100}
          step={1}
          className="cursor-pointer"
        />

        {/* Time labels */}
        <div className="flex justify-between mt-2 text-xs text-muted-foreground font-mono">
          <span>13:00</span>
          <span className="font-medium text-foreground">{formatTime(currentTime[0])}</span>
          <span>14:00</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button size="icon" variant="ghost">
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost">
          <Rewind className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          className="h-10 w-10"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <Button size="icon" variant="ghost">
          <FastForward className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost">
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PlaybackTimeline;
