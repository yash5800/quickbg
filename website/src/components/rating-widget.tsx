"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RatingWidgetProps {
  tool: string;
  imageId?: string;
  jobId?: string;
}

export function RatingWidget({ tool, imageId, jobId }: RatingWidgetProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRating = async (nextRating: number) => {
    if (isSubmitting || submitted) return;
    setRating(nextRating);
    setIsSubmitting(true);

    try {
      await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, rating: nextRating, imageId, jobId }),
      });
      setSubmitted(true);
    } catch (error) {
      console.warn("Failed to submit rating", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{submitted ? "Thanks for the feedback" : "How did this result feel?"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {submitted ? "Your rating helps tune QuickBG." : "Rate this tool without interrupting your workflow."}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDismissed(true)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {!submitted && (
              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => {
                  const active = value <= (hovered || rating);
                  return (
                    <button
                      key={value}
                      type="button"
                      className="rounded-md p-1 transition hover:bg-accent"
                      onMouseEnter={() => setHovered(value)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => void submitRating(value)}
                      disabled={isSubmitting}
                      aria-label={`Rate ${value} stars`}
                    >
                      <Star className={cn("h-5 w-5", active ? "fill-amber-400 text-secondary/80" : "text-muted-foreground")} />
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
