"use client"

export function useScrollToFirstError() {
    return function onInvalid(errors: Record<string, { message?: string }>) {
        const firstErrorName = Object.keys(errors)[0]
        const element = document.getElementsByName(firstErrorName)[0]
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" })
            element.focus()
        }
    }
}
