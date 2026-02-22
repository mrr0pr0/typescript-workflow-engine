/**
 * Real-time Type Checking Hook
 */

import { useEffect, useState } from "react";
import type { WorkflowGraph } from "../types/core";
import { checkPortCompatibility } from "../types/compatibility";

export const useTypeChecker = (graph: WorkflowGraph) => {
  const [edgeValidation, setEdgeValidation] = useState<Map<string, boolean>>(
    new Map(),
  );

  useEffect(() => {
    const validation = new Map<string, boolean>();

    for (const edge of graph.edges) {
      const sourceNode = graph.nodes.find((n) => n.id === edge.source);
      const targetNode = graph.nodes.find((n) => n.id === edge.target);

      if (!sourceNode || !targetNode) {
        validation.set(edge.id, false);
        continue;
      }

      const sourcePort = sourceNode.outputs.find(
        (p) => p.id === edge.sourcePort,
      );
      const targetPort = targetNode.inputs.find(
        (p) => p.id === edge.targetPort,
      );

      if (!sourcePort || !targetPort) {
        validation.set(edge.id, false);
        continue;
      }

      const compatibility = checkPortCompatibility(
        sourcePort.portType,
        targetPort.portType,
      );
      validation.set(edge.id, compatibility.valid);
    }

    setEdgeValidation(validation);
  }, [graph]);

  return { edgeValidation };
};
