"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navy = "#16264F";
const navy2 = "#1E3364";
const gold = "#E8C874";
const cream = "#F2EFE8";
const muted = "#9FB0D1";

type Product = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price_xaf: number;
  stock: number;
  category: string | null;
  images: string[];
  video_url: string | null;
  active: boolean;
};

export default function AdminProductsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/signin?next=" + encodeURIComponent("/admin/products"));
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      setIsAdmin(true);
      setChecking(false);
      loadProducts();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    setProducts((data as Product[]) || []);
  }

  async function uploadFile(file: File, folder: string): Promise<string> {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const imageUrls: string[] = [];
      if (imageFiles) {
        for (const file of Array.from(imageFiles)) {
          const url = await uploadFile(file, "photos");
          imageUrls.push(url);
        }
      }

      let videoUrl: string | null = null;
      if (videoFile) {
        videoUrl = await uploadFile(videoFile, "videos");
      }

      const sku = `NEW-${Date.now().toString().slice(-8)}`;

      const { error } = await supabase.from("products").insert({
        sku,
        name,
        description,
        price_xaf: Number(price),
        stock: Number(stock) || 0,
        category: category || null,
        images: imageUrls,
        video_url: videoUrl,
        active: true,
      });

      if (error) throw error;

      setMessage("Product added.");
      setName("");
      setDescription("");
      setPrice("");
      setStock("");
      setCategory("");
      setImageFiles(null);
      setVideoFile(null);
      loadProducts();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function updateProduct(id: string, field: "price_xaf" | "stock", value: number) {
    await supabase.from("products").update({ [field]: value }).eq("id", id);
    loadProducts();
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from("products").update({ active: !active }).eq("id", id);
    loadProducts();
  }

  if (checking) {
    return (
      <main style={{ background: navy, color: cream, minHeight: "100vh" }} className="p-8">
        Checking access...
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main style={{ background: navy, color: cream, minHeight: "100vh" }} className="p-8">
        <p>You don&apos;t have access to this page.</p>
      </main>
    );
  }

  return (
    <main style={{ background: navy, color: cream, minHeight: "100vh" }} className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold" style={{ color: "#fff" }}>
          Add a product
        </h1>

        {message && (
          <p
            className="mb-4 rounded px-3 py-2 text-sm"
            style={{ background: "rgba(232,200,116,0.12)", color: gold }}
          >
            {message}
          </p>
        )}

        <form
          onSubmit={handleAddProduct}
          className="mb-10 flex flex-col gap-4 rounded p-5"
          style={{ background: navy2, border: "1px solid rgba(232,200,116,0.2)" }}
        >
          <Field label="Product name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
            />
          </Field>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={inputStyle}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (XAF)">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                style={inputStyle}
              />
            </Field>
            <Field label="Stock quantity">
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                style={inputStyle}
              />
            </Field>
          </div>
          <Field label="Category (optional)">
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Electronics, Home, Fashion"
              style={inputStyle}
            />
          </Field>
          <Field label="Photos (you can pick more than one)">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImageFiles(e.target.files)}
              style={inputStyle}
            />
          </Field>
          <Field label="Video (optional)">
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              style={inputStyle}
            />
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded py-2 font-bold"
            style={{ background: gold, color: navy, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Uploading..." : "Add product"}
          </button>
        </form>

        <h2 className="mb-4 text-xl font-bold" style={{ color: gold }}>
          Your products
        </h2>
        <div className="flex flex-col gap-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 rounded p-3"
              style={{ background: navy2, border: "1px solid rgba(232,200,116,0.2)" }}
            >
              {p.images?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.images[0]}
                  alt={p.name}
                  className="h-16 w-16 rounded object-cover"
                />
              )}
              <div className="flex-1">
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs" style={{ color: muted }}>
                  {p.sku} {p.video_url && "· has video"}
                </div>
              </div>
              <input
                type="number"
                defaultValue={p.price_xaf}
                onBlur={(e) => updateProduct(p.id, "price_xaf", Number(e.target.value))}
                className="w-24 rounded px-2 py-1 text-sm"
                style={inputStyle}
              />
              <input
                type="number"
                defaultValue={p.stock}
                onBlur={(e) => updateProduct(p.id, "stock", Number(e.target.value))}
                className="w-20 rounded px-2 py-1 text-sm"
                style={inputStyle}
              />
              <button
                onClick={() => toggleActive(p.id, p.active)}
                className="rounded px-3 py-1 text-xs"
                style={{
                  border: "1px solid rgba(232,200,116,0.3)",
                  color: p.active ? gold : muted,
                }}
              >
                {p.active ? "Visible" : "Hidden"}
              </button>
            </div>
          ))}
          {!products.length && <p style={{ color: muted }}>No products added yet.</p>}
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium" style={{ color: "#C9D2E3" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#0F1B38",
  border: "1px solid rgba(232,200,116,0.25)",
  color: cream,
  width: "100%",
  borderRadius: "6px",
  padding: "8px 10px",
};
