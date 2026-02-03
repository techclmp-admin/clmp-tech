import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterOption {
  value: string;
  label: string;
}

interface MobileFilterChipProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Mobile-native filter chip with dropdown
 */
const MobileFilterChip: React.FC<MobileFilterChipProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select",
  className
}) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger 
        className={cn(
          "h-9 min-w-[100px] w-auto px-3 rounded-full border-border bg-muted/50 text-sm font-medium",
          "focus:ring-0 focus:ring-offset-0",
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {options.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            className="rounded-lg"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default MobileFilterChip;
