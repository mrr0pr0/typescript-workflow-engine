import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { WorkflowGraph } from "../types/core";
import type { InferredType } from "../engine/type-inference";
import { getPortTypeColor, getPortTypeLabel } from "../utils/type-helpers";

interface TypeInspectorProps {
  graph: WorkflowGraph;
  validationErrors: string[];
  inferredTypes: Map<string, InferredType>;
}

const TS_FEATURES = [
  "Discriminated Unions",
  "Generics",
  "Conditional Types",
  "Mapped Types",
  "Recursive Types",
  "Type Guards",
  "Branded Types",
  "Module Augmentation",
  "Template Literals",
  "Phantom Types",
];

// --- Leaf components first ---

interface StatCellProps {
  label: string;
  value: number;
  valueClassName?: string;
}

const StatCell = ({ label, value, valueClassName = "text-slate-100" }: StatCellProps) => (
  <div className="bg-slate-700 p-2 rounded">
    <div className="text-slate-400">{label}</div>
    <div className={`text-lg font-bold ${valueClassName}`}>{value}</div>
  </div>
);

interface InferredTypeEntryProps {
  entryKey: string;
  type: InferredType;
}

const InferredTypeEntry = ({ entryKey, type }: InferredTypeEntryProps) => (
  <div className="bg-slate-700 p-2 rounded text-xs space-y-1">
    <div className="font-mono text-slate-300">{entryKey}</div>
    <Badge
      variant="outline"
      className="text-[10px]"
      style={{
        borderColor: getPortTypeColor(type.portType),
        color: getPortTypeColor(type.portType),
      }}
    >
      {getPortTypeLabel(type.portType)}
    </Badge>
    {type.inferredFrom && (
      <div className="text-slate-400 text-[10px]">
        ← from {type.inferredFrom.nodeId}:{type.inferredFrom.portId}
      </div>
    )}
  </div>
);

// --- Composite components (depend on leaves above) ---

interface GraphStatsProps {
  nodeCount: number;
  edgeCount: number;
  typeCount: number;
  errorCount: number;
}

const GraphStats = ({ nodeCount, edgeCount, typeCount, errorCount }: GraphStatsProps) => (
  <div className="space-y-2">
    <h3 className="text-sm font-semibold text-slate-200">Graph Statistics</h3>
    <div className="grid grid-cols-2 gap-2 text-xs">
      <StatCell label="Nodes" value={nodeCount} />
      <StatCell label="Edges" value={edgeCount} />
      <StatCell label="Inferred Types" value={typeCount} />
      <StatCell label="Errors" value={errorCount} valueClassName="text-red-400" />
    </div>
  </div>
);

interface ValidationErrorsProps {
  errors: string[];
}

const ValidationErrors = ({ errors }: ValidationErrorsProps) => (
  <div className="space-y-2">
    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
      <AlertCircle className="w-4 h-4 text-red-500" />
      Validation Errors
    </h3>
    {errors.map((error) => (
      <Alert key={error} className="bg-red-950 border-red-800">
        <AlertDescription className="text-xs text-red-200">{error}</AlertDescription>
      </Alert>
    ))}
  </div>
);

interface InferredTypesListProps {
  inferredTypes: Map<string, InferredType>;
}

const InferredTypesList = ({ inferredTypes }: InferredTypesListProps) => (
  <div className="space-y-2">
    <h3 className="text-sm font-semibold text-slate-200">Inferred Types</h3>
    <div className="space-y-2">
      {Array.from(inferredTypes.entries()).map(([key, type]) => (
        <InferredTypeEntry key={key} entryKey={key} type={type} />
      ))}
    </div>
  </div>
);

const TsFeaturesBadges = () => (
  <div className="space-y-2">
    <h3 className="text-sm font-semibold text-slate-200">TS Features Used</h3>
    <div className="flex flex-wrap gap-1">
      {TS_FEATURES.map((feature) => (
        <Badge key={feature} variant="secondary" className="text-[10px] bg-blue-950 text-blue-200">
          {feature}
        </Badge>
      ))}
    </div>
  </div>
);

// --- Root export (depends on all composites above) ---

export const TypeInspector = ({ graph, validationErrors, inferredTypes }: TypeInspectorProps) => {
  const hasErrors = validationErrors.length > 0;
  const typeCount = inferredTypes.size;

  return (
    <Card className="w-96 h-full bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
          Type Inspector
          {hasErrors
            ? <XCircle className="w-5 h-5 text-red-500" />
            : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="space-y-4">
            <GraphStats
              nodeCount={graph.nodes.length}
              edgeCount={graph.edges.length}
              typeCount={typeCount}
              errorCount={validationErrors.length}
            />
            {hasErrors && <ValidationErrors errors={validationErrors} />}
            {typeCount > 0 && <InferredTypesList inferredTypes={inferredTypes} />}
            <TsFeaturesBadges />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};