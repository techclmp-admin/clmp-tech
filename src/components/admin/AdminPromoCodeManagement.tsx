import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Ban, CheckCircle, Tag, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  applicable_plans: string[] | null;
  created_at: string;
}

export function AdminPromoCodeManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 0,
    max_uses: null as number | null,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: "",
    is_active: true,
    applicable_plans: [] as string[],
  });

  // Fetch promo codes
  const { data: promoCodes = [], isLoading } = useQuery({
    queryKey: ['admin-promo-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PromoCode[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingPromo) {
        const { error } = await supabase
          .from('promo_codes')
          .update({
            description: data.description,
            discount_type: data.discount_type,
            discount_value: data.discount_value,
            max_uses: data.max_uses,
            valid_from: data.valid_from,
            valid_until: data.valid_until || null,
            is_active: data.is_active,
            applicable_plans: data.applicable_plans.length > 0 ? data.applicable_plans : null,
          })
          .eq('id', editingPromo.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('promo_codes')
          .insert({
            code: data.code.toUpperCase(),
            description: data.description,
            discount_type: data.discount_type,
            discount_value: data.discount_value,
            max_uses: data.max_uses,
            valid_from: data.valid_from,
            valid_until: data.valid_until || null,
            is_active: data.is_active,
            applicable_plans: data.applicable_plans.length > 0 ? data.applicable_plans : null,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      toast({
        title: editingPromo ? "Promo code updated" : "Promo code created",
        description: `Successfully ${editingPromo ? 'updated' : 'created'} promo code`,
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save promo code",
        variant: "destructive",
      });
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      toast({
        title: "Status updated",
        description: "Promo code status has been updated",
      });
    },
  });

  const handleOpenDialog = (promo?: PromoCode) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        code: promo.code,
        description: promo.description || "",
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        max_uses: promo.max_uses,
        valid_from: promo.valid_from.split('T')[0],
        valid_until: promo.valid_until ? promo.valid_until.split('T')[0] : "",
        is_active: promo.is_active,
        applicable_plans: promo.applicable_plans || [],
      });
    } else {
      setEditingPromo(null);
      setFormData({
        code: "",
        description: "",
        discount_type: "percentage",
        discount_value: 0,
        max_uses: null,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: "",
        is_active: true,
        applicable_plans: [],
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingPromo(null);
  };

  const handleSubmit = () => {
    if (!formData.code && !editingPromo) {
      toast({
        title: "Validation Error",
        description: "Promo code is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.discount_value <= 0) {
      toast({
        title: "Validation Error",
        description: "Discount value must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate(formData);
  };

  const filteredPromoCodes = promoCodes.filter(promo =>
    promo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    promo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate statistics
  const stats = {
    total: promoCodes.length,
    active: promoCodes.filter(p => p.is_active).length,
    totalUses: promoCodes.reduce((sum, p) => sum + p.current_uses, 0),
    totalValue: promoCodes.reduce((sum, p) => {
      if (p.discount_type === 'fixed') {
        return sum + (p.discount_value * p.current_uses);
      }
      return sum;
    }, 0),
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              Total Codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Active Codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Total Uses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              Total Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Promo Code Management</CardTitle>
              <CardDescription>Create and manage promotional discount codes</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Promo Code
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <Input
            placeholder="Search promo codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading promo codes...
                    </TableCell>
                  </TableRow>
                ) : filteredPromoCodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No promo codes found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPromoCodes.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-mono font-semibold">{promo.code}</div>
                          {promo.description && (
                            <div className="text-sm text-muted-foreground">{promo.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {promo.discount_type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {promo.discount_type === 'percentage' 
                          ? `${promo.discount_value}%` 
                          : `$${promo.discount_value}`}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {promo.current_uses}
                          {promo.max_uses && ` / ${promo.max_uses}`}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{format(new Date(promo.valid_from), 'MMM d, yyyy')}</div>
                        <div className="text-muted-foreground">
                          to {promo.valid_until ? format(new Date(promo.valid_until), 'MMM d, yyyy') : 'No expiry'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={promo.is_active ? "default" : "secondary"}>
                          {promo.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(promo)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActiveMutation.mutate({ 
                              id: promo.id, 
                              is_active: !promo.is_active 
                            })}
                          >
                            {promo.is_active ? (
                              <Ban className="w-4 h-4 text-destructive" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}
            </DialogTitle>
            <DialogDescription>
              {editingPromo 
                ? 'Update the promo code details below' 
                : 'Create a new promotional discount code'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">Promo Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., SAVE20"
                disabled={!!editingPromo}
                className="font-mono"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this promo code"
                rows={2}
              />
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type *</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Discount Value *</Label>
                <Input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                  placeholder={formData.discount_type === 'percentage' ? '20' : '10'}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Max Uses */}
            <div className="space-y-2">
              <Label htmlFor="max_uses">Maximum Uses (leave empty for unlimited)</Label>
              <Input
                id="max_uses"
                type="number"
                value={formData.max_uses || ""}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  max_uses: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="Unlimited"
                min="1"
              />
            </div>

            {/* Valid Period */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valid From *</Label>
                <Input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Valid Until (optional)</Label>
                <Input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  min={formData.valid_from}
                />
              </div>
            </div>

            {/* Applicable Plans */}
            <div className="space-y-2">
              <Label>Applicable Plans</Label>
              <div className="flex gap-2 flex-wrap">
                {['free', 'professional', 'enterprise'].map((plan) => (
                  <Badge
                    key={plan}
                    variant={formData.applicable_plans.includes(plan) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        applicable_plans: formData.applicable_plans.includes(plan)
                          ? formData.applicable_plans.filter(p => p !== plan)
                          : [...formData.applicable_plans, plan]
                      });
                    }}
                  >
                    {plan.charAt(0).toUpperCase() + plan.slice(1)}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to apply to all plans
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable this promo code
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editingPromo ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
