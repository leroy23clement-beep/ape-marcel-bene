export function parseWhatsAppExport(fileContent: string) {
  const lines = fileContent.split(/\r?\n/)
  
  let totalMessages = 0
  let aperoCount = 0
  let citeCount = 0
  let totalEmojis = 0
  let questionCount = 0

  const userMessageCount: { [key: string]: number } = {}
  const userEmojiCount: { [key: string]: number } = {}
  const aperoWordCount: { [key: string]: number } = {
    'apéro / apero': 0,
    'bière / biere': 0,
    'verre / tournée': 0,
    'pinard / vin': 0,
    'pastis': 0
  }

  // Regex ciblée : Ignore la date/heure au début et capture ce qui se trouve entre le tiret/espace et les deux-points ":" de l'auteur
  const regexWhatsApp = /(?:\[?\d{2}\/\d{2}\/\d{2,4},?\s*\d{2}:\d{2}(?::\d{2})?\]?)\s*(?:[-–]\s*)?([^:]+):\s*(.*)$/
  const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{2600}-\u{26FF}]/gu;

  // Mot entier, accents et apostrophes compris : évite que « capacité » compte
  // comme « cité » ou que « apéritif » compte comme « apéro ».
  const wordPatternCache = new Map<string, RegExp>()
  function wordPattern(word: string): RegExp {
    const cached = wordPatternCache.get(word)
    if (cached) return cached
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'iu')
    wordPatternCache.set(word, pattern)
    return pattern
  }

  for (const line of lines) {
    const match = line.match(regexWhatsApp)
    if (match && match[1] && match[2]) {
      const author = match[1].trim()
      const content = match[2].toLowerCase()
      const rawContent = match[2]

      // Filtrer les messages système ou les faux auteurs
      if (
        !author || 
        author.length > 30 || 
        author.includes('/') || 
        author.includes(':') || 
        author.toLowerCase().includes('code') ||
        author.toLowerCase().includes('chiffrés')
      ) {
        continue
      }

      totalMessages++

      // 1. Comptage par utilisateur
      userMessageCount[author] = (userMessageCount[author] || 0) + 1

      // 2. Comptage "Apéro" et variantes
      // Mots entiers seulement : « apéritif » ne doit pas compter comme « apéro »,
      // sinon les statistiques sont faussées (voir la revue de code).
      const hasWord = (word: string) => wordPattern(word).test(content)

      if (hasWord('apéro') || hasWord('apero')) {
        aperoCount++
        aperoWordCount['apéro / apero']++
      }
      if (hasWord('bière') || hasWord('biere')) {
        aperoCount++
        aperoWordCount['bière / biere']++
      }
      if (hasWord('verre') || hasWord('tournée') || hasWord('tournee')) {
        aperoCount++
        aperoWordCount['verre / tournée']++
      }
      if (hasWord('pinard') || hasWord('vin')) {
        aperoCount++
        aperoWordCount['pinard / vin']++
      }
      if (hasWord('pastis')) {
        aperoCount++
        aperoWordCount['pastis']++
      }

      // 3. Mentions de l'école
      // « cité » en mot entier : « capacité », « publicité » ne doivent pas compter.
      if (hasWord('cité') || hasWord('cite') || hasWord('ecole') || hasWord('école')) {
        citeCount++
      }

      // 4. Questions
      if (rawContent.includes('?')) {
        questionCount++
      }

      // 5. Comptage des emojis
      const emojisInMessage = rawContent.match(emojiRegex)
      if (emojisInMessage) {
        totalEmojis += emojisInMessage.length
        userEmojiCount[author] = (userEmojiCount[author] || 0) + emojisInMessage.length
      }
    }
  }

  // --- CALCULS DES TOP 3 ---
  const topBavardsList = Object.entries(userMessageCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }))

  const topEmojiUsersList = Object.entries(userEmojiCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }))

  const topAperoWordsList = Object.entries(aperoWordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([keyword, count]) => ({ keyword, count }))

  const topBavard = topBavardsList[0] || { name: 'Personne', count: 0 }
  const topEmojiUser = topEmojiUsersList[0] || { name: 'Personne', count: 0 }

  return {
    totalMessages,
    aperoCount,
    citeCount,
    totalEmojis,
    questionCount,
    topBavard,
    topEmojiUser,
    topBavardsList,
    topEmojiUsersList,
    topAperoWordsList,
  }
}