import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass-panel border-white/10">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold text-foreground">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-muted-foreground">
            The process you are looking for has been terminated or does not exist.
          </p>

          <div className="mt-6">
            <Link href="/" className="w-full">
                <Button className="w-full bg-primary hover:bg-primary/90">
                Return to Dashboard
                </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
