import { Router, type Response } from 'express';
import multer from 'multer';
import mongoose, { isValidObjectId } from 'mongoose';
import { Readable } from 'node:stream';
import { authMiddleware, type AuthRequest } from '../middleware/auth';

// Files live in MongoDB (GridFS), not on disk: Render's free instances wipe
// their disk on every restart, which used to break images and voice messages.

const router = Router();

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = /^(image\/(png|jpeg|gif|webp)|audio\/(webm|ogg|mpeg|mp4|wav|x-m4a)|video\/webm|application\/pdf|text\/plain|application\/zip)$/;
// Shown inline in the chat; everything else is downloaded.
const INLINE = /^(image\/(png|jpeg|gif|webp)|audio\/|video\/webm)/;

export const FILE_URL_PATTERN = /^\/api\/files\/[a-f0-9]{24}$/;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, ALLOWED.test(file.mimetype.split(';')[0])),
});

function bucket() {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db!, { bucketName: 'uploads' });
}

/** True if the URL points to a file that exists in our storage. */
export async function isStoredFile(url: unknown): Promise<boolean> {
  if (typeof url !== 'string' || !FILE_URL_PATTERN.test(url)) return false;
  const id = new mongoose.Types.ObjectId(url.slice('/api/files/'.length));
  return (await bucket().find({ _id: id }).limit(1).toArray()).length > 0;
}

// POST /api/upload
router.post('/upload', authMiddleware, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'File is larger than 5 MB' });
      return;
    }
    next(err);
  });
}, async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'Unsupported or missing file (images, audio, PDF, TXT, ZIP up to 5 MB)' });
    return;
  }
  const { originalname, mimetype, buffer, size } = req.file;
  const stream = bucket().openUploadStream(originalname.slice(0, 200), {
    metadata: { contentType: mimetype.split(';')[0], owner: req.userId },
  });
  await new Promise<void>((resolve, reject) => {
    Readable.from(buffer).pipe(stream).on('finish', () => resolve()).on('error', reject);
  });
  res.json({ url: `/api/files/${stream.id}`, fileName: originalname, fileSize: size, mimetype });
});

// GET /api/files/:id: public by id (ids are unguessable 24-hex ObjectIds), cached for a year
router.get('/files/:id', async (req, res: Response) => {
  if (!isValidObjectId(req.params.id)) {
    res.status(404).end();
    return;
  }
  const id = new mongoose.Types.ObjectId(req.params.id);
  const [file] = await bucket().find({ _id: id }).limit(1).toArray();
  if (!file) {
    res.status(404).end();
    return;
  }
  const type: string = file.metadata?.contentType ?? 'application/octet-stream';
  res.set({
    'Content-Type': type,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
    // Files are rendered by the chat app, never as a page on this origin.
    'Content-Security-Policy': "default-src 'none'; sandbox",
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Content-Disposition': `${INLINE.test(type) ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
  });

  // Safari only plays audio when the server honours byte ranges.
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
  if (range && (range[1] || range[2])) {
    const size = file.length;
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size || start > end) {
      res.status(416).set('Content-Range', `bytes */${size}`).end();
      return;
    }
    res.status(206).set({ 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1) });
    bucket().openDownloadStream(id, { start, end: end + 1 }).pipe(res);
    return;
  }

  res.set('Content-Length', String(file.length));
  bucket().openDownloadStream(id).pipe(res);
});

export default router;
