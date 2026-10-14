
/* =========================================================
   U9 ADMIN LOGIN
   File: JS/LOGIN/admin-login.js

   Responsibilities:
   1. Create and manage the login modal
   2. Call admin-login Edge Function
   3. Check the current session using admin-me
   4. Change Login button to admin after authentication

   Security:
   - No service-role key in browser code
   - Authentication is verified by the server
========================================================= */

(function () {
    "use strict";

    const SUPABASE_URL =
        "https://tvtakmswbzawaweytimx.supabase.co";

    const ADMIN_LOGIN_URL =
        `${SUPABASE_URL}/functions/v1/admin-login`;

    const ADMIN_ME_URL =
        `${SUPABASE_URL}/functions/v1/admin-me`;

    const BUTTON_ID = "U9-admin-login-button";
    const MODAL_ID = "U9-admin-login-modal";

    let isAuthenticated = false;
    let isSubmitting = false;

    let loginButton = null;
    let modal = null;
    let usernameInput = null;
    let passwordInput = null;
    let messageElement = null;
    let submitButton = null;

    /* ---------------------------------------------------------
       PUBLIC SUPABASE KEY

       Reuse the key from the existing Supabase client if exposed.
       If your client file does not expose it, set the public
       anon/publishable key in window.U9_SUPABASE_PUBLIC_KEY.

       Never put the service-role key here.
    --------------------------------------------------------- */

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

    function getRequestHeaders() {
        const key = getPublicKey();

        if (!key) {
            throw new Error(
                "Supabase public key is missing. " +
                "Please configure window.U9_SUPABASE_PUBLIC_KEY."
            );
        }

        return {
            "Content-Type": "application/json",
            "apikey": key,
            "Authorization": `Bearer ${key}`
        };
    }

    /* ---------------------------------------------------------
       STYLES
    --------------------------------------------------------- */

    function injectStyles() {
        if (document.getElementById("U9-admin-login-styles")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "U9-admin-login-styles";

        style.textContent = `
            .U9-admin-header-actions {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            #U9-admin-login-button {
                cursor: pointer;
            }

            #${MODAL_ID} {
                position: fixed;
                inset: 0;
                z-index: 99999;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
                background: rgba(15, 23, 42, 0.55);
                box-sizing: border-box;
            }

            #${MODAL_ID}.is-open {
                display: flex;
            }

            #${MODAL_ID} *,
            #${MODAL_ID} *::before,
            #${MODAL_ID} *::after {
                box-sizing: border-box;
            }

            .U9-admin-login-card {
                width: 100%;
                max-width: 390px;
                padding: 26px;
                background: #ffffff;
                color: #172033;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
            }

            .U9-admin-login-title {
                margin: 0 0 6px;
                font-size: 23px;
                font-weight: 700;
            }

            .U9-admin-login-subtitle {
                margin: 0 0 24px;
                color: #64748b;
                font-size: 14px;
            }

            .U9-admin-login-field {
                display: block;
                margin-bottom: 16px;
            }

            .U9-admin-login-field span {
                display: block;
                margin-bottom: 7px;
                font-size: 14px;
                font-weight: 600;
            }

            .U9-admin-login-field input {
                display: block;
                width: 100%;
                min-height: 44px;
                padding: 10px 12px;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                background: #ffffff;
                color: #172033;
                font: inherit;
                outline: none;
            }

            .U9-admin-login-field input:focus {
                border-color: #2563eb;
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
            }

            .U9-admin-login-message {
                min-height: 20px;
                margin: 0 0 14px;
                color: #b91c1c;
                font-size: 13px;
                line-height: 1.5;
                overflow-wrap: anywhere;
            }

            .U9-admin-login-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }

            .U9-admin-login-actions button {
                min-height: 42px;
                padding: 10px 16px;
                border: 0;
                border-radius: 8px;
                font: inherit;
                font-weight: 600;
                cursor: pointer;
            }

            .U9-admin-login-cancel {
                background: #e2e8f0;
                color: #334155;
            }

            .U9-admin-login-submit {
                background: #2563eb;
                color: #ffffff;
            }

            .U9-admin-login-actions button:disabled {
                cursor: wait;
                opacity: 0.65;
            }

            @media (max-width: 480px) {
                .U9-admin-login-card {
                    padding: 22px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /* ---------------------------------------------------------
       CREATE MODAL
    --------------------------------------------------------- */

    function createModal() {
        if (document.getElementById(MODAL_ID)) {
            modal = document.getElementById(MODAL_ID);
            return;
        }

        modal = document.createElement("div");
        modal.id = MODAL_ID;
        modal.setAttribute("aria-hidden", "true");

        modal.innerHTML = `
            <div
                class="U9-admin-login-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="U9-admin-login-title">

                <h2
                    id="U9-admin-login-title"
                    class="U9-admin-login-title">
                    Admin Login
                </h2>

                <p class="U9-admin-login-subtitle">
                    Sign in to your administrator account.
                </p>

                <form id="U9-admin-login-form">
                    <label class="U9-admin-login-field">
                        <span>Username</span>
                        <input
                            id="U9-admin-login-username"
                            name="username"
                            type="text"
                            autocomplete="username"
                            maxlength="100"
                            required>
                    </label>

                    <label class="U9-admin-login-field">
                        <span>Password</span>
                        <input
                            id="U9-admin-login-password"
                            name="password"
                            type="password"
                            autocomplete="current-password"
                            required>
                    </label>

                    <p
                        id="U9-admin-login-message"
                        class="U9-admin-login-message"
                        role="status"
                        aria-live="polite"></p>

                    <div class="U9-admin-login-actions">
                        <button
                            type="button"
                            class="U9-admin-login-cancel"
                            id="U9-admin-login-cancel">
                            Cancel
                        </button>

                        <button
                            type="submit"
                            class="U9-admin-login-submit"
                            id="U9-admin-login-submit">
                            Login
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        usernameInput = modal.querySelector(
            "#U9-admin-login-username"
        );

        passwordInput = modal.querySelector(
            "#U9-admin-login-password"
        );

        messageElement = modal.querySelector(
            "#U9-admin-login-message"
        );

        submitButton = modal.querySelector(
            "#U9-admin-login-submit"
        );

        const form = modal.querySelector("#U9-admin-login-form");
        const cancelButton = modal.querySelector(
            "#U9-admin-login-cancel"
        );

        form.addEventListener("submit", handleLoginSubmit);

        cancelButton.addEventListener("click", closeModal);

        modal.addEventListener("click", function (event) {
            if (event.target === modal) {
                closeModal();
            }
        });

        document.addEventListener("keydown", function (event) {
            if (
                event.key === "Escape" &&
                modal.classList.contains("is-open")
            ) {
                closeModal();
            }
        });
    }

    /* ---------------------------------------------------------
       MODAL CONTROLS
    --------------------------------------------------------- */

    function openModal() {
        if (!modal || isAuthenticated) {
            return;
        }

        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");

        setMessage("");

        window.setTimeout(function () {
            if (usernameInput) {
                usernameInput.focus();
            }
        }, 0);
    }

    function closeModal() {
        if (!modal || isSubmitting) {
            return;
        }

        if (loginButton) {
            loginButton.focus();
        }

        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
    }

    function setMessage(message) {
        if (messageElement) {
            messageElement.textContent = message || "";
        }
    }

    function setSubmitting(submitting) {
        isSubmitting = submitting;

        if (submitButton) {
            submitButton.disabled = submitting;
            submitButton.textContent = submitting
                ? "Signing in..."
                : "Login";
        }

        if (usernameInput) {
            usernameInput.disabled = submitting;
        }

        if (passwordInput) {
            passwordInput.disabled = submitting;
        }
    }

    function setAuthenticated(admin) {
        isAuthenticated = true;

        if (loginButton) {
            loginButton.textContent =
                admin && admin.username
                    ? admin.username
                    : "admin";

            loginButton.setAttribute(
                "aria-label",
                "Authenticated administrator"
            );

            loginButton.title = "Administrator session active";
        }

        if (modal) {
            modal.classList.remove("is-open");
            modal.setAttribute("aria-hidden", "true");
        }

        if (passwordInput) {
            passwordInput.value = "";
        }
    }

    function setUnauthenticated() {
        isAuthenticated = false;

        if (loginButton) {
            loginButton.textContent = "Login";
            loginButton.removeAttribute("title");
            loginButton.setAttribute(
                "aria-label",
                "Admin login"
            );
        }
    }

    /* ---------------------------------------------------------
       LOGIN REQUEST
    --------------------------------------------------------- */

    async function handleLoginSubmit(event) {
        event.preventDefault();

        if (isSubmitting) {
            return;
        }

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            setMessage("Please enter your username and password.");
            return;
        }

        setSubmitting(true);
        setMessage("");

        try {
            const response = await fetch(ADMIN_LOGIN_URL, {
                method: "POST",
                headers: getRequestHeaders(),
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const result = await response.json().catch(function () {
                return {};
            });

            if (result.token) {
                localStorage.setItem("U9_ADMIN_TOKEN", result.token);
            }

            if (!response.ok || result.success !== true) {
                if (response.status === 401) {
                    throw new Error(
                        "Incorrect username or password."
                    );
                }

                throw new Error(
                    result.error ||
                    result.message ||
                    `Login failed (HTTP ${response.status}).`
                );
            }

            /*
             * Verify that the browser can use the session cookie.
             * Do not rely only on the login response.
             */
            const session = await checkAdminSession();

            if (!session.authenticated) {
                throw new Error(
                    "Login was accepted, but the session could not " +
                    "be verified. Check browser cookie restrictions " +
                    "and the admin-me function."
                );
            }

            setAuthenticated(
                session.admin || result.admin || null
            );

        } catch (error) {
            console.error("[U9 Admin Login]", error);

            setMessage(
                error && error.message
                    ? error.message
                    : "Unable to sign in. Please try again."
            );

        } finally {
            setSubmitting(false);
        }
    }

    /* ---------------------------------------------------------
       CHECK SESSION WITH admin-me
    --------------------------------------------------------- */

    async function checkAdminSession() {
        try {
            const response = await fetch(ADMIN_ME_URL, {
                method: "GET",
                headers: getRequestHeaders(),
                cache: "no-store"
            });

            if (response.status === 401) {
                return {
                    authenticated: false,
                    admin: null
                };
            }

            const result = await response.json().catch(function () {
                return {};
            });

            if (result.token) {
                localStorage.setItem("U9_ADMIN_TOKEN", result.token);
            }

            if (
                !response.ok ||
                result.authenticated !== true ||
                !result.admin
            ) {
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
            console.error("[U9 Admin Session Check]", error);

            return {
                authenticated: false,
                admin: null
            };
        }
    }

    /* ---------------------------------------------------------
       INITIALIZE
    --------------------------------------------------------- */

    async function initialize() {
        injectStyles();
        createModal();

        loginButton = document.getElementById(BUTTON_ID);

        if (!loginButton) {
            console.error(
                `[U9 Admin Login] Button #${BUTTON_ID} not found.`
            );
            return;
        }

        loginButton.addEventListener("click", function () {
            if (isAuthenticated) {
                return;
            }

            openModal();
        });

        setUnauthenticated();

        const session = await checkAdminSession();

        if (session.authenticated) {
            setAuthenticated(session.admin);
        }

        console.log("[U9 Admin Login] Initialized.");
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
