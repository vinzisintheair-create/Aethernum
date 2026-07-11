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
  username?: string | null;
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

export interface Annotation {
  id: string;
  memoryId: string;
  authorId: string;
  content: string;
  createdAt: string;
  author: MemberProfile;
}

export interface Verification {
  id: string;
  memoryId: string;
  verifierId: string;
  verifier: {
    id: string;
    email: string;
    username?: string | null;
  };
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
  annotations: Annotation[];
  verifications: Verification[];
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
  username?: string | null;
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

// Create new annotation
export function useCreateAnnotation(spaceId: string, memoryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post<{ message: string; annotation: Annotation }>(
        `/spaces/${spaceId}/memories/${memoryId}/annotations`,
        { content }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories', spaceId] });
    }
  });
}

// Toggle verification co-signature
export function useToggleVerification(spaceId: string, memoryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (verified: boolean) => {
      if (verified) {
        await api.post(`/spaces/${spaceId}/memories/${memoryId}/verify`);
      } else {
        await api.post(`/spaces/${spaceId}/memories/${memoryId}/unverify`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories', spaceId] });
    }
  });
}

// Fetch current user details
export function useCurrentUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await api.get<{ member: MemberProfile }>('/auth/me');
      return response.data.member;
    },
    retry: false
  });
}

export interface Album {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  createdAt: string;
  count: number;
}

export interface AlbumDetails {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  createdAt: string;
  memories: Memory[];
}

export function useSpaceAlbums(spaceId: string) {
  return useQuery({
    queryKey: ['albums', spaceId],
    queryFn: async () => {
      const response = await api.get<{ albums: Album[] }>(`/spaces/${spaceId}/albums`);
      return response.data.albums;
    },
    enabled: !!spaceId
  });
}

export function useAlbumDetails(spaceId: string, albumId: string) {
  return useQuery({
    queryKey: ['album', spaceId, albumId],
    queryFn: async () => {
      const response = await api.get<{ album: AlbumDetails }>(`/spaces/${spaceId}/albums/${albumId}`);
      return response.data.album;
    },
    enabled: !!spaceId && !!albumId
  });
}

export function useCreateAlbum(spaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { title: string; description?: string }) => {
      const response = await api.post<{ message: string; album: Album }>(
        `/spaces/${spaceId}/albums`,
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums', spaceId] });
    }
  });
}

export function useCreateEvent(spaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { title: string; date: string; location?: string; description?: string }) => {
      const response = await api.post<{ message: string; event: SpaceEvent }>(
        `/spaces/${spaceId}/events`,
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', spaceId] });
    }
  });
}
