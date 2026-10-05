import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  text: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ text, className = '' }) => {
  const parts = useMemo(() => {
    if (!text) return [];

    // Parse $...$ or $$...$$ patterns
    const regex = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
    const result: { type: 'text' | 'inline-math' | 'block-math'; content: string }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        result.push({
          type: 'text',
          content: text.slice(lastIndex, match.index),
        });
      }

      if (match[1] !== undefined) {
        // Block math $$...$$
        result.push({
          type: 'block-math',
          content: match[1],
        });
      } else if (match[2] !== undefined) {
        // Inline math $...$
        result.push({
          type: 'inline-math',
          content: match[2],
        });
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      result.push({
        type: 'text',
        content: text.slice(lastIndex),
      });
    }

    return result;
  }, [text]);

  if (!text) return null;

  return (
    <span className={`inline-block ${className}`}>
      {parts.map((part, idx) => {
        if (part.type === 'text') {
          return <span key={idx}>{part.content}</span>;
        }

        try {
          const html = katex.renderToString(part.content, {
            displayMode: part.type === 'block-math',
            throwOnError: false,
            output: 'htmlAndMathml',
          });

          return (
            <span
              key={idx}
              dir="ltr"
              className="inline-block mx-1 font-mono select-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return (
            <span key={idx} dir="ltr" className="inline-block mx-1 font-mono text-amber-700">
              ${part.content}$
            </span>
          );
        }
      })}
    </span>
  );
};
