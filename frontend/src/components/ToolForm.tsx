"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ValidationErrors } from "@/lib/api";
import { Category, Difficulty, DIFFICULTY_LABELS, Role, Tool } from "@/lib/types";
import Card from "@/components/Card";
import { useToast } from "@/context/ToastContext";

const inputClass = "input mt-1";

// Етикет + поле + съобщение за грешка под него
function Field({ label, required, error, hint, children }: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="block text-sm">
      <span className="font-medium text-slate-700">
        {label} {required && <span className="text-red-600" aria-label="задължително">*</span>}
      </span>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

// Добавяне на нов инструмент (без tool) или редакция на съществуващ (с tool)
export default function ToolForm({ tool }: { tool?: Tool }) {
  const router = useRouter();
  const toast = useToast();

  // Списъци за избор, зареждат се от API-то
  const [roles, setRoles] = useState<Role[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Стойности на полетата
  const [name, setName] = useState(tool?.name ?? "");
  const [url, setUrl] = useState(tool?.url ?? "");
  const [documentationUrl, setDocumentationUrl] = useState(tool?.documentation_url ?? "");
  const [description, setDescription] = useState(tool?.description ?? "");
  const [usage, setUsage] = useState(tool?.usage ?? "");
  const [examples, setExamples] = useState(tool?.examples ?? "");
  const [exampleLinks, setExampleLinks] = useState<string[]>(tool?.example_links ?? []);
  const [documentation, setDocumentation] = useState(tool?.documentation ?? "");
  const [videoUrl, setVideoUrl] = useState(tool?.video_url ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty | "">(tool?.difficulty ?? "");
  const [roleIds, setRoleIds] = useState<number[]>(tool?.roles.map((r) => r.id) ?? []);
  const [categoryIds, setCategoryIds] = useState<number[]>(tool?.categories.map((c) => c.id) ?? []);
  const [tags, setTags] = useState(tool?.tags.map((t) => t.name).join(", ") ?? "");
  const [images, setImages] = useState<File[]>([]);
  const [removeImageIds, setRemoveImageIds] = useState<number[]>([]);

  const [newCategory, setNewCategory] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch("/api/roles").then((r) => r.json()).then(setRoles);
    apiFetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  // Първата грешка за поле (вкл. за елементи в масив, напр. "images.0")
  function err(key: string): string | undefined {
    const match = Object.keys(errors).find((k) => k === key || k.startsWith(`${key}.`));
    return match ? errors[match][0] : undefined;
  }

  function toggle(list: number[], id: number): number[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  // Махаме съобщението за грешка, щом потребителят поправи полето
  function clearError(key: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function addCategory() {
    if (!newCategory.trim()) return;

    // Ако категорията вече я има в списъка, просто я избираме
    const existing = categories.find((c) => c.name.toLowerCase() === newCategory.trim().toLowerCase());
    if (existing) {
      if (!categoryIds.includes(existing.id)) setCategoryIds([...categoryIds, existing.id]);
      setNewCategory("");
      clearError("category_ids");
      return;
    }

    const res = await apiFetch("/api/categories", {
      method: "POST",
      body: JSON.stringify({ name: newCategory }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrors({ ...errors, new_category: data.errors?.name ?? [data.message] });
      return;
    }
    setCategories([...categories, data].sort((a, b) => a.name.localeCompare(b.name)));
    setCategoryIds([...categoryIds, data.id]);
    setNewCategory("");
    clearError("new_category");
    clearError("category_ids");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    // Проверка в браузъра за чекбоксите (останалите полета имат required)
    const local: ValidationErrors = {};
    if (roleIds.length === 0) local.role_ids = ["Изберете поне една роля."];
    if (categoryIds.length === 0) local.category_ids = ["Изберете поне една категория."];
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }

    // FormData позволява да изпратим и текст, и файлове в една заявка
    const form = new FormData();
    form.append("name", name);
    form.append("url", url);
    form.append("documentation_url", documentationUrl);
    form.append("description", description);
    form.append("usage", usage);
    form.append("examples", examples);
    form.append("documentation", documentation);
    form.append("video_url", videoUrl);
    form.append("difficulty", difficulty);
    exampleLinks.filter((l) => l.trim()).forEach((l) => form.append("example_links[]", l.trim()));
    roleIds.forEach((id) => form.append("role_ids[]", String(id)));
    categoryIds.forEach((id) => form.append("category_ids[]", String(id)));
    tags.split(",").map((t) => t.trim()).filter(Boolean).forEach((t) => form.append("tags[]", t));
    images.forEach((file) => form.append("images[]", file));
    removeImageIds.forEach((id) => form.append("remove_image_ids[]", String(id)));

    // PHP не чете файлове при PUT, затова при редакция пращаме POST с _method=PUT
    if (tool) form.append("_method", "PUT");

    setSaving(true);
    try {
      const res = await apiFetch(tool ? `/api/tools/${tool.id}` : "/api/tools", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));

      if (res.status === 422) {
        setErrors(data.errors ?? {});
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (!res.ok) {
        setErrors({ general: [data.message ?? `Грешка ${res.status}`] });
        return;
      }
      // Новите предложения (освен от owner) чакат одобрение от администратор
      if (data.data.status === "pending") {
        toast.info(tool ? "Промените са запазени. Инструментът чака одобрение." : "Инструментът е изпратен за одобрение от администратор.");
      } else {
        toast.success(tool ? "Промените са запазени." : "Инструментът е публикуван.");
      }
      router.push(`/tools/${data.data.id}`);
    } catch {
      setErrors({ general: ["Няма връзка с бекенда."] });
    } finally {
      setSaving(false);
    }
  }

  const allErrors = Object.values(errors).flat().filter(Boolean);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {allErrors.length > 0 && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <p className="font-medium">Моля, поправете следното:</p>
          <ul className="list-disc ml-5">
            {allErrors.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <Card className="space-y-4">
        <h2 className="font-semibold text-slate-900">Основна информация</h2>
        <Field label="Име" required error={err("name")}>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={255} />
        </Field>
        <Field label="Линк" required error={err("url")}>
          <input type="url" className={inputClass} value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://..." />
        </Field>
        <Field label="Официална документация (линк)" error={err("documentation_url")}>
          <input type="url" className={inputClass} value={documentationUrl} onChange={(e) => setDocumentationUrl(e.target.value)} placeholder="https://..." />
        </Field>
        <Field label="Описание" required error={err("description")}>
          <textarea className={inputClass} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required />
        </Field>
        <Field label="Как се използва" required error={err("usage")}>
          <textarea className={inputClass} rows={4} value={usage} onChange={(e) => setUsage(e.target.value)} required />
        </Field>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold text-slate-900">Роли, категории и тагове</h2>

        <Field label="Препоръчителни роли" required error={err("role_ids")}>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {roles.map((role) => (
              <label key={role.id} className="flex items-center gap-2 text-slate-700">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-indigo-600" checked={roleIds.includes(role.id)} onChange={() => { setRoleIds(toggle(roleIds, role.id)); clearError("role_ids"); }} />
                {role.name}
              </label>
            ))}
          </div>
        </Field>

        <Field label="Категории" required error={err("category_ids")}>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 text-slate-700">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-indigo-600" checked={categoryIds.includes(cat.id)} onChange={() => { setCategoryIds(toggle(categoryIds, cat.id)); clearError("category_ids"); }} />
                {cat.name}
              </label>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              className="input flex-1"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory();
                }
              }}
              placeholder="Нова категория..."
            />
            <button type="button" onClick={addCategory} className="btn-secondary shrink-0">
              + Добави
            </button>
          </div>
          {err("new_category") && <p className="text-xs text-red-600 mt-1">{err("new_category")}</p>}
        </Field>

        <Field label="Тагове" error={err("tags")} hint="Разделени със запетая, напр.: chat, код, анализ">
          <input className={inputClass} value={tags} onChange={(e) => setTags(e.target.value)} />
        </Field>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold text-slate-900">Примери и документация</h2>
        <Field label="Реални примери" error={err("examples")}>
          <textarea className={inputClass} rows={3} value={examples} onChange={(e) => setExamples(e.target.value)} />
        </Field>

        <Field label="Линкове към примери" error={err("example_links")}>
          <div className="space-y-2 mt-1">
            {exampleLinks.map((link, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="url"
                  className="input flex-1"
                  value={link}
                  onChange={(e) => setExampleLinks(exampleLinks.map((l, j) => (j === i ? e.target.value : l)))}
                  placeholder="https://..."
                />
                <button type="button" onClick={() => setExampleLinks(exampleLinks.filter((_, j) => j !== i))} className="px-2 text-red-700" aria-label="Премахни линка">
                  ✕
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setExampleLinks([...exampleLinks, ""])} className="text-sm font-medium text-indigo-700 hover:underline">
              + Добави линк
            </button>
          </div>
        </Field>

        <Field label="Документация (markdown)" error={err("documentation")} hint="Може да поставите инструкции във формат Markdown.">
          <textarea className={`${inputClass} font-mono`} rows={6} value={documentation} onChange={(e) => setDocumentation(e.target.value)} />
        </Field>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold text-slate-900">Изображения</h2>
        {tool && tool.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tool.images.map((img) => (
              <label key={img.id} className={`block text-xs ${removeImageIds.includes(img.id) ? "opacity-40" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-24 w-full rounded-lg border border-slate-200 object-cover" />
                <span className="flex items-center gap-1 mt-1">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-indigo-600" checked={removeImageIds.includes(img.id)} onChange={() => setRemoveImageIds(toggle(removeImageIds, img.id))} />
                  Премахни
                </span>
              </label>
            ))}
          </div>
        )}
        <Field label="Скрийншоти" error={err("images")} hint="До 5 изображения, всяко до 2 MB (jpg, png, webp, gif).">
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
            onChange={(e) => setImages(Array.from(e.target.files ?? []))}
          />
        </Field>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold text-slate-900">Допълнително (по желание)</h2>
        <Field label="Видео ресурс (линк)" error={err("video_url")}>
          <input type="url" className={inputClass} value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." />
        </Field>
        <Field label="Ниво на трудност" error={err("difficulty")}>
          <select className={inputClass} value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty | "")}>
            <option value="">— не е посочено —</option>
            {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Запазване..." : tool ? "Запази промените" : "Добави инструмента"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Отказ
        </button>
      </div>
    </form>
  );
}
