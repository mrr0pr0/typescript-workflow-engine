import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { 
  Zap, 
  GitBranch, 
  Wand2, 
  Send, 
  Database,
  Plus
} from 'lucide-react';
import type { NodeCategory } from '../types/core';
import { getCategoryColor } from '../utils/type-helpers';

interface NodePaletteProps {
  onNodeSelect: (nodeType: string) => void;
}

const nodeCategories: Array<{
  category: NodeCategory;
  icon: React.ReactNode;
  nodes: Array<{ type: string; label: string; description: string }>;
}> = [
  {
    category: 'trigger',
    icon: <Zap className="w-4 h-4" />,
    nodes: [
      { type: 'trigger.http', label: 'HTTP Trigger', description: 'Trigger on HTTP request' },
      { type: 'trigger.timer', label: 'Timer', description: 'Trigger on schedule' },
      { type: 'trigger.manual', label: 'Manual', description: 'Manual trigger' }
    ]
  },
  {
    category: 'logic',
    icon: <GitBranch className="w-4 h-4" />,
    nodes: [
      { type: 'logic.if', label: 'If Condition', description: 'Branch on condition' },
      { type: 'logic.switch', label: 'Switch', description: 'Multi-way branch' },
      { type: 'logic.compare', label: 'Compare', description: 'Compare values' }
    ]
  },
  {
    category: 'transform',
    icon: <Wand2 className="w-4 h-4" />,
    nodes: [
      { type: 'transform.map', label: 'Map', description: 'Transform array' },
      { type: 'transform.filter', label: 'Filter', description: 'Filter array' },
      { type: 'transform.reduce', label: 'Reduce', description: 'Reduce array' }
    ]
  },
  {
    category: 'effect',
    icon: <Send className="w-4 h-4" />,
    nodes: [
      { type: 'effect.http', label: 'HTTP Request', description: 'Make HTTP call' },
      { type: 'effect.email', label: 'Send Email', description: 'Send email' },
      { type: 'effect.db', label: 'Database', description: 'Write to database' }
    ]
  },
  {
    category: 'data',
    icon: <Database className="w-4 h-4" />,
    nodes: [
      { type: 'data.constant', label: 'Constant', description: 'Constant value' },
      { type: 'data.variable', label: 'Variable', description: 'Workflow variable' }
    ]
  }
];

export const NodePalette = ({ onNodeSelect }: NodePaletteProps) => {
  return (
    <Card className="w-80 h-full bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-100">Node Palette</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="space-y-4">
            {nodeCategories.map(({ category, icon, nodes }) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="p-1 rounded"
                    style={{ backgroundColor: getCategoryColor(category) }}
                  >
                    {icon}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 capitalize">
                    {category}
                  </h3>
                </div>
                <div className="space-y-1">
                  {nodes.map(node => (
                    <Button
                      key={node.type}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto py-2 px-3 hover:bg-slate-700"
                      onClick={() => onNodeSelect(node.type)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Plus className="w-3 h-3 text-slate-400" />
                          <span className="text-sm text-slate-200">{node.label}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {node.description}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};