import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type ProductImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export function ProductImage({ src, alt, className }: ProductImageProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!src) { setUrl(null); return; }
    if (/^https?:\/\//i.test(src) || src.startsWith("data:")) {
      setUrl(src);
      return;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(src);
    if (!cancelled) setUrl(data?.publicUrl ?? null);
    return () => { cancelled = true; };
  }, [src]);

  if (!url) return null;
  return <img src={url} alt={alt} className={className} />;
}
