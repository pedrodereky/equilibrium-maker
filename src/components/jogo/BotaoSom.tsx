/** Liga e desliga os efeitos sonoros. Atalho de teclado: M. */

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { alternarSom, somEstaLigado, tocar } from "@/lib/som";

export function BotaoSom() {
  // A preferência vive no localStorage: só dá para lê-la depois da hidratação.
  const [ligado, setLigado] = useState(true);
  useEffect(() => setLigado(somEstaLigado()), []);

  function alternar() {
    const agora = alternarSom();
    setLigado(agora);
    // Confirma por ouvido que o som voltou.
    if (agora) tocar("revelar");
  }

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key !== "m" && evento.key !== "M") return;
      evento.preventDefault();
      alternar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={alternar}
      className="gap-1.5"
      aria-pressed={ligado}
      title={`${ligado ? "Desligar" : "Ligar"} os efeitos sonoros (M)`}
    >
      {ligado ? (
        <Volume2 className="size-4" aria-hidden />
      ) : (
        <VolumeX className="size-4" aria-hidden />
      )}
      {ligado ? "Som ligado" : "Som desligado"}
    </Button>
  );
}
