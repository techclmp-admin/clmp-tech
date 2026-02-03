import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calculator, FileSpreadsheet, Info, DollarSign, TrendingUp, Building2, Receipt } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { formatCurrency as formatCAD } from '@/lib/canadianStandards';

interface TaxCalculation {
  subtotal: number;
  gst: number;
  pst: number;
  hst: number;
  total: number;
  province: string;
  taxType: 'GST+PST' | 'HST';
}

interface ProvinceConfig {
  code: string;
  name: string;
  taxType: 'GST+PST' | 'HST';
  gstRate: number;
  pstRate: number;
  hstRate: number;
  description: string;
}

const provinces: ProvinceConfig[] = [
  // HST Provinces
  { code: 'ON', name: 'Ontario', taxType: 'HST', gstRate: 0, pstRate: 0, hstRate: 0.13, description: '13% HST' },
  { code: 'NB', name: 'New Brunswick', taxType: 'HST', gstRate: 0, pstRate: 0, hstRate: 0.15, description: '15% HST' },
  { code: 'NS', name: 'Nova Scotia', taxType: 'HST', gstRate: 0, pstRate: 0, hstRate: 0.15, description: '15% HST' },
  { code: 'PE', name: 'Prince Edward Island', taxType: 'HST', gstRate: 0, pstRate: 0, hstRate: 0.15, description: '15% HST' },
  { code: 'NL', name: 'Newfoundland and Labrador', taxType: 'HST', gstRate: 0, pstRate: 0, hstRate: 0.15, description: '15% HST' },
  
  // GST + PST Provinces
  { code: 'BC', name: 'British Columbia', taxType: 'GST+PST', gstRate: 0.05, pstRate: 0.07, hstRate: 0, description: '5% GST + 7% PST' },
  { code: 'SK', name: 'Saskatchewan', taxType: 'GST+PST', gstRate: 0.05, pstRate: 0.06, hstRate: 0, description: '5% GST + 6% PST' },
  { code: 'MB', name: 'Manitoba', taxType: 'GST+PST', gstRate: 0.05, pstRate: 0.07, hstRate: 0, description: '5% GST + 7% PST' },
  { code: 'QC', name: 'Quebec', taxType: 'GST+PST', gstRate: 0.05, pstRate: 0.09975, hstRate: 0, description: '5% GST + 9.975% QST' },
  { code: 'AB', name: 'Alberta', taxType: 'GST+PST', gstRate: 0.05, pstRate: 0, hstRate: 0, description: '5% GST only' },
  
  // Territories
  { code: 'NT', name: 'Northwest Territories', taxType: 'GST+PST', gstRate: 0.05, pstRate: 0, hstRate: 0, description: '5% GST only' },
  { code: 'NU', name: 'Nunavut', taxType: 'GST+PST', gstRate: 0.05, pstRate: 0, hstRate: 0, description: '5% GST only' },
  { code: 'YT', name: 'Yukon', taxType: 'GST+PST', gstRate: 0.05, pstRate: 0, hstRate: 0, description: '5% GST only' }
];

const CanadianTaxCalculator: React.FC = () => {
  const [amount, setAmount] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<string>('ON');
  const [calculation, setCalculation] = useState<TaxCalculation | null>(null);

  // Fetch project expenses for tax summary
  const { data: expensesSummary } = useQuery({
    queryKey: ['expenses-tax-summary'],
    queryFn: async () => {
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('amount, category, expense_date, project_id, projects(name)');
      
      if (error) throw error;
      
      const totalExpenses = expenses?.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;
      
      // Group by category for tax analysis
      const byCategory = expenses?.reduce((acc: Record<string, number>, e) => {
        const cat = e.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + (Number(e.amount) || 0);
        return acc;
      }, {}) || {};
      
      return {
        totalExpenses,
        expenseCount: expenses?.length || 0,
        byCategory,
      };
    },
  });

  const calculateTax = () => {
    const subtotal = parseFloat(amount);
    if (isNaN(subtotal) || subtotal <= 0) return;

    const province = provinces.find(p => p.code === selectedProvince);
    if (!province) return;

    let calc: TaxCalculation;

    if (province.taxType === 'HST') {
      const hst = subtotal * province.hstRate;
      calc = {
        subtotal,
        gst: 0,
        pst: 0,
        hst,
        total: subtotal + hst,
        province: province.name,
        taxType: 'HST'
      };
    } else {
      const gst = subtotal * province.gstRate;
      const pst = subtotal * province.pstRate;
      calc = {
        subtotal,
        gst,
        pst,
        hst: 0,
        total: subtotal + gst + pst,
        province: province.name,
        taxType: 'GST+PST'
      };
    }

    setCalculation(calc);
  };

  // Calculate estimated tax on all expenses
  const calculateExpensesTax = () => {
    if (!expensesSummary) return null;
    
    const province = provinces.find(p => p.code === selectedProvince);
    if (!province) return null;
    
    const total = expensesSummary.totalExpenses;
    
    if (province.taxType === 'HST') {
      const hst = total * province.hstRate;
      return { gst: 0, pst: 0, hst, totalTax: hst };
    } else {
      const gst = total * province.gstRate;
      const pst = total * province.pstRate;
      return { gst, pst, hst: 0, totalTax: gst + pst };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const selectedProvinceConfig = provinces.find(p => p.code === selectedProvince);
  const expensesTax = calculateExpensesTax();

  return (
    <div className="space-y-6">
      {/* Expense Tax Summary */}
      {expensesSummary && expensesSummary.totalExpenses > 0 && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Your Expense Tax Summary
            </CardTitle>
            <CardDescription>
              Estimated tax obligations based on your recorded expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="p-4 rounded-lg bg-background border">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <DollarSign className="h-4 w-4" />
                  Total Expenses
                </div>
                <p className="text-2xl font-bold">{formatCurrency(expensesSummary.totalExpenses)}</p>
                <p className="text-xs text-muted-foreground">{expensesSummary.expenseCount} records</p>
              </div>
              
              {expensesTax && (
                <>
                  {selectedProvinceConfig?.taxType === 'HST' ? (
                    <div className="p-4 rounded-lg bg-background border">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                        <TrendingUp className="h-4 w-4" />
                        Estimated HST
                      </div>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(expensesTax.hst)}</p>
                      <p className="text-xs text-muted-foreground">{((selectedProvinceConfig?.hstRate || 0) * 100).toFixed(0)}% rate</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 rounded-lg bg-background border">
                        <div className="text-muted-foreground text-sm mb-1">GST (5%)</div>
                        <p className="text-xl font-bold text-primary">{formatCurrency(expensesTax.gst)}</p>
                      </div>
                      {expensesTax.pst > 0 && (
                        <div className="p-4 rounded-lg bg-background border">
                          <div className="text-muted-foreground text-sm mb-1">
                            {selectedProvinceConfig?.code === 'QC' ? 'QST' : 'PST'} ({((selectedProvinceConfig?.pstRate || 0) * 100).toFixed(2)}%)
                          </div>
                          <p className="text-xl font-bold text-primary">{formatCurrency(expensesTax.pst)}</p>
                        </div>
                      )}
                    </>
                  )}
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="text-muted-foreground text-sm mb-1">Total Estimated Tax</div>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(expensesTax.totalTax)}</p>
                    <p className="text-xs text-muted-foreground">
                      {((expensesTax.totalTax / expensesSummary.totalExpenses) * 100).toFixed(1)}% of expenses
                    </p>
                  </div>
                </>
              )}
            </div>
            
            {/* Category Breakdown */}
            {Object.keys(expensesSummary.byCategory).length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Expenses by Category</h4>
                <div className="space-y-2">
                  {Object.entries(expensesSummary.byCategory)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([category, amount]) => {
                      const percentage = (amount / expensesSummary.totalExpenses) * 100;
                      return (
                        <div key={category} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{category}</span>
                            <span className="font-medium">{formatCurrency(amount)}</span>
                          </div>
                          <Progress value={percentage} className="h-1.5" />
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tax Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Canadian Tax Calculator (CRA Compliant)
          </CardTitle>
          <CardDescription>
            Calculate GST, PST, and HST for all Canadian provinces and territories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (CAD)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Province/Territory</Label>
              <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">HST Provinces</div>
                  {provinces.filter(p => p.taxType === 'HST').map((province) => (
                    <SelectItem key={province.code} value={province.code}>
                      {province.name} - {province.description}
                    </SelectItem>
                  ))}
                  <Separator className="my-1" />
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">GST + PST Provinces/Territories</div>
                  {provinces.filter(p => p.taxType === 'GST+PST').map((province) => (
                    <SelectItem key={province.code} value={province.code}>
                      {province.name} - {province.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProvinceConfig && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {selectedProvinceConfig.name}: {selectedProvinceConfig.description}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <Button onClick={calculateTax} className="w-full" disabled={!amount || parseFloat(amount) <= 0}>
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Tax
          </Button>

          {calculation && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Tax Calculation Results</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{calculation.province}</Badge>
                  <Badge variant="secondary">{calculation.taxType}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Subtotal</Label>
                    <p className="font-medium">{formatCurrency(calculation.subtotal)}</p>
                  </div>
                  
                  {calculation.taxType === 'HST' ? (
                    <div>
                      <Label className="text-sm text-muted-foreground">HST</Label>
                      <p className="font-medium">{formatCurrency(calculation.hst)}</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label className="text-sm text-muted-foreground">GST (5%)</Label>
                        <p className="font-medium">{formatCurrency(calculation.gst)}</p>
                      </div>
                      {calculation.pst > 0 && (
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            {selectedProvinceConfig?.code === 'QC' ? 'QST' : 'PST'}
                          </Label>
                          <p className="font-medium">{formatCurrency(calculation.pst)}</p>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="col-span-2 pt-2 border-t">
                    <Label className="text-sm text-muted-foreground">Total Amount</Label>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(calculation.total)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Tax Rates Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Canadian Tax Rates Reference
          </CardTitle>
          <CardDescription>Current GST, PST, HST, and QST rates by province/territory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Province/Territory</th>
                  <th className="text-center py-2 px-2">GST</th>
                  <th className="text-center py-2 px-2">PST/QST</th>
                  <th className="text-center py-2 px-2">HST</th>
                  <th className="text-center py-2 px-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {provinces.map((province) => {
                  const total = province.taxType === 'HST' 
                    ? province.hstRate 
                    : province.gstRate + province.pstRate;
                  return (
                    <tr 
                      key={province.code} 
                      className={`border-b hover:bg-muted/50 ${province.code === selectedProvince ? 'bg-primary/10' : ''}`}
                    >
                      <td className="py-2 px-2 font-medium">{province.name}</td>
                      <td className="text-center py-2 px-2">
                        {province.taxType === 'GST+PST' ? `${(province.gstRate * 100).toFixed(0)}%` : '-'}
                      </td>
                      <td className="text-center py-2 px-2">
                        {province.taxType === 'GST+PST' && province.pstRate > 0 
                          ? `${(province.pstRate * 100).toFixed(province.code === 'QC' ? 3 : 0)}%`
                          : '-'}
                      </td>
                      <td className="text-center py-2 px-2">
                        {province.taxType === 'HST' ? `${(province.hstRate * 100).toFixed(0)}%` : '-'}
                      </td>
                      <td className="text-center py-2 px-2 font-bold text-primary">
                        {(total * 100).toFixed(province.code === 'QC' ? 3 : 0)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tax Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            CRA Tax Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>HST Provinces:</strong> Ontario, New Brunswick, Nova Scotia, Prince Edward Island, and Newfoundland and Labrador use a single Harmonized Sales Tax (HST) that combines federal and provincial taxes.
              </AlertDescription>
            </Alert>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>GST + PST Provinces:</strong> All other provinces and territories use separate GST (5%) and PST rates. Quebec uses QST (Quebec Sales Tax) instead of PST.
              </AlertDescription>
            </Alert>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>GST/HST Registration:</strong> Businesses with taxable sales over $30,000 annually must register for GST/HST. Contact CRA for registration requirements.
              </AlertDescription>
            </Alert>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Input Tax Credits (ITC):</strong> Registered businesses can claim ITCs to recover the GST/HST paid on business purchases. Keep all receipts for tax filing.
              </AlertDescription>
            </Alert>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Construction Industry:</strong> Most construction services are taxable at the full GST/HST rate. Some exemptions may apply for new residential housing (partial rebates available).
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CanadianTaxCalculator;
