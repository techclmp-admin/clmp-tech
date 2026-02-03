import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import LocationAutocomplete from '@/components/LocationAutocomplete';

interface EditProjectDialogProps {
  project: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: string;
}

const EditProjectDialog = ({ project, open, onOpenChange, language }: EditProjectDialogProps) => {
  // Format dates for input type="date" (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return '';
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    // Otherwise parse and format
    const date = new Date(dateString + 'T12:00:00');
    return date.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || '',
    location: project.location || '',
    budget: project.budget || 0,
    start_date: formatDateForInput(project.start_date),
    end_date: formatDateForInput(project.end_date),
    status: project.status || 'planning'
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', project.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: language === 'fr' ? 'Succès' : 'Success',
        description: language === 'fr' ? 'Projet mis à jour avec succès' : 'Project updated successfully',
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: language === 'fr' ? 'Erreur' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'fr' ? 'Modifier le Projet' : 'Edit Project'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">
              {language === 'fr' ? 'Nom du Projet' : 'Project Name'} *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">
              {language === 'fr' ? 'Description' : 'Description'}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <LocationAutocomplete
            value={formData.location}
            onChange={(value) => setFormData({ ...formData, location: value })}
            label={language === 'fr' ? 'Emplacement' : 'Location'}
            placeholder={language === 'fr' ? 'Rechercher un emplacement' : 'Search for location'}
          />

          <div>
            <Label htmlFor="status">
              {language === 'fr' ? 'Statut' : 'Status'}
            </Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">
                  {language === 'fr' ? 'Planification' : 'Planning'}
                </SelectItem>
                <SelectItem value="active">
                  {language === 'fr' ? 'Actif' : 'Active'}
                </SelectItem>
                <SelectItem value="on_hold">
                  {language === 'fr' ? 'En attente' : 'On Hold'}
                </SelectItem>
                <SelectItem value="completed">
                  {language === 'fr' ? 'Complété' : 'Completed'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget">
                {language === 'fr' ? 'Budget (CAD)' : 'Budget (CAD)'}
              </Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">
                {language === 'fr' ? 'Date de Début' : 'Start Date'}
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end_date">
                {language === 'fr' ? "Date de Fin" : 'End Date'}
              </Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              {language === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending 
                ? (language === 'fr' ? 'Mise à jour...' : 'Updating...') 
                : (language === 'fr' ? 'Enregistrer' : 'Save')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectDialog;
