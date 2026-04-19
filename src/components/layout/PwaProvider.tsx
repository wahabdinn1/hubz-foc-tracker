"use client";

import { useEffect } from "react";

export function PwaProvider() {
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            window.addEventListener("load", () => {
                navigator.serviceWorker.register("/sw.js").then(
                    (registration) => {
                        console.warn("Service Worker registration successful with scope: ", registration.scope);
                    },
                    (err) => {
                        console.error("Service Worker registration failed: ", err);
                    }
                );
            });
        }
    }, []);

    return null;
}
