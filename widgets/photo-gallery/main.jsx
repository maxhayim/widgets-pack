import { ChevronRight, Image as ImageIcon, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { mountWidget } from "../../src/shared/shell.jsx";

/* Photo Gallery: your own photos as a slideshow in a frame, a new one every 20 seconds. Click it for the large view.
   Photos are shrunk and kept in this pack's storage on this computer (IndexedDB). Nothing is uploaded. */
const PHOTO_INTERVAL_MS = 20000;
const DB_NAME = "widgets-pack-photos";
const STORE = "photos";
const CHANGED = "wp-photos-changed";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Photos can't be kept here."));
  });
}

async function dbRequest(mode, makeRequest) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = makeRequest(tx.objectStore(STORE));
    tx.oncomplete = () => {
      db.close();
      resolve(request?.result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

const announce = () => window.dispatchEvent(new Event(CHANGED));
const listPhotos = async () => ((await dbRequest("readonly", (s) => s.getAll())) || []).sort((a, b) => a.added - b.added);
async function deletePhoto(id) {
  await dbRequest("readwrite", (s) => s.delete(id));
  announce();
}

// Shrink a picture so it's comfortable to keep: longest side at most `maxSide`
function shrinkImage(file, maxSide, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith("image/")) {
      reject(new Error("That file isn't a picture."));
      return;
    }
    if (file.size > 40 * 1024 * 1024) {
      reject(new Error("That picture is too large (40 MB at most)."));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("That picture couldn't be read."))), "image/jpeg", quality);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That picture couldn't be opened."));
    };
    img.src = url;
  });
}

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

async function savePhoto(file) {
  const [blob, thumbBlob] = await Promise.all([shrinkImage(file, 1600), shrinkImage(file, 240, 0.75)]);
  // Read the thumbnail first: an IndexedDB transaction closes if it waits on anything else
  const thumb = await blobToDataUrl(thumbBlob);
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  await dbRequest("readwrite", (s) => s.put({ id, blob, thumb, name: file.name, added: Date.now() }));
  announce();
}

function usePhotos() {
  const [photos, setPhotos] = useState([]);
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      listPhotos()
        .then((list) => !cancelled && setPhotos(list))
        .catch(() => !cancelled && setPhotos([]));
    load();
    window.addEventListener(CHANGED, load);
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      window.removeEventListener(CHANGED, load);
      window.removeEventListener("focus", load);
    };
  }, []);
  return photos;
}

function useObjectUrl(blob) {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);
  return url;
}

function useAddPhotos() {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const add = async (files) => {
    setBusy(true);
    try {
      for (const file of files) await savePhoto(file).catch(() => {}); // a file that isn't a picture is skipped
    } finally {
      setBusy(false);
    }
  };
  const input = (
    <input
      ref={fileRef}
      type="file"
      accept="image/*"
      multiple
      className="sr-only"
      tabIndex={-1}
      onChange={(e) => {
        add([...(e.target.files || [])]);
        e.target.value = "";
      }}
    />
  );
  return { busy, pick: () => fileRef.current?.click(), input };
}

function PhotosWidget() {
  const photos = usePhotos();
  const [index, setIndex] = useState(0);
  const [big, setBig] = useState(false);
  const { busy, pick, input } = useAddPhotos();
  const count = photos.length;
  const at = count ? ((index % count) + count) % count : 0;
  const current = count ? photos[at] : null;
  const url = useObjectUrl(current?.blob);
  const stripRef = useRef(null);

  useEffect(() => {
    if (count < 2 || big) return;
    const id = setInterval(() => setIndex((i) => i + 1), PHOTO_INTERVAL_MS);
    return () => clearInterval(id);
  }, [count, big]);

  useEffect(() => {
    if (!big) return;
    const onKey = (e) => {
      if (e.key === "Escape") setBig(false);
      else if (e.key === "ArrowRight") setIndex((i) => i + 1);
      else if (e.key === "ArrowLeft") setIndex((i) => i - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [big]);

  useEffect(() => {
    stripRef.current?.querySelector("[aria-current='true']")?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [at, big]);

  if (big) {
    return (
      <section className="widget widget-photos-big" aria-label="Photo gallery">
        <div className="flex items-center gap-2 px-1 pb-2 text-[12px]">
          <button type="button" onClick={() => setBig(false)} className="widget-mini-btn" aria-label="Back to the frame" title="Back to the frame">
            <X className="h-3.5 w-3.5" strokeWidth={2.2} />
          </button>
          <span className="min-w-0 flex-1 truncate font-semibold">{current ? current.name.replace(/\.[^.]+$/, "") : "photo gallery"}</span>
          {count > 0 && (
            <span className="tabular-nums text-[var(--os-ink-3)]">
              {at + 1} / {count}
            </span>
          )}
          <button type="button" disabled={busy} onClick={pick} className="wp-btn">
            {busy ? "adding…" : "add photos…"}
          </button>
          {current && (
            <button
              type="button"
              onClick={() => {
                deletePhoto(current.id);
                setIndex(Math.max(0, Math.min(at, count - 2)));
              }}
              className="wp-btn"
            >
              remove
            </button>
          )}
        </div>
        <div className="widget-photos-stage">
          {current ? (
            url && <img src={url} alt={current.name} className="max-h-full max-w-full object-contain" />
          ) : (
            <div className="text-center text-white/80">
              <ImageIcon className="mx-auto h-10 w-10" strokeWidth={1.3} aria-hidden="true" />
              <p className="mt-2 text-[13px]">No photos yet.</p>
            </div>
          )}
          {count > 1 && (
            <>
              <button type="button" onClick={() => setIndex(at - 1)} className="widget-photos-arrow left-3" aria-label="Previous photo">
                <ChevronRight className="h-5 w-5 rotate-180" />
              </button>
              <button type="button" onClick={() => setIndex(at + 1)} className="widget-photos-arrow right-3" aria-label="Next photo">
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
        {count > 0 && (
          <div ref={stripRef} className="flex gap-1.5 overflow-x-auto pl-6 pt-2" role="list" aria-label="Photos">
            {photos.map((p, i) => (
              <button
                key={p.id}
                type="button"
                role="listitem"
                aria-current={i === at}
                aria-label={p.name}
                onClick={() => setIndex(i)}
                className={`widget-photos-thumb ${i === at ? "widget-photos-thumb-on" : ""}`}
              >
                <img src={p.thumb} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        {input}
      </section>
    );
  }

  return (
    <section className="widget widget-photos" aria-label={current ? `Photo Gallery: ${current.name}` : "Photo Gallery"}>
      {current ? (
        <button type="button" onClick={() => setBig(true)} className="widget-photos-frame" title="Open the large view" aria-label={`${current.name}. Open the large view.`}>
          {url && <img src={url} alt="" className="h-full w-full object-cover" />}
        </button>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
          <ImageIcon className="h-8 w-8 text-[var(--os-ink-3)]" strokeWidth={1.4} aria-hidden="true" />
          <p className="text-[12px] text-[var(--os-ink-2)]">Your photos, in a frame.</p>
          <button type="button" disabled={busy} onClick={pick} className="rounded-full px-3 py-1 text-[12px] ring-1 ring-[var(--os-line)] hover:bg-[var(--os-hover)]">
            {busy ? "adding…" : "add photos…"}
          </button>
        </div>
      )}
      {count > 1 && (
        <div className="widget-photos-dots" aria-hidden="true">
          {photos.slice(0, 8).map((p, i) => (
            <span key={p.id} className={i === at % 8 ? "on" : ""} />
          ))}
        </div>
      )}
      {input}
    </section>
  );
}

mountWidget({ id: "photo-gallery", label: "Photo Gallery", Widget: PhotosWidget });
