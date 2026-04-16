export function updateParam(
    params: URLSearchParams,
    key: string,
    value: string | null
): string {
    const next = new URLSearchParams(params.toString())
    if (value === null || value === "" || value === "master-list") {
        next.delete(key)
    } else {
        next.set(key, value)
    }
    const str = next.toString()
    return str ? `?${str}` : ""
}

const TAB_MAP: Record<string, string> = {
    master: "master-list",
    models: "device-models",
    campaigns: "campaigns",
}

const TAB_REVERSE: Record<string, string> = {
    "master-list": "master",
    "device-models": "models",
    campaigns: "campaigns",
}

export function tabToUrl(tab: string): string {
    return TAB_MAP[tab] || tab
}

export function urlToTab(urlTab: string): string {
    return TAB_REVERSE[urlTab] || urlTab
}
