import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Database, Loader2 } from "lucide-react";
import { seedOntarioTemplates } from "@/utils/seedTemplates";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const SeedTemplatesButton = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const result = await seedOntarioTemplates();
      
      if (result.success) {
        toast({
          title: "Templates Seeded Successfully",
          description: `Added ${result.count} professional Ontario construction templates.`,
        });
        
        // Refresh the templates list
        queryClient.invalidateQueries({ queryKey: ['project-templates'] });
      } else {
        throw new Error('Seeding failed');
      }
    } catch (error: any) {
      console.error('Error seeding templates:', error);
      toast({
        title: "Error Seeding Templates",
        description: error.message || "Failed to seed templates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Database className="h-4 w-4 mr-2" />
          Load Ontario Templates
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Load Professional Templates?</AlertDialogTitle>
          <AlertDialogDescription>
            This will load 30+ professional construction templates optimized for Ontario, Canada including:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>5 Residential templates</li>
              <li>5 Commercial templates</li>
              <li>5 Industrial templates</li>
              <li>5 Safety templates</li>
              <li>5 Finance templates</li>
              <li>5 Maintenance templates</li>
            </ul>
            <p className="mt-2 text-sm">
              All templates comply with Ontario Building Code 2024 and include detailed tasks, phases, and permit requirements.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSeeding}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSeed} disabled={isSeeding}>
            {isSeeding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load Templates"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
