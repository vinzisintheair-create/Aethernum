import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

export interface MediaItem {
  id?: string;
  fileUrl: string;
  fileType: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  size: number;
}

export interface MemberProfile {
  id: string;
  email: string;
  profilePictureUrl?: string | null;
  bio?: string | null;
}

export interface SpaceEvent {
  id: string;
  title: string;
  date: string;
  location?: string | null;
  description?: string | null;
}

export interface Memory {
  id: string;
  familySpaceId: string;
  authorId: string;
  title: string;
  richTextStory: string;
  dateOccurred: string;
  location?: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  author: MemberProfile;
  event?: SpaceEvent | null;
  media: MediaItem[];
}

export interface CreateMemoryPayload {
  title: string;
  richTextStory: string;
  dateOccurred: string;
  location?: string;
  eventId?: string | null;
  albumIds?: string[];
  media?: MediaItem[];
}

// Fetch memories sorted chronologically
export function useSpaceMemories(spaceId: string) {
  return useQuery({
    queryKey: ['memories', spaceId],
    queryFn: async () => {
      const response = await api.get<{ memories: Memory[] }>(`/spaces/${spaceId}/memories`);
      return response.data.memories;
    },
    enabled: !!spaceId,
  });
}

// Fetch events list for selection
export function useSpaceEvents(spaceId: string) {
  return useQuery({
    queryKey: ['events', spaceId],
    queryFn: async () => {
      const response = await api.get<{ events: SpaceEvent[] }>(`/spaces/${spaceId}/events`);
      return response.data.events;
    },
    enabled: !!spaceId,
  });
}

// Create new memory with cache invalidation
export function useCreateMemory(spaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateMemoryPayload) => {
      const response = await api.post<{ message: string; memory: Memory }>(
        `/spaces/${spaceId}/memories`,
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate memory listing query to trigger automatic fetch updates
      queryClient.invalidateQueries({ queryKey: ['memories', spaceId] });
    },
  });
}

export interface SpaceMember {
  id: string;
  email: string;
  profilePictureUrl?: string | null;
  bio?: string | null;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

export interface SpaceDetails {
  id: string;
  name: string;
  storageLimit: string;
  storageUsed: string;
  createdAt: string;
  updatedAt: string;
  members: SpaceMember[];
}

export function useSpaceDetails(spaceId: string) {
  return useQuery({
    queryKey: ['space', spaceId],
    queryFn: async () => {
      const response = await api.get<{ space: SpaceDetails }>(`/spaces/${spaceId}`);
      return response.data.space;
    },
    enabled: !!spaceId,
  });
}
