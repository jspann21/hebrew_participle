export default function DataPage() {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Data</h1>
      <ul className="list-disc pl-6">
        <li>
          <a className="underline" href={`${base}/data/participles.rows.json`}>participles.rows.json</a>
        </li>
        <li>
          <a className="underline" href={`${base}/data/agg/by_binyan.json`}>agg/by_binyan.json</a>
        </li>
        <li>
          <a className="underline" href={`${base}/data/agg/by_usage.json`}>agg/by_usage.json</a>
        </li>
        <li>
          <a className="underline" href={`${base}/data/agg/by_book_binyan.json`}>agg/by_book_binyan.json</a>
        </li>
        <li>
          <a className="underline" href={`${base}/data/agg/gender_number.json`}>agg/gender_number.json</a>
        </li>
        <li>
          <a className="underline" href={`${base}/data/agg/prefix_context.json`}>agg/prefix_context.json</a>
        </li>
        <li>
          <a className="underline" href={`${base}/data/agg/negation_by_binyan.json`}>agg/negation_by_binyan.json</a>
        </li>
        <li>
          <a className="underline" href={`${base}/data/agg/definiteness_by_usage.json`}>agg/definiteness_by_usage.json</a>
        </li>
        <li>
          <a className="underline" href={`${base}/data/meta/summary.json`}>meta/summary.json</a>
        </li>
      </ul>
    </div>
  );
}


