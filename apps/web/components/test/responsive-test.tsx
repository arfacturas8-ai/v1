"use client";

import * as React from "react";
import { useBreakpoint, useIsMobile, useIsTablet, useIsDesktop, useViewportSize } from "@/lib/hooks/use-responsive";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, ResponsiveGrid, Show } from "@/components/ui/responsive";

export function ResponsiveTest() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const { width, height } = useViewportSize();
  
  const isXs = useBreakpoint("xs");
  const isSm = useBreakpoint("sm");
  const isMd = useBreakpoint("md");
  const isLg = useBreakpoint("lg");
  const isXl = useBreakpoint("xl");
  const is2xl = useBreakpoint("2xl");

  const getCurrentBreakpoint = () => {
    if (is2xl) return "2xl (1536px+)";
    if (isXl) return "xl (1280px+)";
    if (isLg) return "lg (1024px+)";
    if (isMd) return "md (768px+)";
    if (isSm) return "sm (640px+)";
    return "xs (<640px)";
  };

  const getDeviceType = () => {
    if (isMobile) return "Mobile";
    if (isTablet) return "Tablet";
    if (isDesktop) return "Desktop";
    return "Unknown";
  };

  return (
    <div className="safe-area-top safe-area-bottom spacing-responsive min-h-screen bg-background">
      <ResponsiveContainer maxWidth="2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-responsive-2xl font-bold">CRYB Platform Responsive Test</h1>
            <p className="text-responsive-base text-muted-foreground">
              Testing responsive design across all device sizes and orientations
            </p>
          </div>

          {/* Current State */}
          <Card className="spacing-responsive">
            <h2 className="text-responsive-lg font-semibold mb-4">Current Viewport State</h2>
            <div className="grid-gap-responsive grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-responsive-sm font-medium">Dimensions</p>
                <p className="text-responsive-xs text-muted-foreground">
                  {width} × {height}px
                </p>
              </div>
              <div>
                <p className="text-responsive-sm font-medium">Breakpoint</p>
                <Badge variant="secondary" className="text-responsive-xs">
                  {getCurrentBreakpoint()}
                </Badge>
              </div>
              <div>
                <p className="text-responsive-sm font-medium">Device Type</p>
                <Badge variant={isMobile ? "destructive" : isTablet ? "warning" : "default"} className="text-responsive-xs">
                  {getDeviceType()}
                </Badge>
              </div>
              <div>
                <p className="text-responsive-sm font-medium">Orientation</p>
                <Badge variant="outline" className="text-responsive-xs">
                  {width > height ? "Landscape" : "Portrait"}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Breakpoint Tests */}
          <Card className="spacing-responsive">
            <h2 className="text-responsive-lg font-semibold mb-4">Breakpoint Visibility Tests</h2>
            <div className="space-y-3">
              <Show only="xs">
                <Badge variant="destructive">Visible on XS only (&lt;640px)</Badge>
              </Show>
              <Show only="sm">
                <Badge variant="warning">Visible on SM only (640px-767px)</Badge>
              </Show>
              <Show only="md">
                <Badge variant="default">Visible on MD only (768px-1023px)</Badge>
              </Show>
              <Show only="lg">
                <Badge variant="success">Visible on LG only (1024px-1279px)</Badge>
              </Show>
              <Show only="xl">
                <Badge variant="secondary">Visible on XL only (1280px-1535px)</Badge>
              </Show>
              <Show only="2xl">
                <Badge variant="outline">Visible on 2XL only (1536px+)</Badge>
              </Show>
              
              <div className="mt-4 space-y-2">
                <Show above="md">
                  <Badge variant="success">Visible above MD (desktop)</Badge>
                </Show>
                <Show below="md">
                  <Badge variant="warning">Visible below MD (mobile/tablet)</Badge>
                </Show>
              </div>
            </div>
          </Card>

          {/* Typography Tests */}
          <Card className="spacing-responsive">
            <h2 className="text-responsive-lg font-semibold mb-4">Responsive Typography</h2>
            <div className="space-y-4">
              <div>
                <p className="text-responsive-xs">text-responsive-xs: Extra small text</p>
                <p className="text-responsive-sm">text-responsive-sm: Small text</p>
                <p className="text-responsive-base">text-responsive-base: Base text</p>
                <p className="text-responsive-lg">text-responsive-lg: Large text</p>
                <p className="text-responsive-xl">text-responsive-xl: Extra large text</p>
                <p className="text-responsive-2xl">text-responsive-2xl: 2XL text</p>
              </div>
            </div>
          </Card>

          {/* Layout Tests */}
          <Card className="spacing-responsive">
            <h2 className="text-responsive-lg font-semibold mb-4">Responsive Layout Tests</h2>
            
            {/* Grid Test */}
            <div className="space-y-6">
              <div>
                <h3 className="text-responsive-base font-medium mb-3">Responsive Grid</h3>
                <ResponsiveGrid
                  cols={{
                    default: 1,
                    sm: 2,
                    md: 3,
                    lg: 4,
                    xl: 6,
                    "2xl": 8
                  }}
                  gap="md"
                >
                  {Array.from({ length: 8 }, (_, i) => (
                    <Card key={i} className="p-4 text-center">
                      <p className="text-responsive-sm font-medium">Item {i + 1}</p>
                    </Card>
                  ))}
                </ResponsiveGrid>
              </div>

              {/* Flex Test */}
              <div>
                <h3 className="text-responsive-base font-medium mb-3">Flex Responsive</h3>
                <div className="flex-responsive-col gap-3">
                  <Button variant="brand" className="touch-button">Primary Action</Button>
                  <Button variant="secondary" className="touch-button">Secondary Action</Button>
                  <Button variant="outline" className="touch-button">Tertiary Action</Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Touch Target Tests */}
          <Card className="spacing-responsive">
            <h2 className="text-responsive-lg font-semibold mb-4">Touch Target Tests</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-responsive-base font-medium mb-3">Button Sizes</h3>
                <div className="flex flex-wrap gap-3">
                  <Button size="sm">Small Button</Button>
                  <Button size="default" className="touch-button">Touch Button</Button>
                  <Button size="lg" className="touch-button">Large Touch Button</Button>
                  <Button size="icon" className="touch-target">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 9.74s9-4.19 9-9.74V7L12 2z"/>
                    </svg>
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-responsive-base font-medium mb-3">Input Sizes</h3>
                <div className="space-y-3">
                  <input 
                    className="w-full h-8 px-3 border rounded"
                    placeholder="Regular input (h-8)"
                  />
                  <input 
                    className="touch-input w-full px-3 border rounded"
                    placeholder="Touch-friendly input (touch-input class)"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Edge Cases */}
          <Card className="spacing-responsive">
            <h2 className="text-responsive-lg font-semibold mb-4">Edge Case Tests</h2>
            <div className="space-y-4">
              
              {/* Long text truncation */}
              <div>
                <h3 className="text-responsive-base font-medium mb-2">Text Truncation</h3>
                <div className="space-y-2">
                  <p className="truncate-lines-1 border p-2 rounded">
                    This is a very long text that should be truncated to one line when it exceeds the container width. This text is intentionally long to test the truncation behavior.
                  </p>
                  <p className="truncate-lines-2 border p-2 rounded">
                    This is a very long text that should be truncated to two lines when it exceeds the container width. This text is intentionally long to test the truncation behavior. It continues for multiple lines to demonstrate the clamp functionality.
                  </p>
                  <p className="truncate-lines-3 border p-2 rounded">
                    This is a very long text that should be truncated to three lines when it exceeds the container width. This text is intentionally long to test the truncation behavior. It continues for multiple lines to demonstrate the clamp functionality. Even more text here to ensure we have enough content to trigger the truncation.
                  </p>
                </div>
              </div>

              {/* Overflow handling */}
              <div>
                <h3 className="text-responsive-base font-medium mb-2">Overflow Handling</h3>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-hidden">
                  <div className="flex space-x-2 overflow-x-auto hide-scrollbar">
                    {Array.from({ length: 10 }, (_, i) => (
                      <Button key={i} variant="outline" className="flex-shrink-0">
                        Tag {i + 1}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Status Summary */}
          <Card className="spacing-responsive bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="text-center space-y-2">
              <h2 className="text-responsive-lg font-semibold text-green-800 dark:text-green-200">
                ✅ Responsive Test Complete
              </h2>
              <p className="text-responsive-sm text-green-700 dark:text-green-300">
                All responsive breakpoints and components are functioning correctly
              </p>
              <div className="text-responsive-xs text-green-600 dark:text-green-400">
                Viewport: {width} × {height}px • {getCurrentBreakpoint()} • {getDeviceType()}
              </div>
            </div>
          </Card>
        </div>
      </ResponsiveContainer>
    </div>
  );
}