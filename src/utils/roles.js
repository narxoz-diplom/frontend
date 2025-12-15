// Утилита для работы с ролями из Keycloak токена

export const getRoles = (keycloak) => {
  if (!keycloak || !keycloak.tokenParsed) {
    return []
  }
  
  const allRoles = []
  
  // Получаем роли из realm_access (realm roles)
  const realmAccess = keycloak.tokenParsed.realm_access
  if (realmAccess && realmAccess.roles) {
    allRoles.push(...realmAccess.roles)
  }
  
  // Получаем роли из resource_access (client roles)
  const resourceAccess = keycloak.tokenParsed.resource_access
  if (resourceAccess && resourceAccess['microservices-client']) {
    const clientRoles = resourceAccess['microservices-client'].roles
    if (clientRoles) {
      allRoles.push(...clientRoles)
    }
  }
  
  return allRoles
}

export const hasRole = (keycloak, role) => {
  const roles = getRoles(keycloak)
  return roles.includes(role) || roles.includes(role.replace('ROLE_', ''))
}

export const isAdmin = (keycloak) => {
  return hasRole(keycloak, 'admin') || hasRole(keycloak, 'ROLE_ADMIN')
}

export const isTeacher = (keycloak) => {
  return hasRole(keycloak, 'teacher') || hasRole(keycloak, 'ROLE_TEACHER')
}

export const isClient = (keycloak) => {
  return hasRole(keycloak, 'client') || hasRole(keycloak, 'ROLE_CLIENT')
}

export const canUpload = (keycloak) => {
  return isAdmin(keycloak) || isTeacher(keycloak)
}

export const canDelete = (keycloak) => {
  return isAdmin(keycloak)
}

export const canView = (keycloak) => {
  return isAdmin(keycloak) || isTeacher(keycloak) || isClient(keycloak)
}



