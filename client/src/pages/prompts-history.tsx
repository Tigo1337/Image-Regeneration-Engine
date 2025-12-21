import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

type PromptLog = {
  id: number;
  jobType: string;
  prompt: string;
  timestamp: string;
  parameters: any;
};

export default function PromptsHistory() {
  const { toast } = useToast();
  const { data: logs, isLoading } = useQuery<PromptLog[]>({
    queryKey: ["/api/prompts-history"],
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Prompt History Log</h1>
        </div>

        {isLoading ? (
          <div>Loading logs...</div>
        ) : (
          <div className="grid gap-4">
            {logs?.map((log) => (
              <Card key={log.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge variant={log.jobType.includes('variation') ? "secondary" : "default"}>
                                {log.jobType.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                {new Date(log.timestamp).toLocaleString()}
                            </span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(log.prompt)}>
                            <Copy className="h-3 w-3 mr-2"/> Copy Prompt
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                  <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-muted/10 font-mono text-xs">
                    <pre className="whitespace-pre-wrap">{log.prompt}</pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}