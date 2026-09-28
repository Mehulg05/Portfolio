/*
  Ink, defined once for the page: an SVG filter anything can reference by id.

  #ink-stamp is rubber-stamp ink. Noise roughens the edges a little and thins the
  coverage in patches, so a stamped label never prints as a clean vector box.

  The SVG takes no space; it only has to be in the document for the filter to resolve.
*/
export function InkDefs() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" className="absolute">
      <defs>
        <filter id="ink-stamp" x="-8%" y="-20%" width="116%" height="140%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="11" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feColorMatrix
            in="grain"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -0.55"
            result="coverage"
          />
          <feComposite in="rough" in2="coverage" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}
