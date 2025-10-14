"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export function StepContainer({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="rounded-lg border bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-900">{title}</CardTitle>
        {description ? <CardDescription className="text-gray-600">{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer ? <CardFooter className="flex items-center justify-between">{footer}</CardFooter> : null}
    </Card>
  );
}
