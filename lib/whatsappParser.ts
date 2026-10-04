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
  const emojiCountMap: { [key: string]: number } = {}

  // Utilisation de la regex d'origine qui fonctionnait pour tes compteurs
  const regexWhatsApp = /^\[?(\d{2}\/\d{2}\/\d{2,4}),?\s*(\d{2}:\d{2})(?::\d{2})?\]?\s*([^:-]+)[:|-]\s*(.*)$/
  const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{2600}-\u{26FF}]/gu;

  for (const line of lines) {
    const match = line.match(regexWhatsApp)
    if (match) {
      totalMessages++
      const author = match[3].trim()
      const content = match[4].toLowerCase()
      const rawContent = match[4]

      // 1. Comptage par utilisateur
      userMessageCount[author] = (userMessageCount[author] || 0) + 1

      // 2. Comptage "Apéro" et variantes
      if (content.includes('apéro') || content.includes('apero')) {
        aperoCount++
        aperoWordCount['apéro / apero']++
      }
      if (content.includes('bière') || content.includes('biere')) {
        aperoCount++
        aperoWordCount['bière / biere']++
      }
      if (content.includes('verre') || content.includes('tournée') || content.includes('tournee')) {
        aperoCount++
        aperoWordCount['verre / tournée']++
      }
      if (content.includes('pinard') || content.includes('vin')) {
        aperoCount++
        aperoWordCount['pinard / vin']++
      }
      if (content.includes('pastis')) {
        aperoCount++
        aperoWordCount['pastis']++
      }

      // 3. Mentions de l'école
      if (content.includes('cité') || content.includes('cite') || content.includes('ecole') || content.includes('école')) {
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
        emojisInMessage.forEach((emoji) => {
          emojiCountMap[emoji] = (emojiCountMap[emoji] || 0) + 1
        })
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