import type { Widget } from './types';

export type IssueSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: IssueSeverity;
  widgetId?: string;
  widgetTitle: string;
  message: string;
}

const TYPE_LABEL: Record<Widget['type'], string> = {
  static_text: 'Text Box',
  input:       'User Input',
  llm:         'Text Generator',
  image:       'Image Generator',
  chat:        'Chat Box',
};

function widgetLabel(w: Widget): string {
  return w.title?.trim() || TYPE_LABEL[w.type];
}

function checkRefs(
  template: string,
  widget: Widget,
  widgetMap: Map<string, Widget>,
  issues: ValidationIssue[]
): void {
  const label   = widgetLabel(widget);
  const pattern = /\{\{([\w-]+)\.value\}\}/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(template)) !== null) {
    const refId  = match[1];
    const refWidget = widgetMap.get(refId);

    if (!refWidget) {
      issues.push({
        severity:    'error',
        widgetId:    widget.id,
        widgetTitle: label,
        message:     `"${label}" references a widget that no longer exists on the canvas.`,
      });
    } else if (refWidget.type !== 'input') {
      const refLabel = widgetLabel(refWidget);
      issues.push({
        severity:    'error',
        widgetId:    widget.id,
        widgetTitle: label,
        message:     `"${label}" references "${refLabel}", which is not a User Input widget.`,
      });
    }
  }
}

export function validateApp(widgets: Widget[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (widgets.length === 0) {
    issues.push({
      severity:    'error',
      widgetTitle: 'App',
      message:     'Add at least one widget to get started.',
    });
    return issues;
  }

  const widgetMap = new Map(widgets.map(w => [w.id, w]));

  for (const w of widgets) {
    const label = widgetLabel(w);

    if (!w.title?.trim()) {
      issues.push({
        severity:    'warning',
        widgetId:    w.id,
        widgetTitle: TYPE_LABEL[w.type],
        message:     `A ${TYPE_LABEL[w.type]} widget is missing a title.`,
      });
    }

    if (w.type === 'input' && !w.placeholder?.trim()) {
      issues.push({
        severity:    'warning',
        widgetId:    w.id,
        widgetTitle: label,
        message:     `"${label}" needs placeholder text so users know what to enter.`,
      });
    }

    if (w.type === 'llm') {
      if (!w.prompt?.trim()) {
        issues.push({
          severity:    'error',
          widgetId:    w.id,
          widgetTitle: label,
          message:     `"${label}" needs a prompt before it can generate text.`,
        });
      } else {
        checkRefs(w.prompt, w, widgetMap, issues);
      }
    }

    if (w.type === 'image') {
      if (!w.imagePrompt?.trim()) {
        issues.push({
          severity:    'error',
          widgetId:    w.id,
          widgetTitle: label,
          message:     `"${label}" needs an image prompt before it can generate images.`,
        });
      } else {
        checkRefs(w.imagePrompt, w, widgetMap, issues);
      }
    }

    if (w.type === 'chat' && !w.prompt?.trim()) {
      issues.push({
        severity:    'warning',
        widgetId:    w.id,
        widgetTitle: label,
        message:     `"${label}" has no initial prompt. Adding one helps keep the conversation on topic.`,
      });
    }
  }

  return issues;
}
