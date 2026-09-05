"use client";

import { useEffect, useRef } from "react";
import { processStages } from "@/lib/content/process";
import { observeScrollProgress } from "@/lib/motion/scroll-progress";
import { useMotionEnabled } from "@/lib/motion/use-motion-enabled";

const NODE_W = 98;
const NODE_H = 50;
const PITCH = 120;
const START_X = 12;
const NODE_Y = 28;
const WIRE_Y = NODE_Y + NODE_H / 2;

const nodeX = (index: number) => START_X + index * PITCH;
const firstCenter = nodeX(0) + NODE_W / 2;
const lastCenter = nodeX(processStages.length - 1) + NODE_W / 2;

const returnPath = `M ${lastCenter} ${NODE_Y + NODE_H} V 118 Q ${lastCenter} 132 ${lastCenter - 14} 132 H ${firstCenter + 14} Q ${firstCenter} 132 ${firstCenter} 118 V ${NODE_Y + NODE_H}`;

function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export function BuildDiagram() {
  const enabled = useMotionEnabled();
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Array<SVGGElement | null>>([]);
  const wiresRef = useRef<Array<SVGPathElement | null>>([]);
  const loopRef = useRef<SVGPathElement>(null);
  const cellsRef = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;

    const count = processStages.length;

    const apply = (progress: number) => {
      const reached = progress * count;

      nodesRef.current.forEach((node, index) => {
        node?.classList.toggle("is-pending", reached < index + 0.35);
      });

      cellsRef.current.forEach((cell, index) => {
        cell?.classList.toggle("is-pending", reached < index + 0.35);
      });

      wiresRef.current.forEach((wire, index) => {
        if (!wire) return;
        const drawn = clamp01((reached - (index + 0.5)) / 0.5);
        wire.style.strokeDashoffset = String(1 - drawn);
      });

      if (loopRef.current) {
        const drawn = clamp01((reached - (count - 0.5)) / 0.5);
        loopRef.current.style.strokeDashoffset = String(1 - drawn);
      }
    };

    return observeScrollProgress(container, apply);
  }, [enabled]);

  return (
    <div ref={containerRef} className={enabled ? "mt-14 h-[210vh]" : "mt-14"}>
      <div className={enabled ? "sticky top-28" : undefined}>
        {/* The schematic. Hidden on small screens, where the list below carries it. */}
        <div className="build-diagram hidden overflow-x-auto md:block">
          <svg
            viewBox="0 0 964 160"
            className="h-auto w-full min-w-[720px]"
            role="img"
            aria-label="An eight stage build pipeline from idea through iteration, looping back to the start."
          >
            {processStages.slice(0, -1).map((stage, index) => (
              <path
                key={`wire-${stage.index}`}
                ref={(node) => {
                  wiresRef.current[index] = node;
                }}
                className="stage-wire"
                d={`M ${nodeX(index) + NODE_W} ${WIRE_Y} L ${nodeX(index + 1)} ${WIRE_Y}`}
                pathLength={1}
                strokeDasharray={1}
              />
            ))}

            <path
              ref={loopRef}
              className="stage-wire stage-loop"
              d={returnPath}
              pathLength={1}
              strokeDasharray={1}
              fill="none"
            />

            <text x={482} y={150} className="stage-loop-label" textAnchor="middle">
              iterate
            </text>

            {processStages.map((stage, index) => (
              <g
                key={stage.index}
                ref={(node) => {
                  nodesRef.current[index] = node;
                }}
                className="stage-node"
              >
                <rect x={nodeX(index)} y={NODE_Y} width={NODE_W} height={NODE_H} rx={2} />
                <text x={nodeX(index) + 11} y={NODE_Y + 21} className="stage-num">
                  {stage.index}
                </text>
                <text x={nodeX(index) + 11} y={NODE_Y + 39} className="stage-name">
                  {stage.name}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <ol className="mt-8 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {processStages.map((stage, index) => (
            <li
              key={stage.index}
              ref={(node) => {
                cellsRef.current[index] = node;
              }}
              className="stage-cell flex flex-col gap-3 bg-ground p-5 sm:p-6"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] text-accent">{stage.index}</span>
                <h3 className="font-display text-lg tracking-tight text-ink">
                  {stage.name}
                </h3>
              </div>
              <p className="text-[14px] leading-relaxed text-ink-dim">{stage.stance}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
