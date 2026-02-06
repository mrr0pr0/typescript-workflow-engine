import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { WorkflowNode } from '../types/core';
import { getPortTypeColor, getPortTypeLabel, getCategoryColor } from '../utils/type-helpers';
import { Badge } from './ui/badge';
import { Card } from './ui/card';

export const NodeRenderer = memo(({ data }: NodeProps<WorkflowNode>) => {
  const node = data;
  const categoryColor = getCategoryColor(node.category);

  return (
    <Card className="min-w-[200px] bg-slate-800 border-slate-700 shadow-lg">
      <div
        className="px-3 py-2 rounded-t-lg font-semibold text-sm text-white"
        style={{ backgroundColor: categoryColor }}
      >
        {node.label}
      </div>

      <div className="p-3 space-y-3">
        {/* Input Ports */}
        {node.inputs.length > 0 && (
          <div className="space-y-2">
            {node.inputs.map((input, idx) => (
              <div key={input.id} className="relative">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={input.id}
                  style={{
                    background: getPortTypeColor(input.portType),
                    width: 12,
                    height: 12,
                    border: '2px solid #1E293B',
                    top: `${((idx + 1) * 100) / (node.inputs.length + 1)}%`
                  }}
                />
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-300">{input.name}</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1 py-0"
                    style={{
                      borderColor: getPortTypeColor(input.portType),
                      color: getPortTypeColor(input.portType)
                    }}
                  >
                    {getPortTypeLabel(input.portType)}
                  </Badge>
                  {input.required && (
                    <span className="text-red-400 text-[10px]">*</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Output Ports */}
        {node.outputs.length > 0 && (
          <div className="space-y-2">
            {node.outputs.map((output, idx) => (
              <div key={output.id} className="relative text-right">
                <Handle
                  type="source"
                  position={Position.Right}
                  id={output.id}
                  style={{
                    background: getPortTypeColor(output.portType),
                    width: 12,
                    height: 12,
                    border: '2px solid #1E293B',
                    top: `${((idx + 1) * 100) / (node.outputs.length + 1)}%`
                  }}
                />
                <div className="flex items-center justify-end gap-2 text-xs">
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1 py-0"
                    style={{
                      borderColor: getPortTypeColor(output.portType),
                      color: getPortTypeColor(output.portType)
                    }}
                  >
                    {getPortTypeLabel(output.portType)}
                  </Badge>
                  <span className="text-slate-300">{output.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Node Description */}
        {node.description && (
          <p className="text-[10px] text-slate-400 mt-2 italic">
            {node.description}
          </p>
        )}
      </div>
    </Card>
  );
});

NodeRenderer.displayName = 'NodeRenderer';