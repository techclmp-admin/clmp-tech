import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, TrendingUp, Clock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProjectFeatures } from '@/hooks/useProjectFeatures';

interface RiskAssessment {
  id: string;
  risk_score: number;
  risk_type: string;
  severity: string;
  risk_factors: any;
  mitigation_strategies: any;
  ai_recommendations: any;
  weather_conditions: any;
  created_at: string;
  valid_until: string;
}

interface WeatherAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  ai_analysis: any;
  recommended_actions: any;
  is_active: boolean;
  created_at: string;
  expires_at: string;
}

interface AIRiskManagerProps {
  projectId: string;
  weatherData?: any;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getRiskScoreColor = (score: number) => {
  // score is now 0-100 integer
  if (score <= 30) return 'text-green-600';
  if (score <= 60) return 'text-yellow-600';
  if (score <= 80) return 'text-orange-600';
  return 'text-red-600';
};

export const AIRiskManager: React.FC<AIRiskManagerProps> = ({ projectId, weatherData }) => {
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({});
  const [projectLocation, setProjectLocation] = useState<string>('');
  const { toast } = useToast();
  const { isFeatureEnabled, isFeatureUpcoming } = useProjectFeatures();

  const withTimeout = <T,>(promise: Promise<T>, ms: number, label = 'Operation') =>
    new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`));
      }, ms);

      promise.then(
        (value) => {
          clearTimeout(timeoutId);
          resolve(value);
        },
        (err) => {
          clearTimeout(timeoutId);
          reject(err);
        }
      );
    });

  const featureEnabled = isFeatureEnabled('ai_risk_management');
  const featureUpcoming = isFeatureUpcoming('ai_risk_management');

  const fetchRiskData = async () => {
    try {
      // Fetch risk assessments
      const { data: assessments } = await (supabase as any)
        .from('risk_assessments')
        .select('*')
        .eq('project_id', projectId)
        .eq('risk_type', 'weather')
        .gte('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch active weather alerts
      const { data: alerts } = await (supabase as any)
        .from('weather_alerts')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      setRiskAssessments((assessments || []) as unknown as RiskAssessment[]);
      setWeatherAlerts((alerts || []) as unknown as WeatherAlert[]);
    } catch (error) {
      console.error('Error fetching risk data:', error);
    }
  };

  const runRiskAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      // Fetch current weather data if not provided
      let currentWeatherData = weatherData;
      
      if (!currentWeatherData) {
        console.log('Fetching weather data for location:', projectLocation);
        const { data: weatherResponse, error: weatherError } = await withTimeout(
          supabase.functions.invoke('get-weather', {
            body: {
              location: projectLocation || 'Toronto, Ontario, Canada',
              includeForecast: false,
            },
          }),
          25_000,
          'Weather fetch'
        );

        if (weatherError) {
          throw new Error('Failed to fetch weather data: ' + weatherError.message);
        }

        currentWeatherData = weatherResponse;
        console.log('Weather data fetched:', currentWeatherData);
      }

      console.log('Running AI risk analysis with weather data:', currentWeatherData);

      const { data, error } = await withTimeout(
        supabase.functions.invoke('ai-risk-analysis', {
          body: {
            projectId,
            weatherData: currentWeatherData,
            projectType: 'construction',
            location: currentWeatherData?.location || projectLocation,
          },
        }),
        45_000,
        'AI risk analysis'
      );

      if (error) {
        console.error('AI risk analysis error:', error);
        throw error;
      }

      console.log('AI risk analysis completed:', data);

      toast({
        title: "Risk Analysis Complete",
        description: `Analysis completed with ${data.aiAnalysis.severityLevel} risk level`,
      });

      await fetchRiskData();
    } catch (error: any) {
      console.error('Risk analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze weather risks",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('weather_alerts')
        .update({ is_active: false })
        .eq('id', alertId);

      if (error) throw error;

      setWeatherAlerts(prev => prev.filter(alert => alert.id !== alertId));
      toast({
        title: "Alert Dismissed",
        description: "Weather alert has been dismissed",
      });
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const toggleDetails = (id: string) => {
    setShowDetails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const fetchProjectInfo = async () => {
      try {
        const { data: project } = await supabase
          .from('projects')
          .select('location')
          .eq('id', projectId)
          .single();
        
        if (project?.location) {
          setProjectLocation(project.location);
        }
      } catch (error) {
        console.error('Error fetching project info:', error);
      }
    };

    fetchProjectInfo();
    fetchRiskData();
  }, [projectId]);

  const latestAssessment = riskAssessments[0];

  // If feature is disabled and not marked as upcoming, don't render
  if (!featureEnabled && !featureUpcoming) {
    return null;
  }

  // If feature is upcoming (disabled but marked to show), show upcoming message
  if (!featureEnabled && featureUpcoming) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                AI Risk Management
                <Badge variant="secondary" className="ml-2">Soon</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                AI-powered weather risk analysis and safety recommendations
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
            <p className="text-muted-foreground">
              This feature is currently under development and will be available soon.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Risk Analysis Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                AI Risk Management
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Intelligent weather risk analysis powered by AI
              </p>
            </div>
            <Button 
              onClick={runRiskAnalysis} 
              disabled={isAnalyzing}
              className="bg-primary hover:bg-primary/90"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Run Analysis
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {latestAssessment && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Risk Score</span>
                  <span className={`text-lg font-bold ${getRiskScoreColor(latestAssessment.risk_score)}`}>
                    {latestAssessment.risk_score}%
                  </span>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Risk Factors</span>
                  <span className="text-lg font-bold">
                    {latestAssessment.risk_factors?.length || 0}
                  </span>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Valid Until</span>
                  <span className="text-sm">
                    <Clock className="h-4 w-4 inline mr-1" />
                    {new Date(latestAssessment.valid_until).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Active Weather Alerts */}
      {weatherAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Active Weather Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {weatherAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{alert.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm mb-3">{alert.description}</p>
                    
                    {alert.recommended_actions && alert.recommended_actions.length > 0 && (
                      <div className="space-y-1">
                        <h5 className="text-sm font-medium">Recommended Actions:</h5>
                        <ul className="text-sm space-y-1">
                          {alert.recommended_actions.slice(0, 2).map((action, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-xs mt-1">•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>Created: {new Date(alert.created_at).toLocaleString()}</span>
                      <span>Expires: {new Date(alert.expires_at).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissAlert(alert.id)}
                    className="ml-4"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Risk Assessment History */}
      {riskAssessments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Risk Assessments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {riskAssessments.map((assessment) => (
              <div key={assessment.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`text-lg font-bold ${getRiskScoreColor(assessment.risk_score)}`}>
                      {assessment.risk_score}%
                    </div>
                    <div>
                      <div className="font-medium">Weather Risk Assessment</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(assessment.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDetails(assessment.id)}
                  >
                    {showDetails[assessment.id] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {showDetails[assessment.id] && assessment.ai_recommendations && (
                  <div className="space-y-4 pt-4 border-t">
                    {/* Risk Factors */}
                    {assessment.ai_recommendations.riskFactors && (
                      <div>
                        <h5 className="font-medium mb-2">Risk Factors:</h5>
                        <div className="grid gap-2">
                          {assessment.ai_recommendations.riskFactors.map((factor: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="capitalize">{factor.type}: {factor.description}</span>
                              <Badge variant="outline" className={getSeverityColor(factor.level)}>
                                {factor.level}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Work Activities Affected */}
                    {assessment.ai_recommendations.workActivitiesAffected && (
                      <div>
                        <h5 className="font-medium mb-2">Work Activities Affected:</h5>
                        <div className="space-y-1 text-sm">
                          {assessment.ai_recommendations.workActivitiesAffected.map((activity: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="capitalize">{activity.activity}</span>
                              <Badge variant="outline" className={getSeverityColor(activity.riskLevel)}>
                                {activity.riskLevel}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mitigation Strategies */}
                    {assessment.mitigation_strategies && assessment.mitigation_strategies.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Mitigation Strategies:</h5>
                        <ul className="text-sm space-y-1">
                          {assessment.mitigation_strategies.map((strategy, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-xs mt-1">•</span>
                              <span>{strategy}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {riskAssessments.length === 0 && weatherAlerts.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Risk Data Available</h3>
            <p className="text-muted-foreground">
              Click "Run Analysis" button above to assess weather-related risks for this project
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};