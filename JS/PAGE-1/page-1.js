
/* =====================================================
   U9 ADMIN
   File: JS/PAGE-1/page-1.js

   PAGE 1: User Management

   Features:
   1. Display user information
   2. Coins and Balance formatting
   3. Registration date formatting
   4. Order count
   5. Pagination
   6. Refresh button
   7. Admin session verification through index.js
   8. Loading, empty and error states

   Important:
   - Never read password_hash.
   - Never put the service-role key in browser code.
   - Frontend session checks do not replace database authorization.
===================================================== */

(function () {
    "use strict";

    const PAGE_SIZE = 20;

    let currentPage = 1;
    let totalUsers = 0;
    let loading = false;
    let initialized = false;
    let requestVersion = 0;

    const elements = {};

    /* -----------------------------------------------------
       SUPABASE CLIENT
    ----------------------------------------------------- */

    function getSupabase() {
        return window.supabaseClient ||
            window.supabase ||
            null;
    }

    /* -----------------------------------------------------
       HTML ELEMENTS
    ----------------------------------------------------- */

    function getElements() {
        elements.page = document.getElementById(
            "U9-admin-page-1"
        );

        elements.tbody = document.getElementById(
            "U9-admin-users-tbody"
        );

        elements.message = document.getElementById(
            "U9-admin-users-message"
        );

        elements.refresh = document.getElementById(
            "U9-admin-users-refresh"
        );

        elements.prev = document.getElementById(
            "U9-admin-users-prev"
        );

        elements.next = document.getElementById(
            "U9-admin-users-next"
        );

        elements.pageInfo = document.getElementById(
            "U9-admin-users-page-info"
        );
    }

    function hasRequiredElements() {
        return Boolean(
            elements.page &&
            elements.tbody &&
            elements.message &&
            elements.refresh &&
            elements.prev &&
            elements.next &&
            elements.pageInfo
        );
    }

    /* -----------------------------------------------------
       MESSAGE
    ----------------------------------------------------- */

    function setMessage(message, isError) {
        if (!elements.message) return;

        elements.message.textContent = message || "";

        elements.message.classList.toggle(
            "error",
            Boolean(isError)
        );
    }

    /* -----------------------------------------------------
       LOADING STATE
    ----------------------------------------------------- */

    function setLoading(value) {
        loading = Boolean(value);

        if (elements.refresh) {
            elements.refresh.disabled = loading;
        }

        updatePagination();
    }

    /* -----------------------------------------------------
       FORMATTERS
    ----------------------------------------------------- */

    function formatAmount(value) {
        const number = Number(value ?? 0);

        if (!Number.isFinite(number)) {
            return "0.00";
        }

        return number.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function formatRegistrationDate(value) {
        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            date.getDate()
        ).padStart(2, "0");

        const year = date.getFullYear();

        return `${month}/${day}/${year}`;
    }

    /* -----------------------------------------------------
       SAFE TABLE CELLS
    ----------------------------------------------------- */

    function createCell(value) {
        const td = document.createElement("td");

        td.textContent =
            value === null ||
            value === undefined ||
            value === ""
                ? "—"
                : String(value);

        return td;
    }

    function renderTableMessage(message) {
        if (!elements.tbody) return;

        elements.tbody.replaceChildren();

        const tr = document.createElement("tr");
        const td = document.createElement("td");

        td.colSpan = 6;
        td.textContent = message;

        tr.appendChild(td);
        elements.tbody.appendChild(tr);
    }

    function renderLoading() {
        renderTableMessage("正在加载用户数据...");
    }

    function renderEmpty() {
        renderTableMessage("暂无用户数据");
    }

    /* -----------------------------------------------------
       PAGINATION
    ----------------------------------------------------- */

    function getTotalPages() {
        return Math.max(
            1,
            Math.ceil(totalUsers / PAGE_SIZE)
        );
    }

    function updatePagination() {
        if (
            !elements.pageInfo ||
            !elements.prev ||
            !elements.next
        ) {
            return;
        }

        const totalPages = getTotalPages();

        elements.pageInfo.textContent =
            `第 ${currentPage} / ${totalPages} 页，共 ${totalUsers} 位用户`;

        elements.prev.disabled =
            loading || currentPage <= 1;

        elements.next.disabled =
            loading || currentPage >= totalPages;
    }

    /* -----------------------------------------------------
       ADMIN SESSION

       index.js exposes window.U9AdminCheckSession().
       A frontend check is only a UI gate. Database RLS or
       a protected backend endpoint must enforce authorization.
    ----------------------------------------------------- */

    async function verifyAdminSession() {
        if (
            typeof window.U9AdminCheckSession !== "function"
        ) {
            throw new Error(
                "管理员会话检查功能尚未加载。请检查 index.js。"
            );
        }

        const session = await window.U9AdminCheckSession();

        if (
            !session ||
            session.authenticated !== true ||
            !session.admin
        ) {
            throw new Error(
                "管理员尚未登录或登录会话已失效，请重新登录。"
            );
        }

        return session.admin;
    }

    /* -----------------------------------------------------
       LOAD USER PAGE

       Uses the existing Supabase client and database schema.

       Expected tables:
       - user
       - u9-orders

       Expected order relationship:
       - u9-orders.user_id -> user.id
    ----------------------------------------------------- */

    async function loadUsers() {
        if (loading) {
            return;
        }

        const thisRequest = ++requestVersion;

        setLoading(true);
        setMessage("");

        renderLoading();

        try {
            // 1. Verify the current administrator session.
            await verifyAdminSession();

            if (thisRequest !== requestVersion) {
                return;
            }

            // 2. Check the existing Supabase client.
            const supabase = getSupabase();

            if (
                !supabase ||
                typeof supabase.from !== "function"
            ) {
                throw new Error(
                    "Supabase 客户端尚未初始化，请检查 JS/Supabase/supabase-client.js。"
                );
            }

            // 3. Query only the fields displayed on PAGE1.
            // Never select password_hash.
            const from = (currentPage - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const {
                data: users,
                error: usersError,
                count
            } = await supabase
                .from("user")
                .select(
                    "id, username, account, coins, balance, created_at",
                    { count: "exact" }
                )
                .order("created_at", {
                    ascending: false
                })
                .range(from, to);

            if (usersError) {
                throw usersError;
            }

            if (thisRequest !== requestVersion) {
                return;
            }

            totalUsers = count ?? 0;

            // 4. Render the empty state only after a successful
            // database query confirms that there are no rows.
            if (!users || users.length === 0) {
                renderEmpty();
                setMessage("用户数据加载完成。");
                return;
            }

            // 5. Get the IDs for the current page.
            const userIds = users.map(function (user) {
                return user.id;
            });

            // 6. Load the order records for these users.
            // This counts all records in u9-orders, regardless
            // of order status.
            const {
                data: orders,
                error: ordersError
            } = await supabase
                .from("u9-orders")
                .select("user_id")
                .in("user_id", userIds);

            if (ordersError) {
                throw ordersError;
            }

            if (thisRequest !== requestVersion) {
                return;
            }

            // 7. Count orders per user.
            const orderCounts = Object.create(null);

            userIds.forEach(function (userId) {
                orderCounts[userId] = 0;
            });

            (orders || []).forEach(function (order) {
                if (
                    Object.prototype.hasOwnProperty.call(
                        orderCounts,
                        order.user_id
                    )
                ) {
                    orderCounts[order.user_id] += 1;
                }
            });

            // 8. Render user rows.
            renderUsers(users, orderCounts);

            setMessage("用户数据加载完成。");

        } catch (error) {
            if (thisRequest !== requestVersion) {
                return;
            }

            console.error(
                "[U9 Admin PAGE1] Failed to load users:",
                error
            );

            totalUsers = 0;

            if (
                error &&
                typeof error.message === "string" &&
                error.message.includes("管理员尚未登录")
            ) {
                renderTableMessage("请先登录管理员账号。");
                setMessage(error.message, true);

            } else if (
                error &&
                typeof error.message === "string" &&
                error.message.includes("管理员会话检查功能尚未加载")
            ) {
                renderTableMessage("管理员会话检查尚未初始化。");
                setMessage(error.message, true);

            } else {
                renderTableMessage(
                    "加载失败，请检查数据库权限、表名和字段。"
                );

                setMessage(
                    error && error.message
                        ? `加载失败：${error.message}`
                        : "用户数据加载失败。",
                    true
                );
            }

        } finally {
            if (thisRequest === requestVersion) {
                setLoading(false);
                updatePagination();
            }
        }
    }

    /* -----------------------------------------------------
       RENDER USERS
    ----------------------------------------------------- */

    function renderUsers(users, orderCounts) {
        elements.tbody.replaceChildren();

        if (!users || users.length === 0) {
            renderEmpty();
            return;
        }

        const fragment = document.createDocumentFragment();

        users.forEach(function (user) {
            const tr = document.createElement("tr");

            tr.appendChild(createCell(user.username));
            tr.appendChild(createCell(user.account));
            tr.appendChild(
                createCell(formatAmount(user.coins))
            );
            tr.appendChild(
                createCell(formatAmount(user.balance))
            );
            tr.appendChild(
                createCell(
                    formatRegistrationDate(user.created_at)
                )
            );
            tr.appendChild(
                createCell(orderCounts[user.id] ?? 0)
            );

            fragment.appendChild(tr);
        });

        elements.tbody.appendChild(fragment);
    }

    /* -----------------------------------------------------
       EVENT HANDLERS
    ----------------------------------------------------- */

    function handleRefresh() {
        if (loading) return;

        currentPage = 1;
        loadUsers();
    }

    function handlePreviousPage() {
        if (loading || currentPage <= 1) {
            return;
        }

        currentPage -= 1;
        loadUsers();
    }

    function handleNextPage() {
        if (
            loading ||
            currentPage >= getTotalPages()
        ) {
            return;
        }

        currentPage += 1;
        loadUsers();
    }

    /* -----------------------------------------------------
       INITIALIZATION
    ----------------------------------------------------- */

    function initialize() {
        if (initialized) {
            return;
        }

        getElements();

        if (!hasRequiredElements()) {
            console.error(
                "[U9 Admin PAGE1] Required HTML elements not found."
            );
            return;
        }

        initialized = true;

        elements.refresh.addEventListener(
            "click",
            handleRefresh
        );

        elements.prev.addEventListener(
            "click",
            handlePreviousPage
        );

        elements.next.addEventListener(
            "click",
            handleNextPage
        );

        updatePagination();

        // Initial load.
        loadUsers();
    }

    /* -----------------------------------------------------
       PUBLIC API
    ----------------------------------------------------- */

    window.U9AdminUsers = {
        initialize: initialize,

        refresh: function () {
            if (loading) return;

            currentPage = 1;
            loadUsers();
        },

        load: loadUsers,

        getCurrentPage: function () {
            return currentPage;
        },

        getTotalUsers: function () {
            return totalUsers;
        }
    };

    /* -----------------------------------------------------
       BOOT
    ----------------------------------------------------- */

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
