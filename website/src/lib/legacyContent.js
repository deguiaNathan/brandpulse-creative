import legacyDocument from '../legacy/brandpulse.html?raw';

const REDUCED_MOTION_TOKEN = '@media (prefers-reduced-motion: reduce)';

function extractBodyHtml(documentHtml) {
  const match = documentHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!match) {
    return '';
  }

  return match[1].replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').trim();
}

function extractStyleText(documentHtml) {
  return Array.from(documentHtml.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi), (match) => match[1]).join('\n');
}

function stripReducedMotionBlock(styleText) {
  const start = styleText.indexOf(REDUCED_MOTION_TOKEN);
  if (start === -1) {
    return styleText;
  }

  const blockStart = styleText.indexOf('{', start);
  if (blockStart === -1) {
    return styleText;
  }

  let depth = 0;

  for (let index = blockStart; index < styleText.length; index += 1) {
    const char = styleText[index];

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;

      if (depth === 0) {
        return `${styleText.slice(0, start)}\n${styleText.slice(index + 1)}`.trim();
      }
    }
  }

  return styleText;
}

export const legacyPayload = {
  bodyHtml: extractBodyHtml(legacyDocument),
  styleText: stripReducedMotionBlock(extractStyleText(legacyDocument)),
  title: 'BrandPulse - A Better Website for Your Business',
};
