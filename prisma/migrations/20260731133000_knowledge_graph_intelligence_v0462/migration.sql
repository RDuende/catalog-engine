CREATE INDEX IF NOT EXISTS kg_entities_search_idx ON kg_entities USING gin (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(key,'') || ' ' || coalesce(slug,'')));
CREATE INDEX IF NOT EXISTS kg_aliases_search_idx ON kg_aliases USING gin (to_tsvector('simple', coalesce(alias_normalized,'')));
CREATE INDEX IF NOT EXISTS kg_product_links_relation_idx ON kg_product_links(relation_type, entity_id, canonical_product_id);
CREATE INDEX IF NOT EXISTS kg_relations_type_idx ON kg_relations(type, source_id, target_id);
