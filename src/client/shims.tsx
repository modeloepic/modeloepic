// Sustitutos locales de los componentes del SDK de Muse (@hatch/space-sdk)
// que usaba el artefacto fullstack, para que la página funcione en hosting
// estático sin el runtime de Muse.

/**
 * En el artefacto, SafeAreaTopScrim pinta una franja superior con el color
 * del encabezado bajo el notch / área segura del móvil. Aquí basta una
 * franja con ese color y la altura del safe-area superior del dispositivo.
 */
export function SafeAreaTopScrim({
  backgroundColor,
}: {
  backgroundColor?: string;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        backgroundColor,
        height: "env(safe-area-inset-top, 0px)",
      }}
    />
  );
}
