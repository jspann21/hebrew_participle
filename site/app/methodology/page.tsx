export default function Methodology() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Methodology</h1>
      <p className="mb-2">We extract participles where <code>pos_tag.vt</code> ∈ {'{"ptca","ptcp"}'}.</p>
      <p className="mb-2">Stem (binyan) comes from <code>pos_tag.vs</code>. Usage class maps <code>pdp</code> to verbal/adjectival/substantive.</p>
      <p className="mb-2">Gender and number are <code>pos_tag.gn</code> and <code>pos_tag.nu</code> when present.</p>
      <p className="mb-2">Article/negation/preposition/conjunction are detected from immediately-preceding tokens within the verse.</p>
      <p className="mb-2">Full dataset and aggregates are downloadable from the Data page.</p>
    </div>
  );
}


