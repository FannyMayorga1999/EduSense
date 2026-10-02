import { api } from '@/services/http'
import type { MenuNode } from '@/types'

/**
 * Menu API calls (navigation tree).
 *
 * @author Fanny Mayorga | @date 27-09-2026
 */

/**
 * Fetches the permission-filtered navigation tree.
 */
export async function fetchMenus(): Promise<MenuNode[]> {
  const { data } = await api.get<{ data: MenuNode[] }>('/v1/menus')

  return data.data
}