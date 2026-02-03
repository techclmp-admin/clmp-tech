/**
 * Canadian Construction Phase Ordering System
 * Based on Ontario Building Code (OBC) and typical commercial construction workflow
 * 
 * This defines the standard sequence of construction phases for Canadian projects,
 * ensuring consistent task ordering across Kanban, Timeline (Gantt), and Tasks views.
 */

// Standard construction phases in sequence order (Canadian standards)
export const CONSTRUCTION_PHASES = [
  'Pre-Construction',
  'Site Work',
  'Foundation',
  'Structure',
  'Building Envelope',
  'MEP Systems',
  'Interior Build-Out',
  'Finishes',
  'Commissioning',
  'Closeout',
  'Warranty',
] as const;

export type ConstructionPhase = typeof CONSTRUCTION_PHASES[number];

// Map of phase to its sort order (lower = earlier in sequence)
export const PHASE_ORDER: Record<string, number> = CONSTRUCTION_PHASES.reduce(
  (acc, phase, index) => {
    acc[phase] = (index + 1) * 100; // 100, 200, 300... leaves room for sub-phases
    return acc;
  },
  {} as Record<string, number>
);

// Get the phase from task tags
export function getTaskPhase(tags: string[] | null): string | null {
  if (!tags || tags.length === 0) return null;
  
  // Find the first tag that matches a known construction phase
  for (const tag of tags) {
    if (CONSTRUCTION_PHASES.includes(tag as ConstructionPhase)) {
      return tag;
    }
  }
  
  return tags[0]; // Return first tag as fallback
}

// Get sort order for a task based on its phase
export function getTaskSortOrder(tags: string[] | null): number {
  const phase = getTaskPhase(tags);
  if (!phase) return 9999; // Tasks without phase go to the end
  
  return PHASE_ORDER[phase] ?? 9999;
}

// Sort tasks by construction phase
export function sortTasksByPhase<T extends { tags: string[] | null; created_at: string }>(
  tasks: T[]
): T[] {
  return [...tasks].sort((a, b) => {
    const orderA = getTaskSortOrder(a.tags);
    const orderB = getTaskSortOrder(b.tags);
    
    // Primary: Sort by phase
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // Secondary: Sort by created_at within same phase
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

// Group tasks by phase
export function groupTasksByPhase<T extends { tags: string[] | null }>(
  tasks: T[]
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  
  // Initialize all phases
  CONSTRUCTION_PHASES.forEach(phase => {
    grouped[phase] = [];
  });
  grouped['Other'] = [];
  
  // Group tasks
  tasks.forEach(task => {
    const phase = getTaskPhase(task.tags);
    if (phase && grouped[phase]) {
      grouped[phase].push(task);
    } else {
      grouped['Other'].push(task);
    }
  });
  
  return grouped;
}

// Generate estimated dates for tasks based on project start date and phase
export function generateTaskDates(
  projectStartDate: Date,
  phase: string | null,
  phaseTaskIndex: number = 0
): { startDate: Date; dueDate: Date } {
  const phaseOrder = phase ? (PHASE_ORDER[phase] ?? 500) : 500;
  const weeksOffset = Math.floor(phaseOrder / 100) - 1; // Phase 1 = week 0, Phase 2 = week 1, etc.
  
  const startDate = new Date(projectStartDate);
  startDate.setDate(startDate.getDate() + (weeksOffset * 7) + (phaseTaskIndex * 2)); // Stagger tasks within phase
  
  const dueDate = new Date(startDate);
  dueDate.setDate(dueDate.getDate() + 7); // Default 1 week duration
  
  return { startDate, dueDate };
}

// Get phase color for visual consistency
export const PHASE_COLORS: Record<string, string> = {
  'Pre-Construction': 'bg-purple-500',
  'Site Work': 'bg-amber-600',
  'Foundation': 'bg-stone-600',
  'Structure': 'bg-gray-700',
  'Building Envelope': 'bg-blue-500',
  'MEP Systems': 'bg-emerald-500',
  'Interior Build-Out': 'bg-orange-500',
  'Finishes': 'bg-pink-500',
  'Commissioning': 'bg-cyan-500',
  'Closeout': 'bg-indigo-500',
  'Warranty': 'bg-violet-500',
};

export function getPhaseColor(phase: string | null): string {
  if (!phase) return 'bg-slate-400';
  return PHASE_COLORS[phase] ?? 'bg-slate-400';
}
