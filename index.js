
/* =====================================================
   U9 ADMIN
   File: index.js

   Functions:
   1. Switch between PAGE1 and PAGE6
   2. Update active bottom button
   3. Open PAGE1 by default
   4. Check admin session through admin-me
   5. Expose admin authentication state

   Security:
   - Uses the public anon/publishable key
   - Never uses the service-role key in browser code
===================================================== */

(function () {
    "use strict";

    // Same-origin proxy avoids third-party-cookie restrictions.
    const ADMIN_ME_URL = "/api/admin-me";

    let adminSessionCheckPromise = null;

    /**
     * Get the public Supabase key.
     * Reuses the key exposed by the existing Supabase client
     * or admin-login.js configuration.
     */
    function getPublicKey() {
        const client = window.supabaseClient;

        const key =
            window.U9_SUPABASE_PUBLIC_KEY ||
            window.SUPABASE_ANON_KEY ||
            window.SUPABASE_PUBLISHABLE_KEY ||
            (client && client.supabaseKey) ||
            "";

        return typeof key === "string" ? key.trim() : "";
    }

    /**
     * Check the current administrator session using admin-me.
     *
     * Returns:
     * {
     *   authenticated: boolean,
     *   admin: { id, username } | null
     * }
     */
    async function checkAdminSession() {
        if (adminSessionCheckPromise) {
            return adminSessionCheckPromise;
        }

        adminSessionCheckPromise = (async function () {
            try {
                const publicKey = getPublicKey();

                if (!publicKey) {
                    console.error(
                        "[U9 Admin] Supabase public key is missing."
                    );

                    return {
                        authenticated: false,
                        admin: null
                    };
                }

                const response = await fetch(ADMIN_ME_URL, {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                    headers: {
                        "apikey": publicKey,
                        "Authorization": `Bearer ${publicKey}`
                    }
                });

                if (response.status === 401) {
                    return {
                        authenticated: false,
                        admin: null
                    };
                }

                const result = await response.json().catch(
                    function () {
                        return {};
                    }
                );

                if (
                    !response.ok ||
                    result.authenticated !== true ||
                    !result.admin
                ) {
                    console.warn(
                        "[U9 Admin] admin-me did not confirm a session.",
                        response.status
                    );

                    return {
                        authenticated: false,
                        admin: null
                    };
                }

                return {
                    authenticated: true,
                    admin: result.admin
                };

            } catch (error) {
                console.error(
                    "[U9 Admin] Failed to check admin session:",
                    error
                );

                return {
                    authenticated: false,
                    admin: null
                };
            } finally {
                adminSessionCheckPromise = null;
            }
        })();

        return adminSessionCheckPromise;
    }

    /**
     * Public method for other scripts to check the session.
     */
    window.U9AdminCheckSession = checkAdminSession;

    /**
     * Public admin state.
     * Updated after each successful session check.
     */
    window.U9AdminAuth = {
        authenticated: false,
        admin: null
    };

    /**
     * Refresh the public authentication state.
     */
    async function refreshAdminAuthState() {
        const result = await checkAdminSession();

        window.U9AdminAuth.authenticated =
            result.authenticated;

        window.U9AdminAuth.admin =
            result.admin;

        window.dispatchEvent(
            new CustomEvent("u9-admin-auth-changed", {
                detail: {
                    authenticated: result.authenticated,
                    admin: result.admin
                }
            })
        );

        return result;
    }

    window.U9AdminRefreshAuthState = refreshAdminAuthState;

    /**
     * Initialize page navigation.
     */
    function initAdminNavigation() {
        const nav = document.getElementById(
            "U9-admin-bottom-nav"
        );

        const main = document.getElementById(
            "U9-admin-main"
        );

        if (!nav || !main) {
            console.error(
                "[U9 Admin] Navigation or main container not found."
            );
            return;
        }

        const buttons = Array.from(
            nav.querySelectorAll("button[data-target]")
        );

        const pages = Array.from(
            main.querySelectorAll(".U9-admin-page")
        );

        /**
         * Switch to a specified page.
         * Example: switchPage("U9-admin-page-1")
         */
        function switchPage(pageId) {
            const targetPage = document.getElementById(pageId);

            if (!targetPage || !main.contains(targetPage)) {
                console.warn(
                    "[U9 Admin] Page not found:",
                    pageId
                );
                return;
            }

            pages.forEach(function (page) {
                const isActive = page === targetPage;

                page.classList.toggle("active", isActive);
                page.hidden = !isActive;
            });

            buttons.forEach(function (button) {
                const isActive =
                    button.dataset.target === pageId;

                button.classList.toggle("active", isActive);
                button.setAttribute(
                    "aria-pressed",
                    String(isActive)
                );
            });
        }

        nav.addEventListener("click", function (event) {
            const button = event.target.closest(
                "button[data-target]"
            );

            if (!button || !nav.contains(button)) {
                return;
            }

            switchPage(button.dataset.target);
        });

        // Default page: PAGE1
        switchPage("U9-admin-page-1");

        // Expose the switching function for other scripts.
        window.U9AdminSwitchPage = switchPage;
    }

    /**
     * Initialize after the HTML has loaded.
     */
    async function initialize() {
        initAdminNavigation();

        // Check admin-me when the page starts.
        await refreshAdminAuthState();

        console.log(
            "[U9 Admin] Navigation and session check initialized."
        );
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }
})();
