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
  const userAperoCount: { [key: string]: number } = {}
  const userEmojiCount: { [key: string]: number } = {}
  const emojiCountMap: { [key: string]: number } = {}
  
  let longestMessage = { author: 'Personne', text: '', length: 0 }

  // Regex classique pour les exports WhatsApp
  const regexWhatsApp = /^\[?(\d{2}\/\d{2}\/\d{2,4}),?\s*(\d{2}:\d{2})(?::\d{2})?\]?\s*([^:-]+)[:|-]\s*(.*)$/
  const emojiRegex = /[\p{Extended_Pictographic}/u]g

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

      // 3. Comptage "Apéro" / "Bière" etc.
      if (['apéro', 'apero', 'bière', 'biere', 'pastis', 'vin'].some(word => content.includes(word))) {
        aperoCount++
        userAperoCount[author] = (userAperoCount[author] || 0) + 1
      }

      // 4. Comptage du mot "cité"
      if (content.includes('cité') || content.includes('cite')) {
        citeCount++
      }

      // 5. Questions en série
      if (rawContent.includes('?')) {
        questionCount++
      }

      // 6. Messages en majuscules (s'il y a plus de 5 caractères et que le texte est en uppercase)
      if (rawContent.length > 5 && rawContent === rawContent.toUpperCase() && /[A-Z]/.test(rawContent)) {
        shoutCount++
      }

      // 7. Le pavé d'or (message le plus long)
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

  // Trouver le plus gros bavard
  let topBavard = { name: 'Personne', count: 0 }
  for (const [author, count] of Object.entries(userMessageCount)) {
    if (count > topBavard.count) {
      topBavard = { name: author, count }
    }
  }

  // Trouver le roi/reine des emojis
  let topEmojiUser = { name: 'Personne', count: 0 }
  for (const [author, count] of Object.entries(userEmojiCount)) {
    if (count > topEmojiUser.count) {
      topEmojiUser = { name: author, count }
    }
  }

  // Trier les emojis les plus utilisés
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
    longestMessage,
    topEmojis,
  }
}