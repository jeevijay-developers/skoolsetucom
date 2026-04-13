import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { School, ArrowRight, ArrowLeft, CheckCircle, Sparkles, Plus, Minus } from "lucide-react";

interface ClassSetupWizardProps {
  open: boolean;
  schoolId: string;
  onComplete: () => void;
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
    hasStreams: true,
  },
];

const STREAMS = [
  { id: "Science", label: "Science", description: "PCM / PCB" },
  { id: "Commerce", label: "Commerce", description: "Accounts, Business Studies" },
  { id: "Arts", label: "Arts / Humanities", description: "History, Political Science, etc." },
  { id: "Vocational", label: "Vocational", description: "IT, Tourism, Agriculture, etc." },
  { id: "General", label: "General", description: "No specific stream" },
];

const SECTION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const ClassSetupWizard = ({ open, schoolId, onComplete }: ClassSetupWizardProps) => {
  const [step, setStep] = useState(1);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  // For senior secondary: which streams are selected per base class (11th, 12th)
  const [selectedStreams, setSelectedStreams] = useState<Record<string, string[]>>({});
  const [sectionCounts, setSectionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const toggleCategory = (category: typeof CLASS_CATEGORIES[0]) => {
    if (category.hasStreams) {
      // For senior secondary, toggle the base classes
      const allSelected = category.classes.every((c) => selectedClasses.includes(c));
      if (allSelected) {
        setSelectedClasses((prev) => prev.filter((c) => !category.classes.includes(c)));
        // Clear streams too
        const newStreams = { ...selectedStreams };
        category.classes.forEach((c) => delete newStreams[c]);
        setSelectedStreams(newStreams);
      } else {
        setSelectedClasses((prev) => [...new Set([...prev, ...category.classes])]);
      }
    } else {
      const allSelected = category.classes.every((c) => selectedClasses.includes(c));
      if (allSelected) {
        setSelectedClasses((prev) => prev.filter((c) => !category.classes.includes(c)));
      } else {
        setSelectedClasses((prev) => [...new Set([...prev, ...category.classes])]);
      }
    }
  };

  const toggleClass = (className: string) => {
    setSelectedClasses((prev) => {
      if (prev.includes(className)) {
        // If removing a senior secondary class, also clear its streams
        const newStreams = { ...selectedStreams };
        delete newStreams[className];
        setSelectedStreams(newStreams);
        return prev.filter((c) => c !== className);
      }
      return [...prev, className];
    });
  };

  const toggleStream = (baseClass: string, streamId: string) => {
    setSelectedStreams((prev) => {
      const current = prev[baseClass] || [];
      if (current.includes(streamId)) {
        return { ...prev, [baseClass]: current.filter((s) => s !== streamId) };
      }
      return { ...prev, [baseClass]: [...current, streamId] };
    });
  };

  const isSeniorSecondaryClass = (className: string) => {
    return CLASS_CATEGORIES.find((c) => c.hasStreams)?.classes.includes(className) || false;
  };

  // Build final class list: for senior secondary, expand into "11th Science", "11th Commerce", etc.
  const getFinalClassNames = (): string[] => {
    const result: string[] = [];
    for (const category of CLASS_CATEGORIES) {
      for (const cls of category.classes) {
        if (!selectedClasses.includes(cls)) continue;
        if (category.hasStreams) {
          const streams = selectedStreams[cls] || [];
          for (const stream of streams) {
            result.push(`${cls} ${stream}`);
          }
        } else {
          result.push(cls);
        }
      }
    }
    return result;
  };

  const getSectionCount = (className: string) => sectionCounts[className] || 1;

  const setSectionCount = (className: string, count: number) => {
    setSectionCounts((prev) => ({ ...prev, [className]: Math.max(1, Math.min(26, count)) }));
  };

  // Check if senior secondary classes have at least one stream selected
  const hasSeniorSecondaryWithoutStreams = () => {
    for (const cls of selectedClasses) {
      if (isSeniorSecondaryClass(cls)) {
        const streams = selectedStreams[cls] || [];
        if (streams.length === 0) return cls;
      }
    }
    return null;
  };

  const handleNext = () => {
    if (selectedClasses.length === 0) {
      toast.error("Please select at least one class");
      return;
    }
    const missingStream = hasSeniorSecondaryWithoutStreams();
    if (missingStream) {
      toast.error(`Please select at least one stream for ${missingStream}`);
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    const finalClasses = getFinalClassNames();
    if (finalClasses.length === 0) {
      toast.error("Please select at least one class");
      return;
    }

    setLoading(true);
    try {
      const classRows: { name: string; section: string; school_id: string; academic_year: string }[] = [];

      for (const className of finalClasses) {
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

  const finalClassNames = getFinalClassNames();

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
              ? "Choose which classes your school offers. For 11th & 12th, also select streams."
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

                  {/* Stream selection for Senior Secondary */}
                  {category.hasStreams && category.classes.some((c) => selectedClasses.includes(c)) && (
                    <div className="pl-7 pt-2 border-t space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        Select streams for senior secondary classes:
                      </p>
                      {category.classes
                        .filter((cls) => selectedClasses.includes(cls))
                        .map((cls) => (
                          <div key={cls} className="space-y-2">
                            <p className="text-sm font-semibold">{cls} — Streams:</p>
                            <div className="flex flex-wrap gap-2">
                              {STREAMS.map((stream) => {
                                const isStreamSelected = (selectedStreams[cls] || []).includes(stream.id);
                                return (
                                  <Button
                                    key={stream.id}
                                    type="button"
                                    variant={isStreamSelected ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleStream(cls, stream.id)}
                                    className="rounded-full"
                                    title={stream.description}
                                  >
                                    {isStreamSelected && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                                    {stream.label}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 py-2">
            {finalClassNames.map((cls) => {
              const count = getSectionCount(cls);
              const sections = Array.from({ length: count }, (_, i) => SECTION_LETTERS[i]);
              return (
                <div key={cls} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{cls}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sections.map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">
                          {cls} - {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setSectionCount(cls, count - 1)} disabled={count <= 1}>
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{count}</span>
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setSectionCount(cls, count + 1)} disabled={count >= 26}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {step === 1 ? (
            <Button className="sm:ml-auto" onClick={handleNext}>
              Next: Configure Sections
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
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
                    Create {finalClassNames.reduce((sum, c) => sum + getSectionCount(c), 0)} Class Sections
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
