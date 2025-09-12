"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Embed } from "@/lib/types";

interface MessageEmbedsProps {
  embeds: Embed[];
}

function EmbedItem({ embed }: { embed: Embed }) {
  const hasContent = embed.title || embed.description || embed.fields.length > 0;
  const borderColor = embed.color ? `#${embed.color}` : '#5865f2';

  return (
    <div 
      className="bg-gray-800 border-l-4 rounded-r-lg p-4 max-w-lg"
      style={{ borderLeftColor: borderColor }}
    >
      {/* Author */}
      {embed.author && (
        <div className="flex items-center space-x-2 mb-2">
          {embed.author.iconUrl && (
            <img
              src={embed.author.iconUrl}
              alt=""
              className="w-5 h-5 rounded-full"
            />
          )}
          <span className="text-sm font-medium text-gray-200">
            {embed.author.url ? (
              <a 
                href={embed.author.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-blue-400"
              >
                {embed.author.name}
              </a>
            ) : (
              embed.author.name
            )}
          </span>
        </div>
      )}

      {/* Title */}
      {embed.title && (
        <div className="mb-2">
          {embed.url ? (
            <a
              href={embed.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline font-semibold flex items-center space-x-1"
            >
              <span>{embed.title}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <h3 className="font-semibold text-gray-200">{embed.title}</h3>
          )}
        </div>
      )}

      {/* Description */}
      {embed.description && (
        <div className="mb-3">
          <p className="text-sm text-gray-300 whitespace-pre-wrap">
            {embed.description}
          </p>
        </div>
      )}

      {/* Fields */}
      {embed.fields.length > 0 && (
        <div className="grid gap-3 mb-3">
          {embed.fields.map((field, index) => (
            <div
              key={index}
              className={cn(
                field.inline && embed.fields.filter(f => f.inline).length > 1
                  ? "inline-block w-1/2 pr-2"
                  : "block"
              )}
            >
              <div className="text-sm font-semibold text-gray-200 mb-1">
                {field.name}
              </div>
              <div className="text-sm text-gray-300 whitespace-pre-wrap">
                {field.value}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex space-x-4">
        {/* Thumbnail */}
        {embed.thumbnail && (
          <div className="flex-shrink-0">
            <img
              src={embed.thumbnail.proxyUrl || embed.thumbnail.url}
              alt=""
              className="rounded-lg"
              style={{
                maxWidth: '80px',
                maxHeight: '80px',
                width: embed.thumbnail.width ? `${Math.min(embed.thumbnail.width, 80)}px` : 'auto',
                height: embed.thumbnail.height ? `${Math.min(embed.thumbnail.height, 80)}px` : 'auto',
              }}
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Image */}
          {embed.image && (
            <div className="mb-3">
              <img
                src={embed.image.proxyUrl || embed.image.url}
                alt=""
                className="rounded-lg max-w-full"
                style={{
                  maxWidth: '400px',
                  maxHeight: '300px',
                  width: embed.image.width ? `${Math.min(embed.image.width, 400)}px` : 'auto',
                  height: embed.image.height ? `${Math.min(embed.image.height, 300)}px` : 'auto',
                }}
              />
            </div>
          )}

          {/* Footer */}
          {(embed.footer || embed.timestamp) && (
            <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
              {embed.footer && (
                <div className="flex items-center space-x-1">
                  {embed.footer.iconUrl && (
                    <img
                      src={embed.footer.iconUrl}
                      alt=""
                      className="w-4 h-4 rounded"
                    />
                  )}
                  <span>{embed.footer.text}</span>
                </div>
              )}
              
              {embed.timestamp && (
                <span>
                  {new Date(embed.timestamp).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MessageEmbeds({ embeds }: MessageEmbedsProps) {
  if (!embeds || embeds.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {embeds.map((embed) => (
        <EmbedItem key={embed.id} embed={embed} />
      ))}
    </div>
  );
}