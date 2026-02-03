import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  FileText, 
  CheckSquare, 
  DollarSign, 
  AlertTriangle,
  Loader2,
  Shield,
  MessageSquare,
  Calendar,
  ClipboardCheck
} from 'lucide-react';

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  projectName: string | null;
  onConfirm: () => void;
  language: string;
}

interface ProjectStats {
  members: number;
  tasks: number;
  files: number;
  budgets: number;
  expenses: number;
  permits: number;
  inspections: number;
  chatRooms: number;
  milestones: number;
}

export const DeleteProjectDialog = ({
  open,
  onOpenChange,
  projectId,
  projectName,
  onConfirm,
  language
}: DeleteProjectDialogProps) => {
  const [stats, setStats] = useState<ProjectStats>({
    members: 0,
    tasks: 0,
    files: 0,
    budgets: 0,
    expenses: 0,
    permits: 0,
    inspections: 0,
    chatRooms: 0,
    milestones: 0
  });

  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project-delete-stats', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const [
        membersRes,
        tasksRes,
        filesRes,
        budgetsRes,
        permitsRes,
        inspectionsRes,
        chatRoomsRes,
        milestonesRes
      ] = await Promise.all([
        supabase.from('project_members').select('id', { count: 'exact' }).eq('project_id', projectId),
        supabase.from('project_tasks').select('id', { count: 'exact' }).eq('project_id', projectId),
        supabase.from('project_files').select('id', { count: 'exact' }).eq('project_id', projectId),
        supabase.from('budgets').select('id, budgeted_amount, spent_amount', { count: 'exact' }).eq('project_id', projectId),
        supabase.from('permits').select('id', { count: 'exact' }).eq('project_id', projectId),
        supabase.from('inspections').select('id', { count: 'exact' }).eq('project_id', projectId),
        supabase.from('project_chat_rooms').select('id', { count: 'exact' }).eq('project_id', projectId),
        supabase.from('project_milestones').select('id', { count: 'exact' }).eq('project_id', projectId)
      ]);

      const totalBudget = budgetsRes.data?.reduce((sum, b) => sum + (b.budgeted_amount || 0), 0) || 0;

      return {
        members: membersRes.count || 0,
        tasks: tasksRes.count || 0,
        files: filesRes.count || 0,
        budgets: budgetsRes.count || 0,
        expenses: totalBudget,
        permits: permitsRes.count || 0,
        inspections: inspectionsRes.count || 0,
        chatRooms: chatRoomsRes.count || 0,
        milestones: milestonesRes.count || 0
      };
    },
    enabled: open && !!projectId
  });

  useEffect(() => {
    if (projectData) {
      setStats(projectData);
    }
  }, [projectData]);

  const translations = {
    en: {
      title: 'Delete Project',
      subtitle: 'This action cannot be undone',
      warning: 'The following data will be permanently deleted:',
      members: 'Team Members',
      tasks: 'Tasks',
      files: 'Files',
      budgets: 'Budget Records',
      totalBudget: 'Total Budget Value',
      permits: 'Permits',
      inspections: 'Inspections',
      chatRooms: 'Chat Rooms',
      milestones: 'Milestones',
      confirmMessage: 'Type the project name to confirm deletion:',
      cancel: 'Cancel',
      delete: 'Delete Project',
      loading: 'Loading project data...'
    },
    fr: {
      title: 'Supprimer le Projet',
      subtitle: 'Cette action est irréversible',
      warning: 'Les données suivantes seront définitivement supprimées:',
      members: 'Membres de l\'Équipe',
      tasks: 'Tâches',
      files: 'Fichiers',
      budgets: 'Enregistrements Budgétaires',
      totalBudget: 'Valeur Totale du Budget',
      permits: 'Permis',
      inspections: 'Inspections',
      chatRooms: 'Salles de Discussion',
      milestones: 'Jalons',
      confirmMessage: 'Tapez le nom du projet pour confirmer la suppression:',
      cancel: 'Annuler',
      delete: 'Supprimer le Projet',
      loading: 'Chargement des données du projet...'
    }
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  const statItems = [
    { icon: Users, label: t.members, value: stats.members, color: 'text-blue-500' },
    { icon: CheckSquare, label: t.tasks, value: stats.tasks, color: 'text-green-500' },
    { icon: FileText, label: t.files, value: stats.files, color: 'text-purple-500' },
    { icon: Calendar, label: t.milestones, value: stats.milestones, color: 'text-orange-500' },
    { icon: DollarSign, label: t.budgets, value: stats.budgets, color: 'text-emerald-500' },
    { icon: Shield, label: t.permits, value: stats.permits, color: 'text-amber-500' },
    { icon: ClipboardCheck, label: t.inspections, value: stats.inspections, color: 'text-indigo-500' },
    { icon: MessageSquare, label: t.chatRooms, value: stats.chatRooms, color: 'text-pink-500' }
  ];

  const hasData = statItems.some(item => item.value > 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {t.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            <strong className="text-foreground">{projectName}</strong>
            <br />
            <span className="text-muted-foreground">{t.subtitle}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Separator />

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">{t.loading}</span>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-medium">
                {t.warning}
              </AlertDescription>
            </Alert>

            {hasData ? (
              <div className="grid grid-cols-2 gap-3">
                {statItems.map((item, index) => (
                  item.value > 0 && (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <div className={`p-2 rounded-md bg-muted ${item.color}`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.value}</p>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {language === 'fr' 
                  ? 'Aucune donnée associée à ce projet'
                  : 'No associated data for this project'}
              </div>
            )}

            {stats.expenses > 0 && (
              <div className="p-4 rounded-lg border-2 border-destructive/20 bg-destructive/5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-destructive">{t.totalBudget}</span>
                  <span className="text-xl font-bold text-destructive">
                    ${stats.expenses.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            {t.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
