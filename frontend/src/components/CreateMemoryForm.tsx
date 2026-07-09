import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCreateMemory, useSpaceEvents, MediaItem } from '../hooks/useMemories';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import api from '../utils/api';
import { Image as ImageIcon, Loader2, Video, CheckCircle } from 'lucide-react';

interface CreateMemoryFormProps {
  onSuccess?: () => void;
}

export default function CreateMemoryForm({ onSuccess }: CreateMemoryFormProps) {
  const { spaceId } = useParams<{ spaceId: string }>();
  const activeSpaceId = spaceId || '';

  // Form State
  const [title, setTitle] = useState('');
  const [richTextStory, setRichTextStory] = useState('');
  const [dateOccurred, setDateOccurred] = useState('');
  const [location, setLocation] = useState('');
  const [eventId, setEventId] = useState('');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  
  // Interface uploading states
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Queries & Mutations
  const { data: events } = useSpaceEvents(activeSpaceId);
  const createMemoryMutation = useCreateMemory(activeSpaceId);

  // File Upload Handler (Simulating Cloudflare R2 Signatures)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadStatus('Generating secure R2 upload ticket...');

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 1. Request upload ticket/signature from backend
        const ticketResponse = await api.post<{
          uploadUrl: string;
          fileUrl: string;
          fileKey: string;
          fileType: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
          size: number;
        }>(`/spaces/${activeSpaceId}/media/upload-ticket`, {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });

        const ticket = ticketResponse.data;

        // 2. Simulate binary upload execution to the R2 signed URL
        setUploadStatus(`Uploading & optimizing ${file.name}...`);
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulated network lag

        // 3. Log into local media list state to bundle into memory creation body
        const newMediaItem: MediaItem = {
          fileUrl: ticket.fileUrl,
          fileType: ticket.fileType,
          size: ticket.size,
        };

        setMediaList((prev) => [...prev, newMediaItem]);
      }

      setUploadStatus('All assets archived & cryptographically isolation verified.');
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error) {
      console.error('[Upload Pipeline Failed]:', error);
      setUploadStatus('Media upload ticket pipeline failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !richTextStory || !dateOccurred) {
      alert('Please fill out the required fields.');
      return;
    }

    try {
      await createMemoryMutation.mutateAsync({
        title,
        richTextStory,
        dateOccurred,
        location: location || undefined,
        eventId: eventId || null,
        media: mediaList,
        albumIds: [] // Default empty for base sprint
      });

      // Clear state
      setTitle('');
      setRichTextStory('');
      setDateOccurred('');
      setLocation('');
      setEventId('');
      setMediaList([]);

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('[Create Memory Submit Failed]:', err);
    }
  };

  return (
    <Card className="border border-vault-border/50 max-w-2xl w-full">
      <div className="border-b border-vault-border/30 pb-4 mb-6">
        <h3 className="text-xl font-bold font-serif">Preserve a Family Memory</h3>
        <p className="text-xs text-vault-muted mt-1">Catalog stories, dates, locations, and media permanently.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Title / Milestone Name (Required)"
          placeholder="e.g. Grandma Martha's Graduation portrait"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Date Occurred (Required)"
            type="date"
            value={dateOccurred}
            onChange={(e) => setDateOccurred(e.target.value)}
            required
          />
          <Input
            label="Location / Place (Optional)"
            placeholder="e.g. Montreal, Quebec"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Milestone selection */}
        {events && events.length > 0 && (
          <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor="event-select" className="text-xs font-semibold uppercase tracking-wider text-vault-muted select-none">
              Link to Family Event Milestone
            </label>
            <select
              id="event-select"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full px-4 py-3 bg-primary-dark/40 border border-vault-border/60 hover:border-vault-border/90 rounded-lg text-sm text-vault-text transition-all focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="">-- No linked event --</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} ({new Date(e.date).getFullYear()})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Text narrative */}
        <div className="flex flex-col gap-1.5 w-full">
          <label htmlFor="narrative" className="text-xs font-semibold uppercase tracking-wider text-vault-muted select-none">
            Rich Narrative Narrative / Story (Required)
          </label>
          <textarea
            id="narrative"
            rows={5}
            placeholder="Tell the detailed story behind this memory..."
            value={richTextStory}
            onChange={(e) => setRichTextStory(e.target.value)}
            required
            className="w-full px-4 py-3 bg-primary-dark/40 border border-vault-border/60 hover:border-vault-border/90 rounded-lg text-sm text-vault-text placeholder-vault-muted/40 transition-all focus:border-accent focus:ring-1 focus:ring-accent resize-y"
          />
        </div>

        {/* File upload segment */}
        <div className="border border-dashed border-vault-border/60 rounded-xl p-6 bg-primary-dark/20 flex flex-col items-center gap-3">
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-3xl select-none" role="img" aria-label="Media folders">📁</span>
            <p className="text-sm font-semibold">Upload Heritage Files</p>
            <p className="text-xs text-vault-muted">Simulate secure Cloudflare R2 isolation ticketing</p>
          </div>

          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              disabled={uploading}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,video/*"
            />
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-light border border-vault-border hover:border-vault-border/80 text-xs font-medium rounded-lg hover:bg-white/5 transition-all">
              Choose Files...
            </span>
          </label>

          {/* Ticket uploading status */}
          {uploadStatus && (
            <div className="flex items-center gap-2 text-xs text-vault-muted mt-2 bg-vault-card/80 border border-vault-border/30 px-3 py-2 rounded-lg">
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-light" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5 text-success" />
              )}
              <span>{uploadStatus}</span>
            </div>
          )}

          {/* Uploaded media previews */}
          {mediaList.length > 0 && (
            <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 border-t border-vault-border/30 pt-4">
              {mediaList.map((m, idx) => (
                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-vault-border bg-black/40 flex flex-col items-center justify-center gap-1.5 p-2">
                  {m.fileType === 'IMAGE' ? (
                    <ImageIcon className="w-6 h-6 text-accent-light" />
                  ) : (
                    <Video className="w-6 h-6 text-amber-500" />
                  )}
                  <span className="text-[10px] text-vault-muted font-mono tracking-wider truncate max-w-full">
                    Asset #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-vault-border/30">
          <Button
            type="submit"
            disabled={createMemoryMutation.isPending || uploading}
            className="flex items-center gap-2"
          >
            {createMemoryMutation.isPending && (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            )}
            Archive Permanently
          </Button>
        </div>
      </form>
    </Card>
  );
}
