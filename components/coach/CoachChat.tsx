"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function CoachChat() {
  return (
    <Card className="flex h-[70vh] min-h-[420px] flex-col rounded-lg border bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-900">Coach Workspace</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div className="h-full w-full grid place-items-center text-center text-sm text-gray-600">
          <div>
            <p className="mb-2">Start a conversation with your coach.</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1">“Help me prepare for an interview.”</span>
              <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1">“Review this resume bullet.”</span>
              <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1">“Give me career growth advice.”</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center gap-2">
        <Textarea placeholder="Type your message..." className="min-h-[44px]" disabled />
        <Button disabled>Send</Button>
      </CardFooter>
    </Card>
  );
}
