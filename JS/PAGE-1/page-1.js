
/* =====================================================
   U9 ADMIN
   File: JS/PAGE-1/page-1.js

   PAGE 1: User Management

   Displays:
   - Username
   - Platform Account
   - Coins
   - Balance
   - Registration Date
   - Order Count
   ===================================================== */

(function () {
    "use strict";

    const PAGE_SIZE = 20;

    let currentPage = 1;
    let totalUsers = 0;
    let loading = false;
    let initialized = false;

    const elements = {};

    function getSupabase() {
        return window.supabaseClient || window.supabase || null;
    }

    function getElements() {
        elements.page = document.getElementById("U9-admin-page-1");
        elements.tbody = document.getElementById("U9-admin-users-tbody");
        elements.message = document.getElementById("U9-admin-users-message");
        elements.refresh = document.getElementById("U9-admin-users-refresh");
        elements.prev = document.getElementById("U9-admin-users-prev");
        elements.next = document.getElementById("U9-admin-users-next");
        elements.pageInfo = document.getElementById("U9-admin-users-page-info");
    }

    function setMessage(message, isError = false) {
        if (!elements.message) return;

        elements.message.textContent = message || "";
        elements.message.classList.toggle("error", isError);
    }

    function setLoading(value) {
        loading = value;

        if (elements.refresh) {
            elements.refresh.disabled = value;
        }

        if (elements.prev) {
            elements.prev.disabled = value || currentPage <= 1;
        }

        if (elements.next) {
            elements.next.disabled =
                value || currentPage * PAGE_SIZE >= totalUsers;
        }
    }

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
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        // 月/日/年，不显示小时、分钟和秒
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const year = date.getFullYear();

        return `${month}/${day}/${year}`;
    }

    function createCell(value) {
        const td = document.createElement("td");
        td.textContent = value == null || value === "" ? "—" : String(value);
        return td;
    }

    function renderLoading() {
        elements.tbody.replaceChildren();

        const tr = document.createElement("tr");
        const td = document.createElement("td");

        td.colSpan = 6;
        td.textContent = "正在加载用户数据...";

        tr.appendChild(td);
        elements.tbody.appendChild(tr);
    }

    function renderEmpty() {
        elements.tbody.replaceChildren();

        const tr = document.createElement("tr");
        const td = document.createElement("td");

        td.colSpan = 6;
        td.textContent = "暂无用户数据";

        tr.appendChild(td);
        elements.tbody.appendChild(tr);
    }

    function renderUsers(users, orderCounts) {
        elements.tbody.replaceChildren();

        if (!users.length) {
            renderEmpty();
            return;
        }

        const fragment = document.createDocumentFragment();

        users.forEach(function (user) {
            const tr = document.createElement("tr");

            tr.appendChild(createCell(user.username));
            tr.appendChild(createCell(user.account));
            tr.appendChild(createCell(formatAmount(user.coins)));
            tr.appendChild(createCell(formatAmount(user.balance)));
            tr.appendChild(createCell(formatRegistrationDate(user.created_at)));
            tr.appendChild(createCell(orderCounts[user.id] ?? 0));

            fragment.appendChild(tr);
        });

        elements.tbody.appendChild(fragment);
    }

    function updatePagination() {
        const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));

        elements.pageInfo.textContent =
            `第 ${currentPage} / ${totalPages} 页，共 ${totalUsers} 位用户`;

        elements.prev.disabled = loading || currentPage <= 1;
        elements.next.disabled = loading || currentPage >= totalPages;
    }

    async function loadUsers() {
        if (loading) return;

        const supabase = getSupabase();

        if (!supabase || !supabase.from) {
            setMessage(
                "Supabase 客户端尚未初始化，请检查 supabase-client.js。",
                true
            );
            return;
        }

        setLoading(true);
        setMessage("");
        renderLoading();

        try {
            const from = (currentPage - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            /*
             * 只读取页面需要的字段。
             * 不读取 password_hash。
             */
            const { data: users, error: usersError, count } =
                await supabase
                    .from("user")
                    .select(
                        "id, username, account, coins, balance, created_at",
                        { count: "exact" }
                    )
                    .order("created_at", { ascending: false })
                    .range(from, to);

            if (usersError) {
                throw usersError;
            }

            totalUsers = count ?? 0;

            if (!users || users.length === 0) {
                renderEmpty();
                setMessage("用户数据加载完成。");
                return;
            }

            const userIds = users.map(function (user) {
                return user.id;
            });

            /*
             * 统计当前页面中每个用户的订单数。
             *
             * 注意：
             * 这里假设订单表名为 u9-orders，
             * 关联字段为 user_id。
             * 如果实际表名或字段不同，需要对应调整。
             */
            const { data: orders, error: ordersError } =
                await supabase
                    .from("u9-orders")
                    .select("user_id")
                    .in("user_id", userIds);

            if (ordersError) {
                throw ordersError;
            }

            const orderCounts = Object.create(null);

            userIds.forEach(function (userId) {
                orderCounts[userId] = 0;
            });

            (orders || []).forEach(function (order) {
                if (orderCounts[order.user_id] !== undefined) {
                    orderCounts[order.user_id] += 1;
                }
            });

            renderUsers(users, orderCounts);
            setMessage("用户数据加载完成。");

        } catch (error) {
            console.error("U9 Admin: Failed to load users:", error);

            elements.tbody.replaceChildren();

            const tr = document.createElement("tr");
            const td = document.createElement("td");

            td.colSpan = 6;
            td.textContent = "加载失败，请检查数据库权限及表结构。";

            tr.appendChild(td);
            elements.tbody.appendChild(tr);

            setMessage(
                error && error.message
                    ? `加载失败：${error.message}`
                    : "用户数据加载失败。",
                true
            );

        } finally {
            setLoading(false);
            updatePagination();
        }
    }

    function initialize() {
        if (initialized) return;

        getElements();

        if (
            !elements.page ||
            !elements.tbody ||
            !elements.refresh ||
            !elements.prev ||
            !elements.next ||
            !elements.pageInfo
        ) {
            console.error("U9 Admin PAGE 1: Required HTML elements not found.");
            return;
        }

        initialized = true;

        elements.refresh.addEventListener("click", function () {
            loadUsers();
        });

        elements.prev.addEventListener("click", function () {
            if (loading || currentPage <= 1) return;

            currentPage -= 1;
            loadUsers();
        });

        elements.next.addEventListener("click", function () {
            const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));

            if (loading || currentPage >= totalPages) return;

            currentPage += 1;
            loadUsers();
        });

        loadUsers();
    }

    /*
     * 页面切换时可以调用此函数刷新用户列表。
     */
    window.U9AdminUsers = {
        initialize: initialize,
        refresh: function () {
            currentPage = 1;
            loadUsers();
        },
        load: loadUsers
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize);
    } else {
        initialize();
    }
})();
