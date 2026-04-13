import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { School, ArrowRight, ArrowLeft, CheckCircle, Sparkles } from "lucide-react";

interface ClassSetupWizardProps {
  open: boolean;
  schoolId: string;
  onComplete: () => void;
  onSkip: () => void;
}

const CLASS_CATEGORIES = [
  {
    label: "Pre-Primary",
    classes: ["Nursery", "LKG", "UKG"],
  },
  {
    label: "Primary",
    classes: ["1st", "2nd", "3rd", "4th", "5th"],
  },
  {
    label: "Secondary",
    classes: ["6th", "7th", "8th", "9th", "10th"],
  },
  {
    label: "Senior Secondary",
    classes: ["11th", "12th"],
  },
];

const SECTION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const ClassSetupWizard = ({ open, schoolId, onComplete, onSkip }: ClassSetupWizardProps) => {
  const [step, setStep] = useState(1);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [sectionCounts, setSectionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const toggleCategory = (category: typeof CLASS_CATEGORIES[0]) => {
    const allSelected = category.classes.every((c) => selectedClasses.includes(c));
    if (allSelected) {
      setSelectedClasses((prev) => prev.filter((c) => !category.classes.includes(c)));
    } else {
      setSelectedClasses((prev) => [...new Set([...prev, ...category.classes])]);
    }
  };

  const toggleClass = (className: string) => {
    setSelectedClasses((prev) =>
      prev.includes(className) ? prev.filter((c) => c !== className) : [...prev, className]
    );
  };

  const getSectionCount = (className: string) => sectionCounts[className] || 1;

  const setSectionCount = (className: string, count: number) => {
    setSectionCounts((prev) => ({ ...prev, [className]: Math.max(1, Math.min(26, count)) }));
  };

  const handleSubmit = async () => {
    if (selectedClasses.length === 0) {
      toast.error("Please select at least one class");
      return;
    }

    setLoading(true);
    try {
      const classRows: { name: string; section: string; school_id: string; academic_year: string }[] = [];

      for (const className of selectedClasses) {
        const count = getSectionCount(className);
        for (let i = 0; i < count; i++) {
          classRows.push({
            name: className,
            section: SECTION_LETTERS[i],
            school_id: schoolId,
            academic_year: "2024-25",
          });
        }
      }

      const { error } = await supabase.from("classes").insert(classRows);
      if (error) throw error;

      toast.success(`${classRows.length} class sections created successfully!`);
      onComplete();
    } catch (error: any) {
      console.error("Error creating classes:", error);
      toast.error(error.message || "Failed to create classes");
    } finally {
      setLoading(false);
    }
  };

  // Get ordered selected classes maintaining category order
  const orderedSelectedClasses = CLASS_CATEGORIES.flatMap((cat) =>
    cat.classes.filter((c) => selectedClasses.includes(c))
  );

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <School className="h-5 w-5 text-primary" />
            {step === 1 ? "Select Your Classes" : "Configure Sections"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Choose which classes your school offers. You can always add more later."
              : "Set how many sections each class has (e.g., A, B, C). Default is 1 section."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-2">
            {CLASS_CATEGORIES.map((category) => {
              const allSelected = category.classes.every((c) => selectedClasses.includes(c));
              const someSelected = category.classes.some((c) => selectedClasses.includes(c));
              return (
                <div key={category.label} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() => toggleCategory(category)}
                      className={someSelected && !allSelected ? "opacity-60" : ""}
                    />
                    <Label className="text-base font-semibold cursor-pointer" onClick={() => toggleCategory(category)}>
                      {category.label}
                    </Label>
                    {someSelected && (
                      <Badge variant="secondary" className="text-xs">
                        {category.classes.filter((c) => selectedClasses.includes(c)).length}/{category.classes.length}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pl-7">
                    {category.classes.map((cls) => {
                      const isSelected = selectedClasses.includes(cls);
                      return (
                        <Button
                          key={cls}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleClass(cls)}
                          className="rounded-full"
                        >
                          {isSelected && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                          {cls}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 py-2">
            {orderedSelectedClasses.map((cls) => {
              const count = getSectionCount(cls);
              const sections = Array.from({ length: count }, (_, i) => SECTION_LETTERS[i]);
              return (
                <div key={cls} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{cls}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sections.map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">
                          {cls}-{s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground whitespace-nowrap">Sections:</Label>
                    <Input
                      type="number"
                      min={1}
                      max={26}
                      value={count}
                      onChange={(e) => setSectionCount(cls, parseInt(e.target.value) || 1)}
                      className="w-16 text-center"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {step === 1 ? (
            <>
              <Button variant="ghost" onClick={onSkip} className="sm:mr-auto">
                Skip for now
              </Button>
              <Button
                onClick={() => {
                  if (selectedClasses.length === 0) {
                    toast.error("Please select at least one class");
                    return;
                  }
                  setStep(2);
                }}
              >
                Next: Configure Sections
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)} className="sm:mr-auto">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                    Creating...
                  </span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1" />
                    Create {orderedSelectedClasses.reduce((sum, c) => sum + getSectionCount(c), 0)} Class Sections
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClassSetupWizard;
