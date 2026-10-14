/* =====================================================
   U9 ADMIN
   File: index.js

   Functions:
   1. Switch between PAGE1 and PAGE6
   2. Update active bottom button
   3. Open PAGE1 by default
   ===================================================== */

(function () {
    "use strict";

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

            // Ensure the target belongs to the main container
            if (!targetPage || !main.contains(targetPage)) {
                console.warn(
                    "[U9 Admin] Page not found:",
                    pageId
                );
                return;
            }

            // Show the target page and hide the others
            pages.forEach(function (page) {
                const isActive = page === targetPage;

                page.classList.toggle("active", isActive);
                page.hidden = !isActive;
            });

            // Update bottom button states
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

        // Handle bottom button clicks
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

        // Expose the switching function for optional future use
        window.U9AdminSwitchPage = switchPage;
    }

    // Initialize after the HTML has loaded
    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initAdminNavigation,
            { once: true }
        );
    } else {
        initAdminNavigation();
    }
})();
