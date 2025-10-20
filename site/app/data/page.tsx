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
        <li className="mt-4 font-semibold">New aggregates</li>
        <li><a className="underline" href={`${base}/data/agg/state_by_usage.json`}>agg/state_by_usage.json</a></li>
        <li><a className="underline" href={`${base}/data/agg/prefix_combo_by_binyan.json`}>agg/prefix_combo_by_binyan.json</a></li>
        <li><a className="underline" href={`${base}/data/agg/person_distribution.json`}>agg/person_distribution.json</a></li>
        <li><a className="underline" href={`${base}/data/agg/relative_by_binyan.json`}>agg/relative_by_binyan.json</a></li>
        <li><a className="underline" href={`${base}/data/agg/et_marker_by_binyan.json`}>agg/et_marker_by_binyan.json</a></li>
        <li><a className="underline" href={`${base}/data/agg/prep_type_by_binyan.json`}>agg/prep_type_by_binyan.json</a></li>
        <li><a className="underline" href={`${base}/data/agg/position_bins.json`}>agg/position_bins.json</a></li>
        <li><a className="underline" href={`${base}/data/agg/following_pos.json`}>agg/following_pos.json</a></li>
      </ul>
    </div>
  );
}


