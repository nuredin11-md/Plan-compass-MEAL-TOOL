import React, { useState } from "react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Edit,
  Trash2,
  Save,
  Plus,
  Calendar,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { KPIDefinition, KPIRecord, ActionPlan } from '../types';
import { cn } from "@/lib/utils";

interface ActionPlansPanelProps {
  kpis: KPIDefinition[];
  records: KPIRecord[];
  actionPlans: ActionPlan[];
  initialSelectedKpiId: number | null;
  onSaveActionPlan: (plan: ActionPlan) => void;
  onDeleteActionPlan: (id: string) => void;
  onReload?: () => void;
  loading?: boolean;
}

export default function ActionPlansPanel({
  kpis,
  records,
  actionPlans,
  initialSelectedKpiId,
  onSaveActionPlan,
  onDeleteActionPlan,
  onReload,
  loading,
}: ActionPlansPanelProps) {
  const [editingPlan, setEditingPlan] = useState<ActionPlan | null>(null);
  const [formValues, setFormValues] = useState<ActionPlan>({
    id: '',
    kpiId: 0,
    month: '',
    gapDescription: '',
    rootCause: '',
    correctiveAction: '',
    responsiblePerson: '',
    deadline: '',
    progress: 'Not started',
    priority: 'Medium',
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');

  // Filter action plans by selected KPI if provided
  const filteredActionPlans = React.useMemo(() => {
    if (initialSelectedKpiId === null) {
      return actionPlans;
    }
    return actionPlans.filter(plan => plan.kpiId === initialSelectedKpiId);
  }, [actionPlans, initialSelectedKpiId]);

  // Get KPI name by ID
  const getKPIName = (kpiId: number): string => {
    const kpi = kpis.find(k => k.id === kpiId);
    return kpi ? kpi.name : 'Unknown KPI';
  };

  // Handle form change
  const handleFormChange = (field: keyof ActionPlan, value: any) => {
    setFormValues((prev: ActionPlan) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle saving the plan
  const handleSavePlan = () => {
    // Validate required fields
    if (formValues.kpiId === 0 || !formValues.month || !formValues.gapDescription.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const planToSave: ActionPlan = {
      ...formValues,
      id: formValues.id || `plan_${Date.now()}`,
    };

    onSaveActionPlan(planToSave);
    setIsDialogOpen(false);
    // Reset form
    setFormValues({
      id: '',
      kpiId: initialSelectedKpiId || 0,
      month: '',
      gapDescription: '',
      rootCause: '',
      correctiveAction: '',
      responsiblePerson: '',
      deadline: '',
      progress: 'Not started',
      priority: 'Medium',
    });
    if (onReload) onReload();
  };

  // Handle deleting a plan
  const handleDeletePlan = (id: string) => {
    if (window.confirm('Are you sure you want to delete this action plan?')) {
      onDeleteActionPlan(id);
      if (onReload) onReload();
    }
  };

  // Handle editing a plan
  const handleEditPlan = (plan: ActionPlan) => {
    setEditingPlan(plan);
    setFormValues({ ...plan });
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  // Handle adding a new plan
  const handleAddPlan = () => {
    setEditingPlan(null);
    setFormValues({
      id: '',
      kpiId: initialSelectedKpiId || 0,
      month: '',
      gapDescription: '',
      rootCause: '',
      correctiveAction: '',
      responsiblePerson: '',
      deadline: '',
      progress: 'Not started',
      priority: 'Medium',
    });
    setDialogMode('add');
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Action Plans</h2>
          <p className="text-sm text-gray-500 mt-1">
            Track and manage corrective actions for KPI gaps
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleAddPlan} 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 2.126 2 5.64 2 10c0 3.312 2.69 6.164 6 7.527V12z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Action Plan
              </>
            )}
          </Button>

          {onReload && (
            <Button 
              onClick={onReload} 
              variant="outline"
              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 2.126 2 5.64 2 10c0 3.312 2.69 6.164 6 7.527V12z"></path>
                  </svg>
                </>
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Reload
            </Button>
          )}
        </div>
      </div>

      {/* Action Plans Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {filteredActionPlans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No action plans found</p>
            {initialSelectedKpiId !== null && (
               <p className="text-sm text-gray-400 mt-1">
                 Add an action plan for the selected KPI to get started
               </p>
             )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">KPI</TableHead>
                  <TableHead className="font-semibold">Month</TableHead>
                  <TableHead className="font-semibold">Gap Description</TableHead>
                  <TableHead className="font-semibold">Root Cause</TableHead>
                  <TableHead className="font-semibold">Corrective Action</TableHead>
                  <TableHead className="font-semibold">Responsible</TableHead>
                  <TableHead className="font-semibold">Deadline</TableHead>
                  <TableHead className="font-semibold">Progress</TableHead>
                  <TableHead className="font-semibold">Priority</TableHead>
                  <TableHead className="font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActionPlans.map((plan) => (
                  <TableRow key={plan.id} className="hover:bg-gray-50">
                    <TableCell>
                      {getKPIName(plan.kpiId)}
                    </TableCell>
                    <TableCell>
                      {plan.month ? new Date(plan.month + "-01").toLocaleString('default', { month: 'short', year: 'numeric' }) : ''}
                    </TableCell>
                    <TableCell className="max-w-[200px] whitespace-normal">
                      {plan.gapDescription}
                    </TableCell>
                    <TableCell className="max-w-[200px] whitespace-normal">
                      {plan.rootCause}
                    </TableCell>
                    <TableCell className="max-w-[200px] whitespace-normal">
                      {plan.correctiveAction}
                    </TableCell>
                    <TableCell>
                      {plan.responsiblePerson}
                    </TableCell>
                    <TableCell>
                      {plan.deadline ? new Date(plan.deadline).toLocaleDateString() : ''}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        plan.progress === 'Completed' ? 'bg-green-100 text-green-800' :
                        plan.progress === 'In progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      )}>
                        {plan.progress}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        plan.priority === 'High' ? 'bg-red-100 text-red-800' :
                        plan.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      )}>
                        {plan.priority}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditPlan(plan)}
                          className="h-8 w-8 p-0 text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePlan(plan.id)}
                          className="h-8 w-8 p-0 text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'edit' ? 'Edit Action Plan' : 'Add New Action Plan'}
            </DialogTitle>
            <DialogDescription>
              Fill in the details for the action plan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-6">
            {/* KPI Select */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                KPI
              </label>
              <Select 
                value={formValues.kpiId.toString()} 
                onValueChange={(value) => handleFormChange('kpiId', Number(value))}
                disabled={initialSelectedKpiId !== null}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select KPI" />
                </SelectTrigger>
                <SelectContent>
                  {kpis.map((kpi) => (
                    <SelectItem key={kpi.id} value={kpi.id.toString()}>
                      {kpi.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Input */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Month (YYYY-MM)
              </label>
              <Input
                type="text"
                placeholder="e.g., 2026-06"
                value={formValues.month}
                onChange={(e) => handleFormChange('month', e.target.value)}
                className="w-48"
              />
            </div>

            {/* Gap Description */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Gap Description *
              </label>
              <Textarea
                value={formValues.gapDescription}
                onChange={(e) => handleFormChange('gapDescription', e.target.value)}
                placeholder="Describe the performance gap..."
                className="min-h-[80px]"
              />
            </div>

            {/* Root Cause */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Root Cause
              </label>
              <Textarea
                value={formValues.rootCause}
                onChange={(e) => handleFormChange('rootCause', e.target.value)}
                placeholder="What is the root cause of the gap?"
                className="min-h-[80px]"
              />
            </div>

            {/* Corrective Action */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Corrective Action
              </label>
              <Textarea
                value={formValues.correctiveAction}
                onChange={(e) => handleFormChange('correctiveAction', e.target.value)}
                placeholder="What corrective actions will be taken?"
                className="min-h-[80px]"
              />
            </div>

            {/* Responsible Person */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Responsible Person
              </label>
              <Input
                value={formValues.responsiblePerson}
                onChange={(e) => handleFormChange('responsiblePerson', e.target.value)}
                placeholder="Person responsible for implementation"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Deadline
              </label>
              <Input
                type="date"
                value={formValues.deadline ? formValues.deadline.split('T')[0] : ''}
                onChange={(e) => handleFormChange('deadline', e.target.value)}
                className="w-48"
              />
            </div>

            {/* Progress */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Progress
              </label>
              <Select 
                value={formValues.progress} 
                onValueChange={value => handleFormChange('progress', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select progress" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not started">Not started</SelectItem>
                  <SelectItem value="In progress">In progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Priority
              </label>
              <Select 
                value={formValues.priority || 'Medium'} 
                onValueChange={value => handleFormChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="w-24"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSavePlan}
              className="w-24"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}