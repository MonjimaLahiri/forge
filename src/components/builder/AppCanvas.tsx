'use client';

import { useState } from 'react';
import type { Widget } from '@/lib/types';
import PreviewWidget from './PreviewWidget';

interface AppCanvasProps {
  widgets: Widget[];
}

// Renders an app's widgets in run mode — no editing, no selection, just live
// widget behavior (Gemini-connected text generation, mocked image/chat).
// Shared by the builder's "Preview" mode and the public /app/[appId] route.
export default function AppCanvas({ widgets }: AppCanvasProps) {
  const [runtimeValues, setRuntimeValues] = useState<Record<string, string>>({});

  const widgetTitles: Record<string, string> = {};
  for (const w of widgets) widgetTitles[w.id] = w.title;

  if (widgets.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <p className="text-sm text-[#4b5563]">No widgets on the canvas yet.</p>
      </div>
    );
  }

  return (
    <div className="relative" style={{ minWidth: 1000, minHeight: 720 }}>
      {widgets.map(w => (
        <div
          key={w.id}
          className="absolute"
          style={{ left: w.x, top: w.y, width: w.w, minHeight: w.h }}
        >
          <PreviewWidget
            widget={w}
            runtimeValues={runtimeValues}
            widgetTitles={widgetTitles}
            onValueChange={(id, value) =>
              setRuntimeValues(prev => ({ ...prev, [id]: value }))
            }
          />
        </div>
      ))}
    </div>
  );
}
