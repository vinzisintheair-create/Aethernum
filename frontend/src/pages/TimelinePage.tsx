import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useSpaceMemories,
  useCreateAnnotation,
  useToggleVerification,
  useCurrentUser,
  Memory
} from '../hooks/useMemories';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import CreateMemoryForm from '../components/CreateMemoryForm';
import {
  Calendar,
  MapPin,
  Plus,
  Image as ImageIcon,
  Video,
  User,
  X,
  Loader2,
  CheckCircle,
  MessageSquare,
  BookmarkCheck
} from 'lucide-react';

interface MemoryCardProps {
  memory: Memory;
  spaceId: string;
  currentUser?: { id: string; email: string };
  formatDate: (dateStr: string) => string;
}

function MemoryCard({ memory, spaceId, currentUser, formatDate }: MemoryCardProps) {
  const [noteText, setNoteText] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);

  const createAnnotationMutation = useCreateAnnotation(spaceId, memory.id);
  const toggleVerificationMutation = useToggleVerification(spaceId, memory.id);

  // Check if current user has verified this story
  const isVerifiedByMe = currentUser
    ? memory.verifications.some((v) => v.verifierId === currentUser.id)
    : false;

  const handleVerifyToggle = async () => {
    try {
      await toggleVerificationMutation.mutateAsync(!isVerifiedByMe);
    } catch (err) {
      console.error('[Verification Toggle Failed]:', err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    try {
      await createAnnotationMutation.mutateAsync(noteText);
      setNoteText('');
      setShowNoteForm(false);
    } catch (err) {
      console.error('[Add Annotation Failed]:', err);
    }
  };

  // Compile verification list string
  const verificationList = memory.verifications.map((v) => v.verifier.username || v.verifier.email);
  const verificationString =
    verificationList.length === 0
      ? ''
      : verificationList.length === 1
      ? `${verificationList[0]} verified this story`
      : verificationList.length === 2
      ? `${verificationList[0]} and ${verificationList[1]} verified this`
      : `${verificationList[0]}, ${verificationList[1]} and ${verificationList.length - 2} others verified this`;

  return (
    <Card className="border border-vault-border/30 p-6 flex flex-col gap-6">
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
          <div className={`grid gap-4 mt-3 ${
            memory.media.length === 1 
              ? 'grid-cols-1 max-w-xl' 
              : memory.media.length === 2 
                ? 'grid-cols-2' 
                : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
          }`}>
            {memory.media.map((med) => (
              <div
                key={med.id}
                className={`relative rounded-xl overflow-hidden border border-vault-border/50 bg-black/40 hover:border-accent/40 transition-all group cursor-pointer flex items-center justify-center ${
                  memory.media.length === 1 
                    ? 'aspect-[4/3] sm:aspect-[16/10] w-full' 
                    : 'aspect-square sm:aspect-video'
                }`}
              >
                {med.fileType === 'IMAGE' ? (
                  <img
                    src={med.fileUrl}
                    alt="Archival media"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      const fallback = parent?.querySelector('.fallback-icon');
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                ) : null}

                <div className={`fallback-icon flex flex-col items-center gap-1 text-center p-3 ${med.fileType === 'IMAGE' ? 'hidden' : ''}`}>
                  {med.fileType === 'IMAGE' ? (
                    <ImageIcon className="w-8 h-8 text-accent-light" />
                  ) : (
                    <>
                      <Video className="w-8 h-8 text-amber-500" />
                      <span className="text-[9px] text-vault-muted font-mono truncate max-w-full">
                        {(med.size / 1024).toFixed(1)} KB
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Collaboration verification and actions footer */}
        <div className="flex flex-col gap-4 border-t border-vault-border/20 pt-4 mt-2">
          
          {/* Preserver identity & Verification Status Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-vault-muted">
              <User className="w-3.5 h-3.5 text-accent-light" />
              <span>
                Preserved by: <strong className="text-slate-300 font-semibold">{memory.author.username || memory.author.email}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              {verificationString && (
                <span className="text-[11px] text-accent-light/80 italic font-medium flex items-center gap-1">
                  <BookmarkCheck className="w-3.5 h-3.5 text-green-400" />
                  {verificationString}
                </span>
              )}

              <button
                onClick={handleVerifyToggle}
                disabled={toggleVerificationMutation.isPending}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isVerifiedByMe
                    ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                    : 'bg-primary-light/40 border-vault-border/60 text-vault-muted hover:text-white hover:border-vault-border'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {isVerifiedByMe ? 'Co-signed ✓' : 'Co-sign / Verify'}
              </button>
            </div>
          </div>

          {/* Appended Archival Annotations List */}
          {memory.annotations && memory.annotations.length > 0 && (
            <div className="bg-black/30 border border-vault-border/30 rounded-xl p-4 space-y-3.5">
              <p className="text-[10px] font-bold text-vault-muted uppercase tracking-widest select-none border-b border-vault-border/25 pb-1.5">
                Archival Annotations ({memory.annotations.length})
              </p>
              <div className="space-y-3 divide-y divide-vault-border/20">
                {memory.annotations.map((ann) => (
                  <div key={ann.id} className="text-xs pt-3 first:pt-0">
                    <div className="flex items-center gap-2 text-[10px] text-vault-muted font-medium mb-1">
                      <span>{ann.author.username || ann.author.email}</span>
                      <span>•</span>
                      <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed font-sans pl-2.5 border-l border-accent/40 italic">
                      "{ann.content}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inline Add Note Trigger & Form */}
          <div className="flex flex-col gap-3">
            {!showNoteForm ? (
              <button
                onClick={() => setShowNoteForm(true)}
                className="text-xs text-vault-muted hover:text-accent-light flex items-center gap-1.5 font-semibold w-fit transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                + Add Archival Annotation / Secondary Witness Note
              </button>
            ) : (
              <form onSubmit={handleAddNote} className="flex flex-col gap-3 max-w-xl">
                <textarea
                  rows={2}
                  placeholder="Add historical annotations, corrections, or secondary details to preserve with this story..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-primary-dark/40 border border-vault-border/60 rounded-lg text-xs text-vault-text placeholder-vault-muted/40 transition-all focus:border-accent focus:ring-1 focus:ring-accent resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="py-1 px-3 text-xs"
                    onClick={() => {
                      setShowNoteForm(false);
                      setNoteText('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createAnnotationMutation.isPending}
                    className="py-1 px-3 text-xs"
                  >
                    {createAnnotationMutation.isPending ? 'Appending...' : 'Save Annotation'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function TimelinePage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const activeSpaceId = spaceId || '';

  const [isFormOpen, setIsFormOpen] = useState(false);

  // Read memories using TanStack Query
  const { data: memories, isLoading, error } = useSpaceMemories(activeSpaceId);
  const { data: currentUser } = useCurrentUser();

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
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
          <h1 className="text-3xl font-bold font-serif">Friend Timeline</h1>
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

      {/* Creation form slide */}
      {isFormOpen && (
        <div className="relative w-full flex justify-center">
          <button 
            onClick={() => setIsFormOpen(false)}
            className="absolute top-4 right-4 md:top-6 md:right-6 text-vault-muted hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded p-1 z-10"
            aria-label="Close Creation Panel"
          >
            <X className="w-5 h-5" />
          </button>
          <CreateMemoryForm 
            onSuccess={() => setIsFormOpen(false)} 
          />
        </div>
      )}

      {/* State feedbacks */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-accent-light" />
          <p className="text-sm text-vault-muted">Retrieving chronological archive stream...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-20 border border-danger/20 bg-danger/5 rounded-xl p-8 max-w-xl mx-auto">
          <span className="text-3xl">⚠️</span>
          <h4 className="text-md font-bold mt-3 text-white">Connection Error</h4>
          <p className="text-xs text-vault-muted mt-1 leading-relaxed">
            Failed to query Aeternum backend vault. Confirm credentials and tenant boundaries.
          </p>
        </div>
      )}

      {!isLoading && !error && (!memories || memories.length === 0) && (
        <div className="text-center py-24 border border-dashed border-vault-border/50 rounded-2xl max-w-2xl mx-auto w-full p-8 flex flex-col items-center gap-4">
          <span className="text-5xl select-none" role="img" aria-label="Empty vault">🏺</span>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-white font-serif">Vault is currently empty</h4>
            <p className="text-xs text-vault-muted max-w-md leading-relaxed">
              No historical stories or milestones have been cataloged in this Friend Space yet. Start preserving now!
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)} variant="primary" className="flex items-center gap-2 mt-2">
            <Plus className="w-4 h-4" /> Begin Archiving
          </Button>
        </div>
      )}

      {/* Memories Chronology Thread */}
      {!isLoading && !error && memories && memories.length > 0 && (
        <div className="flex flex-col gap-6">
          {memories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              spaceId={activeSpaceId}
              currentUser={currentUser}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
