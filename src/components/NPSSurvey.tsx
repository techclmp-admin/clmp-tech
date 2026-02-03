import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Star, 
  MessageSquare, 
  TrendingUp, 
  Users,
  BarChart3,
  X
} from 'lucide-react';

interface NPSSurveyProps {
  onClose?: () => void;
  trigger?: 'manual' | 'auto' | 'project-completion';
}

const NPSSurvey: React.FC<NPSSurveyProps> = ({ onClose, trigger = 'manual' }) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'rating' | 'feedback' | 'complete'>('rating');
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScoreSelect = (selectedScore: number) => {
    setScore(selectedScore);
    setStep('feedback');
  };

  const handleSubmit = async () => {
    if (score === null) return;

    setIsSubmitting(true);
    try {
      // Simulate API call to save NPS data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store in localStorage for now
      const npsData = {
        score,
        feedback,
        timestamp: new Date().toISOString(),
        trigger,
        userId: 'current-user' // In real app, get from auth
      };
      
      const existingSurveys = JSON.parse(localStorage.getItem('nps-surveys') || '[]');
      existingSurveys.push(npsData);
      localStorage.setItem('nps-surveys', JSON.stringify(existingSurveys));

      setStep('complete');
      
      toast({
        title: "Thank You!",
        description: "Your feedback has been submitted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreCategory = (score: number): { label: string; color: string } => {
    if (score >= 9) return { label: 'Promoter', color: 'text-green-600' };
    if (score >= 7) return { label: 'Passive', color: 'text-yellow-600' };
    return { label: 'Detractor', color: 'text-red-600' };
  };

  const getFollowUpQuestion = (score: number): string => {
    if (score >= 9) return "That's great! What do you like most about CLMP?";
    if (score >= 7) return "Thanks for the feedback! How can we improve your experience?";
    return "We'd love to improve. What would make you more likely to recommend us?";
  };

  if (step === 'complete') {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Star className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
            <p className="text-muted-foreground">
              Your feedback helps us improve CLMP for everyone.
            </p>
          </div>
          {onClose && (
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Quick Feedback
          </CardTitle>
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 'rating' && (
          <>
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">
                How likely are you to recommend CLMP to a colleague?
              </h3>
              <p className="text-sm text-muted-foreground">
                On a scale of 0-10, where 0 is "not at all likely" and 10 is "extremely likely"
              </p>
            </div>

            <div className="grid grid-cols-11 gap-1">
              {Array.from({ length: 11 }, (_, i) => (
                <Button
                  key={i}
                  variant={score === i ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleScoreSelect(i)}
                  className="h-10 text-sm font-medium"
                >
                  {i}
                </Button>
              ))}
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Not at all likely</span>
              <span>Extremely likely</span>
            </div>
          </>
        )}

        {step === 'feedback' && score !== null && (
          <>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl font-bold">{score}</span>
                <Badge variant="secondary" className={getScoreCategory(score).color}>
                  {getScoreCategory(score).label}
                </Badge>
              </div>
              <h3 className="text-lg font-medium mb-4">
                {getFollowUpQuestion(score)}
              </h3>
            </div>

            <div className="space-y-2">
              <Textarea
                placeholder="Your feedback helps us improve..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('rating')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// NPS Dashboard Component
export const NPSDashboard = () => {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [npsScore, setNpsScore] = useState(0);

  React.useEffect(() => {
    const savedSurveys = JSON.parse(localStorage.getItem('nps-surveys') || '[]');
    setSurveys(savedSurveys);

    // Calculate NPS Score
    if (savedSurveys.length > 0) {
      const promoters = savedSurveys.filter((s: any) => s.score >= 9).length;
      const detractors = savedSurveys.filter((s: any) => s.score <= 6).length;
      const total = savedSurveys.length;
      const calculatedNPS = Math.round(((promoters - detractors) / total) * 100);
      setNpsScore(calculatedNPS);
    }
  }, []);

  const getScoreDistribution = () => {
    const distribution = { promoters: 0, passives: 0, detractors: 0 };
    surveys.forEach(survey => {
      if (survey.score >= 9) distribution.promoters++;
      else if (survey.score >= 7) distribution.passives++;
      else distribution.detractors++;
    });
    return distribution;
  };

  const distribution = getScoreDistribution();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div className="text-right">
                <div className="text-2xl font-bold">{npsScore}</div>
                <div className="text-sm text-muted-foreground">NPS Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-green-500" />
              <div className="text-right">
                <div className="text-2xl font-bold">{distribution.promoters}</div>
                <div className="text-sm text-muted-foreground">Promoters</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <BarChart3 className="h-8 w-8 text-yellow-500" />
              <div className="text-right">
                <div className="text-2xl font-bold">{distribution.passives}</div>
                <div className="text-sm text-muted-foreground">Passives</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <MessageSquare className="h-8 w-8 text-red-500" />
              <div className="text-right">
                <div className="text-2xl font-bold">{distribution.detractors}</div>
                <div className="text-sm text-muted-foreground">Detractors</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Score Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Promoters (9-10)</span>
              <span>{distribution.promoters} responses</span>
            </div>
            <Progress 
              value={surveys.length ? (distribution.promoters / surveys.length) * 100 : 0} 
              className="h-2" 
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Passives (7-8)</span>
              <span>{distribution.passives} responses</span>
            </div>
            <Progress 
              value={surveys.length ? (distribution.passives / surveys.length) * 100 : 0} 
              className="h-2" 
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Detractors (0-6)</span>
              <span>{distribution.detractors} responses</span>
            </div>
            <Progress 
              value={surveys.length ? (distribution.detractors / surveys.length) * 100 : 0} 
              className="h-2" 
            />
          </div>
        </CardContent>
      </Card>

      {surveys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {surveys.slice(-5).reverse().map((survey, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      variant="secondary" 
                      className={survey.score >= 9 ? 'text-green-600' : survey.score >= 7 ? 'text-yellow-600' : 'text-red-600'}
                    >
                      Score: {survey.score}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(survey.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  {survey.feedback && (
                    <p className="text-sm">{survey.feedback}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NPSSurvey;