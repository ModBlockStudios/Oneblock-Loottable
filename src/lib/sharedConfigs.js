/*
 * Chargement des configs partagées depuis le repo (dossier public/data/configs).
 * L'index (généré au build) liste les fichiers ; on récupère chacun d'eux.
 * Toute erreur (réseau, fichier absent, JSON invalide) est ignorée : on renvoie
 * ce qu'on a pu charger, sans jamais casser l'app.
 */
export async function fetchSharedConfigs(baseUrl) {
  const dir = baseUrl + 'data/configs/';
  let files;
  try {
    const res = await fetch(dir + 'index.json', { cache: 'no-cache' });
    if (!res.ok) return [];
    files = await res.json();
  } catch (e) {
    return [];
  }
  if (!Array.isArray(files)) return [];

  const loaded = await Promise.all(
    files.map(async (file) => {
      try {
        const res = await fetch(dir + encodeURIComponent(file), { cache: 'no-cache' });
        if (!res.ok) return null;
        const data = await res.json();
        return { file, data };
      } catch (e) {
        return null;
      }
    })
  );
  return loaded.filter(Boolean);
}
