function findEntityById_(entities, id) {
  const idNorm = String(id || "").trim();
  if (!idNorm) return null;

  return entities.find(entity => String(entity.id || "").trim() === idNorm) || null;
}