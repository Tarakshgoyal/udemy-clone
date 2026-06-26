import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { getSession } from '@/lib/auth/session';

const f = createUploadthing();

export const ourFileRouter = {
  // Course thumbnail upload — image only, max 4MB
  courseThumbnail: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getSession();
      if (!session) throw new Error('Unauthorized');
      if (session.role !== 'CREATOR') throw new Error('Only creators can upload thumbnails');
      return { userId: session.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  // Lecture video upload — video only, max 512MB
  lectureVideo: f({ video: { maxFileSize: '512MB', maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getSession();
      if (!session) throw new Error('Unauthorized');
      if (session.role !== 'CREATOR') throw new Error('Only creators can upload videos');
      return { userId: session.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  // Course preview video — shorter videos for course preview
  previewVideo: f({ video: { maxFileSize: '64MB', maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getSession();
      if (!session) throw new Error('Unauthorized');
      if (session.role !== 'CREATOR') throw new Error('Only creators can upload previews');
      return { userId: session.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
