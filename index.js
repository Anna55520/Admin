
/* =========================================================
   U9 ADMIN - INDEX JS
   负责：
   1. PAGE1 - PAGE6 页面切换
   2. 底部按钮选中状态
   3. 初始化默认页面 PAGE1
   4. 支持 data-target 和 data-page
   ========================================================= */

(function () {
    "use strict";

    const AdminIndex = {
        currentPage: null,

        /**
         * 获取全部导航按钮
         */
        getButtons() {
            return Array.from(
                document.querySelectorAll(
                    "#U9-admin-bottom-nav [data-target]"
                )
            );
        },

        /**
         * 根据页面编号获取页面元素
         * 例如 PAGE1 -> #U9-admin-page-1
         */
        getPageElement(pageName) {
            const pageNumber = String(pageName)
                .replace(/^PAGE/i, "");

            if (!/^[1-6]$/.test(pageNumber)) {
                return null;
            }

            return document.getElementById(
                "U9-admin-page-" + pageNumber
            );
        },

        /**
         * 隐藏全部页面
         */
        hideAllPages() {
            for (let i = 1; i <= 6; i++) {
                const page = document.getElementById(
                    "U9-admin-page-" + i
                );

                if (!page) continue;

                page.classList.remove("active");
                page.hidden = true;
                page.setAttribute("aria-hidden", "true");
            }
        },

        /**
         * 清除所有按钮的选中状态
         */
        clearButtonStates() {
            this.getButtons().forEach((button) => {
                button.classList.remove("active");
                button.removeAttribute("aria-current");
                button.setAttribute("aria-pressed", "false");
            });
        },

        /**
         * 切换到指定页面
         * pageName 示例：PAGE1、PAGE2、PAGE3
         */
        showPage(pageName) {
            if (!pageName) return false;

            const normalizedPage = String(pageName).toUpperCase();

            const page = this.getPageElement(normalizedPage);

            if (!page) {
                console.warn(
                    "[U9 Admin] 找不到页面：",
                    normalizedPage
                );

                return false;
            }

            // 隐藏所有页面
            this.hideAllPages();

            // 显示目标页面
            page.hidden = false;
            page.classList.add("active");
            page.setAttribute("aria-hidden", "false");

            // 更新底部按钮状态
            this.clearButtonStates();

            const activeButton = this.getButtons().find(
                (button) =>
                    String(button.dataset.target).toUpperCase() ===
                    normalizedPage
            );

            if (activeButton) {
                activeButton.classList.add("active");
                activeButton.setAttribute("aria-current", "page");
                activeButton.setAttribute("aria-pressed", "true");
            }

            this.currentPage = normalizedPage;

            // 提供页面切换事件，独立页面 JS 可以监听
            document.dispatchEvent(
                new CustomEvent("u9admin:pagechange", {
                    detail: {
                        page: normalizedPage,
                        element: page
                    }
                })
            );

            return true;
        },

        /**
         * 绑定底部按钮点击事件
         */
        bindNavigation() {
            const nav = document.getElementById(
                "U9-admin-bottom-nav"
            );

            if (!nav) {
                console.warn(
                    "[U9 Admin] 找不到底部导航栏 #U9-admin-bottom-nav"
                );

                return;
            }

            // 使用事件委托，避免重复绑定
            if (nav.dataset.navigationBound === "true") {
                return;
            }

            nav.dataset.navigationBound = "true";

            nav.addEventListener("click", (event) => {
                const button = event.target.closest("[data-target]");

                if (!button || !nav.contains(button)) {
                    return;
                }

                const pageName = button.dataset.target;

                this.showPage(pageName);
            });
        },

        /**
         * 初始化
         */
        init() {
            this.bindNavigation();

            // 默认打开 PAGE1
            this.showPage("PAGE1");

            console.log("[U9 Admin] 页面切换系统已初始化");
        }
    };

    // 方便其他 JS 调用，例如 AdminIndex.showPage("PAGE3")
    window.AdminIndex = AdminIndex;

    // 确保 HTML 加载后再初始化
    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            () => AdminIndex.init(),
            { once: true }
        );
    } else {
        AdminIndex.init();
    }
})();
