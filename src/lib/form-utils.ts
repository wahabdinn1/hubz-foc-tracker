import { REQUESTORS, FOC_TYPES } from "./constants"

export interface ResolvedRequestor {
    requestor: string
    customRequestor: string
}

export function resolveRequestorWithFallback(rawRequestor: string): ResolvedRequestor {
    if (!rawRequestor) return { requestor: "", customRequestor: "" }
    const predefined = REQUESTORS.filter(r => r !== "Other")
    const matched = predefined.find(r => r.toLowerCase() === rawRequestor.toLowerCase())
    if (matched) return { requestor: matched, customRequestor: "" }
    return { requestor: "Other", customRequestor: rawRequestor }
}

export function resolveFocTypeWithMatch(rawFocType: string): string {
    if (!rawFocType || rawFocType === "-") return ""
    const mappedType = rawFocType.toUpperCase()
    const matched = [...FOC_TYPES].find(f => f === mappedType)
    return matched || mappedType
}
