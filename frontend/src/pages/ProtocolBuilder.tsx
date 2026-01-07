import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useProtocol, Exercise } from '@/context/ProtocolContext';
import { Search, GripVertical, Trash2, Loader2, Save, UserPlus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// UI-specific type combining Exercise details with ProtocolStep configuration
interface UIProtocolExercise extends Exercise {
  // Configurable fields for the protocol step
  step_id: string; // Temporary ID for UI list management
  sets: number;
  reps: number;
  duration_seconds: number | null;
  side: 'left' | 'right' | 'both';
  order_index: number;
}

const ProtocolBuilder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { exercises, createProtocol } = useProtocol();

  // Local state for the builder
  const [builderExercises, setBuilderExercises] = useState<UIProtocolExercise[]>([]);
  const [protocolName, setProtocolName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter exercises
  const filteredExercises = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (exercise.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    (exercise.joint?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const handleCreateProtocol = async (isDraft: boolean) => {
    if (!protocolName.trim()) {
      toast({
        title: "Error",
        description: "Protocol name is required",
        variant: "destructive"
      });
      return;
    }
    if (builderExercises.length === 0) {
      toast({
        title: "Error",
        description: "Add at least one exercise",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate async delay
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      // Map UI exercises to context format (ProtocolStep)
      const protocolInput = builderExercises.map(ex => ({
        exercise_id: ex.id,
        sets: ex.sets,
        reps: ex.reps,
        duration_seconds: ex.duration_seconds,
        side: ex.side,
        order_index: ex.order_index,
        notes: null
      }));

      createProtocol({
        title: protocolName,
        steps: protocolInput
      });

      toast({
        title: "Success",
        description: isDraft ? 'Protocol saved as draft' : 'Protocol created successfully',
      });

      if (!isDraft && selectedPatientId) {
        // Dummy assignment
        console.log(`ASSIGNMENT_CREATED: Protocol assigned to patient ${selectedPatientId}`);
        toast({
          title: "Assignment Created",
          description: "Dummy assignment created. Check console logs.",
        });
        navigate('/patients');
      } else {
        // Reset form
        setBuilderExercises([]);
        setProtocolName('');
        setSelectedPatientId('');
      }

    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create protocol",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addToProtocol = (exercise: Exercise) => {
    // Check if already added
    if (builderExercises.find(e => e.id === exercise.id)) return;

    setBuilderExercises([
      ...builderExercises,
      {
        ...exercise,
        step_id: crypto.randomUUID(), // Temp UI ID
        sets: 3,
        reps: 10,
        duration_seconds: null,
        side: 'both',
        order_index: builderExercises.length,
      }
    ]);
  };

  const removeFromProtocol = (stepId: string) => {
    setBuilderExercises(builderExercises.filter((e) => e.step_id !== stepId).map((ex, idx) => ({ ...ex, order_index: idx })));
  };

  const updateExercise = (stepId: string, updates: Partial<UIProtocolExercise>) => {
    setBuilderExercises(builderExercises.map((ex) => (ex.step_id === stepId ? { ...ex, ...updates } : ex)));
  };

  // DUMMY PATIENTS for dropdown
  const DUMMY_PATIENTS = [
    { id: 'patient-1', full_name: 'Demo Patient' },
    { id: 'patient-2', full_name: 'John Doe' }
  ];

  return (
    <MainLayout title="Protocol Builder" subtitle="Select exercises to build a new protocol.">
      <div className="flex gap-6 animate-fade-in">
        {/* Exercise Library */}
        <div className="flex-1">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12"
            />
          </div>

          {/* Exercise Grid */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {filteredExercises.map((exercise) => (
              <div key={exercise.id} className="exercise-card group">
                <div className="relative aspect-square overflow-hidden bg-secondary/30 flex items-center justify-center p-4">
                  {exercise.image_url ? (
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-primary/20 bg-background/50">
                      <img
                        src={exercise.image_url}
                        alt={exercise.name}
                        className="w-full h-full object-cover scale-[1.55] translate-y-[2%] group-hover:scale-[1.65] transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <span className="text-sm">No Image</span>
                    </div>
                  )}
                  <button
                    onClick={() => addToProtocol(exercise)}
                    disabled={!!builderExercises.find((e) => e.id === exercise.id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-foreground mb-2">{exercise.name}</h3>
                  <div className="flex flex-wrap gap-1">
                    {exercise.joint && (
                      <span className="px-2 py-1 rounded-md bg-secondary text-muted-foreground text-xs">
                        {exercise.joint}
                      </span>
                    )}
                    {exercise.difficulty && (
                      <span className="px-2 py-1 rounded-md bg-secondary text-muted-foreground text-xs">
                        {exercise.difficulty}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredExercises.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No exercises found matching &quot;{searchTerm}&quot;</p>
            </div>
          )}
        </div>

        {/* Current Protocol Panel */}
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-24">
            <div className="stat-card">
              <h3 className="text-lg font-semibold text-foreground mb-1">Current Protocol</h3>
              <p className="text-sm text-muted-foreground mb-4">{builderExercises.length} exercise(s)</p>

              <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto scrollbar-thin">
                {builderExercises.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No exercises added yet</p>
                ) : (
                  builderExercises.map((exercise) => (
                    <div key={exercise.step_id} className="protocol-item">
                      <div className="flex items-center gap-2 mb-3">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                        <span className="font-medium text-foreground flex-1 text-sm">{exercise.name}</span>
                        <button
                          onClick={() => removeFromProtocol(exercise.step_id)}
                          className="p-1 hover:bg-card rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Sets</label>
                          <Input
                            type="number"
                            min="1"
                            value={exercise.sets}
                            onChange={(e) => updateExercise(exercise.step_id, { sets: parseInt(e.target.value) || 0 })}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Reps</label>
                          <Input
                            type="number"
                            min="1"
                            value={exercise.reps}
                            onChange={(e) => updateExercise(exercise.step_id, { reps: parseInt(e.target.value) || 0 })}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <label className="text-xs text-muted-foreground block mb-1">Side</label>
                        <select
                          value={exercise.side || 'both'}
                          onChange={(e) =>
                            updateExercise(exercise.step_id, { side: e.target.value as 'left' | 'right' | 'both' })
                          }
                          className="w-full h-8 text-xs bg-card border border-border rounded px-2"
                        >
                          <option value="both">Both</option>
                          <option value="left">Left</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Input
                type="text"
                placeholder="Protocol Name (e.g., Post-ACL Week 1)"
                value={protocolName}
                onChange={(e) => setProtocolName(e.target.value)}
                className="w-full mb-4"
              />

              {/* Patient Selection for Assignment */}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground block mb-1">Assign to Patient (optional)</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full h-9 text-sm bg-card border border-border rounded px-3"
                >
                  <option value="">None (Save as Draft)</option>
                  {DUMMY_PATIENTS.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => handleCreateProtocol(true)}
                  disabled={isSubmitting || !protocolName.trim() || builderExercises.length === 0}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Draft
                    </>
                  )}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleCreateProtocol(false)}
                  disabled={
                    isSubmitting ||
                    !protocolName.trim() ||
                    builderExercises.length === 0 ||
                    !selectedPatientId
                  }
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      {selectedPatientId ? 'Assign' : 'Create'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProtocolBuilder;
