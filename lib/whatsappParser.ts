export function parseWhatsAppExport(fileContent: string) {
  const lines = fileContent.split(/\r?\n/)
  
  let totalMessages = 0
  let aperoCount = 0
  let citeCount = 0
  let totalEmojis = 0
  let nightMessagesCount = 0 // Entre 23h et 5h
  let morningMessagesCount = 0 // Entre 5h et 7h30
  let questionCount = 0
  let shoutCount = 0 // Messages entièrement en majuscules

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
  
  let longestMessage = { author: 'Personne', text: '', length: 0 }

  // Regex classique pour les exports WhatsApp
  const regexWhatsApp = /^\[?(\d{2}\/\d{2}\/\d{2,4}),?\s*(\d{2}:\d{2})(?::\d{2})?\]?\s*([^:-]+)[:|-]\s*(.*)$/
  const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{2600}-\u{26FF}]/gu;

  for (const line of lines) {
    const match = line.match(regexWhatsApp)
    if (match) {
      totalMessages++
      const timeStr = match[2]
      const author = match[3].trim()
      const content = match[4].toLowerCase()
      const rawContent = match[4]

      // 1. Comptage par utilisateur
      userMessageCount[author] = (userMessageCount[author] || 0) + 1

      // 2. Analyse des horaires (Nocturnes vs Lève-tôt)
      const [hours, minutes] = timeStr.split(':').map(Number)
      const timeInMinutes = hours * 60 + minutes

      if (timeInMinutes >= 23 * 60 || timeInMinutes < 5 * 60) {
        nightMessagesCount++
      } else if (timeInMinutes >= 5 * 60 && timeInMinutes < 7.5 * 60) {
        morningMessagesCount++
      }

      // 3. Comptage "Apéro" et variantes
      if (content.includes('apéro') || content.includes('apero')) {
        aperoCount++
        aperoWordCount['apéro / apero'] = (aperoWordCount['apéro / apero'] || 0) + 1
      }
      if (content.includes('bière') || content.includes('biere')) {
        aperoCount++
        aperoWordCount['bière / biere'] = (aperoWordCount['bière / biere'] || 0) + 1
      }
      if (content.includes('verre') || content.includes('tournée') || content.includes('tournee')) {
        aperoCount++
        aperoWordCount['verre / tournée'] = (aperoWordCount['verre / tournée'] || 0) + 1
      }
      if (content.includes('pinard') || content.includes('vin')) {
        aperoCount++
        aperoWordCount['pinard / vin'] = (aperoWordCount['pinard / vin'] || 0) + 1
      }
      if (content.includes('pastis')) {
        aperoCount++
        aperoWordCount['pastis'] = (aperoWordCount['pastis'] || 0) + 1
      }

      // 4. Comptage des mentions de l'école (ex: nom de l'école ou mot clé)
      if (content.includes('cité') || content.includes('cite') || content.includes('ecole') || content.includes('école')) {
        citeCount++
      }

      // 5. Questions
      if (rawContent.includes('?')) {
        questionCount++
      }

      // 6. Messages en majuscules
      if (rawContent.length > 5 && rawContent === rawContent.toUpperCase() && /[A-Z]/.test(rawContent)) {
        shoutCount++
      }

      // 7. Le message le plus long
      if (rawContent.length > longestMessage.length) {
        longestMessage = { author, text: rawContent, length: rawContent.length }
      }

      // 8. Comptage des emojis
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

  // Top 3 des plus gros bavards
  const topBavardsList = Object.entries(userMessageCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }))

  // Top 3 des rois/reines des emojis
  const topEmojiUsersList = Object.entries(userEmojiCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }))

  // Top 3 des mots apéro / variantes
  const topAperoWordsList = Object.entries(aperoWordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([keyword, count]) => ({ keyword, count }))

  // Compatibilité rétroactive pour les anciens affichages
  const topBavard = topBavardsList[0] || { name: 'Personne', count: 0 }
  const topEmojiUser = topEmojiUsersList[0] || { name: 'Personne', count: 0 }

  // Trier les emojis les plus utilisés globalement
  const topEmojis = Object.entries(emojiCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return {
    totalMessages,
    aperoCount,
    citeCount,
    totalEmojis,
    nightMessagesCount,
    morningMessagesCount,
    questionCount,
    shoutCount,
    topBavard,
    topEmojiUser,
    topBavardsList,
    topEmojiUsersList,
    topAperoWordsList,
    longestMessage,
    topEmojis,
  }
}