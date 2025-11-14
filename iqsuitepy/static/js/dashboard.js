function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const main = document.getElementById("main");
    sidebar.classList.toggle("collapsed");
    main.classList.toggle("collapsed");

    if (sidebar.classList.contains("collapsed")) closeReports();
}

function toggleReports() {
    const group = document.getElementById('reportsToggle').closest('.nav-group'); // <- correct group
    const submenu = document.getElementById('reportsSubmenu');
    const chev = document.getElementById('reportsChev');

    const isOpen = group.classList.toggle('open');
    submenu.setAttribute('aria-hidden', !isOpen);
    chev.style.transform = isOpen ? 'rotate(90deg)' : 'rotate(0deg)';

    const sidebar = document.getElementById("sidebar");
    if (isOpen && sidebar.classList.contains("collapsed")) {
        sidebar.classList.remove("collapsed");
        document.getElementById("main").classList.remove("collapsed");
    }

    // ✅ Update title when clicked
    setPageTitle("Reports");
}



function toggleLicense() {
    setPageTitle("License Overview");
    const group = document.getElementById('licenseGroup');
    const submenu = document.getElementById('licenseSubmenu');
    const chev = document.getElementById('licenseChev');

    const isOpen = group.classList.toggle('open');
    submenu.setAttribute('aria-hidden', !isOpen);
    chev.style.transform = isOpen ? 'rotate(90deg)' : 'rotate(0deg)';

    const sidebar = document.getElementById("sidebar");
    if (isOpen && sidebar.classList.contains("collapsed")) {
        sidebar.classList.remove("collapsed");
        document.getElementById("main").classList.remove("collapsed");
    }
}

function closeLicense() {
    const group = document.getElementById('licenseGroup');
    const submenu = document.getElementById('licenseSubmenu');
    const chev = document.getElementById('licenseChev');
    if (group && submenu && chev) {
        group.classList.remove('open');
        submenu.setAttribute('aria-hidden', 'true');
        chev.style.transform = 'rotate(0deg)';
    }
}

function closeReports() {
    const group = document.querySelector('.nav-group');
    const submenu = document.getElementById('reportsSubmenu');
    const chev = document.getElementById('reportsChev');
    if (group && submenu && chev) {
        group.classList.remove('open');
        submenu.setAttribute('aria-hidden', 'true');
        chev.style.transform = 'rotate(0deg)';
    }
}


function setPageTitle(title) {
    const pageTitle = document.getElementById("pageTitle");
    if (pageTitle) {
        pageTitle.textContent = title;
    }
}

async function loadLicenseOverview() {
    setPageTitle("License Overview");
    const content = document.getElementById("content");
    content.innerHTML = `
        <div class="spinner-container">
            <div class="spinner"></div>
        </div>
    `;

    try {
        const response = await fetch("/license-overview-data");
        const data = await response.json();

        if (data.error) {
            content.innerHTML = `<p>${data.error}</p>`;
            return;
        }

        // ✅ Initialize counts
        const counts = {
            logistics: 0,
            financials: 0,
            professional: 0,
            crm: 0
        };

        // ✅ Count module types (case-insensitive)
        data.forEach(row => {
            const modules = (row.Modules || "").toLowerCase();

            if (modules.includes("limited logistics user")) counts.logistics++;
            if (modules.includes("limited financials user")) counts.financials++;
            if (modules.includes("professional user")) counts.professional++;
            if (modules.includes("limited crm user")) counts.crm++;
        });

        // Build table with counts and filter
        let tableHTML = `
        <div class="table-container">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:10px;">
                <h2 style="color:#0F6D65; margin:0;"></h2>

                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="display:flex; flex-wrap:wrap; gap:8px;">
                        <span style="background:#E0F7F5; color:#0F6D65; padding:6px 10px; border-radius:6px; font-size:13px;">
                            Logistics: <b>22</b>
                        </span>
                        <span style="background:#E0F7F5; color:#0F6D65; padding:6px 10px; border-radius:6px; font-size:13px;">
                            Financials: <b>10</b>
                        </span>
                        <span style="background:#E0F7F5; color:#0F6D65; padding:6px 10px; border-radius:6px; font-size:13px;">
                            Professional: <b>2</b>
                        </span>
                        <span style="background:#E0F7F5; color:#0F6D65; padding:6px 10px; border-radius:6px; font-size:13px;">
                            CRM: <b>1</b>
                        </span>
                    </div>

                    <input 
                        type="text" 
                        id="tableFilter" 
                        placeholder="Filter users..." 
                        style="
                            padding:8px 12px;
                            border:1px solid #ccc;
                            border-radius:6px;
                            width:240px;
                            font-family:'Poppins',sans-serif;
                            font-size:14px;
                            color:#0F6D65;
                            background-color:#fff;
                        ">
                </div>
            </div>

            <div class="scrollable-table">
                <table class="modern-table" id="licenseTable">
                    <thead>
                        <tr>
                            <th>SAP Usercode</th>
                            <th>Employee Name</th>
                            <th>Department</th>
                            <th>Locked</th>
                            <th>Connected</th>
                            <th>Modules</th>
                        </tr>
                    </thead>
                    <tbody>`;

        // ✅ Render table rows
        data.forEach(row => {
            tableHTML += `
            <tr>
                <td>${row.UserCode}</td>
                <td>${row.FullName}</td>
                <td>${row.DfltsGroup}</td>
                <td>${row.Locked}</td>
                <td>${row.IsConnected}</td>
                <td>${row.Modules}</td>
            </tr>`;
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        </div>`;

        content.innerHTML = tableHTML;

        // ✅ Add filter functionality
        const filterInput = document.getElementById("tableFilter");
        filterInput.addEventListener("keyup", function () {
            const filterValue = this.value.toLowerCase();
            const rows = document.querySelectorAll("#licenseTable tbody tr");
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(filterValue) ? "" : "none";
            });
        });

        console.log("✅ License counts:", counts);

    } catch (err) {
        console.error("Error loading license data:", err);
        content.innerHTML = "<p>Failed to load data.</p>";
    }
}

async function loadManageLicense() {
    setPageTitle("Manage License");
    const content = document.getElementById("content");
    content.innerHTML = `
        <div class="spinner-container">
            <div class="spinner"></div>
        </div>
    `;

    try {
        const response = await fetch("/license-overview-data");
        const data = await response.json();

        if (data.error) {
            content.innerHTML = `<p>${data.error}</p>`;
            return;
        }

        // Get current user's office from sessionStorage
        const currentUserOffice = sessionStorage.getItem("UserOffice");
        const officeMap = { "San Pedro": "SP", "Head Office": "HO" };
        const officeCode = officeMap[currentUserOffice] || currentUserOffice;

        // Filter users by office
        const filteredUsers = data.filter(u => u.DfltsGroup === officeCode);

        if (filteredUsers.length === 0) {
            content.innerHTML = "<p>No users found for your office.</p>";
            return;
        }

        // Build table
        let tableHTML = `
        <div class="table-container">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:10px;">
                <h2 style="color:#0F6D65; margin:0;"></h2>
                <input 
                    type="text" 
                    id="tableFilter" 
                    placeholder="Filter users..." 
                    style="padding:8px 12px; border:1px solid #ccc; border-radius:6px; width:240px; font-family:'Poppins',sans-serif; font-size:14px; color:#0F6D65; background-color:#fff;">
            </div>
            <div class="scrollable-table">
                <table class="modern-table" id="manageLicenseTable">
                    <thead>
                        <tr>
                            <th>SAP Usercode</th>
                            <th>Employee Name</th>
                            <th>Department</th>
                            <th>Locked</th>
                            <th>Connected</th>
                            <th>Modules</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>`;

        filteredUsers.forEach(user => {
            tableHTML += `
            <tr>
                <td>${user.UserCode}</td>
                <td>${user.FullName}</td>
                <td>${user.DfltsGroup}</td>
                <td>${user.Locked}</td>
                <td>${user.IsConnected}</td>
                <td>${user.Modules}</td>
                <td>
                    <button class="transfer-btn" data-usercode="${user.UserCode}" 
                        style="padding:6px 12px; background:#0F6D65; color:#fff; border:none; border-radius:6px; cursor:pointer;">
                        Transfer License
                    </button>
                </td>
            </tr>`;
        });

        tableHTML += `</tbody></table></div></div>`;

        // Append modal container (hidden by default)
        // Append modal container (hidden by default)
        tableHTML += `
        <div id="transferModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); align-items:center; justify-content:center;">
            <div style="background:#F7F7F3; padding:20px; border-radius:10px; width:400px; position:relative;">
                <h3 style="margin-top:0; color:#0F6D65;">Transfer License</h3>

                <label for="fromUserSelect" style="color:#0F6D65;  font-weight:bold;">From User:</label>
                <select id="fromUserSelect" style="width:100%; padding:6px; margin-bottom:10px; border:1px solid #ccc; border-radius:6px;"></select>

                <label for="toUserInput" style="color:#0F6D65;  font-weight:bold;">To User:</label>
                <input type="text" id="toUserInput" readonly 
                    style="width:100%; padding:6px; margin-bottom:10px; border:1px solid #ccc; border-radius:6px; background:#e0e0e0; color:#555;">

                <div style="text-align:right;">
                    <button id="cancelTransfer" style="margin-right:8px; padding:6px 12px; border:none; background:#ccc; border-radius:6px; cursor:pointer;">Cancel</button>
                    <button id="confirmTransfer" style="padding:6px 12px; border:none; background:#0F6D65; color:#fff; border-radius:6px; cursor:pointer;">Transfer</button>
                </div>
            </div>
        </div>`;


        content.innerHTML = tableHTML;

        // Filter functionality
        const filterInput = document.getElementById("tableFilter");
        filterInput.addEventListener("keyup", function () {
            const filterValue = this.value.toLowerCase();
            const rows = document.querySelectorAll("#manageLicenseTable tbody tr");
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(filterValue) ? "" : "none";
            });
        });

        // Transfer button click
        const transferButtons = document.querySelectorAll(".transfer-btn");
        const modal = document.getElementById("transferModal");
        const fromInput = document.getElementById("fromUser");
        const toSelect = document.getElementById("toUser");
        const cancelBtn = document.getElementById("cancelTransfer");
        const confirmBtn = document.getElementById("confirmTransfer");

        transferButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                const userCode = btn.getAttribute("data-usercode");

                // Set "To" input to the selected user (grayed out)
                document.getElementById("toUserInput").value = userCode;

                // Fill "From" dropdown with remaining users
                const fromSelect = document.getElementById("fromUserSelect");
                fromSelect.innerHTML = "";
                filteredUsers
                    .filter(u => u.UserCode !== userCode)
                    .forEach(u => {
                        const option = document.createElement("option");
                        option.value = u.UserCode;
                        option.textContent = u.UserCode;
                        fromSelect.appendChild(option);
                    });

                modal.style.display = "flex";
            });
        });


        // Cancel modal
        cancelBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });

        // Confirm transfer
        confirmBtn.addEventListener("click", async () => {
            const fromUser = document.getElementById("fromUserSelect").value;
            const toUser = document.getElementById("toUserInput").value;

            if (!fromUser || !toUser) {
                alert("Please select a user to transfer from and to.");
                return;
            }

            // Find the selected users in filteredUsers
            const fromUserData = filteredUsers.find(u => u.UserCode === fromUser);
            const toUserData = filteredUsers.find(u => u.UserCode === toUser);

            if (!fromUserData || !toUserData) {
                alert("Invalid user selection.");
                return;
            }

            // Toggle IsConnected values
            fromUserData.IsConnected = fromUserData.IsConnected === 1 ? 0 : 1;
            toUserData.IsConnected = toUserData.IsConnected === 1 ? 0 : 1;

            // ✅ Update table UI immediately
            const rows = document.querySelectorAll("#manageLicenseTable tbody tr");
            rows.forEach(row => {
                const userCode = row.cells[0].textContent.trim();
                if (userCode === fromUser) {
                    row.cells[4].textContent = fromUserData.IsConnected;
                }
                if (userCode === toUser) {
                    row.cells[4].textContent = toUserData.IsConnected;
                }
            });

            // ✅ Send update to backend (optional)
            try {
                const response = await fetch("/update-license-status", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fromUser,
                        toUser,
                        updates: [
                            { UserCode: fromUser, IsConnected: fromUserData.IsConnected },
                            { UserCode: toUser, IsConnected: toUserData.IsConnected }
                        ]
                    })
                });

                const result = await response.json();
                if (result.success) {
                    alert("License connection status updated successfully.");
                } else {
                    alert("Update failed: " + result.error);
                }
            } catch (error) {
                console.error("Error updating license status:", error);
                alert("Failed to update license status on the server.");
            }

            modal.style.display = "none";
        });


    } catch (err) {
        console.error("Error loading manage license:", err);
        content.innerHTML = "<p>Failed to load data.</p>";
    }
}
function openDashboardDateFilter() {
    const oldPopup = document.getElementById("dashboardDatePopup");
    if (oldPopup) oldPopup.remove();

    const popup = document.createElement("div");
    popup.id = "dashboardDatePopup";
    popup.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.45);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        backdrop-filter: blur(3px);
        animation: fadeIn 0.15s ease-out;
    `;

    popup.innerHTML = `
        <div style="
            background: #FFFFFF;
            padding: 20px;
            border-radius: 14px;
            width: 90%;
            max-width: 340px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.25);
            font-family: 'Poppins', sans-serif;
            box-sizing: border-box;
            animation: popIn 0.22s ease-out;
        ">
            <h3 style="margin: 0 0 15px; color: #0F6D65; font-weight: 600;">Filter Dashboard</h3>

            <label style="font-size: 14px;">Start Date:</label>
            <input type="date" id="dashboardStartDate" style="
                width: 100%;
                padding: 10px;
                margin-bottom: 12px;
                font-size: 14px;
                border: 1px solid #ccc;
                border-radius: 6px;
                box-sizing: border-box;
            ">

            <label style="font-size: 14px;">End Date:</label>
            <input type="date" id="dashboardEndDate" style="
                width: 100%;
                padding: 10px;
                margin-bottom: 12px;
                font-size: 14px;
                border: 1px solid #ccc;
                border-radius: 6px;
                box-sizing: border-box;
            ">

            <label style="font-size: 14px;">Warehouse:</label>
            <select id="dashboardWarehouse" style="
                width: 100%;
                padding: 10px;
                margin-bottom: 12px;
                font-size: 14px;
                border: 1px solid #ccc;
                border-radius: 6px;
                box-sizing: border-box;
            ">
                <option value="SP">SP</option>
                <option value="GM">GM</option>
                <option value="LP">LP</option>
                <option value="MH">MH</option>
            </select>

            <div style="margin-top: 18px; text-align: right;">
                <button id="dashboardCancelBtn" style="
                    padding: 8px 12px;
                    background: #ddd;
                    border: none;
                    border-radius: 6px;
                    margin-right: 8px;
                    cursor: pointer;
                ">Cancel</button>

                <button id="dashboardSubmitBtn" style="
                    padding: 8px 14px;
                    background: #0F6D65;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                ">Submit</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    document.getElementById("dashboardCancelBtn").onclick = () => popup.remove();

    document.getElementById("dashboardSubmitBtn").onclick = () => {
        const start = document.getElementById("dashboardStartDate").value;
        const end = document.getElementById("dashboardEndDate").value;
        const warehouse = document.getElementById("dashboardWarehouse").value;

        if (!start || !end) {
            alert("Please select both dates.");
            return;
        }

        popup.remove();
        loadDashboard(start, end, warehouse); // ✅ Pass warehouse as third parameter
    };
}



async function loadDashboard(startDate, endDate, warehouse) {
    setPageTitle("Production Dashboard");
    const content = document.getElementById("content");
    content.innerHTML = `
        <div class="spinner-container">
            <div class="spinner"></div>
        </div>
    `;

    try {

        const response = await fetch(`/production-view-data?start_date=${startDate}&end_date=${endDate}&warehouse=${warehouse}`);
        const result = await response.json();

        if (result.error) {
            content.innerHTML = `<p style="color:red;">${result.error}</p>`;
            return;
        }

        const data = result.records || [];
        //const totalRecords = result.total_records || 0;
        const uniqueProjects = result.unique_project_count || 0;

        // --- MSA Calculation ---
        let finalPlannedQty = 0;
        let finalProducedQty = 0;

        data.forEach(row => {
            const planned = parseFloat(row["Planned Qty"] || row["plannedqty"] || 0);
            const produced = parseFloat(row["Produced Qty"] || row["producedqty"] || 0);
            const status = (row["MSA Status"] || row["msastatus"] || "").toString().trim().toUpperCase();

            if (!isNaN(planned)) finalPlannedQty += planned;
            if (!isNaN(produced) && status === "HIT") finalProducedQty += produced;
        });

        const msa = finalPlannedQty > 0 ? (finalProducedQty / finalPlannedQty) * 100 : 0;

        // --- Efficiency Rate Calculation ---
        const efficiencyValues = data
            .map(row => parseFloat((row["Efficiency Rate"] || "").replace("%", "").trim()))
            .filter(val => !isNaN(val));
        const uniqueEfficiency = [...new Set(efficiencyValues)];
        const efficiencyRate = uniqueEfficiency.length > 0
            ? uniqueEfficiency.reduce((a, b) => a + b, 0) / uniqueEfficiency.length
            : 0;

        // --- Rejection Rate Calculation ---
        const rejectionValues = data
            .map(row => parseFloat((row["Rejection Rate"] || "").replace("%", "").trim()))
            .filter(val => !isNaN(val));
        const uniqueRejection = [...new Set(rejectionValues)];
        const rejectionRate = uniqueRejection.length > 0
            ? uniqueRejection.reduce((a, b) => a + b, 0) / uniqueRejection.length
            : 0;

        // --- Pending SAP Transactions ---
        let deliveredCount = 0;
        let undeliveredCount = 0;
        let closedNoDRCount = 0;

        const uniqueDelivered = new Set();
        const uniqueUndelivered = new Set();
        const uniqueClosedNoDR = new Set();

        data.forEach(row => {
            const prodOrderNumber = row["Prod Order Number"] || row["prodordernumber"];
            const prodOrderStatus = (row["Prod Order Status"] || row["prodorderstatus"] || "").toUpperCase().trim();
            const drStatus = (row["DR Status"] || row["drstatus"] || "").toLowerCase().trim();

            if (drStatus === "with dr") uniqueDelivered.add(prodOrderNumber);
            if (drStatus === "without dr") uniqueUndelivered.add(prodOrderNumber);
            if (prodOrderStatus === "CLOSED" && drStatus === "without dr") uniqueClosedNoDR.add(prodOrderNumber);
        });

        deliveredCount = uniqueDelivered.size;
        undeliveredCount = uniqueUndelivered.size;
        closedNoDRCount = uniqueClosedNoDR.size;

        // --- Order Completion Calculation ---
        let uniqueSOQty = {};
        let uniqueSOQtySum = 0;

        data.forEach(row => {
            const soPn = row["SO-PN"];
            const soQty = parseFloat(row["SO Qty"] || 0);

            if (soPn && !(soPn in uniqueSOQty)) {
                if (!isNaN(soQty)) {
                    uniqueSOQty[soPn] = soQty;
                    uniqueSOQtySum += soQty;
                }
            }
        });

        const orderCompletion = uniqueSOQtySum > 0 ? (finalProducedQty / uniqueSOQtySum) * 100 : 0;

        // --- Dashboard Cards Layout ---
        let html = `
            <div class="card-container">
                <div class="dashboard-card clickable-card" id="cardProjects">
                    <h3>Projects Done</h3>
                    <p class="card-value">${uniqueProjects}</p>
                </div>

                <div class="dashboard-card clickable-card" id="cardMSA">
                    <h3>MSA</h3>
                    <p class="card-value">${msa.toFixed(2)}%</p>
                </div>

                <div class="dashboard-card clickable-card" id="cardEfficiency">
                    <h3>Efficiency Rate</h3>
                    <p class="card-value">${efficiencyRate.toFixed(2)}%</p>
                </div>

                <div class="dashboard-card clickable-card" id="cardRejection">
                    <h3>Rejection Rate</h3>
                    <p class="card-value">${rejectionRate.toFixed(2)}%</p>
                </div>

                <div class="dashboard-card clickable-card" id="cardSAP">
                    <h3>Pending SAP Transactions</h3>
                    <div class="sap-subcards">
                        <div class="sap-subcard">
                            <p class="sap-value">${deliveredCount}</p>
                            <p class="sap-label">Delivered</p>
                        </div>
                        <div class="sap-subcard">
                            <p class="sap-value">${undeliveredCount}</p>
                            <p class="sap-label">Undelivered</p>
                        </div>
                        <div class="sap-subcard">
                            <p class="sap-value">${closedNoDRCount}</p>
                            <p class="sap-label">ClPO w/o DR</p>
                        </div>
                    </div>
                </div>

                <div class="dashboard-card" id="cardOrderCompletion">
                    <h3>Order Completion</h3>
                    <canvas id="orderChart" width="180" height="180"></canvas>
                    
                </div>
            </div>

            <!-- Modal structure -->
            <div id="dataModal" class="modal">
                <div class="modal-content">
                    <span class="close-btn">&times;</span>
                    <h2 id="modalTitle"></h2>
                    <div id="modalTableContainer" class="scrollable-table"></div>
                </div>
            </div>
        `;

        content.innerHTML = html;
        //orderCompletion
        const ctx = document.getElementById("orderChart").getContext("2d");

        const orderChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Completed", "Remaining"],
                datasets: [
                    {
                        data: [orderCompletion, 100 - orderCompletion],
                        backgroundColor: ["#A5CE3A", "#7F7F82"],
                        borderWidth: 0
                    }
                ]
            },
            options: {
                cutout: "50%",
                plugins: {
                    legend: {
                        display: true,
                        position: "bottom",
                        labels: {
                            color: "#0F6D65",
                            font: {
                                size: 14,
                                family: "Poppins"
                            }
                        }
                    },
                    tooltip: {
                        enabled: true
                    }
                }
            },
            plugins: [
                {
                    id: "centerText",
                    afterDraw(chart) {
                        const { width } = chart;
                        const { height } = chart;
                        const ctx = chart.ctx;
                        ctx.save();

                        // draw text in the middle
                        const fontSize = (height / 250).toFixed(2);
                        ctx.font = `bold ${fontSize * 20}px Poppins`;
                        ctx.textBaseline = "middle";
                        ctx.fillStyle = "#0F6D65";
                        ctx.textAlign = "center";

                        const text = `${orderCompletion.toFixed(2)}%`;
                        const textX = width / 2;
                        const textY = height / 2;

                        ctx.fillText(text, textX, textY);
                        ctx.restore();
                    }
                }
            ]
        });

        // --- ORDER FULFILLMENT CARD ---
        const orderFulfillmentCard = document.createElement("div");
        orderFulfillmentCard.classList.add("dashboard-card");
        orderFulfillmentCard.innerHTML = `
            <h3>Order Fulfillment</h3>
            <canvas id="fulfillmentChart" width="300" height="200"></canvas>
        `;
        document.querySelector(".card-container").appendChild(orderFulfillmentCard);

        // --- ORDER FULFILLMENT BAR CHART ---
        const barCtx = document.getElementById("fulfillmentChart").getContext("2d");
        new Chart(barCtx, {
            type: "bar",
            data: {
                labels: ["SO Quantity", "Total Produced"],
                datasets: [{
                    label: "Order Fulfillment",
                    data: [uniqueSOQtySum, finalProducedQty],
                    backgroundColor: ["#0F6D65", "#A5CE3A"],
                    borderRadius: 8,
                    borderWidth: 0,
                    barThickness: 25
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: false },
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.label}: ${ctx.raw.toLocaleString()}`
                        }
                    }
                },
                scales: {
                    y: {
                        display: false,
                        grid: { display: false }
                    },
                    x: {
                        ticks: {
                            color: "#0F6D65",
                            font: { family: "Poppins", size: 12 }
                        },
                        grid: { display: false }
                    }
                }
            }
        });

        // --- PLANNED PERFORMANCE CARD ---
        const plannedPerformanceCard = document.createElement("div");
        plannedPerformanceCard.classList.add("dashboard-card");
        plannedPerformanceCard.innerHTML = `
            <h3>Planned Performance</h3>
            <canvas id="plannedChart" width="300" height="200"></canvas>
        `;
        document.querySelector(".card-container").appendChild(plannedPerformanceCard);

        // --- PLANNED PERFORMANCE BAR CHART ---
        const plannedCtx = document.getElementById("plannedChart").getContext("2d");
        new Chart(plannedCtx, {
            type: "bar",
            data: {
                labels: ["Planned Qty", "Produced Qty"],
                datasets: [
                    {
                        label: "Planned Performance",
                        data: [finalPlannedQty, finalProducedQty],
                        backgroundColor: ["#0F6D65", "#A5CE3A"],
                        borderRadius: 8,
                        borderWidth: 0,
                        barThickness: 25 // 🔹 thinner bars
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: false },
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.label}: ${ctx.raw.toLocaleString()}`
                        }
                    }
                },
                scales: {
                    y: {
                        display: false, // 🔹 hides left-side labels
                        grid: { display: false }
                    },
                    x: {
                        ticks: {
                            color: "#0F6D65",
                            font: { family: "Poppins", size: 12 }
                        },
                        grid: { display: false }
                    }
                }
            }
        });

        // --- PRODUCTIVITY PER CLIENT CARD ---
        const productivityCard = document.createElement("div");
        productivityCard.classList.add("dashboard-card");
        productivityCard.style.gridColumn = "span 2";
        productivityCard.innerHTML = `
            <h3>Productivity per Client</h3>
            <canvas id="productivityChart" width="300" height="200"></canvas> 
        `;
        document.querySelector(".card-container").appendChild(productivityCard);

        // --- CALCULATE AVERAGE EFFICIENCY PER CLIENT ---
        const efficiencyTotals = {};
        const clientCounts = {};

        data.forEach(row => {
            const client = row["Client"];
            let efficiencyRate = row["Efficiency Rate"];

            if (client && efficiencyRate) {
                try {
                    efficiencyRate = parseFloat(efficiencyRate.toString().replace("%", "").trim());
                    if (!isNaN(efficiencyRate)) {
                        if (!efficiencyTotals[client]) {
                            efficiencyTotals[client] = 0;
                            clientCounts[client] = 0;
                        }
                        efficiencyTotals[client] += efficiencyRate;
                        clientCounts[client] += 1;
                    }
                } catch (e) {
                    console.warn(`Invalid efficiency for ${client}: ${efficiencyRate}`);
                }
            }
        });

        // --- COMPUTE AVERAGE ---
        const averageEfficiency = {};
        for (const client in efficiencyTotals) {
            averageEfficiency[client] = efficiencyTotals[client] / clientCounts[client];
        }

        const clients = Object.keys(averageEfficiency);
        const avgRates = Object.values(averageEfficiency);
        const maxAvg = avgRates.length ? Math.max(...avgRates) + 10 : 100;

        // --- PRODUCTIVITY CHART ---
        const prodCtx = document.getElementById("productivityChart").getContext("2d");
        new Chart(prodCtx, {
            type: "bar",
            data: {
                labels: clients.map(c => c.length > 10 ? c.substring(0, 10) + "…" : c),
                datasets: [{
                    label: "Avg Efficiency Rate (%)",
                    data: avgRates,
                    backgroundColor: "#A5CE3A",
                    borderRadius: 8,
                    borderWidth: 0,
                    barThickness: 25,
                    categoryPercentage: 0.1,
                    barPercentage: 0.7
                }]
            },
            options: {
                indexAxis: 'y',
                plugins: {
                    title: { display: false },
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${ctx.raw.toFixed(2)}%`
                        }
                    }
                },
                scales: {
                    y: {
                        display: true,
                        beginAtZero: true,
                        max: maxAvg,
                        grid: { display: false }
                    },
                    x: {
                        ticks: {
                            display: false,
                            color: "#0F6D65",
                            font: { family: "Poppins", size: 12 },
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: { display: false }
                    }
                },
                layout: {
                    padding: 10
                }
            }
        });

        // --- SCHEDULE ATTAINMENT & PRODUCTIVITY PER PROJECT ---
        const projectCard = document.createElement("div");
        projectCard.classList.add("dashboard-card");
        projectCard.style.gridColumn = "span 5"; // ✅ same width as other main cards
        projectCard.innerHTML = `
            <h3>Schedule Attainment & Productivity per Project</h3>
            <canvas id="projectChart" width="300" height="200"></canvas>
        `;
        document.querySelector(".card-container").appendChild(projectCard);

        // --- COMPUTE TOTALS PER PROJECT ---
        const plannedTotals = {};
        const producedTotals = {};
        const efficiencyTotalsPerProject = {};
        const efficiencyCountsPerProject = {};

        data.forEach(row => {
            const project = row["Project Name"];
            const planned = parseFloat(row["Planned Qty"] || 0);
            const produced = parseFloat(row["Produced Qty"] || 0);
            const status = (row["MSA Status"] || "").toString().trim().toUpperCase();
            const efficiency = parseFloat((row["Efficiency Rate"] || "").replace("%", "").trim());

            if (!project) return;

            if (!isNaN(planned)) plannedTotals[project] = (plannedTotals[project] || 0) + planned;
            if (status === "HIT" && !isNaN(produced)) producedTotals[project] = (producedTotals[project] || 0) + produced;
            if (!isNaN(efficiency)) {
                efficiencyTotalsPerProject[project] = (efficiencyTotalsPerProject[project] || 0) + efficiency;
                efficiencyCountsPerProject[project] = (efficiencyCountsPerProject[project] || 0) + 1;
            }
        });

        // --- COMPUTE AVERAGE MSA AND EFFICIENCY PER PROJECT ---
        const averageMSA = {};
        for (const project in plannedTotals) {
            if (plannedTotals[project] > 0) {
                averageMSA[project] = (producedTotals[project] || 0) / plannedTotals[project] * 100;
            }
        }

        const averageEfficiencyPerProject = {};
        for (const project in efficiencyTotalsPerProject) {
            averageEfficiencyPerProject[project] =
                efficiencyTotalsPerProject[project] / efficiencyCountsPerProject[project];
        }

        // --- MERGE ALL PROJECTS ---
        const allProjects = Array.from(
            new Set([...Object.keys(averageMSA), ...Object.keys(averageEfficiencyPerProject)])
        ).sort();

        // --- PREPARE DATASETS ---
        const msaValues = allProjects.map(p => averageMSA[p] || 0);
        const effValues = allProjects.map(p => averageEfficiencyPerProject[p] || 0);
        const maxY = Math.max(...msaValues, ...effValues, 100) + 10;

        // --- CREATE CHART ---
        const projCtx = document.getElementById("projectChart").getContext("2d");
        new Chart(projCtx, {
            type: "bar",
            data: {
                labels: allProjects.map(p => p.length > 10 ? p.substring(0, 10) + "…" : p),
                datasets: [
                    {
                        label: "Schedule Attainment (MSA%)",
                        data: msaValues,
                        backgroundColor: "#A5CE3A",
                        borderRadius: 8,
                        barThickness: 20
                    },
                    {
                        label: "Productivity (Efficiency%)",
                        data: effValues,
                        backgroundColor: "#0F6D65",
                        borderRadius: 8,
                        barThickness: 20
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: "bottom",
                        labels: {
                            color: "#0F6D65",
                            font: { family: "Poppins", size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(2)}%`
                        }
                    }
                },
                scales: {
                    y: {
                        display: false, // ✅ remove Y-axis
                        beginAtZero: true,
                        max: maxY,
                        grid: { display: false }
                    },
                    x: {
                        ticks: {
                            color: "#0F6D65",
                            font: { family: "Poppins", size: 11 },
                            autoSkip: false
                        },
                        grid: { display: false }
                    }
                },
                layout: {
                    padding: 10
                }
            }
        });

        // --- TARGET DUE DATE VS FINISHED DATE ---
        const timelineCard = document.createElement("div");
        timelineCard.classList.add("dashboard-card");
        timelineCard.innerHTML = `
            <h3>Target Due Date vs Finished Date</h3>
            <canvas id="timelineChart" width="300" height="200"></canvas>
        `;
        document.querySelector(".card-container").appendChild(timelineCard);

        // --- COMPUTE TIMELINE STATUS PERCENTAGES ---
        const statusCounts = {};
        let totalCount = 0;

        data.forEach(row => {
            const timelineStatus = (row["Timeline Status"] || "").trim();
            const numericValue = parseFloat(row["Prod Order Number"] || 0);
            if (!timelineStatus) return;

            if (!statusCounts[timelineStatus]) statusCounts[timelineStatus] = 0;
            statusCounts[timelineStatus] += 1;
            totalCount++;
        });

        const statusPercentages = {};
        for (const [status, count] of Object.entries(statusCounts)) {
            statusPercentages[status] = (count / totalCount) * 100;
        }

        // --- EXTRACT PERCENTAGES ---
        const delayed = statusPercentages["Delayed"] || 0;
        const onTime = statusPercentages["On Time"] || 0;
        const early = statusPercentages["Early"] || 0;

        // --- CREATE PIE CHART ---
        const ctxTimeline = document.getElementById("timelineChart").getContext("2d");
        new Chart(ctxTimeline, {
            type: "doughnut",
            data: {
                labels: ["Delayed", "On Time", "Early"],
                datasets: [{
                    data: [delayed, onTime, early],
                    backgroundColor: ["#BD6C59", "#0F6D65", "#A5CE3A"],
                    borderWidth: 2,
                    //hoverOffset: 10
                }]
            },
            options: {
                //responsive: true,
                //maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            color: "#0F6D65",
                            font: { family: "Poppins", size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.label}: ${ctx.raw.toFixed(2)}%`
                        }
                    }
                },
                layout: {
                    padding: 10
                },
                cutout: "65%", // donut style
            }
        });

        // --- DAYS EARLIER VS DELAYED FROM TARGET DUE DATE ---
        const daysCard = document.createElement("div");
        daysCard.classList.add("dashboard-card");
        daysCard.innerHTML = `
            <h3>Days Earlier vs Delayed from Target Due Date</h3>
            <canvas id="daysChart" width="300" height="200"></canvas>
        `;
        document.querySelector(".card-container").appendChild(daysCard);

        // --- COMPUTE STATUS PERCENTAGES (EARLY / DELAYED) ---
        const statusCounts2 = {};
        let totalCount2 = 0;

        data.forEach(row => {
            const timelineStatus = (row["Timeline Status"] || "").trim();
            if (!timelineStatus) return;

            if (!statusCounts2[timelineStatus]) statusCounts2[timelineStatus] = 0;
            statusCounts2[timelineStatus] += 1;
            totalCount2++;
        });

        const statusPercentages2 = {};
        for (const [status, count] of Object.entries(statusCounts2)) {
            statusPercentages2[status] = (count / totalCount2) * 100;
        }

        const delayedPercentage = statusPercentages2["Delayed"] || 0;
        const earlyPercentage = statusPercentages2["Early"] || 0;

        // --- CREATE BAR CHART ---
        const ctxDays = document.getElementById("daysChart").getContext("2d");
        new Chart(ctxDays, {
            type: "bar",
            data: {
                labels: ["Average Days Delayed", "Average Days Early"],
                datasets: [
                    {
                        label: "Percentage (%)",
                        data: [delayedPercentage, earlyPercentage],
                        backgroundColor: ["#0F6D65", "#A5CE3A"],
                        borderRadius: 8,
                        borderWidth: 0,
                        barThickness: 25
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: false },
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.label}: ${ctx.raw.toFixed(2)}%`
                        }
                    }
                },
                scales: {
                    y: {
                        display: false,
                        grid: { color: "#eee", display: false }
                    },
                    x: {
                        ticks: {
                            color: "#0F6D65",
                            font: { family: "Poppins", size: 12 }
                        },
                        grid: { display: false }
                    }
                }
            }
        });

        // --- ON-TIME CLOSING OF PROD ORDER (HIT vs MISSED) ---
        const hitMissCard = document.createElement("div");
        hitMissCard.classList.add("dashboard-card");
        hitMissCard.innerHTML = `
            <h3>On-Time Closing of Prod Order</h3>
            <canvas id="hitMissChart" width="300" height="200"></canvas>
        `;
        document.querySelector(".card-container").appendChild(hitMissCard);

        // --- CALCULATE HIT / MISSED ---
        let hitCount = 0;
        let missedCount = 0;
        let totalCount3 = 0;

        data.forEach(row => {
            const estatus = (row["Efficiency Status"] || "").toString().trim().toUpperCase();
            if (estatus === "HIT" || estatus === "MISSED") {
                totalCount3++;
                if (estatus === "HIT") hitCount++;
                else if (estatus === "MISSED") missedCount++;
            }
        });

        let hitAverage = 0;
        let missedAverage = 0;
        if (totalCount3 > 0) {
            hitAverage = (hitCount / totalCount3) * 100;
            missedAverage = (missedCount / totalCount3) * 100;
        }

        // --- CREATE BAR CHART ---
        const hitMissCtx = document.getElementById("hitMissChart").getContext("2d");
        new Chart(hitMissCtx, {
            type: "bar",
            data: {
                labels: ["HIT", "MISSED"],
                datasets: [
                    {
                        label: "Percentage (%)",
                        data: [hitAverage, missedAverage],
                        backgroundColor: ["#0F6D65", "#A5CE3A"],
                        borderRadius: 8,
                        borderWidth: 0,
                        barThickness: 25
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: false },
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.label}: ${ctx.raw.toFixed(2)}%`
                        }
                    }
                },
                scales: {
                    y: {
                        display: false,
                        beginAtZero: true,
                        max: Math.max(hitAverage, missedAverage) + 10,
                        grid: { display: false }
                    },
                    x: {
                        ticks: {
                            color: "#0F6D65",
                            font: { family: "Poppins", size: 12 }
                        },
                        grid: { display: false }
                    }
                }
            }
        });

        // --- WEEKLY AVERAGE EFFICIENCY WITH TRENDLINE ---
        const weekEfficiencyCard = document.createElement("div");
        weekEfficiencyCard.classList.add("dashboard-card");
        weekEfficiencyCard.style.gridColumn = "span 2";
        weekEfficiencyCard.innerHTML = `
        <h3>Weekly Average Efficiency with Trendline</h3>
        <canvas id="weeklyEfficiencyChart" width="300" height="200"></canvas>
        `;
        document.querySelector(".card-container").appendChild(weekEfficiencyCard);

        // --- Compute average efficiency per week ---
        const weekEfficiency = {};
        data.forEach(row => {
            const week = parseInt(row["Week Number"]);
            const efficiencyStr = (row["Efficiency Rate"] || "").replace("%", "").trim();
            const efficiency = parseFloat(efficiencyStr);
            if (!isNaN(week) && !isNaN(efficiency)) {
                if (!weekEfficiency[week]) weekEfficiency[week] = { total: 0, count: 0 };
                weekEfficiency[week].total += efficiency;
                weekEfficiency[week].count += 1;
            }
        });

        const weeks = Object.keys(weekEfficiency).map(Number).sort((a, b) => a - b);
        const avgEff = weeks.map(w => weekEfficiency[w].total / weekEfficiency[w].count);

        // --- Compute linear regression trendline ---
        function linearRegression(x, y) {
            const n = x.length;
            const sumX = x.reduce((a, b) => a + b, 0);
            const sumY = y.reduce((a, b) => a + b, 0);
            const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
            const sumXX = x.reduce((acc, val) => acc + val * val, 0);
            const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;
            return x.map(val => slope * val + intercept);
        }

        const trendValues = linearRegression(weeks, avgEff);

        // --- Create line chart ---
        const ctxWeek = document.getElementById("weeklyEfficiencyChart").getContext("2d");
        new Chart(ctxWeek, {
            type: "line",
            data: {
                labels: weeks.map(w => `Week ${w}`),
                datasets: [
                    {
                        label: "Weekly Efficiency",
                        data: avgEff,
                        borderColor: "#0F6D65",
                        borderWidth: 3,
                        fill: false,
                        tension: 0.3,
                    },
                    {
                        label: "Trendline",
                        data: trendValues,
                        borderColor: "#7F7F82",
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0,
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { color: "#0F6D65", font: { family: "Poppins", size: 12 } }
                    },
                    tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(2)}%` } }
                },
                scales: {
                    y: {
                        display: false,
                        ticks: { color: "#0F6D65", font: { family: "Poppins", size: 12 } },
                        grid: { display: false }
                    },
                    x: {
                        ticks: { color: "#0F6D65", font: { family: "Poppins", size: 12 } },
                        grid: { display: false }
                    }
                }
            }
        });

        // --- SALES ORDER FULFILLMENT PER PROJECT ---
        const fulfillmentCard = document.createElement("div");
        fulfillmentCard.classList.add("dashboard-card");
        fulfillmentCard.style.gridColumn = "span 5";
        fulfillmentCard.innerHTML = `
        <h3>Sales Order Fulfillment per Project</h3>
        <canvas id="fulfillmentChartPerProject" width="300" height="200"></canvas>
        `;
        document.querySelector(".card-container").appendChild(fulfillmentCard);

        // --- COMPUTE AVERAGES PER PROJECT (SO-PN) ---
        if (data && Array.isArray(data) && data.length > 0) {
            const soQtyTotals = {}, totalProducedTotals = {}, soPnCounts = {};

            data.forEach(row => {
                const soPn = (row["SO-PN"] || "").trim();
                if (!soPn) return;

                const soQty = parseFloat(row["SO Qty"]) || 0;
                const totalProduced = parseFloat(row["Total Produced"]) || 0;

                if (!soQtyTotals[soPn]) {
                    soQtyTotals[soPn] = 0;
                    totalProducedTotals[soPn] = 0;
                    soPnCounts[soPn] = 0;
                }

                soQtyTotals[soPn] += soQty;
                totalProducedTotals[soPn] += totalProduced;
                soPnCounts[soPn]++;
            });

            const averageSoQty = {}, averageTotalProduced = {};
            Object.keys(soQtyTotals).forEach(pn => {
                averageSoQty[pn] = soQtyTotals[pn] / soPnCounts[pn];
                averageTotalProduced[pn] = totalProducedTotals[pn] / soPnCounts[pn];
            });

            const allSoPns = Object.keys({ ...averageSoQty, ...averageTotalProduced });
            if (allSoPns.length === 0) return console.warn("No SO-PN data found.");

            const soQtyValues = allSoPns.map(pn => averageSoQty[pn] || 0);
            const totalProducedValues = allSoPns.map(pn => averageTotalProduced[pn] || 0);

            const ctxFulfillment = document.getElementById("fulfillmentChartPerProject")?.getContext("2d");
            if (!ctxFulfillment) return console.error("Canvas not found.");

            new Chart(ctxFulfillment, {
                type: "bar",
                data: {
                    labels: allSoPns,
                    datasets: [
                        { label: "Avg SO Qty", data: soQtyValues, backgroundColor: "#A5CE3A", borderRadius: 6, barThickness: 20 },
                        { label: "Avg Total Produced", data: totalProducedValues, backgroundColor: "#0F6D65", borderRadius: 6, barThickness: 20 }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: { color: "#0F6D65", font: { family: "Poppins", size: 12 } }
                        },
                        tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(2)}` } }
                    },
                    scales: {
                        y: { display: false, beginAtZero: true, ticks: { color: "#0F6D65", font: { family: "Poppins", size: 12 } }, grid: { display: false } },
                        x: { ticks: { color: "#0F6D65", font: { family: "Poppins", size: 10 }, maxRotation: 45, minRotation: 45 }, grid: { display: false } }
                    }
                }
            });
        }




        // Click Listeners
        document.getElementById("cardProjects").addEventListener("click", () =>
            openDataModal(data, "Projects Done")
        );
        document.getElementById("cardMSA").addEventListener("click", () =>
            openDataModal(data, "MSA Summary")
        );
        document.getElementById("cardEfficiency").addEventListener("click", () =>
            openDataModal(data, "Efficiency Rate Summary")
        );
        document.getElementById("cardRejection").addEventListener("click", () =>
            openDataModal(data, "Rejection Rate Summary")
        );
        document.getElementById("cardSAP").addEventListener("click", () =>
            openDataModal(data, "Pending SAP Transactions")
        );

    } catch (err) {
        console.error("Error loading production data:", err);
        content.innerHTML = "<p>Failed to load production data.</p>";
    }
}


function showProductionTable(data, title) {
    const dataSection = document.getElementById("dataSection");

    if (!data || data.length === 0) {
        dataSection.innerHTML = `<p style="color:#A00;">No data available.</p>`;
        return;
    }

    let tableHTML = `
        <h3 style="color:#0F6D65;">${title}</h3>
        <div class="scrollable-table">
            <table class="modern-table">
                <thead>
                    <tr>
    `;

    // Dynamically add headers
    Object.keys(data[0]).forEach(col => {
        tableHTML += `<th>${col}</th>`;
    });

    tableHTML += `</tr></thead><tbody>`;

    // Add rows
    data.forEach(row => {
        tableHTML += "<tr>";
        Object.values(row).forEach(val => {
            tableHTML += `<td>${val}</td>`;
        });
        tableHTML += "</tr>";
    });

    tableHTML += `</tbody></table></div>`;

    dataSection.innerHTML = tableHTML;
}

function openDataModal(data, title) {
    const modal = document.getElementById("dataModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalTableContainer = document.getElementById("modalTableContainer");

    modalTitle.textContent = title;

    //  Columns to show
    const allowedColumns = [
        "Client",
        "Start Date",
        "Prod Order Number",
        "Planned Qty",
        "Produced Qty",
        "JO Number",
        "SO Number",
        "SO Qty"
    ];

    if (!data || data.length === 0) {
        modalTableContainer.innerHTML = "<p>No data available.</p>";
        modal.style.display = "block";
        return;
    }

    //  Find correct key names (ignore spaces/case)
    const normalized = data.map(row => {
        const mapped = {};
        Object.keys(row).forEach(k => {
            mapped[k.toLowerCase().replace(/\s/g, "")] = row[k];
        });
        return mapped;
    });

    //  Sort by Start Date (descending)
    normalized.sort((a, b) => {
        const dateA = new Date(a["startdate"]);
        const dateB = new Date(b["startdate"]);
        return dateB - dateA; // newest first
    });

    //  Format date like "Oct-10-2025"
    const formatDate = dateStr => {
        const date = new Date(dateStr);
        if (isNaN(date)) return dateStr;
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric"
        }).replace(/ /g, "-");
    };

    //  Build table
    let tableHTML = `
        <table class="modern-table">
            <thead><tr>
    `;

    allowedColumns.forEach(col => {
        tableHTML += `<th>${col}</th>`;
    });

    tableHTML += "</tr></thead><tbody>";

    normalized.forEach(row => {
        tableHTML += "<tr>";
        allowedColumns.forEach(col => {
            const key = col.toLowerCase().replace(/\s/g, "");
            let value = row[key] || "";
            if (col === "Start Date") value = formatDate(value);
            tableHTML += `<td>${value}</td>`;
        });
        tableHTML += "</tr>";
    });

    tableHTML += "</tbody></table>";

    //  Scrollable table container
    modalTableContainer.innerHTML = `
        <div style="max-height: 400px; overflow-y: auto;">
            ${tableHTML}
        </div>
    `;

    //  Show modal
    modal.style.display = "block";

    //  Close modal events
    document.querySelector(".close-btn").onclick = () => (modal.style.display = "none");
    window.onclick = event => {
        if (event.target === modal) modal.style.display = "none";
    };
}

// ------------------------
// Sidebar toggle
// ------------------------
// Show the Tickets page
async function showTicketsPage() {
    console.log("Opening Tickets Page...");

    // Set page title
    const pageTitle = document.getElementById("pageTitle");
    if (pageTitle) pageTitle.innerText = "Tickets";

    const content = document.getElementById("content");
    const ticketing = document.getElementById("ticketing");

    if (!ticketing) {
        console.error("❌ ticketing container not found. Did you overwrite #content?");
        return;
    }

    // Hide all other modules inside #content
    Array.from(content.children).forEach(child => {
        child.style.display = child.id === "ticketing" ? "block" : "none";
    });

    // Ensure ticket form is hidden, ticket list container shown
    const ticketForm = document.getElementById("ticketForm");
    if (ticketForm) ticketForm.style.display = "none";
    const ticketListContainer = document.getElementById("ticketListContainer");
    if (ticketListContainer) ticketListContainer.style.display = "block";

    // Load ticket list
    try {
        const status = document.getElementById("filterStatus").value;
        const qs = status ? `?status=${encodeURIComponent(status)}` : '';
        const tbody = document.getElementById("ticketTableBody");
        const noMsg = document.getElementById("noTicketsMsg");

        if (!tbody || !noMsg) {
            console.error("❌ ticket table elements not found.");
            return;
        }

        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Loading...</td></tr>`;
        noMsg.style.display = 'none';

        const res = await fetch('/api/tickets' + qs);
        if (!res.ok) throw new Error('Failed to fetch tickets');

        const json = await res.json();
        const data = Array.isArray(json) ? json : json.tickets || [];

        tbody.innerHTML = '';
        if (!data.length) {
            noMsg.style.display = 'block';
            return;
        }

        data.forEach(t => {
            const tr = document.createElement("tr");
            tr.style.cursor = "pointer";
            tr.innerHTML = `
                <td style="padding:8px; border-bottom:1px solid #eee;">${t.ticket_id}</td>
                <td style="padding:8px; border-bottom:1px solid #eee;">${t.title}</td>
                <td style="padding:8px; border-bottom:1px solid #eee;">${t.description}</td>
                <td style="padding:8px; border-bottom:1px solid #eee;">
                    <span class="status-badge ${t.status}">${t.status || 'open'}</span>
                </td>
                <td style="padding:8px; border-bottom:1px solid #eee;">${t.priority || 'medium'}</td>
                <td style="padding:8px; border-bottom:1px solid #eee;">${t.created_by?.displayName || t.created_by?.email || 'Unknown'}</td>
                <td style="padding:8px; border-bottom:1px solid #eee;">${new Date(t.created_at).toLocaleString()}</td>
            `;
            tr.onclick = () => viewTicketDetail(t.ticket_id);
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error("Error loading tickets:", err);
        const tbody = document.getElementById("ticketTableBody");
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="color:red;text-align:center;">Error loading tickets</td></tr>`;
    }
}




async function showCreateTicketForm() {
    document.getElementById("ticketForm").style.display = "block";
    const newID = await generateTicketID();
    document.getElementById("ticketId").value = newID;
}

function cancelCreateTicket() {
  document.getElementById('pageTitle').textContent = 'Tickets';
  document.getElementById('ticketForm').style.display = 'none';
  document.getElementById('ticketListContainer').style.display = 'block';
}



// Ticket creation handler
document.getElementById("ticketForm").onsubmit = async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById("ticketFile");
    const file = fileInput.files[0];

    const formData = new FormData();
    formData.append("title", document.getElementById("ticketTitle").value);
    formData.append("description", document.getElementById("ticketDesc").value);
    formData.append("priority", document.getElementById("ticketPriority").value);
    formData.append("ticket_id", document.getElementById("ticketId").value);

    if (file) formData.append("file", file);

    const res = await fetch("/api/tickets", {
        method: "POST",
        body: formData
    });

    if (res.ok) {
        alert("Ticket created!");
        loadTicketListFiltered();
        cancelCreateTicket();
    }
};




let currentTicketId = null;

// Open modal and populate data
function viewTicketDetail(ticketId) {
    currentTicketId = ticketId;
    // Find ticket from table or fetch from server
    fetch(`/api/tickets/${ticketId}`)
        .then(res => res.json())
        .then(ticket => {
            document.getElementById("modalTitle").textContent = ticket.title;
            document.getElementById("modalTicketId").textContent = `ID: ${ticket.ticket_id}`;
            document.getElementById("modalStatus").value = ticket.status || "open";
            document.getElementById("modalComment").value = "";
            document.getElementById("ticketModal").style.display = "flex";
        })
        .catch(err => alert("Failed to load ticket detail"));
}

// Close modal
function closeTicketModal() {
    document.getElementById("ticketModal").style.display = "none";
}

// Save changes
function saveTicketUpdate() {
    if (!currentTicketId) return;

    const status = document.getElementById("modalStatus").value;
    const comment = document.getElementById("modalComment").value.trim();

    fetch(`/api/tickets/${currentTicketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, comment })
    })
    .then(res => res.json())
    .then(result => {
        if (result.ok) {
            alert("Ticket updated!");
            closeTicketModal();
            loadTicketListFiltered(); // refresh table
        } else {
            alert("Update failed: " + JSON.stringify(result.error));
        }
    })
    .catch(err => alert("Error updating ticket"));
}

async function generateTicketID() {
    const year = new Date().getFullYear();
    const lastDigit = year.toString().slice(-1);

    const res = await fetch("/api/tickets/last-id");
    const data = await res.json();

    let nextNumber = data.last_id ? parseInt(data.last_id) + 1 : parseInt(lastDigit + "00001");

    return `IQTS-${nextNumber}`;
}

function renderTicketTable(tickets) {
    const tbody = document.getElementById("ticketTableBody");
    const noMsg = document.getElementById("noTicketsMsg");

    tbody.innerHTML = "";

    if (!tickets || tickets.length === 0) {
        noMsg.style.display = "block";
        return;
    }

    noMsg.style.display = "none";

    tickets.forEach(t => {
        tbody.innerHTML += `
            <tr onclick="openTicketModal('${t.ticket_id}')"
                style="cursor:pointer; border-bottom:1px solid #ccc;">
                <td style="padding:10px;">${t.ticket_id || "-"}</td>
                <td style="padding:10px;">${t.title}</td>
                <td style="padding:10px;">${t.description}</td>
                <td style="padding:10px;">${t.status}</td>
                <td style="padding:10px;">${t.priority}</td>
                <td style="padding:10px;">${t.created_by?.displayName || ""}</td>
                <td style="padding:10px;">${t.created_at}</td>
            </tr>
        `;
    });
}

async function showUsersPage() {
    console.log("Opening Users Page...");
    const content = document.getElementById("content");
    content.innerHTML = `
        <div class="spinner-container">
            <div class="spinner"></div>
        </div>
    `;
    try {
        const res = await fetch("/api/ms-users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();

        const activeUsers = data.filter(u => u.accountEnabled !== false);

        // Build table container with filter
        let tableHTML = `
            <div class="table-container" style="
                display: flex;
                flex-direction: column;
                height: 100vh; /* full viewport height */
                padding: 20px;
                box-sizing: border-box;
                overflow: hidden;
            ">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:10px;">
                    <h2 style="color:#0F6D65; margin:0;"></h2>
                    <input 
                        type="text" 
                        id="tableFilter" 
                        placeholder="Filter users..." 
                        style="
                            padding:8px 12px;
                            border:1px solid #ccc;
                            border-radius:6px;
                            width:240px;
                            font-family:'Poppins',sans-serif;
                            font-size:14px;
                            color:#0F6D65;
                            background-color:#fff;
                        ">
                </div>

                <div class="scrollable-table" style="
                    flex: 1;           /* take remaining height */
                    overflow-y: auto;  /* vertical scroll */
                ">
                    <table class="modern-table" id="usersTable">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Photo</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Designation</th>
                                <th>Department</th>
                                <th>Office</th>
                            </tr>
                        </thead>
                        <tbody>`;

        // Populate rows
        activeUsers.forEach((u, index) => {
            tableHTML += `<tr>
                <td>${index + 1}</td>
                <td>${u.photo ? `<img src="${u.photo}" alt="photo" style="width:32px;height:32px;border-radius:50%;margin-left:8px;vertical-align:middle;">` : ''}</td>
                <td>${u.displayName}</td>
                <td>${u.mail || u.userPrincipalName}</td>
                <td>${u.jobTitle || ""}</td>
                <td>${u.department || ""}</td>
                <td>${u.officeLocation || ""}</td>
            </tr>`;
        });


        tableHTML += `
                    </tbody>
                </table>
            </div>
        </div>`;

        content.innerHTML = tableHTML;

        // Add filter functionality
        const filterInput = document.getElementById("tableFilter");
        filterInput.addEventListener("keyup", function () {
            const filterValue = this.value.toLowerCase();
            const rows = document.querySelectorAll("#usersTable tbody tr");
            rows.forEach((row, i) => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(filterValue) ? "" : "none";

                // Renumber visible rows
                if (row.style.display !== "none") {
                    row.cells[0].textContent = i + 1;
                }
            });
        });

        console.log("✅ Users loaded:", activeUsers.length);

    } catch (err) {
        console.error("Error loading users:", err);
        content.innerHTML = `<p style="color:red;">Failed to load users</p>`;
    }
}

function toggleProcurement() {
    setPageTitle("Procurement");
    const group = document.getElementById('procurementGroup');
    const submenu = document.getElementById('procurementSubmenu');
    const chev = document.getElementById('procurementChev');

    const isOpen = group.classList.toggle('open');
    submenu.setAttribute('aria-hidden', !isOpen);
    chev.style.transform = isOpen ? 'rotate(90deg)' : 'rotate(0deg)';

    const sidebar = document.getElementById("sidebar");
    if (isOpen && sidebar.classList.contains("collapsed")) {
        sidebar.classList.remove("collapsed");
        document.getElementById("main").classList.remove("collapsed");
    }
}

function closeProcurement() {
    const group = document.getElementById('procurementGroup');
    const submenu = document.getElementById('procurementSubmenu');
    const chev = document.getElementById('procurementChev');
    if (group && submenu && chev) {
        group.classList.remove('open');
        submenu.setAttribute('aria-hidden', 'true');
        chev.style.transform = 'rotate(0deg)';
    }
}
function openRequestDateFilter() {

    const oldPopup = document.getElementById("datePopup");
    if (oldPopup) oldPopup.remove();

    const popup = document.createElement("div");
    popup.id = "datePopup";
    popup.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.45);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        backdrop-filter: blur(3px);
        animation: fadeIn 0.15s ease-out;
    `;

    popup.innerHTML = `
        <div style="
            background: #FFFFFF;
            padding: 20px;
            border-radius: 14px;
            width: 90%;
            max-width: 340px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.25);
            font-family: 'Poppins', sans-serif;
            box-sizing: border-box;
            animation: popIn 0.22s ease-out;
        ">
            <h3 style="margin: 0 0 15px; color: #0F6D65; font-weight: 600;">Filter Open Requests</h3>

            <label style="font-size: 14px;">Start Date:</label>
            <input type="date" id="reqStartDate" style="
                width: 100%;
                padding: 10px;
                margin-bottom: 12px;
                font-size: 14px;
                border: 1px solid #ccc;
                border-radius: 6px;
                box-sizing: border-box;
            ">

            <label style="font-size: 14px;">End Date:</label>
            <input type="date" id="reqEndDate" style="
                width: 100%;
                padding: 10px;
                margin-bottom: 5px;
                font-size: 14px;
                border: 1px solid #ccc;
                border-radius: 6px;
                box-sizing: border-box;
            ">

            <div style="margin-top: 18px; text-align: right;">
                <button id="reqCancelBtn" style="
                    padding: 8px 12px;
                    background: #ddd;
                    border: none;
                    border-radius: 6px;
                    margin-right: 8px;
                    cursor: pointer;
                ">Cancel</button>

                <button id="reqSubmitBtn" style="
                    padding: 8px 14px;
                    background: #0F6D65;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                ">Apply</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    document.getElementById("reqCancelBtn").onclick = () => popup.remove();

    document.getElementById("reqSubmitBtn").onclick = () => {
        const start = document.getElementById("reqStartDate").value;
        const end = document.getElementById("reqEndDate").value;

        if (!start || !end) {
            alert("Please select both dates.");
            return;
        }

        popup.remove();
        showOpenRequests(start, end);
    };
}


async function showOpenRequests(startDate, endDate) {
    console.log("Opening Open Purchase Requests...", startDate, endDate);
    const content = document.getElementById("content");

    content.innerHTML = `
        <div class="spinner-container">
            <div class="spinner"></div>
        </div>
    `;

    try {
        // Pass dates as query parameters
        const query = startDate && endDate ? `?start=${startDate}&end=${endDate}` : "";
        const res = await fetch(`/api/procurement/open-requests${query}`);
        if (!res.ok) throw new Error("Failed to fetch purchase requests");

        const data = await res.json();

        let tableHTML = `
            <div class="table-container" style="
                display: flex;
                flex-direction: column;
                height: 100vh;
                padding: 20px;
                box-sizing: border-box;
                overflow: hidden;
            ">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:10px;">
                    <h2 style="color:#0F6D65; margin:0;"></h2>
                    <input 
                        type="text" 
                        id="tableFilter" 
                        placeholder="Filter requests..." 
                        style="
                            padding:8px 12px;
                            border:1px solid #ccc;
                            border-radius:6px;
                            width:240px;
                            font-family:'Poppins',sans-serif;
                            font-size:14px;
                            color:#0F6D65;
                            background-color:#fff;
                        ">
                </div>

                <div class="scrollable-table" style="
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: auto;  /* horizontal scroll */
                ">
                    <table class="modern-table" id="requestsTable" style="min-width: 1000px;">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Request Number</th>
                                <th>Item Code</th>
                                <th>Description</th>
                                <th>Quantity</th>
                                <th>UOM</th>
                                <th>Requestor</th>
                                <th>Warehouse</th>
                                <th>Remarks</th>
                                <th>Date Created</th>
                                <th>Posting Date</th>
                            </tr>
                        </thead>
                        <tbody>`;

        // Sort by ReqDate descending
        data.sort((a, b) => {
            const dateA = a.ReqDate ? new Date(a.ReqDate) : new Date(0);
            const dateB = b.ReqDate ? new Date(b.ReqDate) : new Date(0);
            return dateB - dateA; // latest first
        });

        data.forEach((row, index) => {
            const createDate = row.CreateDate ? new Date(row.CreateDate) : null;
            const reqDate = row.ReqDate ? new Date(row.ReqDate) : null;
            const formatDate = (d) => d 
                ? new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(d)
                : '';

            tableHTML += `<tr>
                <td>${index + 1}</td>
                <td>${row.DocNum}</td>
                <td>${row.ItemCode}</td>
                <td>${row.Dscription}</td>
                <td>${row.Quantity}</td>
                <td>${row.unitMsr}</td>
                <td>${row.ReqName}</td>
                <td>${row.WhsCode}</td>
                <td>${row.Comments || ""}</td>
                <td>${formatDate(createDate)}</td>
                <td>${formatDate(reqDate)}</td>
            </tr>`;
        });

        tableHTML += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        content.innerHTML = tableHTML;

        // Filter functionality
        const filterInput = document.getElementById("tableFilter");
        filterInput.addEventListener("keyup", function () {
            const filterValue = this.value.toLowerCase();
            document.querySelectorAll("#requestsTable tbody tr").forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(filterValue) ? "" : "none";
            });
        });

        console.log("✅ Open Purchase Requests loaded:", data.length);

    } catch (err) {
        console.error("Error loading purchase requests:", err);
        content.innerHTML = `<p style="color:red;">Failed to load purchase requests.</p>`;
    }
}


function openOrderDateFilter() {
    const oldPopup = document.getElementById("datePopup");
    if (oldPopup) oldPopup.remove();

    const popup = document.createElement("div");
    popup.id = "datePopup";
    popup.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.45);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        backdrop-filter: blur(3px);
        animation: fadeIn 0.15s ease-out;
    `;

    popup.innerHTML = `
        <div style="
            background: #FFFFFF;
            padding: 20px;
            border-radius: 14px;
            width: 90%;
            max-width: 340px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.25);
            font-family: 'Poppins', sans-serif;
            box-sizing: border-box;
            animation: popIn 0.22s ease-out;
        ">
            <h3 style="margin: 0 0 15px; color: #0F6D65; font-weight: 600;">Filter by Date</h3>

            <label style="font-size: 14px;">Start Date:</label>
            <input type="date" id="startDate" style="
                width: 100%;
                padding: 10px;
                margin-bottom: 12px;
                font-size: 14px;
                border: 1px solid #ccc;
                border-radius: 6px;
                box-sizing: border-box;
            ">

            <label style="font-size: 14px;">End Date:</label>
            <input type="date" id="endDate" style="
                width: 100%;
                padding: 10px;
                margin-bottom: 5px;
                font-size: 14px;
                border: 1px solid #ccc;
                border-radius: 6px;
                box-sizing: border-box;
            ">

            <div style="margin-top: 18px; text-align: right;">
                <button id="cancelBtn" style="
                    padding: 8px 12px;
                    background: #ddd;
                    border: none;
                    border-radius: 6px;
                    margin-right: 8px;
                    cursor: pointer;
                ">Cancel</button>

                <button id="submitBtn" style="
                    padding: 8px 14px;
                    background: #0F6D65;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                ">Submit</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    document.getElementById("cancelBtn").onclick = () => popup.remove();

    document.getElementById("submitBtn").onclick = () => {
        const start = document.getElementById("startDate").value;
        const end = document.getElementById("endDate").value;

        if (!start || !end) {
            alert("Please select both dates.");
            return;
        }

        popup.remove();
        showOpenOrders(start, end);
    };
}



async function showOpenOrders(startDate, endDate) {
    setPageTitle("Open Purchase Orders");
    const content = document.getElementById("content");

    // Loading spinner
    content.innerHTML = `
        <div class="spinner-container">
            <div class="spinner"></div>
        </div>
    `;

    await new Promise(res => setTimeout(res));

    try {
        const res = await fetch(`/api/open-orders?start=${startDate}&end=${endDate}`);
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();

        // Build the table first
        content.innerHTML = `
            <div class="table-container" style="
                display:flex;
                flex-direction:column;
                height:100vh;
                padding:20px;
                overflow:hidden;
            ">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <h2 style="color:#0F6D65;"></h2>
                    <input type="text" id="tableFilter" placeholder="Filter orders..." style="
                        padding:8px;
                        border:1px solid #ccc;
                        border-radius:6px;
                        width:240px;
                    ">
                </div>

                <div class="scrollable-table" style="flex:1; overflow:auto;">
                    <table class="modern-table" id="ordersTable">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>PO Number</th>
                                <th>Vendor Code</th>
                                <th>Vendor Name</th>
                                <th>Item Code</th>
                                <th>Description</th>
                                <th>Quantity</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Posting Date</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        `;

        const tbody = document.querySelector("#ordersTable tbody");

        // Sort by latest DocDate first
        data.sort((a, b) => new Date(b.DocDate) - new Date(a.DocDate));

        data.forEach((row, index) => {
            const docDate = row.DocDate ? new Date(row.DocDate) : null;
            const formatDate = (d) =>
                d
                    ? new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                      }).format(d)
                    : "";

            tbody.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${row.DocNum}</td>
                    <td>${row.CardCode}</td>
                    <td>${row.CardName}</td>
                    <td>${row.ItemCode}</td>
                    <td>${row.Dscription}</td>
                    <td>${row.Quantity}</td>
                    <td>${row.Price}</td>
                    <td>${row.LineStatus}</td>
                    <td>${formatDate(docDate)}</td>
                </tr>
            `;
        });

        // Filter
        document.getElementById("tableFilter").addEventListener("keyup", function () {
            const val = this.value.toLowerCase();
            document.querySelectorAll("#ordersTable tbody tr").forEach((row) => {
                row.style.display = row.textContent.toLowerCase().includes(val) ? "" : "none";
            });
        });
    } catch (err) {
        content.innerHTML = `<p style="color:red;">Failed to load open orders</p>`;
        console.error(err);
    }
}
