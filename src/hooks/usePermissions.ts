import { useAuth } from '@/contexts/AuthContext'
import { hasPermission } from '@/lib/constants'
import type { Permission } from '@/types'

export function usePermissions() {
  const { currentUser } = useAuth()

  function can(permission: Permission): boolean {
    if (!currentUser) return false
    return hasPermission(currentUser.role, permission)
  }

  function canAny(...permissions: Permission[]): boolean {
    return permissions.some((p) => can(p))
  }

  function canAll(...permissions: Permission[]): boolean {
    return permissions.every((p) => can(p))
  }

  return { can, canAny, canAll, role: currentUser?.role }
}
