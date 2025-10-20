import fg from "fast-glob";
import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname, resolve, sep } from "path";

type Token = {
  book_chapter_verse: string;
  pos_tag: Record<string, any>;
  word_forms: string[];
  gloss?: string;
};

type Verse = Token[];

type ChapterJson = Record<string, Verse>;

type BookEntry = { english: string; hebrew: string };

type Row = {
  bookCode: number;
  bookName: string;
  chapter: number;
  verse: number;
  bcv: string;
  ref: string;
  binyan: string;
  voice: "active" | "passive";
  usage: "verbal" | "adjectival" | "substantive";
  gender?: string;
  number?: string;
  hasArticle: boolean;
  negated: boolean;
  precededBy: Array<"prep" | "conj" | "art" | "nega">;
  prepLetters: string[];
  wordUnpointed: string;
  wordPointed: string;
  gloss?: string;
};

function prettyBinyan(vs: string | undefined): string {
  if (!vs) return "Unknown";
  const map: Record<string, string> = {
    qal: "Qal",
    nif: "Nifal",
    piel: "Piel",
    pual: "Pual",
    hif: "Hifil",
    hof: "Hofal",
    hit: "Hitpael",
    hsht: "Hishtafel",
  };
  return map[vs] || vs;
}

function usageFromPdp(pdp: string | undefined): Row["usage"] {
  if (pdp === "adjv") return "adjectival";
  if (pdp === "subs") return "substantive";
  return "verbal";
}

function getBookNameFromPath(filePath: string): string {
  // Normalize separators for cross-platform support
  const normalized = filePath.replace(/\\/g, "/");
  const parts = normalized.split("/");
  const bookDir = parts[parts.length - 2] || "";
  return bookDir.replace(/_/g, " ");
}

function parseBcv(bcv: string) {
  const book = Number(bcv.slice(0, 2));
  const chap = Number(bcv.slice(2, 4));
  const verse = Number(bcv.slice(4, 6));
  return { book, chap, verse };
}

function ensureDir(path: string) {
  mkdirSync(path, { recursive: true });
}

async function main() {
  const repoRoot = resolve(process.cwd(), "..");
  const dataRoot = resolve(repoRoot, "bhsa_json");
  const sitePublic = resolve(process.cwd(), "public");

  const booksJsonPath = join(dataRoot, "books.json");
  let books: BookEntry[] = [];
  try {
    books = JSON.parse(readFileSync(booksJsonPath, "utf8"));
  } catch {}

  const pattern = join(dataRoot, "**/*_chapter_*.json").replace(/\\/g, "/");
  const files = await fg(pattern, { dot: false, onlyFiles: true });

  const rows: Row[] = [];
  for (const file of files) {
    const raw = readFileSync(file, "utf8");
    let chapter: ChapterJson;
    try {
      chapter = JSON.parse(raw);
    } catch {
      continue;
    }
    const bookName = getBookNameFromPath(file);

    for (const verseNo of Object.keys(chapter)) {
      const verseTokens = chapter[verseNo];
      for (let i = 0; i < verseTokens.length; i++) {
        const tok = verseTokens[i];
        const tag = tok.pos_tag || {};
        const vt = tag.vt as string | undefined;
        if (vt !== "ptca" && vt !== "ptcp") continue;

        const vs = tag.vs as string | undefined;
        const usage = usageFromPdp(tag.pdp);
        const voice: Row["voice"] = vt === "ptcp" ? "passive" : "active";
        const hasArticle = verseTokens[i - 1]?.pos_tag?.pdp === "art";
        const negated = verseTokens[i - 1]?.pos_tag?.pdp === "nega";

        const precededBy: Row["precededBy"] = [];
        const prev = verseTokens[i - 1]?.pos_tag?.pdp;
        if (prev === "prep") precededBy.push("prep");
        if (prev === "conj") precededBy.push("conj");
        if (prev === "art") precededBy.push("art");
        if (prev === "nega") precededBy.push("nega");

        const prepLetters: string[] = [];
        if (prev === "prep") {
          const wf = verseTokens[i - 1]?.word_forms?.[1] || verseTokens[i - 1]?.word_forms?.[0] || "";
          if (wf) prepLetters.push(wf.trim()[0] || "");
        }

        const wfPointed = tok.word_forms?.[1] || tok.word_forms?.[0] || "";
        const wfUnpointed = tok.word_forms?.[2] || tok.word_forms?.[3] || wfPointed;

        const bcv = tok.book_chapter_verse || "";
        const { book, chap, verse } = parseBcv(bcv);

        const bookNameEnglish = books[book - 1]?.english || bookName;

        rows.push({
          bookCode: book,
          bookName: bookNameEnglish,
          chapter: chap,
          verse,
          bcv,
          ref: `${bookNameEnglish} ${chap}:${verse}`,
          binyan: prettyBinyan(vs),
          voice,
          usage,
          gender: tag.gn,
          number: tag.nu,
          hasArticle,
          negated,
          precededBy,
          prepLetters,
          wordUnpointed: wfUnpointed.trim(),
          wordPointed: wfPointed.trim(),
          gloss: tok.gloss,
        });
      }
    }
  }

  // Aggregates
  const aggByBinyan: Record<string, { active: number; passive: number }> = {};
  const aggByUsage: Record<string, number> = {};
  const aggByBookBinyan: Record<string, Record<string, number>> = {};
  const aggGenderNumber: Record<string, Record<string, number>> = {};
  const prefixContext: Record<string, number> = {};
  const negByBinyan: Record<string, { neg: number; total: number }> = {};
  const defByUsage: Record<string, { def: number; total: number }> = {};

  for (const r of rows) {
    aggByBinyan[r.binyan] ||= { active: 0, passive: 0 };
    aggByBinyan[r.binyan][r.voice]++;

    aggByUsage[r.usage] = (aggByUsage[r.usage] || 0) + 1;

    (aggByBookBinyan[r.bookName] ||= {});
    aggByBookBinyan[r.bookName][r.binyan] = (aggByBookBinyan[r.bookName][r.binyan] || 0) + 1;

    const gn = r.gender || "?";
    const nu = r.number || "?";
    (aggGenderNumber[gn] ||= {});
    aggGenderNumber[gn][nu] = (aggGenderNumber[gn][nu] || 0) + 1;

    for (const k of r.precededBy) {
      const key = k;
      prefixContext[key] = (prefixContext[key] || 0) + 1;
    }

    const nb = (negByBinyan[r.binyan] ||= { neg: 0, total: 0 });
    nb.total++;
    if (r.negated) nb.neg++;

    const du = (defByUsage[r.usage] ||= { def: 0, total: 0 });
    du.total++;
    if (r.hasArticle) du.def++;
  }

  const outBase = join(sitePublic, "data");
  ensureDir(outBase);
  ensureDir(join(outBase, "agg"));
  ensureDir(join(outBase, "meta"));

  writeFileSync(join(outBase, "participles.rows.json"), JSON.stringify({ rows }, null, 2));
  writeFileSync(join(outBase, "agg", "by_binyan.json"), JSON.stringify(aggByBinyan, null, 2));
  writeFileSync(join(outBase, "agg", "by_usage.json"), JSON.stringify(aggByUsage, null, 2));
  writeFileSync(join(outBase, "agg", "by_book_binyan.json"), JSON.stringify(aggByBookBinyan, null, 2));
  writeFileSync(join(outBase, "agg", "gender_number.json"), JSON.stringify(aggGenderNumber, null, 2));
  writeFileSync(join(outBase, "agg", "prefix_context.json"), JSON.stringify(prefixContext, null, 2));
  writeFileSync(join(outBase, "agg", "negation_by_binyan.json"), JSON.stringify(negByBinyan, null, 2));
  writeFileSync(join(outBase, "agg", "definiteness_by_usage.json"), JSON.stringify(defByUsage, null, 2));
  writeFileSync(join(outBase, "meta", "summary.json"), JSON.stringify({ totalRows: rows.length }, null, 2));

  // eslint-disable-next-line no-console
  console.log(`Wrote ${rows.length} rows and aggregates to ${outBase}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


