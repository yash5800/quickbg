"use client";

import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, Send, Loader2 } from "lucide-react";
import emailjs from "emailjs-com";
import { useToast } from "@/components/ui/toast";

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
      <FeedbackCard />
    </motion.section>
  );
}

function FeedbackCard() {
  return (
    <Card className="premium-surface p-8 sm:p-10">
      <NoticeSection />
      <div className="text-center space-y-4 mt-6">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-white">
            Love QuickBG?
          </h3>
          <p className="text-muted-foreground mt-2">
            We&apos;d love to hear your feedback and suggestions for improvements.
          </p>
        </div>

        <ActionButtons />

        <p className="text-xs text-muted-foreground mt-4">
          Made with ❤️ by indie developers | Running on a small VPS for free access
        </p>
      </div>
    </Card>
  );
}

function NoticeSection() {
  return (
    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
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
  );
}

function ActionButtons() {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Button size="lg" className="gap-2" onClick={() => setShowForm(true)}>
          <MessageSquare className="h-4 w-4" />
          Share Feedback
        </Button>
        {/* <SupportButton /> */}
      </div>

      {showForm && <FeedbackForm onClose={() => setShowForm(false)} />}
    </>
  );
}

// function SupportButton() {
//   const donateUrl = process.env.NEXT_PUBLIC_DONATE_URL;

//   if (!donateUrl) return null;

//   return (
//     <Button
//       size="lg"
//       className="gap-2 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 hover:from-rose-600 hover:via-pink-600 hover:to-purple-600 text-white border-0"
//       onClick={() => window.open(donateUrl, "_blank")}
//     >
//       <Heart className="h-4 w-4" />
//       Support Us
//     </Button>
//   );
// }

function FeedbackForm({ onClose }: { onClose: () => void }) {
  const { addToast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const fallbackRecipientEmail = process.env.NEXT_PUBLIC_FEEDBACK_TO_EMAIL?.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!publicKey || !serviceId || !templateId) {
      addToast({
        type: "error",
        title: "Feedback service not configured",
        description: "Please contact the administrator.",
      });
      return;
    }

    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const message = String(formData.get("message") || "").trim();

    setIsSending(true);
    try {
      await emailjs.send(serviceId, templateId, {
        name,
        email,
        message,
        title: "QuickBG Feedback",
        client_email: fallbackRecipientEmail || email,
      }, publicKey);
      addToast({
        type: "success",
        title: "Feedback sent!",
        description: "Thank you for your message.",
      });
      onClose();
    } catch (error) {
      const description =
        typeof error === "object" && error !== null && "text" in error
          ? String((error as { text?: string }).text || "Please try again later.")
          : "Please try again later.";

      addToast({
        type: "error",
        title: "Failed to send",
        description,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 premium-surface rounded-lg p-6 max-w-md mx-auto"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="text-sm font-medium">Name</label>
          <input
            type="text"
            name="name"
            id="name"
            required
            className="w-full mt-1 px-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            id="email"
            required
            className="w-full mt-1 px-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label htmlFor="message" className="text-sm font-medium">Message</label>
          <textarea
            name="message"
            id="message"
            required
            rows={4}
            className="w-full mt-1 px-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Your feedback or suggestion..."
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button type="submit" disabled={isSending} size="sm" className="gap-2">
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send
          </Button>
        </div>
      </form>
    </motion.div>
  );
}