"use client";

import React, { useEffect, useState } from "react";

interface TypewriterPhrase {
  text: string;
  color: string;
  speed: number; // ms per character
}

interface TypewriterProps {
  staticText: string;
  phrases: TypewriterPhrase[];
  className?: string;
  loopDelay?: number; // ms delay before starting next loop
}

const TypewriterComponent: React.FC<TypewriterProps> = ({
  staticText,
  phrases,
  className = "",
  loopDelay = 1500,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [currentColor, setCurrentColor] = useState(phrases[0].color);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const currentPhrase = phrases[currentPhraseIndex];

    if (isTyping) {
      // Typing phase
      if (displayedText.length < currentPhrase.text.length) {
        timeout = setTimeout(() => {
          setDisplayedText(currentPhrase.text.slice(0, displayedText.length + 1));
          setCurrentColor(currentPhrase.color);
        }, currentPhrase.speed);
      } else {
        // Move to erasing phase after delay
        timeout = setTimeout(() => {
          setIsTyping(false);
        }, loopDelay);
      }
    } else {
      // Erasing phase
      if (displayedText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1));
        }, currentPhrase.speed / 2); // Erase twice as fast
      } else {
        // Move to next phrase and start typing
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        setIsTyping(true);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedText, currentPhraseIndex, isTyping, phrases, loopDelay]);

  return (
    <span className={className}>
      {staticText}
      <span style={{ color: currentColor }} className="transition-colors duration-150">
        {displayedText}
        <span className="animate-pulse">|</span>
      </span>
    </span>
  );
};

// Memoized so its per-keystroke state updates re-render in isolation rather than
// re-rendering the surrounding hero on every character.
export const Typewriter = React.memo(TypewriterComponent);
