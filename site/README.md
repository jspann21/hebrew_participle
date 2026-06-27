# BHSA Participle Explorer

BHSA Participle Explorer is a small research interface for examining participial forms across the BHSA corpus. It gathers 9,701 participle rows into a searchable table, summary cards, chart views, and downloadable JSON data.

The site is organized around questions about how participles behave across stem, voice, usage, book, morphology, and local syntactic context.

## What the Site Contains

### Overview

The landing page gives a quick corpus snapshot:

- total participles: 9,701
- verbal participles: 5,667
- substantive participles: 3,249
- adjectival participles: 785
- active/passive distribution by binyan

### Explorer

The Explorer page is the main row-level search tool. It shows individual participle occurrences with reference, pointed form, binyan, voice, usage class, state, person, prefixes, gender, and number.

Rows can be filtered by:

- book
- binyan
- active or passive voice
- verbal, adjectival, or substantive usage
- state
- person
- definiteness
- negation
- relative-clause association
- preceding object marker
- Hebrew word form or gloss search

The table displays up to the first 500 matching rows so broad searches remain usable.

### Visualizations

The Visualizations page turns the aggregate data into charts for comparison and pattern finding. Current views include:

- Binyan by voice
- usage distribution
- book by binyan heatmap
- gender by number
- prefix context prevalence
- negation rate by binyan
- definiteness by usage
- state by usage
- prefix combinations by binyan
- person distribution
- relative-clause association by binyan
- object marker before participle by binyan
- preposition initial letter by binyan
- position in verse by quartile
- following part of speech after the participle

### Data

The Data page exposes the row dataset and aggregate files as JSON. The main file is `participles.rows.json`; aggregate files cover binyan, usage, book, gender/number, prefixes, negation, definiteness, state, person, relative clauses, object markers, verse position, and following part of speech.

### Methodology

The Methodology page summarizes how rows are identified and labeled:

- participles are extracted from BHSA rows where `pos_tag.vt` is `ptca` or `ptcp`
- binyan comes from `pos_tag.vs`
- usage class is mapped from `pdp`
- gender and number come from `pos_tag.gn` and `pos_tag.nu` when present
- article, negation, preposition, and conjunction context are detected from immediately preceding tokens within the same verse

## What It Helps Investigate

This interface is intended for comparing participial patterns such as:

- whether particular binyanim favor active or passive participles
- how participles are distributed across biblical books
- where verbal, adjectival, and substantive uses diverge
- how often participles appear with articles, negation, prefixes, or object markers
- whether local context differs by stem, usage, or morphology

The goal is not to replace close reading, but to make corpus-scale patterns easier to find before returning to individual passages.
