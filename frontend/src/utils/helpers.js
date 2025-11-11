/**
 * Get display name for a user
 * Priority: display_name > extracted from email
 */
export const getDisplayName = (user) => {
  // If user has display_name set, use it
  if (user?.display_name) {
    return user.display_name
  }
  
  // Otherwise, extract from email
  if (user?.email) {
    return getDisplayNameFromEmail(user.email)
  }
  
  return 'User'
}

/**
 * Extract display name from email (fallback)
 * Only splits by dots, underscores, and camelCase
 */
export const getDisplayNameFromEmail = (email) => {
  if (!email) return 'User'
  
  let username = email.split('@')[0]
  username = username.replace(/\d+$/, '')
  
  let parts = []
  const dotUnderscoreParts = username.split(/[._]/).filter(part => part.length > 0)
  
  dotUnderscoreParts.forEach(part => {
    const camelParts = part.split(/(?=[A-Z])/).filter(p => p.length > 0)
    parts.push(...camelParts)
  })
  
  if (parts.length === 0) {
    parts = [username]
  }
  
  const capitalizedParts = parts.map(part => 
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  )
  
  return capitalizedParts.join(' ') || 'User'
}

/**
 * Get user initials
 */
export const getUserInitials = (user) => {
  const displayName = getDisplayName(user)
  const nameParts = displayName.split(' ')
  
  if (nameParts.length >= 2) {
    return nameParts[0][0].toUpperCase() + nameParts[1][0].toUpperCase()
  }
  
  return displayName[0].toUpperCase()
}

// Backward compatibility
export const getUserInitialsFromEmail = (email) => {
  return getUserInitials({ email })
}