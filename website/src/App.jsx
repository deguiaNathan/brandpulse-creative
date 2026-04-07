import { useRef } from 'react';
import { legacyPayload } from './lib/legacyContent';
import { useBrandpulseEffects } from './hooks/useBrandpulseEffects';

export default function App() {
  const containerRef = useRef(null);

  useBrandpulseEffects(containerRef, legacyPayload.styleText, legacyPayload.title);

  return <div ref={containerRef} dangerouslySetInnerHTML={{ __html: legacyPayload.bodyHtml }} />;
}
