"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import type { GaitParams } from "@/lib/types"
import "katex/dist/katex.min.css"
import { InlineMath, BlockMath } from "react-katex"

interface Props {
  params: GaitParams
}

function EqBlock({ tex }: { tex: string }) {
  return (
    <div className="text-sm py-1 overflow-x-auto min-w-0">
      <BlockMath math={tex} />
    </div>
  )
}

export function EquationsPanel({ params }: Props) {
  const { zc, g, tSup } = params
  const Tc = Math.sqrt(zc / g)
  const C = Math.cosh(tSup / Tc)
  const S = Math.sinh(tSup / Tc)

  return (
    <div className="p-3">
      <p className="text-sm font-semibold mb-3">Key Equations</p>

      <Accordion multiple defaultValue={["dynamics", "solution", "orbital", "algorithm"]}>

        <AccordionItem value="dynamics">
          <AccordionTrigger className="text-xs font-medium">
            LIPM Dynamics
          </AccordionTrigger>
          <AccordionContent className="space-y-1">
            <EqBlock tex={String.raw`\ddot{x} = \frac{g}{z_c}\, x \qquad \ddot{y} = \frac{g}{z_c}\, y`} />
            <p className="text-[10px] text-muted-foreground">
              Mass travels on a horizontal plane at constant height <InlineMath math="z_c" />.
              Kick force <InlineMath math="f = Mgr/z_c" /> counteracts gravity.
            </p>
            <div className="text-[10px] font-mono bg-muted/50 rounded px-2 py-1 space-y-0.5">
              <div>z_c = {zc.toFixed(2)} m</div>
              <div>g = {g.toFixed(2)} m/s²</div>
              <div>g/z_c = {(g / zc).toFixed(3)} s⁻²</div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="solution">
          <AccordionTrigger className="text-xs font-medium">
            Analytical Solution
          </AccordionTrigger>
          <AccordionContent className="space-y-1">
            <EqBlock tex={String.raw`T_c \equiv \sqrt{\frac{z_c}{g}}`} />
            <EqBlock tex={String.raw`x(t) = x_0\cosh\!\frac{t}{T_c} + T_c\dot{x}_0\sinh\!\frac{t}{T_c}`} />
            <EqBlock tex={String.raw`\dot{x}(t) = \frac{x_0}{T_c}\sinh\!\frac{t}{T_c} + \dot{x}_0\cosh\!\frac{t}{T_c}`} />
            <div className="text-[10px] font-mono bg-muted/50 rounded px-2 py-1 space-y-0.5">
              <div>T_c = {Tc.toFixed(4)} s</div>
              <div>C = cosh(T_sup/T_c) = {C.toFixed(4)}</div>
              <div>S = sinh(T_sup/T_c) = {S.toFixed(4)}</div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="orbital">
          <AccordionTrigger className="text-xs font-medium">
            Orbital Energy
          </AccordionTrigger>
          <AccordionContent className="space-y-1">
            <EqBlock tex={String.raw`E = \tfrac{1}{2}\dot{x}^2 - \frac{g}{2z_c}x^2 = \text{const}`} />
            <p className="text-[10px] text-muted-foreground">
              Conserved during single support. <InlineMath math="E > 0" />: continuous motion.{" "}
              <InlineMath math="E \leq 0" />: reversal.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="algorithm">
          <AccordionTrigger className="text-xs font-medium">
            Algorithm Equations
          </AccordionTrigger>
          <AccordionContent className="space-y-2">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-[9px] shrink-0 mt-0.5">*1</Badge>
              <div className="text-[10px] space-y-0.5 min-w-0 flex-1">
                <EqBlock tex={String.raw`p_x^{(n)} = p_x^{(n-1)} + s_x^{(n)}`} />
                <EqBlock tex={String.raw`p_y^{(n)} = p_y^{(n-1)} - (-1)^n s_y^{(n)}`} />
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-[9px] shrink-0 mt-0.5">*2/*3</Badge>
              <div className="text-[10px] min-w-0 flex-1">
                <EqBlock tex={String.raw`\bar{x}^{(n)} = s_x^{(n+1)}/2,\quad \bar{v}_x^{(n)} = \bar{x}\tfrac{C+1}{T_c S}`} />
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-[9px] shrink-0 mt-0.5">*4</Badge>
              <div className="text-[10px] min-w-0 flex-1">
                <EqBlock tex={String.raw`\ddot{x} = \frac{g}{z_c}(x - p_x^*)`} />
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-[9px] shrink-0 mt-0.5">*5</Badge>
              <div className="text-[10px] min-w-0 flex-1">
                <EqBlock tex={String.raw`x^d = p_x^{(n)} + \bar{x}^{(n)},\quad \dot{x}^d = \bar{v}_x^{(n)}`} />
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-[9px] shrink-0 mt-0.5">*6</Badge>
              <div className="text-[10px] min-w-0 flex-1">
                <EqBlock tex={String.raw`N \equiv a(x^d - x_f)^2 + b(\dot{x}^d - \dot{x}_f)^2`} />
                <p className="text-muted-foreground mt-1">Minimized analytically to find <InlineMath math="p_x^*" />.</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  )
}
