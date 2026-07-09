import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSpaceMemories } from '../hooks/useMemories';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import CreateMemoryForm from '../components/CreateMemoryForm';
import { Calendar, MapPin, Plus, Image as ImageIcon, Video, User, X, Loader2 } from 'lucide-react';

export default function TimelinePage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const activeSpaceId = spaceId || '';

  const [isFormOpen, setIsFormOpen] = useState(false);

  // Read memories using TanStack Query
  const { data: memories, isLoading, error } = useSpaceMemories(activeSpaceId);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC' // Ensure timezone alignment
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Upper header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-vault-border/30 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-serif">Family Timeline</h1>
          <p className="text-sm text-vault-muted mt-1">Chronological repository of preserved milestones and stories.</p>
        </div>
        {!isFormOpen && (
          <Button 
            onClick={() => setIsFormOpen(true)}
            variant="primary" 
            className="flex items-center gap-2 self-start sm:self-center"
            id="add-memory-trigger"
          >
            <Plus className="w-4 h-4" /> Add Memory
          </Button>
        )}
      </div>

      {/* Creation form modal layout */}
      {isFormOpen && (
        <div className="relative border border-vault-border bg-vault-card/50 p-6 rounded-2xl shadow-inner flex flex-col gap-4">
          <button
            onClick={() => setIsFormOpen(false)}
            className="absolute top-4 right-4 text-vault-muted hover:text-white transition-colors focus-visible:ring-1 focus-visible:ring-danger rounded"
            aria-label="Close form"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex justify-center">
            <CreateMemoryForm onSuccess={() => setIsFormOpen(false)} />
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card className="border border-danger/30 text-center py-12">
          <span className="text-4xl">⚠️</span>
          <h3 className="text-lg font-semibold text-danger mt-3">Connection Pipeline Failed</h3>
          <p className="text-xs text-vault-muted mt-1 max-w-sm mx-auto">
            Unable to synchronize memory queries. Verify backend connectivity and isolation headers.
          </p>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-vault-muted">
          <Loader2 className="w-8 h-8 animate-spin text-accent-light" />
          <p className="text-xs font-medium uppercase tracking-wider">Syncing Family Vault...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!memories || memories.length === 0) && (
        <Card className="border border-vault-border/30 text-center py-16 flex flex-col items-center gap-4">
          <span className="text-5xl select-none" role="img" aria-label="Book open">📖</span>
          <div>
            <h3 className="text-xl font-bold font-serif">No Memories Preserved Yet</h3>
            <p className="text-xs text-vault-muted mt-1.5 max-w-xs mx-auto">
              This private vault space is currently empty. Record your first lineage story using the Add Memory button above.
            </p>
          </div>
        </Card>
      )}

      {/* Memories Chronology Thread */}
      {!isLoading && !error && memories && memories.length > 0 && (
        <div className="flex flex-col gap-6">
          {memories.map((memory) => (
            <Card key={memory.id} hoverEffect className="border border-vault-border/30 p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                {/* Upper Metadata Title row */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-bold font-serif hover:text-accent-light transition-all cursor-pointer">
                      {memory.title}
                    </h3>
                    
                    {/* Linked Event Tag */}
                    {memory.event && (
                      <span className="text-[10px] bg-accent/20 border border-accent/40 text-green-300 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {memory.event.title}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-vault-muted">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-accent-light" />
                      Occurred: <strong className="text-slate-200 font-sans">{formatDate(memory.dateOccurred)}</strong>
                    </span>
                    {memory.location && (
                      <span className="flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-accent-light" />
                        {memory.location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Main rich text story block */}
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans border-l-2 border-vault-border/40 pl-4 py-1">
                  {memory.richTextStory}
                </div>

                {/* Media grid if files are attached */}
                {memory.media && memory.media.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                    {memory.media.map((med) => (
                      <div
                        key={med.id}
                        className="relative aspect-video rounded-lg overflow-hidden border border-vault-border bg-black/40 hover:border-accent/40 transition-all group cursor-pointer flex items-center justify-center"
                      >
                        {med.fileType === 'IMAGE' ? (
                          <img
                            src={med.fileUrl}
                            alt="Archival media"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              // Replace image with hidden, and show fallback-icon
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              const fallback = parent?.querySelector('.fallback-icon');
                              if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                        ) : null}

                        {/* Fallback Icon or Video Icon */}
                        <div className={`fallback-icon flex flex-col items-center gap-1 text-center p-3 ${med.fileType === 'IMAGE' ? 'hidden' : ''}`}>
                          {med.fileType === 'IMAGE' ? (
                            <ImageIcon className="w-8 h-8 text-accent-light" />
                          ) : (
                            <Video className="w-8 h-8 text-amber-500" />
                          )}
                          <span className="text-[9px] text-vault-muted font-mono truncate max-w-full">
                            {(med.size / 1024).toFixed(1)} KB
                          </span>
                        </div>

                        {/* Floating size badge for resolved images */}
                        {med.fileType === 'IMAGE' && (
                          <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-[9px] text-white px-2 py-0.5 rounded font-mono select-none">
                            {(med.size / 1024).toFixed(1)} KB
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer metadata segment */}
                <div className="flex items-center gap-2 border-t border-vault-border/20 pt-4 text-xs text-vault-muted mt-2">
                  <User className="w-3.5 h-3.5 text-accent-light" />
                  <span>
                    Preserved by: <strong className="text-slate-300 font-semibold">{memory.author.email}</strong>
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
