import { useEffect, useState } from "react";
import { fetchPublished } from "./blogSchema";

// Remembered for the visit, so flipping between provinces does not refetch.
const cache = new Map();

// The newest published posts tagged with a province; [] while loading or on error.
export function useProvinceNews(province, size = 3) {
  const key = `${province}|${size}`;
  const [posts, setPosts] = useState(() => cache.get(key) || []);

  useEffect(() => {
    if (!province) {
      setPosts([]);
      return undefined;
    }
    if (cache.has(key)) {
      setPosts(cache.get(key));
      return undefined;
    }
    let alive = true;
    setPosts([]);
    fetchPublished({ province, size })
      .then(({ posts: found }) => {
        cache.set(key, found);
        if (alive) setPosts(found);
      })
      .catch((err) => console.error("Could not load province news:", err));
    return () => {
      alive = false;
    };
  }, [province, size, key]);

  return posts;
}
