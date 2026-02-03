import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format status string to display label
 * Converts: todo -> To Do, in_progress -> In Progress, etc.
 */
export function formatStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    'todo': 'To Do',
    'to do': 'To Do',
    'in_progress': 'In Progress',
    'in progress': 'In Progress',
    'review': 'Review',
    'completed': 'Completed',
    'done': 'Done',
    'blocked': 'Blocked',
    'on-hold': 'On Hold',
    'active': 'Active',
  };
  
  const key = status.toLowerCase();
  return statusMap[key] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

/**
 * Format project status string to display label
 * Converts: planning -> Planning, active -> Active, on_hold -> On Hold, completed -> Complete
 */
export function formatProjectStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'planning': 'Planning',
    'active': 'Active',
    'on_hold': 'On Hold',
    'on-hold': 'On Hold',
    'completed': 'Complete',
    'archived': 'Archived',
  };
  
  const key = status.toLowerCase();
  return statusMap[key] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}
