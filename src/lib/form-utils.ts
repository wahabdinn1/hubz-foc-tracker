import { FOC_TYPES } from "./constants"

export function resolveFocTypeWithMatch(rawFocType: string): string {
    if (!rawFocType || rawFocType === "-") return ""
    const mappedType = rawFocType.toUpperCase()
    const matched = [...FOC_TYPES].find(f => f === mappedType)
    return matched || mappedType
}
