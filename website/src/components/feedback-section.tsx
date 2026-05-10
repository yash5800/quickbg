"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail } from "lucide-react";

export function FeedbackSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mt-12 scroll-mt-20"
      id="feedback"
    >
      <Card className="p-8 sm:p-10 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-foreground">
              Love QuickBG&apos;s background removal?
            </h3>
            <p className="text-muted-foreground mt-2">
              We&apos;d love to hear your feedback and suggestions for improvements.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              size="lg"
              className="gap-2"
              onClick={() =>
                window.open("https://github.com/", "_blank")
              }
            >
              <MessageSquare className="h-4 w-4" />
              Share Feedback
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2"
              onClick={() =>
                window.open("mailto:feedback@example.com")
              }
            >
              <Mail className="h-4 w-4" />
              Email Us
            </Button>
          </div>
        </div>
      </Card>
    </motion.section>
  );
}
