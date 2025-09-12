"use client";

import * as React from "react";
import { Download, File, Image as ImageIcon, Video, Music, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Attachment } from "@/lib/types";

interface MessageAttachmentsProps {
  attachments: Attachment[];
}

function AttachmentIcon({ contentType }: { contentType: string }) {
  if (contentType.startsWith('image/')) {
    return <ImageIcon className="w-4 h-4" />;
  }
  if (contentType.startsWith('video/')) {
    return <Video className="w-4 h-4" />;
  }
  if (contentType.startsWith('audio/')) {
    return <Music className="w-4 h-4" />;
  }
  if (contentType.includes('text') || contentType.includes('document')) {
    return <FileText className="w-4 h-4" />;
  }
  return <File className="w-4 h-4" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function ImageAttachment({ attachment }: { attachment: Attachment }) {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  const maxWidth = Math.min(attachment.width || 400, 400);
  const maxHeight = Math.min(attachment.height || 300, 300);

  if (imageError) {
    return <FileAttachment attachment={attachment} />;
  }

  return (
    <div className="relative inline-block">
      <img
        src={attachment.proxyUrl || attachment.url}
        alt={attachment.description || attachment.filename}
        className={cn(
          "rounded-lg cursor-pointer transition-opacity hover:opacity-90",
          !imageLoaded && "opacity-0"
        )}
        style={{
          maxWidth: `${maxWidth}px`,
          maxHeight: `${maxHeight}px`,
          width: attachment.width ? `${Math.min(attachment.width, maxWidth)}px` : 'auto',
          height: attachment.height ? `${Math.min(attachment.height, maxHeight)}px` : 'auto',
        }}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        onClick={() => window.open(attachment.url, '_blank')}
      />
      
      {!imageLoaded && (
        <div
          className="bg-gray-800 rounded-lg flex items-center justify-center animate-pulse"
          style={{
            width: `${maxWidth}px`,
            height: `${maxHeight}px`,
          }}
        >
          <ImageIcon className="w-8 h-8 text-gray-500" />
        </div>
      )}
    </div>
  );
}

function VideoAttachment({ attachment }: { attachment: Attachment }) {
  const maxWidth = Math.min(attachment.width || 400, 400);
  const maxHeight = Math.min(attachment.height || 300, 300);

  return (
    <video
      controls
      className="rounded-lg"
      style={{
        maxWidth: `${maxWidth}px`,
        maxHeight: `${maxHeight}px`,
        width: attachment.width ? `${Math.min(attachment.width, maxWidth)}px` : 'auto',
        height: attachment.height ? `${Math.min(attachment.height, maxHeight)}px` : 'auto',
      }}
    >
      <source src={attachment.url} type={attachment.contentType} />
      Your browser does not support the video tag.
    </video>
  );
}

function AudioAttachment({ attachment }: { attachment: Attachment }) {
  return (
    <div className="bg-gray-800 rounded-lg p-3 max-w-md">
      <div className="flex items-center space-x-3 mb-2">
        <Music className="w-5 h-5 text-blue-400" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-200 truncate">
            {attachment.filename}
          </p>
          <p className="text-xs text-gray-400">
            {formatFileSize(attachment.size)}
          </p>
        </div>
      </div>
      
      <audio controls className="w-full">
        <source src={attachment.url} type={attachment.contentType} />
        Your browser does not support the audio tag.
      </audio>
    </div>
  );
}

function FileAttachment({ attachment }: { attachment: Attachment }) {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = attachment.url;
    a.download = attachment.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-3 max-w-md">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
          <AttachmentIcon contentType={attachment.contentType} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-200 truncate">
            {attachment.filename}
          </p>
          <p className="text-xs text-gray-400">
            {formatFileSize(attachment.size)}
          </p>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-700"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

export function MessageAttachments({ attachments }: MessageAttachmentsProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => {
        // Images
        if (attachment.contentType.startsWith('image/')) {
          return <ImageAttachment key={attachment.id} attachment={attachment} />;
        }
        
        // Videos  
        if (attachment.contentType.startsWith('video/')) {
          return <VideoAttachment key={attachment.id} attachment={attachment} />;
        }
        
        // Audio
        if (attachment.contentType.startsWith('audio/')) {
          return <AudioAttachment key={attachment.id} attachment={attachment} />;
        }
        
        // Other files
        return <FileAttachment key={attachment.id} attachment={attachment} />;
      })}
    </div>
  );
}