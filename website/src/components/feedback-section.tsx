"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail, Clock } from "lucide-react";

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
        {/* Notice about processing time */}
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm">
                Why does it take longer?
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                QuickBG runs on a small budget VPS to keep it free for everyone.
                Processing may take longer during peak hours. We&apos;re indie developers working to improve this!
              </p>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-foreground">
              Love QuickBG&apos;s ?
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
                window.open("https://github.com/yash5800/quickbg/issues", "_blank")
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
                window.open("mailto:feedback@quickbg.com")
              }
            >
              <Mail className="h-4 w-4" />
              Email Us
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Made with ❤️ by indie developers | Running on a small VPS for free access
          </p>
        </div>
      </Card>
    </motion.section>
  );
}
