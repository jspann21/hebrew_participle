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
  state?: "absolute" | "construct" | "unknown";
  person?: "1" | "2" | "3" | "unknown";
  hasArticle: boolean;
  negated: boolean;
  precededBy: Array<"prep" | "conj" | "art" | "nega">;
  prepLetters: string[];
  prefixChain: string[]; // e.g., ["conj","prep","art"] from left->right
  prefixLettersChain: string[]; // e.g., ["ו","ב","ה"]
  relativeClause: boolean; // preceding אשר
  objectMarkerBefore: boolean; // preceding את
  positionInVerse: number; // 0-based index
  verseTokenCount: number;
  precedingPdp?: string;
  followingPdp?: string;
  followingIsNounAfterConstruct?: boolean;
  wordUnpointed: string;
  wordPointed: string;
  gloss?: string;
  freqLex?: number;
  freqOcc?: number;
  languageStatus?: string;
  mitchel?: string;
  bookGroup?: "Torah" | "Prophets" | "Writings" | "Unknown";
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

function mapState(st?: string): Row["state"] {
  if (!st) return "unknown";
  if (st === "a") return "absolute";
  if (st === "c") return "construct";
  return "unknown";
}

function mapPerson(ps?: string): Row["person"] {
  if (!ps) return "unknown";
  if (ps === "p1") return "1";
  if (ps === "p2") return "2";
  if (ps === "p3") return "3";
  return "unknown";
}

const cliticSet = new Set(["prep", "conj", "art", "nega"]);

function collectPrefixChain(tokens: Token[], idx: number) {
  const chain: { pdp: string; wfPointed: string; wfUnpointed: string; gloss?: string }[] = [];
  for (let j = idx - 1; j >= 0; j--) {
    const t = tokens[j];
    const p = t?.pos_tag?.pdp as string | undefined;
    if (!p || !cliticSet.has(p)) break;
    const wfPointed = t.word_forms?.[1] || t.word_forms?.[0] || "";
    const wfUnpointed = t.word_forms?.[2] || t.word_forms?.[3] || wfPointed;
    chain.push({ pdp: p, wfPointed: wfPointed.trim(), wfUnpointed: wfUnpointed.trim(), gloss: t.gloss });
  }
  chain.reverse();
  return chain;
}

function firstLetterHebrew(s: string): string {
  const trimmed = s.trim();
  return trimmed ? trimmed[0] : "";
}

function mapBookGroup(name: string): Row["bookGroup"] {
  const torah = new Set(["Genesis","Exodus","Leviticus","Numeri","Deuteronomium"]);
  const former = new Set(["Josua","Judices","Samuel I","Samuel II","Reges I","Reges II"]);
  const latter = new Set(["Jesaia","Jeremia","Ezechiel"]);
  const twelve = new Set(["Hosea","Joel","Amos","Obadia","Jona","Micha","Nahum","Habakuk","Zephania","Haggai","Sacharia","Maleachi"]);
  const writings = new Set(["Psalmi","Proverbia","Iob","Ruth","Canticum","Ecclesiastes","Threni","Esther","Daniel","Esra","Nehemia","Chronica I","Chronica II"]);
  if (torah.has(name)) return "Torah";
  if (former.has(name) || latter.has(name) || twelve.has(name)) return "Prophets";
  if (writings.has(name)) return "Writings";
  return "Unknown";
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
        const chain = collectPrefixChain(verseTokens, i);
        const hasArticle = chain.some(c => c.pdp === "art");
        const negated = chain.some(c => c.pdp === "nega");

        const precededBy: Row["precededBy"] = Array.from(new Set(chain.map(c => c.pdp))) as Row["precededBy"];

        const prepLetters: string[] = chain.filter(c => c.pdp === "prep").map(c => firstLetterHebrew(c.wfPointed || c.wfUnpointed)).filter(Boolean);
        const prefixLettersChain: string[] = chain.map(c => {
          if (c.pdp === "art") return "ה";
          if (c.pdp === "conj") return "ו";
          if (c.pdp === "nega") return firstLetterHebrew(c.wfPointed || c.wfUnpointed) || "ל"; // לא / אל
          return firstLetterHebrew(c.wfPointed || c.wfUnpointed);
        }).filter(Boolean);
        const prefixChain = chain.map(c => c.pdp);

        const relativeClause = chain.some(c => (c.gloss || "").includes("<relative>") || c.wfUnpointed.includes("אשר") || c.wfPointed.includes("אֲשֶׁר"));
        const objectMarkerBefore = chain.some(c => (c.gloss || "").includes("object marker") || c.wfUnpointed === "את");

        const wfPointed = tok.word_forms?.[1] || tok.word_forms?.[0] || "";
        const wfUnpointed = tok.word_forms?.[2] || tok.word_forms?.[3] || wfPointed;

        const bcv = tok.book_chapter_verse || "";
        const { book, chap, verse } = parseBcv(bcv);

        const bookNameEnglish = books[book - 1]?.english || bookName;
        const bookGroup = mapBookGroup(bookNameEnglish);

        const precedingPdp = verseTokens[i - 1]?.pos_tag?.pdp as string | undefined;
        const followingPdp = verseTokens[i + 1]?.pos_tag?.pdp as string | undefined;
        const followingIsNounAfterConstruct = mapState(tag.st) === "construct" && (verseTokens[i + 1]?.pos_tag?.pdp === "subs");

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
          state: mapState(tag.st),
          person: mapPerson(tag.ps),
          hasArticle,
          negated,
          precededBy,
          prepLetters,
          prefixChain,
          prefixLettersChain,
          relativeClause,
          objectMarkerBefore,
          positionInVerse: i,
          verseTokenCount: verseTokens.length,
          precedingPdp,
          followingPdp,
          followingIsNounAfterConstruct,
          wordUnpointed: wfUnpointed.trim(),
          wordPointed: wfPointed.trim(),
          gloss: tok.gloss,
          freqLex: (tok as any).freq_lex,
          freqOcc: (tok as any).freq_occ,
          languageStatus: (tok as any).language_status,
          mitchel: (tok as any).mitchel,
          bookGroup,
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
  const stateByUsage: Record<string, Record<string, number>> = {};
  const prefixComboByBinyan: Record<string, Record<string, number>> = {};
  const personDist: Record<string, number> = {};
  const relativeByBinyan: Record<string, { rel: number; total: number }> = {};
  const etByBinyan: Record<string, { et: number; total: number }> = {};
  const prepTypeByBinyan: Record<string, Record<string, number>> = {};
  const positionBins: Record<string, number> = {};
  const followingPosDist: Record<string, number> = {};

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

    // state by usage
    const st = r.state || "unknown";
    (stateByUsage[r.usage] ||= {});
    stateByUsage[r.usage][st] = (stateByUsage[r.usage][st] || 0) + 1;

    // prefix combo by binyan
    const combo = r.prefixChain.join("+") || "none";
    (prefixComboByBinyan[r.binyan] ||= {});
    prefixComboByBinyan[r.binyan][combo] = (prefixComboByBinyan[r.binyan][combo] || 0) + 1;

    // person distribution
    const per = r.person || "unknown";
    personDist[per] = (personDist[per] || 0) + 1;

    // relative clause
    const rb = (relativeByBinyan[r.binyan] ||= { rel: 0, total: 0 });
    rb.total++;
    if (r.relativeClause) rb.rel++;

    // object marker
    const eb = (etByBinyan[r.binyan] ||= { et: 0, total: 0 });
    eb.total++;
    if (r.objectMarkerBefore) eb.et++;

    // prep type by binyan (first prep letter or none)
    const prep = r.prepLetters[0] || "none";
    (prepTypeByBinyan[r.binyan] ||= {});
    prepTypeByBinyan[r.binyan][prep] = (prepTypeByBinyan[r.binyan][prep] || 0) + 1;

    // position bins (quartiles)
    const binCount = 4;
    const bin = r.verseTokenCount > 0 ? Math.min(binCount - 1, Math.floor((r.positionInVerse / r.verseTokenCount) * binCount)) : 0;
    const binKey = `Q${bin + 1}`;
    positionBins[binKey] = (positionBins[binKey] || 0) + 1;

    // following POS
    if (r.followingPdp) followingPosDist[r.followingPdp] = (followingPosDist[r.followingPdp] || 0) + 1;
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
  writeFileSync(join(outBase, "agg", "state_by_usage.json"), JSON.stringify(stateByUsage, null, 2));
  writeFileSync(join(outBase, "agg", "prefix_combo_by_binyan.json"), JSON.stringify(prefixComboByBinyan, null, 2));
  writeFileSync(join(outBase, "agg", "person_distribution.json"), JSON.stringify(personDist, null, 2));
  writeFileSync(join(outBase, "agg", "relative_by_binyan.json"), JSON.stringify(relativeByBinyan, null, 2));
  writeFileSync(join(outBase, "agg", "et_marker_by_binyan.json"), JSON.stringify(etByBinyan, null, 2));
  writeFileSync(join(outBase, "agg", "prep_type_by_binyan.json"), JSON.stringify(prepTypeByBinyan, null, 2));
  writeFileSync(join(outBase, "agg", "position_bins.json"), JSON.stringify(positionBins, null, 2));
  writeFileSync(join(outBase, "agg", "following_pos.json"), JSON.stringify(followingPosDist, null, 2));
  writeFileSync(join(outBase, "meta", "summary.json"), JSON.stringify({ totalRows: rows.length }, null, 2));

  // eslint-disable-next-line no-console
  console.log(`Wrote ${rows.length} rows and aggregates to ${outBase}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


