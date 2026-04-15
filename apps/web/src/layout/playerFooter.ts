import { useMediaQuery, useTheme } from '@mui/material'

/** Single-row player (md+). */
export const PLAYER_FOOTER_MD_PX = 104

/** Stacked player (phones): content area; safe-area added on main scroll area only. */
/** Stacked player: queue and volume share one row → less vertical minimum than two rows. */
export const PLAYER_FOOTER_XS_PX = 228

export function usePlayerFooterReservePx(): number {
  const theme = useTheme()
  const isStackedPlayer = useMediaQuery(theme.breakpoints.down('md'))
  return isStackedPlayer ? PLAYER_FOOTER_XS_PX : PLAYER_FOOTER_MD_PX
}
