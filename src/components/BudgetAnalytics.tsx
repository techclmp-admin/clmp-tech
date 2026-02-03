import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  DollarSign,
  Target,
  Calendar,
  TrendingDown,
  PieChart as PieChartIcon,
  BarChart3,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  percentage: number;
  status: 'on-track' | 'warning' | 'critical';
}

interface BudgetAnalyticsProps {
  totalBudget: number;
  totalSpent: number;
  categories: BudgetCategory[];
  timeframe: string;
}

// Color palette for pie chart using semantic/accessible colors
const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(217, 91%, 60%)',    // Blue
  'hsl(142, 71%, 45%)',    // Green
  'hsl(38, 92%, 50%)',     // Amber
  'hsl(262, 83%, 58%)',    // Purple
  'hsl(330, 81%, 60%)',    // Pink
  'hsl(187, 85%, 43%)',    // Cyan
  'hsl(24, 95%, 53%)',     // Orange
  'hsl(173, 80%, 40%)',    // Teal
  'hsl(0, 84%, 60%)',      // Red
];

const BudgetAnalytics: React.FC<BudgetAnalyticsProps> = ({
  totalBudget,
  totalSpent,
  categories,
  timeframe
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remainingBudget = totalBudget - totalSpent;

  // Filter categories that have alerts
  const alertCategories = categories.filter(cat => cat.status === 'critical' || cat.status === 'warning');

  // Prepare data for pie charts
  const allocationData = categories
    .filter(cat => cat.allocated > 0)
    .map((cat, index) => ({
      name: cat.name,
      value: cat.allocated,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

  const spendingData = categories
    .filter(cat => cat.spent > 0)
    .map((cat, index) => ({
      name: cat.name,
      value: cat.spent,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm">{data.name}</p>
          <p className="text-primary font-bold">{formatCurrency(data.value)}</p>
          <p className="text-xs text-muted-foreground">
            {((data.value / (payload[0].name === 'allocated' ? totalBudget : totalSpent)) * 100).toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend renderer
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-1.5 text-xs">
            <div 
              className="h-3 w-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Budget Overview - Summary Cards Only */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
            <p className="text-xs text-muted-foreground">For {timeframe}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <Progress value={budgetUtilization} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {budgetUtilization.toFixed(1)}% of budget used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(remainingBudget)}</div>
            <p className="text-xs text-muted-foreground">
              {remainingBudget < 0 ? 'Over budget' : 'Available to spend'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Allocation & Spending Pie Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Budget Allocation Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Budget Allocation
            </CardTitle>
            <CardDescription>
              How budget is distributed across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allocationData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {allocationData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={renderLegend} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <PieChartIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No budget allocations yet</p>
                  <p className="text-sm">Add budget entries to see distribution</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spending by Category Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              Spending by Category
            </CardTitle>
            <CardDescription>
              Where money is being spent
            </CardDescription>
          </CardHeader>
          <CardContent>
            {spendingData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {spendingData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={renderLegend} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No expenses recorded yet</p>
                  <p className="text-sm">Add expenses to see spending distribution</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget vs Actual Comparison Bar Chart */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Budget vs Actual Spending
            </CardTitle>
            <CardDescription>
              Compare allocated budget against actual spending by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categories.map(cat => ({
                    name: cat.name.length > 12 ? cat.name.substring(0, 12) + '...' : cat.name,
                    fullName: cat.name,
                    budget: cat.allocated,
                    spent: cat.spent,
                    variance: cat.allocated - cat.spent,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const variance = data.budget - data.spent;
                        const variancePercent = data.budget > 0 ? ((variance / data.budget) * 100) : 0;
                        return (
                          <div className="bg-popover border rounded-lg shadow-lg p-3 min-w-[180px]">
                            <p className="font-medium text-sm mb-2">{data.fullName}</p>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Budget:</span>
                                <span className="font-medium">{formatCurrency(data.budget)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Spent:</span>
                                <span className="font-medium text-primary">{formatCurrency(data.spent)}</span>
                              </div>
                              <div className="flex justify-between pt-1 border-t">
                                <span className="text-muted-foreground">Variance:</span>
                                <span className={`font-medium ${variance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                                  {variance >= 0 ? '+' : ''}{formatCurrency(variance)} ({variancePercent.toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => (
                      <span className="text-sm text-muted-foreground">
                        {value === 'budget' ? 'Allocated Budget' : 'Actual Spending'}
                      </span>
                    )}
                  />
                  <Bar 
                    dataKey="budget" 
                    fill="hsl(var(--muted-foreground))" 
                    radius={[4, 4, 0, 0]}
                    name="budget"
                    opacity={0.6}
                  />
                  <Bar 
                    dataKey="spent" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    name="spent"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Budget</p>
                <p className="text-lg font-bold">{formatCurrency(totalBudget)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(totalSpent)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Variance</p>
                <p className={`text-lg font-bold ${remainingBudget >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {remainingBudget >= 0 ? '+' : ''}{formatCurrency(remainingBudget)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown Table */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>
              Detailed view of budget vs actual spending by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories.map((category, index) => {
                const progressColor = category.status === 'critical' 
                  ? 'bg-destructive' 
                  : category.status === 'warning' 
                  ? 'bg-amber-500' 
                  : 'bg-primary';
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="font-medium text-sm">{category.name}</span>
                      </div>
                      <div className="text-right text-sm">
                        <span className="font-medium">{formatCurrency(category.spent)}</span>
                        <span className="text-muted-foreground"> / {formatCurrency(category.allocated)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${progressColor} transition-all duration-500`}
                          style={{ width: `${Math.min(category.percentage, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium min-w-[3rem] text-right ${
                        category.status === 'critical' ? 'text-destructive' :
                        category.status === 'warning' ? 'text-amber-600' : 'text-muted-foreground'
                      }`}>
                        {category.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Alerts</CardTitle>
          <CardDescription>
            Important notifications about budget performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alertCategories.map((category, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                <AlertTriangle className={`h-5 w-5 ${category.status === 'critical' ? 'text-destructive' : 'text-amber-500'}`} />
                <div className="flex-1">
                  <p className="font-medium">
                    {category.status === 'critical' ? 'Critical:' : 'Warning:'} {category.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {category.percentage >= 90 
                      ? `${category.percentage.toFixed(1)}% of budget used - immediate attention required`
                      : `${category.percentage.toFixed(1)}% of budget used - monitor closely`
                    }
                  </p>
                </div>
              </div>
            ))}
            {alertCategories.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2" />
                <p>All budget categories are on track!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetAnalytics;
