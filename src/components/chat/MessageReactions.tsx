import { Button } from "@/components/ui/button";
import { MessageReaction } from "./types";
import { cn } from "@/lib/utils";

interface MessageReactionsProps {
  reactions: MessageReaction[];
  onReact?: (emoji: string) => void;
}

export const MessageReactions = ({ reactions, onReact }: MessageReactionsProps) => {
  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, MessageReaction[]>);

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => (
        <Button
          key={emoji}
          size="sm"
          variant="outline"
          className={cn(
            "h-6 px-2 text-xs",
            onReact && "cursor-pointer hover:bg-primary/10"
          )}
          onClick={() => onReact?.(emoji)}
        >
          <span>{emoji}</span>
          <span className="ml-1">{reactionList.length}</span>
        </Button>
      ))}
    </div>
  );
};
