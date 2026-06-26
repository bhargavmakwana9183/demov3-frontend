import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface IssuesPanelProps {
  issues: string[];
}

export const IssuesPanel = ({ issues }: IssuesPanelProps) => (
  <Card className="bg-card border-border">
    <CardHeader className="pb-3">
      <CardTitle className="text-base flex items-center gap-2">
        {issues.length > 0 ? (
          <AlertTriangle className="h-4 w-4 text-warning" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-success" />
        )}
        System Issues
      </CardTitle>
    </CardHeader>
    <CardContent>
      {issues.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No blocking issues detected.
        </p>
      ) : (
        <ul className="space-y-2">
          {issues.map((issue) => (
            <li
              key={issue}
              className="text-sm rounded-md border border-border px-3 py-2 bg-muted/30"
            >
              {issue}
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
);
