// Liste de départ des habitants (sera complétée par le script de données).
// ext : extension requise.
export const VILLAGERS = [
  ['mickey', 'Mickey'], ['minnie', 'Minnie'], ['dingo', 'Dingo'], ['donald', 'Donald'],
  ['remy', 'Rémy'], ['merlin', 'Merlin'], ['elsa', 'Elsa'], ['anna', 'Anna'], ['kristoff', 'Kristoff'],
  ['vaiana', 'Vaiana'], ['maui', 'Maui'], ['scar', 'Scar'], ['ursula', 'Ursula'], ['walle', 'WALL-E'],
  ['mirabel', 'Mirabel'], ['simba', 'Simba'], ['nala', 'Nala'], ['stitch', 'Stitch'], ['belle', 'Belle'],
  ['bete', 'La Bête'], ['gothel', 'Mère Gothel'], ['raiponce', 'Raiponce'], ['buzz', 'Buzz l’Éclair'],
  ['woody', 'Woody'], ['jack', 'Jack Skellington'], ['oswald', 'Oswald'], ['vanellope', 'Vanellope'],
  ['ariel', 'Ariel'], ['eric', 'Éric'], ['mulan', 'Mulan'], ['mushu', 'Mushu'], ['cruella', 'Cruella', 'ranch']
].map(([id, name, ext]) => ({ id, name, ext: ext || null }));
